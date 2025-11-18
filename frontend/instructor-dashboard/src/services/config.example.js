// config.example.js - TEMPLATE FILE (committed to Git)
// Copy this file to config.js and update with your settings

const API_CONFIG = {
  // For local development - dashboard runs on same machine as backend
  LOCAL_API_URL: "http://localhost:5000/api",

  // For production - AWS API Gateway endpoint
  PRODUCTION_API_URL:
    "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod",

  // Toggle: true for local, false for production
  USE_LOCAL: true,
};

export default API_CONFIG;
