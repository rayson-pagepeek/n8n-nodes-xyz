# Project Context

## Purpose
这是一个 n8n 社区节点包，用于开发和发布可在 n8n 工作流中使用的自定义节点。项目允许开发者创建、测试和发布符合 n8n 节点规范的集成节点。

主要目标：
- 提供符合 n8n 社区节点规范的节点实现
- 支持节点的开发、构建和发布流程
- 确保节点符合 n8n 的质量和兼容性标准

## Tech Stack
- **TypeScript**: 5.9.2 - 主要开发语言
- **Node.js**: 使用 CommonJS 模块系统
- **n8n-workflow**: 作为 peer dependency，提供节点开发所需的类型和接口
- **@n8n/node-cli**: n8n 官方 CLI 工具，用于构建、开发和发布节点
- **ESLint**: 9.32.0 - 代码质量检查
- **Prettier**: 3.6.2 - 代码格式化

## Project Conventions

### Code Style
- 使用 TypeScript strict 模式
- 遵循 ESLint 和 Prettier 配置
- 使用 2 空格缩进（从示例代码推断）
- 节点类名使用 PascalCase（如 `Example`）
- 文件名遵循 `NodeName.node.ts` 格式
- 节点定义名称使用 kebab-case（如 `example`）

### Architecture Patterns
- 每个节点实现 `INodeType` 接口
- 节点类必须包含：
  - `description`: `INodeTypeDescription` 对象，定义节点的元数据、属性等
  - `execute`: 异步方法，执行节点的核心逻辑
- 节点放置在 `nodes/[NodeName]/` 目录下
- 每个节点需要对应的 JSON 元数据文件（`NodeName.node.json`）
- 节点需要 SVG 图标文件（light 和 dark 版本）

### Testing Strategy
- 使用 n8n 提供的开发和测试工具
- 通过 `npm run dev` 进行本地开发和测试
- 通过 `npm run build` 构建生产版本

### Git Workflow
- 主分支：`main`
- 遵循标准的 git 提交规范
- 使用 OpenSpec 进行变更管理和规范驱动开发

## Domain Context
- **n8n**: 一个开源的工作流自动化平台
- **社区节点**: 由社区开发的自定义节点，扩展 n8n 的功能
- **节点类型**: 每个节点实现特定的功能，可以作为工作流中的一个步骤
- **节点操作**: 节点的主要执行逻辑，处理输入数据并返回输出数据
- **节点属性**: 用户可以配置的参数，用于自定义节点行为

n8n 节点开发要点：
- 节点需要实现 `INodeType` 接口
- 节点的 `execute` 方法接收输入数据项，处理并返回输出数据
- 节点需要处理错误情况，使用 `continueOnFail()` 或抛出 `NodeOperationError`
- 节点可以支持表达式，参数值可以从工作流上下文中动态解析

## Important Constraints
- **n8n 兼容性**: 必须符合 n8n 节点 API 规范（当前版本：v1）
- **TypeScript 严格模式**: 项目启用 strict 模式，需要完整的类型定义
- **构建输出**: 编译后的代码输出到 `dist/` 目录
- **包发布**: 发布时只包含 `dist` 目录的内容
- **节点注册**: 节点需要在 `package.json` 的 `n8n.nodes` 数组中注册

## External Dependencies
- **n8n-workflow**: n8n 核心工作流库，提供节点开发所需的类型和工具
  - 提供 `IExecuteFunctions`, `INodeType`, `INodeExecutionData` 等核心接口
  - 提供 `NodeOperationError` 等错误处理工具
- **@n8n/node-cli**: n8n 官方 CLI 工具
  - 提供构建、开发、测试、发布等命令
  - 处理节点包的元数据和验证
