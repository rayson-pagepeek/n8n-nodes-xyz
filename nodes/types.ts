import { IDataObject } from 'n8n-workflow';

export interface BotEvent extends MessageEvent, IDataObject {
	bot_name: string;
	access_token: string;
	response_mode: string;
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

