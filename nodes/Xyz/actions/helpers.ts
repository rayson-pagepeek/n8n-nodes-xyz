import type { IExecuteFunctions } from 'n8n-workflow';

/**
 * 根据参数在 Action 中的必填状态获取正确的参数名
 * 如果参数在 Action 中是必填的，返回原始参数名
 * 如果参数在 Action 中是选填的，返回带 _optional 后缀的参数名
 * 
 * @param paramName 参数的原始名称（如 'eventId'）
 * @param isRequired 该参数在当前 Action 中是否为必填
 * @returns 正确的参数名
 */
export function getParamName(paramName: string, isRequired: boolean): string {
	return isRequired ? paramName : `${paramName}_optional`;
}

/**
 * 从 IExecuteFunctions 获取节点参数，自动处理必填/选填版本的参数名
 * 
 * @param ctx IExecuteFunctions 实例
 * @param paramName 参数的原始名称（如 'eventId'）
 * @param itemIndex 项目索引
 * @param isRequired 该参数在当前 Action 中是否为必填
 * @param fallback 如果参数不存在时的默认值（可选）
 * @returns 参数值
 */
export function getNodeParameterWithOptional(
	ctx: IExecuteFunctions,
	paramName: string,
	itemIndex: number,
	isRequired: boolean,
	fallback?: any,
): any {
	const actualParamName = getParamName(paramName, isRequired);
	
	// 尝试获取参数
	try {
		const value = ctx.getNodeParameter(actualParamName, itemIndex);
		// 如果值为 undefined 或空字符串，且提供了 fallback，返回 fallback
		if ((value === undefined || value === '') && fallback !== undefined) {
			return fallback;
		}
		return value;
	} catch (error) {
		// 如果参数不存在且提供了 fallback，返回 fallback
		if (fallback !== undefined) {
			return fallback;
		}
		throw error;
	}
}
