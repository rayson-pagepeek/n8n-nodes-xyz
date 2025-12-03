import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

export interface XyzAction {
	execute(
		ctx: IExecuteFunctions,
		items: INodeExecutionData[],
		itemIndex: number,
		returnData: INodeExecutionData[],
		host: string,
		accessToken: string,
	): Promise<void>;
}


