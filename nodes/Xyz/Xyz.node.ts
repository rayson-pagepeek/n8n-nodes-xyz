import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { XYZ_ACTIONS } from './actions';

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
						action: 'Read a message from the chatbot API',
						value: 'readMessage',
						description: 'Read a message from the chatbot API',
					},
					{
						name: 'Send Media Message',
						action: 'Send a media file to the chatbot API',
						value: 'sendMediaMessage',
						description: 'Send a media/binary file to the chatbot API',
					},
					{
						name: 'Send Text Message',
						action: 'Send a text message to the chatbot API',
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

				const action = XYZ_ACTIONS[operation];

				if (!action) {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown operation: ${operation}`,
						{
							itemIndex: i,
						},
					);
				}

				await action.execute(this, items, i, returnData, host, accessToken);
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
