import {
	type IExecuteFunctions,
	type INodeExecutionData,
	NodeOperationError,
} from 'n8n-workflow';
import type { XyzAction } from './types';

export class SendMediaMessageAction implements XyzAction {
	async execute(
		ctx: IExecuteFunctions,
		items: INodeExecutionData[],
		itemIndex: number,
		returnData: INodeExecutionData[],
		host: string,
		accessToken: string,
	): Promise<void> {
		const roomId = ctx.getNodeParameter('roomId', itemIndex) as string;
		const binaryPropertyName = ctx.getNodeParameter(
			'binaryPropertyName',
			itemIndex,
		) as string;

		// Get binary data
		const binaryData = ctx.helpers.assertBinaryData(itemIndex, binaryPropertyName);
		if (!binaryData) {
			throw new NodeOperationError(
				ctx.getNode(),
				`Binary property "${binaryPropertyName}" not found`,
				{ itemIndex },
			);
		}
		const dataBuffer = await ctx.helpers.getBinaryDataBuffer(itemIndex, binaryPropertyName);

		// Get content type and length
		const contentType = binaryData.mimeType || 'application/octet-stream';
		const contentLength = dataBuffer.length.toString();

		// Make request
		const responseData = await ctx.helpers.httpRequest({
			method: 'POST',
			url: `${host}/chatbot/v1/upload/${roomId}`,
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': contentType,
				'Content-Length': contentLength,
			},
			body: dataBuffer,
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


