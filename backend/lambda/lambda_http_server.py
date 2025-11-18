"""
Lambda HTTP Server
Wraps Lambda functions in a Flask HTTP server for local testing
Allows frontend to talk to Lambda functions without AWS deployment
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import os
import sys

# Add current directory to path to import lambda_function
sys.path.insert(0, os.path.dirname(__file__))

# Set environment variables for local DynamoDB
os.environ['AWS_REGION'] = 'us-east-1'
os.environ['USERS_TABLE'] = 'Users'
os.environ['SESSIONS_TABLE'] = 'Sessions'
os.environ['ATTENDANCE_TABLE'] = 'AttendanceRecords'

# Override boto3 to use local DynamoDB
import boto3
original_resource = boto3.resource

def local_dynamodb_resource(*args, **kwargs):
    # Override boto3.resource to use local DynamoDB
    kwargs['endpoint_url'] = 'http://localhost:8000'
    kwargs['aws_access_key_id'] = 'dummy'
    kwargs['aws_secret_access_key'] = 'dummy'
    return original_resource(*args, **kwargs)

boto3.resource = local_dynamodb_resource

# Import Lambda function
from lambda_function import lambda_handler

# Create Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend

def lambda_event_from_request(action, method='POST'):
    # Convert Flask request to Lambda event format
    event = {
        'action': action,
        'httpMethod': method
    }
    
    if request.method == 'POST':
        event['body'] = request.get_json() or {}
    elif request.method == 'GET':
        event['queryStringParameters'] = dict(request.args)
    elif request.method == 'PUT':
        event['body'] = request.get_json() or {}
    
    if request.view_args:
        event['pathParameters'] = request.view_args
    
    return event

@app.route('/')
def index():
    # API information endpoint
    return jsonify({
        'message': 'Digital Attendance Lambda Backend (Local)',
        'status': 'running',
        'dynamodb': 'http://localhost:8000',
        'endpoints': {
            'session': {
                'start': 'POST /session/start',
                'end': 'PUT /session/end/<session_id>',
                'status': 'GET /session/status/<session_id>',
                'active': 'GET /sessions/active'
            },
            'attendance': {
                'checkin': 'POST /attendance/checkin',
                'list': 'GET /attendance/list/<session_id>',
                'export': 'GET /attendance/export/<session_id>'
            },
            'beacon': {
                'validate': 'POST /beacon/validate'
            },
            'user': {
                'create': 'POST /user/create',
                'get': 'GET /user/<student_id>'
            }
        }
    })

@app.route('/health')
def health():
    # Health check endpoint
    try:
        # Test DynamoDB connection
        dynamodb = boto3.resource('dynamodb')
        tables = list(dynamodb.tables.all())
        
        return jsonify({
            'status': 'healthy',
            'message': 'Lambda backend running locally',
            'dynamodb_tables': [t.name for t in tables]
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'message': str(e)
        }), 500

# Session Management Routes
@app.route('/session/start', methods=['POST'])
def start_session():
    # Start attendance session
    try:
        event = lambda_event_from_request('createSession')
        result = lambda_handler(event, None)
        return jsonify(json.loads(result['body'])), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/session/end/<session_id>', methods=['PUT'])
def end_session(session_id):
    # End attendance session
    try:
        event = {
            'action': 'closeSession',
            'body': {'session_id': session_id}
        }
        result = lambda_handler(event, None)
        return jsonify(json.loads(result['body'])), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/session/status/<session_id>', methods=['GET'])
def get_session_status(session_id):
    # Get session status
    try:
        event = {
            'action': 'getActiveSession',
            'queryStringParameters': {'session_id': session_id}
        }
        result = lambda_handler(event, None)
        return jsonify(json.loads(result['body'])), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/sessions/active', methods=['GET'])
def get_active_sessions():
    # Get all active sessions
    try:
        event = {
            'action': 'getActiveSession',
            'queryStringParameters': {}
        }
        result = lambda_handler(event, None)
        return jsonify(json.loads(result['body'])), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Attendance Routes
@app.route('/attendance/checkin', methods=['POST'])
def check_in():
    # Student check-in
    try:
        event = lambda_event_from_request('markAttendance')
        result = lambda_handler(event, None)
        return jsonify(json.loads(result['body'])), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/attendance/list/<session_id>', methods=['GET'])
def get_attendance(session_id):
    # Get attendance records for a session
    try:
        event = {
            'action': 'getAttendanceBySession',
            'queryStringParameters': {'session_id': session_id}
        }
        result = lambda_handler(event, None)
        body = json.loads(result['body'])
        
        # Format response to match Flask backend format
        if 'attendance' in body:
            return jsonify({
                'success': True,
                'records': body['attendance'],
                'total_present': len(body['attendance'])
            }), result['statusCode']
        else:
            return jsonify(body), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/attendance/export/<session_id>', methods=['GET'])
def export_attendance(session_id):
    # Export attendance as CSV
    try:
        # Get attendance records
        event = {
            'action': 'getAttendanceBySession',
            'queryStringParameters': {'session_id': session_id}
        }
        result = lambda_handler(event, None)
        body = json.loads(result['body'])
        
        if 'attendance' not in body:
            return jsonify({'success': False, 'message': 'No attendance data found'}), 404
        
        # Generate CSV
        records = body['attendance']
        csv_lines = ['Student ID,Name,Check-in Time,Status,Method,Distance (m)']
        
        for record in records:
            csv_lines.append(
                f"{record.get('student_id', '')},"
                f"{record.get('student_name', 'Unknown')},"
                f"{record.get('timestamp', '')},"
                f"{record.get('status', 'Present')},"
                f"beacon_scan,"
                f"N/A"
            )
        
        return jsonify({
            'success': True,
            'csvData': '\n'.join(csv_lines),
            'filename': f"attendance_{session_id}.csv"
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Beacon Validation Routes
@app.route('/beacon/validate', methods=['POST'])
def validate_beacon():
    # Validate beacon UUID
    try:
        event = lambda_event_from_request('getSessionByUUID')
        result = lambda_handler(event, None)
        body = json.loads(result['body'])
        
        # Convert to validation format
        if 'sessions' in body and len(body['sessions']) > 0:
            return jsonify({
                'valid': True,
                'message': 'Valid session found',
                'session': body['sessions'][0]
            })
        else:
            return jsonify({
                'valid': False,
                'message': 'No active session found for this beacon'
            })
    except Exception as e:
        return jsonify({'valid': False, 'message': str(e)}), 500

# User Management Routes
@app.route('/user/create', methods=['POST'])
def create_user():
    # Create new user
    try:
        event = lambda_event_from_request('createUser')
        result = lambda_handler(event, None)
        return jsonify(json.loads(result['body'])), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/user/<student_id>', methods=['GET'])
def get_user(student_id):
    # Get user info
    try:
        event = {
            'action': 'getUser',
            'pathParameters': {'student_id': student_id}
        }
        result = lambda_handler(event, None)
        return jsonify(json.loads(result['body'])), result['statusCode']
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

if __name__ == '__main__':
    print("="*60)
    print("- Lambda HTTP Server Starting...")
    print("="*60)
    
    # Check DynamoDB connection
    try:
        dynamodb = boto3.client('dynamodb')
        tables = dynamodb.list_tables()
        print("- Connected to DynamoDB Local at http://localhost:8000")
        print(f"- Available tables: {tables.get('TableNames', [])}")
    except Exception as e:
        print("  Cannot connect to DynamoDB Local!")
        print("   Make sure DynamoDB Local is running:")
        print("   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb")
        print(f"   Error: {e}")
    
    print("\n- Server URLs:")
    print("   Local:   http://localhost:3001")
    print("   Health:  http://localhost:3001/health")
    print("   API:     http://localhost:3001/")
    print("\n- Update frontend API URLs to: http://localhost:3001")
    print("="*60)
    
    app.run(debug=True, host='0.0.0.0', port=3001)