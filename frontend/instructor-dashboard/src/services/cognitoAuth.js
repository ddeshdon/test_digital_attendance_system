/**
 * AWS Cognito Authentication Service
 * Handles authentication for both instructor and student interfaces
 */

import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails,
  CognitoUserAttribute 
} from 'amazon-cognito-identity-js';

// Use the actual Cognito configuration from setup
let COGNITO_CONFIG = {
  userPoolId: 'us-east-1_nvaJtHDVc',
  webClientId: '3vhmp5qd9m5necfn07r36538sn',
  region: 'us-east-1'
};

// Load config from environment or config file
const loadCognitoConfig = async () => {
  try {
    // Try to load from config file (for development)
    const response = await fetch('/cognito-config.json');
    if (response.ok) {
      const config = await response.json();
      COGNITO_CONFIG = {
        userPoolId: config.userPoolId,
        webClientId: config.webClientId,
        region: config.region
      };
      console.log('Loaded Cognito config:', COGNITO_CONFIG);
      return COGNITO_CONFIG;
    }
  } catch (error) {
    console.warn('Could not load cognito-config.json, using hardcoded values');
  }

  // Override with environment variables if available
  if (process.env.REACT_APP_COGNITO_USER_POOL_ID) {
    COGNITO_CONFIG.userPoolId = process.env.REACT_APP_COGNITO_USER_POOL_ID;
  }
  if (process.env.REACT_APP_COGNITO_CLIENT_ID) {
    COGNITO_CONFIG.webClientId = process.env.REACT_APP_COGNITO_CLIENT_ID;
  }
  if (process.env.REACT_APP_AWS_REGION) {
    COGNITO_CONFIG.region = process.env.REACT_APP_AWS_REGION;
  }
  
  return COGNITO_CONFIG;
};

class CognitoAuthService {
  constructor() {
    this.userPool = null;
    this.currentUser = null;
    this.configLoaded = false;
    this.initializeUserPool();
    // Try to load config asynchronously
    this.loadConfigAsync();
  }

  async loadConfigAsync() {
    try {
      await loadCognitoConfig();
      this.initializeUserPool();
      this.configLoaded = true;
    } catch (error) {
      console.error('Failed to load Cognito config:', error);
    }
  }

  initializeUserPool() {
    const poolData = {
      UserPoolId: COGNITO_CONFIG.userPoolId,
      ClientId: COGNITO_CONFIG.webClientId
    };
    
    console.log('Initializing User Pool with:', poolData);
    this.userPool = new CognitoUserPool(poolData);
    this.currentUser = this.userPool.getCurrentUser();
  }

  /**
   * Sign in with username/email and password
   */
  async signIn(username, password) {
    // Ensure config is loaded
    if (!this.configLoaded) {
      await this.loadConfigAsync();
    }
    
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: username,
        Password: password
      };

      const authenticationDetails = new AuthenticationDetails(authenticationData);

      const userData = {
        Username: username,
        Pool: this.userPool
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          console.log('Authentication successful');
          
          // Get user attributes
          cognitoUser.getUserAttributes((err, attributes) => {
            if (err) {
              console.error('Error getting user attributes:', err);
              resolve({
                success: true,
                user: {
                  username: username,
                  accessToken: result.getAccessToken().getJwtToken(),
                  idToken: result.getIdToken().getJwtToken(),
                  refreshToken: result.getRefreshToken().getToken()
                }
              });
              return;
            }

            // Parse attributes
            const userAttributes = {};
            attributes.forEach(attr => {
              userAttributes[attr.getName()] = attr.getValue();
            });

            resolve({
              success: true,
              user: {
                username: username,
                email: userAttributes.email,
                name: userAttributes.name || userAttributes.given_name,
                role: userAttributes['custom:role'],
                studentId: userAttributes['custom:student_id'],
                department: userAttributes['custom:department'],
                accessToken: result.getAccessToken().getJwtToken(),
                idToken: result.getIdToken().getJwtToken(),
                refreshToken: result.getRefreshToken().getToken()
              }
            });
          });
        },

        onFailure: (err) => {
          console.error('Authentication failed:', err);
          reject({
            success: false,
            error: err.message || 'Authentication failed'
          });
        },

        newPasswordRequired: (userAttributes, requiredAttributes) => {
          console.log('New password required');
          // Handle new password requirement
          reject({
            success: false,
            error: 'New password required',
            newPasswordRequired: true,
            cognitoUser: cognitoUser,
            userAttributes: userAttributes,
            requiredAttributes: requiredAttributes
          });
        }
      });
    });
  }

  /**
   * Sign up new user
   */
  async signUp(username, password, email, attributes = {}) {
    return new Promise((resolve, reject) => {
      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        })
      ];

      // Add custom attributes
      Object.keys(attributes).forEach(key => {
        attributeList.push(new CognitoUserAttribute({
          Name: key,
          Value: attributes[key]
        }));
      });

      this.userPool.signUp(username, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('Sign up failed:', err);
          reject({
            success: false,
            error: err.message || 'Sign up failed'
          });
          return;
        }

        resolve({
          success: true,
          user: result.user,
          userConfirmed: result.userConfirmed
        });
      });
    });
  }

  /**
   * Confirm sign up with verification code
   */
  async confirmSignUp(username, confirmationCode) {
    return new Promise((resolve, reject) => {
      const userData = {
        Username: username,
        Pool: this.userPool
      };

      const cognitoUser = new CognitoUser(userData);

      cognitoUser.confirmRegistration(confirmationCode, true, (err, result) => {
        if (err) {
          console.error('Confirmation failed:', err);
          reject({
            success: false,
            error: err.message || 'Confirmation failed'
          });
          return;
        }

        resolve({
          success: true,
          result: result
        });
      });
    });
  }

  /**
   * Sign out current user
   */
  async signOut() {
    if (this.currentUser) {
      this.currentUser.signOut();
      this.currentUser = null;
    }
    return { success: true };
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser() {
    return new Promise((resolve, reject) => {
      const currentUser = this.userPool.getCurrentUser();

      if (currentUser !== null) {
        currentUser.getSession((err, session) => {
          if (err) {
            console.error('Error getting session:', err);
            reject({
              success: false,
              error: err.message || 'Session error'
            });
            return;
          }

          if (session.isValid()) {
            // Get user attributes
            currentUser.getUserAttributes((err, attributes) => {
              if (err) {
                console.error('Error getting user attributes:', err);
                resolve({
                  success: true,
                  user: {
                    username: currentUser.getUsername(),
                    accessToken: session.getAccessToken().getJwtToken(),
                    idToken: session.getIdToken().getJwtToken()
                  }
                });
                return;
              }

              // Parse attributes
              const userAttributes = {};
              attributes.forEach(attr => {
                userAttributes[attr.getName()] = attr.getValue();
              });

              resolve({
                success: true,
                user: {
                  username: currentUser.getUsername(),
                  email: userAttributes.email,
                  name: userAttributes.name || userAttributes.given_name,
                  role: userAttributes['custom:role'],
                  studentId: userAttributes['custom:student_id'],
                  department: userAttributes['custom:department'],
                  accessToken: session.getAccessToken().getJwtToken(),
                  idToken: session.getIdToken().getJwtToken()
                }
              });
            });
          } else {
            reject({
              success: false,
              error: 'Session invalid'
            });
          }
        });
      } else {
        reject({
          success: false,
          error: 'No current user'
        });
      }
    });
  }

  /**
   * Refresh user session
   */
  async refreshSession() {
    return new Promise((resolve, reject) => {
      const currentUser = this.userPool.getCurrentUser();

      if (currentUser !== null) {
        currentUser.getSession((err, session) => {
          if (err) {
            reject({
              success: false,
              error: err.message || 'Session refresh failed'
            });
            return;
          }

          if (session.isValid()) {
            resolve({
              success: true,
              accessToken: session.getAccessToken().getJwtToken(),
              idToken: session.getIdToken().getJwtToken()
            });
          } else {
            // Try to refresh the session
            const refreshToken = session.getRefreshToken();
            currentUser.refreshSession(refreshToken, (err, session) => {
              if (err) {
                reject({
                  success: false,
                  error: err.message || 'Session refresh failed'
                });
                return;
              }

              resolve({
                success: true,
                accessToken: session.getAccessToken().getJwtToken(),
                idToken: session.getIdToken().getJwtToken()
              });
            });
          }
        });
      } else {
        reject({
          success: false,
          error: 'No current user'
        });
      }
    });
  }

  /**
   * Change user password
   */
  async changePassword(oldPassword, newPassword) {
    return new Promise((resolve, reject) => {
      const currentUser = this.userPool.getCurrentUser();

      if (currentUser !== null) {
        currentUser.getSession((err, session) => {
          if (err) {
            reject({
              success: false,
              error: err.message || 'Session error'
            });
            return;
          }

          currentUser.changePassword(oldPassword, newPassword, (err, result) => {
            if (err) {
              reject({
                success: false,
                error: err.message || 'Password change failed'
              });
              return;
            }

            resolve({
              success: true,
              result: result
            });
          });
        });
      } else {
        reject({
          success: false,
          error: 'No current user'
        });
      }
    });
  }

  /**
   * Update configuration (useful for dynamic config loading)
   */
  updateConfig(config) {
    COGNITO_CONFIG = { ...COGNITO_CONFIG, ...config };
    this.initializeUserPool();
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return COGNITO_CONFIG;
  }
}

// Create singleton instance
const cognitoAuth = new CognitoAuthService();

export default cognitoAuth;
export { CognitoAuthService };