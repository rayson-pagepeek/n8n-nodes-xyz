import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

export class ReadMessage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Read Message',
		name: 'readMessage',
		icon: 'file:icon.svg',
		group: ['transform'],
		usableAsTool: true,
		version: 1,
		description: 'Read a message from the chatbot API',
		defaults: {
			name: 'Read Message',
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
				displayName: 'Event ID',
				name: 'eventId',
				type: 'string',
				default: '',
				description: 'The event ID (optional)',
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
				const eventId = this.getNodeParameter('eventId', i) as string;
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

				// Build URL
				let url = `${host}/chatbot/v1/message/${roomId}`;
				if (eventId) {
					url += `?event_id=${eventId}`;
				}

				// Make request
				const responseData = await this.helpers.httpRequest({
					method: 'GET',
					url,
					headers: {
						Authorization: `Bearer ${accessToken}`,
					},
				});

				returnData.push({
					json: responseData,
					pairedItem: { item: i },
				});
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

