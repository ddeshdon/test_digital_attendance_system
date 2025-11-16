"""
Test Lambda Functions Locally
Complete end-to-end testing of Lambda functions with DynamoDB Local
"""

import json
import os
import sys

# Set environment variables for local DynamoDB
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['USERS_TABLE'] = 'Users'
os.environ['SESSIONS_TABLE'] = 'Sessions'
os.environ['ATTENDANCE_TABLE'] = 'AttendanceRecords'

# Override boto3 to use local DynamoDB
import boto3
original_resource = boto3.resource

def local_dynamodb_resource(*args, **kwargs):
    kwargs['endpoint_url'] = 'http://localhost:8000'
    kwargs['aws_access_key_id'] = 'dummy'
    kwargs['aws_secret_access_key'] = 'dummy'
    return original_resource(*args, **kwargs)

boto3.resource = local_dynamodb_resource

# Import Lambda function
from lambda_function import lambda_handler

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_test(name):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
    print(f"{Colors.BOLD}Test: {name}{Colors.RESET}")
    print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.RESET}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.RESET}")

def print_info(message):
    print(f"{Colors.YELLOW}ℹ️  {message}{Colors.RESET}")

def pretty_print_json(data):
    print(json.dumps(data, indent=2))

# Test suite
test_results = {
    'passed': 0,
    'failed': 0,
    'total': 0
}

def run_test(test_name, event, expected_success=True):
    # Run a test and validate results
    global test_results
    test_results['total'] += 1
    
    print_test(test_name)
    print_info("Request:")
    pretty_print_json(event)
    
    try:
        result = lambda_handler(event, None)
        response = json.loads(result['body'])
        
        print_info("Response:")
        pretty_print_json(response)
        
        success = response.get('success', response.get('message') == 'user created')
        
        if success == expected_success:
            print_success(f"PASSED - Expected success={expected_success}, got {success}")
            test_results['passed'] += 1
            return response
        else:
            print_error(f"FAILED - Expected success={expected_success}, got {success}")
            test_results['failed'] += 1
            return None
    except Exception as e:
        print_error(f"FAILED - Exception: {e}")
        test_results['failed'] += 1
        return None

def main():
    print(f"\n{Colors.BOLD}{'='*60}")
    print("- Lambda Function Test Suite")
    print(f"{'='*60}{Colors.RESET}\n")
    
    # Check DynamoDB connection
    print_info("Checking DynamoDB Local connection...")
    try:
        dynamodb = boto3.client('dynamodb')
        tables = dynamodb.list_tables()
        print_success(f"Connected to DynamoDB Local")
        print_info(f"Available tables: {tables.get('TableNames', [])}")
    except Exception as e:
        print_error("Cannot connect to DynamoDB Local!")
        print("Make sure it's running: java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb")
        sys.exit(1)
    
    # Store session ID for later tests
    session_id = None
    
    # Test 1: Create User
    response = run_test(
        "Create User",
        {
            'action': 'createUser',
            'body': json.dumps({
                'student_id': '6522781713',
                'name': 'John Doe',
                'role': 'student'
            })
        },
        expected_success=True
    )
    
    # Test 2: Get User
    run_test(
        "Get User",
        {
            'action': 'getUser',
            'pathParameters': {'student_id': '6522781713'}
        },
        expected_success=True
    )
    
    # Test 3: Get Non-existent User
    run_test(
        "Get Non-existent User (Should Fail)",
        {
            'action': 'getUser',
            'pathParameters': {'student_id': '9999999999'}
        },
        expected_success=False
    )
    
    # Test 4: Create Session
    response = run_test(
        "Create Session",
        {
            'action': 'createSession',
            'body': json.dumps({
                'teacher_id': 'instructor123',
                'class_id': 'DES424',
                'beacon_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58'
            })
        },
        expected_success=True
    )
    
    if response and 'session' in response:
        session_id = response['session']['session_id']
        print_info(f"Created session: {session_id}")
    
    # Test 5: Create Session with Duplicate Beacon (Should Fail)
    run_test(
        "Create Session with Duplicate Beacon (Should Fail)",
        {
            'action': 'createSession',
            'body': json.dumps({
                'teacher_id': 'instructor456',
                'class_id': 'DES425',
                'beacon_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58'
            })
        },
        expected_success=False
    )
    
    # Test 6: Get Session by UUID
    run_test(
        "Get Session by UUID",
        {
            'action': 'getSessionByUUID',
            'queryStringParameters': {
                'beacon_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58'
            }
        },
        expected_success=True
    )
    
    # Test 7: Mark Attendance
    run_test(
        "Mark Attendance",
        {
            'action': 'markAttendance',
            'body': json.dumps({
                'student_id': '6522781713',
                'detected_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58',
                'rssi': -50
            })
        },
        expected_success=True
    )
    
    # Test 8: Mark Duplicate Attendance (Should Fail)
    run_test(
        "Mark Duplicate Attendance (Should Fail)",
        {
            'action': 'markAttendance',
            'body': json.dumps({
                'student_id': '6522781713',
                'detected_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58',
                'rssi': -50
            })
        },
        expected_success=False
    )
    
    # Test 9: Mark Attendance with Weak Signal (Should Fail)
    run_test(
        "Mark Attendance with Weak Signal (Should Fail)",
        {
            'action': 'markAttendance',
            'body': json.dumps({
                'student_id': '6522781714',
                'detected_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58',
                'rssi': -80  # Too weak
            })
        },
        expected_success=False
    )
    
    # Test 10: Get Attendance by Session
    if session_id:
        run_test(
            "Get Attendance by Session",
            {
                'action': 'getAttendanceBySession',
                'queryStringParameters': {'session_id': session_id}
            },
            expected_success=True
        )
    
    # Test 11: Get Attendance by Student
    run_test(
        "Get Attendance by Student",
        {
            'action': 'getAttendanceByStudent',
            'queryStringParameters': {'student_id': '6522781713'}
        },
        expected_success=True
    )
    
    # Test 12: Close Session
    if session_id:
        run_test(
            "Close Session",
            {
                'action': 'closeSession',
                'body': json.dumps({'session_id': session_id})
            },
            expected_success=True
        )
    
    # Test 13: Mark Attendance to Closed Session (Should Fail)
    run_test(
        "Mark Attendance to Closed Session (Should Fail)",
        {
            'action': 'markAttendance',
            'body': json.dumps({
                'student_id': '6522781715',
                'detected_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58',
                'rssi': -50
            })
        },
        expected_success=False
    )
    
    # Print Summary
    print(f"\n{Colors.BOLD}{'='*60}")
    print("- Test Summary")
    print(f"{'='*60}{Colors.RESET}")
    print(f"Total Tests:  {test_results['total']}")
    print(f"{Colors.GREEN}Passed:       {test_results['passed']}{Colors.RESET}")
    print(f"{Colors.RED}Failed:       {test_results['failed']}{Colors.RESET}")
    
    success_rate = (test_results['passed'] / test_results['total'] * 100) if test_results['total'] > 0 else 0
    print(f"Success Rate: {success_rate:.1f}%")
    
    if test_results['failed'] == 0:
        print(f"\n{Colors.GREEN}- All tests passed!{Colors.RESET}")
        sys.exit(0)
    else:
        print(f"\n{Colors.RED}-  Some tests failed. Please review the errors above.{Colors.RESET}")
        sys.exit(1)

if __name__ == '__main__':
    main()