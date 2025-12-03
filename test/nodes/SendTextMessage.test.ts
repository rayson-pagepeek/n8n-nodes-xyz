import { IExecuteFunctions } from 'n8n-workflow';
import { SendTextMessage } from '../../nodes/SendTextMessage/SendTextMessage.node';

describe('SendTextMessage Node', () => {
	let node: SendTextMessage;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;

	let mockSendResponse: jest.Mock;

	beforeEach(() => {
		node = new SendTextMessage();
		mockSendResponse = jest.fn();
		mockExecuteFunctions = {
			getInputData: jest.fn().mockReturnValue([
				{
					json: {},
				},
			]),
			getNodeParameter: jest.fn(),
			getCredentials: jest.fn().mockResolvedValue({
				host: 'https://example.com',
				accessToken: 'test-token',
			}),
			helpers: {
				httpRequest: jest.fn().mockResolvedValue({ success: true }),
				returnJsonArray: jest.fn((data) => {
					const items = Array.isArray(data) ? data : [data];
					return items.map((item) => ({ json: item }));
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any,
			continueOnFail: jest.fn().mockReturnValue(false),
			getNode: jest.fn().mockReturnValue({}),
			sendResponse: mockSendResponse,
		};
	});

	it('should have correct description', () => {
		expect(node.description.name).toBe('sendTextMessage');
		expect(node.description.displayName).toBe('Send Text Message');
		expect(node.description.group).toEqual(['transform']);
	});

	it('should send text message', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'body') return 'Hello World';
				if (name === 'formattedBody') return '';
				if (name === 'format') return '';
				if (name === 'mentions') return '';
				if (name === 'replyToEventId') return '';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith({
			method: 'POST',
			url: 'https://example.com/chatbot/v1/send/test-room-id',
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

	it('should send message with reply', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'body') return 'Reply message';
				if (name === 'formattedBody') return '';
				if (name === 'format') return '';
				if (name === 'mentions') return '';
				if (name === 'replyToEventId') return 'reply-event-id';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

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

	it('should send message with mentions', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'body') return 'Hello @user1 @user2';
				if (name === 'formattedBody') return '';
				if (name === 'format') return '';
				if (name === 'mentions') return 'user1, user2';
				if (name === 'replyToEventId') return '';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				body: expect.objectContaining({
					mentions: ['user1', 'user2'],
				}),
			}),
		);
	});

	it('should send response when sendResponse is available', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'body') return 'Hello World';
				if (name === 'formattedBody') return '';
				if (name === 'format') return '';
				if (name === 'mentions') return '';
				if (name === 'replyToEventId') return '';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockSendResponse).toHaveBeenCalledWith({
			headers: {
				'Content-Type': 'application/json',
			},
			statusCode: 200,
			body: { success: true },
		});
	});
});

