import { Button, Card, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FireOutlined } from '@ant-design/icons';
import { currency, dateTime } from '../../utils/format.js';
import { usePreferences } from '../../context/PreferencesContext.js';

const { Text, Title } = Typography;

const activeStatuses = ['PENDING', 'PREPARING', 'READY'];

function AdminKitchenPanel({ orders, onStatusChange, onCancel }) {
  const { t } = usePreferences();
  const visibleOrders = orders.filter((order) => activeStatuses.includes(order.status));

  if (visibleOrders.length === 0) {
    return (
      <div className="empty-panel">
        <Empty description={t('admin.messages.emptyKitchen')} />
      </div>
    );
  }

  return (
    <Row gutter={[16, 16]} className="responsive-row">
      {visibleOrders.map((order) => (
        <Col xs={24} md={12} xxl={8} key={order.id}>
          <Card className={`kitchen-card status-${order.status.toLowerCase()}`}>
            <div className="kitchen-card-head">
              <div>
                <Title level={3}>{t('admin.columns.table')} {order.tableNumber}</Title>
                <Text>{t('admin.columns.order')} #{order.id} - {dateTime(order.createdAt)}</Text>
              </div>
              <Tag color={statusColor(order.status)}>{statusLabel(order.status, t)}</Tag>
            </div>

            {order.note && <Text className="kitchen-order-note"><strong>{t('admin.messages.orderNote')}:</strong> {order.note}</Text>}
            <div className="kitchen-items">
              {order.items.map((item) => (
                <div className="kitchen-item" key={item.id}>
                  <strong>{item.quantity}x</strong>
                  <span>
                    {item.productName}
                    {item.note && <small>{item.note}</small>}
                  </span>
                  <Text>{currency(item.lineTotal)}</Text>
                </div>
              ))}
            </div>

            <Space className="kitchen-actions">
              {order.status === 'PENDING' && (
                <Button type="primary" icon={<FireOutlined />} onClick={() => onStatusChange(order.id, 'PREPARING')}>
                  {t('admin.actions.startPreparing')}
                </Button>
              )}
              {order.status === 'PREPARING' && (
                <Button type="primary" icon={<ClockCircleOutlined />} onClick={() => onStatusChange(order.id, 'READY')}>
                  {t('admin.actions.markReady')}
                </Button>
              )}
              {order.status === 'READY' && (
                <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onStatusChange(order.id, 'SERVED')}>
                  {t('admin.actions.markServed')}
                </Button>
              )}
              <Button danger icon={<CloseCircleOutlined />} onClick={() => onCancel(order)}>
                {t('admin.actions.cancelOrder')}
              </Button>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

function statusLabel(status, t) {
  const label = t(`admin.states.${status}`);
  return label === `admin.states.${status}` ? status : label;
}

function statusColor(status) {
  const colors = { PENDING: 'orange', PREPARING: 'blue', READY: 'green' };
  return colors[status] || 'default';
}

export default AdminKitchenPanel;
