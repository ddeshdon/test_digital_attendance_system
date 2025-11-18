from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from datetime import datetime
import os
import threading
import time

from services.attendance_service import AttendanceService

def create_app():
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes
    
    # Initialize attendance service
    attendance_service = AttendanceService()
    
    # Background task to clean up expired sessions
    def cleanup_expired_sessions():
        while True:
            time.sleep(60)  # Check every minute
            attendance_service.cleanup_expired_sessions()
    
    cleanup_thread = threading.Thread(target=cleanup_expired_sessions, daemon=True)
    cleanup_thread.start()

    @app.route('/')
    def index():
        return {
            'message': 'Digital Attendance System API',
            'version': '1.0.0',
            'status': 'running',
            'timestamp': datetime.now().isoformat(),
            'endpoints': {
                'session': {
                    'start': 'POST /api/session/start',
                    'end': 'PUT /api/session/end/{session_id}',
                    'status': 'GET /api/session/status/{session_id}'
                },
                'attendance': {
                    'checkin': 'POST /api/attendance/checkin',
                    'list': 'GET /api/attendance/list/{session_id}',
                    'export': 'GET /api/attendance/export/{session_id}'
                },
                'beacon': {
                    'validate': 'POST /api/beacon/validate'
                }
            }
        }

    @app.route('/health')
    def health_check():
        active_sessions = attendance_service.get_active_sessions()
        return {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'active_sessions': len(active_sessions)
        }

    # Session Management Routes
    @app.route('/api/session/start', methods=['POST'])
    def start_session():
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400

            print(f"Starting session with data: {data}")
            
            result = attendance_service.create_session(data)
            status_code = 200 if result['success'] else 400
            
            return jsonify(result), status_code

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    @app.route('/api/session/end/<session_id>', methods=['PUT'])
    def end_session(session_id):
        try:
            result = attendance_service.end_session(session_id)
            status_code = 200 if result['success'] else 404
            
            return jsonify(result), status_code

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    @app.route('/api/session/status/<session_id>', methods=['GET'])
    def get_session_status(session_id):
        try:
            session = attendance_service.sessions.get(session_id)
            
            if not session:
                return jsonify({
                    'success': False,
                    'message': 'Session not found'
                }), 404

            return jsonify({
                'success': True,
                'session': session.to_dict(),
                'is_active': session.is_active()
            })

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    # Attendance Routes
    @app.route('/api/attendance/checkin', methods=['POST'])
    def check_in():
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({
                    'success': False,
                    'message': 'No data provided'
                }), 400

            student_id = data.get('student_id')
            beacon_uuid = data.get('beacon_uuid')

            if not student_id or not beacon_uuid:
                return jsonify({
                    'success': False,
                    'message': 'Missing student_id or beacon_uuid'
                }), 400

            print(f"Check-in request: Student {student_id}, Beacon {beacon_uuid}")
            
            result = attendance_service.check_in_student(student_id, beacon_uuid)
            status_code = 200 if result['success'] else 400
            
            return jsonify(result), status_code

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    @app.route('/api/attendance/list/<session_id>', methods=['GET'])
    def get_attendance_list(session_id):
        try:
            result = attendance_service.get_session_attendance(session_id)
            status_code = 200 if result['success'] else 404
            
            return jsonify(result), status_code

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    @app.route('/api/attendance/export/<session_id>', methods=['GET'])
    def export_attendance(session_id):
        try:
            result = attendance_service.get_session_attendance(session_id)
            
            if not result['success']:
                return jsonify(result), 404

            # Generate CSV data
            records = result['records']
            csv_lines = ['Student ID,Name,Check-in Time,Status,Method,Distance (m)']
            
            for record in records:
                csv_lines.append(
                    f"{record['student_id']},"
                    f"{record['student_name']},"
                    f"{datetime.fromisoformat(record['timestamp']).strftime('%Y-%m-%d %H:%M:%S')},"
                    f"{record['status']},"
                    f"{record['check_in_method']},"
                    f"{record['beacon_distance'] or 'N/A'}"
                )

            return jsonify({
                'success': True,
                'csvData': '\n'.join(csv_lines),
                'filename': f"attendance_{session_id}_{datetime.now().strftime('%Y%m%d')}.csv"
            })

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    # Beacon Validation Routes  
    @app.route('/api/beacon/validate', methods=['POST'])
    def validate_beacon():
        try:
            data = request.get_json()
            
            if not data or 'beacon_uuid' not in data:
                return jsonify({
                    'valid': False,
                    'message': 'Missing beacon_uuid'
                }), 400

            beacon_uuid = data['beacon_uuid']
            result = attendance_service.validate_beacon(beacon_uuid)
            
            return jsonify(result)

        except Exception as e:
            return jsonify({
                'valid': False,
                'message': f'Server error: {str(e)}'
            }), 500

    # Development/Testing Routes
    @app.route('/api/sessions/active', methods=['GET'])
    def get_active_sessions():
        try:
            active_sessions = attendance_service.get_active_sessions()
            return jsonify({
                'success': True,
                'active_sessions': active_sessions,
                'total': len(active_sessions)
            })

        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    @app.route('/api/user/register', methods=['POST'])
    def register_user():
        try:
            data = request.get_json()
            
            student_id = data.get('student_id')
            name = data.get('name')
            email = data.get('email')
            password = data.get('password')
            
            # Validate required fields
            if not all([student_id, name, email, password]):
                return jsonify({
                    'success': False,
                    'message': 'Missing required fields'
                }), 400
            
            # Import Config to access MOCK_STUDENTS
            from config import Config
            
            # Check if user already exists
            if student_id in Config.MOCK_STUDENTS:
                return jsonify({
                    'success': False,
                    'message': 'Student ID already registered'
                }), 400
            
            # Add new user to MOCK_STUDENTS
            Config.MOCK_STUDENTS[student_id] = {
                'name': name,
                'email': email,
                'password': password  # In production, hash this!
            }
            
            print(f"New user registered: {student_id} - {name}")
            
            return jsonify({
                'success': True,
                'message': 'Registration successful'
            }), 200
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

    @app.route('/api/user/login', methods=['POST'])
    def login_user():
        try:
            data = request.get_json()
            
            student_id = data.get('student_id')
            password = data.get('password')
            
            # Validate required fields
            if not student_id or not password:
                return jsonify({
                    'success': False,
                    'message': 'Missing student_id or password'
                }), 400
            
            # Import Config to access MOCK_STUDENTS
            from config import Config
            
            # Check if user exists
            student = Config.MOCK_STUDENTS.get(student_id)
            
            if not student:
                return jsonify({
                    'success': False,
                    'message': 'Student ID not found'
                }), 404
            
            # Verify password
            if student.get('password') != password:
                return jsonify({
                    'success': False,
                    'message': 'Invalid password'
                }), 401
            
            print(f"User logged in: {student_id} - {student['name']}")
            
            return jsonify({
                'success': True,
                'message': 'Login successful',
                'student': {
                    'student_id': student_id,
                    'name': student['name'],
                    'email': student['email']
                }
            }), 200
            
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Server error: {str(e)}'
            }), 500

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

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)