/**
 * 微信自定义 tabBar 组件配置：
 * - component: true 微信要求必须声明，否则组件不按组件渲染
 * - styleIsolation: 'apply-shared' 使 app.wxss(@import common.wxss) 中的
 *   CSS Modules 样式（tabBar 布局类）能作用到本组件，否则原生 tabBar 无样式
 */
export default {
  component: true,
  styleIsolation: 'apply-shared',
};
