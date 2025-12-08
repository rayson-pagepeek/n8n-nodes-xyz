import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { Xyz } from '../../nodes/Xyz/Xyz.node';

describe('Xyz Node', () => {
	let node: Xyz;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;

	beforeEach(() => {
		node = new Xyz();
		mockExecuteFunctions = {
			getInputData: jest.fn().mockReturnValue([
				{
					json: {},
				} as INodeExecutionData,
			]),
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				host: 'https://example.com',
				accessToken: 'test-token',
			}),
			helpers: {
				httpRequest: jest.fn().mockResolvedValue({ success: true }),
				returnJsonArray: jest.fn((data: unknown) => {
					const items = Array.isArray(data) ? data : [data];
					return items.map((item) => ({ json: item }));
				}),
				assertBinaryData: jest.fn().mockReturnValue({
					mimeType: 'image/png',
				}),
				getBinaryDataBuffer: jest.fn().mockResolvedValue(Buffer.from('test data')),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any,
			continueOnFail: jest.fn().mockReturnValue(false),
			getNode: jest.fn().mockReturnValue({}),
		};
	});

	it('should have correct description', () => {
		expect(node.description.name).toBe('xyz');
		expect(node.description.displayName).toBe('XYZ');
		expect(node.description.group).toEqual(['transform']);
	});

	it('should read message with credentials access token (operation=readMessage)', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'readMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'eventId') return 'test-event-id';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			},
		);

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.getCredentials).toHaveBeenCalledWith('chatbotApi');
		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://example.com/chatbot/v1/message/test-room-id?event_id=test-event-id',
			headers: {
				Authorization: 'Bearer test-token',
			},
		});
	});

	it('should read message without event_id (operation=readMessage)', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'readMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'eventId') return '';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			},
		);

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://example.com/chatbot/v1/message/test-room-id',
			headers: {
				Authorization: 'Bearer test-token',
			},
		});
	});

	it('should use access token from previous node (operation=readMessage)', async () => {
		mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
			{
				json: {
					access_token: 'previous-token',
				},
			} as INodeExecutionData,
		]);

		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'readMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'eventId') return '';
				if (name === 'usePreviousAccessToken') return true;
				return '';
			},
		);

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: {
					Authorization: 'Bearer previous-token',
				},
			}),
		);
	});

	it('should send text message (operation=sendTextMessage)', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'sendTextMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'body') return 'Hello World';
				if (name === 'formattedBody') return '';
				if (name === 'format') return '';
				if (name === 'mentions') return '';
				if (name === 'replyToEventId') return '';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			},
		);

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://example.com/chatbot/v1/messages/test-room-id',
			headers: {
				Authorization: 'Bearer test-token',
				'Content-Type': 'application/json',
			},
			body: {
				msg_type: 'm.text',
				body: 'Hello World',
			},
			json: true,
		});
	});

	it('should send message with reply (operation=sendTextMessage)', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'sendTextMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'body') return 'Reply message';
				if (name === 'formattedBody') return '';
				if (name === 'format') return '';
				if (name === 'mentions') return '';
				if (name === 'replyToEventId') return 'reply-event-id';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			},
		);

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				body: expect.objectContaining({
					reply_to: {
						event_id: 'reply-event-id',
					},
				}),
			}),
		);
	});

	it('should send message with mentions (operation=sendTextMessage)', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'sendTextMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'body') return 'Hello @user1 @user2';
				if (name === 'formattedBody') return '';
				if (name === 'format') return '';
				if (name === 'mentions') return 'user1, user2';
				if (name === 'replyToEventId') return '';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			},
		);

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				body: expect.objectContaining({
					mentions: ['user1', 'user2'],
				}),
			}),
		);
	});

	it('should send media message (operation=sendMediaMessage)', async () => {
		mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
			{
				json: {},
				binary: {
					data: {
						data: 'dGVzdCBkYXRh',
						encoding: 'base64',
						mimeType: 'image/png',
					},
				},
			} as INodeExecutionData,
		]);

		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'sendMediaMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'binaryPropertyName') return 'data';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			},
		);

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				method: 'POST',
				url: 'https://example.com/chatbot/v1/upload/test-room-id',
				headers: expect.objectContaining({
					Authorization: 'Bearer test-token',
					'Content-Type': 'image/png',
					'Content-Length': expect.any(String),
				}),
				body: expect.any(Buffer),
			}),
		);
	});

	it('should throw error when binary property not found (operation=sendMediaMessage)', async () => {
		mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
			{
				json: {},
				binary: {},
			} as INodeExecutionData,
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockExecuteFunctions.helpers as any).assertBinaryData = jest.fn().mockReturnValue(null);

		(mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation(
			(name: string) => {
				if (name === 'operation') return 'sendMediaMessage';
				if (name === 'roomId') return 'test-room-id';
				if (name === 'binaryPropertyName') return 'nonexistent';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			},
		);

		await expect(
			node.execute.call(mockExecuteFunctions as IExecuteFunctions),
		).rejects.toThrow();
	});
});

