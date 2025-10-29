# Digital Attendance System - Beacon-Based

## 🎯 Project Overview
A cloud-based attendance system that uses Bluetooth beacons to verify student presence in specific classrooms. The system prevents attendance fraud by ensuring students are physically present near the classroom beacon.

## 📋 System Flow
1. **Professor** starts session using Beacon Simulator app UUID
2. **Students** scan for beacon or enter session code manually
3. **Backend** matches UUIDs and time windows to mark attendance
4. **Dashboard** shows real-time attendance monitoring

## 🏗️ Architecture
- **Frontend**: React.js (Instructor Dashboard) + React Native (Student App)
- **Backend**: Python Flask/FastAPI with AWS Lambda
- **Database**: AWS DynamoDB for real-time data + PostgreSQL for analytics
- **Cloud**: AWS (API Gateway, Lambda, DynamoDB, S3, CloudFront)

## 📱 Demo Setup
### Professor Setup:
1. Open **Beacon Simulator** app on iPhone/iPad
2. Copy the generated UUID
3. Open instructor dashboard → Start Session
4. Paste UUID, enter class details
5. Students can now check in

### Student Check-in:
1. Open student attendance app
2. Tap "Scan for Beacon" (detects nearby beacons)
3. OR tap "Manual Entry" and paste UUID
4. Confirm attendance marking

## 🚀 Tech Stack
- **Web Dashboard**: React.js + Ant Design + TypeScript
- **Mobile App**: React Native + Expo
- **Backend**: Python + Flask/FastAPI
- **Database**: DynamoDB + PostgreSQL
- **Deployment**: AWS Academy Learner Lab
- **Testing**: Jest + Cypress + pytest

## 📁 Project Structure
```
digital_attendance_system/
├── frontend/
│   ├── instructor-dashboard/    # React.js web app
│   └── student-app/            # React Native mobile app
├── backend/                    # Python Flask API
├── documentation/              # Project docs and guides
├── testing/                   # Test files and scripts
└── deployment/                # AWS deployment scripts
```

## 🎓 Academic Requirements Covered
✅ Real cloud deployment on AWS  
✅ Beacon-based location verification  
✅ Real-time attendance monitoring  
✅ GitHub repository with documentation  
✅ Performance testing and evaluation  
✅ Complete presentation materials  

## 🛠️ Development Setup
See individual README files in each component directory for setup instructions.

## 📊 Demo Data
- **Class**: DES424
- **Room**: R602  
- **Sample Beacon UUID**: D001A2B6-AA1F-4860-9E43-FC83C418FC58
- **Student ID**: 6522781713

---
**Built for Academic Capstone Project - Digital Engineering Systems**