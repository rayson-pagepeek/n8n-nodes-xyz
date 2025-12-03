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
				// 使用 streaming 响应模式
				responseMode: 'streaming',
				// 在 streaming 模式下，响应由后续节点处理，不返回默认响应
				responseData: 'noData',
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
		usableAsTool: {
			replacements: {
				displayName: 'XYZ Trigger',
				name: 'xyzTrigger',
				icon: 'file:icon.svg',
			},
		},
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

		// streaming 模式：不立即响应，等待流式响应
		// 在 streaming 模式下，响应会在后续节点中通过 httpResponse 处理
		return {
			workflowData: [returnData],
		};
	}
}


