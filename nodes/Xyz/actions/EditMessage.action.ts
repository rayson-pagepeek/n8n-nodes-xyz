import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { MessageContent } from '../../types';
import type { XyzAction } from './types';

export class EditMessageAction implements XyzAction {
	name = 'editMessage';
	resource = 'Message Actions';
	displayName = 'Edit Message';
	description = 'Edit a message in a room';
	params = ['room_id', 'event_id', 'body', 'formatted_body', 'format', 'mentions'] as const;
	requiredParams = ['room_id', 'event_id', 'body'] as const;

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
		const body = ctx.getNodeParameter('body', itemIndex) as string;
		const formattedBody = ctx.getNodeParameter('formattedBody', itemIndex) as string;
		const format = ctx.getNodeParameter('format', itemIndex) as string;
		const mentionsStr = ctx.getNodeParameter('mentions', itemIndex) as string;

		// Build message content
		const messageContent: MessageContent = {
			msg_type: 'm.text',
			body,
		};

		if (formattedBody) {
			messageContent.formatted_body = formattedBody;
		}

		if (format) {
			messageContent.format = format;
		}

		if (mentionsStr) {
			messageContent.mentions = mentionsStr
				.split(',')
				.map((m) => m.trim())
				.filter((m) => m.length > 0);
		}

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'PUT',
			url: `${host}/chatbot/v1/messages/${roomId}/${eventId}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: {
				event_id: eventId,
				content: messageContent,
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
