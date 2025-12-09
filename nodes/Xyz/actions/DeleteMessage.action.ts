import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { XyzAction } from './types';

export class DeleteMessageAction implements XyzAction {
	name = 'deleteMessage';
	resource = 'Message Actions';
	displayName = 'Delete Message';
	description = 'Delete (redact) a message in a room';
	params = ['room_id', 'event_id', 'reason'] as const;
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
		const reason = ctx.getNodeParameter('reason', itemIndex) as string;

		// Build request body
		const body: { event_id: string; reason?: string } = {
			event_id: eventId,
		};

		if (reason) {
			body.reason = reason;
		}

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'DELETE',
			url: `${host}/chatbot/v1/messages/${roomId}/${eventId}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body,
			json: true,
		});

		// 合并输入数据和响应数据
		const inputData = items[itemIndex].json || {};
		returnData.push({
			json: {
				...inputData,
				response: responseData,
			},
			pairedItem: { item: itemIndex },
		});
	}
}
