# CanvasCoding - AI 驱动的工作流可视化编辑器

CanvasCoding 是一个面向软件工程的可视化工作流设计工具。通过拖拽节点和连线直观地构建项目架构，并借助 AI 智能体自动生成完整的工作流节点图。

---

## 功能特性

### 可视化工作流编辑器
- **React Flow 画布** — 无限画布，支持节点拖拽、连线、缩放、删除
- **11 种节点类型** — 项目配置、功能模块、数据模型、API 端点、代码生成、测试策略、环境配置、质量约束、条件分支、代码示例、输出配置
- **工具箱** — 左侧面板拖拽添加节点
- **属性面板** — 选中节点后编辑配置和参数
- **自动保存** — 防抖自动持久化，避免数据丢失
- **DAG 依赖分析** — 检测循环依赖，确保工作流可执行

### AI 自动生成节点图
- **右侧侧边栏** — 不阻塞画布，实时查看 AI 生成过程
- **上下文注入** — AI 读取当前画布结构（节点 ID、类型、配置、连线），理解已有设计
- **增量编辑** — 保留旧节点并原地更新，新增/删除节点，而非每次都从零重建
- **对话记忆** — 支持多轮迭代对话，AI 理解修改意图
- **SSE 流式生成** — 节点逐个出现在画布上，实时反馈
- **多 Provider 支持** — OpenAI / DeepSeek / Anthropic Claude / Google Gemini / 自定义 OpenAI 兼容平台

### AI 智能体 (Agent)
- **Agent 管理** — 创建和管理自定义 AI 智能体，绑定到特定节点类型
- **System Prompt 定制** — 每个 Agent 可配置独立的 system prompt
- **基于 Mastra** — 使用 Mastra 框架编排 AI 工作流

### Prompt 生成与导出
- **批量生成** — 遍历工作流节点，逐个调用 AI 生成 Markdown 内容
- **一键导出** — 将生成内容导出为 `.md` 文件下载

### 用户系统
- **注册/登录** — 基于 NextAuth.js + bcrypt 的邮箱密码认证
- **数据隔离** — 每个用户独立的工作流和 Agent 数据
- **软删除** — 工作流支持软删除和恢复

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端框架** | Next.js 16 + React 19 + TypeScript |
| **画布引擎** | React Flow (@xyflow/react v12) |
| **UI 组件** | shadcn/ui + TailwindCSS 4 |
| **认证** | NextAuth.js v4 + bcryptjs |
| **数据库** | Prisma 7.x + MySQL (MariaDB) |
| **AI SDK** | Vercel AI SDK v6 (@ai-sdk/openai, @ai-sdk/anthropic, @ai-sdk/google) |
| **AI 编排** | Mastra v1 |
| **包管理** | pnpm workspace (monorepo) |
| **表单** | react-hook-form + zod |

---

## 项目结构

```
CanvasCoding/
├── apps/web/                    # 主应用 (Next.js)
│   ├── app/
│   │   ├── (auth)/              # 登录/注册页面
│   │   ├── api/
│   │   │   ├── agents/          # Agent CRUD
│   │   │   ├── auth/            # NextAuth 认证
│   │   │   └── workflows/
│   │   │       ├── [id]/auto-layout/  # AI 自动生成节点图
│   │   │       ├── [id]/generate/     # Prompt 批量生成
│   │   │       └── [id]/route.ts      # 工作流 CRUD
│   │   ├── dashboard/           # 仪表板
│   │   └── workflows/[id]/      # 工作流编辑器
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/            # 认证组件
│   │   │   └── flow/            # 画布核心组件
│   │   │       ├── AiSidebar.tsx      # AI 侧边栏
│   │   │       ├── Canvas.tsx         # 画布
│   │   │       ├── Toolbox.tsx        # 工具箱
│   │   │       ├── PropertyPanel.tsx  # 属性面板
│   │   │       ├── AgentSelector.tsx  # Agent 选择器
│   │   │       └── nodes/            # 11 种节点类型
│   │   ├── hooks/               # 自定义 Hooks
│   │   └── lib/                 # 核心库
│   │       ├── model-provider.ts     # 多 Provider 统一接入
│   │       ├── auth.ts               # 认证工具
│   │       ├── prisma.ts             # 数据库客户端
│   │       └── dag.ts                # DAG 依赖分析
│   └── components/ui/           # shadcn/ui 组件
├── packages/
│   ├── engine/                  # 工作流引擎
│   ├── shared/                  # 共享类型定义
│   └── ui/                      # 共享 UI 组件
├── mastra/                      # Mastra AI Agent 后端
├── prisma/
│   ├── schema.prisma            # 数据库 Schema
│   └── migrations/              # 数据库迁移
└── package.json                 # 根 workspace 配置
```

---

## 快速开始

### 环境要求

- **Node.js** >= 18
- **pnpm** >= 10 (通过 `corepack enable && corepack prepare pnpm@latest --activate`)
- **MySQL** / **MariaDB** 数据库

### 安装

```bash
# 1. 克隆仓库
git clone https://github.com/UYSAUIYO/Canvas-Coding.git
cd Canvas-Coding

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 填入数据库连接和 API Key
```

### 环境变量

```env
# 数据库
DATABASE_URL="mysql://user:password@localhost:3306/canvascoding"

# 认证
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# AI 模型（可选，也可在前端设置页面配置）
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"
LLM_MODEL="gpt-5.5"
ANTHROPIC_API_KEY="sk-ant-..."
GOOGLE_API_KEY="..."
```

### 数据库初始化

```bash
pnpm db:push           # 同步 Schema 到数据库
# 或
pnpm db:migrate        # 生成迁移文件并应用
```

### 启动开发服务器

```bash
pnpm dev               # 启动 Next.js 开发服务器 (http://localhost:3000)
```

### 构建生产版本

```bash
pnpm build
pnpm start
```

---

## 使用指南

### 1. 创建工作流

进入仪表板，点击"新建工作流"进入编辑器。

### 2. 手动构建

- 从左侧工具箱拖拽节点到画布
- 拖拽节点边缘的连接点创建连线
- 点击节点在右侧属性面板编辑配置

### 3. AI 自动生成

1. 点击顶部工具栏的 **AI 生成** 按钮，打开右侧侧边栏
2. 输入项目需求描述（如"做一个博客系统，支持 Markdown 编辑、评论、标签分类"）
3. AI 将流式生成节点图，节点逐个出现在画布上
4. 可以在已有基础上继续对话进行迭代修改（如"增加用户关注功能"）

### 4. 配置 AI Provider

进入 **设置** 页面，可以：
- 选择 AI 平台（OpenAI / Anthropic / Google / 自定义）
- 配置 API Key
- 自定义模型名称
- 添加自定义 OpenAI 兼容平台（如 DeepSeek、通义千问等）

### 5. 生成 Prompt

画布上放置好节点后，点击 **生成 Prompt** 按钮，AI 将逐个节点生成结构化的 Markdown 内容，可一键导出下载。

### 6. 管理 AI Agent

在仪表板的 **Agent 管理** 页面，可以创建自定义 Agent，绑定到特定节点类型，配置专属 system prompt。

---

## 节点类型速查

| 类型 | 用途 | 关键配置 |
|------|------|----------|
| `project` | 项目信息 | name, language, framework, description |
| `module` | 功能模块 | name, description, interfaceSignature |
| `data-model` | 数据模型 | name, fields[{name, type, description}] |
| `api` | API 端点 | method, path, description, requestBody, responseBody |
| `generate` | 代码生成 | description, codeStyle, filePathTemplate |
| `test` | 测试策略 | framework, coverageTarget, focus[] |
| `validate` | 质量约束 | type(lint/type-safety/performance/security), rules[] |
| `env` | 环境配置 | variables[{key, description, defaultValue}] |
| `condition` | 条件分支 | expression, branchA, branchB |
| `example` | 代码示例 | code, language, caption |
| `output` | 输出配置 | format(markdown/json/yaml), templateMapping |

---

## 脚本命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm lint` | 运行 ESLint |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm format` | Prettier 格式化代码 |
| `pnpm db:push` | 推送 Schema 到数据库 |
| `pnpm db:migrate` | 生成并应用迁移 |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:studio` | 打开 Prisma Studio |

---

## License

MIT
