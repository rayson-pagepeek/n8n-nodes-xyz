import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import type { MessageContent } from '../types';

export class Xyz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XYZ',
		name: 'xyz',
		icon: 'file:icon.svg',
		group: ['transform'],
		version: 1,
		description: 'XYZ chatbot integration (actions)',
		defaults: {
			name: 'XYZ',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'chatbotApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Read Message',
						value: 'readMessage',
						description: 'Read a message from the chatbot API',
					},
					{
						name: 'Send Media Message',
						value: 'sendMediaMessage',
						description: 'Send a media/binary file to the chatbot API',
					},
					{
						name: 'Send Text Message',
						value: 'sendTextMessage',
						description: 'Send a text message to the chatbot API',
					},
				],
				default: 'sendTextMessage',
			},

			// Common message parameters (used by multiple operations)
			{
				displayName: 'Room ID',
				name: 'roomId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						operation: ['readMessage', 'sendTextMessage', 'sendMediaMessage'],
					},
				},
			},
			{
				displayName: 'Use Previous Access Token',
				name: 'usePreviousAccessToken',
				type: 'boolean',
				default: false,
				description: 'Whether to use access_token from previous node (OnMessage/OnMessageEdit)',
				displayOptions: {
					show: {
						operation: ['readMessage', 'sendTextMessage', 'sendMediaMessage'],
					},
				},
			},

			// Read message specific
			{
				displayName: 'Event ID',
				name: 'eventId',
				type: 'string',
				default: '',
				description: 'The event ID (optional)',
				displayOptions: {
					show: {
						operation: ['readMessage'],
					},
				},
			},

			// Send text specific
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				default: '',
				required: true,
				description: 'The message body text',
				displayOptions: {
					show: {
						operation: ['sendTextMessage'],
					},
				},
			},
			{
				displayName: 'Formatted Body',
				name: 'formattedBody',
				type: 'string',
				default: '',
				description: 'HTML formatted body (optional)',
				displayOptions: {
					show: {
						operation: ['sendTextMessage'],
					},
				},
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'string',
				default: '',
				description: 'The format (optional)',
				displayOptions: {
					show: {
						operation: ['sendTextMessage'],
					},
				},
			},
			{
				displayName: 'Mentions',
				name: 'mentions',
				type: 'string',
				default: '',
				description: 'Comma-separated list of user IDs to mention (e.g., "user1, user2")',
				displayOptions: {
					show: {
						operation: ['sendTextMessage'],
					},
				},
			},
			{
				displayName: 'Reply To Event ID',
				name: 'replyToEventId',
				type: 'string',
				default: '',
				description: 'The event ID to reply to (optional)',
				displayOptions: {
					show: {
						operation: ['sendTextMessage'],
					},
				},
			},

			// Send media specific
			{
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['sendMediaMessage'],
					},
				},
			},
		],
		usableAsTool: true,
	};

	// Action handler
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0) as string;

		if (operation === 'trigger') {
			// 触发模式下不会走 execute，保持兼容
			return [items];
		}

		for (let i = 0; i < items.length; i++) {
			try {
				// 获取凭证或前一个节点的 access token
				const usePreviousAccessToken = this.getNodeParameter(
					'usePreviousAccessToken',
					i,
				) as boolean;

				let accessToken: string;
				let host: string;

				if (usePreviousAccessToken && items[i].json.access_token) {
					accessToken = items[i].json.access_token as string;
					const credentials = await this.getCredentials('chatbotApi');
					host = credentials.host as string;
				} else {
					const credentials = await this.getCredentials('chatbotApi');
					host = credentials.host as string;
					accessToken = credentials.accessToken as string;
				}

				if (operation === 'readMessage') {
					await handleReadMessage(this, items, i, returnData, host, accessToken);
				} else if (operation === 'sendTextMessage') {
					await handleSendTextMessage(this, items, i, returnData, host, accessToken);
				} else if (operation === 'sendMediaMessage') {
					await handleSendMediaMessage(this, items, i, returnData, host, accessToken);
				} else {
					throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`, {
						itemIndex: i,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

async function handleReadMessage(
	ctx: IExecuteFunctions,
	items: INodeExecutionData[],
	itemIndex: number,
	returnData: INodeExecutionData[],
	host: string,
	accessToken: string,
): Promise<void> {
	const roomId = ctx.getNodeParameter('roomId', itemIndex) as string;
	const eventId = ctx.getNodeParameter('eventId', itemIndex) as string;

	// Build URL
	let url = `${host}/chatbot/v1/message/${roomId}`;
	if (eventId) {
		url += `?event_id=${eventId}`;
	}

	// Make request
	const responseData = await ctx.helpers.httpRequest({
		method: 'GET',
		url,
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
	});

	returnData.push({
		json: responseData,
		pairedItem: { item: itemIndex },
	});
}

async function handleSendTextMessage(
	ctx: IExecuteFunctions,
	items: INodeExecutionData[],
	itemIndex: number,
	returnData: INodeExecutionData[],
	host: string,
	accessToken: string,
): Promise<void> {
	const roomId = ctx.getNodeParameter('roomId', itemIndex) as string;
	const body = ctx.getNodeParameter('body', itemIndex) as string;
	const formattedBody = ctx.getNodeParameter('formattedBody', itemIndex) as string;
	const format = ctx.getNodeParameter('format', itemIndex) as string;
	const mentionsStr = ctx.getNodeParameter('mentions', itemIndex) as string;
	const replyToEventId = ctx.getNodeParameter('replyToEventId', itemIndex) as string;

	// Build message content
	const messageContent: MessageContent = {
		msg_type: 'm.text',
		body,
	};

	if (formattedBody) {
		messageContent.formatted_body = formattedBody;
	}

	if (format) {
		messageContent.format = format;
	}

	if (mentionsStr) {
		messageContent.mentions = mentionsStr
			.split(',')
			.map((m) => m.trim())
			.filter((m) => m.length > 0);
	}

	if (replyToEventId) {
		messageContent.reply_to = {
			event_id: replyToEventId,
		};
	}

	// Make request
	const responseData = await ctx.helpers.httpRequest({
		method: 'POST',
		url: `${host}/chatbot/v1/send/${roomId}`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
		},
		body: messageContent,
		json: true,
	});

	returnData.push({
		json: responseData,
		pairedItem: { item: itemIndex },
	});
}

async function handleSendMediaMessage(
	ctx: IExecuteFunctions,
	items: INodeExecutionData[],
	itemIndex: number,
	returnData: INodeExecutionData[],
	host: string,
	accessToken: string,
): Promise<void> {
	const roomId = ctx.getNodeParameter('roomId', itemIndex) as string;
	const binaryPropertyName = ctx.getNodeParameter('binaryPropertyName', itemIndex) as string;

	// Get binary data
	const binaryData = ctx.helpers.assertBinaryData(itemIndex, binaryPropertyName);
	if (!binaryData) {
		throw new NodeOperationError(
			ctx.getNode(),
			`Binary property "${binaryPropertyName}" not found`,
			{ itemIndex },
		);
	}
	const dataBuffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

	// Get content type and length
	const contentType = binaryData.mimeType || 'application/octet-stream';
	const contentLength = dataBuffer.length.toString();

	// Make request
	const responseData = await ctx.helpers.httpRequest({
		method: 'POST',
		url: `${host}/chatbot/v1/upload/${roomId}`,
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': contentType,
			'Content-Length': contentLength,
		},
		body: dataBuffer,
	});

	returnData.push({
		json: responseData,
		pairedItem: { item: itemIndex },
	});
}

