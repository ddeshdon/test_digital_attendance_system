// API Service for Student App
import AsyncStorage from '@react-native-async-storage/async-storage';

// COMMENTED OUT FOR TESTING - AWS API Gateway endpoint requires deployment
// const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod';
// For development/testing, use local server:
const API_BASE_URL = 'http://localhost:5000/api';

class StudentAPIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`API Request: ${options.method || 'GET'} ${url}`);
      
      const response = await fetch(url, config);
      const data = await response.json();
      
      console.log('API Response:', data);
      
      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      
      // Return mock data for development/testing
      if (__DEV__) {
        return this.getMockResponse(endpoint, options.method, options.body);
      }
      
      throw error;
    }
  }

  getMockResponse(endpoint, method, body) {
    if (endpoint === '/attendance/checkin' && method === 'POST') {
      const requestData = JSON.parse(body);
      
      // Simulate different scenarios based on UUID
      if (requestData.beacon_uuid === 'D001A2B6-AA1F-4860-9E43-FC83C418FC58') {
        return {
          success: true,
          message: 'Attendance marked successfully',
          session: {
            class_id: 'DES424',
            room_id: 'R602',
            class_name: 'Digital Engineering Systems'
          },
          student: {
            student_id: requestData.student_id,
            name: 'John Doe'
          },
          timestamp: new Date().toISOString()
        };
      } else if (requestData.beacon_uuid === 'EXPIRED-UUID-4860-9E43-FC83C418FC58') {
        return {
          success: false,
          message: 'Session has expired or is not active'
        };
      } else {
        return {
          success: false,
          message: 'No active session found for this beacon'
        };
      }
    }

    if (endpoint === '/beacon/validate' && method === 'POST') {
      const requestData = JSON.parse(body);
      return {
        valid: requestData.beacon_uuid.startsWith('D001A2B6'),
        message: requestData.beacon_uuid.startsWith('D001A2B6') ? 
          'Valid session UUID' : 'Invalid or expired UUID'
      };
    }

    return { success: false, message: 'Mock endpoint not implemented' };
  }

  async getStoredStudentId() {
    try {
      const studentId = await AsyncStorage.getItem('student_id');
      return studentId || '6522781713'; // Default for demo
    } catch (error) {
      console.error('Error getting stored student ID:', error);
      return '6522781713';
    }
  }

  async setStoredStudentId(studentId) {
    try {
      await AsyncStorage.setItem('student_id', studentId);
    } catch (error) {
      console.error('Error storing student ID:', error);
    }
  }
}

// Attendance API
export const attendanceAPI = {
  checkIn: async ({ student_id, beacon_uuid }) => {
    const api = new StudentAPIService();
    return await api.request('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({
        student_id,
        beacon_uuid
      }),
    });
  },

  validateBeacon: async (beaconUUID) => {
    const api = new StudentAPIService();
    return await api.request('/beacon/validate', {
      method: 'POST',
      body: JSON.stringify({ beacon_uuid: beaconUUID }),
    });
  },

  getStoredStudentId: async () => {
    const api = new StudentAPIService();
    return await api.getStoredStudentId();
  },

  setStoredStudentId: async (studentId) => {
    const api = new StudentAPIService();
    return await api.setStoredStudentId(studentId);
  }
};