import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { dateTime } from '../../utils/format.js';
import { usePreferences } from '../../context/PreferencesContext.js';

const { Text, Title } = Typography;

function AdminRequestsPanel({ waiterCalls, billRequests, onWaiterStatusChange, onBillStatusChange }) {
  const { t } = usePreferences();
  const openWaiterCalls = waiterCalls.filter((call) => ['OPEN', 'IN_PROGRESS'].includes(call.status));
  const openBillRequests = billRequests.filter((request) => request.status === 'OPEN');
  const hasRequests = openWaiterCalls.length > 0 || openBillRequests.length > 0;

  if (!hasRequests) {
    return (
      <div className="empty-panel">
        <Empty description={t('admin.messages.emptyRequests')} />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} className="responsive-row">
      {openWaiterCalls.map((call) => (
        <Col xs={24} md={12} xxl={8} key={`waiter-${call.id}`}>
          <Card className="request-card waiter-request-card">
            <Tag color="orange">{t('admin.messages.waiterCall')}</Tag>
            <Title level={4}>{t('admin.columns.table')} {call.tableNumber}</Title>
            <Text>{call.message || t('admin.messages.defaultWaiterMessage')}</Text>
            <Text type="secondary">{dateTime(call.createdAt)}</Text>
            <Space className="request-actions">
              <Button type="primary" icon={<CheckOutlined />} onClick={() => onWaiterStatusChange(call.id, 'COMPLETED')}>
                {t('admin.actions.approve')}
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => onWaiterStatusChange(call.id, 'CANCELLED')}>
                {t('admin.actions.close')}
              </Button>
            </Space>
          </Card>
        </Col>
      ))}

      {openBillRequests.map((request) => (
        <Col xs={24} md={12} xxl={8} key={`bill-${request.id}`}>
          <Card className="request-card bill-request-card">
            <Tag color="blue">{t('admin.messages.billRequest')}</Tag>
            <Title level={4}>{t('admin.columns.table')} {request.tableNumber}</Title>
            <Text>{request.note || t('admin.messages.defaultBillMessage')}</Text>
            <Text type="secondary">{dateTime(request.createdAt)}</Text>
            <Space className="request-actions">
              <Button type="primary" icon={<CheckOutlined />} onClick={() => onBillStatusChange(request.id, 'PAID')}>
                {t('admin.actions.paid')}
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => onBillStatusChange(request.id, 'CANCELLED')}>
                {t('admin.actions.close')}
              </Button>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default AdminRequestsPanel;
