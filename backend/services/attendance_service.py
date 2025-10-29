from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid
from models.attendance import AttendanceSession, AttendanceRecord

class AttendanceService:
    def __init__(self):
        # In-memory storage for development (replace with DynamoDB in production)
        self.sessions = {}  # session_id -> AttendanceSession
        self.attendance_records = []  # List of AttendanceRecord objects
        self.beacon_to_session = {}  # beacon_uuid -> session_id mapping

    def create_session(self, session_data: Dict) -> Dict:
        """
        Create a new attendance session
        """
        try:
            # Validate required fields
            required_fields = ['session_id', 'class_id', 'room_id', 'beacon_uuid']
            for field in required_fields:
                if field not in session_data:
                    return {
                        'success': False,
                        'message': f'Missing required field: {field}'
                    }

            # Check if beacon UUID is already in use
            if session_data['beacon_uuid'] in self.beacon_to_session:
                existing_session_id = self.beacon_to_session[session_data['beacon_uuid']]
                existing_session = self.sessions.get(existing_session_id)
                
                if existing_session and existing_session.is_active():
                    return {
                        'success': False,
                        'message': 'This beacon UUID is already in use by an active session'
                    }

            # Create new session
            session = AttendanceSession(session_data)
            
            # Store session
            self.sessions[session.session_id] = session
            self.beacon_to_session[session.beacon_uuid] = session.session_id

            return {
                'success': True,
                'message': 'Session created successfully',
                'session': session.to_dict()
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'Error creating session: {str(e)}'
            }

    def end_session(self, session_id: str) -> Dict:
        """
        End an attendance session
        """
        try:
            session = self.sessions.get(session_id)
            
            if not session:
                return {
                    'success': False,
                    'message': 'Session not found'
                }

            session.close_session()
            
            # Remove beacon mapping
            if session.beacon_uuid in self.beacon_to_session:
                del self.beacon_to_session[session.beacon_uuid]

            return {
                'success': True,
                'message': 'Session ended successfully'
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'Error ending session: {str(e)}'
            }

    def check_in_student(self, student_id: str, beacon_uuid: str) -> Dict:
        """
        Process student check-in using beacon UUID
        """
        try:
            # Find active session for this beacon
            session_id = self.beacon_to_session.get(beacon_uuid)
            
            if not session_id:
                return {
                    'success': False,
                    'message': 'No active session found for this beacon'
                }

            session = self.sessions.get(session_id)
            
            if not session:
                return {
                    'success': False,
                    'message': 'Session not found'
                }

            # Check if session is still active
            if not session.is_active():
                return {
                    'success': False,
                    'message': 'Session has expired or is not active'
                }

            # Check for duplicate check-in
            existing_record = next((
                record for record in self.attendance_records
                if record.student_id == student_id and record.session_id == session_id
            ), None)

            if existing_record:
                return {
                    'success': False,
                    'message': 'You have already checked in for this session'
                }

            # Create attendance record
            attendance_data = {
                'student_id': student_id,
                'session_id': session_id,
                'check_in_method': 'beacon_scan',
                'beacon_data': {
                    'beacon_uuid': beacon_uuid,
                    'timestamp': datetime.now().isoformat()
                }
            }

            record = AttendanceRecord(attendance_data)
            self.attendance_records.append(record)

            return {
                'success': True,
                'message': 'Attendance marked successfully',
                'session': {
                    'class_id': session.class_id,
                    'room_id': session.room_id,
                    'class_name': f'{session.class_id} - {session.room_id}'
                },
                'student': {
                    'student_id': student_id,
                    'name': record.student_name
                },
                'timestamp': record.timestamp
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'Error during check-in: {str(e)}'
            }

    def get_session_attendance(self, session_id: str) -> Dict:
        """
        Get attendance records for a specific session
        """
        try:
            session = self.sessions.get(session_id)
            
            if not session:
                return {
                    'success': False,
                    'message': 'Session not found'
                }

            # Get all attendance records for this session
            session_records = [
                record.to_dict() for record in self.attendance_records
                if record.session_id == session_id
            ]

            return {
                'success': True,
                'session': session.to_dict(),
                'records': session_records,
                'total_present': len(session_records)
            }

        except Exception as e:
            return {
                'success': False,
                'message': f'Error retrieving attendance: {str(e)}'
            }

    def get_active_sessions(self) -> List[Dict]:
        """
        Get all active sessions
        """
        active_sessions = [
            session.to_dict() for session in self.sessions.values()
            if session.is_active()
        ]
        return active_sessions

    def validate_beacon(self, beacon_uuid: str) -> Dict:
        """
        Validate if a beacon UUID has an active session
        """
        session_id = self.beacon_to_session.get(beacon_uuid)
        
        if not session_id:
            return {
                'valid': False,
                'message': 'No session found for this beacon'
            }

        session = self.sessions.get(session_id)
        
        if not session or not session.is_active():
            return {
                'valid': False,
                'message': 'Session is not active or has expired'
            }

        return {
            'valid': True,
            'message': f'Valid session for {session.class_id} in {session.room_id}',
            'session': session.to_dict()
        }

    def cleanup_expired_sessions(self):
        """
        Clean up expired sessions and their beacon mappings
        """
        expired_sessions = []
        
        for session_id, session in self.sessions.items():
            if not session.is_active() and session.status == 'open':
                session.close_session()
                expired_sessions.append(session_id)
                
                # Remove beacon mapping
                if session.beacon_uuid in self.beacon_to_session:
                    del self.beacon_to_session[session.beacon_uuid]

        return expired_sessions