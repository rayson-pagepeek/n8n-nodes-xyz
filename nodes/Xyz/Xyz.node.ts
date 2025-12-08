import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	NodeOperationError
} from 'n8n-workflow';
import './actions'; // 确保 Action 被注册
import { getParams } from './params';
import type { ParamRegistry } from './params/types';
import { actionRegistry } from './registry';

export class Xyz implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'XYZ',
		name: 'xyz',
		icon: 'file:icon.svg',
		group: ['transform'],
		version: 1,
		description: 'XYZ chatbot integration (actions)',
		defaults: {
			name: 'XYZ',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'chatbotApi',
				required: true,
			},
		],
		usableAsTool: {
			replacements: {
				displayName: 'XYZ',
				name: 'xyz',
				icon: 'file:icon.svg',
			},
		},
		properties: [
			this.generateOperationProperty(),
			...this.generateParameterProperties(),
		],
	}

	/**
	 * 生成 Operation 属性
	 * 根据注册的 Action 按 resource 分组生成选项
	 */
	private generateOperationProperty(): INodeProperties {
		const resources = actionRegistry.getResources();
		const options: INodePropertyOptions[] = [];

		for (const resource of resources) {
			const actions = actionRegistry.getByResource(resource);
			if (actions.length === 0) {
				continue;
			}

			actions.forEach((action) => (
				options.push({
					name: action.displayName || action.name,
					action: action.description || '',
					value: action.name,
					description: action.description || '',
				})
			));
		}

		// 获取默认操作（第一个注册的 Action）
		const allActions = actionRegistry.getAll();
		const defaultOperation = allActions.length > 0 ? allActions[0].name : '';

		return {
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			options: options,
			default: defaultOperation,
		};
	}

	/**
	 * 生成参数属性
	 * 从所有注册的 Action 中收集参数，从参数库获取定义，并配置 displayOptions 和 required
	 * 如果同一个参数在不同 Action 中既有必填又有选填，会创建两个版本的属性
	 */
	private generateParameterProperties(): INodeProperties[] {
		// 收集所有 Action 使用的参数
		const paramUsage = new Map<string, Set<string>>(); // paramName -> Set<actionName>
		// 收集参数的必填信息：paramName -> Set<actionName> (使用该参数且该参数为必填的 Action)
		const paramRequired = new Map<string, Set<string>>();
		// 收集参数的选填信息：paramName -> Set<actionName> (使用该参数但该参数为选填的 Action)
		const paramOptional = new Map<string, Set<string>>();

		for (const action of actionRegistry.getAll()) {
			const requiredParamsSet = new Set(action.requiredParams || []);

			for (const paramName of action.params) {
				// 记录参数使用情况
				if (!paramUsage.has(paramName)) {
					paramUsage.set(paramName, new Set());
				}
				paramUsage.get(paramName)!.add(action.name);

				// 记录必填参数
				if (requiredParamsSet.has(paramName)) {
					if (!paramRequired.has(paramName)) {
						paramRequired.set(paramName, new Set());
					}
					paramRequired.get(paramName)!.add(action.name);
				} else {
					// 记录选填参数
					if (!paramOptional.has(paramName)) {
						paramOptional.set(paramName, new Set());
					}
					paramOptional.get(paramName)!.add(action.name);
				}
			}
		}

		// 生成属性列表
		const properties: INodeProperties[] = [];

		for (const [paramName] of paramUsage.entries()) {
			// 获取参数定义
			const paramDef = getParams([paramName as keyof ParamRegistry])[0];
			const requiredActions = paramRequired.get(paramName) || new Set();
			const optionalActions = paramOptional.get(paramName) || new Set();

			// 如果该参数既有必填的 Action 又有选填的 Action，创建两个版本
			if (requiredActions.size > 0 && optionalActions.size > 0) {
				// 创建必填版本（使用原始 name）
				const requiredProperty: INodeProperties = {
					...paramDef,
					required: true,
					displayOptions: {
						show: {
							operation: Array.from(requiredActions),
						},
					},
				};
				properties.push(requiredProperty);

				// 创建选填版本（name 添加 _optional 后缀）
				const optionalProperty: INodeProperties = {
					...paramDef,
					name: `${paramDef.name}_optional`,
					displayName: `${paramDef.displayName} (Optional)`,
					required: false,
					displayOptions: {
						show: {
							operation: Array.from(optionalActions),
						},
					},
				};
				properties.push(optionalProperty);
			} else if (requiredActions.size > 0) {
				// 只在必填的 Action 中使用，创建必填版本
				const property: INodeProperties = {
					...paramDef,
					required: true,
					displayOptions: {
						show: {
							operation: Array.from(requiredActions),
						},
					},
				};
				properties.push(property);
			} else {
				// 只在选填的 Action 中使用，创建选填版本
				const property: INodeProperties = {
					...paramDef,
					required: false,
					displayOptions: {
						show: {
							operation: Array.from(optionalActions),
						},
					},
				};
				properties.push(property);
			}
		}

		return properties;
	}

	// Action handler
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0) as string;

		if (operation === 'trigger') {
			// 触发模式下不会走 execute，保持兼容
			return [items];
		}

		for (let i = 0; i < items.length; i++) {
			try {
				const credentials = await this.getCredentials('chatbotApi');
				const host = credentials.host as string;
				const accessToken = credentials.accessToken as string;

				// 从注册表获取 Action
				const action = actionRegistry.get(operation);

				if (!action) {
					throw new NodeOperationError(
						this.getNode(),
						`Unknown operation: ${operation}`,
						{
							itemIndex: i,
						},
					);
				}

				await action.execute(this, items, i, returnData, host, accessToken);
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}

		return [returnData];
	}
}
