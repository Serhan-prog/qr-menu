import {
  Badge,
  Button,
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

function Menu() {
  const { tableCode } = useParams();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('Menü');

  useEffect(() => {
    loadMenu();
  }, [tableCode]);

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

  const refreshOrders = async () => {
    try {
      const freshOrders = await Promise.all(orders.map((order) => qrMenuApi.getOrder(order.id)));
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
      return [...current, { productId: product.id, name: product.name, price: product.price, quantity: 1 }];
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

  const submitOrder = async () => {
    if (cart.length === 0) {
      message.warning('Sepet boş');
      return;
    }
    setSubmitting(true);
    try {
      const order = await qrMenuApi.createOrder({
        tableCode,
        items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      });
      setOrders((current) => [order, ...current]);
      setCart([]);
      setCartOpen(false);
      setView('Siparişlerim');
      Modal.success({ title: 'Sipariş alındı', content: 'Siparişiniz mutfağa iletildi. Durumunu bu ekrandan takip edebilirsiniz.' });
    } catch (error) {
      message.error(apiError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const callWaiter = async () => {
    try {
      await qrMenuApi.createWaiterCall({ tableCode, message: 'Müşteri garson çağırıyor' });
      message.success('Garson çağrıldı');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const requestBill = async () => {
    try {
      await qrMenuApi.createBillRequest({ tableCode, note: 'Müşteri hesap istiyor' });
      message.success('Hesap isteği gönderildi');
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
            <Button icon={<BellOutlined />} onClick={callWaiter}>Garson Çağır</Button>
            <Button icon={<WalletOutlined />} onClick={requestBill}>Hesap İste</Button>
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
                <Progress percent={orderProgress(order.status)} showInfo={false} strokeColor="#0f766e" />
                <Timeline
                  className="order-timeline"
                  items={statusSteps.map((step) => ({
                    color: statusSteps.findIndex((item) => item.key === order.status) >= statusSteps.findIndex((item) => item.key === step.key) ? 'green' : 'gray',
                    children: step.label,
                  }))}
                />
                <List
                  size="small"
                  dataSource={order.items}
                  renderItem={(item) => (
                    <List.Item>
                      <Text>{item.quantity} x {item.productName}</Text>
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
        title="Sepet"
        placement="right"
        width={420}
        className="cart-drawer"
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        footer={
          <div className="cart-footer">
            <strong>{currency(total)}</strong>
            <Button type="primary" icon={<CheckCircleOutlined />} loading={submitting} onClick={submitOrder}>
              Sipariş Ver
            </Button>
          </div>
        }
      >
        <List
          dataSource={cart}
          locale={{ emptyText: 'Sepet boş' }}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta title={item.name} description={currency(Number(item.price) * item.quantity)} />
              <div className="quantity-control">
                <Button icon={<MinusOutlined />} onClick={() => updateQuantity(item.productId, item.quantity - 1)} />
                <InputNumber min={1} value={item.quantity} onChange={(value) => updateQuantity(item.productId, value || 1)} />
                <Button icon={<PlusOutlined />} onClick={() => updateQuantity(item.productId, item.quantity + 1)} />
              </div>
            </List.Item>
          )}
        />
      </Drawer>
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

export default Menu;
