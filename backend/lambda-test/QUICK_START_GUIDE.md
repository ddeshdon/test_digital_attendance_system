# AWS Learner Lab Deployment Quick Start Guide

This guide provides step-by-step instructions for deploying the Digital Attendance System to AWS Learner Lab.

## Prerequisites Checklist

**AWS Learner Lab Access**
- Lab started and AWS credentials active
- AWS CLI configured with lab credentials
- Region set to `us-east-1`

**Local Development Environment**
- Python 3.9+ installed
- AWS CLI installed and configured
- Git repository with latest backend code

## Deployment Steps

### Step 1: Verify AWS Connection

```bash
# Test AWS connection
aws sts get-caller-identity

# Should show your AWS account and user ARN
```

### Step 2: Verify DynamoDB Tables (Already Created)

```bash
# Verify existing tables
aws dynamodb list-tables --region us-east-1
```

**Expected Output:**
```
{
    "TableNames": [
        "DigitalAttendance-AttendanceRecords",
        "DigitalAttendance-Sessions",
        "DigitalAttendance-Users"
    ]
}
```

### Step 3: Deploy Lambda Function

```bash
python deploy_lambda.py
```

**Expected Output:**
```
AWS Lambda Deployment for Digital Attendance System
Lambda Function: digital-attendance-backend
Test Result: PASSED
```

### Step 3: Setup API Gateway

```bash
python setup_api_gateway.py
```

**Expected Output:**
```
AWS API Gateway Setup for Digital Attendance System
API Gateway ID: abc123def456
API Endpoint: https://abc123def456.execute-api.us-east-1.amazonaws.com/dev
```

### Step 4: Update Frontend Configuration

1. Copy the API endpoint URL from Step 3
2. Update `frontend/instructor-dashboard/src/services/api.js`:

```javascript
const API_BASE_URL = 'https://YOUR_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/dev';
```

3. Update `frontend/student-app/src/services/api.js` the same way

### Step 5: Test the System

```bash
# Test API health
curl https://YOUR_API_GATEWAY_ID.execute-api.us-east-1.amazonaws.com/dev/health

# Should return: {"status": "healthy", "message": "Digital Attendance API is running"}
```

## Quick Troubleshooting

### Problem: AWS Connection Failed
**Solution:** 
```bash
# Restart AWS Learner Lab session
# Reconfigure AWS CLI with new credentials
aws configure
```

### Problem: DynamoDB Table Creation Failed
**Solution:**
```bash
# Check existing tables
aws dynamodb list-tables

# Delete problematic tables if needed
aws dynamodb delete-table --table-name DigitalAttendance-Users
```

### Problem: Lambda Deployment Failed
**Solution:**
```bash
# Check IAM permissions
aws iam list-roles | grep Lambda

# Manually create role if needed
aws iam create-role --role-name DigitalAttendance-Lambda-Role --assume-role-policy-document file://trust-policy.json
```

### Problem: API Gateway Not Working
**Solution:**
```bash
# Check API Gateway deployment
aws apigateway get-rest-apis

# Redeploy if needed
aws apigateway create-deployment --rest-api-id YOUR_API_ID --stage-name dev
```

## Important Learner Lab Considerations

**Session Limits:** AWS Learner Lab sessions expire after 4 hours
**Cost Management:** Use PAY_PER_REQUEST billing for DynamoDB
**Resource Cleanup:** Always stop resources when not needed

## Save Your Configuration

After successful deployment, save these files:
- `aws-resources.txt` - DynamoDB table info
- `lambda-deployment.json` - Lambda function details
- `api-gateway-config.json` - API Gateway endpoints
- `frontend-api-config.json` - Frontend configuration

## Next Steps

1. **Test Complete System**: Verify frontend connects to AWS backend
2. **Deploy Frontend**: Upload React apps to S3 for web hosting
3. **Mobile Testing**: Use Expo Go for React Native app testing
4. **Performance Monitoring**: Check CloudWatch logs for issues

---

## Emergency Recovery

If you need to restart your AWS Learner Lab session:

1. Save all configuration files locally
2. Restart AWS Learner Lab
3. Reconfigure AWS CLI with new credentials
4. Re-run deployment scripts (they handle existing resources)

**Time Required:** 15-30 minutes for complete deployment
**Cost:** ~$0.50-$2.00 per day in AWS Learner Lab credits