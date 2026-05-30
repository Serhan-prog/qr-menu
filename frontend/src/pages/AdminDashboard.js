import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Popconfirm,
  Rate,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  AppstoreOutlined,
  BarsOutlined,
  BellOutlined,
  DeleteOutlined,
  EditOutlined,
  FireOutlined,
  HomeOutlined,
  HistoryOutlined,
  LogoutOutlined,
  PlusOutlined,
  ProfileOutlined,
  QrcodeOutlined,
  ReloadOutlined,
  ShopOutlined,
  ShoppingOutlined,
  SoundOutlined,
  StarOutlined,
  TableOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import AdminKitchenPanel from '../components/admin/AdminKitchenPanel.js';
import AdminRequestsPanel from '../components/admin/AdminRequestsPanel.js';
import { connectAdminNotifications } from '../api/adminRealtime.js';
import { qrMenuApi } from '../api/qrMenuApi.js';
import { apiError, currency, dateTime } from '../utils/format.js';
import { clearAuth, getUser } from '../utils/auth.js';
import { restaurantDisplayName, restaurantInitials } from '../utils/brand.js';
import PreferenceControls from '../components/PreferenceControls.js';
import { usePreferences } from '../context/PreferencesContext.js';
import {
  enableNotificationSound,
  isNotificationSoundReady,
  playNotificationSound,
} from '../utils/notificationSound.js';

const { Content, Header, Sider } = Layout;
const { Title, Text } = Typography;

const orderStatuses = ['PENDING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'];

function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [tables, setTables] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [waiterCalls, setWaiterCalls] = useState([]);
  const [billRequests, setBillRequests] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [modal, setModal] = useState({ type: null, record: null });
  const [cancellationModal, setCancellationModal] = useState({ order: null, reason: '' });
  const [qrRecord, setQrRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [realtimeStatus, setRealtimeStatus] = useState('closed');
  const [soundEnabled, setSoundEnabled] = useState(isNotificationSoundReady());
  const [form] = Form.useForm();
  const user = getUser();
  const isAdmin = user?.role === 'ADMIN';

  const restaurantId = restaurant?.id;
  const restaurantName = restaurantDisplayName(restaurant?.name);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    document.title = `${restaurantName} | ${t('admin.managementPanel')}`;
  }, [restaurantName, t]);

  useEffect(() => {
    if (!restaurantId) {
      return undefined;
    }

    return connectAdminNotifications({
      restaurantId,
      onStatusChange: setRealtimeStatus,
      onNotification: (notification) => {
        playNotificationSound();
        message.info(`${notification.title}: ${notification.message}`);
        loadScopedData(restaurantId);
      },
    });
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId || realtimeStatus === 'connected') {
      return undefined;
    }

    const timer = window.setInterval(() => loadScopedData(restaurantId), 15000);
    return () => window.clearInterval(timer);
  }, [restaurantId, realtimeStatus]);

  const activeOrders = useMemo(
    () => orders.filter((order) => !['SERVED', 'CANCELLED'].includes(order.status)),
    [orders]
  );

  const servedOrders = useMemo(
    () => orders.filter((order) => order.status === 'SERVED').length,
    [orders]
  );

  const waitingRequests = useMemo(
    () =>
      waiterCalls.filter((call) => ['OPEN', 'IN_PROGRESS'].includes(call.status)).length +
      billRequests.filter((request) => request.status === 'OPEN').length,
    [waiterCalls, billRequests]
  );

  const loadAll = async () => {
    setLoading(true);
    try {
      const currentRestaurant = await qrMenuApi.getCurrentRestaurant();
      setRestaurant(currentRestaurant);
      if (currentRestaurant) {
        await loadScopedData(currentRestaurant.id);
      }
    } catch (error) {
      message.error(apiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadScopedData = async (id = restaurantId) => {
    if (!id) {
      return;
    }
    setLoading(true);
    try {
      const [tableList, categoryList, productList, userList, orderList, waiterList, billList, feedbackList] = await Promise.all([
        isAdmin ? qrMenuApi.getTables(id) : Promise.resolve([]),
        isAdmin ? qrMenuApi.getCategories(id) : Promise.resolve([]),
        isAdmin ? qrMenuApi.getProducts({ restaurantId: id }) : Promise.resolve([]),
        isAdmin ? qrMenuApi.getUsers() : Promise.resolve([]),
        qrMenuApi.getOrders(id),
        qrMenuApi.getWaiterCalls(id),
        qrMenuApi.getBillRequests(id),
        qrMenuApi.getFeedbacks(id),
      ]);
      setTables(tableList);
      setCategories(categoryList);
      setProducts(productList);
      setUsers(userList);
      setOrders(orderList);
      setWaiterCalls(waiterList);
      setBillRequests(billList);
      setFeedbacks(feedbackList);
    } catch (error) {
      message.error(apiError(error));
    } finally {
      setLoading(false);
    }
  };

  const openModal = (type, record = null) => {
    setModal({ type, record });
    form.resetFields();
    form.setFieldsValue(record || defaultsFor(type));
  };

  const closeModal = () => {
    setModal({ type: null, record: null });
    form.resetFields();
  };

  const saveModal = async () => {
    const values = await form.validateFields();
    try {
      if (modal.type === 'restaurant') {
        await qrMenuApi.updateRestaurant(restaurant.id, values);
        await loadAll();
      }
      if (modal.type === 'table') {
        const payload = { ...values, restaurantId };
        modal.record ? await qrMenuApi.updateTable(modal.record.id, payload) : await qrMenuApi.createTable(payload);
        await loadScopedData();
      }
      if (modal.type === 'category') {
        const payload = { ...values, restaurantId };
        modal.record ? await qrMenuApi.updateCategory(modal.record.id, payload) : await qrMenuApi.createCategory(payload);
        await loadScopedData();
      }
      if (modal.type === 'product') {
        const payload = { ...values, restaurantId };
        modal.record ? await qrMenuApi.updateProduct(modal.record.id, payload) : await qrMenuApi.createProduct(payload);
        await loadScopedData();
      }
      if (modal.type === 'user') {
        const payload = { ...values, restaurantId };
        if (modal.record && !payload.password) {
          delete payload.password;
        }
        modal.record ? await qrMenuApi.updateUser(modal.record.id, payload) : await qrMenuApi.createUser(payload);
        await loadScopedData();
      }
      message.success('Kaydedildi');
      closeModal();
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const remove = async (type, id) => {
    try {
      const actions = {
        table: qrMenuApi.deleteTable,
        category: qrMenuApi.deleteCategory,
        product: qrMenuApi.deleteProduct,
        user: qrMenuApi.deleteUser,
      };
      await actions[type](id);
      await loadScopedData();
      message.success('Silindi');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const updateOrderStatus = async (id, status, cancellationReason) => {
    try {
      await qrMenuApi.updateOrderStatus(id, status, cancellationReason);
      await loadScopedData();
      message.success('Sipariş durumu güncellendi');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const requestOrderCancellation = (order) => {
    setCancellationModal({ order, reason: order.cancellationReason || '' });
  };

  const closeOrderCancellation = () => {
    setCancellationModal({ order: null, reason: '' });
  };

  const cancelOrder = async () => {
    const reason = cancellationModal.reason.trim();
    if (!reason) {
      message.warning('Müşteriye gösterilecek iptal nedenini girin');
      return;
    }
    await updateOrderStatus(cancellationModal.order.id, 'CANCELLED', reason);
    closeOrderCancellation();
  };

  const updateWaiterStatus = async (id, status) => {
    try {
      await qrMenuApi.updateWaiterCallStatus(id, status);
      await loadScopedData();
      message.success(status === 'COMPLETED' ? 'Garson çağrısı onaylandı' : 'Garson çağrısı kapatıldı');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const updateBillStatus = async (id, status) => {
    try {
      await qrMenuApi.updateBillRequestStatus(id, status);
      await loadScopedData();
      message.success(status === 'PAID' ? 'Hesap isteği ödendi olarak işaretlendi' : 'Hesap isteği kapatıldı');
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const testNotificationSound = async () => {
    const enabled = await enableNotificationSound();
    setSoundEnabled(enabled);
    if (enabled) {
      message.success('Bildirim sesi aktif');
      return;
    }
    message.warning('Tarayıcı sesi engelledi. Sayfayla etkileşime geçip tekrar deneyin.');
  };

  const actionColumn = (type) => ({
    title: '',
    width: 120,
    render: (_, record) => (
      <Space>
        <Button icon={<EditOutlined />} onClick={() => openModal(type, record)} />
        <Popconfirm title="Silinsin mi?" okText="Sil" cancelText="Vazgeç" onConfirm={() => remove(type, record.id)}>
          <Button danger icon={<DeleteOutlined />} />
        </Popconfirm>
      </Space>
    ),
  });

  const logout = async () => {
    try {
      await qrMenuApi.logout();
    } catch {
      // Local auth state is cleared even if the network request fails.
    }
    clearAuth();
    message.success('Çıkış yapıldı');
    navigate('/login');
  };

  const tabs = [
    {
      key: 'overview',
      label: t('admin.tabs.overview'),
      icon: <ShopOutlined />,
      children: (
        <div className="dashboard-grid">
          <Card className="section-card dashboard-main-card" title="Bekleyen İstekler">
            <AdminRequestsPanel
              waiterCalls={waiterCalls}
              billRequests={billRequests}
              onWaiterStatusChange={updateWaiterStatus}
              onBillStatusChange={updateBillStatus}
            />
          </Card>
          <Card className="section-card dashboard-main-card" title="Mutfak">
            <AdminKitchenPanel orders={orders} onStatusChange={updateOrderStatus} onCancel={requestOrderCancellation} />
          </Card>
        </div>
      ),
    },
    {
      key: 'orders',
      label: t('admin.tabs.orders'),
      icon: <ShoppingOutlined />,
      children: (
        <DataSection title={t('admin.tabs.orders')}>
          <OrdersTable
            loading={loading}
            orders={orders}
          />
        </DataSection>
      ),
    },
    {
      key: 'requests',
      label: t('admin.tabs.requests'),
      icon: <HistoryOutlined />,
      children: (
        <RequestsHistory
          loading={loading}
          waiterCalls={waiterCalls}
          billRequests={billRequests}
        />
      ),
    },
    {
      key: 'feedbacks',
      label: t('admin.tabs.feedbacks'),
      icon: <StarOutlined />,
      children: <FeedbackSection loading={loading} feedbacks={feedbacks} />,
    },
    {
      key: 'tables',
      adminOnly: true,
      label: t('admin.tabs.tables'),
      icon: <TableOutlined />,
      children: (
        <DataSection title="Masalar" onAdd={() => openModal('table')}>
          <Table
            size="middle"
            scroll={{ x: 760 }}
            rowKey="id"
            loading={loading}
            dataSource={tables}
            columns={[
              { title: 'Masa', dataIndex: 'tableNumber', sorter: (a, b) => a.tableNumber - b.tableNumber },
              { title: 'Kod', dataIndex: 'tableCode' },
              { title: 'QR Link', dataIndex: 'qrUrl', render: (value) => <Text copyable>{value}</Text> },
              { title: 'Aktif', dataIndex: 'active', render: activeTag },
              {
                title: 'QR',
                width: 72,
                render: (_, record) => <Button icon={<QrcodeOutlined />} onClick={() => setQrRecord(record)} />,
              },
              actionColumn('table'),
            ]}
          />
        </DataSection>
      ),
    },
    {
      key: 'categories',
      adminOnly: true,
      label: t('admin.tabs.categories'),
      icon: <BarsOutlined />,
      children: (
        <DataSection title={t('admin.tabs.categories')} onAdd={() => openModal('category')}>
          <Table
            size="middle"
            scroll={{ x: 640 }}
            rowKey="id"
            loading={loading}
            dataSource={categories}
            columns={[
              { title: 'Ad', dataIndex: 'name' },
              { title: 'Açıklama', dataIndex: 'description' },
              { title: 'Sıra', dataIndex: 'sortOrder' },
              { title: 'Aktif', dataIndex: 'active', render: activeTag },
              actionColumn('category'),
            ]}
          />
        </DataSection>
      ),
    },
    {
      key: 'products',
      adminOnly: true,
      label: t('admin.tabs.products'),
      icon: <AppstoreOutlined />,
      children: (
        <DataSection title={t('admin.tabs.products')} onAdd={() => openModal('product')}>
          <Table
            size="middle"
            scroll={{ x: 640 }}
            rowKey="id"
            loading={loading}
            dataSource={products}
            columns={[
              { title: 'Ad', dataIndex: 'name' },
              { title: 'Kategori', dataIndex: 'categoryName' },
              { title: 'Fiyat', dataIndex: 'price', render: currency },
              { title: 'Sıra', dataIndex: 'sortOrder' },
              { title: 'Satışta', dataIndex: 'available', render: activeTag },
              actionColumn('product'),
            ]}
          />
        </DataSection>
      ),
    },
    {
      key: 'users',
      adminOnly: true,
      label: t('admin.tabs.users'),
      icon: <TeamOutlined />,
      children: (
        <DataSection title="Kullanıcılar" onAdd={() => openModal('user')}>
          <Table
            size="middle"
            scroll={{ x: 760 }}
            rowKey="id"
            loading={loading}
            dataSource={users}
            columns={[
              { title: 'Ad Soyad', dataIndex: 'fullName' },
              { title: 'E-posta', dataIndex: 'email' },
              { title: 'Rol', dataIndex: 'role', render: roleTag },
              { title: 'Aktif', dataIndex: 'active', render: activeTag },
              { title: 'Güncellendi', dataIndex: 'updatedAt', render: dateTime },
              actionColumn('user'),
            ]}
          />
        </DataSection>
      ),
    },
    {
      key: 'restaurant',
      adminOnly: true,
      label: t('admin.tabs.restaurant'),
      icon: <ShopOutlined />,
      children: (
        <DataSection title="Restoran Bilgisi">
          <Card className="restaurant-profile-card">
            <Title level={3}>{restaurant?.name}</Title>
            <Text>{restaurant?.address}</Text>
            <Text>{restaurant?.phone}</Text>
            <Button type="primary" icon={<EditOutlined />} onClick={() => openModal('restaurant', restaurant)}>
              Restoranı Düzenle
            </Button>
          </Card>
        </DataSection>
      ),
    },
  ].filter((tab) => isAdmin || !tab.adminOnly);

  const sidebarItems = tabs.map((tab) => ({
    key: tab.key,
    icon: tab.icon,
    label: tab.label,
  }));

  return (
    <Layout className="admin-layout">
      <Sider className="admin-sider" width={280}>
        <div className="admin-brand">
          <span className="brand-mark">{restaurantInitials(restaurantName)}</span>
          <div>
            <strong>{restaurantName}</strong>
            <Text>{isAdmin ? t('admin.managementPanel') : t('admin.operationsPanel')}</Text>
          </div>
        </div>
        <div className="admin-sider-summary">
          <div className="sider-summary-card">
            <span><BellOutlined /> {t('admin.pending')}</span>
            <strong>{waitingRequests}</strong>
          </div>
          <div className="sider-summary-card">
            <span><FireOutlined /> {t('admin.activeOrder')}</span>
            <strong>{activeOrders.length}</strong>
          </div>
        </div>
        <Menu
          className="admin-side-menu"
          mode="inline"
          selectedKeys={[activeTab]}
          items={sidebarItems}
          onClick={({ key }) => setActiveTab(key)}
        />
        <div className="admin-sider-footer">
          <Text>{user?.fullName || 'Personel'} - {roleLabel(user?.role)}</Text>
          <Button block danger icon={<LogoutOutlined />} onClick={logout}>
            {t('common.logout')}
          </Button>
        </div>
      </Sider>
      <Layout className="admin-main-layout">
        <Header className="admin-header">
          <div>
            <Title level={3}>{restaurantName}</Title>
            <Text>
              {user?.fullName || t('common.staff')} - {isAdmin
                ? t('admin.adminSubtitle')
                : t('admin.staffSubtitle')}
            </Text>
          </div>
          <Space className="admin-header-actions" wrap>
            <PreferenceControls />
            <Tag color={realtimeStatus === 'connected' ? 'green' : 'default'}>
              {realtimeStatus === 'connected' ? t('admin.realtimeOn') : t('admin.realtimeOff')}
            </Tag>
            <Button icon={<SoundOutlined />} type={soundEnabled ? 'default' : 'primary'} onClick={testNotificationSound}>
              {soundEnabled ? t('admin.soundTest') : t('admin.enableSound')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => loadScopedData()}>
              {t('common.refresh')}
            </Button>
            <Button danger icon={<LogoutOutlined />} onClick={logout}>
              {t('common.logout')}
            </Button>
          </Space>
        </Header>
        <Content className="admin-content">
          <Menu
            className="mobile-admin-menu"
            mode="horizontal"
            selectedKeys={[activeTab]}
            items={sidebarItems}
            onClick={({ key }) => setActiveTab(key)}
          />
          <div className="admin-page-title">
            <div>
              <Text className="page-kicker">{t('admin.liveOperation')}</Text>
              <Title level={2}>{tabs.find((tab) => tab.key === activeTab)?.label}</Title>
            </div>
            <Space className="admin-title-tags" wrap>
              {isAdmin && <Tag icon={<HomeOutlined />} color="green">{tables.length} {t('admin.tables')}</Tag>}
              {!isAdmin && <Tag icon={<ShoppingOutlined />} color="gold">{activeOrders.length} {t('admin.activeOrders')}</Tag>}
              <Tag icon={<ProfileOutlined />} color="blue">{servedOrders} {t('admin.served')}</Tag>
              <Tag icon={<StarOutlined />} color="gold">{feedbacks.length} {t('admin.ratings')}</Tag>
            </Space>
          </div>
          <div className="stats-grid">
            {isAdmin && <Card className="metric-card"><Statistic title={t('admin.tableMetric')} value={tables.length} prefix={<TableOutlined />} /></Card>}
            {isAdmin && <Card className="metric-card"><Statistic title={t('admin.productMetric')} value={products.length} prefix={<AppstoreOutlined />} /></Card>}
            {!isAdmin && <Card className="metric-card"><Statistic title={t('admin.orderMetric')} value={orders.length} prefix={<ProfileOutlined />} /></Card>}
            {!isAdmin && <Card className="metric-card"><Statistic title={t('admin.servedMetric')} value={servedOrders} prefix={<TableOutlined />} /></Card>}
            <Card className="metric-card"><Statistic title={t('admin.activeOrder')} value={activeOrders.length} prefix={<ShoppingOutlined />} /></Card>
            <Card className="metric-card alert-metric"><Statistic title={t('admin.pendingRequestMetric')} value={waitingRequests} prefix={<BellOutlined />} /></Card>
            <Card className="metric-card"><Statistic title={t('admin.overallRating')} value={average(feedbacks, 'overallRating')} precision={1} prefix={<StarOutlined />} /></Card>
          </div>
          <Tabs className="admin-tabs" activeKey={activeTab} items={tabs} renderTabBar={() => null} />
        </Content>
      </Layout>

      <Modal
        title={modalTitle(modal.type, modal.record)}
        open={Boolean(modal.type)}
        onCancel={closeModal}
        onOk={saveModal}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {modal.type === 'restaurant' && <RestaurantFields />}
          {modal.type === 'table' && <TableFields />}
          {modal.type === 'category' && <CategoryFields />}
          {modal.type === 'product' && <ProductFields categories={categories} />}
          {modal.type === 'user' && <UserFields isEditing={Boolean(modal.record)} />}
        </Form>
      </Modal>

      <Modal
        title={qrRecord ? `Masa ${qrRecord.tableNumber} QR Kodu` : 'QR Kodu'}
        open={Boolean(qrRecord)}
        onCancel={() => setQrRecord(null)}
        footer={[
          <Button key="close" onClick={() => setQrRecord(null)}>Kapat</Button>,
          <Button key="open" type="primary" onClick={() => qrRecord && window.open(qrRecord.qrUrl, '_blank')}>Menüyü Aç</Button>,
        ]}
      >
        {qrRecord && (
          <div className="qr-modal-content">
            <QRCodeSVG value={qrRecord.qrUrl} size={240} level="H" includeMargin />
            <Title level={4}>Masa {qrRecord.tableNumber}</Title>
            <Text copyable>{qrRecord.qrUrl}</Text>
          </div>
        )}
      </Modal>
      <Modal
        title={cancellationModal.order ? `Masa ${cancellationModal.order.tableNumber} Siparişini İptal Et` : 'Siparişi İptal Et'}
        open={Boolean(cancellationModal.order)}
        onCancel={closeOrderCancellation}
        onOk={cancelOrder}
        okText="Siparişi İptal Et"
        okButtonProps={{ danger: true }}
        cancelText="Vazgeç"
      >
        <div className="cancel-order-form">
          <Text>Müşteri bu nedeni sipariş takibinde görecek.</Text>
          <Input.TextArea
            maxLength={500}
            rows={4}
            placeholder="Örn. Seçilen ürün stokta kalmadı."
            value={cancellationModal.reason}
            onChange={(event) => setCancellationModal((current) => ({ ...current, reason: event.target.value }))}
          />
        </div>
      </Modal>
    </Layout>
  );
}

function OrdersTable({ loading, orders }) {
  return (
    <Table
      className="history-table orders-history-table"
      size="middle"
      tableLayout="fixed"
      rowKey="id"
      loading={loading}
      dataSource={orders}
      expandable={{
        expandedRowRender: (order) => (
          <div className="order-detail">
            {order.note && <Text className="order-note"><strong>Sipariş notu:</strong> {order.note}</Text>}
            {order.cancellationReason && <Text className="cancelled-order-note"><strong>İptal nedeni:</strong> {order.cancellationReason}</Text>}
            <Table
              className="order-items-table"
              size="small"
              tableLayout="fixed"
              rowKey="id"
              pagination={false}
              dataSource={order.items}
              columns={[
                { title: 'Ürün', dataIndex: 'productName', width: '30%', onCell: mobileCellLabel('Ürün') },
                { title: 'Adet', dataIndex: 'quantity', width: '12%', onCell: mobileCellLabel('Adet') },
                { title: 'Ürün Notu', dataIndex: 'note', width: '30%', render: (value) => value || '-', onCell: mobileCellLabel('Ürün Notu') },
                { title: 'Birim', dataIndex: 'unitPrice', width: '14%', render: currency, onCell: mobileCellLabel('Birim') },
                { title: 'Toplam', dataIndex: 'lineTotal', width: '14%', render: currency, onCell: mobileCellLabel('Toplam') },
              ]}
            />
          </div>
        ),
      }}
      columns={[
        { title: 'Masa', dataIndex: 'tableNumber', width: '18%', onCell: mobileCellLabel('Masa') },
        { title: 'Durum', dataIndex: 'status', width: '24%', render: statusTag, onCell: mobileCellLabel('Durum') },
        { title: 'Toplam', dataIndex: 'totalAmount', width: '22%', render: currency, onCell: mobileCellLabel('Toplam') },
        { title: 'Tarih', dataIndex: 'createdAt', width: '36%', render: dateTime, onCell: mobileCellLabel('Tarih') },
      ]}
    />
  );
}

function RequestsHistory({ loading, waiterCalls, billRequests }) {
  return (
    <div className="request-history-grid">
      <DataSection title="Garson Çağrıları">
        <Table
          className="history-table requests-history-table"
          size="middle"
          tableLayout="fixed"
          rowKey="id"
          loading={loading}
          dataSource={waiterCalls}
          columns={[
            { title: 'Masa', dataIndex: 'tableNumber', width: '16%', onCell: mobileCellLabel('Masa') },
            { title: 'Mesaj', dataIndex: 'message', width: '34%', render: (value) => value || '-', onCell: mobileCellLabel('Mesaj') },
            { title: 'Durum', dataIndex: 'status', width: '22%', render: statusTag, onCell: mobileCellLabel('Durum') },
            { title: 'Oluşturuldu', dataIndex: 'createdAt', width: '28%', render: dateTime, onCell: mobileCellLabel('Oluşturuldu') },
          ]}
        />
      </DataSection>
      <DataSection title="Hesap İstekleri">
        <Table
          className="history-table requests-history-table"
          size="middle"
          tableLayout="fixed"
          rowKey="id"
          loading={loading}
          dataSource={billRequests}
          columns={[
            { title: 'Masa', dataIndex: 'tableNumber', width: '16%', onCell: mobileCellLabel('Masa') },
            { title: 'Not', dataIndex: 'note', width: '34%', render: (value) => value || '-', onCell: mobileCellLabel('Not') },
            { title: 'Durum', dataIndex: 'status', width: '22%', render: statusTag, onCell: mobileCellLabel('Durum') },
            { title: 'Oluşturuldu', dataIndex: 'createdAt', width: '28%', render: dateTime, onCell: mobileCellLabel('Oluşturuldu') },
          ]}
        />
      </DataSection>
    </div>
  );
}

function FeedbackSection({ loading, feedbacks }) {
  return (
    <div className="feedback-admin-grid">
      <div className="feedback-summary-grid">
        <Card className="metric-card"><Statistic title="Genel" value={average(feedbacks, 'overallRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title="Yemek" value={average(feedbacks, 'foodRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title="Servis" value={average(feedbacks, 'serviceRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title="Hız" value={average(feedbacks, 'speedRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title="Temizlik" value={average(feedbacks, 'cleanlinessRating')} precision={1} prefix={<StarOutlined />} /></Card>
      </div>
      <DataSection title="Müşteri Puanları">
        <Table
          size="middle"
          scroll={{ x: 900 }}
          rowKey="id"
          loading={loading}
          dataSource={feedbacks}
          columns={[
            { title: 'Masa', dataIndex: 'tableNumber' },
            { title: 'Sipariş', dataIndex: 'orderId', render: (value) => `#${value}` },
            { title: 'Genel', dataIndex: 'overallRating', render: ratingStars },
            { title: 'Yemek', dataIndex: 'foodRating', render: ratingStars },
            { title: 'Servis', dataIndex: 'serviceRating', render: ratingStars },
            { title: 'Hız', dataIndex: 'speedRating', render: ratingStars },
            { title: 'Temizlik', dataIndex: 'cleanlinessRating', render: ratingStars },
            { title: 'Yorum', dataIndex: 'comment', render: (value) => value || '-' },
            { title: 'Tarih', dataIndex: 'createdAt', render: dateTime },
          ]}
        />
      </DataSection>
    </div>
  );
}

function DataSection({ title, onAdd, children }) {
  return (
    <Card
      className="section-card"
      title={title}
      extra={onAdd && <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>Ekle</Button>}
    >
      {children}
    </Card>
  );
}

function mobileCellLabel(label) {
  return () => ({ 'data-label': label });
}

function RestaurantFields() {
  return (
    <>
      <Form.Item name="name" label="Restoran Adı" rules={[{ required: true, message: 'Restoran adı zorunlu' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="phone" label="Telefon">
        <Input />
      </Form.Item>
      <Form.Item name="address" label="Adres">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="active" label="Aktif" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function TableFields() {
  return (
    <>
      <Form.Item name="tableNumber" label="Masa Numarası" rules={[{ required: true, message: 'Masa numarası zorunlu' }]}>
        <InputNumber min={1} className="full-width" />
      </Form.Item>
      <Form.Item name="active" label="Aktif" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function CategoryFields() {
  return (
    <>
      <Form.Item name="name" label="Kategori Adı" rules={[{ required: true, message: 'Kategori adı zorunlu' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Açıklama">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="sortOrder" label="Sıra">
        <InputNumber min={0} className="full-width" />
      </Form.Item>
      <Form.Item name="active" label="Aktif" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function ProductFields({ categories }) {
  return (
    <>
      <Form.Item name="categoryId" label="Kategori" rules={[{ required: true, message: 'Kategori zorunlu' }]}>
        <Select options={categories.map((category) => ({ label: category.name, value: category.id }))} />
      </Form.Item>
      <Form.Item name="name" label="Ürün Adı" rules={[{ required: true, message: 'Ürün adı zorunlu' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Açıklama">
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="price" label="Fiyat" rules={[{ required: true, message: 'Fiyat zorunlu' }]}>
        <InputNumber min={0.01} step={1} className="full-width" />
      </Form.Item>
      <Form.Item name="imageUrl" label="Görsel URL">
        <Input />
      </Form.Item>
      <Form.Item name="sortOrder" label="Sıra">
        <InputNumber min={0} className="full-width" />
      </Form.Item>
      <Form.Item name="available" label="Satışta" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function UserFields({ isEditing }) {
  return (
    <>
      <Form.Item name="fullName" label="Ad Soyad" rules={[{ required: true, message: 'Ad soyad zorunlu' }]}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label="E-posta" rules={[{ required: true, message: 'E-posta zorunlu' }, { type: 'email', message: 'Geçerli e-posta girin' }]}>
        <Input />
      </Form.Item>
      <Form.Item
        name="password"
        label="Parola"
        extra={isEditing ? 'Boş bırakırsanız mevcut parola korunur.' : undefined}
        rules={isEditing ? [] : [{ required: true, message: 'Kaydetmek için parola girin' }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item name="role" label="Rol" rules={[{ required: true, message: 'Rol zorunlu' }]}>
        <Select options={[{ label: 'Yönetici', value: 'ADMIN' }, { label: 'Personel', value: 'STAFF' }]} />
      </Form.Item>
      <Form.Item name="active" label="Aktif" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function average(items, key) {
  if (!items.length) {
    return 0;
  }
  return items.reduce((sum, item) => sum + Number(item[key] || 0), 0) / items.length;
}

function ratingStars(value) {
  return <Rate disabled value={value} />;
}

function defaultsFor(type) {
  const defaults = {
    table: { active: true },
    category: { active: true, sortOrder: 0 },
    product: { available: true, sortOrder: 0 },
    user: { active: true, role: 'STAFF' },
  };
  return defaults[type] || {};
}

function modalTitle(type, record) {
  const names = {
    restaurant: 'Restoran',
    table: 'Masa',
    category: 'Kategori',
    product: 'Ürün',
    user: 'Kullanıcı',
  };
  return `${names[type] || ''} ${record ? 'Düzenle' : 'Ekle'}`;
}

function option(value) {
  return { label: statusLabel(value), value };
}

function activeTag(value) {
  return <Tag color={value ? 'green' : 'red'}>{value ? 'Aktif' : 'Pasif'}</Tag>;
}

function roleTag(value) {
  return <Tag icon={<TeamOutlined />} color={value === 'ADMIN' ? 'purple' : 'geekblue'}>{value === 'ADMIN' ? 'Yönetici' : 'Personel'}</Tag>;
}

function roleLabel(value) {
  return value === 'ADMIN' ? 'Yönetici' : 'Personel';
}

function statusTag(value) {
  const colors = {
    OPEN: 'orange',
    PENDING: 'orange',
    IN_PROGRESS: 'blue',
    PREPARING: 'blue',
    READY: 'cyan',
    SERVED: 'green',
    COMPLETED: 'green',
    PAID: 'green',
    CANCELLED: 'red',
  };
  return <Tag color={colors[value] || 'default'}>{statusLabel(value)}</Tag>;
}

function statusLabel(value) {
  const labels = {
    OPEN: 'Açık',
    PENDING: 'Yeni',
    IN_PROGRESS: 'İşlemde',
    PREPARING: 'Hazırlanıyor',
    READY: 'Hazır',
    SERVED: 'Servis Edildi',
    COMPLETED: 'Tamamlandı',
    PAID: 'Ödendi',
    CANCELLED: 'İptal',
  };
  return labels[value] || value;
}

export default AdminDashboard;
