import type { INodeProperties } from 'n8n-workflow';

export interface ParamDefinition extends INodeProperties {
	name: string;
}

export type ParamRegistry = Record<string, ParamDefinition>;
