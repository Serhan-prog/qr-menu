import {
  Badge,
  Button,
  Alert,
  Drawer,
  Empty,
  Input,
  InputNumber,
  Layout,
  List,
  Modal,
  Progress,
  Result,
  Segmented,
  Spin,
  Tabs,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import {
  BellOutlined,
  CheckCircleOutlined,
  MinusOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { qrMenuApi } from '../api/qrMenuApi.js';
import { apiError, currency, dateTime } from '../utils/format.js';

const { Content } = Layout;
const { Text, Title } = Typography;

const categoryImages = {
  Başlangıçlar: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=900&q=80',
  'Ana Yemekler': 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
  İçecekler: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=900&q=80',
  Tatlılar: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=900&q=80',
};

const statusSteps = [
  { key: 'PENDING', label: 'Alındı' },
  { key: 'PREPARING', label: 'Hazırlanıyor' },
  { key: 'READY', label: 'Hazır' },
  { key: 'SERVED', label: 'Servis Edildi' },
];

const ORDER_STORAGE_PREFIX = 'qr_menu_table_orders:';
const FINAL_ORDER_STATUSES = ['SERVED', 'CANCELLED'];

function Menu() {
  const { tableCode } = useParams();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderNote, setOrderNote] = useState('');
  const [requestModal, setRequestModal] = useState(null);
  const [requestNote, setRequestNote] = useState('');
  const [search, setSearch] = useState('');
  const [view, setView] = useState('Menü');

  useEffect(() => {
    loadMenu();
    restoreTrackedOrders();
  }, [tableCode]);

  useEffect(() => {
    if (menu?.restaurantName) {
      document.title = `${menu.restaurantName} | Masa ${menu.tableNumber}`;
    }
  }, [menu?.restaurantName, menu?.tableNumber]);

  useEffect(() => {
    if (orders.length === 0) {
      return undefined;
    }
    const timer = window.setInterval(refreshOrders, 5000);
    return () => window.clearInterval(timer);
  }, [orders]);

  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  const total = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [cart]
  );

  const filteredCategories = useMemo(() => {
    if (!menu) {
      return [];
    }
    const term = search.trim().toLocaleLowerCase('tr-TR');
    if (!term) {
      return menu.categories;
    }
    return menu.categories
      .map((category) => ({
        ...category,
        products: category.products.filter((product) =>
          `${product.name} ${product.description || ''}`.toLocaleLowerCase('tr-TR').includes(term)
        ),
      }))
      .filter((category) => category.products.length > 0);
  }, [menu, search]);

  const loadMenu = async () => {
    setLoading(true);
    try {
      setMenu(await qrMenuApi.getMenu(tableCode));
    } catch (error) {
      message.error(apiError(error));
    } finally {
      setLoading(false);
    }
  };

  const restoreTrackedOrders = async () => {
    const trackingCodes = readStoredTrackingCodes(tableCode);
    if (trackingCodes.length === 0) {
      setOrders([]);
      return;
    }

    try {
      const results = await Promise.allSettled(
        trackingCodes.map((trackingCode) => qrMenuApi.getOrderByTrackingCode(trackingCode))
      );
      const restoredOrders = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      syncStoredTrackingCodes(tableCode, restoredOrders);
      setOrders(restoredOrders);
      if (restoredOrders.length > 0) {
        setView('Siparişlerim');
      }
    } catch {
      // Restoring tracked orders must not block menu usage.
    }
  };

  const refreshOrders = async () => {
    try {
      const results = await Promise.allSettled(
        orders.map((order) => qrMenuApi.getOrderByTrackingCode(order.trackingCode))
      );
      const freshOrders = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

      freshOrders.forEach((freshOrder) => {
        const previousOrder = orders.find((order) => order.trackingCode === freshOrder.trackingCode);
        if (previousOrder?.status !== 'CANCELLED' && freshOrder.status === 'CANCELLED') {
          Modal.warning({
            title: 'Siparişiniz iptal edildi',
            content: freshOrder.cancellationReason || 'Restoran siparişinizi iptal etti.',
          });
        }
      });
      syncStoredTrackingCodes(tableCode, freshOrders);
      setOrders(freshOrders);
    } catch {
      // Polling sessiz kalır; ana işlemler message ile bildirilir.
    }
  };

  const addToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...current, { productId: product.id, name: product.name, price: product.price, quantity: 1, note: '' }];
    });
    message.success(`${product.name} sepete eklendi`);
  };

  const updateQuantity = (productId, quantity) => {
    setCart((current) =>
      current
        .map((item) => (item.productId === productId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const updateItemNote = (productId, note) => {
    setCart((current) =>
      current.map((item) => (item.productId === productId ? { ...item, note } : item))
    );
  };

  const submitOrder = async () => {
    if (cart.length === 0) {
      message.warning('Sepet boş');
      return;
    }
    setSubmitting(true);
    try {
      const order = await qrMenuApi.createOrder({
        tableCode,
        note: orderNote.trim() || null,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          note: item.note.trim() || null,
        })),
      });
      rememberTrackingCode(tableCode, order.trackingCode);
      setOrders((current) => [order, ...current]);
      setCart([]);
      setOrderNote('');
      setCartOpen(false);
      setView('Siparişlerim');
      Modal.success({ title: 'Sipariş alındı', content: 'Siparişiniz mutfağa iletildi. Durumunu bu ekrandan takip edebilirsiniz.' });
    } catch (error) {
      message.error(apiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const openRequestModal = (type) => {
    setRequestModal(type);
    setRequestNote('');
  };

  const closeRequestModal = () => {
    setRequestModal(null);
    setRequestNote('');
  };

  const submitServiceRequest = async () => {
    try {
      if (requestModal === 'waiter') {
        await qrMenuApi.createWaiterCall({
          tableCode,
          message: requestNote.trim() || 'Müşteri garson çağırıyor',
        });
        message.success('Garson çağrıldı');
      }
      if (requestModal === 'bill') {
        await qrMenuApi.createBillRequest({
          tableCode,
          note: requestNote.trim() || 'Müşteri hesap istiyor',
        });
        message.success('Hesap isteği gönderildi');
      }
      closeRequestModal();
    } catch (error) {
      message.error(apiError(error));
    }
  };

  if (loading) {
    return <Spin fullscreen />;
  }

  if (!menu) {
    return <Result status="404" title="Menü bulunamadı" />;
  }

  return (
    <Layout className="menu-page visual-menu-page">
      <section className="menu-hero">
        <div className="menu-hero-overlay">
          <Tag color="gold">Masa {menu.tableNumber}</Tag>
          <Title>{menu.restaurantName}</Title>
          <Text>QR menüden sipariş verin, garson çağırın ve sipariş durumunu anlık takip edin.</Text>
          <div className="menu-hero-actions">
            <Button icon={<BellOutlined />} onClick={() => openRequestModal('waiter')}>Garson Çağır</Button>
            <Button icon={<WalletOutlined />} onClick={() => openRequestModal('bill')}>Hesap İste</Button>
            <Badge count={cartCount}>
              <Button type="primary" icon={<ShoppingCartOutlined />} onClick={() => setCartOpen(true)}>Sepet</Button>
            </Badge>
          </div>
        </div>
      </section>

      <Content className="menu-content visual-menu-content">
        <div className="menu-toolbar">
          <Segmented value={view} onChange={setView} options={['Menü', 'Siparişlerim']} />
          <Input
            className="menu-search"
            size="large"
            prefix={<SearchOutlined />}
            placeholder="Ürün ara"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {view === 'Menü' && (
          <Tabs
            className="menu-tabs"
            items={filteredCategories.map((category) => ({
              key: String(category.id),
              label: category.name,
              children: (
                <div className="visual-product-grid">
                  {category.products.length === 0 && <Empty description="Bu kategoride ürün yok" />}
                  {category.products.map((product) => (
                    <article className="visual-product-card" key={product.id}>
                      <div
                        className="product-image"
                        style={{ backgroundImage: `url(${product.imageUrl || categoryImages[category.name] || categoryImages['Ana Yemekler']})` }}
                      />
                      <div className="visual-product-body">
                        <div>
                          <Title level={4}>{product.name}</Title>
                          <Text>{product.description}</Text>
                        </div>
                        <div className="product-footer">
                          <strong>{currency(product.price)}</strong>
                          <Button type="primary" icon={<PlusOutlined />} onClick={() => addToCart(product)}>
                            Ekle
                          </Button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ),
            }))}
          />
        )}

        {view === 'Siparişlerim' && (
          <div className="order-track-list">
            {orders.length === 0 && <Empty description="Henüz sipariş verilmedi" />}
            {orders.map((order) => (
              <article className="order-track-card" key={order.id}>
                <div className="order-track-head">
                  <div>
                    <Title level={4}>Sipariş #{order.id}</Title>
                    <Text>{dateTime(order.createdAt)}</Text>
                  </div>
                  <Tag color={statusColor(order.status)}>{statusLabel(order.status)}</Tag>
                </div>
                {order.status === 'CANCELLED' && (
                  <Alert
                    className="cancelled-order-alert"
                    type="error"
                    showIcon
                    message="Sipariş iptal edildi"
                    description={order.cancellationReason || 'Restoran siparişinizi iptal etti.'}
                  />
                )}
                <Progress
                  percent={orderProgress(order.status)}
                  showInfo={false}
                  strokeColor={order.status === 'CANCELLED' ? '#dc2626' : '#0f766e'}
                />
                <Timeline
                  className="order-timeline"
                  items={statusSteps.map((step) => ({
                    color: statusSteps.findIndex((item) => item.key === order.status) >= statusSteps.findIndex((item) => item.key === step.key) ? 'green' : 'gray',
                    children: step.label,
                  }))}
                />
                {order.note && <Text className="order-customer-note"><strong>Sipariş notu:</strong> {order.note}</Text>}
                <List
                  size="small"
                  dataSource={order.items}
                  renderItem={(item) => (
                    <List.Item>
                      <div className="tracked-order-line">
                        <Text>{item.quantity} x {item.productName}</Text>
                        {item.note && <Text type="secondary">{item.note}</Text>}
                      </div>
                      <strong>{currency(item.lineTotal)}</strong>
                    </List.Item>
                  )}
                />
                <div className="order-track-total">
                  <Text>Toplam</Text>
                  <strong>{currency(order.totalAmount)}</strong>
                </div>
              </article>
            ))}
          </div>
        )}
      </Content>

      <Button
        className="floating-cart-button"
        type="primary"
        icon={<ShoppingCartOutlined />}
        onClick={() => setCartOpen(true)}
      >
        Sepet {cartCount > 0 ? `(${cartCount})` : ''}
      </Button>

      <Drawer
        title={
          <div className="cart-drawer-title">
            <ShoppingCartOutlined />
            <div>
              <strong>Sepet</strong>
              <Text>{cartCount > 0 ? `${cartCount} ürün seçildi` : 'Siparişiniz burada hazırlanır'}</Text>
            </div>
          </div>
        }
        placement="right"
        width={480}
        className="cart-drawer"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        footer={
          <div className="cart-footer">
            <div className="cart-total">
              <Text>Ödenecek Toplam</Text>
              <strong>{currency(total)}</strong>
            </div>
            <Button size="large" type="primary" icon={<CheckCircleOutlined />} loading={submitting} onClick={submitOrder}>
              Sipariş Ver
            </Button>
          </div>
        }
      >
        <div className="cart-shell">
          <List
            className="cart-list"
            dataSource={cart}
            locale={{ emptyText: 'Sepet boş' }}
            renderItem={(item) => (
              <List.Item className="cart-line-item">
                <article className="cart-line-card">
                  <div className="cart-line-head">
                    <div>
                      <Title level={5}>{item.name}</Title>
                      <Text>{currency(item.price)} birim fiyat</Text>
                    </div>
                    <strong>{currency(Number(item.price) * item.quantity)}</strong>
                  </div>
                  <div className="cart-line-controls">
                    <Text strong>Adet</Text>
                    <div className="quantity-control cart-quantity-control">
                      <Button icon={<MinusOutlined />} onClick={() => updateQuantity(item.productId, item.quantity - 1)} />
                      <InputNumber min={1} value={item.quantity} onChange={(value) => updateQuantity(item.productId, value || 1)} />
                      <Button icon={<PlusOutlined />} onClick={() => updateQuantity(item.productId, item.quantity + 1)} />
                    </div>
                  </div>
                  <Input.TextArea
                    maxLength={500}
                    rows={2}
                    placeholder="Ürün notu"
                    value={item.note}
                    onChange={(event) => updateItemNote(item.productId, event.target.value)}
                  />
                </article>
              </List.Item>
            )}
          />
          <div className="cart-order-note">
            <Text strong>Sipariş Notu</Text>
            <Input.TextArea
              maxLength={1000}
              rows={3}
              placeholder="Örn. hepsi birlikte gelsin"
              value={orderNote}
              onChange={(event) => setOrderNote(event.target.value)}
            />
          </div>
        </div>
      </Drawer>
      <Modal
        title={requestModal === 'bill' ? 'Hesap İste' : 'Garson Çağır'}
        open={Boolean(requestModal)}
        onCancel={closeRequestModal}
        onOk={submitServiceRequest}
        okText="Gönder"
        cancelText="Vazgeç"
      >
        <Input.TextArea
          maxLength={500}
          rows={3}
          placeholder={requestModal === 'bill' ? 'Hesap isteğine not ekleyin' : 'Garsona mesaj ekleyin'}
          value={requestNote}
          onChange={(event) => setRequestNote(event.target.value)}
        />
      </Modal>
    </Layout>
  );
}

function orderProgress(status) {
  const map = { PENDING: 20, PREPARING: 50, READY: 80, SERVED: 100, CANCELLED: 100 };
  return map[status] || 0;
}

function statusLabel(status) {
  const labels = {
    PENDING: 'Alındı',
    PREPARING: 'Hazırlanıyor',
    READY: 'Hazır',
    SERVED: 'Servis Edildi',
    CANCELLED: 'İptal Edildi',
  };
  return labels[status] || status;
}

function statusColor(status) {
  const colors = { PENDING: 'orange', PREPARING: 'blue', READY: 'cyan', SERVED: 'green', CANCELLED: 'red' };
  return colors[status] || 'default';
}

function storageKey(tableCode) {
  return `${ORDER_STORAGE_PREFIX}${tableCode}`;
}

function readStoredTrackingCodes(tableCode) {
  try {
    const rawValue = window.localStorage.getItem(storageKey(tableCode));
    const parsedValue = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsedValue) ? parsedValue.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function writeStoredTrackingCodes(tableCode, trackingCodes) {
  try {
    const uniqueCodes = [...new Set(trackingCodes.filter(Boolean))];
    if (uniqueCodes.length === 0) {
      window.localStorage.removeItem(storageKey(tableCode));
      return;
    }
    window.localStorage.setItem(storageKey(tableCode), JSON.stringify(uniqueCodes));
  } catch {
    // If localStorage is unavailable, tracking works only for the current page session.
  }
}

function rememberTrackingCode(tableCode, trackingCode) {
  writeStoredTrackingCodes(tableCode, [trackingCode, ...readStoredTrackingCodes(tableCode)]);
}

function syncStoredTrackingCodes(tableCode, orders) {
  const activeTrackingCodes = orders
    .filter((order) => !FINAL_ORDER_STATUSES.includes(order.status))
    .map((order) => order.trackingCode);
  writeStoredTrackingCodes(tableCode, activeTrackingCodes);
}

export default Menu;
