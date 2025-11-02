import React, { useState, useEffect } from 'react';
import { 
  Card,
  Table, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Input,
  Row,
  Col,
  Tag,
  Statistic,
  message,
  Typography,
  Tooltip
} from 'antd';
import { 
  SearchOutlined, 
  DownloadOutlined,
  FilterOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CalendarOutlined,
  UserOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Text } = Typography;

const AttendanceHistory = ({ classes }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  // Mock attendance data with more realistic entries
  const mockAttendanceData = [
    {
      id: 1,
      sessionId: 'DES424-2025-11-01',
      classCode: 'DES424',
      className: 'Cloud-based Application Development',
      date: '2025-11-01',
      time: '09:00',
      room: 'BKD 3507',
      studentId: '6522781713',
      studentName: 'John Smith',
      checkInTime: '09:05:23',
      status: 'Present'
    },
    {
      id: 2,
      sessionId: 'DES424-2025-11-01',
      classCode: 'DES424',
      className: 'Cloud-based Application Development',
      date: '2025-11-01',
      time: '09:00',
      room: 'BKD 3507',
      studentId: '6522781714',
      studentName: 'Jane Doe',
      checkInTime: '09:03:45',
      status: 'Present'
    },
    {
      id: 3,
      sessionId: 'DES424-2025-11-01',
      classCode: 'DES424',
      className: 'Cloud-based Application Development',
      date: '2025-11-01',
      time: '09:00',
      room: 'BKD 3507',
      studentId: '6522781715',
      studentName: 'Mike Johnson',
      checkInTime: '09:15:12',
      status: 'Late'
    },
    {
      id: 4,
      sessionId: 'DES431-2025-10-29',
      classCode: 'DES431',
      className: 'Big Data Analytics',
      date: '2025-10-29',
      time: '09:00',
      room: 'BKD 3507',
      studentId: '6522781713',
      studentName: 'John Smith',
      checkInTime: '09:02:18',
      status: 'Present'
    },
    {
      id: 5,
      sessionId: 'DES431-2025-10-29',
      classCode: 'DES431',
      className: 'Big Data Analytics',
      date: '2025-10-29',
      time: '09:00',
      room: 'BKD 3507',
      studentId: '6522781716',
      studentName: 'Sarah Wilson',
      checkInTime: null,
      status: 'Absent'
    },
    {
      id: 6,
      sessionId: 'ICT760-2025-10-28',
      classCode: 'ICT760',
      className: 'Digital Signal Processing and IoT',
      date: '2025-10-28',
      time: '09:00',
      room: 'BKD 3506',
      studentId: '6522781713',
      studentName: 'John Smith',
      checkInTime: '09:01:55',
      status: 'Present'
    },
    {
      id: 7,
      sessionId: 'ICT750-2025-10-28',
      classCode: 'ICT750',
      className: 'Communication Theory and Connectivity',
      date: '2025-10-28',
      time: '13:00',
      room: 'BKD 3504',
      studentId: '6522781717',
      studentName: 'David Brown',
      checkInTime: '13:08:33',
      status: 'Present'
    },
    {
      id: 8,
      sessionId: 'ICT730-2025-10-29',
      classCode: 'ICT730',
      className: 'Hardware Concepts for AI and IoT',
      date: '2025-10-29',
      time: '13:00',
      room: 'BKD 2401',
      studentId: '6522781718',
      studentName: 'Emily Davis',
      checkInTime: '13:05:17',
      status: 'Present'
    },
    {
      id: 9,
      sessionId: 'ICT710-2025-11-01',
      classCode: 'ICT710',
      className: 'Software Concepts for AI and IoT',
      date: '2025-11-01',
      time: '13:00',
      room: 'BKD 3204',
      studentId: '6522781719',
      studentName: 'Robert Taylor',
      checkInTime: '13:12:45',
      status: 'Late'
    },
    {
      id: 10,
      sessionId: 'ICT710-2025-11-01',
      classCode: 'ICT710',
      className: 'Software Concepts for AI and IoT',
      date: '2025-11-01',
      time: '13:00',
      room: 'BKD 3204',
      studentId: '6522781720',
      studentName: 'Lisa Anderson',
      checkInTime: null,
      status: 'Absent'
    }
  ];

  // A small palette to give each class a distinct accent color
  const palette = ['#6B21A8', '#0ea5e9', '#f97316', '#059669', '#db2777', '#7c3aed', '#ef4444'];

  const getColorForCode = (code) => {
    if (!code) return palette[0];
    const idx = code.charCodeAt(0) % palette.length;
    return palette[idx];
  };

  useEffect(() => {
    loadAttendanceData();
  }, [selectedClass, dateRange, searchText]);

  const loadAttendanceData = () => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      let filtered = [...mockAttendanceData];

      // Filter by class
      if (selectedClass !== 'all') {
        filtered = filtered.filter(record => record.classCode === selectedClass);
      }

      // Filter by date range
      if (dateRange && dateRange[0] && dateRange[1]) {
        filtered = filtered.filter(record => {
          const recordDate = moment(record.date);
          return recordDate.isBetween(dateRange[0], dateRange[1], 'day', '[]');
        });
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
      setLoading(false);
    }, 800);
  };

  const exportToCSV = () => {
    const headers = ['Session ID', 'Class Code', 'Class Name', 'Date', 'Time', 'Room', 'Student ID', 'Student Name', 'Check-in Time', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(record => [
        record.sessionId,
        record.classCode,
        `"${record.className}"`,
        record.date,
        record.time,
        record.room,
        record.studentId,
        `"${record.studentName}"`,
        record.checkInTime || 'N/A',
        record.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-history-${moment().format('YYYY-MM-DD')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success('Attendance data exported to CSV successfully!');
  };

  const exportToExcel = () => {
    // For demo purposes, we'll create a simple Excel-like format
    message.info('Excel export feature would integrate with libraries like xlsx or exceljs');
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 100,
      sorter: (a, b) => moment(a.date).unix() - moment(b.date).unix(),
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Class',
      dataIndex: 'classCode',
      key: 'classCode',
      width: 80,
      render: (classCode, record) => (
        <div>
          <Tag color={getColorForCode(classCode)} style={{ color: '#fff', fontWeight: 600 }}>{classCode}</Tag>
          <br />
          <Text style={{ fontSize: '12px', color: '#6B7280' }}>
            {record.time}
          </Text>
        </div>
      )
    },
    {
      title: 'Student',
      key: 'student',
      width: 200,
      render: (record) => (
        <div>
          <Text strong>{record.studentName}</Text>
          <br />
          <Text style={{ fontSize: '12px', color: '#6B7280' }}>
            ID: {record.studentId}
          </Text>
        </div>
      )
    },
    {
      title: 'Check-in Time',
      dataIndex: 'checkInTime',
      key: 'checkInTime',
      width: 120,
      render: (checkInTime) => (
        checkInTime ? (
          <Text>{checkInTime}</Text>
        ) : (
          <Text style={{ color: '#9CA3AF' }}>Not checked in</Text>
        )
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      filters: [
        { text: 'Present', value: 'Present' },
        { text: 'Late', value: 'Late' },
        { text: 'Absent', value: 'Absent' }
      ],
      onFilter: (value, record) => record.status === value,
      render: (status) => {
        const colors = {
          'Present': 'green',
          'Late': 'orange',
          'Absent': 'red'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Room',
      dataIndex: 'room',
      key: 'room',
      width: 80
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

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Records"
                value={stats.total}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Present"
              value={stats.present}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Late"
              value={stats.late}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Absent"
              value={stats.absent}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
  <Card title={<span style={{ color: '#000' }}>Filters & Search</span>} size="small">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Select
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="Select Class"
              style={{ width: '100%' }}
            >
              <Option value="all">All Classes</Option>
              {classes.map(cls => (
                <Option key={cls.id} value={cls.code}>
                  {cls.code} - {cls.name}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              style={{ width: '100%' }}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          
          <Col xs={24} sm={8} md={6}>
            <Input
              placeholder="Search student name or ID"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={24} md={6}>
            <Space>
              <Tooltip title="Export to CSV">
                <Button 
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportToCSV}
                >
                  CSV
                </Button>
              </Tooltip>
              <Tooltip title="Export to Excel">
                <Button 
                  icon={<FileExcelOutlined />}
                  onClick={exportToExcel}
                >
                  Excel
                </Button>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Attendance Table */}
  <Card title={<span style={{ color: '#000' }}>{`Attendance Records (${filteredData.length} records)`}</span>}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} records`
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </Card>
    </Space>
  );
};

export default AttendanceHistory;