import React, { useState } from 'react';
import { Layout, Typography, Space, Divider, Alert } from 'antd';
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
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ 
        display: 'flex', 
        alignItems: 'center', 
        background: '#001529',
        padding: '0 50px'
      }}>
        <Title level={3} style={{ color: 'white', margin: 0 }}>
          📡 Digital Attendance System
        </Title>
        <Text style={{ color: '#8c8c8c', marginLeft: 'auto' }}>
          Instructor Dashboard
        </Text>
      </Header>

      <Content style={{ padding: '50px' }}>
        <div style={{ background: '#fff', padding: 24, minHeight: 380 }}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div>
              <Title level={2}>👨‍🏫 Instructor Dashboard</Title>
              <Text type="secondary">
                Manage attendance sessions using Bluetooth beacon technology
              </Text>
            </div>

            <Alert
              message="🎯 How it works:"
              description={
                <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
                  <li>Use <strong>Beacon Simulator</strong> app on your iPhone/iPad to generate a beacon</li>
                  <li>Copy the UUID and start an attendance session</li>
                  <li>Students scan for your beacon or enter the UUID manually</li>
                  <li>Monitor real-time attendance as students check in</li>
                </ol>
              }
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <SessionManager onSessionChange={handleSessionChange} />
            
            <Divider />
            
            <AttendanceList session={currentSession} />
          </Space>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', background: '#f0f2f5' }}>
        <Text type="secondary">
          Digital Attendance System ©2025 - Academic Capstone Project
        </Text>
      </Footer>
    </Layout>
  );
}

export default App;