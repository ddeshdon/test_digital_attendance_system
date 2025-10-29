import unittest
import json
from datetime import datetime, timedelta
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from services.attendance_service import AttendanceService
from models.attendance import AttendanceSession, AttendanceRecord

class TestAttendanceSystem(unittest.TestCase):
    def setUp(self):
        """Set up test fixtures before each test method."""
        self.attendance_service = AttendanceService()
        
        # Test data
        self.test_session_data = {
            'session_id': 'DES424-2025-10-29T18-02-30',
            'class_id': 'DES424',
            'room_id': 'R602',
            'beacon_uuid': 'D001A2B6-AA1F-4860-9E43-FC83C418FC58',
            'instructor_id': 'instructor123',
            'attendance_window_minutes': 5
        }
        
        self.test_student_id = '6522781713'

    def test_create_session_success(self):
        """Test successful session creation"""
        result = self.attendance_service.create_session(self.test_session_data)
        
        self.assertTrue(result['success'])
        self.assertIn('session', result)
        self.assertEqual(result['session']['class_id'], 'DES424')
        self.assertEqual(result['session']['room_id'], 'R602')
        self.assertEqual(result['session']['beacon_uuid'], 'D001A2B6-AA1F-4860-9E43-FC83C418FC58')

    def test_create_session_missing_fields(self):
        """Test session creation with missing required fields"""
        incomplete_data = {
            'class_id': 'DES424',
            'room_id': 'R602'
            # Missing session_id and beacon_uuid
        }
        
        result = self.attendance_service.create_session(incomplete_data)
        
        self.assertFalse(result['success'])
        self.assertIn('Missing required field', result['message'])

    def test_create_session_duplicate_beacon(self):
        """Test session creation with duplicate beacon UUID"""
        # Create first session
        self.attendance_service.create_session(self.test_session_data)
        
        # Try to create second session with same beacon UUID
        duplicate_data = self.test_session_data.copy()
        duplicate_data['session_id'] = 'DES425-2025-10-29T18-05-30'
        duplicate_data['class_id'] = 'DES425'
        
        result = self.attendance_service.create_session(duplicate_data)
        
        self.assertFalse(result['success'])
        self.assertIn('already in use', result['message'])

    def test_student_checkin_success(self):
        """Test successful student check-in"""
        # Create session first
        self.attendance_service.create_session(self.test_session_data)
        
        # Student check-in
        result = self.attendance_service.check_in_student(
            self.test_student_id,
            self.test_session_data['beacon_uuid']
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['student']['student_id'], self.test_student_id)
        self.assertEqual(result['session']['class_id'], 'DES424')

    def test_student_checkin_no_session(self):
        """Test student check-in with non-existent session"""
        result = self.attendance_service.check_in_student(
            self.test_student_id,
            'NON-EXISTENT-UUID-4860-9E43-FC83C418FC58'
        )
        
        self.assertFalse(result['success'])
        self.assertIn('No active session', result['message'])

    def test_student_checkin_duplicate(self):
        """Test duplicate student check-in"""
        # Create session and first check-in
        self.attendance_service.create_session(self.test_session_data)
        self.attendance_service.check_in_student(
            self.test_student_id,
            self.test_session_data['beacon_uuid']
        )
        
        # Try to check-in again
        result = self.attendance_service.check_in_student(
            self.test_student_id,
            self.test_session_data['beacon_uuid']
        )
        
        self.assertFalse(result['success'])
        self.assertIn('already checked in', result['message'])

    def test_get_session_attendance(self):
        """Test retrieving session attendance"""
        # Create session and add attendance
        self.attendance_service.create_session(self.test_session_data)
        self.attendance_service.check_in_student(
            self.test_student_id,
            self.test_session_data['beacon_uuid']
        )
        
        result = self.attendance_service.get_session_attendance(
            self.test_session_data['session_id']
        )
        
        self.assertTrue(result['success'])
        self.assertEqual(result['total_present'], 1)
        self.assertEqual(len(result['records']), 1)
        self.assertEqual(result['records'][0]['student_id'], self.test_student_id)

    def test_session_expiry(self):
        """Test session expiry functionality"""
        # Create session with very short duration
        expired_session_data = self.test_session_data.copy()
        expired_session_data['attendance_window_minutes'] = 0.01  # Very short for testing
        
        self.attendance_service.create_session(expired_session_data)
        
        # Wait a moment for session to expire
        import time
        time.sleep(0.1)
        
        # Try to check-in to expired session
        result = self.attendance_service.check_in_student(
            self.test_student_id,
            expired_session_data['beacon_uuid']
        )
        
        self.assertFalse(result['success'])
        self.assertIn('expired', result['message'])

    def test_beacon_validation(self):
        """Test beacon UUID validation"""
        # Create session
        self.attendance_service.create_session(self.test_session_data)
        
        # Test valid beacon
        result = self.attendance_service.validate_beacon(self.test_session_data['beacon_uuid'])
        self.assertTrue(result['valid'])
        
        # Test invalid beacon
        result = self.attendance_service.validate_beacon('INVALID-UUID-4860-9E43-FC83C418FC58')
        self.assertFalse(result['valid'])

    def test_end_session(self):
        """Test ending a session"""
        # Create session
        self.attendance_service.create_session(self.test_session_data)
        
        # End session
        result = self.attendance_service.end_session(self.test_session_data['session_id'])
        
        self.assertTrue(result['success'])
        
        # Verify session is no longer active
        session = self.attendance_service.sessions.get(self.test_session_data['session_id'])
        self.assertEqual(session.status, 'closed')

class TestPerformance(unittest.TestCase):
    def setUp(self):
        """Set up performance test fixtures"""
        self.attendance_service = AttendanceService()

    def test_concurrent_checkins(self):
        """Test system performance with multiple concurrent check-ins"""
        import threading
        import time
        
        # Create test session
        session_data = {
            'session_id': 'PERF-TEST-2025-10-29',
            'class_id': 'PERF101',
            'room_id': 'R999',
            'beacon_uuid': 'PERF-TEST-UUID-4860-9E43-FC83C418FC58',
            'instructor_id': 'instructor123',
            'attendance_window_minutes': 10
        }
        
        self.attendance_service.create_session(session_data)
        
        # Simulate multiple students checking in concurrently
        results = []
        start_time = time.time()
        
        def check_in_student(student_id):
            result = self.attendance_service.check_in_student(
                f'student_{student_id}',
                session_data['beacon_uuid']
            )
            results.append(result)
        
        # Create threads for concurrent check-ins
        threads = []
        num_students = 10
        
        for i in range(num_students):
            thread = threading.Thread(target=check_in_student, args=(i,))
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # Verify results
        successful_checkins = sum(1 for result in results if result['success'])
        
        self.assertEqual(successful_checkins, num_students)
        self.assertLess(execution_time, 5.0)  # Should complete within 5 seconds
        
        print(f"Performance test: {num_students} concurrent check-ins completed in {execution_time:.2f} seconds")

if __name__ == '__main__':
    # Create test suite
    test_suite = unittest.TestSuite()
    
    # Add test cases
    test_suite.addTest(unittest.makeSuite(TestAttendanceSystem))
    test_suite.addTest(unittest.makeSuite(TestPerformance))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(test_suite)
    
    # Print summary
    print(f"\n{'='*50}")
    print(f"Test Summary:")
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print(f"Success rate: {((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun * 100):.1f}%")
    print(f"{'='*50}")