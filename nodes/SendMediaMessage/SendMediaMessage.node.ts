import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
    NodeOperationError,
} from 'n8n-workflow';

export class SendMediaMessage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Send Media Message',
		name: 'sendMediaMessage',
		icon: 'file:icon.svg',
		group: ['transform'],
		usableAsTool: true,
		version: 1,
		description: 'Send a media/binary file to the chatbot API',
		defaults: {
			name: 'Send Media Message',
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
				displayName: 'Binary Property',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
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
				const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
				const usePreviousAccessToken = this.getNodeParameter(
					'usePreviousAccessToken',
					i,
				) as boolean;

				// Get binary data
				const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
				if (!binaryData) {
					throw new NodeOperationError(
						this.getNode(),
						`Binary property "${binaryPropertyName}" not found`,
						{ itemIndex: i },
					);
				}
				const dataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

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

				// Get content type and length
				const contentType = binaryData.mimeType || 'application/octet-stream';
				const contentLength = dataBuffer.length.toString();

				// Make request
				const responseData = await this.helpers.httpRequest({
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

