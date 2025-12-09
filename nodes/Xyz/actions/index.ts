import { actionRegistry } from '../registry';
import { DeleteMessageAction } from './DeleteMessage.action';
import { DownloadMediaFileAction } from './DownloadMediaFile.action';
import { EditMessageAction } from './EditMessage.action';
import { GetInvitedRoomsAction } from './GetInvitedRooms.action';
import { GetJoinedRoomsAction } from './GetJoinedRooms.action';
import { GetRoomInfoAction } from './GetRoomInfo.action';
import { GetRoomMembersAction } from './GetRoomMembers.action';
import { JoinRoomAction } from './JoinRoom.action';
import { LeaveRoomAction } from './LeaveRoom.action';
import { ReadMessageAction } from './ReadMessage.action';
import { SendMediaMessageAction } from './SendMediaMessage.action';
import { SendTextMessageAction } from './SendTextMessage.action';
import type { XyzAction } from './types';

export { type XyzAction } from './types';

// 创建 Action 实例
const actions: XyzAction[] = [
	// Message Actions
	new ReadMessageAction(),
	new SendTextMessageAction(),
	new SendMediaMessageAction(),
	new EditMessageAction(),
	new DeleteMessageAction(),
	new DownloadMediaFileAction(),
	// Bot Room Actions
	new GetInvitedRoomsAction(),
	new JoinRoomAction(),
	new GetJoinedRoomsAction(),
	new LeaveRoomAction(),
	// Room Actions
	new GetRoomInfoAction(),
	new GetRoomMembersAction(),
];

// 注册所有 Action
actionRegistry.registerAll(actions);

// 导出已注册的 Action（保持向后兼容）
export const XYZ_ACTIONS: Record<string, XyzAction> = Object.fromEntries(
	actions.map((action) => [action.name, action]),
);


