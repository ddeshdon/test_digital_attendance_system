// config.example.js - TEMPLATE FILE (committed to Git)
// Copy this file to config.js and update with your local settings

const API_CONFIG = {
  // For local development: Use your computer's IP address
  // Find your computer IP: Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
  // Example: 'http://192.168.1.105:5000/api'
  LOCAL_API_URL: "http://YOUR_COMPUTER_IP_HERE:5000/api",

  // For production: Use AWS API Gateway endpoint
  PRODUCTION_API_URL:
    // Example: "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod",
    "https://your-api-id.execute-api.us-east-1.amazonaws.com/prod",

  // Toggle between local and production
  USE_LOCAL: true,
};

export default API_CONFIG;
