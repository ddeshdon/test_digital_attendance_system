import React, { useState } from 'react';
import {
  Layout,
  Typography,
  Space,
  Divider,
  Card,
  Row,
  Col,
  Tag,
  Button,
  Avatar,
  Dropdown,
  message
} from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  BookOutlined
} from '@ant-design/icons';
import SessionManager from './SessionManager';
import AttendanceList from './AttendanceList';
import AttendanceHistory from './AttendanceHistory';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const Dashboard = ({ instructor, onLogout }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  // Mock class data for Dr. Apichon
  const instructorClasses = [
    {
      id: 'DES424',
      code: 'DES424',
      name: 'Cloud-based Application Development',
      day: 'Wednesday',
      time: '9:00 - 12:00',
      room: 'BKD 3507',
      color: '#8B5CF6'
    },
    {
      id: 'DES431',
      code: 'DES431',
      name: 'Big Data Analytics',
      day: 'Tuesday',
      time: '9:00 - 12:00',
      room: 'BKD 3507',
      color: '#06B6D4'
    },
    {
      id: 'ICT760',
      code: 'ICT760',
      name: 'Digital Signal Processing and Internet of Things',
      day: 'Monday',
      time: '9:00 - 12:00',
      room: 'BKD 3506',
      color: '#10B981'
    },
    {
      id: 'ICT750',
      code: 'ICT750',
      name: 'Communication Theory and Connectivity',
      day: 'Monday',
      time: '13:00 - 16:00',
      room: 'BKD 3504',
      color: '#F59E0B'
    },
    {
      id: 'ICT730',
      code: 'ICT730',
      name: 'Hardware Concepts for Artificial Intelligence and Internet of Things',
      day: 'Tuesday',
      time: '13:00 - 16:00',
      room: 'BKD 2401',
      color: '#EF4444'
    },
    {
      id: 'ICT710',
      code: 'ICT710',
      name: 'Software Concepts for Artificial Intelligence and Internet of Things',
      day: 'Wednesday',
      time: '13:00 - 16:00',
      room: 'BKD 3204',
      color: '#8B5A2B'
    }
  ];

  const handleSessionChange = (session) => {
    setCurrentSession(session);
  };

  const handleClassSelect = (classData) => {
    setSelectedClass(classData);
    setShowHistory(false);
    message.success(`Selected ${classData.code} - ${classData.name}`);
  };

  const handleViewHistory = () => {
    setShowHistory(true);
    setSelectedClass(null);
    setCurrentSession(null);
  };

  const handleBackToDashboard = () => {
    setShowHistory(false);
    setSelectedClass(null);
    setCurrentSession(null);
  };

  // only provide logout in menu (profile settings removed per design)
  const userMenuItems = [
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          Logout
        </Space>
      ),
      onClick: () => {
        message.success('Logged out successfully');
        onLogout();
      }
    }
  ];

  const getDayColor = (day) => {
    const colors = {
      'Monday': '#10B981',
      'Tuesday': '#3B82F6',
      'Wednesday': '#8B5CF6',
      'Thursday': '#F59E0B',
      'Friday': '#EF4444',
      'Saturday': '#6B7280',
      'Sunday': '#84CC16'
    };
    return colors[day] || '#6B7280';
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
        justifyContent: 'space-between',
        padding: '8px 50px',
        backgroundColor: '#8e4ad1ff',
        background: '#8e4ad1ff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/siitlogo.png"
            alt="SIIT Logo"
            className="siit-logo"
          />
          <Title style={{
            color: '#fff !important',
            margin: 0,
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '0.2px'
          }}>
            Digital Attendance System
          </Title>

        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Space size="middle">
            <Text style={{ color: '#fff', marginRight: '16px', fontSize: '16px', fontWeight: 600 }}>
              Welcome, {instructor.name}
            </Text>
            {/* simple logout button instead of profile dropdown */}
            <Button
              type="primary"
              onClick={() => { message.success('Logged out successfully'); onLogout(); }}
            >
              Logout
            </Button>
          </Space>
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
          {!showHistory && !selectedClass && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div
                className="dashboard-title-container"
                style={{
                  backgroundImage: `url(${process.env.PUBLIC_URL}/siit-lec-room.jpg)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  borderRadius: '16px',
                  padding: '40px',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Overlay for text readability */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: '16px',
                  zIndex: 1
                }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <Title className="dashboard-title">
                    Your Classes
                  </Title>
                  <Text className="dashboard-subtitle">
                    Select a class to manage attendance or view attendance history
                  </Text>
                  <div style={{ marginTop: '20px' }}>
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleViewHistory}
                      style={{ marginRight: '12px' }}
                    >
                      View Attendance History
                    </Button>
                  </div>
                </div>
              </div>

              <Row gutter={[24, 24]}>
                {instructorClasses.map((classItem) => (
                  <Col xs={24} sm={12} lg={8} key={classItem.id}>
                    <Card
                      hoverable
                      style={{
                        borderRadius: '16px',
                        boxShadow: '0 4px 20px rgba(107, 33, 168, 0.1)',
                        border: `2px solid ${classItem.color}20`,
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onClick={() => handleClassSelect(classItem)}
                    >
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '12px'
                        }}>
                          <Tag
                            color={classItem.color}
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              padding: '4px 12px',
                              borderRadius: '8px'
                            }}
                          >
                            {classItem.code}
                          </Tag>
                          <Tag
                            color={getDayColor(classItem.day)}
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              padding: '2px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            {classItem.day}
                          </Tag>
                        </div>

                        <Title
                          level={4}
                          style={{
                            margin: '0 0 16px 0',
                            color: '#000',
                            fontSize: '16px',
                            lineHeight: 1.4
                          }}
                        >
                          {classItem.name}
                        </Title>
                      </div>

                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <ClockCircleOutlined style={{ color: '#6B7280', marginRight: '8px' }} />
                          <Text style={{ color: '#6B7280', fontSize: '14px' }}>
                            {classItem.time}
                          </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <EnvironmentOutlined style={{ color: '#6B7280', marginRight: '8px' }} />
                          <Text style={{ color: '#6B7280', fontSize: '14px' }}>
                            {classItem.room}
                          </Text>
                        </div>
                      </Space>

                      <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        background: `${classItem.color}10`,
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <Text style={{
                          color: classItem.color,
                          fontSize: '14px',
                          fontWeight: 600
                        }}>
                          Click to start attendance session
                        </Text>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Space>
          )}

          {selectedClass && !showHistory && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div>
                  <Title level={2} style={{ margin: 0, color: '#000' }}>
                    {selectedClass.code} - {selectedClass.name}
                  </Title>
                  <Space style={{ marginTop: '8px' }}>
                    <Tag color={getDayColor(selectedClass.day)}>{selectedClass.day}</Tag>
                    <Tag>{selectedClass.time}</Tag>
                    <Tag>{selectedClass.room}</Tag>
                  </Space>
                </div>
                <Button onClick={handleBackToDashboard}>
                  ← Back to Classes
                </Button>
              </div>

              <SessionManager
                onSessionChange={handleSessionChange}
                selectedClass={selectedClass}
              />

              <Divider />

              <AttendanceList session={currentSession} />
            </Space>
          )}

          {showHistory && (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <Title level={2} style={{ margin: 0, color: '#000' }}>
                  Attendance History
                </Title>
                <Button onClick={handleBackToDashboard}>
                  ← Back to Classes
                </Button>
              </div>

              <AttendanceHistory classes={instructorClasses} />
            </Space>
          )}
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
};

export default Dashboard;