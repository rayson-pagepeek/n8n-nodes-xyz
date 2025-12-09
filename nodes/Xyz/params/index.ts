import type { ParamDefinition, ParamRegistry } from './types';

/**
 * 参数定义库
 * 所有参数定义集中管理，支持在多个 Action 间复用
 */
export const PARAMS: ParamRegistry = {
	room_id: {
		displayName: 'Room ID',
		name: 'roomId',
		type: 'string',
		default: '',
	} as ParamDefinition,

	event_id: {
		displayName: 'Event ID',
		name: 'eventId',
		type: 'string',
		default: '',
	} as ParamDefinition,

	body: {
		displayName: 'Body',
		name: 'body',
		type: 'string',
		default: '',
		description: 'The message body text',
	} as ParamDefinition,

	formatted_body: {
		displayName: 'Formatted Body',
		name: 'formattedBody',
		type: 'string',
		default: '',
		description: 'HTML formatted body (optional)',
	} as ParamDefinition,

	format: {
		displayName: 'Format',
		name: 'format',
		type: 'string',
		default: '',
		description: 'The format (optional)',
	} as ParamDefinition,

	mentions: {
		displayName: 'Mentions',
		name: 'mentions',
		type: 'string',
		default: '',
		description: 'Comma-separated list of user IDs to mention (e.g., "user1, user2")',
	} as ParamDefinition,

	reply_to_event_id: {
		displayName: 'Reply To Event ID',
		name: 'replyToEventId',
		type: 'string',
		default: '',
		description: 'The event ID to reply to (optional)',
	} as ParamDefinition,

	binary_property_name: {
		displayName: 'Binary Property',
		name: 'binaryPropertyName',
		type: 'string',
		default: 'data',
		description: 'The binary property name',
	} as ParamDefinition,

	bot: {
		displayName: 'Bot Name',
		name: 'bot',
		type: 'string',
		default: '',
	} as ParamDefinition,

	room_name: {
		displayName: 'Room Name or ID',
		name: 'roomName',
		type: 'string',
		default: '',
		description: 'The room name or ID (e.g., !room123:example.com)',
	} as ParamDefinition,

	reason: {
		displayName: 'Reason',
		name: 'reason',
		type: 'string',
		default: '',
		description: 'The reason for deletion (optional)',
	} as ParamDefinition,

	membership: {
		displayName: 'Membership',
		name: 'membership',
		type: 'options',
		options: [
			{ name: 'Ban', value: 'ban' },
			{ name: 'Invite', value: 'invite' },
			{ name: 'Join', value: 'join' },
			{ name: 'Knock', value: 'knock' },
			{ name: 'Leave', value: 'leave' },
		],
		default: 'join',
		description: 'Filter by membership status',
	} as ParamDefinition,

	limit: {
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	} as ParamDefinition,

	since: {
		displayName: 'Since',
		name: 'since',
		type: 'string',
		default: '',
		description: 'Pagination token',
	} as ParamDefinition,

	event_ids: {
		displayName: 'Event IDs',
		name: 'eventIds',
		type: 'string',
		default: '',
		description: 'Comma-separated list of event IDs to filter',
	} as ParamDefinition,
};

/**
 * 根据参数名称获取参数定义
 */
export function getParam(name: keyof ParamRegistry): ParamDefinition {
	const param = PARAMS[name];
	if (!param) {
		throw new Error(`Parameter "${name}" not found in parameter registry`);
	}
	return param;
}

/**
 * 根据参数名称列表获取参数定义列表
 */
export function getParams(names: readonly (keyof ParamRegistry)[]): ParamDefinition[] {
	return names.map((name) => getParam(name));
}
