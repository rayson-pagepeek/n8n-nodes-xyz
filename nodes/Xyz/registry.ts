import type { XyzAction } from './actions/types';
import { getParams } from './params';

/**
 * Action 注册表
 * 管理所有注册的 Action，支持按 resource 分组
 */
class ActionRegistry {
	private actions = new Map<string, XyzAction>();
	private byResource = new Map<string, XyzAction[]>();
	private registrationOrder: string[] = [];

	/**
	 * 注册 Action
	 * @param action Action 实例
	 * @throws 如果 action.name 已存在，抛出错误
	 * @throws 如果 action.params 中的参数在参数库中不存在，抛出错误
	 */
	register(action: XyzAction): void {
		// 验证 name 唯一性
		if (this.actions.has(action.name)) {
			throw new Error(
				`Action with name "${action.name}" is already registered. Each action must have a unique name.`,
			);
		}

		// 验证 params 中的参数在参数库中存在
		try {
			getParams(action.params);
		} catch (error) {
			throw new Error(
				`Action "${action.name}" has invalid params: ${(error as Error).message}`,
			);
		}

		// 注册 Action
		this.actions.set(action.name, action);
		this.registrationOrder.push(action.name);

		// 按 resource 分组
		const resource = action.resource;
		if (!this.byResource.has(resource)) {
			this.byResource.set(resource, []);
		}
		this.byResource.get(resource)!.push(action);
	}

	/**
	 * 批量注册 Action
	 */
	registerAll(actions: XyzAction[]): void {
		for (const action of actions) {
			this.register(action);
		}
	}

	/**
	 * 根据 name 获取 Action
	 * @param name Action 名称
	 * @returns Action 实例，如果不存在返回 undefined
	 */
	get(name: string): XyzAction | undefined {
		return this.actions.get(name);
	}

	/**
	 * 根据 name 获取 Action（必须存在）
	 * @param name Action 名称
	 * @returns Action 实例
	 * @throws 如果 Action 不存在，抛出错误
	 */
	getRequired(name: string): XyzAction {
		const action = this.actions.get(name);
		if (!action) {
			throw new Error(`Action "${name}" not found in registry`);
		}
		return action;
	}

	/**
	 * 根据 resource 获取该资源组下的所有 Action
	 * @param resource 资源组名称
	 * @returns Action 数组，按注册顺序返回
	 */
	getByResource(resource: string): XyzAction[] {
		return this.byResource.get(resource) || [];
	}

	/**
	 * 获取所有已注册的 resource 名称
	 * @returns resource 名称数组
	 */
	getResources(): string[] {
		return Array.from(this.byResource.keys());
	}

	/**
	 * 获取所有已注册的 Action
	 * @returns Action 数组，按注册顺序返回
	 */
	getAll(): XyzAction[] {
		return this.registrationOrder.map((name) => this.actions.get(name)!);
	}

	/**
	 * 检查 Action 是否已注册
	 */
	has(name: string): boolean {
		return this.actions.has(name);
	}

	/**
	 * 清空注册表（主要用于测试）
	 */
	clear(): void {
		this.actions.clear();
		this.byResource.clear();
		this.registrationOrder = [];
	}
}

// 导出单例实例
export const actionRegistry = new ActionRegistry();
