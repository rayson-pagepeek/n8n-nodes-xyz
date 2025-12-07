import type { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';

/**
 * Action 元数据接口
 */
export interface XyzActionMetadata {
	/**
	 * Action 的唯一标识符，用于注册和查找
	 * 对应 operation 的 value
	 */
	name: string;

	/**
	 * Action 所属的资源组，用于在 operation 选项中分组
	 * 例如: 'File Actions', 'Message Actions', 'Chat Actions'
	 */
	resource: string;

	/**
	 * Action 依赖的参数名称列表
	 * 参数定义从参数库中获取
	 */
	params: readonly string[];

	/**
	 * Action 必填的参数名称列表
	 * 这些参数在生成 properties 时会被标记为 required: true
	 */
	requiredParams?: readonly string[];

	/**
	 * Action 的显示名称（可选）
	 * 如果不提供，将使用 name
	 */
	displayName?: string;

	/**
	 * Action 的描述（可选）
	 */
	description?: string;
}

/**
 * XyzAction 接口
 * 所有 Action 必须实现此接口
 */
export interface XyzAction extends XyzActionMetadata {
	/**
	 * 执行 Action 的核心逻辑
	 */
	execute(
		ctx: IExecuteFunctions,
		items: INodeExecutionData[],
		itemIndex: number,
		returnData: INodeExecutionData[],
		host: string,
		accessToken: string,
	): Promise<void>;
}


