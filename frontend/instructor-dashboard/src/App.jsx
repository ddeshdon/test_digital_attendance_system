import React, { useState } from 'react';
import { Layout, Typography, Space, Divider } from 'antd';
import SessionManager from './components/SessionManager';
import AttendanceList from './components/AttendanceList';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

function App() {
  const [currentSession, setCurrentSession] = useState(null);

  const handleSessionChange = (session) => {
    setCurrentSession(session);
  };

  return (
    <Layout 
      className="layout" 
      style={{ 
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Background image overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url(${process.env.PUBLIC_URL}/siit-building.jpg)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.08,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0 50px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img 
            src={`${process.env.PUBLIC_URL}/siit-logo.png`}
            alt="SIIT Logo" 
            className="siit-logo"
          />
          <Title className="header-title">
            Digital Attendance System
          </Title>
        </div>
      </Header>

      <Content style={{ padding: '50px' }}>
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          padding: 40, 
          minHeight: 600, 
          borderRadius: '24px',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(107, 33, 168, 0.08)',
          border: '1px solid rgba(255, 255, 255, 0.4)'
        }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div className="dashboard-title-container">
              <Title className="dashboard-title">
                Instructor Dashboard
              </Title>
              <Text className="dashboard-subtitle">
                Manage attendance sessions using Bluetooth beacon technology
              </Text>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <Title level={4} className="section-title">
                How it works:
              </Title>
              
              <div className="how-it-works-container">
                <div className="how-it-works-step">
                  <div className="step-content">
                    <div className="step-number">1</div>
                    <div className="step-image-placeholder">
                      Beacon App
                      <br />Image
                    </div>
                    <div className="step-title">Setup Beacon</div>
                    <div className="step-description">
                      Use <strong>Beacon Simulator</strong> app on your iPhone/iPad to generate a beacon
                    </div>
                  </div>
                </div>

                <div className="how-it-works-step">
                  <div className="step-content">
                    <div className="step-number">2</div>
                    <div className="step-image-placeholder">
                      Copy UUID
                      <br />Image
                    </div>
                    <div className="step-title">Copy UUID</div>
                    <div className="step-description">
                      Copy the UUID and start an attendance session in the dashboard
                    </div>
                  </div>
                </div>

                <div className="how-it-works-step">
                  <div className="step-content">
                    <div className="step-number">3</div>
                    <div className="step-image-placeholder">
                      Student Scan
                      <br />Image
                    </div>
                    <div className="step-title">Student Check-in</div>
                    <div className="step-description">
                      Students scan for your beacon or enter the UUID manually in their app
                    </div>
                  </div>
                </div>

                <div className="how-it-works-step">
                  <div className="step-content">
                    <div className="step-number">4</div>
                    <div className="step-image-placeholder">
                      Monitor
                      <br />Image
                    </div>
                    <div className="step-title">Monitor Attendance</div>
                    <div className="step-description">
                      Monitor real-time attendance as students check in to your session
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <Title level={4} className="section-title">
                Setup Instructions:
              </Title>
              
              <div className="setup-instructions-container">
                <div className="setup-instruction-step">
                  <div className="setup-step-number">1</div>
                  <div className="setup-step-title">Open Beacon Simulator app on your iPhone/iPad</div>
                  <div className="setup-step-description">
                    Download and launch the <strong>Beacon Simulator</strong> app from the App Store
                  </div>
                </div>

                <div className="setup-instruction-step">
                  <div className="setup-step-number">2</div>
                  <div className="setup-step-title">Copy the UUID from the app (use the share button)</div>
                  <div className="setup-step-description">
                    Use the share feature in the app to copy the beacon's <strong>UUID</strong>
                  </div>
                </div>

                <div className="setup-instruction-step">
                  <div className="setup-step-number">3</div>
                  <div className="setup-step-title">Paste it in the Beacon UUID field below</div>
                  <div className="setup-step-description">
                    Enter the copied UUID in the session creation form
                  </div>
                </div>

                <div className="setup-instruction-step">
                  <div className="setup-step-number">4</div>
                  <div className="setup-step-title">Fill in class and room details</div>
                  <div className="setup-step-description">
                    Complete the <strong>course information</strong> and classroom details
                  </div>
                </div>

                <div className="setup-instruction-step">
                  <div className="setup-step-number">5</div>
                  <div className="setup-step-title">Set attendance window duration</div>
                  <div className="setup-step-description">
                    Choose how long students have to <strong>check in</strong> to the session
                  </div>
                </div>

                <div className="setup-instruction-step">
                  <div className="setup-step-number">6</div>
                  <div className="setup-step-title">Click Start to begin attendance session</div>
                  <div className="setup-step-description">
                    Begin monitoring <strong>real-time attendance</strong> as students join
                  </div>
                </div>
              </div>
            </div>

            <SessionManager onSessionChange={handleSessionChange} />
            
            <Divider />
            
            <AttendanceList session={currentSession} />
          </Space>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center' }}>
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.8)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          Digital Attendance System ©2025 - Academic Capstone Project
        </Text>
        <br />
        <Text style={{ 
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '12px'
        }}>
          Sirindhorn International Institute of Technology, Thammasat University
        </Text>
      </Footer>
    </Layout>
  );
}

export default App;