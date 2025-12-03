import type { XyzAction } from './types';
import { ReadMessageAction } from './ReadMessage.action';
import { SendTextMessageAction } from './SendTextMessage.action';
import { SendMediaMessageAction } from './SendMediaMessage.action';

export { type XyzAction } from './types';

export const XYZ_ACTIONS: Record<string, XyzAction> = {
	readMessage: new ReadMessageAction(),
	sendTextMessage: new SendTextMessageAction(),
	sendMediaMessage: new SendMediaMessageAction(),
};


