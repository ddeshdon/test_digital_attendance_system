import API_CONFIG from "./config";

const API_BASE_URL = API_CONFIG.USE_LOCAL
  ? API_CONFIG.LOCAL_API_URL
  : API_CONFIG.PRODUCTION_API_URL;

// API Service Layer for Instructor Dashboard
/*const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod";
*/

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
      console.log(`API Base URL: ${this.baseURL}`);

      const response = await fetch(this.baseURL, config);
      const result = await response.json();

      console.log(`API Response Status: ${response.status}`);
      console.log(`API Response:`, result);

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      return result;
    } catch (error) {
      console.error("API request failed:", error);
      console.error("Error details:", error.message);

      // Don't use mock data in production - throw the actual error
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  getMockResponse(action) {
    // Mock responses for development
    if (action === "createSession") {
      return {
        session: {
          session_id: "DES424-2025-10-29T18-02-30",
          class_id: "DES424",
          room_id: "R602",
          beacon_uuid: "D001A2B6-AA1F-4860-9E43-FC83C418FC58",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          status: "open",
          instructor_id: "instructor123",
        },
        success: true
      };
    }

    if (action === "getAttendanceBySession") {
      return {
        attendance: [
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
        ]
      };
    }

    return { success: false, message: "Mock action not implemented" };
  }
}

// Session Management API
export const sessionAPI = {
  startSession: async (sessionData) => {
    const api = new APIService();
    return await api.request("createSession", {
      class_id: sessionData.class_id,
      teacher_id: sessionData.instructor_id || 'instructor123',
      beacon_uuid: sessionData.beacon_uuid,
      attendance_window_minutes: sessionData.attendance_window_minutes || 5
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
};

// Attendance Management API
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

    // Generate CSV data from attendance records
    const csvData = (response.attendance || []).map((record) => [
      record.student_id,
      record.student_name || 'N/A',
      new Date(record.timestamp).toLocaleString(),
      record.status || 'present',
      record.check_in_method || 'beacon_scan',
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
  },

  checkIn: async ({ student_id, beacon_uuid }) => {
    const api = new APIService();
    return await api.request("markAttendance", {
      student_id,
      beacon_uuid
    });
  },
};
