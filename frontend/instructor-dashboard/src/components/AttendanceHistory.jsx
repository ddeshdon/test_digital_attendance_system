import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Select, 
  DatePicker, 
  Button, 
  Input,
  Row,
  Col,
  Tag,
  message,
  Typography,
  Divider
} from 'antd';
import {
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { attendanceAPI } from '../services/api-action-based';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const AttendanceHistory = ({ classes }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState(null);
  const [exportType, setExportType] = useState('attendance');

  // Load real attendance data
  useEffect(() => {
    fetchAttendanceHistory();
  }, []);

  const fetchAttendanceHistory = async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.getAllAttendance();
      if (response.attendance) {
        // Transform the data to match the expected format
        const transformedData = response.attendance.map((record, index) => {
          const timestamp = new Date(record.timestamp);
          
          // Use local date instead of UTC to avoid timezone issues
          const year = timestamp.getFullYear();
          const month = String(timestamp.getMonth() + 1).padStart(2, '0');
          const day = String(timestamp.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          
          console.log('Processing record:', {
            originalTimestamp: record.timestamp,
            parsedTimestamp: timestamp,
            utcDateString: timestamp.toISOString().split('T')[0],
            localDateString: dateString,
            classCode: record.class_id
          });
          
          return {
            id: index + 1,
            sessionId: record.session_id,
            classCode: record.class_id || 'Unknown',
            className: record.class_name || record.class_id || 'Unknown Class',
            date: dateString,
            time: timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: false 
            }),
            room: record.room_id || 'Not Specified',
            studentId: record.student_id,
            studentName: getStudentName(record.student_id),
            checkInTime: timestamp.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              second: '2-digit',
              hour12: false 
            }),
            status: record.status || 'Present'
          };
        });
        setAttendanceData(transformedData);
        setFilteredData(transformedData);
      }
    } catch (error) {
      console.error('Failed to load attendance history:', error);
      message.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get student name
  const getStudentName = (studentId) => {
    // For now, just return the student ID as the display name
    // In production, this would query a student database
    return `Student ${studentId}`;
  };



  // Simple color mapping for class codes
  const getClassTagColor = (code) => {
    const colors = {
      'DES404': '#1890ff',
      'DES411': '#52c41a', 
      'DES424': '#722ed1',
      'DES431': '#fa8c16'
    };
    return colors[code] || '#666666';
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedClass, dateRange, searchText, attendanceData]);

  const loadAttendanceData = () => {
    console.log('Loading attendance data:', {
      totalRecords: attendanceData.length,
      selectedClass,
      dateRange,
      searchText
    });

    let filtered = [...attendanceData];

    // Log all record dates first
    console.log('All record dates:', attendanceData.map(r => r.date));

    // Filter by class
    if (selectedClass !== 'all') {
      const beforeClassFilter = filtered.length;
      filtered = filtered.filter(record => record.classCode === selectedClass);
      console.log(`Class filter: ${beforeClassFilter} -> ${filtered.length} records`);
    }

    // Filter by date range
    if (dateRange && dateRange[0] && dateRange[1]) {
      const beforeDateFilter = filtered.length;
      
      console.log('Date range picker values:', {
        dateRange0: dateRange[0],
        dateRange1: dateRange[1],
        dateRange0String: dateRange[0] ? dateRange[0].toString() : 'null',
        dateRange1String: dateRange[1] ? dateRange[1].toString() : 'null'
      });
      
      filtered = filtered.filter(record => {
        const recordDate = moment(record.date, 'YYYY-MM-DD');
        const startDate = moment(dateRange[0]).startOf('day');
        const endDate = moment(dateRange[1]).endOf('day');
        
        // Use isSameOrAfter and isSameOrBefore for more reliable comparison
        const isAfterStart = recordDate.isSameOrAfter(startDate, 'day');
        const isBeforeEnd = recordDate.isSameOrBefore(endDate, 'day');
        const isInRange = isAfterStart && isBeforeEnd;
        
        console.log('Date filtering record:', {
          originalDate: record.date,
          recordDate: recordDate.format('YYYY-MM-DD'),
          startDate: startDate.format('YYYY-MM-DD'),
          endDate: endDate.format('YYYY-MM-DD'),
          isAfterStart,
          isBeforeEnd,
          isInRange
        });
        
        return isInRange;
      });
      console.log(`Date filter: ${beforeDateFilter} -> ${filtered.length} records`);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(record => 
        record.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
        record.studentId.includes(searchText) ||
        record.classCode.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredData(filtered);
  };

  const exportToS3 = async () => {
    setLoading(true);
    try {
      const response = await attendanceAPI.exportToS3(exportType);
      if (response.message) {
        const exportTypeLabel = exportType === 'attendance' ? 'Attendance Records' : 'Session Records';
        message.success(
          `Successfully exported ${response.record_count} ${exportTypeLabel} to S3!\n` +
          `File: ${response.filename}\n` +
          `Bucket: ${response.bucket}`,
          6 // Show message for 6 seconds
        );
      }
    } catch (error) {
      console.error('S3 export failed:', error);
      message.error('Failed to export data to S3. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      render: (date) => (
        <div style={{ fontSize: '14px' }}>
          {moment(date).format('DD/MM/YYYY')}
        </div>
      )
    },
    {
      title: 'Class',
      dataIndex: 'classCode',
      key: 'classCode',
      width: 100,
      render: (classCode, record) => (
        <div>
          <Tag color={getClassTagColor(classCode)} style={{ fontSize: '12px' }}>
            {classCode}
          </Tag>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
            {record.time}
          </div>
        </div>
      )
    },
    {
      title: 'Student',
      key: 'student',
      width: 180,
      render: (record) => (
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500' }}>
            {record.studentName}
          </div>
          <div style={{ fontSize: '12px', color: '#888' }}>
            {record.studentId}
          </div>
        </div>
      )
    },
    {
      title: 'Check-in Time',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 100,
      render: (checkInTime) => (
        <div style={{ fontSize: '14px' }}>
          {checkInTime || '-'}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      filters: [
        { text: 'Present', value: 'Present' },
        { text: 'Late', value: 'Late' },
        { text: 'Absent', value: 'Absent' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const statusConfig = {
          'Present': { color: '#52c41a', bg: '#f6ffed' },
          'Late': { color: '#fa8c16', bg: '#fff7e6' },
          'Absent': { color: '#ff4d4f', bg: '#fff2f0' }
        };
        const config = statusConfig[status] || { color: '#666', bg: '#f5f5f5' };
        return (
          <Tag 
            style={{ 
              color: config.color, 
              backgroundColor: config.bg,
              border: `1px solid ${config.color}20`,
              fontSize: '12px'
            }}
          >
            {status}
          </Tag>
        );
      }
    },
    {
      title: 'Room',
      dataIndex: 'room',
      key: 'room',
      width: 100,
      render: (room) => (
        <div style={{ fontSize: '14px' }}>
          {room}
        </div>
      )
    }
  ];

  const getStatusStats = () => {
    const present = filteredData.filter(r => r.status === 'Present').length;
    const late = filteredData.filter(r => r.status === 'Late').length;
    const absent = filteredData.filter(r => r.status === 'Absent').length;
    const total = filteredData.length;
    
    return { present, late, absent, total };
  };

  const stats = getStatusStats();

  const renderCalendar = () => {
    const currentDate = moment();
    const startOfMonth = currentDate.clone().startOf('month');
    const endOfMonth = currentDate.clone().endOf('month');
    const startDate = startOfMonth.clone().startOf('week');
    const endDate = endOfMonth.clone().endOf('week');
    
    const calendar = [];
    const date = startDate.clone();
    
    while (date.isSameOrBefore(endDate, 'day')) {
      calendar.push(date.clone());
      date.add(1, 'day');
    }
    
    const weeks = [];
    for (let i = 0; i < calendar.length; i += 7) {
      weeks.push(calendar.slice(i, i + 7));
    }
    
    return (
      <div style={{ backgroundColor: 'white', border: '1px solid #e8e8e8', borderRadius: '4px' }}>
        <div style={{ padding: '12px', borderBottom: '1px solid #e8e8e8', fontWeight: '500' }}>
          {currentDate.format('MMM YYYY')}
        </div>
        <div style={{ padding: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ 
                textAlign: 'center', 
                fontSize: '12px', 
                color: '#666', 
                padding: '4px',
                fontWeight: '500'
              }}>
                {day}
              </div>
            ))}
          </div>
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
              {week.map(day => {
                const isCurrentMonth = day.isSame(currentDate, 'month');
                const isToday = day.isSame(currentDate, 'day');
                return (
                  <div key={day.format('YYYY-MM-DD')} style={{
                    textAlign: 'center',
                    padding: '6px 4px',
                    fontSize: '13px',
                    color: isCurrentMonth ? '#333' : '#ccc',
                    backgroundColor: isToday ? '#1890ff' : 'transparent',
                    color: isToday ? 'white' : (isCurrentMonth ? '#333' : '#ccc'),
                    borderRadius: '2px',
                    cursor: 'pointer'
                  }}>
                    {day.format('D')}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const studentColumns = [
    {
      title: 'Student ID',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 100,
    },
    {
      title: 'Name',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 200,
    },
    {
      title: 'Present',
      key: 'present',
      width: 80,
      align: 'center',
      render: (record) => (
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: record.status === 'Present' ? '#52c41a' : '#f0f0f0',
          border: record.status === 'Present' ? '2px solid #52c41a' : '2px solid #d9d9d9',
          margin: '0 auto'
        }} />
      )
    },
    {
      title: 'Absent',
      key: 'absent',
      width: 80,
      align: 'center',
      render: (record) => (
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: record.status === 'Absent' ? '#ff4d4f' : '#f0f0f0',
          border: record.status === 'Absent' ? '2px solid #ff4d4f' : '2px solid #d9d9d9',
          margin: '0 auto'
        }} />
      )
    },
    {
      title: 'Leave',
      key: 'leave',
      width: 80,
      align: 'center',
      render: (record) => (
        <div style={{
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          backgroundColor: record.status === 'Late' ? '#fa8c16' : '#f0f0f0',
          border: record.status === 'Late' ? '2px solid #fa8c16' : '2px solid #d9d9d9',
          margin: '0 auto'
        }} />
      )
    },
    {
      title: 'Room',
      dataIndex: 'room',
      key: 'room',
      width: 100,
      align: 'center',
      render: (room) => (
        <span style={{ fontSize: '12px' }}>
          {room || 'Not Specified'}
        </span>
      )
    }
  ];

  return (
    <div style={{ padding: '16px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <Row gutter={[16, 16]} style={{ height: 'calc(100vh - 32px)' }}>
        {/* Left Side - Filters and Student List */}
        <Col xs={24} lg={18} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Filters */}
          <Row gutter={[12, 12]} style={{ marginBottom: '16px' }}>
            <Col xs={24} sm={8} md={6}>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Class</div>
              <Select
                value={selectedClass}
                onChange={setSelectedClass}
                style={{ width: '100%' }}
                size="middle"
              >
                <Option value="all">All Classes</Option>
                {classes.map(cls => (
                  <Option key={cls.id} value={cls.code}>
                    {cls.code}
                  </Option>
                ))}
              </Select>
            </Col>
            
            <Col xs={24} sm={8} md={8}>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Date Range</div>
              <RangePicker
                value={dateRange}
                onChange={(dates) => {
                  console.log('Date range changed:', dates);
                  if (dates) {
                    console.log('Start date:', dates[0] ? dates[0].format('YYYY-MM-DD') : 'null');
                    console.log('End date:', dates[1] ? dates[1].format('YYYY-MM-DD') : 'null');
                  }
                  setDateRange(dates);
                }}
                style={{ width: '100%' }}
                size="middle"
                format="DD/MM/YYYY"
                allowClear
              />
            </Col>
            
            <Col xs={24} sm={8} md={6}>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Search</div>
              <Input
                placeholder="Student name or ID"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                allowClear
                size="middle"
              />
            </Col>
            
            <Col xs={24} sm={24} md={4}>
              <div style={{ marginBottom: '4px', fontSize: '12px', color: '#666' }}>Actions</div>
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchAttendanceHistory}
                loading={loading}
                size="middle"
                style={{ width: '100%' }}
              >
                Refresh
              </Button>
            </Col>
          </Row>

          {/* Student List */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e8e8e8', 
            borderRadius: '4px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Table
              columns={studentColumns}
              dataSource={filteredData}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `Showing ${range[0]}-${range[1]} of ${total} records`
              }}
              size="small"
              style={{ backgroundColor: 'white', flex: 1 }}
              scroll={{ y: 'calc(100vh - 280px)' }}
            />
          </div>
        </Col>

        {/* Right Side - Calendar and Stats */}
        <Col xs={24} lg={6} style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Calendar */}
          <div style={{ marginBottom: '16px' }}>
            {renderCalendar()}
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            <div style={{
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '4px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#fdcb6e',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold'
              }}>
                {stats.total}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#856404' }}>
                  Total Students
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              borderRadius: '4px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#28a745',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {stats.present}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#155724' }}>
                  Present Today
                </div>
              </div>
            </div>

            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#dc3545',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: 'white'
              }}>
                {stats.absent}
              </div>
              <div>
                <div style={{ fontSize: '14px', color: '#721c24' }}>
                  Absent Today
                </div>
              </div>
            </div>

            {/* Export Button */}
            <div style={{ marginTop: '12px' }}>
              <Select
                value={exportType}
                onChange={setExportType}
                style={{ width: '100%', marginBottom: '8px' }}
                size="middle"
              >
                <Option value="attendance">Attendance Records</Option>
                <Option value="sessions">Session Records</Option>
              </Select>
              <Button 
                icon={<DownloadOutlined />}
                onClick={exportToS3}
                loading={loading}
                style={{ width: '100%' }}
                size="middle"
              >
                Export to S3
              </Button>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default AttendanceHistory;