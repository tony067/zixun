/** 标记已读等动作后触发：让所有底部导航红点立即刷新（消息页 dispatch）
 *  独立文件存放：weapp 对 custom-tab-bar 目录特殊编译只保留默认导出，
 *  命名导出会丢失，故不能从 @/custom-tab-bar 导入常量 */
export const UNREAD_REFRESH_EVENT = 'mindpace:unread-refresh';
