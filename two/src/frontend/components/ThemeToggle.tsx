import React, { useEffect, useState } from 'react';
import { Button } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { getTheme, toggleTheme, applyTheme, ThemeType } from '../utils/themeStorage';

const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<ThemeType>('light');
  
  useEffect(() => {
    // 组件挂载时获取并应用保存的主题
    const savedTheme = getTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const handleToggleTheme = () => {
    const newTheme = toggleTheme();
    setTheme(newTheme);
  };

  return (
    <Button 
      className="theme-toggle"
      onClick={handleToggleTheme}
      icon={theme === 'light' ? <BulbOutlined /> : <BulbFilled />}
    >
      {theme === 'light' ? '切换暗色主题' : '切换亮色主题'}
    </Button>
  );
};

export default ThemeToggle; 