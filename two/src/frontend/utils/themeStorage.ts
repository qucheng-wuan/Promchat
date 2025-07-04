// 主题类型定义
export type ThemeType = 'light' | 'dark';

// 主题存储的localStorage键名
const THEME_STORAGE_KEY = 'code-repair-theme';

// 保存主题到localStorage
export const saveTheme = (theme: ThemeType): void => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('无法保存主题设置到localStorage');
  }
};

// 从localStorage获取主题
export const getTheme = (): ThemeType => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) as ThemeType;
    return savedTheme === 'dark' ? 'dark' : 'light'; // 默认为亮色主题
  } catch (e) {
    return 'light';
  }
};

// 应用主题到文档
export const applyTheme = (theme: ThemeType): void => {
  document.documentElement.setAttribute('data-theme', theme);
  saveTheme(theme);
  
  // 触发自定义事件，通知其他组件主题已更改
  const themeChangedEvent = new CustomEvent('themeChanged', {
    detail: { theme }
  });
  document.dispatchEvent(themeChangedEvent);
};

// 切换主题
export const toggleTheme = (): ThemeType => {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  applyTheme(newTheme);
  return newTheme;
}; 