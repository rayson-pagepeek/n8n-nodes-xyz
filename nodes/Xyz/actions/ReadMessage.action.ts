import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { XyzAction } from './types';

export class ReadMessageAction implements XyzAction {
	name = 'readMessage';
	resource = 'Message Actions';
	displayName = 'Read Message';
	description = 'Read a message from the chatbot API';
	params = ['room_id', 'event_id'] as const;
	requiredParams = ['room_id'] as const;

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

		// Build URL
		let url = `${host}/chatbot/v1/message/${roomId}`;
		if (eventId) {
			url += `?event_id=${eventId}`;
		}

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'GET',
			url,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});

		returnData.push({
			json: responseData,
			pairedItem: { item: itemIndex },
		});
	}
}


