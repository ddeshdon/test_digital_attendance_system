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
    item = {
        'student_id': body['student_id'],
        'name': body['name'],
        'role': body['role'],
        'created_at': now_iso()
    }
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
    end_time = body.get('end_time') or None
    item = {
        'session_id': session_id,
        'class_id': body['class_id'],
        'teacher_id': body['teacher_id'],
        'beacon_uuid': body['beacon_uuid'],
        'start_time': start_time,
        'end_time': end_time,
        'created_at': now_iso(),
        'status': 'active'
    }
    sessions_table.put_item(Item=item)
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
def checkDuplicateAttendance(student_id, session_id):
    resp = attendance_table.get_item(Key={'student_id': student_id, 'session_id': session_id})
    return 'Item' in resp

# -------------------------
# 7) Validate Beacon
# -------------------------
def validateBeacon(detected_uuid, rssi=None):
    try:
        resp = sessions_table.query(
            IndexName='beacon_uuid-index',
            KeyConditionExpression=Key('beacon_uuid').eq(detected_uuid),
            FilterExpression=Attr('status').eq('active')
        )
    except Exception:
        resp = sessions_table.scan(
            FilterExpression=Attr('beacon_uuid').eq(detected_uuid) & Attr('status').eq('active')
        )
    items = resp.get('Items', [])
    if not items:
        return None, "no active session"
    session = items[0]
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

# -------------------------
# 8) Mark Attendance
# -------------------------
def markAttendance(event, context=None):
    body = parse_body(event)
    student_id = body.get('student_id')
    detected_uuid = body.get('detected_uuid')
    rssi = body.get('rssi')
    if not student_id or not detected_uuid:
        return response(400, {"error": "missing student_id or detected_uuid"})
    session, err = validateBeacon(detected_uuid, rssi)
    if err:
        return response(403, {"error": err})
    session_id = session['session_id']
    if rssi is not None:
        try:
            if int(rssi) < -75:
                return response(403, {"error": "device too far (rssi weak)"})
        except:
            pass
    if checkDuplicateAttendance(student_id, session_id):
        return response(200, {"message": "already checked-in", "student_id": student_id, "session_id": session_id})
    record_id = str(uuid.uuid4())
    item = {
        'student_id': student_id,
        'session_id': session_id,
        'record_id': record_id,
        'timestamp': now_iso(),
        'status': 'Present'
    }
    attendance_table.put_item(Item=item)
    return response(200, {"message": "attendance recorded", "record": item})

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
# 11) Close Session
# -------------------------

def closeSession(event, context=None):
    body = parse_body(event)
    session_id = body.get('session_id')
    if not session_id:
        return response(400, {"error": "missing session_id"})
    
    end_time = now_iso()  # เวลาประเทศไทยปัจจุบัน
    try:
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
            "end_time": end_time
        })
    except Exception as e:
        return response(500, {"error": str(e)})

# -------------------------
# Lambda handler
# -------------------------
def lambda_handler(event, context):
    # เลือกฟังก์ชันจาก event['action'] เช่น 'createUser', 'markAttendance', ...
    action = event.get('action')
    if not action:
        return response(400, {"error": "missing action"})
    
    if action == 'createUser':
        return createUser(event, context)
    elif action == 'getUser':
        return getUser(event, context)
    elif action == 'createSession':
        return createSession(event, context)
    elif action == 'getSessionByUUID':
        return getSessionByUUID(event, context)
    elif action == 'getActiveSession':
        return getActiveSession(event, context)
    elif action == 'markAttendance':
        return markAttendance(event, context)
    elif action == 'getAttendanceBySession':
        return getAttendanceBySession(event, context)
    elif action == 'getAttendanceByStudent':
        return getAttendanceByStudent(event, context)
    elif action == 'closeSession':
        return closeSession(event, context)
    else:
        return response(400, {"error": f"unknown action {action}"})
