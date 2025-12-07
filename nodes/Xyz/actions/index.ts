import { actionRegistry } from '../registry';
import { DownloadMediaFileAction } from './DownloadMediaFile.action';
import { ReadMessageAction } from './ReadMessage.action';
import { SendMediaMessageAction } from './SendMediaMessage.action';
import { SendTextMessageAction } from './SendTextMessage.action';
import type { XyzAction } from './types';

export { type XyzAction } from './types';

// 创建 Action 实例
const actions: XyzAction[] = [
	new ReadMessageAction(),
	new SendTextMessageAction(),
	new SendMediaMessageAction(),
	new DownloadMediaFileAction(),
];

// 注册所有 Action
actionRegistry.registerAll(actions);

// 导出已注册的 Action（保持向后兼容）
export const XYZ_ACTIONS: Record<string, XyzAction> = Object.fromEntries(
	actions.map((action) => [action.name, action]),
);


