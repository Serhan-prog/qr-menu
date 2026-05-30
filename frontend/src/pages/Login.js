import { Button, Card, Form, Input, Typography, message } from 'antd';
import { LockOutlined, LoginOutlined, MailOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { qrMenuApi } from '../api/qrMenuApi.js';
import { apiError } from '../utils/format.js';
import { saveAuth } from '../utils/auth.js';
import { restaurantDisplayName, restaurantInitials } from '../utils/brand.js';
import PreferenceControls from '../components/PreferenceControls.js';
import { usePreferences } from '../context/PreferencesContext.js';

const { Title, Text } = Typography;

function Login() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [restaurant, setRestaurant] = useState(null);
  const restaurantName = restaurantDisplayName(restaurant?.name);

  useEffect(() => {
    let mounted = true;

    qrMenuApi.getPublicRestaurant()
      .then((response) => {
        if (mounted) {
          setRestaurant(response);
          document.title = `${restaurantDisplayName(response.name)} | Admin`;
        }
      })
      .catch(() => {
        document.title = `${restaurantDisplayName()} | Admin`;
      });

    return () => {
      mounted = false;
    };
  }, []);

  const onFinish = async (values) => {
    try {
      const auth = await qrMenuApi.login(values);
      saveAuth(auth);
      await qrMenuApi.refreshCsrfToken();
      message.success(t('login.success'));
      navigate('/admin');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  return (
    <main className="login-page">
      <PreferenceControls className="login-preferences" />
      <section className="login-shell">
        <div className="login-brand">
          <span className="brand-mark">{restaurantInitials(restaurantName)}</span>
          <div>
            <Title level={1}>{restaurantName}</Title>
            <Text>{t('login.description')}</Text>
          </div>
        </div>

        <Card className="login-card">
          <div className="login-card-head">
            <Title level={3}>{t('login.title')}</Title>
            <Text>{t('login.subtitle')}</Text>
          </div>
          <Form
            layout="vertical"
            onFinish={onFinish}
          >
            <Form.Item label={t('login.email')} name="email" rules={[{ required: true, message: t('login.emailRequired') }]}>
              <Input size="large" prefix={<MailOutlined />} placeholder="admin@qrmenu.local" />
            </Form.Item>
            <Form.Item label={t('login.password')} name="password" rules={[{ required: true, message: t('login.passwordRequired') }]}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder={t('login.password')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" icon={<LoginOutlined />} size="large" block>
              {t('login.submit')}
            </Button>
          </Form>
        </Card>
      </section>
    </main>
  );
}

export default Login;
