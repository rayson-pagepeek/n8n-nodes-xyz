import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { XyzAction } from './types';

export class GetRoomMembersAction implements XyzAction {
	name = 'getRoomMembers';
	resource = 'Room Actions';
	displayName = 'Get Room Members';
	description = 'Get the list of members in a room';
	params = ['room_id', 'membership', 'limit', 'since'] as const;
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
		const membership = ctx.getNodeParameter('membership', itemIndex) as string;
		const limit = ctx.getNodeParameter('limit', itemIndex) as number;
		const since = ctx.getNodeParameter('since', itemIndex) as string;

		// Build URL
		let url = `${host}/chatbot/v1/rooms/${roomId}/members`;
		const queryParams: string[] = [];
		if (membership) {
			queryParams.push(`membership=${encodeURIComponent(membership)}`);
		}
		if (limit) {
			queryParams.push(`limit=${limit}`);
		}
		if (since) {
			queryParams.push(`since=${encodeURIComponent(since)}`);
		}
		if (queryParams.length > 0) {
			url += `?${queryParams.join('&')}`;
		}

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'GET',
			url,
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
