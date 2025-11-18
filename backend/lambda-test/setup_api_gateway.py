"""
AWS API Gateway Setup Script for Learner Lab
Creates REST API to connect frontend to Lambda backend
"""

import boto3
import json
import sys
import time
from botocore.exceptions import ClientError

def load_lambda_config():
    """Load Lambda deployment configuration"""
    
    try:
        with open('lambda-deployment.json', 'r') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print("Lambda deployment config not found!")
        print("Run 'python deploy_lambda.py' first")
        return None
    except Exception as e:
        print(f"Error loading Lambda config: {e}")
        return None

def create_api_gateway(lambda_function_arn):
    """Create API Gateway REST API"""
    
    try:
        apigateway = boto3.client('apigateway', region_name='us-east-1')
        
        api_name = 'digital-attendance-api'
        
        # Check if API already exists
        apis = apigateway.get_rest_apis()
        existing_api = None
        
        for api in apis['items']:
            if api['name'] == api_name:
                existing_api = api
                break
        
        if existing_api:
            print(f"Using existing API: {api_name}")
            api_id = existing_api['id']
        else:
            print(f"Creating new API: {api_name}")
            
            # Create REST API
            create_response = apigateway.create_rest_api(
                name=api_name,
                description='Digital Attendance System API',
                endpointConfiguration={'types': ['REGIONAL']},
                tags={
                    'Project': 'DigitalAttendance',
                    'Environment': 'Development',
                    'CreatedBy': 'LearnerLab'
                }
            )
            
            api_id = create_response['id']
        
        print(f"API Gateway ID: {api_id}")
        return api_id
        
    except Exception as e:
        print(f"Failed to create API Gateway: {e}")
        return None

def setup_api_resources_and_methods(api_id, lambda_function_arn):
    """Set up API resources and methods"""
    
    try:
        apigateway = boto3.client('apigateway', region_name='us-east-1')
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        
        # Get root resource
        resources = apigateway.get_resources(restApiId=api_id)
        root_resource_id = None
        
        for resource in resources['items']:
            if resource['path'] == '/':
                root_resource_id = resource['id']
                break
        
        if not root_resource_id:
            print("Could not find root resource")
            return False
        
        print("Setting up API resources and methods...")
        
        # API endpoints to create
        endpoints = [
            {'path': 'health', 'methods': ['GET']},
            {'path': 'users', 'methods': ['POST', 'GET']},
            {'path': 'sessions', 'methods': ['POST', 'GET']},
            {'path': 'attendance', 'methods': ['POST', 'GET']},
            {'path': 'beacon-validate', 'methods': ['POST']}
        ]
        
        created_resources = {}
        
        for endpoint in endpoints:
            path = endpoint['path']
            methods = endpoint['methods']
            
            # Create resource if it doesn't exist
            resource_id = None
            for resource in resources['items']:
                if resource.get('pathPart') == path:
                    resource_id = resource['id']
                    break
            
            if not resource_id:
                print(f"   Creating resource: /{path}")
                resource_response = apigateway.create_resource(
                    restApiId=api_id,
                    parentId=root_resource_id,
                    pathPart=path
                )
                resource_id = resource_response['id']
            else:
                print(f"   Resource exists: /{path}")
            
            created_resources[path] = resource_id
            
            # Create methods for this resource
            for method in methods:
                try:
                    # Check if method exists
                    apigateway.get_method(
                        restApiId=api_id,
                        resourceId=resource_id,
                        httpMethod=method
                    )
                    print(f"   Method exists: {method} /{path}")
                    
                except ClientError as e:
                    if e.response['Error']['Code'] == 'NotFoundException':
                        print(f"   Creating method: {method} /{path}")
                        
                        # Create method
                        apigateway.put_method(
                            restApiId=api_id,
                            resourceId=resource_id,
                            httpMethod=method,
                            authorizationType='NONE',
                            requestParameters={}
                        )
                        
                        # Create integration
                        integration_uri = f"arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{lambda_function_arn}/invocations"
                        
                        apigateway.put_integration(
                            restApiId=api_id,
                            resourceId=resource_id,
                            httpMethod=method,
                            type='AWS_PROXY',
                            integrationHttpMethod='POST',
                            uri=integration_uri
                        )
                        
                        # Method response
                        apigateway.put_method_response(
                            restApiId=api_id,
                            resourceId=resource_id,
                            httpMethod=method,
                            statusCode='200',
                            responseParameters={
                                'method.response.header.Access-Control-Allow-Origin': False,
                                'method.response.header.Access-Control-Allow-Headers': False,
                                'method.response.header.Access-Control-Allow-Methods': False
                            }
                        )
                        
                        # Integration response
                        apigateway.put_integration_response(
                            restApiId=api_id,
                            resourceId=resource_id,
                            httpMethod=method,
                            statusCode='200',
                            responseParameters={
                                'method.response.header.Access-Control-Allow-Origin': "'*'",
                                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
                            }
                        )
                    else:
                        print(f"   Error checking method {method} /{path}: {e}")
                
                # Add CORS OPTIONS method
                if method != 'OPTIONS':
                    try:
                        apigateway.get_method(
                            restApiId=api_id,
                            resourceId=resource_id,
                            httpMethod='OPTIONS'
                        )
                    except ClientError as e:
                        if e.response['Error']['Code'] == 'NotFoundException':
                            print(f"   Adding CORS OPTIONS for /{path}")
                            
                            # OPTIONS method for CORS
                            apigateway.put_method(
                                restApiId=api_id,
                                resourceId=resource_id,
                                httpMethod='OPTIONS',
                                authorizationType='NONE'
                            )
                            
                            # Mock integration for OPTIONS
                            apigateway.put_integration(
                                restApiId=api_id,
                                resourceId=resource_id,
                                httpMethod='OPTIONS',
                                type='MOCK',
                                requestTemplates={'application/json': '{"statusCode": 200}'}
                            )
                            
                            # OPTIONS method response
                            apigateway.put_method_response(
                                restApiId=api_id,
                                resourceId=resource_id,
                                httpMethod='OPTIONS',
                                statusCode='200',
                                responseParameters={
                                    'method.response.header.Access-Control-Allow-Origin': False,
                                    'method.response.header.Access-Control-Allow-Headers': False,
                                    'method.response.header.Access-Control-Allow-Methods': False
                                }
                            )
                            
                            # OPTIONS integration response
                            apigateway.put_integration_response(
                                restApiId=api_id,
                                resourceId=resource_id,
                                httpMethod='OPTIONS',
                                statusCode='200',
                                responseParameters={
                                    'method.response.header.Access-Control-Allow-Origin': "'*'",
                                    'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                                    'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'"
                                }
                            )
        
        # Grant Lambda permission to API Gateway
        print("Setting up Lambda permissions...")
        
        account_id = boto3.client('sts').get_caller_identity()['Account']
        source_arn = f"arn:aws:execute-api:us-east-1:{account_id}:{api_id}/*/*"
        
        try:
            lambda_client.add_permission(
                FunctionName=lambda_function_arn.split(':')[-1],  # Function name from ARN
                StatementId='api-gateway-invoke-permission',
                Action='lambda:InvokeFunction',
                Principal='apigateway.amazonaws.com',
                SourceArn=source_arn
            )
            print("Lambda permissions granted")
        except ClientError as e:
            if 'ResourceConflictException' in str(e):
                print("Lambda permissions already exist")
            else:
                print(f"Lambda permission error: {e}")
        
        return True
        
    except Exception as e:
        print(f"Failed to setup API resources: {e}")
        return False

def deploy_api(api_id):
    """Deploy the API to a stage"""
    
    try:
        apigateway = boto3.client('apigateway', region_name='us-east-1')
        
        stage_name = 'dev'
        
        print(f"Deploying API to stage: {stage_name}")
        
        # Create deployment
        deployment_response = apigateway.create_deployment(
            restApiId=api_id,
            stageName=stage_name,
            description='Development deployment for Digital Attendance API'
        )
        
        deployment_id = deployment_response['id']
        
        # Get API endpoint URL
        api_url = f"https://{api_id}.execute-api.us-east-1.amazonaws.com/{stage_name}"
        
        print(f"API deployed successfully!")
        print(f"API Endpoint: {api_url}")
        
        return api_url, deployment_id
        
    except Exception as e:
        print(f"Failed to deploy API: {e}")
        return None, None

def test_api_endpoint(api_url):
    """Test the deployed API endpoint"""
    
    try:
        import requests
        
        print("Testing API endpoint...")
        
        # Test health endpoint
        health_url = f"{api_url}/health"
        
        response = requests.get(health_url, timeout=10)
        
        if response.status_code == 200:
            print("API health check successful!")
            print(f"Response: {response.json()}")
            return True
        else:
            print(f"API health check failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except ImportError:
        print("Cannot test API: requests library not installed")
        print("Install with: pip install requests")
        return None
    except Exception as e:
        print(f"API test error: {e}")
        return False

def update_frontend_config(api_url):
    """Generate frontend configuration update"""
    
    frontend_config = {
        "API_BASE_URL": api_url,
        "API_ENDPOINTS": {
            "health": f"{api_url}/health",
            "createUser": f"{api_url}/users",
            "getUser": f"{api_url}/users",
            "createSession": f"{api_url}/sessions",
            "getSessions": f"{api_url}/sessions",
            "markAttendance": f"{api_url}/attendance",
            "getAttendance": f"{api_url}/attendance",
            "validateBeacon": f"{api_url}/beacon-validate"
        }
    }
    
    # Save configuration
    with open('frontend-api-config.json', 'w') as f:
        json.dump(frontend_config, f, indent=2)
    
    print("Frontend configuration saved to frontend-api-config.json")
    
    # Generate update instructions
    update_instructions = f"""
# Frontend API Configuration Update

## For Instructor Dashboard (React):
Update `frontend/instructor-dashboard/src/services/api.js`:

```javascript
const API_BASE_URL = '{api_url}';

// Replace existing API calls with:
export const api = {{
  health: () => fetch(`${{API_BASE_URL}}/health`),
  createUser: (userData) => fetch(`${{API_BASE_URL}}/users`, {{
    method: 'POST',
    headers: {{ 'Content-Type': 'application/json' }},
    body: JSON.stringify(userData)
  }}),
  // ... other endpoints
}};
```

## For Student App (React Native):
Update `frontend/student-app/src/services/api.js`:

```javascript
const API_BASE_URL = '{api_url}';
// Same pattern as above
```

## Test URLs:
- Health Check: {api_url}/health
- Create User: {api_url}/users (POST)
- Create Session: {api_url}/sessions (POST)
- Mark Attendance: {api_url}/attendance (POST)
"""
    
    with open('FRONTEND_UPDATE_INSTRUCTIONS.md', 'w') as f:
        f.write(update_instructions)
    print("Frontend update instructions saved to FRONTEND_UPDATE_INSTRUCTIONS.md")

if __name__ == '__main__':
    print("="*60)
    print("AWS API Gateway Setup for Digital Attendance System")
    print("="*60)
    
    # Check AWS connection
    try:
        sts = boto3.client('sts', region_name='us-east-1')
        identity = sts.get_caller_identity()
        print(f"AWS Account: {identity.get('Account', 'Unknown')}")
        print(f"AWS User: {identity.get('Arn', 'Unknown')}")
        print(f"AWS Region: us-east-1")
    except Exception as e:
        print("Cannot connect to AWS!")
        print("Make sure AWS Learner Lab is started and configured")
        print(f"Error: {e}")
        sys.exit(1)
    
    # Load Lambda configuration
    lambda_config = load_lambda_config()
    if not lambda_config:
        sys.exit(1)
    
    lambda_function_arn = lambda_config['function_arn']
    print(f"Using Lambda function: {lambda_function_arn}")
    
    try:
        # Step 1: Create API Gateway
        api_id = create_api_gateway(lambda_function_arn)
        if not api_id:
            print("Failed to create API Gateway")
            sys.exit(1)
        
        # Step 2: Setup resources and methods
        if not setup_api_resources_and_methods(api_id, lambda_function_arn):
            print("Failed to setup API resources")
            sys.exit(1)
        
        # Step 3: Deploy API
        api_url, deployment_id = deploy_api(api_id)
        if not api_url:
            print("Failed to deploy API")
            sys.exit(1)
        
        # Step 4: Test API
        test_result = test_api_endpoint(api_url)
        
        # Step 5: Generate frontend configuration
        update_frontend_config(api_url)
        
        # Summary
        print("\n" + "="*60)
        print("API GATEWAY DEPLOYMENT SUMMARY")
        print("="*60)
        print(f"API Gateway ID: {api_id}")
        print(f"API Endpoint: {api_url}")
        print(f"Deployment ID: {deployment_id}")
        print(f"Health Check: {'PASSED' if test_result else 'FAILED' if test_result is False else 'SKIPPED'}")
        
        # Next steps
        print("\nNEXT STEPS:")
        print("1. Update frontend API configuration (see FRONTEND_UPDATE_INSTRUCTIONS.md)")
        print("2. Test all API endpoints")
        print("3. Deploy frontend to S3")
        print("4. Test complete system end-to-end")
        
        # Save complete configuration
        complete_config = {
            'api_gateway_id': api_id,
            'api_endpoint': api_url,
            'deployment_id': deployment_id,
            'lambda_function_arn': lambda_function_arn,
            'region': 'us-east-1',
            'stage': 'dev',
            'test_passed': test_result
        }
        
        with open('api-gateway-config.json', 'w') as f:
            json.dump(complete_config, f, indent=2)
        
        print("Configuration saved to api-gateway-config.json")
        
    except KeyboardInterrupt:
        print("\nSetup interrupted by user")
    except Exception as e:
        print(f"\nSetup failed: {e}")
    
    print("\nAPI Gateway setup completed")