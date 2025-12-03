import {
    INodeType,
    INodeTypeDescription,
    IWebhookFunctions,
    IWebhookResponseData,
    NodeOperationError,
} from 'n8n-workflow';
import { BotEvent } from '../types';

export class OnMessage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'On Message',
		name: 'onMessage',
		icon: 'file:icon.svg',
		group: ['trigger'],
		version: 1,
		description: 'Triggers the workflow when a message event is received',
		defaults: {
			name: 'On Message',
		},
		inputs: [],
		outputs: ['main'],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				path: 'message',
				responseMode: 'onReceived',
			},
		],
		properties: [],
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

		// Return the BotEvent data to the workflow
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const returnData = this.helpers.returnJsonArray(bodyData as any);

		// Respond immediately
		const response = this.getResponseObject();
		response.status(200).json({ success: true });

		return {
			workflowData: [returnData],
			noWebhookResponse: true,
		};
	}
}

