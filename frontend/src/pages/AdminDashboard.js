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
  DownloadOutlined,
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
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
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
  const [productCategoryFilter, setProductCategoryFilter] = useState('all');
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
        const localizedNotification = adminNotificationText(notification, t);
        message.info(`${localizedNotification.title}: ${localizedNotification.message}`);
        loadScopedData(restaurantId);
      },
    });
  }, [restaurantId, t]);

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

  const productCategoryOptions = useMemo(
    () => [
      { label: t('admin.messages.allCategories'), value: 'all' },
      ...categories
        .map((category) => ({ label: category.name, value: category.id }))
        .sort((a, b) => a.label.localeCompare(b.label, 'tr')),
    ],
    [categories, t]
  );

  const filteredProducts = useMemo(
    () =>
      productCategoryFilter === 'all'
        ? products
        : products.filter((product) => product.categoryId === productCategoryFilter),
    [products, productCategoryFilter]
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
        const payload = { ...values, restaurantId, sortOrder: modal.record?.sortOrder ?? 0 };
        modal.record ? await qrMenuApi.updateCategory(modal.record.id, payload) : await qrMenuApi.createCategory(payload);
        await loadScopedData();
      }
      if (modal.type === 'product') {
        const payload = { ...values, restaurantId, sortOrder: modal.record?.sortOrder ?? 0 };
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
      message.success(t('admin.messages.saved'));
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
      message.success(t('admin.messages.deleted'));
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const downloadQrPdf = () => {
    if (!qrRecord) {
      return;
    }

    const canvas = document.getElementById('qr-pdf-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
      message.error(t('admin.messages.qrFailed'));
      return;
    }

    const pdf = createQrPdf({
      imageDataUrl: canvas.toDataURL('image/jpeg', 0.96),
      title: `${t('admin.columns.table')} ${qrRecord.tableNumber} ${t('admin.columns.qr')} ${t('admin.columns.code')}`,
      subtitle: restaurantName,
      url: qrRecord.qrUrl,
    });
    downloadBlob(pdf, `table-${qrRecord.tableNumber}-qr.pdf`);
  };

  const updateOrderStatus = async (id, status, cancellationReason) => {
    try {
      await qrMenuApi.updateOrderStatus(id, status, cancellationReason);
      await loadScopedData();
      message.success(t('admin.messages.orderStatusUpdated'));
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
      message.warning(t('admin.messages.cancellationReasonRequired'));
      return;
    }
    await updateOrderStatus(cancellationModal.order.id, 'CANCELLED', reason);
    closeOrderCancellation();
  };

  const updateWaiterStatus = async (id, status) => {
    try {
      await qrMenuApi.updateWaiterCallStatus(id, status);
      await loadScopedData();
      message.success(status === 'COMPLETED' ? t('admin.messages.waiterApproved') : t('admin.messages.waiterClosed'));
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const updateBillStatus = async (id, status) => {
    try {
      await qrMenuApi.updateBillRequestStatus(id, status);
      await loadScopedData();
      message.success(status === 'PAID' ? t('admin.messages.billPaid') : t('admin.messages.billClosed'));
    } catch (error) {
      message.error(apiError(error));
    }
  };

  const testNotificationSound = async () => {
    const enabled = await enableNotificationSound();
    setSoundEnabled(enabled);
    if (enabled) {
      message.success(t('admin.messages.soundEnabled'));
      return;
    }
    message.warning(t('admin.messages.soundBlocked'));
  };

  const actionColumn = (type) => ({
    title: t('admin.columns.action'),
    width: 120,
    onCell: mobileCellLabel(t('admin.columns.action')),
    render: (_, record) => (
      <Space>
        <Button icon={<EditOutlined />} onClick={() => openModal(type, record)} />
        <Popconfirm
          title={t('admin.actions.confirmDelete')}
          okText={t('admin.actions.delete')}
          cancelText={t('common.cancel')}
          onConfirm={() => remove(type, record.id)}
        >
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
    message.success(t('admin.messages.loggedOut'));
    navigate('/login');
  };

  const tabs = [
    {
      key: 'overview',
      label: t('admin.tabs.overview'),
      icon: <ShopOutlined />,
      children: (
        <div className="dashboard-grid">
          <Card className="section-card dashboard-main-card" title={t('admin.sections.pendingRequests')}>
            <AdminRequestsPanel
              waiterCalls={waiterCalls}
              billRequests={billRequests}
              onWaiterStatusChange={updateWaiterStatus}
              onBillStatusChange={updateBillStatus}
            />
          </Card>
          <Card className="section-card dashboard-main-card" title={t('admin.sections.kitchen')}>
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
            t={t}
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
          t={t}
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
      children: <FeedbackSection t={t} loading={loading} feedbacks={feedbacks} />,
    },
    {
      key: 'tables',
      adminOnly: true,
      label: t('admin.tabs.tables'),
      icon: <TableOutlined />,
      children: (
        <DataSection title={t('admin.sections.tables')} onAdd={() => openModal('table')}>
          <Table
            className="admin-data-table"
            size="middle"
            scroll={{ x: 760 }}
            rowKey="id"
            loading={loading}
            dataSource={tables}
            columns={[
              { title: t('admin.columns.table'), dataIndex: 'tableNumber', sorter: (a, b) => a.tableNumber - b.tableNumber, onCell: mobileCellLabel(t('admin.columns.table')) },
              { title: t('admin.columns.code'), dataIndex: 'tableCode', onCell: mobileCellLabel(t('admin.columns.code')) },
              { title: t('admin.columns.qrLink'), dataIndex: 'qrUrl', render: (value) => <Text copyable>{value}</Text>, onCell: mobileCellLabel(t('admin.columns.qrLink')) },
              { title: t('admin.columns.active'), dataIndex: 'active', render: (value) => activeTag(value, t), onCell: mobileCellLabel(t('admin.columns.active')) },
              {
                title: t('admin.columns.qr'),
                width: 72,
                onCell: mobileCellLabel(t('admin.columns.qr')),
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
            className="admin-data-table"
            size="middle"
            scroll={{ x: 640 }}
            rowKey="id"
            loading={loading}
            dataSource={categories}
            columns={[
              { title: t('admin.columns.name'), dataIndex: 'name', onCell: mobileCellLabel(t('admin.columns.name')) },
              { title: t('admin.columns.description'), dataIndex: 'description', onCell: mobileCellLabel(t('admin.columns.description')) },
              { title: t('admin.columns.active'), dataIndex: 'active', render: (value) => activeTag(value, t), onCell: mobileCellLabel(t('admin.columns.active')) },
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
          <div className="admin-table-toolbar">
            <Select
              className="admin-filter-select"
              value={productCategoryFilter}
              options={productCategoryOptions}
              onChange={setProductCategoryFilter}
            />
            <Text type="secondary">{filteredProducts.length} {t('admin.messages.productsShown')}</Text>
          </div>
          <Table
            className="admin-data-table"
            size="middle"
            scroll={{ x: 640 }}
            rowKey="id"
            loading={loading}
            dataSource={filteredProducts}
            columns={[
              { title: t('admin.columns.name'), dataIndex: 'name', onCell: mobileCellLabel(t('admin.columns.name')) },
              { title: t('admin.columns.category'), dataIndex: 'categoryName', onCell: mobileCellLabel(t('admin.columns.category')) },
              { title: t('admin.columns.price'), dataIndex: 'price', render: currency, onCell: mobileCellLabel(t('admin.columns.price')) },
              { title: t('admin.columns.available'), dataIndex: 'available', render: (value) => activeTag(value, t), onCell: mobileCellLabel(t('admin.columns.available')) },
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
        <DataSection title={t('admin.sections.users')} onAdd={() => openModal('user')}>
          <Table
            className="admin-data-table"
            size="middle"
            scroll={{ x: 760 }}
            rowKey="id"
            loading={loading}
            dataSource={users}
            columns={[
              { title: t('admin.columns.fullName'), dataIndex: 'fullName', onCell: mobileCellLabel(t('admin.columns.fullName')) },
              { title: t('admin.columns.email'), dataIndex: 'email', onCell: mobileCellLabel(t('admin.columns.email')) },
              { title: t('admin.columns.role'), dataIndex: 'role', render: (value) => roleTag(value, t), onCell: mobileCellLabel(t('admin.columns.role')) },
              { title: t('admin.columns.active'), dataIndex: 'active', render: (value) => activeTag(value, t), onCell: mobileCellLabel(t('admin.columns.active')) },
              { title: t('admin.columns.updatedAt'), dataIndex: 'updatedAt', render: dateTime, onCell: mobileCellLabel(t('admin.columns.updatedAt')) },
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
        <DataSection title={t('admin.sections.restaurantInfo')}>
          <Card className="restaurant-profile-card">
            <Title level={3}>{restaurant?.name}</Title>
            <Text>{restaurant?.address}</Text>
            <Text>{restaurant?.phone}</Text>
            <Button type="primary" icon={<EditOutlined />} onClick={() => openModal('restaurant', restaurant)}>
              {t('admin.actions.editRestaurant')}
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
          <Text>{user?.fullName || t('common.staff')} - {roleLabel(user?.role, t)}</Text>
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
            disabledOverflow
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
        title={modalTitle(modal.type, modal.record, t)}
        open={Boolean(modal.type)}
        onCancel={closeModal}
        onOk={saveModal}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {modal.type === 'restaurant' && <RestaurantFields t={t} />}
          {modal.type === 'table' && <TableFields t={t} />}
          {modal.type === 'category' && <CategoryFields t={t} />}
          {modal.type === 'product' && <ProductFields t={t} categories={categories} />}
          {modal.type === 'user' && <UserFields t={t} isEditing={Boolean(modal.record)} />}
        </Form>
      </Modal>

      <Modal
        title={qrRecord ? `${t('admin.columns.table')} ${qrRecord.tableNumber} ${t('admin.columns.qr')} ${t('admin.columns.code')}` : `${t('admin.columns.qr')} ${t('admin.columns.code')}`}
        open={Boolean(qrRecord)}
        onCancel={() => setQrRecord(null)}
        footer={[
          <Button key="close" onClick={() => setQrRecord(null)}>{t('common.close')}</Button>,
          <Button key="pdf" icon={<DownloadOutlined />} onClick={downloadQrPdf}>{t('admin.actions.downloadPdf')}</Button>,
          <Button key="open" type="primary" onClick={() => qrRecord && window.open(qrRecord.qrUrl, '_blank')}>{t('common.openMenu')}</Button>,
        ]}
      >
        {qrRecord && (
          <div className="qr-modal-content">
            <QRCodeSVG value={qrRecord.qrUrl} size={240} level="H" includeMargin />
            <QRCodeCanvas
              id="qr-pdf-canvas"
              value={qrRecord.qrUrl}
              size={720}
              level="H"
              includeMargin
              style={{ display: 'none' }}
            />
            <Title level={4}>{t('admin.columns.table')} {qrRecord.tableNumber}</Title>
            <Text copyable>{qrRecord.qrUrl}</Text>
          </div>
        )}
      </Modal>
      <Modal
        title={cancellationModal.order ? `${t('admin.columns.table')} ${cancellationModal.order.tableNumber} - ${t('admin.actions.cancelOrder')}` : t('admin.actions.cancelOrder')}
        open={Boolean(cancellationModal.order)}
        onCancel={closeOrderCancellation}
        onOk={cancelOrder}
        okText={t('admin.actions.cancelOrder')}
        okButtonProps={{ danger: true }}
        cancelText={t('common.cancel')}
      >
        <div className="cancel-order-form">
          <Text>{t('admin.messages.customerCancellationInfo')}</Text>
          <Input.TextArea
            maxLength={500}
            rows={4}
            placeholder={t('admin.messages.cancellationPlaceholder')}
            value={cancellationModal.reason}
            onChange={(event) => setCancellationModal((current) => ({ ...current, reason: event.target.value }))}
          />
        </div>
      </Modal>
    </Layout>
  );
}

function OrdersTable({ t, loading, orders }) {
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
            {order.note && <Text className="order-note"><strong>{t('admin.messages.orderNote')}:</strong> {order.note}</Text>}
            {order.cancellationReason && <Text className="cancelled-order-note"><strong>{t('admin.messages.cancellationReason')}:</strong> {order.cancellationReason}</Text>}
            <Table
              className="order-items-table"
              size="small"
              tableLayout="fixed"
              rowKey="id"
              pagination={false}
              dataSource={order.items}
              columns={[
                { title: t('admin.columns.product'), dataIndex: 'productName', width: '30%', onCell: mobileCellLabel(t('admin.columns.product')) },
                { title: t('admin.columns.quantity'), dataIndex: 'quantity', width: '12%', onCell: mobileCellLabel(t('admin.columns.quantity')) },
                { title: t('admin.columns.productNote'), dataIndex: 'note', width: '30%', render: (value) => value || '-', onCell: mobileCellLabel(t('admin.columns.productNote')) },
                { title: t('admin.columns.unit'), dataIndex: 'unitPrice', width: '14%', render: currency, onCell: mobileCellLabel(t('admin.columns.unit')) },
                { title: t('admin.columns.total'), dataIndex: 'lineTotal', width: '14%', render: currency, onCell: mobileCellLabel(t('admin.columns.total')) },
              ]}
            />
          </div>
        ),
      }}
      columns={[
        { title: t('admin.columns.table'), dataIndex: 'tableNumber', width: '18%', onCell: mobileCellLabel(t('admin.columns.table')) },
        { title: t('admin.columns.status'), dataIndex: 'status', width: '24%', render: (value) => statusTag(value, t), onCell: mobileCellLabel(t('admin.columns.status')) },
        { title: t('admin.columns.total'), dataIndex: 'totalAmount', width: '22%', render: currency, onCell: mobileCellLabel(t('admin.columns.total')) },
        { title: t('admin.columns.date'), dataIndex: 'createdAt', width: '36%', render: dateTime, onCell: mobileCellLabel(t('admin.columns.date')) },
      ]}
    />
  );
}

function RequestsHistory({ t, loading, waiterCalls, billRequests }) {
  return (
    <div className="request-history-grid">
      <DataSection title={t('admin.sections.waiterCalls')}>
        <Table
          className="history-table requests-history-table"
          size="middle"
          tableLayout="fixed"
          rowKey="id"
          loading={loading}
          dataSource={waiterCalls}
          columns={[
            { title: t('admin.columns.table'), dataIndex: 'tableNumber', width: '16%', onCell: mobileCellLabel(t('admin.columns.table')) },
            { title: t('admin.columns.message'), dataIndex: 'message', width: '34%', render: (value) => value || '-', onCell: mobileCellLabel(t('admin.columns.message')) },
            { title: t('admin.columns.status'), dataIndex: 'status', width: '22%', render: (value) => statusTag(value, t), onCell: mobileCellLabel(t('admin.columns.status')) },
            { title: t('admin.columns.createdAt'), dataIndex: 'createdAt', width: '28%', render: dateTime, onCell: mobileCellLabel(t('admin.columns.createdAt')) },
          ]}
        />
      </DataSection>
      <DataSection title={t('admin.sections.billRequests')}>
        <Table
          className="history-table requests-history-table"
          size="middle"
          tableLayout="fixed"
          rowKey="id"
          loading={loading}
          dataSource={billRequests}
          columns={[
            { title: t('admin.columns.table'), dataIndex: 'tableNumber', width: '16%', onCell: mobileCellLabel(t('admin.columns.table')) },
            { title: t('admin.columns.note'), dataIndex: 'note', width: '34%', render: (value) => value || '-', onCell: mobileCellLabel(t('admin.columns.note')) },
            { title: t('admin.columns.status'), dataIndex: 'status', width: '22%', render: (value) => statusTag(value, t), onCell: mobileCellLabel(t('admin.columns.status')) },
            { title: t('admin.columns.createdAt'), dataIndex: 'createdAt', width: '28%', render: dateTime, onCell: mobileCellLabel(t('admin.columns.createdAt')) },
          ]}
        />
      </DataSection>
    </div>
  );
}

function FeedbackSection({ t, loading, feedbacks }) {
  return (
    <div className="feedback-admin-grid">
      <div className="feedback-summary-grid">
        <Card className="metric-card"><Statistic title={t('admin.columns.overall')} value={average(feedbacks, 'overallRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title={t('admin.columns.food')} value={average(feedbacks, 'foodRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title={t('admin.columns.service')} value={average(feedbacks, 'serviceRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title={t('admin.columns.speed')} value={average(feedbacks, 'speedRating')} precision={1} prefix={<StarOutlined />} /></Card>
        <Card className="metric-card"><Statistic title={t('admin.columns.cleanliness')} value={average(feedbacks, 'cleanlinessRating')} precision={1} prefix={<StarOutlined />} /></Card>
      </div>
      <DataSection title={t('admin.sections.customerRatings')}>
        <Table
          className="admin-data-table feedbacks-table"
          size="middle"
          scroll={{ x: 900 }}
          rowKey="id"
          loading={loading}
          dataSource={feedbacks}
          columns={[
            { title: t('admin.columns.table'), dataIndex: 'tableNumber', onCell: mobileCellLabel(t('admin.columns.table')) },
            { title: t('admin.columns.order'), dataIndex: 'orderId', render: (value) => `#${value}`, onCell: mobileCellLabel(t('admin.columns.order')) },
            { title: t('admin.columns.overall'), dataIndex: 'overallRating', render: ratingStars, onCell: mobileCellLabel(t('admin.columns.overall')) },
            { title: t('admin.columns.food'), dataIndex: 'foodRating', render: ratingStars, onCell: mobileCellLabel(t('admin.columns.food')) },
            { title: t('admin.columns.service'), dataIndex: 'serviceRating', render: ratingStars, onCell: mobileCellLabel(t('admin.columns.service')) },
            { title: t('admin.columns.speed'), dataIndex: 'speedRating', render: ratingStars, onCell: mobileCellLabel(t('admin.columns.speed')) },
            { title: t('admin.columns.cleanliness'), dataIndex: 'cleanlinessRating', render: ratingStars, onCell: mobileCellLabel(t('admin.columns.cleanliness')) },
            { title: t('admin.columns.comment'), dataIndex: 'comment', render: (value) => value || '-', onCell: mobileCellLabel(t('admin.columns.comment')) },
            { title: t('admin.columns.date'), dataIndex: 'createdAt', render: dateTime, onCell: mobileCellLabel(t('admin.columns.date')) },
          ]}
        />
      </DataSection>
    </div>
  );
}

function DataSection({ title, onAdd, children }) {
  const { t } = usePreferences();

  return (
    <Card
      className="section-card"
      title={title}
      extra={onAdd && <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>{t('admin.actions.add')}</Button>}
    >
      {children}
    </Card>
  );
}

function mobileCellLabel(label) {
  return () => ({ 'data-label': label });
}

function adminNotificationText(notification, t) {
  const byType = {
    ORDER_CREATED: ['admin.messages.newOrderTitle', 'admin.messages.newOrderMessage'],
    WAITER_CALL_CREATED: ['admin.messages.waiterCallTitle', 'admin.messages.waiterCallMessage'],
    BILL_REQUEST_CREATED: ['admin.messages.billRequestTitle', 'admin.messages.billRequestMessage'],
    FEEDBACK_CREATED: ['admin.messages.feedbackTitle', 'admin.messages.feedbackMessage'],
  };
  const [titleKey, messageKey] = byType[notification.type] || [];
  if (!titleKey || !messageKey) {
    return {
      title: notification.title,
      message: notification.message,
    };
  }

  return {
    title: t(titleKey),
    message: `${t('admin.columns.table')} ${notification.tableNumber} ${t(messageKey)}`,
  };
}

function RestaurantFields({ t }) {
  return (
    <>
      <Form.Item name="name" label={t('admin.forms.restaurantName')} rules={[{ required: true, message: t('admin.forms.required.restaurantName') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="phone" label={t('admin.forms.phone')}>
        <Input />
      </Form.Item>
      <Form.Item name="address" label={t('admin.forms.address')}>
        <Input.TextArea rows={3} />
      </Form.Item>
    </>
  );
}

function TableFields({ t }) {
  return (
    <>
      <Form.Item name="tableNumber" label={t('admin.forms.tableNumber')} rules={[{ required: true, message: t('admin.forms.required.tableNumber') }]}>
        <InputNumber min={1} className="full-width" />
      </Form.Item>
      <Form.Item name="active" label={t('admin.columns.active')} valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function CategoryFields({ t }) {
  return (
    <>
      <Form.Item name="name" label={t('admin.forms.categoryName')} rules={[{ required: true, message: t('admin.forms.required.categoryName') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label={t('admin.columns.description')}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="active" label={t('admin.columns.active')} valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function ProductFields({ t, categories }) {
  const categoryOptions = categories
    .map((category) => ({ label: category.name, value: category.id }))
    .sort((a, b) => a.label.localeCompare(b.label, 'tr'));

  return (
    <>
      <Form.Item name="categoryId" label={t('admin.columns.category')} rules={[{ required: true, message: t('admin.forms.required.category') }]}>
        <Select
          showSearch
          optionFilterProp="label"
          placeholder={t('admin.forms.categoryPlaceholder')}
          disabled={categoryOptions.length === 0}
          notFoundContent={t('admin.forms.categoryNotFound')}
          options={categoryOptions}
        />
      </Form.Item>
      <Form.Item name="name" label={t('admin.forms.productName')} rules={[{ required: true, message: t('admin.forms.required.productName') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="description" label={t('admin.columns.description')}>
        <Input.TextArea rows={3} />
      </Form.Item>
      <Form.Item name="price" label={t('admin.columns.price')} rules={[{ required: true, message: t('admin.forms.required.price') }]}>
        <InputNumber min={0.01} step={1} className="full-width" />
      </Form.Item>
      <Form.Item name="imageUrl" label={t('admin.forms.imageUrl')}>
        <Input />
      </Form.Item>
      <Form.Item name="available" label={t('admin.columns.available')} valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}

function UserFields({ t, isEditing }) {
  return (
    <>
      <Form.Item name="fullName" label={t('admin.columns.fullName')} rules={[{ required: true, message: t('admin.forms.required.fullName') }]}>
        <Input />
      </Form.Item>
      <Form.Item name="email" label={t('admin.columns.email')} rules={[{ required: true, message: t('admin.forms.required.email') }, { type: 'email', message: t('admin.forms.required.validEmail') }]}>
        <Input />
      </Form.Item>
      <Form.Item
        name="password"
        label={t('admin.forms.password')}
        extra={isEditing ? t('admin.forms.passwordKeep') : undefined}
        rules={isEditing ? [] : [{ required: true, message: t('admin.forms.required.password') }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item name="role" label={t('admin.columns.role')} rules={[{ required: true, message: t('admin.forms.required.role') }]}>
        <Select options={[{ label: t('admin.states.admin'), value: 'ADMIN' }, { label: t('admin.states.staff'), value: 'STAFF' }]} />
      </Form.Item>
      <Form.Item name="active" label={t('admin.columns.active')} valuePropName="checked">
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
    category: { active: true },
    product: { available: true },
    user: { active: true, role: 'STAFF' },
  };
  return defaults[type] || {};
}

function modalTitle(type, record, t) {
  if (!type) {
    return '';
  }

  const name = t(`admin.modalNames.${type}`);
  return `${name || ''} ${record ? t('admin.actions.edit') : t('admin.actions.add')}`;
}

function createQrPdf({ imageDataUrl, title, subtitle, url }) {
  const imageBytes = dataUrlToBytes(imageDataUrl);
  const encoder = new TextEncoder();
  const pageWidth = 595;
  const imageSize = 240;
  const imageX = (pageWidth - imageSize) / 2;
  const content = [
    `BT /F1 24 Tf 72 780 Td (${pdfText(title)}) Tj ET`,
    `BT /F1 13 Tf 72 752 Td (${pdfText(subtitle)}) Tj ET`,
    `q ${imageSize} 0 0 ${imageSize} ${imageX} 430 cm /Im1 Do Q`,
    `BT /F1 10 Tf 72 120 Td (${pdfText(url)}) Tj ET`,
  ].join('\n');
  const contentLength = encoder.encode(content).length;
  const parts = [];
  const offsets = [];
  let offset = 0;

  const addText = (value) => {
    const bytes = encoder.encode(value);
    parts.push(bytes);
    offset += bytes.length;
  };
  const addBytes = (bytes) => {
    parts.push(bytes);
    offset += bytes.length;
  };
  const startObject = (id) => {
    offsets.push(offset);
    addText(`${id} 0 obj\n`);
  };

  addText('%PDF-1.4\n');
  startObject(1);
  addText('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  startObject(2);
  addText('<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  startObject(3);
  addText('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 6 0 R >> /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n');
  startObject(4);
  addText(`<< /Length ${contentLength} >>\nstream\n${content}\nendstream\nendobj\n`);
  startObject(5);
  addText(`<< /Type /XObject /Subtype /Image /Width 720 /Height 720 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >>\nstream\n`);
  addBytes(imageBytes);
  addText('\nendstream\nendobj\n');
  startObject(6);
  addText('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

  const xrefStart = offset;
  addText(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  offsets.forEach((objectOffset) => {
    addText(`${String(objectOffset).padStart(10, '0')} 00000 n \n`);
  });
  addText(`trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  return new Blob(parts, { type: 'application/pdf' });
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function pdfText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function activeTag(value, t) {
  return <Tag color={value ? 'green' : 'red'}>{value ? t('admin.states.active') : t('admin.states.inactive')}</Tag>;
}

function roleTag(value, t) {
  return <Tag icon={<TeamOutlined />} color={value === 'ADMIN' ? 'purple' : 'geekblue'}>{roleLabel(value, t)}</Tag>;
}

function roleLabel(value, t) {
  return value === 'ADMIN' ? t('admin.states.admin') : t('admin.states.staff');
}

function statusTag(value, t) {
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
  return <Tag color={colors[value] || 'default'}>{statusLabel(value, t)}</Tag>;
}

function statusLabel(value, t) {
  const label = t(`admin.states.${value}`);
  return label === `admin.states.${value}` ? value : label;
}

export default AdminDashboard;
