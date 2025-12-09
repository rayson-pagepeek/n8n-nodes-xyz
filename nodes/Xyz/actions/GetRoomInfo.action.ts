import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { XyzAction } from './types';

export class GetRoomInfoAction implements XyzAction {
	name = 'getRoomInfo';
	resource = 'Room Actions';
	displayName = 'Get Room Info';
	description = 'Get detailed information about a room';
	params = ['room_id'] as const;
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

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'GET',
			url: `${host}/chatbot/v1/rooms/${roomId}/info`,
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
