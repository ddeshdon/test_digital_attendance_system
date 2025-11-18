import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # AWS settings
    AWS_REGION = os.getenv('AWS_REGION', 'us-east-1')
    DYNAMODB_TABLE_SESSIONS = 'attendance_sessions'
    DYNAMODB_TABLE_ATTENDANCE = 'attendance_records'
    DYNAMODB_TABLE_STUDENTS = 'students'
    
    # Session settings
    DEFAULT_SESSION_DURATION_MINUTES = 5
    MAX_SESSION_DURATION_MINUTES = 60
    
    # Mock data for development
    MOCK_STUDENTS = {
        '6522781713': {
            'name': 'John Doe',
            'email': 'john.doe@university.edu',
            'program': 'Digital Engineering Systems'
        },
        '6522781714': {
            'name': 'Jane Smith', 
            'email': 'jane.smith@university.edu',
            'program': 'Computer Science'
        },
        '6522781715': {
            'name': 'Mike Johnson',
            'email': 'mike.johnson@university.edu', 
            'program': 'Software Engineering'
        }
    }