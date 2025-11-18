import API_CONFIG from "./config";

const API_BASE_URL = API_CONFIG.USE_LOCAL
  ? API_CONFIG.LOCAL_API_URL
  : API_CONFIG.PRODUCTION_API_URL;

// API Service Layer for Instructor Dashboard - Action-based calls
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

      // Return mock data for development
      if (process.env.NODE_ENV === "development") {
        return this.getMockResponse(action, data);
      }

      throw error;
    }
  }

  getMockResponse(action, data) {
    // Mock responses for development
    if (action === "createSession") {
      return {
        session_id: "DES424-2025-10-29T18-02-30",
        class_id: data.class_id || "DES424",
        room_id: data.room_id || "R602",
        beacon_uuid: "D001A2B6-AA1F-4860-9E43-FC83C418FC58",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        status: "open",
        instructor_id: data.instructor_id || "instructor123",
      };
    }

    if (action === "getAttendanceBySession") {
      return {
        records: [
          {
            attendance_id: "att_001",
            student_id: "6522781713",
            student_name: "John Doe",
            timestamp: new Date().toISOString(),
            status: "present",
            check_in_method: "beacon_scan",
            beacon_distance: 1.2,
          },
          {
            attendance_id: "att_002",
            student_id: "6522781714",
            student_name: "Jane Smith",
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            status: "present",
            check_in_method: "manual_entry",
            beacon_distance: null,
          },
        ],
      };
    }

    return { error: "Mock endpoint not implemented" };
  }
}

// Session Management API - Action-based
export const sessionAPI = {
  startSession: async (sessionData) => {
    const api = new APIService();
    return await api.request("createSession", {
      class_id: sessionData.class_id,
      class_name: sessionData.class_name,
      teacher_id: sessionData.instructor_id || sessionData.teacher_id,
      room_id: sessionData.room_id,
      beacon_uuid: sessionData.beacon_uuid,
      attendance_window_minutes: sessionData.attendance_window_minutes
    });
  },

  endSession: async (sessionId) => {
    const api = new APIService();
    return await api.request("closeSession", {
      session_id: sessionId
    });
  },

  getSessionStatus: async (sessionId) => {
    const api = new APIService();
    return await api.request("getSessionByUUID", {
      session_id: sessionId
    });
  },

  getActiveSession: async () => {
    const api = new APIService();
    return await api.request("getActiveSession");
  }
};

// Attendance Management API - Action-based
export const attendanceAPI = {
  getAttendanceList: async (sessionId) => {
    const api = new APIService();
    return await api.request("getAttendanceBySession", {
      session_id: sessionId
    });
  },

  exportAttendance: async (sessionId) => {
    const api = new APIService();
    const response = await api.request("getAttendanceBySession", {
      session_id: sessionId
    });

    // Generate CSV data from the response
    if (response.records) {
      const csvData = response.records.map((record) => [
        record.student_id,
        record.student_name || 'Unknown',
        new Date(record.timestamp).toLocaleString(),
        record.status,
        record.check_in_method || 'unknown',
        record.beacon_distance || "N/A",
      ]);

      const headers = [
        "Student ID",
        "Name", 
        "Check-in Time",
        "Status",
        "Method",
        "Distance (m)",
      ];
      const csvContent = [headers, ...csvData]
        .map((row) => row.join(","))
        .join("\n");

      return { csvData: csvContent };
    }

    return { csvData: "No attendance records found" };
  },

  checkIn: async ({ student_id, beacon_uuid }) => {
    const api = new APIService();
    return await api.request("markAttendance", {
      student_id,
      beacon_uuid
    });
  },

  getAllSessions: async () => {
    const api = new APIService();
    return await api.request("getAllSessions");
  },

  getAllAttendance: async () => {
    const api = new APIService();
    return await api.request("getAllAttendance");
  },

  exportToS3: async (exportType = 'attendance') => {
    const api = new APIService();
    return await api.request("exportToS3", {
      export_type: exportType
    });
  },
};

// User Management API - Action-based
export const userAPI = {
  createUser: async (userData) => {
    const api = new APIService();
    return await api.request("createUser", {
      student_id: userData.student_id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
      password: userData.password
    });
  },

  getUser: async (studentId) => {
    const api = new APIService();
    return await api.request("getUser", {
      student_id: studentId
    });
  },

  loginUser: async (credentials) => {
    const api = new APIService();
    return await api.request("loginUser", {
      email: credentials.email,
      username: credentials.username,
      password: credentials.password
    });
  }
};