import { IDataObject } from 'n8n-workflow';

export interface BotEvent extends MessageEvent, IDataObject {
	bot_name: string;
	access_token: string;
	response_mode: string;
	history: HistoryMessage[];
}

export interface MessageEvent {
	event_id: string;
	room_id: string;
	type: string;
	sender: string;
	origin_server_ts: number;
	content?: MessageContent;
	membership?: string;
	state_key?: string;
}

export interface HistoryMessage {
	role: 'user' | 'assistant';          // 角色：user或assistant
	sender: string;                      // 发送者user_id
	content: string;                     // 消息内容
	eventId: string;                     // 事件ID
	createdAt: number;                   // 创建时间（时间戳, 单位秒或毫秒，需根据系统定义）
	files?: MessageFile[];               // 多媒体文件列表（可选）
	replyTo?: ReplyTo;                   // 引用消息（可选）
	mentions?: string[];                 // @用户列表（可选）
}

export interface MessageContent {
	msg_type: string; // m.text, m.image, m.video, m.audio, m.file
	body: string; // 文本内容
	formatted_body?: string; // HTML格式内容（可选）
	format?: string; // 格式（可选）
	mentions?: string[]; // @用户列表
	reply_to?: ReplyTo; // 引用消息（可选）
	file?: MessageFile; // 多媒体文件信息
}

export interface MessageFile {
	url: string;
	mimetype: string;
	size: number;
	width?: number;
	height?: number;
	thumbnail?: ThumbnailFile;
}

export interface ThumbnailFile {
	url: string; // 缩略图中的url为空会尝试根据宽高生成缩略图
	mimetype: string;
	size: number;
	width?: number;
	height?: number;
}

export interface ReplyTo {
	event_id: string;
}

