import API_CONFIG from "./config";

const API_BASE_URL = API_CONFIG.USE_LOCAL
  ? API_CONFIG.LOCAL_API_URL
  : API_CONFIG.PRODUCTION_API_URL;

// API Service Layer for Student App - Action-based calls
class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(action, data = {}) {
    const payload = {
      action: action,
      ...data
    };

    const config = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload)
    };

    try {
      console.log(`API Request - Action: ${action}`, payload);

      const response = await fetch(this.baseURL, config);
      const result = await response.json();

      console.log(`API Response:`, result);

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      return result;
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}

// User Management API
export const userAPI = {
  createUser: async (userData) => {
    const api = new APIService();
    return await api.request("createUser", {
      student_id: userData.student_id,
      name: userData.name,
      role: userData.role || "student"
    });
  },

  getUser: async (studentId) => {
    const api = new APIService();
    return await api.request("getUser", {
      student_id: studentId
    });
  },

  // Login function - checks if user exists
  login: async (studentId) => {
    const api = new APIService();
    try {
      const result = await api.request("getUser", {
        student_id: studentId
      });
      return result;
    } catch (error) {
      // If user doesn't exist, return error
      throw error;
    }
  }
};

// Session Management API
export const sessionAPI = {
  getActiveSession: async () => {
    const api = new APIService();
    return await api.request("getActiveSession");
  },

  getSessionByUUID: async (sessionId) => {
    const api = new APIService();
    return await api.request("getSessionByUUID", {
      session_id: sessionId
    });
  }
};

// Attendance Management API
export const attendanceAPI = {
  markAttendance: async ({ student_id, beacon_uuid }) => {
    const api = new APIService();
    return await api.request("markAttendance", {
      student_id,
      beacon_uuid
    });
  },

  // Alias for checkIn method used in components
  checkIn: async ({ student_id, beacon_uuid }) => {
    const api = new APIService();
    return await api.request("markAttendance", {
      student_id,
      beacon_uuid
    });
  },

  getAttendanceByStudent: async (studentId) => {
    const api = new APIService();
    return await api.request("getAttendanceByStudent", {
      student_id: studentId
    });
  },

  // Beacon validation for attendance
  validateBeacon: async ({ student_id, beacon_uuid, beacon_distance }) => {
    const api = new APIService();
    return await api.request("markAttendance", {
      student_id,
      beacon_uuid,
      beacon_distance
    });
  }
};