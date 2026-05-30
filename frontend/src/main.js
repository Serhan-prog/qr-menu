import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme as antdTheme } from 'antd';
import arEG from 'antd/locale/ar_EG';
import deDE from 'antd/locale/de_DE';
import enUS from 'antd/locale/en_US';
import trTR from 'antd/locale/tr_TR';
import App from './App.js';
import { languageDirections, PreferencesProvider, usePreferences } from './context/PreferencesContext.js';
import './styles.css';

const localeMap = {
  tr: trTR,
  en: enUS,
  de: deDE,
  ar: arEG,
};

function ConfiguredApp() {
  const { language, themeMode } = usePreferences();
  const dark = themeMode === 'dark';

  return (
    <ConfigProvider
      locale={localeMap[language] || trTR}
      direction={languageDirections[language] || 'ltr'}
      theme={{
        algorithm: dark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#0f766e',
          borderRadius: 8,
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          colorBgLayout: dark ? '#0d1513' : '#f3f6f4',
        },
        components: {
          Button: { controlHeight: 38 },
          Card: { borderRadiusLG: 8 },
          Table: { headerBg: dark ? '#15211f' : '#f6f8f8' },
        },
      }}
    >
      <App />
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PreferencesProvider>
      <ConfiguredApp />
    </PreferencesProvider>
  </React.StrictMode>
);
