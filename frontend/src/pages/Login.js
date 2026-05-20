import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { qrMenuApi } from '../api/qrMenuApi.js';
import { apiError } from '../utils/format.js';
import { saveAuth } from '../utils/auth.js';

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();

  const onFinish = async (values) => {
    try {
      const auth = await qrMenuApi.login(values);
      saveAuth(auth);
      message.success('Giriş başarılı');
      navigate('/admin');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  return (
    <main className="login-page">
      <section className="login-shell">
        <div className="login-brand">
          <span className="brand-mark">SR</span>
          <div>
            <Title level={1}>Semua Restorant</Title>
            <Text>QR menü, mutfak ve servis operasyonları için yönetim paneli.</Text>
          </div>
        </div>

        <Card className="login-card">
          <div className="login-card-head">
            <Title level={3}>Admin Girişi</Title>
            <Text>Yetkili hesabınızla devam edin.</Text>
          </div>
          <Form
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item label="E-posta" name="email" rules={[{ required: true, message: 'E-posta zorunlu' }]}>
              <Input size="large" prefix={<MailOutlined />} placeholder="admin@qrmenu.local" />
            </Form.Item>
            <Form.Item label="Şifre" name="password" rules={[{ required: true, message: 'Şifre zorunlu' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="Şifre" />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} size="large" block>
              Giriş Yap
            </Button>
          </Form>
        </Card>
      </section>
    </main>
  );
}

export default Login;
