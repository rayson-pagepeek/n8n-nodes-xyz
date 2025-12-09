import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { XyzAction } from './types';

export class GetJoinedRoomsAction implements XyzAction {
	name = 'getJoinedRooms';
	resource = 'Bot Room Actions';
	displayName = 'Get Joined Rooms';
	description = 'Get all rooms that the bot has joined';
	params = ['bot'] as const;
	requiredParams = ['bot'] as const;

	async execute(
		ctx: IExecuteFunctions,
		items: INodeExecutionData[],
		itemIndex: number,
		returnData: INodeExecutionData[],
		host: string,
		accessToken: string,
	): Promise<void> {
		const bot = ctx.getNodeParameter('bot', itemIndex) as string;

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'GET',
			url: `${host}/chatbot/v1/bots/${bot}/joined_rooms`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
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
