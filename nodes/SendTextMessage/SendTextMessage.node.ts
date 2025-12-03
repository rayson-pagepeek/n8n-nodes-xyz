import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';
import { MessageContent } from '../types';

export class SendTextMessage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Send Text Message',
		name: 'sendTextMessage',
		icon: 'file:icon.svg',
		group: ['transform'],
		usableAsTool: true,
		version: 1,
		description: 'Send a text message to the chatbot API',
		defaults: {
			name: 'Send Text Message',
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
				displayName: 'Room ID',
				name: 'roomId',
				type: 'string',
				default: '',
				required: true,
			},
			{
				displayName: 'Body',
				name: 'body',
				type: 'string',
				default: '',
				required: true,
				description: 'The message body text',
			},
			{
				displayName: 'Formatted Body',
				name: 'formattedBody',
				type: 'string',
				default: '',
				description: 'HTML formatted body (optional)',
			},
			{
				displayName: 'Format',
				name: 'format',
				type: 'string',
				default: '',
				description: 'The format (optional)',
			},
			{
				displayName: 'Mentions',
				name: 'mentions',
				type: 'string',
				default: '',
				description: 'Comma-separated list of user IDs to mention (e.g., "user1, user2")',
			},
			{
				displayName: 'Reply To Event ID',
				name: 'replyToEventId',
				type: 'string',
				default: '',
				description: 'The event ID to reply to (optional)',
			},
			{
				displayName: 'Use Previous Access Token',
				name: 'usePreviousAccessToken',
				type: 'boolean',
				default: false,
				description: 'Whether to use access_token from previous node (OnMessage/OnMessageEdit)',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const roomId = this.getNodeParameter('roomId', i) as string;
				const body = this.getNodeParameter('body', i) as string;
				const formattedBody = this.getNodeParameter('formattedBody', i) as string;
				const format = this.getNodeParameter('format', i) as string;
				const mentionsStr = this.getNodeParameter('mentions', i) as string;
				const replyToEventId = this.getNodeParameter('replyToEventId', i) as string;
				const usePreviousAccessToken = this.getNodeParameter(
					'usePreviousAccessToken',
					i,
				) as boolean;

				// Get credentials or use previous access token
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
				const responseData = await this.helpers.httpRequest({
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
					pairedItem: { item: i },
				});

				// Send response if available (for trigger nodes)
				if (this.sendResponse) {
					this.sendResponse({
						headers: {
							'Content-Type': 'application/json',
						},
						statusCode: 200,
						body: responseData,
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: error.message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}

