import React, { useState } from 'react';
import { 
  Layout, 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  message,
  Row,
  Col 
} from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import cognitoAuth from '../services/cognitoAuth';

const { Title, Text } = Typography;
const { Content } = Layout;

const LoginPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const MOCK_CREDENTIALS = {
    username: 'apichon@g.siit.tu.ac.th',
    password: 'Siit2025'
  };

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      // Try Cognito authentication first
      try {
        const result = await cognitoAuth.signIn(values.username, values.password);
        
        if (result.success && result.user) {
          const instructorData = {
            name: result.user.name || 'Instructor',
            username: result.user.username || values.username,
            email: result.user.email || 'instructor@siit.tu.ac.th',
            department: result.user.department || 'Information Technology',
            role: result.user.role || 'instructor',
            loginTime: new Date().toISOString(),
            accessToken: result.user.accessToken,
            idToken: result.user.idToken
          };
        onLogin(instructorData);
          return;
        }
      } catch (cognitoError) {
        console.log('Cognito login failed, trying fallback:', cognitoError);
      }
      
      // Fallback to hardcoded credentials if Cognito fails
      if (values.username === MOCK_CREDENTIALS.username && values.password === MOCK_CREDENTIALS.password) {
        const instructorData = {
          name: 'Dr. Apichon Witayangkurn',
          username: 'apichon.w',
          email: 'apichon@g.siit.tu.ac.th',
          department: 'Information Technology',
          role: 'instructor',
          loginTime: new Date().toISOString()
        };
        onLogin(instructorData);
      } else {
        console.error('Invalid username or password');
      }
    } catch (error) {
      console.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    form.setFieldsValue({
      username: 'apichon@g.siit.tu.ac.th',
      password: 'Siit2025'
    });
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.3) 0%, rgba(107, 33, 168, 0.4) 100%)', position: 'relative' }}>
      {/* Background overlay */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `url("/siit-building.jpg")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.08,
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '50px', position: 'relative', zIndex: 1 }}>
        <Row gutter={[48, 0]} align="middle" style={{ width: '100%', maxWidth: '1200px' }}>
          
          {/* Left side - Branding */}
          <Col xs={24} lg={14} style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', flexWrap: 'nowrap' }}>
              <img 
                src="/siit-logo.png"
                alt="SIIT Logo"
                style={{ height: '90px', marginRight: '18px', filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))', flexShrink: 0 }}
                onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }}
              />
              <div style={{ minWidth: '280px' }}>
                <Title level={1} style={{ color: '#000', margin: 0, fontSize: '40px', whiteSpace: 'nowrap' }}>Digital Attendance</Title>
                <Title level={4} style={{ color: '#000', margin: 0, fontWeight: 700, whiteSpace: 'nowrap' }}>System</Title>
              </div>
            </div>

            <Text style={{ color: '#000', fontSize: '16px', lineHeight: 1.5 }}>
              Sirindhorn International Institute of Technology
              <br />
              Thammasat University
            </Text>
          </Col>

          {/* Right side - Login Form */}
          <Col xs={24} lg={10}>
            <Card style={{
              borderRadius: '24px',
              boxShadow: '0 20px 60px rgba(107, 33, 168, 0.2)',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              maxWidth: '400px',
              margin: '0 auto'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <Title level={3} style={{ color: '#000', margin: 0, marginBottom: '8px' }}>Instructor Login</Title>
                <Text style={{ color: '#000' }}>Sign in to access your dashboard</Text>
              </div>

              <Form form={form} name="login" onFinish={handleLogin} layout="vertical" size="large">
                <Form.Item name="username" label="Email" rules={[{ required: true, message: 'Please enter your email!' }]}>
                  <Input prefix={<UserOutlined style={{ color: '#8B5CF6' }} />} placeholder="Enter your email" style={{ borderRadius: '12px', height: '48px' }} />
                </Form.Item>

                <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password!' }]}>
                  <Input.Password prefix={<LockOutlined style={{ color: '#8B5CF6' }} />} placeholder="Enter your password" style={{ borderRadius: '12px', height: '48px' }} />
                </Form.Item>

                <Form.Item style={{ marginBottom: '16px' }}>
                  <Button type="primary" htmlType="submit" loading={loading} block icon={<LoginOutlined />} style={{ height: '48px', borderRadius: '12px', fontSize: '16px', fontWeight: 600 }}>
                    Sign In
                  </Button>
                </Form.Item>

                <div style={{ textAlign: 'center' }}>
                  <Button type="link" onClick={handleDemoLogin} style={{ color: '#8B5CF6', fontWeight: 500 }}>
                    Use Demo Credentials
                  </Button>
                </div>
              </Form>

                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.03)', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.03)' }}>
                <Text style={{ fontSize: '12px', color: '#374151', display: 'block', textAlign: 'center', lineHeight: 1.5 }}>
                  <strong>Demo Credentials:</strong><br />
                  Email: apichon@g.siit.tu.ac.th<br />
                  Password: Siit2025
                </Text>
              </div>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default LoginPage;
