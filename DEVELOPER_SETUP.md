# Developer Setup Instructions

## Prerequisites

- Node.js 18+
- Python 3.9+
- iPhone/Android phone with Expo Go app

## Backend Setup

```bash
cd backend/flask
pip install -r requirements.txt
python app.py
```

Backend runs on: http://localhost:5000

## Instructor Dashboard Setup

```bash
cd frontend/instructor-dashboard

# 1. Copy config template
cp src/services/config.example.js src/services/config.js

# 2. Edit config.js (no changes needed for dashboard - uses localhost)

# 3. Install and run
npm install
npm start
```

Dashboard runs on: http://localhost:3000

## Student App Setup

```bash
cd frontend/student-app

# 1. Copy config template
cp src/services/config.example.js src/services/config.js

# 2. Edit config.js and add YOUR computer's IP
# Find your IP:
#   Windows: ipconfig
#   Mac/Linux: ifconfig
#
# Update LOCAL_API_URL in config.js:
#   LOCAL_API_URL: 'http://YOUR_IP_HERE:5000/api'
#   Example: 'http://192.168.1.105:5000/api'

# 3. Install and run
npm install
npm start

# 4. Scan QR code with Expo Go app
```

## Testing

1. Make sure phone and computer are on same WiFi
2. Start backend (Terminal 1)
3. Start dashboard (Terminal 2)
4. Start student app (Terminal 3)
5. Test the complete flow!

## Important Notes

- **config.js files are NOT committed to Git** (contains personal IPs)
- **config.example.js files ARE committed** (templates for everyone)
- Each developer creates their own config.js from the template
- For production: Set USE_LOCAL to false in config.js
