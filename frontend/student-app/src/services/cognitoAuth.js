/**
 * Cognito Authentication Service for React Native Student App
 */

import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails 
} from 'amazon-cognito-identity-js';

// Cognito Configuration
const COGNITO_CONFIG = {
  userPoolId: 'us-east-1_nvaJtHDVc',
  webClientId: '3vhmp5qd9m5necfn07r36538sn',
  mobileClientId: '6662k02feufhmo08ue2e141jjk',
  region: 'us-east-1'
};

class CognitoAuthService {
  constructor() {
    this.userPool = null;
    this.currentUser = null;
    this.initializeUserPool();
  }

  initializeUserPool() {
    const poolData = {
      UserPoolId: COGNITO_CONFIG.userPoolId,
      ClientId: COGNITO_CONFIG.webClientId
    };
    
    this.userPool = new CognitoUserPool(poolData);
    this.currentUser = this.userPool.getCurrentUser();
  }

  /**
   * Sign in with email and password
   */
  async signIn(email, password) {
    return new Promise((resolve, reject) => {
      const authenticationData = {
        Username: email,
        Password: password
      };

      const authenticationDetails = new AuthenticationDetails(authenticationData);

      const userData = {
        Username: email,
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
                  username: email,
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
                username: email,
                email: userAttributes.email,
                name: userAttributes.name || userAttributes.given_name,
                role: userAttributes['custom:role'] || 'student',
                studentId: userAttributes['custom:student_id'] || email.split('@')[0],
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
        }
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
                  role: userAttributes['custom:role'] || 'student',
                  studentId: userAttributes['custom:student_id'] || currentUser.getUsername().split('@')[0],
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
}

// Create singleton instance
const cognitoAuth = new CognitoAuthService();

export default cognitoAuth;