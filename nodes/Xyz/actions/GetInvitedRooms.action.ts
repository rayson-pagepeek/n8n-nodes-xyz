import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { XyzAction } from './types';

export class GetInvitedRoomsAction implements XyzAction {
	name = 'getInvitedRooms';
	resource = 'Bot Room Actions';
	displayName = 'Get Invited Rooms';
	description = 'Get rooms that the bot has been invited to but not yet joined';
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
			url: `${host}/chatbot/v1/bots/${bot}/invited_rooms`,
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
