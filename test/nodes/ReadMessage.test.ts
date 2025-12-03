import { IExecuteFunctions } from 'n8n-workflow';
import { ReadMessage } from '../../nodes/ReadMessage/ReadMessage.node';

describe('ReadMessage Node', () => {
	let node: ReadMessage;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;

	beforeEach(() => {
		node = new ReadMessage();
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
		};
	});

	it('should have correct description', () => {
		expect(node.description.name).toBe('readMessage');
		expect(node.description.displayName).toBe('Read Message');
		expect(node.description.group).toEqual(['transform']);
	});

	it('should read message with credentials access token', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'eventId') return 'test-event-id';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

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

	it('should read message without event_id', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'eventId') return '';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith({
			method: 'GET',
			url: 'https://example.com/chatbot/v1/message/test-room-id',
			headers: {
				Authorization: 'Bearer test-token',
			},
		});
	});

	it('should use access token from previous node', async () => {
		mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
			{
				json: {
					access_token: 'previous-token',
				},
			},
		]);

		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'eventId') return '';
				if (name === 'usePreviousAccessToken') return true;
				return '';
			});

		await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

		expect(mockExecuteFunctions.helpers?.httpRequest).toHaveBeenCalledWith(
			expect.objectContaining({
				headers: {
					Authorization: 'Bearer previous-token',
				},
			}),
		);
	});
});

