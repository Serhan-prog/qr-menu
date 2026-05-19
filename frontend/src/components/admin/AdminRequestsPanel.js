import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { dateTime } from '../../utils/format.js';

const { Text, Title } = Typography;

function AdminRequestsPanel({ waiterCalls, billRequests, onWaiterStatusChange, onBillStatusChange }) {
  const openWaiterCalls = waiterCalls.filter((call) => ['OPEN', 'IN_PROGRESS'].includes(call.status));
  const openBillRequests = billRequests.filter((request) => request.status === 'OPEN');
  const hasRequests = openWaiterCalls.length > 0 || openBillRequests.length > 0;

  if (!hasRequests) {
    return (
      <div className="empty-panel">
        <Empty description="Bekleyen garson çağrısı veya hesap isteği yok" />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} className="responsive-row">
      {openWaiterCalls.map((call) => (
        <Col xs={24} lg={12} xxl={8} key={`waiter-${call.id}`}>
          <Card className="request-card waiter-request-card">
            <Tag color="orange">Garson Çağrısı</Tag>
            <Title level={4}>Masa {call.tableNumber}</Title>
            <Text>{call.message || 'Müşteri garson çağırıyor'}</Text>
            <Text type="secondary">{dateTime(call.createdAt)}</Text>
            <Space className="request-actions">
              <Button type="primary" icon={<CheckOutlined />} onClick={() => onWaiterStatusChange(call.id, 'COMPLETED')}>
                Onayla
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => onWaiterStatusChange(call.id, 'CANCELLED')}>
                Kapat
              </Button>
            </Space>
          </Card>
        </Col>
      ))}

      {openBillRequests.map((request) => (
        <Col xs={24} lg={12} xxl={8} key={`bill-${request.id}`}>
          <Card className="request-card bill-request-card">
            <Tag color="blue">Hesap İsteği</Tag>
            <Title level={4}>Masa {request.tableNumber}</Title>
            <Text>{request.note || 'Müşteri hesap istiyor'}</Text>
            <Text type="secondary">{dateTime(request.createdAt)}</Text>
            <Space className="request-actions">
              <Button type="primary" icon={<CheckOutlined />} onClick={() => onBillStatusChange(request.id, 'PAID')}>
                Ödendi
              </Button>
              <Button danger icon={<CloseOutlined />} onClick={() => onBillStatusChange(request.id, 'CANCELLED')}>
                Kapat
              </Button>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export default AdminRequestsPanel;
