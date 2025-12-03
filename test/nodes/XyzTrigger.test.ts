import { IWebhookFunctions } from 'n8n-workflow';
import { XyzTrigger } from '../../nodes/Xyz/XyzTrigger.node';
import { BotEvent } from '../../nodes/types';

describe('XyzTrigger Node', () => {
	let node: XyzTrigger;
	let mockWebhookFunctions: Partial<IWebhookFunctions>;

	beforeEach(() => {
		node = new XyzTrigger();
		mockWebhookFunctions = {
			getBodyData: jest.fn(),
			getResponseObject: jest.fn().mockReturnValue({
				status: jest.fn().mockReturnThis(),
				json: jest.fn().mockReturnThis(),
			}),
			getNode: jest.fn().mockReturnValue({}),
			helpers: {
				returnJsonArray: jest.fn((data: unknown) => {
					const items = Array.isArray(data) ? data : [data];
					return items.map((item) => ({ json: item }));
				}),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any,
		};
	});

	it('should have correct description', () => {
		expect(node.description.name).toBe('xyzTrigger');
		expect(node.description.displayName).toBe('XYZ Trigger');
		expect(node.description.group).toEqual(['trigger']);
		expect(node.description.webhooks).toBeDefined();
		expect(node.description.webhooks?.length).toBe(1);
		expect(node.description.webhooks?.[0].httpMethod).toBe('POST');
		expect(node.description.webhooks?.[0].path).toBe('={{$parameter["triggerType"]}}');
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
			content: {
				msg_type: 'm.text',
				body: 'hello',
			},
		};

		mockWebhookFunctions.getBodyData = jest.fn().mockReturnValue(botEvent);

		const result = await node.webhook.call(mockWebhookFunctions as IWebhookFunctions);

		expect(mockWebhookFunctions.getBodyData).toHaveBeenCalled();
		expect(mockWebhookFunctions.getResponseObject).toHaveBeenCalled();
		expect(result.workflowData).toBeDefined();
		expect(result.noWebhookResponse).toBe(true);
		expect(mockWebhookFunctions.helpers?.returnJsonArray).toHaveBeenCalledWith({
			chatInput: 'hello',
			...botEvent,
		});
	});

	it('should derive chatInput from message field when content.body is missing', async () => {
		const payload = {
			event_id: 'test-event-id',
			room_id: 'test-room-id',
			type: 'm.room.message',
			sender: 'test-sender',
			origin_server_ts: 1234567890,
			bot_name: 'test-bot',
			access_token: 'test-access-token',
			response_mode: 'async',
			message: 'fallback message',
		} as unknown as BotEvent;

		mockWebhookFunctions.getBodyData = jest.fn().mockReturnValue(payload);

		await node.webhook.call(mockWebhookFunctions as IWebhookFunctions);

		expect(mockWebhookFunctions.helpers?.returnJsonArray).toHaveBeenCalledWith({
			chatInput: 'fallback message',
			...payload,
		});
	});

	it('should throw error for invalid BotEvent (missing event_id and room_id)', async () => {
		mockWebhookFunctions.getBodyData = jest
			.fn()
			.mockReturnValue({} as unknown as BotEvent);

		await expect(
			node.webhook.call(mockWebhookFunctions as IWebhookFunctions),
		).rejects.toThrow('Invalid BotEvent: event_id and room_id are required');
	});
});


