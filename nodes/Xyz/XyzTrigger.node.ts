import {
	INodeType,
	INodeTypeDescription,
	IWebhookFunctions,
	IWebhookResponseData,
	NodeOperationError,
	type WebhookResponseMode,
} from 'n8n-workflow';
import type { BotEvent } from '../types';

/**
 * 根据 response_mode 判断 WebhookResponseMode
 * @param responseMode - response_mode 的值
 * @returns WebhookResponseMode: 'streaming' | 'hostedChat'
 */
function getWebhookResponseMode(responseMode?: string): WebhookResponseMode {
	// 根据 response_mode 的值判断
	// 如果 response_mode 是 'streaming' 或相关值，返回 'streaming'
	// 如果 response_mode 是 'hostedChat' 或相关值，返回 'hostedChat'
	// 默认返回 'hostedChat'
	if (!responseMode) {
		return 'hostedChat';
	}

	const mode = responseMode.toLowerCase();
	if (mode === 'streaming' || mode === 'sse' || mode.includes('stream')) {
		return 'streaming';
	}

	// 默认使用 hostedChat
	return 'hostedChat';
}

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
				// responseMode 将在 webhook 方法中根据 response_mode 动态处理
				// 默认使用 'onReceived'，但会根据请求中的 response_mode 调整行为
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

		// 根据 response_mode 判断 WebhookResponseMode
		const webhookResponseMode = getWebhookResponseMode(bodyData.response_mode);

		// 默认将文本内容映射到 chatInput，方便直接接 AI 节点
		const chatInput =
			bodyData.content?.body ??
			(bodyData as unknown as { message?: string }).message ??
			'';

		const returnData = this.helpers.returnJsonArray({
			chatInput,
			...bodyData,
		});

		// 根据 responseMode 决定响应方式
		// 注意：虽然节点描述中 responseMode 是 'onReceived'，但我们可以根据
		// response_mode 的值来调整实际行为
		if (webhookResponseMode === 'streaming') {
			// streaming 模式：不立即响应，等待流式响应
			// 在 streaming 模式下，响应会在后续节点中通过 httpResponse 处理
			return {
				workflowData: [returnData],
				// 不设置 noWebhookResponse，让后续节点处理响应
			};
		} else {
			// hostedChat 模式或其他模式：立即响应
			const response = this.getResponseObject();
			response.status(200);

			return {
				workflowData: [returnData],
				noWebhookResponse: true,
			};
		}
	}
}


