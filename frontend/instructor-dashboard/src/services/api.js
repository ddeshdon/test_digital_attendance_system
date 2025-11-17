// API Service Layer for Instructor Dashboard
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod";

class APIService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(
        `API Request: ${options.method || "GET"} ${url}`,
        config.body
      );

      const response = await fetch(url, config);
      const data = await response.json();

      console.log(`API Response:`, data);

      if (!response.ok) {
        throw new Error(
          data.message || `HTTP error! status: ${response.status}`
        );
      }

      return data;
    } catch (error) {
      console.error("API request failed:", error);

      // Return mock data for development
      if (process.env.NODE_ENV === "development") {
        return this.getMockResponse(endpoint, options.method);
      }

      throw error;
    }
  }

  getMockResponse(endpoint, method) {
    // Mock responses for development
    if (endpoint === "/session/start" && method === "POST") {
      return {
        success: true,
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
      };
    }

    if (endpoint.includes("/attendance/list/")) {
      return {
        success: true,
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

    return { success: false, message: "Mock endpoint not implemented" };
  }
}

// Session Management API
export const sessionAPI = {
  startSession: async (sessionData) => {
    const api = new APIService();
    return await api.request("/session/start", {
      method: "POST",
      body: JSON.stringify(sessionData),
    });
  },

  endSession: async (sessionId) => {
    const api = new APIService();
    return await api.request(`/session/end/${sessionId}`, {
      method: "PUT",
    });
  },

  getSessionStatus: async (sessionId) => {
    const api = new APIService();
    return await api.request(`/session/status/${sessionId}`);
  },
};

// Attendance Management API
export const attendanceAPI = {
  getAttendanceList: async (sessionId) => {
    const api = new APIService();
    return await api.request(`/attendance/list/${sessionId}`);
  },

  exportAttendance: async (sessionId) => {
    const api = new APIService();
    const response = await api.request(`/attendance/export/${sessionId}`);

    // Generate CSV data
    const csvData = response.records.map((record) => [
      record.student_id,
      record.student_name,
      new Date(record.timestamp).toLocaleString(),
      record.status,
      record.check_in_method,
      record.beacon_distance || "N/A",
    ]);

    // Backend already generates CSV data so just return it
    return { csvData: response.csvData };

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
    return await api.request("/attendance/checkin", {
      method: "POST",
      body: JSON.stringify({
        student_id,
        beacon_uuid,
      }),
    });
  },
};
