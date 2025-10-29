from datetime import datetime, timedelta
import uuid
import json
from typing import Dict, List, Optional
from config import Config

class AttendanceSession:
    def __init__(self, session_data: Dict):
        self.session_id = session_data['session_id']
        self.class_id = session_data['class_id']
        self.room_id = session_data['room_id']
        self.beacon_uuid = session_data['beacon_uuid']
        self.instructor_id = session_data.get('instructor_id', 'unknown')
        self.start_time = session_data.get('start_time', datetime.now().isoformat())
        
        # Calculate end time based on attendance window
        duration_minutes = session_data.get('attendance_window_minutes', Config.DEFAULT_SESSION_DURATION_MINUTES)
        start_dt = datetime.fromisoformat(self.start_time.replace('Z', '+00:00'))
        end_dt = start_dt + timedelta(minutes=duration_minutes)
        self.end_time = end_dt.isoformat()
        
        self.status = 'open'
        self.created_at = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        return {
            'session_id': self.session_id,
            'class_id': self.class_id,
            'room_id': self.room_id,
            'beacon_uuid': self.beacon_uuid,
            'instructor_id': self.instructor_id,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'status': self.status,
            'created_at': self.created_at
        }

    def is_active(self) -> bool:
        now = datetime.now()
        end_dt = datetime.fromisoformat(self.end_time.replace('Z', '+00:00'))
        return now <= end_dt and self.status == 'open'

    def close_session(self):
        self.status = 'closed'

class AttendanceRecord:
    def __init__(self, record_data: Dict):
        self.attendance_id = record_data.get('attendance_id', str(uuid.uuid4()))
        self.student_id = record_data['student_id']
        self.session_id = record_data['session_id']
        self.timestamp = record_data.get('timestamp', datetime.now().isoformat())
        self.status = record_data.get('status', 'present')
        self.check_in_method = record_data.get('check_in_method', 'beacon_scan')
        self.beacon_data = record_data.get('beacon_data', {})
        
        # Get student info from config
        student_info = Config.MOCK_STUDENTS.get(self.student_id, {})
        self.student_name = student_info.get('name', f'Student {self.student_id}')

    def to_dict(self) -> Dict:
        return {
            'attendance_id': self.attendance_id,
            'student_id': self.student_id,
            'student_name': self.student_name,
            'session_id': self.session_id,
            'timestamp': self.timestamp,
            'status': self.status,
            'check_in_method': self.check_in_method,
            'beacon_data': self.beacon_data,
            'beacon_distance': self.beacon_data.get('distance')
        }