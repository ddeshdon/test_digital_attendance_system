# AWS Learner Lab Setup Guide for Digital Attendance System

## AWS Learner Lab Deployment Strategy

### Important AWS Learner Lab Limitations:
- **Free AWS credits** for learning
- **Most AWS services** available (Lambda, DynamoDB, API Gateway, S3)
- **No IAM user creation** (uses lab credentials)
- **Session time limits** (usually 4 hours)
- **No persistent credentials** between sessions

## Step-by-Step AWS Setup

### Phase 1: AWS Learner Lab Access Setup

#### 1.1 Your Friend's Tasks (In AWS Learner Lab):

```bash
# 1. Start AWS Learner Lab session
# 2. Get temporary AWS credentials from lab
# 3. Configure AWS CLI with lab credentials

# Get credentials from AWS Learner Lab (usually in format):
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
export AWS_DEFAULT_REGION="us-east-1"

# Or create credentials file:
# ~/.aws/credentials
[default]
aws_access_key_id = ASIA...
aws_secret_access_key = ...
aws_session_token = ...
region = us-east-1
```

#### 1.2 Verify AWS CLI Access:
```bash
# Test AWS CLI access
aws sts get-caller-identity
aws dynamodb list-tables
aws lambda list-functions
```

### Phase 2: DynamoDB Setup

#### 2.1 Create DynamoDB Tables:
```bash
# Navigate to Lambda directory
cd backend/lambda-test

# Create DynamoDB tables (modify for AWS instead of local)
python create_tables_aws.py
```

#### 2.2 DynamoDB Table Creation Script:
```python
# create_tables_aws.py (modified for AWS)
import boto3
from botocore.exceptions import ClientError

def create_aws_dynamodb_tables():
    # Use AWS credentials from Learner Lab
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    
    tables_created = []
    tables_failed = []
    
    # 1. Create Users Table
    try:
        users_table = dynamodb.create_table(
            TableName='DigitalAttendance-Users',
            KeySchema=[
                {'AttributeName': 'student_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'student_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST',
            Tags=[
                {'Key': 'Project', 'Value': 'DigitalAttendance'},
                {'Key': 'Environment', 'Value': 'Development'}
            ]
        )
        print("Users table created successfully")
        tables_created.append('DigitalAttendance-Users')
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Users table already exists")
        else:
            print(f"Failed to create Users table: {e}")
            tables_failed.append('Users')
    
    # 2. Create Sessions Table
    try:
        sessions_table = dynamodb.create_table(
            TableName='DigitalAttendance-Sessions',
            KeySchema=[
                {'AttributeName': 'session_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'session_id', 'AttributeType': 'S'},
                {'AttributeName': 'beacon_uuid', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'beacon_uuid-index',
                    'KeySchema': [
                        {'AttributeName': 'beacon_uuid', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST',
            Tags=[
                {'Key': 'Project', 'Value': 'DigitalAttendance'},
                {'Key': 'Environment', 'Value': 'Development'}
            ]
        )
        print("Sessions table created successfully")
        tables_created.append('DigitalAttendance-Sessions')
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("Sessions table already exists")
        else:
            print(f"Failed to create Sessions table: {e}")
            tables_failed.append('Sessions')
    
    # 3. Create AttendanceRecords Table
    try:
        attendance_table = dynamodb.create_table(
            TableName='DigitalAttendance-AttendanceRecords',
            KeySchema=[
                {'AttributeName': 'student_id', 'KeyType': 'HASH'},
                {'AttributeName': 'session_id', 'KeyType': 'RANGE'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'student_id', 'AttributeType': 'S'},
                {'AttributeName': 'session_id', 'AttributeType': 'S'}
            ],
            GlobalSecondaryIndexes=[
                {
                    'IndexName': 'session_id-index',
                    'KeySchema': [
                        {'AttributeName': 'session_id', 'KeyType': 'HASH'}
                    ],
                    'Projection': {'ProjectionType': 'ALL'}
                }
            ],
            BillingMode='PAY_PER_REQUEST',
            Tags=[
                {'Key': 'Project', 'Value': 'DigitalAttendance'},
                {'Key': 'Environment', 'Value': 'Development'}
            ]
        )
        print("AttendanceRecords table created successfully")
        tables_created.append('DigitalAttendance-AttendanceRecords')
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceInUseException':
            print("AttendanceRecords table already exists")
        else:
            print(f"Failed to create AttendanceRecords table: {e}")
            tables_failed.append('AttendanceRecords')
    
    return tables_created, tables_failed

if __name__ == '__main__':
    print("Creating DynamoDB tables in AWS...")
    created, failed = create_aws_dynamodb_tables()
    
    print(f"\nSummary:")
    print(f"Created: {len(created)} tables")
    print(f"Failed: {len(failed)} tables")
    
    if len(failed) == 0:
        print("\nAll tables created successfully!")
    else:
        print(f"\nSome tables failed: {failed}")
```

### Phase 3: Lambda Function Deployment

#### 3.1 Create Lambda Deployment Package:
```bash
# Create deployment package
mkdir lambda-deployment
cp lambda_function.py lambda-deployment/
cd lambda-deployment

# Install dependencies in deployment folder
pip install boto3 -t .

# Create deployment zip
powershell Compress-Archive -Path * -DestinationPath ../digital-attendance-lambda.zip
cd ..
```

#### 3.2 Deploy Lambda Function:
```bash
# Create Lambda function
aws lambda create-function \
    --function-name digital-attendance-backend \
    --runtime python3.11 \
    --role arn:aws:iam::ACCOUNT-ID:role/LabRole \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://digital-attendance-lambda.zip \
    --timeout 30 \
    --memory-size 256 \
    --environment Variables='{
        "USERS_TABLE":"DigitalAttendance-Users",
        "SESSIONS_TABLE":"DigitalAttendance-Sessions",
        "ATTENDANCE_TABLE":"DigitalAttendance-AttendanceRecords",
        "AWS_REGION":"us-east-1"
    }' \
    --tags Project=DigitalAttendance,Environment=Development
```

### Phase 4: API Gateway Setup

#### 4.1 Create REST API:
```bash
# Create REST API
aws apigateway create-rest-api \
    --name digital-attendance-api \
    --description "Digital Attendance System API" \
    --endpoint-configuration types=REGIONAL
```

#### 4.2 API Gateway Configuration Script:
```python
# setup_api_gateway.py
import boto3
import json

def setup_api_gateway():
    apigateway = boto3.client('apigateway', region_name='us-east-1')
    lambda_client = boto3.client('lambda', region_name='us-east-1')
    
    # Get Lambda function ARN
    lambda_response = lambda_client.get_function(FunctionName='digital-attendance-backend')
    lambda_arn = lambda_response['Configuration']['FunctionArn']
    
    # Create API
    api_response = apigateway.create_rest_api(
        name='digital-attendance-api',
        description='Digital Attendance System API'
    )
    api_id = api_response['id']
    
    # Get root resource
    resources = apigateway.get_resources(restApiId=api_id)
    root_id = resources['items'][0]['id']
    
    # Create resources and methods
    endpoints = [
        ('sessions', 'POST'),
        ('sessions', 'GET'),
        ('attendance', 'POST'),
        ('attendance', 'GET'),
        ('beacon', 'POST')
    ]
    
    for resource_name, method in endpoints:
        # Create resource
        resource_response = apigateway.create_resource(
            restApiId=api_id,
            parentId=root_id,
            pathPart=resource_name
        )
        resource_id = resource_response['id']
        
        # Create method
        apigateway.put_method(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod=method,
            authorizationType='NONE'
        )
        
        # Integrate with Lambda
        apigateway.put_integration(
            restApiId=api_id,
            resourceId=resource_id,
            httpMethod=method,
            type='AWS_PROXY',
            integrationHttpMethod='POST',
            uri=f'arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/{lambda_arn}/invocations'
        )
    
    # Deploy API
    deployment = apigateway.create_deployment(
        restApiId=api_id,
        stageName='dev'
    )
    
    api_url = f"https://{api_id}.execute-api.us-east-1.amazonaws.com/dev"
    print(f"🎉 API Gateway deployed at: {api_url}")
    
    return api_id, api_url

if __name__ == '__main__':
    api_id, url = setup_api_gateway()
    print(f"API ID: {api_id}")
    print(f"API URL: {url}")
```

### Phase 5: Frontend Deployment (S3 + CloudFront)

#### 5.1 Create S3 Bucket:
```bash
# Create S3 bucket for instructor dashboard
aws s3 mb s3://digital-attendance-instructor-$(date +%s) --region us-east-1

# Build and deploy React app
cd frontend/instructor-dashboard
npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Enable static website hosting
aws s3 website s3://your-bucket-name \
    --index-document index.html \
    --error-document index.html
```

### Phase 6: Testing and Validation

#### 6.1 End-to-End Testing:
```bash
# Test Lambda function directly
aws lambda invoke \
    --function-name digital-attendance-backend \
    --payload '{"action": "createUser", "body": {"student_id": "test123", "name": "Test User", "role": "student"}}' \
    response.json

# Test API Gateway
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/sessions \
    -H "Content-Type: application/json" \
    -d '{"teacher_id": "instructor123", "class_id": "DES424", "beacon_uuid": "test-uuid"}'
```

## AWS Learner Lab Specific Considerations

### 1. Session Management:
```bash
# AWS Learner Lab sessions expire (usually 4 hours)
# Your friend needs to:
# - Save work frequently
# - Document all resource IDs and URLs
# - Be prepared to restart services when session expires
```

### 2. Cost Optimization:
```bash
# Use PAY_PER_REQUEST for DynamoDB (no fixed costs)
# Use minimal Lambda memory (256MB)
# Use Regional API Gateway (cheaper than Edge)
# Delete unused resources to conserve credits
```

### 3. Backup Strategy:
```bash
# Export DynamoDB data before session expires
aws dynamodb scan --table-name DigitalAttendance-Users > users-backup.json
aws dynamodb scan --table-name DigitalAttendance-Sessions > sessions-backup.json
aws dynamodb scan --table-name DigitalAttendance-AttendanceRecords > attendance-backup.json

# Save all configuration and resource IDs
echo "API_GATEWAY_ID: your-api-id" > aws-resources.txt
echo "API_URL: https://your-api-id.execute-api.us-east-1.amazonaws.com/dev" >> aws-resources.txt
echo "S3_BUCKET: your-bucket-name" >> aws-resources.txt
```

## Deployment Checklist for Your Friend

### Week 1: Infrastructure Setup
- [ ] Start AWS Learner Lab session
- [ ] Configure AWS CLI with lab credentials
- [ ] Create DynamoDB tables
- [ ] Test DynamoDB access
- [ ] Create Lambda deployment package

### Week 2: Lambda and API Gateway
- [ ] Deploy Lambda function
- [ ] Test Lambda function with sample events
- [ ] Create API Gateway
- [ ] Configure API Gateway endpoints
- [ ] Test API Gateway with curl/Postman
- [ ] Enable CORS for frontend access

### Week 3: Frontend Integration
- [ ] Update frontend API URLs
- [ ] Create S3 bucket for instructor dashboard
- [ ] Deploy React app to S3
- [ ] Test end-to-end functionality
- [ ] Deploy mobile app via Expo

## 🔗 Integration Points

After AWS deployment, you'll update:

```javascript
// frontend/instructor-dashboard/src/services/api.js
const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';
```

```javascript
// frontend/student-app/src/services/api.js
const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/dev';
```

## 💡 Pro Tips for AWS Learner Lab

1. **Work in focused sessions** - Plan what to accomplish in each 4-hour session
2. **Document everything** - Save all resource IDs and configurations
3. **Test incrementally** - Don't wait until the end to test
4. **Use CloudFormation** - Consider infrastructure as code for repeatability
5. **Monitor costs** - Keep track of AWS credit usage

Would you like me to create the specific deployment scripts for your friend to use in AWS Learner Lab?