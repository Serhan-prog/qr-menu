import { Button, Select, Space, Tooltip } from 'antd';
import { GlobalOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { languages, usePreferences } from '../context/PreferencesContext.js';

const languageOptions = languages.map((language) => ({
  ...language,
  label: language.label,
  shortLabel: language.value.toUpperCase(),
}));

function PreferenceControls({ className = '' }) {
  const { language, setLanguage, themeMode, toggleTheme, t } = usePreferences();
  const dark = themeMode === 'dark';

  return (
    <Space className={`preference-controls ${className}`} wrap>
      <Tooltip title={dark ? t('common.light') : t('common.dark')}>
        <Button
          className="preference-theme-button"
          icon={dark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          aria-label={dark ? t('common.light') : t('common.dark')}
        />
      </Tooltip>
      <Select
        className="language-select"
        value={language}
        onChange={setLanguage}
        optionLabelProp="shortLabel"
        options={languageOptions}
        popupMatchSelectWidth={false}
        suffixIcon={<GlobalOutlined />}
        aria-label={t('common.language')}
      />
    </Space>
  );
}

export default PreferenceControls;
