import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import type { MessageContent } from '../../types';
import type { XyzAction } from './types';

export class SendTextMessageAction implements XyzAction {
	name = 'sendTextMessage';
	resource = 'Message Actions';
	displayName = 'Send Text Message';
	description = 'Send a text message to the chatbot API';
	params = ['room_id', 'body', 'formatted_body', 'format', 'mentions', 'reply_to_event_id'] as const;
	requiredParams = ['room_id', 'body'] as const;

	async execute(
		ctx: IExecuteFunctions,
		items: INodeExecutionData[],
		itemIndex: number,
		returnData: INodeExecutionData[],
		host: string,
		accessToken: string,
	): Promise<void> {
		const roomId = ctx.getNodeParameter('roomId', itemIndex) as string;
		const body = ctx.getNodeParameter('body', itemIndex) as string;
		const formattedBody = ctx.getNodeParameter('formattedBody', itemIndex) as string;
		const format = ctx.getNodeParameter('format', itemIndex) as string;
		const mentionsStr = ctx.getNodeParameter('mentions', itemIndex) as string;
		const replyToEventId = ctx.getNodeParameter('replyToEventId', itemIndex) as string;

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

		if (replyToEventId) {
			messageContent.reply_to = {
				event_id: replyToEventId,
			};
		}

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'POST',
			url: `${host}/chatbot/v1/send/${roomId}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: { content: messageContent },
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


