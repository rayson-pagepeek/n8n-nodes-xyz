import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeOperationError,
} from 'n8n-workflow';
import type { BotEvent } from '../types';

export class XyzTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XYZ Trigger',
		name: 'xyzTrigger',
		icon: 'file:icon.svg',
		group: ['trigger'],
		version: 1,
		description: 'XYZ chatbot integration (triggers)',
		defaults: {
			name: 'XYZ Trigger',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				// 根据参数动态选择 webhook 路径: message 或 message-edit
				path: '={{$parameter["triggerType"]}}',
				responseMode: 'onReceived',
			},
		],
		properties: [
			{
				displayName: 'Trigger Type',
				name: 'triggerType',
				type: 'options',
				options: [
					{
						name: 'On Message',
						value: 'message',
					},
					{
						name: 'On Message Edit',
						value: 'message-edit',
					},
				],
				default: 'message',
			},
		],
		usableAsTool: true,
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData() as unknown as BotEvent;

		// Validate BotEvent
		if (!bodyData.event_id || !bodyData.room_id) {
			throw new NodeOperationError(
				this.getNode(),
				'Invalid BotEvent: event_id and room_id are required',
			);
		}

		// 默认将文本内容映射到 chatInput，方便直接接 AI 节点
		const chatInput =
			bodyData.content?.body ??
			(bodyData as unknown as { message?: string }).message ??
			'';

		const returnData = this.helpers.returnJsonArray({
			chatInput,
			...bodyData,
		});

		// Respond immediately
		const response = this.getResponseObject();
		response.status(200).json({ success: true });

		return {
			workflowData: [returnData],
			noWebhookResponse: true,
		};
	}
}


