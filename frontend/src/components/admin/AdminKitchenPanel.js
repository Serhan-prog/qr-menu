import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { currency, dateTime } from '../../utils/format.js';

const { Text, Title } = Typography;

const activeStatuses = ['PENDING', 'PREPARING', 'READY'];

function AdminKitchenPanel({ orders, onStatusChange }) {
  const visibleOrders = orders.filter((order) => activeStatuses.includes(order.status));

  if (visibleOrders.length === 0) {
    return (
      <div className="empty-panel">
        <Empty description="Mutfakta aktif sipariş yok" />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} className="responsive-row">
      {visibleOrders.map((order) => (
        <Col xs={24} lg={12} xxl={8} key={order.id}>
          <Card className={`kitchen-card status-${order.status.toLowerCase()}`}>
            <div className="kitchen-card-head">
              <div>
                <Title level={3}>Masa {order.tableNumber}</Title>
                <Text>Sipariş #{order.id} - {dateTime(order.createdAt)}</Text>
              </div>
              <Tag color={statusColor(order.status)}>{statusLabel(order.status)}</Tag>
            </div>

            <div className="kitchen-items">
              {order.items.map((item) => (
                <div className="kitchen-item" key={item.id}>
                  <strong>{item.quantity}x</strong>
                  <span>{item.productName}</span>
                  <Text>{currency(item.lineTotal)}</Text>
                </div>
              ))}
            </div>

            <Space className="kitchen-actions">
              {order.status === 'PENDING' && (
                <Button type="primary" icon={<FireOutlined />} onClick={() => onStatusChange(order.id, 'PREPARING')}>
                  Hazırlamaya Başla
                </Button>
              )}
              {order.status === 'PREPARING' && (
                <Button type="primary" icon={<ClockCircleOutlined />} onClick={() => onStatusChange(order.id, 'READY')}>
                  Hazır
                </Button>
              )}
              {order.status === 'READY' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onStatusChange(order.id, 'SERVED')}>
                  Servis Edildi
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Yeni',
    PREPARING: 'Hazırlanıyor',
    READY: 'Hazır',
  };
  return labels[status] || status;
}

function statusColor(status) {
  const colors = { PENDING: 'orange', PREPARING: 'blue', READY: 'green' };
  return colors[status] || 'default';
}

export default AdminKitchenPanel;
