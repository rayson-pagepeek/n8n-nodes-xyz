import { IExecuteFunctions } from 'n8n-workflow';
import { SendMediaMessage } from '../../nodes/SendMediaMessage/SendMediaMessage.node';

describe('SendMediaMessage Node', () => {
	let node: SendMediaMessage;
	let mockExecuteFunctions: Partial<IExecuteFunctions>;

	let mockSendResponse: jest.Mock;

	beforeEach(() => {
		node = new SendMediaMessage();
		mockSendResponse = jest.fn();
		mockExecuteFunctions = {
			getInputData: jest.fn().mockReturnValue([
				{
					json: {},
					binary: {
						data: {
							data: 'dGVzdCBkYXRh',
							encoding: 'base64',
							mimeType: 'image/png',
						},
					},
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
				assertBinaryData: jest.fn().mockReturnValue({
					data: 'dGVzdCBkYXRh',
					mimeType: 'image/png',
					fileName: 'test.png',
					fileSize: 9,
				}),
				getBinaryDataBuffer: jest.fn().mockResolvedValue(Buffer.from('test data')),
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} as any,
			continueOnFail: jest.fn().mockReturnValue(false),
			getNode: jest.fn().mockReturnValue({}),
			sendResponse: mockSendResponse,
		};
	});

	it('should have correct description', () => {
		expect(node.description.name).toBe('sendMediaMessage');
		expect(node.description.displayName).toBe('Send Media Message');
		expect(node.description.group).toEqual(['transform']);
	});

	it('should send media message', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'binaryPropertyName') return 'data';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

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

	it('should throw error when binary property not found', async () => {
		mockExecuteFunctions.getInputData = jest.fn().mockReturnValue([
			{
				json: {},
				binary: {},
			},
		]);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		(mockExecuteFunctions.helpers as any).assertBinaryData = jest.fn().mockReturnValue(null);

		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'binaryPropertyName') return 'nonexistent';
				if (name === 'usePreviousAccessToken') return false;
				return '';
			});

		await expect(
			node.execute.call(mockExecuteFunctions as IExecuteFunctions),
		).rejects.toThrow();
	});

	it('should send response when sendResponse is available', async () => {
		(mockExecuteFunctions.getNodeParameter as jest.Mock)
			.mockImplementation((name: string) => {
				if (name === 'roomId') return 'test-room-id';
				if (name === 'binaryPropertyName') return 'data';
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

