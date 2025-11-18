import os
import uuid
import json
from datetime import datetime, timedelta, timezone
import boto3
from boto3.dynamodb.conditions import Key, Attr

# DynamoDB resource
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('AWS_REGION', 'us-east-1'))

USERS_TABLE = os.getenv('USERS_TABLE', 'Users')
SESSIONS_TABLE = os.getenv('SESSIONS_TABLE', 'Sessions')
ATTENDANCE_TABLE = os.getenv('ATTENDANCE_TABLE', 'AttendanceRecords')

users_table = dynamodb.Table(USERS_TABLE)
sessions_table = dynamodb.Table(SESSIONS_TABLE)
attendance_table = dynamodb.Table(ATTENDANCE_TABLE)
THAI_TZ = timezone(timedelta(hours=7))

# -------------------------
# Helper functions
# -------------------------
def now_iso():
    return datetime.now(THAI_TZ).isoformat()

def parse_body(event):
    body = event.get('body', {})
    if isinstance(body, str) and body:
        return json.loads(body)
    if isinstance(body, dict):
        return body
    return {}

def response(status=200, body=None):
    return {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Content-Type': 'application/json'
        },
        'body': json.dumps(body or {})
    }

# -------------------------
# 1) Create User
# -------------------------
def createUser(event, context=None):
    body = parse_body(event)
    required = ['student_id', 'name', 'role']
    for r in required:
        if r not in body:
            return response(400, {"error": f"missing {r}"})
    
    # Optional email and password for authentication
    item = {
        'student_id': body['student_id'],
        'name': body['name'],
        'role': body['role'],
        'created_at': now_iso()
    }
    
    if 'email' in body:
        item['email'] = body['email']
    if 'password' in body:
        item['password'] = body['password']  # In production, hash this!
    
    users_table.put_item(Item=item)
    return response(200, {"message": "user created", "user": item})

# -------------------------
# 2) Get User
# -------------------------
def getUser(event, context=None):
    body = parse_body(event)
    student_id = body.get('student_id') or (event.get('pathParameters') or {}).get('student_id')
    if not student_id:
        return response(400, {"error": "missing student_id"})
    resp = users_table.get_item(Key={'student_id': student_id})
    item = resp.get('Item')
    if not item:
        return response(404, {"error": "user not found"})
    return response(200, {"user": item})

# -------------------------
# 2.5) Verify Cognito Token
# -------------------------
def verifyToken(event, context=None):
    """
    Verify Cognito JWT token and extract user information
    """
    body = parse_body(event)
    token = body.get('token') or body.get('idToken') or body.get('accessToken')
    
    if not token:
        return response(400, {"error": "missing token"})
    
    try:
        # For development, we'll do basic JWT decoding without verification
        # In production, you should verify the JWT signature against Cognito public keys
        
        # Decode without verification (for development only)
        import base64
        
        # Split the JWT token
        parts = token.split('.')
        if len(parts) != 3:
            return response(400, {"error": "invalid token format"})
        
        # Decode the payload (second part)
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        
        decoded_payload = base64.urlsafe_b64decode(payload)
        user_data = json.loads(decoded_payload)
        
        # Extract user information from token
        user_info = {
            'username': user_data.get('cognito:username', user_data.get('sub')),
            'email': user_data.get('email'),
            'name': user_data.get('name'),
            'role': user_data.get('custom:role'),
            'student_id': user_data.get('custom:student_id'),
            'department': user_data.get('custom:department'),
            'token_use': user_data.get('token_use'),
            'exp': user_data.get('exp')
        }
        
        # Check if token is expired
        if user_data.get('exp') and user_data['exp'] < datetime.now().timestamp():
            return response(401, {"error": "token expired"})
        
        return response(200, {"message": "token valid", "user": user_info})
        
    except Exception as e:
        print(f"Token verification error: {e}")
        return response(401, {"error": "invalid token"})

# -------------------------
# 3) Create Session
# -------------------------
def createSession(event, context=None):
    body = parse_body(event)
    required = ['teacher_id', 'class_id', 'beacon_uuid']
    for r in required:
        if r not in body:
            return response(400, {"error": f"missing {r}"})
    session_id = str(uuid.uuid4())
    start_time = body.get('start_time') or now_iso()
    
    # Calculate end time based on attendance window (default 5 minutes)
    attendance_window_minutes = body.get('attendance_window_minutes', 5)
    if body.get('end_time'):
        end_time = body['end_time']
    else:
        # Calculate end time from start time + attendance window
        start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_dt = start_dt + timedelta(minutes=attendance_window_minutes)
        end_time = end_dt.isoformat()
    
    item = {
        'session_id': session_id,
        'class_id': body['class_id'],
        'class_name': body.get('class_name', ''),
        'teacher_id': body['teacher_id'],
        'room_id': body.get('room_id', ''),
        'beacon_uuid': body['beacon_uuid'],
        'start_time': start_time,
        'end_time': end_time,
        'created_at': now_iso(),
        'status': 'active'
    }
    sessions_table.put_item(Item=item)
    
    print(f"Session created successfully: {session_id}")
    return response(200, {"message": "session created", "session": item})

# -------------------------
# 4) Get Session By UUID
# -------------------------
def getSessionByUUID(event, context=None):
    body = parse_body(event)
    beacon = body.get('beacon_uuid') or (event.get('queryStringParameters') or {}).get('beacon_uuid')
    if not beacon:
        return response(400, {"error": "missing beacon_uuid"})
    try:
        resp = sessions_table.query(
            IndexName='beacon_uuid-index',
            KeyConditionExpression=Key('beacon_uuid').eq(beacon),
            FilterExpression=Attr('status').eq('active')
        )
    except Exception:
        resp = sessions_table.scan(
            FilterExpression=Attr('beacon_uuid').eq(beacon) & Attr('status').eq('active')
        )
    items = resp.get('Items', [])
    return response(200, {"sessions": items})

# -------------------------
# 5) Get Active Session
# -------------------------
def getActiveSession(event, context=None):
    params = parse_body(event)
    class_id = params.get('class_id') or (event.get('queryStringParameters') or {}).get('class_id')
    teacher_id = params.get('teacher_id') or (event.get('queryStringParameters') or {}).get('teacher_id')
    if not class_id and not teacher_id:
        return response(400, {"error": "provide class_id or teacher_id"})
    filter_expr = Attr('status').eq('active')
    if class_id:
        filter_expr = filter_expr & Attr('class_id').eq(class_id)
    if teacher_id:
        filter_expr = filter_expr & Attr('teacher_id').eq(teacher_id)
    resp = sessions_table.scan(FilterExpression=filter_expr)
    items = resp.get('Items', [])
    return response(200, {"active_sessions": items})

# -------------------------
# 6) Check Duplicate Attendance
# -------------------------
# -------------------------
# 6) Clean up old attendance records
# -------------------------
def cleanupOldAttendanceRecords(event, context=None):
    """Clean up attendance records from old/closed sessions"""
    try:
        # Get all closed sessions
        closed_sessions = sessions_table.scan(
            FilterExpression=Attr('status').eq('closed')
        )
        
        deleted_count = 0
        for session in closed_sessions.get('Items', []):
            session_id = session['session_id']
            
            # Find attendance records for this closed session
            attendance_records = attendance_table.scan(
                FilterExpression=Attr('session_id').eq(session_id)
            )
            
            # Delete the attendance records
            for record in attendance_records.get('Items', []):
                attendance_table.delete_item(
                    Key={'attendance_id': record['attendance_id']}
                )
                deleted_count += 1
        
        return response(200, {"message": f"cleaned up {deleted_count} old attendance records"})
    except Exception as e:
        return response(500, {"error": str(e)})

# -------------------------
# 6.5) Export to S3
# -------------------------
def exportToS3(event, context=None):
    try:
        import boto3
        import json
        from datetime import datetime
        
        s3 = boto3.client('s3')
        bucket_name = 'digital-attendance-exports'  # You need to create this bucket
        
        body = parse_body(event)
        export_type = body.get('export_type', 'attendance')  # 'attendance' or 'sessions'
        
        if export_type == 'attendance':
            # Export all attendance records
            resp = attendance_table.scan()
            data = resp.get('Items', [])
            filename = f"attendance-export-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
        elif export_type == 'sessions':
            # Export all sessions
            resp = sessions_table.scan()
            data = resp.get('Items', [])
            filename = f"sessions-export-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
        else:
            return response(400, {"error": "invalid export_type. Use 'attendance' or 'sessions'"})
        
        # Convert DynamoDB items to JSON
        json_data = json.dumps(data, indent=2, default=str)
        
        # Upload to S3
        s3.put_object(
            Bucket=bucket_name,
            Key=filename,
            Body=json_data,
            ContentType='application/json'
        )
        
        return response(200, {
            "message": f"exported {len(data)} records to S3",
            "bucket": bucket_name,
            "filename": filename,
            "record_count": len(data)
        })
        
    except Exception as e:
        print(f"Error exporting to S3: {e}")
        return response(500, {"error": str(e)})

# -------------------------
# 6.7) CloudWatch Logging
# -------------------------
def logToCloudWatch(event, context=None):
    try:
        import boto3
        import json
        
        cloudwatch_logs = boto3.client('logs')
        log_group_name = '/aws/lambda/digital-attendance-logs'
        log_stream_name = f"attendance-{datetime.now().strftime('%Y/%m/%d')}"
        
        body = parse_body(event)
        log_type = body.get('log_type', 'attendance')
        message = body.get('message', '')
        metadata = body.get('metadata', {})
        
        # Create log entry
        log_entry = {
            'timestamp': now_iso(),
            'log_type': log_type,
            'message': message,
            'metadata': metadata
        }
        
        # Try to create log stream (will fail if exists, but that's ok)
        try:
            cloudwatch_logs.create_log_stream(
                logGroupName=log_group_name,
                logStreamName=log_stream_name
            )
        except cloudwatch_logs.exceptions.ResourceAlreadyExistsException:
            pass
        
        # Send log event
        cloudwatch_logs.put_log_events(
            logGroupName=log_group_name,
            logStreamName=log_stream_name,
            logEvents=[
                {
                    'timestamp': int(datetime.now().timestamp() * 1000),
                    'message': json.dumps(log_entry)
                }
            ]
        )
        
        return response(200, {"message": "logged to cloudwatch", "log_entry": log_entry})
        
    except Exception as e:
        print(f"Error logging to CloudWatch: {e}")
        return response(500, {"error": str(e)})

# -------------------------
# 7) Get All Sessions
# -------------------------
def getAllSessions(event, context=None):
    try:
        resp = sessions_table.scan()
        sessions = resp.get('Items', [])
        
        # Sort by created_at descending (newest first)
        sessions.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        
        return response(200, {"sessions": sessions})
    except Exception as e:
        print(f"Error getting all sessions: {e}")
        return response(500, {"error": str(e)})

# -------------------------
# 8) Get All Attendance Records
# -------------------------
def getAllAttendance(event, context=None):
    try:
        # Get all attendance records
        resp = attendance_table.scan()
        attendance_records = resp.get('Items', [])
        
        # Get all sessions to join class information
        sessions_resp = sessions_table.scan()
        sessions = sessions_resp.get('Items', [])
        
        # Create session lookup dictionary
        session_lookup = {session['session_id']: session for session in sessions}
        
        # Enrich attendance records with session information
        enriched_records = []
        for record in attendance_records:
            session_id = record.get('session_id')
            session_info = session_lookup.get(session_id, {})
            
            enriched_record = {
                **record,
                'class_id': session_info.get('class_id', ''),
                'class_name': session_info.get('class_name', ''),
                'room_id': session_info.get('room_id', ''),
                'session_start_time': session_info.get('start_time', ''),
                'teacher_id': session_info.get('teacher_id', '')
            }
            enriched_records.append(enriched_record)
        
        # Sort by timestamp descending (newest first)
        enriched_records.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        
        return response(200, {"attendance": enriched_records})
    except Exception as e:
        print(f"Error getting all attendance: {e}")
        return response(500, {"error": str(e)})

def checkDuplicateAttendance(student_id, session_id):
    # Check for duplicate attendance in the specific session only
    try:
        print(f"Checking for duplicate: student_id={student_id}, session_id={session_id}")
        resp = attendance_table.scan(
            FilterExpression=Attr('student_id').eq(student_id) & Attr('session_id').eq(session_id)
        )
        items = resp.get('Items', [])
        print(f"Found {len(items)} matching records")
        for item in items:
            print(f"  Record: {item}")
        
        if items:
            print(f"DUPLICATE FOUND: student {student_id} already checked into session {session_id}")
            return True
        
        print(f"NO DUPLICATE: student {student_id} not yet checked into session {session_id}")
        return False
    except Exception as e:
        print(f"Error checking duplicate attendance: {e}")
        return False

# -------------------------
# 7) Validate Beacon
# -------------------------
def validateBeacon(detected_uuid, rssi=None):
    # Use scan to find active session with matching beacon_uuid
    try:
        resp = sessions_table.scan(
            FilterExpression=Attr('beacon_uuid').eq(detected_uuid) & Attr('status').eq('active')
        )
        items = resp.get('Items', [])
        if not items:
            print(f"No active session found for beacon: {detected_uuid}")
            return None, "no active session found for this beacon"
        
        # Sort by created_at to get the most recent session
        items.sort(key=lambda x: x.get('created_at', ''), reverse=True)
        session = items[0]
        print(f"Found {len(items)} active sessions, using most recent: {session['session_id']} for beacon: {detected_uuid}")
        
        # Check if session is still within time window
        now = datetime.now(THAI_TZ)
        st = session.get('start_time')
        et = session.get('end_time')
        
        def parse_iso(t):
            try:
                return datetime.fromisoformat(t)
            except:
                return None
        
        if st:
            st_dt = parse_iso(st)
            if st_dt and now < st_dt:
                return None, "session not started yet"
        if et:
            et_dt = parse_iso(et)
            if et_dt and now > et_dt:
                return None, "session ended"
        
        return session, None
    except Exception as e:
        print(f"Error validating beacon: {e}")
        return None, "error validating beacon"

# -------------------------
# 8) Mark Attendance
# -------------------------
def markAttendance(event, context=None):
    body = parse_body(event)
    student_id = body.get('student_id')
    detected_uuid = body.get('detected_uuid') or body.get('beacon_uuid')
    rssi = body.get('rssi')
    
    print(f"markAttendance called: student_id={student_id}, beacon_uuid={detected_uuid}")
    
    if not student_id or not detected_uuid:
        return response(400, {"error": "missing student_id or detected_uuid/beacon_uuid"})
    
    session, err = validateBeacon(detected_uuid, rssi)
    if err:
        print(f"Beacon validation failed: {err}")
        return response(403, {"error": err})
    
    session_id = session['session_id']
    print(f"Using session_id: {session_id}")
    if rssi is not None:
        try:
            if int(rssi) < -75:
                return response(403, {"error": "device too far (rssi weak)"})
        except:
            pass
    # Check for duplicate attendance in THIS specific session
    duplicate_found = checkDuplicateAttendance(student_id, session_id)
    if duplicate_found:
        print(f"Duplicate attendance found for student {student_id} in session {session_id}")
        return response(200, {"message": "already checked-in", "student_id": student_id, "session_id": session_id})
    
    print(f"No duplicate found, proceeding with attendance for student {student_id} in session {session_id}")
    
    # Get session information for response
    try:
        session_resp = sessions_table.get_item(Key={'session_id': session_id})
        session_info = session_resp.get('Item', {})
    except Exception as e:
        print(f"Error fetching session info: {e}")
        session_info = {}
    
    attendance_id = str(uuid.uuid4())
    
    # Determine attendance status based on timing
    current_time = datetime.now(timezone.utc)
    session_start = datetime.fromisoformat(session_info.get('start_time', '').replace('Z', '+00:00'))
    session_end = datetime.fromisoformat(session_info.get('end_time', '').replace('Z', '+00:00'))
    
    # Calculate late threshold (15 minutes after session start)
    late_threshold = session_start + timedelta(minutes=15)
    
    if current_time <= late_threshold:
        status = 'Present'
    elif current_time <= session_end:
        status = 'Late'
    else:
        status = 'Absent'  # Checking in after session ended
        
    item = {
        'attendance_id': attendance_id,
        'student_id': student_id,
        'session_id': session_id,
        'timestamp': now_iso(),
        'status': status
    }
    attendance_table.put_item(Item=item)
    return response(200, {
        "message": "attendance recorded", 
        "record": item,
        "session": {
            "class_id": session_info.get('class_id', ''),
            "room_id": session_info.get('room_id', ''),
            "session_id": session_id
        }
    })

# -------------------------
# 9) Get Attendance By Session
# -------------------------
def getAttendanceBySession(event, context=None):
    params = parse_body(event)
    session_id = params.get('session_id') or (event.get('queryStringParameters') or {}).get('session_id')
    if not session_id:
        return response(400, {"error": "missing session_id"})
    try:
        resp = attendance_table.query(
            IndexName='session_id-index',
            KeyConditionExpression=Key('session_id').eq(session_id)
        )
        items = resp.get('Items', [])
    except Exception:
        resp = attendance_table.scan(FilterExpression=Attr('session_id').eq(session_id))
        items = resp.get('Items', [])
    return response(200, {"attendance": items})

# -------------------------
# 10) Get Attendance By Student
# -------------------------
def getAttendanceByStudent(event, context=None):
    params = parse_body(event)
    student_id = params.get('student_id') or (event.get('queryStringParameters') or {}).get('student_id')
    if not student_id:
        return response(400, {"error": "missing student_id"})
    resp = attendance_table.query(KeyConditionExpression=Key('student_id').eq(student_id))
    items = resp.get('Items', [])
    return response(200, {"attendance": items})

# -------------------------
# 11) Mark Absent Students
# -------------------------
def markAbsentStudents(session_id, enrolled_students=None):
    """Mark students as absent if they didn't check in during the session"""
    try:
        # Get all attendance records for this session
        resp = attendance_table.scan(
            FilterExpression=Attr('session_id').eq(session_id)
        )
        attended_students = {record['student_id'] for record in resp.get('Items', [])}
        
        # For demo purposes, assume some students are enrolled
        # In production, this would come from a student enrollment table
        if not enrolled_students:
            enrolled_students = ['6522781713', '6522781714', '6522781715', '6522781716', '6522781717']
        
        absent_count = 0
        for student_id in enrolled_students:
            if student_id not in attended_students:
                # Mark as absent
                absence_id = str(uuid.uuid4())
                absent_record = {
                    'attendance_id': absence_id,
                    'student_id': student_id,
                    'session_id': session_id,
                    'timestamp': now_iso(),
                    'status': 'Absent'
                }
                attendance_table.put_item(Item=absent_record)
                absent_count += 1
        
        return absent_count
    except Exception as e:
        print(f"Error marking absent students: {e}")
        return 0

# -------------------------
# 12) Close Session
# -------------------------

def closeSession(event, context=None):
    body = parse_body(event)
    session_id = body.get('session_id')
    enrolled_students = body.get('enrolled_students', None)
    if not session_id:
        return response(400, {"error": "missing session_id"})
    
    end_time = now_iso()  # เวลาประเทศไทยปัจจุบัน
    try:
        # Mark absent students before closing
        absent_count = markAbsentStudents(session_id, enrolled_students)
        
        sessions_table.update_item(
            Key={'session_id': session_id},
            UpdateExpression="SET #st = :s, end_time = :e",
            ExpressionAttributeNames={'#st': 'status'},
            ExpressionAttributeValues={
                ':s': 'ended',
                ':e': end_time
            }
        )
        return response(200, {
            "message": "session closed",
            "session_id": session_id,
            "end_time": end_time,
            "absent_students_marked": absent_count
        })
    except Exception as e:
        return response(500, {"error": str(e)})

# -------------------------
# Lambda handler
# -------------------------
def lambda_handler(event, context):
    # Handle CORS preflight requests
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({})
        }
    
    # Handle API Gateway proxy integration format
    if 'body' in event and event['body']:
        # Parse the body for API Gateway requests
        try:
            if isinstance(event['body'], str):
                body_data = json.loads(event['body'])
            else:
                body_data = event['body']
            
            # Get action from parsed body
            action = body_data.get('action')
            
            # Create a new event with body data merged into event
            proxy_event = {**event, **body_data}
            
        except (json.JSONDecodeError, TypeError):
            return response(400, {"error": "invalid JSON in request body"})
    else:
        # Direct Lambda invocation (non-proxy)
        action = event.get('action')
        proxy_event = event
    
    if not action:
        return response(400, {"error": "missing action"})
    
    # Add CORS headers for browser requests
    cors_response = lambda status, body: {
        'statusCode': status,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body or {})
    }
    
    try:
        if action == 'createUser':
            result = createUser(proxy_event, context)
        elif action == 'getUser':
            result = getUser(proxy_event, context)
        elif action == 'verifyToken':
            result = verifyToken(proxy_event, context)
        elif action == 'createSession':
            result = createSession(proxy_event, context)
        elif action == 'getSessionByUUID':
            result = getSessionByUUID(proxy_event, context)
        elif action == 'getActiveSession':
            result = getActiveSession(proxy_event, context)
        elif action == 'markAttendance':
            result = markAttendance(proxy_event, context)
        elif action == 'getAttendanceBySession':
            result = getAttendanceBySession(proxy_event, context)
        elif action == 'getAttendanceByStudent':
            result = getAttendanceByStudent(proxy_event, context)
        elif action == 'closeSession':
            result = closeSession(proxy_event, context)
        elif action == 'cleanupOldRecords':
            result = cleanupOldAttendanceRecords(proxy_event, context)
        elif action == 'getAllSessions':
            result = getAllSessions(proxy_event, context)
        elif action == 'getAllAttendance':
            result = getAllAttendance(proxy_event, context)
        elif action == 'exportToS3':
            result = exportToS3(proxy_event, context)
        elif action == 'logToCloudWatch':
            result = logToCloudWatch(proxy_event, context)
        else:
            return cors_response(400, {"error": f"unknown action {action}"})
        
        # Convert response format for API Gateway
        if isinstance(result, dict) and 'statusCode' in result:
            return {
                'statusCode': result['statusCode'],
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
                },
                'body': result['body']
            }
        else:
            return cors_response(200, result)
            
    except Exception as e:
        return cors_response(500, {"error": f"internal server error: {str(e)}"})
