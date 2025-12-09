import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { XyzAction } from './types';

export class LeaveRoomAction implements XyzAction {
	name = 'leaveRoom';
	resource = 'Bot Room Actions';
	displayName = 'Leave Room';
	description = 'Make the bot leave a room';
	params = ['bot', 'room_name'] as const;
	requiredParams = ['bot', 'room_name'] as const;

	async execute(
		ctx: IExecuteFunctions,
		items: INodeExecutionData[],
		itemIndex: number,
		returnData: INodeExecutionData[],
		host: string,
		accessToken: string,
	): Promise<void> {
		const bot = ctx.getNodeParameter('bot', itemIndex) as string;
		const roomName = ctx.getNodeParameter('roomName', itemIndex) as string;

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'POST',
			url: `${host}/chatbot/v1/bots/${bot}/leave`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: {
				room_name: roomName,
			},
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
