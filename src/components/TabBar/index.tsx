import CustomTabBar from '@/custom-tab-bar';

/**
 * 页面内的 tabBar 占位组件（供一级页面在内容末尾渲染）。
 * - H5：无原生 tabBar，必须手动渲染 CustomTabBar
 * - weapp：微信会原生渲染 custom-tab-bar（app.json tabBar.custom: true），
 *   页面内再渲染一份会与原生叠加，故返回 null
 */
const TabBar: React.FC = () => {
  if (process.env.TARO_ENV === 'weapp') {
    return null;
  }
  return <CustomTabBar />;
};

export default TabBar;
