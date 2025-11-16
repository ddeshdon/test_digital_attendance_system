import React, { useState, useEffect } from 'react';
import { Table, Card, Badge, Button, Space, Statistic, Row, Col, Alert } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { attendanceAPI } from '../services/api';

const AttendanceList = ({ session }) => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ present: 0, total: 0 });

  useEffect(() => {
    if (session) {
      fetchAttendance();
      // Set up real-time updates every 10 seconds
      const interval = setInterval(fetchAttendance, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const fetchAttendance = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      console.log('Fetching attendance for session:', session.session_id);
      const response = await attendanceAPI.getAttendanceList(session.session_id);
      
      if (response.success) {
        setAttendanceRecords(response.records || []);
        
        // Calculate statistics
        const presentCount = response.records?.filter(r => r.status === 'present').length || 0;
        setStats({
          present: presentCount,
          total: response.records?.length || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = async () => {
    try {
      const response = await attendanceAPI.exportAttendance(session.session_id);
      
      // Create and download CSV file
      const blob = new Blob([response.csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${session.class_id}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export attendance:', error);
    }
  };

  const columns = [
    {
      title: 'Student ID',
      dataIndex: 'student_id',
      key: 'student_id',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Name',
      dataIndex: 'student_name',
      key: 'student_name',
      width: 200,
    },
    {
      title: 'Check-in Time',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (timestamp) => new Date(timestamp).toLocaleTimeString(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Badge
          status={status === 'present' ? 'success' : 'warning'}
          text={status.charAt(0).toUpperCase() + status.slice(1)}
        />
      ),
    },
    {
      title: 'Method',
      dataIndex: 'check_in_method',
      key: 'check_in_method',
      width: 120,
      render: (method) => (
        <span style={{ fontSize: '12px' }}>
          {method === 'beacon_scan' ? '📱 Beacon' : '✏️ Manual'}
        </span>
      ),
    },
    {
      title: 'Distance',
      dataIndex: 'beacon_distance',
      key: 'beacon_distance',
      width: 100,
      render: (distance) => distance ? `${distance.toFixed(1)}m` : '-',
    }
  ];

  if (!session) {
    return (
      <Card title="Live Attendance">
        <Alert
          message="No Active Session"
          description="Please start a session to view attendance."
          type="info"
          showIcon
        />
      </Card>
    );
  }

  const attendanceRate = stats.total > 0 ? ((stats.present / stats.total) * 100) : 0;

  return (
    <Card 
      title="Live Attendance"
      extra={
        <Space>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchAttendance}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            icon={<DownloadOutlined />} 
            onClick={exportAttendance}
            disabled={attendanceRecords.length === 0}
          >
            Export CSV
          </Button>
        </Space>
      }
    >
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Statistic 
            title="Present Students" 
            value={stats.present} 
            valueStyle={{ color: '#3f8600' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Total Check-ins" 
            value={stats.total}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Attendance Rate" 
            value={attendanceRate.toFixed(1)}
            suffix="%"
            valueStyle={{ color: attendanceRate > 80 ? '#3f8600' : '#cf1322' }}
          />
        </Col>
        <Col span={6}>
          <Statistic 
            title="Session Status" 
            value={session?.status === 'open' ? 'Active' : 'Closed'}
            valueStyle={{ color: session?.status === 'open' ? '#3f8600' : '#cf1322' }}
          />
        </Col>
      </Row>

      {attendanceRecords.length === 0 ? (
        <Alert
          message="No students have checked in yet"
          description="Students can scan the beacon or enter the session UUID to mark attendance."
          type="info"
          showIcon
        />
      ) : (
        <Table
          columns={columns}
          dataSource={attendanceRecords}
          rowKey="attendance_id"
          loading={loading}
          pagination={{ 
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} students`
          }}
          scroll={{ x: 800 }}
          size="middle"
        />
      )}
    </Card>
  );
};

export default AttendanceList;