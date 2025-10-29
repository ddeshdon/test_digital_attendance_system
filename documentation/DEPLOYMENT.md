# AWS Deployment Guide - Digital Attendance System

## 🎯 Overview

This guide covers deploying the Digital Attendance System on AWS Academy Learner Lab using serverless architecture.

## 🏗️ AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    AWS CLOUD INFRASTRUCTURE                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📱 FRONTEND LAYER                                          │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │   S3 + CloudFront│    │     Student Mobile App       │  │
│  │  (Web Dashboard) │    │   (Expo/React Native)        │  │
│  └──────────────────┘    └──────────────────────────────┘  │
│            │                           │                   │
│            └───────────────┬───────────┘                   │
│                           │                               │
│  🌐 API LAYER             │                               │
│  ┌─────────────────────────▼─────────────────────────┐    │
│  │              API Gateway                          │    │
│  │        /api/session/*   /api/attendance/*         │    │
│  └─────────────────────────┬─────────────────────────┘    │
│                           │                               │
│  ⚡ COMPUTE LAYER          │                               │
│  ┌─────────────────────────▼─────────────────────────┐    │
│  │                 Lambda Functions                  │    │
│  │  session_handler   attendance_handler   beacon_*  │    │
│  └─────────────────────────┬─────────────────────────┘    │
│                           │                               │
│  🗄️ DATA LAYER            │                               │
│  ┌─────────────────────────▼─────────────────────────┐    │
│  │                   DynamoDB                        │    │
│  │  Sessions | AttendanceRecords | Students          │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

### AWS Academy Learner Lab Setup
1. **Access AWS Academy Learner Lab**
   - Log into your AWS Academy course
   - Start the Learner Lab session
   - Click "AWS" to access AWS Console

2. **Verify Available Services**
   ```bash
   # Check available services in Learner Lab:
   # ✅ Lambda (Serverless compute)
   # ✅ API Gateway (REST API endpoints) 
   # ✅ DynamoDB (NoSQL database)
   # ✅ S3 (Static file hosting)
   # ✅ CloudFormation (Infrastructure as Code)
   # ✅ IAM (Identity and Access Management)
   ```

3. **Install AWS CLI**
   ```bash
   # Download and install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure with Learner Lab credentials
   aws configure
   ```

## 🚀 Step-by-Step Deployment

### Step 1: Create DynamoDB Tables

#### 1.1 Sessions Table
```bash
aws dynamodb create-table \
    --table-name attendance_sessions \
    --attribute-definitions \
        AttributeName=session_id,AttributeType=S \
        AttributeName=beacon_uuid,AttributeType=S \
    --key-schema \
        AttributeName=session_id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=beacon_uuid-index,KeySchema=[{AttributeName=beacon_uuid,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

#### 1.2 Attendance Records Table
```bash
aws dynamodb create-table \
    --table-name attendance_records \
    --attribute-definitions \
        AttributeName=attendance_id,AttributeType=S \
        AttributeName=session_id,AttributeType=S \
        AttributeName=student_id,AttributeType=S \
    --key-schema \
        AttributeName=attendance_id,KeyType=HASH \
    --global-secondary-indexes \
        IndexName=session_id-index,KeySchema=[{AttributeName=session_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
        IndexName=student_id-index,KeySchema=[{AttributeName=student_id,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

#### 1.3 Students Table
```bash
aws dynamodb create-table \
    --table-name students \
    --attribute-definitions \
        AttributeName=student_id,AttributeType=S \
    --key-schema \
        AttributeName=student_id,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1
```

### Step 2: Create Lambda Functions

#### 2.1 Lambda Deployment Package
```bash
# Create deployment package
cd backend
zip -r attendance-api.zip . -x "*.pyc" "__pycache__/*" "*.git*"
```

#### 2.2 Create IAM Role for Lambda
```bash
# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create IAM role
aws iam create-role \
    --role-name AttendanceLambdaRole \
    --assume-role-policy-document file://trust-policy.json

# Attach policies
aws iam attach-role-policy \
    --role-name AttendanceLambdaRole \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
    --role-name AttendanceLambdaRole \
    --policy-arn arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess
```

#### 2.3 Create Lambda Function
```bash
# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name AttendanceLambdaRole --query 'Role.Arn' --output text)

# Create Lambda function
aws lambda create-function \
    --function-name attendance-api \
    --runtime python3.9 \
    --role $ROLE_ARN \
    --handler lambda_function.lambda_handler \
    --zip-file fileb://attendance-api.zip \
    --timeout 30 \
    --memory-size 512 \
    --environment Variables='{
        DYNAMODB_SESSIONS_TABLE=attendance_sessions,
        DYNAMODB_ATTENDANCE_TABLE=attendance_records,
        DYNAMODB_STUDENTS_TABLE=students
    }'
```

#### 2.4 Lambda Function Code for AWS
Create `backend/lambda_function.py`:
```python
import json
import boto3
from datetime import datetime, timedelta
import uuid
import os

# Initialize DynamoDB
dynamodb = boto3.resource('dynamodb')
sessions_table = dynamodb.Table(os.environ['DYNAMODB_SESSIONS_TABLE'])
attendance_table = dynamodb.Table(os.environ['DYNAMODB_ATTENDANCE_TABLE'])
students_table = dynamodb.Table(os.environ['DYNAMODB_STUDENTS_TABLE'])

def lambda_handler(event, context):
    """Main Lambda handler for all API endpoints"""
    
    # Enable CORS
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT'
    }
    
    # Handle preflight requests
    if event['httpMethod'] == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': headers,
            'body': ''
        }
    
    try:
        # Route requests based on path
        path = event['path']
        method = event['httpMethod']
        
        if path == '/api/session/start' and method == 'POST':
            return handle_start_session(event, headers)
        elif path.startswith('/api/session/end/') and method == 'PUT':
            session_id = path.split('/')[-1]
            return handle_end_session(session_id, headers)
        elif path == '/api/attendance/checkin' and method == 'POST':
            return handle_checkin(event, headers)
        elif path.startswith('/api/attendance/list/') and method == 'GET':
            session_id = path.split('/')[-1]
            return handle_get_attendance(session_id, headers)
        elif path == '/api/beacon/validate' and method == 'POST':
            return handle_validate_beacon(event, headers)
        else:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'success': False, 'message': 'Endpoint not found'})
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': str(e)})
        }

def handle_start_session(event, headers):
    """Handle session creation"""
    data = json.loads(event['body'])
    
    # Validate required fields
    required_fields = ['session_id', 'class_id', 'room_id', 'beacon_uuid']
    for field in required_fields:
        if field not in data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'success': False, 'message': f'Missing field: {field}'})
            }
    
    # Create session record
    now = datetime.now().isoformat()
    duration_minutes = data.get('attendance_window_minutes', 5)
    end_time = (datetime.now() + timedelta(minutes=duration_minutes)).isoformat()
    
    session_item = {
        'session_id': data['session_id'],
        'class_id': data['class_id'],
        'room_id': data['room_id'],
        'beacon_uuid': data['beacon_uuid'],
        'instructor_id': data.get('instructor_id', 'unknown'),
        'start_time': now,
        'end_time': end_time,
        'status': 'open',
        'created_at': now
    }
    
    # Save to DynamoDB
    sessions_table.put_item(Item=session_item)
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': 'Session created successfully',
            'session': session_item
        })
    }

def handle_checkin(event, headers):
    """Handle student check-in"""
    data = json.loads(event['body'])
    
    student_id = data.get('student_id')
    beacon_uuid = data.get('beacon_uuid')
    
    if not student_id or not beacon_uuid:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': 'Missing student_id or beacon_uuid'})
        }
    
    # Find session by beacon UUID
    response = sessions_table.scan(
        FilterExpression='beacon_uuid = :uuid AND #status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':uuid': beacon_uuid, ':status': 'open'}
    )
    
    if not response['Items']:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': 'No active session found for this beacon'})
        }
    
    session = response['Items'][0]
    
    # Check if session is still active
    now = datetime.now()
    end_time = datetime.fromisoformat(session['end_time'])
    
    if now > end_time:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': 'Session has expired'})
        }
    
    # Check for duplicate check-in
    response = attendance_table.scan(
        FilterExpression='student_id = :sid AND session_id = :sesid',
        ExpressionAttributeValues={':sid': student_id, ':sesid': session['session_id']}
    )
    
    if response['Items']:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': 'You have already checked in for this session'})
        }
    
    # Create attendance record
    attendance_item = {
        'attendance_id': str(uuid.uuid4()),
        'student_id': student_id,
        'session_id': session['session_id'],
        'timestamp': datetime.now().isoformat(),
        'status': 'present',
        'check_in_method': 'beacon_scan',
        'beacon_data': {
            'beacon_uuid': beacon_uuid,
            'timestamp': datetime.now().isoformat()
        }
    }
    
    # Save to DynamoDB
    attendance_table.put_item(Item=attendance_item)
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'message': 'Attendance marked successfully',
            'session': {
                'class_id': session['class_id'],
                'room_id': session['room_id']
            },
            'student': {
                'student_id': student_id,
                'name': f'Student {student_id}'
            },
            'timestamp': attendance_item['timestamp']
        })
    }

def handle_get_attendance(session_id, headers):
    """Get attendance list for session"""
    # Get session
    try:
        session_response = sessions_table.get_item(Key={'session_id': session_id})
        if 'Item' not in session_response:
            return {
                'statusCode': 404,
                'headers': headers,
                'body': json.dumps({'success': False, 'message': 'Session not found'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': str(e)})
        }
    
    # Get attendance records
    response = attendance_table.scan(
        FilterExpression='session_id = :sesid',
        ExpressionAttributeValues={':sesid': session_id}
    )
    
    records = []
    for item in response['Items']:
        records.append({
            'attendance_id': item['attendance_id'],
            'student_id': item['student_id'],
            'student_name': f'Student {item["student_id"]}',
            'timestamp': item['timestamp'],
            'status': item['status'],
            'check_in_method': item['check_in_method'],
            'beacon_distance': None
        })
    
    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'success': True,
            'records': records
        })
    }

def handle_end_session(session_id, headers):
    """End session"""
    try:
        sessions_table.update_item(
            Key={'session_id': session_id},
            UpdateExpression='SET #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': 'closed'}
        )
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'message': 'Session ended successfully'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'message': str(e)})
        }

def handle_validate_beacon(event, headers):
    """Validate beacon UUID"""
    data = json.loads(event['body'])
    beacon_uuid = data.get('beacon_uuid')
    
    if not beacon_uuid:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'valid': False, 'message': 'Missing beacon_uuid'})
        }
    
    # Check if beacon has active session
    response = sessions_table.scan(
        FilterExpression='beacon_uuid = :uuid AND #status = :status',
        ExpressionAttributeNames={'#status': 'status'},
        ExpressionAttributeValues={':uuid': beacon_uuid, ':status': 'open'}
    )
    
    if response['Items']:
        session = response['Items'][0]
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'valid': True,
                'message': f'Valid session for {session["class_id"]} in {session["room_id"]}'
            })
        }
    else:
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'valid': False,
                'message': 'No active session found for this beacon'
            })
        }
```

### Step 3: Create API Gateway

#### 3.1 Create REST API
```bash
# Create API
API_ID=$(aws apigateway create-rest-api \
    --name "attendance-system-api" \
    --description "Digital Attendance System API" \
    --query 'id' --output text)

echo "Created API with ID: $API_ID"

# Get root resource ID
ROOT_ID=$(aws apigateway get-resources \
    --rest-api-id $API_ID \
    --query 'items[0].id' --output text)
```

#### 3.2 Create API Resources and Methods
```bash
# Create /api resource
API_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $ROOT_ID \
    --path-part "api" \
    --query 'id' --output text)

# Create proxy resource for all endpoints
PROXY_RESOURCE_ID=$(aws apigateway create-resource \
    --rest-api-id $API_ID \
    --parent-id $API_RESOURCE_ID \
    --path-part "{proxy+}" \
    --query 'id' --output text)

# Create ANY method for proxy
aws apigateway put-method \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --authorization-type NONE

# Get Lambda function ARN
LAMBDA_ARN=$(aws lambda get-function \
    --function-name attendance-api \
    --query 'Configuration.FunctionArn' --output text)

# Create integration
aws apigateway put-integration \
    --rest-api-id $API_ID \
    --resource-id $PROXY_RESOURCE_ID \
    --http-method ANY \
    --type AWS_PROXY \
    --integration-http-method POST \
    --uri arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/$LAMBDA_ARN/invocations

# Add Lambda permission for API Gateway
aws lambda add-permission \
    --function-name attendance-api \
    --statement-id api-gateway-invoke \
    --action lambda:InvokeFunction \
    --principal apigateway.amazonaws.com \
    --source-arn "arn:aws:execute-api:us-east-1:*:$API_ID/*/*"
```

#### 3.3 Deploy API
```bash
# Create deployment
aws apigateway create-deployment \
    --rest-api-id $API_ID \
    --stage-name prod

# Get API URL
API_URL="https://$API_ID.execute-api.us-east-1.amazonaws.com/prod"
echo "API deployed at: $API_URL"
```

### Step 4: Deploy Frontend

#### 4.1 Instructor Dashboard (S3 + CloudFront)
```bash
# Build React app
cd frontend/instructor-dashboard
npm run build

# Create S3 bucket
BUCKET_NAME="attendance-dashboard-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region us-east-1

# Enable static website hosting
aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document error.html

# Upload files
aws s3 sync build/ s3://$BUCKET_NAME --delete

# Set public read policy
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [
        {
            \"Sid\": \"PublicReadGetObject\",
            \"Effect\": \"Allow\",
            \"Principal\": \"*\",
            \"Action\": \"s3:GetObject\",
            \"Resource\": \"arn:aws:s3:::$BUCKET_NAME/*\"
        }
    ]
}"

echo "Dashboard URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
```

#### 4.2 Student Mobile App (Expo Build)
```bash
cd frontend/student-app

# Install Expo CLI
npm install -g @expo/cli

# Build for web (can be hosted on S3)
expo build:web

# Deploy web version to S3 (optional)
aws s3 sync web-build/ s3://attendance-student-app-$(date +%s) --delete
```

### Step 5: Environment Configuration

#### 5.1 Update Frontend API URLs
```bash
# Update instructor dashboard API URL
echo "REACT_APP_API_URL=$API_URL" > frontend/instructor-dashboard/.env.production

# Update student app API URL  
echo "API_BASE_URL=$API_URL" > frontend/student-app/.env.production
```

#### 5.2 Rebuild and Redeploy
```bash
# Rebuild with production config
cd frontend/instructor-dashboard
npm run build
aws s3 sync build/ s3://$BUCKET_NAME --delete
```

## 🧪 Testing Deployment

### Test API Endpoints
```bash
# Test health check
curl $API_URL/health

# Test session creation
curl -X POST $API_URL/api/session/start \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "TEST-2025-10-29",
    "class_id": "DES424",
    "room_id": "R602",
    "beacon_uuid": "D001A2B6-AA1F-4860-9E43-FC83C418FC58",
    "attendance_window_minutes": 5
  }'

# Test student check-in
curl -X POST $API_URL/api/attendance/checkin \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": "6522781713",
    "beacon_uuid": "D001A2B6-AA1F-4860-9E43-FC83C418FC58"
  }'
```

## 📊 Performance Monitoring

### CloudWatch Metrics
```bash
# View Lambda metrics
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/attendance-api"

# View API Gateway metrics
aws apigateway get-usage --usage-plan-id <plan-id> --key-id <key-id>
```

### Cost Estimation
```
AWS Learner Lab Resources (Monthly):
- Lambda: $0 (within free tier)
- API Gateway: ~$1 (for 1M requests)
- DynamoDB: $0 (within free tier)
- S3: ~$0.50 (for static hosting)
- Data Transfer: ~$0.50

Total Estimated Cost: ~$2/month
```

## 🔧 Troubleshooting

### Common Issues

1. **Lambda Timeout**
   ```bash
   aws lambda update-function-configuration \
       --function-name attendance-api \
       --timeout 30
   ```

2. **CORS Issues**
   - Ensure CORS headers are set in Lambda response
   - Add OPTIONS method to API Gateway

3. **DynamoDB Throttling**
   ```bash
   aws dynamodb update-table \
       --table-name attendance_sessions \
       --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10
   ```

4. **API Gateway 502 Error**
   - Check Lambda function logs
   - Verify integration configuration

### Debugging Commands
```bash
# Check Lambda logs
aws logs tail /aws/lambda/attendance-api --follow

# Test DynamoDB connection
aws dynamodb scan --table-name attendance_sessions --limit 1

# Check API Gateway stages
aws apigateway get-stages --rest-api-id $API_ID
```

## 🎯 Final Deployment Checklist

- ✅ DynamoDB tables created and accessible
- ✅ Lambda function deployed with correct permissions
- ✅ API Gateway configured with proxy integration
- ✅ Frontend deployed to S3 with correct API URLs
- ✅ CORS enabled for cross-origin requests
- ✅ All endpoints tested and working
- ✅ Performance monitoring enabled
- ✅ Error handling and logging configured

**Your digital attendance system is now live on AWS!** 🚀

## 📋 Presentation Demo URLs

After deployment, you'll have:

- **Instructor Dashboard:** `http://attendance-dashboard-xxx.s3-website-us-east-1.amazonaws.com`
- **API Endpoint:** `https://xxx.execute-api.us-east-1.amazonaws.com/prod`
- **Student App:** Available via Expo or web build

Use these URLs during your academic presentation to demonstrate the fully deployed cloud-based system!