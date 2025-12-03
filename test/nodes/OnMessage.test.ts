import { IWebhookFunctions } from 'n8n-workflow';
import { OnMessage } from '../../nodes/OnMessage/OnMessage.node';
import { BotEvent } from '../../nodes/types';

describe('OnMessage Node', () => {
	let node: OnMessage;
	let mockWebhookFunctions: Partial<IWebhookFunctions>;

	beforeEach(() => {
		node = new OnMessage();
		mockWebhookFunctions = {
			getBodyData: jest.fn(),
			getResponseObject: jest.fn().mockReturnValue({
				status: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
			}),
			getNode: jest.fn().mockReturnValue({}),
			helpers: {
				returnJsonArray: jest.fn((data) => {
					const items = Array.isArray(data) ? data : [data];
					return items.map((item) => ({ json: item }));
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any,
		};
	});

	it('should have correct description', () => {
		expect(node.description.name).toBe('onMessage');
		expect(node.description.displayName).toBe('On Message');
		expect(node.description.group).toEqual(['trigger']);
	});

	it('should have webhook configuration', () => {
		expect(node.description.webhooks).toBeDefined();
		expect(node.description.webhooks?.length).toBe(1);
		expect(node.description.webhooks?.[0].httpMethod).toBe('POST');
		expect(node.description.webhooks?.[0].path).toBe('message');
		expect(node.description.webhooks?.[0].responseMode).toBe('onReceived');
	});

	it('should process valid BotEvent and respond immediately', async () => {
		const botEvent: BotEvent = {
			event_id: 'test-event-id',
			room_id: 'test-room-id',
			type: 'm.room.message',
			sender: 'test-sender',
			origin_server_ts: 1234567890,
			bot_name: 'test-bot',
			access_token: 'test-access-token',
			response_mode: 'async',
		};

		mockWebhookFunctions.getBodyData = jest.fn().mockReturnValue(botEvent);

		const result = await node.webhook.call(mockWebhookFunctions as IWebhookFunctions);

		expect(mockWebhookFunctions.getBodyData).toHaveBeenCalled();
		expect(mockWebhookFunctions.getResponseObject).toHaveBeenCalled();
		expect(result.workflowData).toBeDefined();
		expect(result.noWebhookResponse).toBe(true);
		expect(mockWebhookFunctions.helpers?.returnJsonArray).toHaveBeenCalled();
	});

	it('should throw error for invalid BotEvent', async () => {
		mockWebhookFunctions.getBodyData = jest.fn().mockReturnValue({});

		await expect(
			node.webhook.call(mockWebhookFunctions as IWebhookFunctions),
		).rejects.toThrow('Invalid BotEvent: event_id and room_id are required');
	});

	it('should throw error for missing event_id', async () => {
		const invalidEvent = {
			room_id: 'test-room-id',
		};

		mockWebhookFunctions.getBodyData = jest.fn().mockReturnValue(invalidEvent);

		await expect(
			node.webhook.call(mockWebhookFunctions as IWebhookFunctions),
		).rejects.toThrow('Invalid BotEvent: event_id and room_id are required');
	});
});

