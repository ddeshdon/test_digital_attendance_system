"""
AWS Lambda Function Deployment Script for Learner Lab
Deploys the digital attendance Lambda function to AWS
"""

import boto3
import zipfile
import os
import json
import sys
from botocore.exceptions import ClientError

def create_deployment_package():
    """Create deployment ZIP package for Lambda"""
    
    print("Creating Lambda deployment package...")
    
    # Files to include in deployment
    files_to_include = [
        'lambda_function.py',  # Main Lambda code
        'requirements.txt'     # Dependencies list
    ]
    
    # Create ZIP file
    zip_filename = 'digital-attendance-lambda.zip'
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files_to_include:
            if os.path.exists(file):
                zipf.write(file)
                print(f"   Added {file}")
            else:
                print(f"   Missing {file}")
                return None
        
        # Add dependencies inline (for simple deployment)
        requirements_content = """
boto3==1.34.0
botocore==1.34.0
"""
        zipf.writestr('requirements_inline.txt', requirements_content)
    
    file_size = os.path.getsize(zip_filename)
    print(f"Package created: {zip_filename} ({file_size:,} bytes)")
    
    return zip_filename

def create_lambda_execution_role():
    """Create IAM role for Lambda function"""
    
    try:
        iam = boto3.client('iam', region_name='us-east-1')
        
        # Check if role exists
        role_name = 'DigitalAttendance-Lambda-Role'
        
        try:
            response = iam.get_role(RoleName=role_name)
            print(f"IAM Role already exists: {role_name}")
            return response['Role']['Arn']
        except ClientError as e:
            if e.response['Error']['Code'] != 'NoSuchEntity':
                raise e
        
        # Create trust policy
        trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "lambda.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }
            ]
        }
        
        # Create execution policy
        execution_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream", 
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem", 
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        "arn:aws:dynamodb:us-east-1:*:table/DigitalAttendance-*",
                        "arn:aws:dynamodb:us-east-1:*:table/DigitalAttendance-*/index/*"
                    ]
                }
            ]
        }
        
        print("Creating IAM role...")
        
        # Create role
        role_response = iam.create_role(
            RoleName=role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='Execution role for Digital Attendance Lambda function'
        )
        
        # Create and attach policy
        policy_name = 'DigitalAttendance-Lambda-Policy'
        iam.put_role_policy(
            RoleName=role_name,
            PolicyName=policy_name,
            PolicyDocument=json.dumps(execution_policy)
        )
        
        role_arn = role_response['Role']['Arn']
        print(f"IAM Role created: {role_arn}")
        
        # Wait for role to propagate
        import time
        print("Waiting for IAM role to propagate...")
        time.sleep(10)
        
        return role_arn
        
    except Exception as e:
        print(f"Failed to create IAM role: {e}")
        return None

def deploy_lambda_function(zip_file, role_arn):
    """Deploy Lambda function to AWS"""
    
    try:
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        
        function_name = 'digital-attendance-backend'
        
        # Read deployment package
        with open(zip_file, 'rb') as f:
            zip_content = f.read()
        
        # Check if function exists
        try:
            response = lambda_client.get_function(FunctionName=function_name)
            print(f"Updating existing function: {function_name}")
            
            # Update function code
            update_response = lambda_client.update_function_code(
                FunctionName=function_name,
                ZipFile=zip_content
            )
            
            # Update function configuration
            lambda_client.update_function_configuration(
                FunctionName=function_name,
                Runtime='python3.9',
                Handler='lambda_function.lambda_handler',
                Timeout=30,
                MemorySize=256,
                Environment={
                    'Variables': {
                        'REGION': 'us-east-1',
                        'ENVIRONMENT': 'development'
                    }
                }
            )
            
            function_arn = update_response['FunctionArn']
            
        except ClientError as e:
            if e.response['Error']['Code'] != 'ResourceNotFoundException':
                raise e
            
            print(f"Creating new function: {function_name}")
            
            # Create new function
            create_response = lambda_client.create_function(
                FunctionName=function_name,
                Runtime='python3.9',
                Role=role_arn,
                Handler='lambda_function.lambda_handler',
                Code={'ZipFile': zip_content},
                Description='Digital Attendance System Backend API',
                Timeout=30,
                MemorySize=256,
                Environment={
                    'Variables': {
                        'REGION': 'us-east-1',
                        'ENVIRONMENT': 'development'
                    }
                },
                Tags={
                    'Project': 'DigitalAttendance',
                    'Environment': 'Development',
                    'CreatedBy': 'LearnerLab'
                }
            )
            
            function_arn = create_response['FunctionArn']
        
        print(f"Lambda function deployed successfully!")
        print(f"Function ARN: {function_arn}")
        
        return function_arn
        
    except Exception as e:
        print(f"Failed to deploy Lambda function: {e}")
        return None

def test_lambda_function(function_name):
    """Test the deployed Lambda function"""
    
    try:
        lambda_client = boto3.client('lambda', region_name='us-east-1')
        
        print("Testing Lambda function...")
        
        # Test event
        test_event = {
            "httpMethod": "GET",
            "path": "/health",
            "headers": {},
            "queryStringParameters": {},
            "body": None
        }
        
        # Invoke function
        response = lambda_client.invoke(
            FunctionName=function_name,
            InvocationType='RequestResponse',
            Payload=json.dumps(test_event)
        )
        
        # Parse response
        payload = json.loads(response['Payload'].read().decode('utf-8'))
        
        if response['StatusCode'] == 200:
            print("Lambda function test successful!")
            print(f"Response: {payload}")
            return True
        else:
            print(f"Lambda function test failed: {payload}")
            return False
            
    except Exception as e:
        print(f"Lambda function test error: {e}")
        return False

def cleanup_deployment_files():
    """Clean up temporary deployment files"""
    
    files_to_cleanup = ['digital-attendance-lambda.zip']
    
    for file in files_to_cleanup:
        try:
            if os.path.exists(file):
                os.remove(file)
                print(f"Cleaned up: {file}")
        except Exception as e:
            print(f"Could not cleanup {file}: {e}")

if __name__ == '__main__':
    print("="*60)
    print("AWS Lambda Deployment for Digital Attendance System")
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
    
    # Check required files
    required_files = ['lambda_function.py', 'requirements.txt']
    missing_files = [f for f in required_files if not os.path.exists(f)]
    
    if missing_files:
        print("Missing required files:")
        for file in missing_files:
            print(f"   - {file}")
        sys.exit(1)
    
    try:
        # Step 1: Create deployment package
        zip_file = create_deployment_package()
        if not zip_file:
            print("Failed to create deployment package")
            sys.exit(1)
        
        # Step 2: Create IAM role
        role_arn = create_lambda_execution_role()
        if not role_arn:
            print("Failed to create IAM role")
            sys.exit(1)
        
        # Step 3: Deploy Lambda function
        function_arn = deploy_lambda_function(zip_file, role_arn)
        if not function_arn:
            print("Failed to deploy Lambda function")
            sys.exit(1)
        
        # Step 4: Test function
        test_success = test_lambda_function('digital-attendance-backend')
        
        # Summary
        print("\n" + "="*60)
        print("DEPLOYMENT SUMMARY")
        print("="*60)
        print(f"Lambda Function: digital-attendance-backend")
        print(f"Function ARN: {function_arn}")
        print(f"IAM Role: {role_arn}")
        print(f"Test Result: {'PASSED' if test_success else 'FAILED'}")
        
        # Next steps
        print("\nNEXT STEPS:")
        print("1. Set up API Gateway: python setup_api_gateway.py")
        print("2. Update frontend API endpoints")
        print("3. Test complete system")
        print("4. Deploy frontend to S3")
        
        # Save configuration
        config = {
            'function_name': 'digital-attendance-backend',
            'function_arn': function_arn,
            'role_arn': role_arn,
            'region': 'us-east-1',
            'test_passed': test_success
        }
        
        with open('lambda-deployment.json', 'w') as f:
            json.dump(config, f, indent=2)
        
        print("Configuration saved to lambda-deployment.json")
        
    except KeyboardInterrupt:
        print("\nDeployment interrupted by user")
    except Exception as e:
        print(f"\nDeployment failed: {e}")
    finally:
        # Cleanup
        cleanup_deployment_files()
        print("\nDeployment process completed")