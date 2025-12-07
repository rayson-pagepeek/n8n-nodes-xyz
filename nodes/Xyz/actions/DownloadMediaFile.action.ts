import {
	type IExecuteFunctions,
	type INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import type { XyzAction } from './types';

export class DownloadMediaFileAction implements XyzAction {
	name = 'downloadMediaFile';
	resource = 'File Actions';
	displayName = 'Download Media File';
	description = 'Download a media file from the chatbot API';
	params = ['room_id', 'event_id'] as const;
	requiredParams = ['room_id', 'event_id'] as const;

	async execute(
		ctx: IExecuteFunctions,
		items: INodeExecutionData[],
		itemIndex: number,
		returnData: INodeExecutionData[],
		host: string,
		accessToken: string,
	): Promise<void> {
		const roomId = ctx.getNodeParameter('roomId', itemIndex) as string;
		const eventId = ctx.getNodeParameter('eventId', itemIndex) as string;

		if (!roomId) {
			throw new NodeOperationError(ctx.getNode(), 'Room ID is required', { itemIndex });
		}

		if (!eventId) {
			throw new NodeOperationError(ctx.getNode(), 'Event ID is required', { itemIndex });
		}

		// Make request to download media file
		// Use encoding: null to get binary data as Buffer
		const response = await ctx.helpers.httpRequest({
			method: 'GET',
			url: `${host}/chatbot/v1/media/${roomId}/${eventId}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
			encoding: 'blob',
			returnFullResponse: true,
		})

		// Get content type from response headers (handle different header formats)
		const headers = response.headers || {};
		const contentType =
			(headers['content-type'] as string) ||
			(headers['Content-Type'] as string) ||
			(headers['CONTENT-TYPE'] as string) ||
			'application/octet-stream';

		// Convert response body to Buffer
		// When encoding is null, body should already be a Buffer, but handle all cases
		let buffer: Buffer;
		if (Buffer.isBuffer(response.body)) {
			buffer = response.body;
		} else if (response.body instanceof ArrayBuffer) {
			buffer = Buffer.from(response.body);
		} else if (typeof response.body === 'string') {
			// If it's a string, treat as binary
			buffer = Buffer.from(response.body, 'binary');
		} else if (response.body && typeof response.body === 'object') {
			// Try to convert object/array to buffer
			try {
				buffer = Buffer.from(response.body as unknown as ArrayLike<number>);
			} catch {
				throw new NodeOperationError(
					ctx.getNode(),
					'Failed to convert response body to Buffer',
					{ itemIndex },
				);
			}
		} else {
			throw new NodeOperationError(
				ctx.getNode(),
				'Invalid response body type',
				{ itemIndex },
			);
		}

		// Prepare binary data
		const binaryData = await ctx.helpers.prepareBinaryData(
			buffer,
			`media_${eventId}`,
			contentType,
		);

		// Merge input data and response data
		const inputData = items[itemIndex].json || {};
		returnData.push({
			json: {
				...inputData,
				roomId,
				eventId,
				contentType,
			},
			binary: {
				data: binaryData,
			},
			pairedItem: { item: itemIndex },
		});
	}
}
