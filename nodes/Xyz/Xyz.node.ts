import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeProperties,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import './actions'; // 确保 Action 被注册
import { getParams } from './params';
import { actionRegistry } from './registry';

export class Xyz implements INodeType {
	get description(): INodeTypeDescription {
		return {
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
		};
	}

	/**
	 * 生成 Operation 属性
	 * 根据注册的 Action 按 resource 分组生成选项
	 */
	private generateOperationProperty(): INodeProperties {
		const resources = actionRegistry.getResources();
		const options: any[] = [];

		for (const resource of resources) {
			const actions = actionRegistry.getByResource(resource);
			if (actions.length === 0) {
				continue;
			}

			const resourceOptions = actions.map((action) => ({
				name: action.displayName || action.name,
				action: action.description || '',
				value: action.name,
				description: action.description || '',
			}));

			options.push({
				name: resource,
				options: resourceOptions,
			});
		}

		// 获取默认操作（第一个注册的 Action）
		const allActions = actionRegistry.getAll();
		const defaultOperation = allActions.length > 0 ? allActions[0].name : '';

		return {
			displayName: 'Operation',
			name: 'operation',
			type: 'options',
			noDataExpression: true,
			options,
			default: defaultOperation,
		};
	}

	/**
	 * 生成参数属性
	 * 从所有注册的 Action 中收集参数，从参数库获取定义，并配置 displayOptions 和 required
	 */
	private generateParameterProperties(): INodeProperties[] {
		// 收集所有 Action 使用的参数
		const paramUsage = new Map<string, Set<string>>(); // paramName -> Set<actionName>
		// 收集参数的必填信息：paramName -> Set<actionName> (使用该参数且该参数为必填的 Action)
		const paramRequired = new Map<string, Set<string>>();

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
				}
			}
		}

		// 生成属性列表
		const properties: INodeProperties[] = [];
		const processedPropertyNames = new Set<string>(); // 避免重复的 property name

		for (const [paramName, actionNames] of paramUsage.entries()) {
			// 获取参数定义
			const paramDef = getParams([paramName as any])[0];

			// 如果 property name 已处理过，跳过
			if (processedPropertyNames.has(paramDef.name)) {
				continue;
			}
			processedPropertyNames.add(paramDef.name);

			// 判断是否必填：如果该参数在任何一个 Action 中是必填的，则设置为 required: true
			const requiredActions = paramRequired.get(paramName) || new Set();
			const isRequired = requiredActions.size > 0;

			// 配置 displayOptions 和 required
			const property: INodeProperties = {
				...paramDef,
				required: isRequired,
				displayOptions: {
					show: {
						operation: Array.from(actionNames),
					},
				},
			};

			properties.push(property);
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
