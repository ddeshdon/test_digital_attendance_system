import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, InputNumber, Alert, Space, message } from 'antd';
import { PlayCircleOutlined, StopOutlined, CopyOutlined } from '@ant-design/icons';
import { sessionAPI } from '../services/api-action-based';

const SessionManager = ({ onSessionChange, selectedClass }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [form] = Form.useForm();

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const startSession = async (values) => {
    setLoading(true);
    try {
      // Generate session ID
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const sessionId = `${values.classId}-${timestamp}`;

      const sessionData = {
        session_id: sessionId,
        class_id: values.classId,
        room_id: values.roomId,
        teacher_id: 'instructor123', // Default instructor ID
        beacon_uuid: values.beaconUUID.trim(),
        attendance_window_minutes: values.attendanceWindow,
        instructor_id: 'instructor123' // Get from auth context in production
      };

      console.log('Starting session with data:', sessionData);
      
      const response = await sessionAPI.startSession(sessionData);
      
      console.log('Session API response:', response);
      
      if (response.session && response.message === 'session created') {
        setSession(response.session);
        onSessionChange?.(response.session);
      } else {
        console.error('Session creation failed:', response);
        throw new Error(response.error || response.message || 'Failed to create session');
      }
    } catch (error) {
      console.error('Session start error:', error);
    } finally {
      setLoading(false);
    }
  };

  const endSession = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      await sessionAPI.endSession(session.session_id);
      setSession(null);
      onSessionChange?.(null);
      form.resetFields();
    } catch (error) {
      console.error('Failed to end session:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Clipboard copy successful - no popup
    }).catch(() => {
      console.error('Failed to copy to clipboard');
    });
  };

  if (session) {
    const isExpired = currentTime > new Date(session.end_time);
    const timeRemainingMs = Math.max(0, new Date(session.end_time) - currentTime);
    const totalSecondsRemaining = Math.max(0, Math.floor(timeRemainingMs / 1000));
    const minutesRemaining = Math.floor(totalSecondsRemaining / 60);
    const secondsRemaining = totalSecondsRemaining % 60;
    const timeRemaining = Math.max(0, Math.ceil(timeRemainingMs / 60000));

    return (
      <Card title="Active Attendance Session" style={{ marginBottom: 24 }}>
        <Alert
          message={isExpired ? "Session has expired!" : "Session is now active!"}
          description={
            <div>
              <p><strong>Class:</strong> {session.class_id}</p>
              <p><strong>Room:</strong> {session.room_id}</p>
              <p><strong>Beacon UUID:</strong> 
                <code style={{ 
                  background: '#f0f0f0', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  marginLeft: '8px',
                  fontSize: '12px'
                }}>
                  {session.beacon_uuid}
                </code>
              </p>
              <p><strong>Started:</strong> {new Date(session.start_time).toLocaleString()}</p>
              <p><strong>Ends:</strong> {new Date(session.end_time).toLocaleString()}</p>
              {!isExpired && (
                <p><strong>Time Remaining:</strong> <span style={{ color: timeRemaining < 2 ? '#ff4d4f' : '#52c41a' }}>
                  {minutesRemaining}:{String(secondsRemaining).padStart(2, '0')}
                </span></p>
              )}
              <p><strong>Status:</strong> 
                <span style={{ color: isExpired ? '#ff4d4f' : '#52c41a' }}>
                  {isExpired ? 'EXPIRED' : 'OPEN'}
                </span>
              </p>
            </div>
          }
          type={isExpired ? "error" : "success"}
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Space>
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={endSession}
            loading={loading}
          >
            End Session
          </Button>
          
          <Button
            icon={<CopyOutlined />}
            onClick={() => copyToClipboard(session.beacon_uuid)}
          >
            Copy UUID
          </Button>
        </Space>
      </Card>
    );
  }

  return (
      <Card title="Start Attendance Session" style={{ marginBottom: 24 }}>
      <Alert
        message="Setup Instructions"
        description={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>Open Beacon Simulator</div>
            <div style={{ fontSize: 20, color: '#6B7280' }}>→</div>
            <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>Copy UUID (share)</div>
            <div style={{ fontSize: 20, color: '#6B7280' }}>→</div>
            <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>Paste UUID in field below</div>
            <div style={{ fontSize: 20, color: '#6B7280' }}>→</div>
            <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>Set class/room & window</div>
            <div style={{ fontSize: 20, color: '#6B7280' }}>→</div>
            <div style={{ padding: '12px 16px', background: '#fff', borderRadius: 8, border: '1px solid #eee' }}>Start session</div>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={startSession}
        initialValues={{ 
          attendanceWindow: 5,
          classId: selectedClass?.code || 'DES424',
          roomId: selectedClass?.room || 'BKD 3507',
          beaconUUID: ''
        }}
        size="large"
      >
        <Form.Item
          name="classId"
          label="Class ID"
          rules={[{ required: true, message: 'Please enter class ID' }]}
        >
          <Input 
            placeholder="e.g., DES424" 
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item
          name="roomId"
          label="Room ID"
          rules={[{ required: true, message: 'Please enter room ID' }]}
        >
          <Input 
            placeholder="e.g., R602" 
            style={{ textTransform: 'uppercase' }}
          />
        </Form.Item>

        <Form.Item
          name="beaconUUID"
          label="Beacon UUID (from Beacon Simulator app)"
          rules={[
            { required: true, message: 'Please enter beacon UUID' },
            { 
              pattern: /^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$/,
              message: 'Please enter a valid UUID format (e.g., D001A2B6-AA1F-4860-9E43-FC83C418FC58)'
            }
          ]}
        >
          <Input.TextArea
            rows={2}
            placeholder="Paste UUID from Beacon Simulator app (e.g., D001A2B6-AA1F-4860-9E43-FC83C418FC58)"
            style={{ fontFamily: 'monospace', fontSize: '14px' }}
          />
        </Form.Item>

        <Form.Item
          name="attendanceWindow"
          label="Attendance Window (minutes)"
          rules={[{ required: true, message: 'Please set attendance window' }]}
        >
          <InputNumber 
            min={1} 
            max={60} 
            placeholder="5"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<PlayCircleOutlined />}
            size="large"
            block
          >
            Start Attendance Session
          </Button>
        </Form.Item>
      </Form>

      <Alert
        description={<div style={{ color: '#000' }}>Make sure your Beacon Simulator is broadcasting before starting the session. Students will scan for this exact UUID to mark attendance.</div>}
        type="warning"
        showIcon
        style={{ marginTop: 16 }}
      />
    </Card>
  );
};

export default SessionManager;