import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';
import App from './App.js';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider
      locale={trTR}
      theme={{
        token: {
          colorPrimary: '#0f766e',
          borderRadius: 8,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
        components: {
          Button: { controlHeight: 38 },
          Card: { borderRadiusLG: 8 },
          Table: { headerBg: '#f6f8f8' },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
