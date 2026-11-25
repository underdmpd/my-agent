# 学习对照表

`src/main.ts` 里每一段对应一个 agent 主题。学到哪块，就读对应的文档和示例，然后动手改那一段。

文档和示例都在 `node_modules/@earendil-works/pi-coding-agent/` 下（下面简写为 `pi/`）。

| 顺序 | 主题 | `src/main.ts` 里的位置 | 读什么 | 动手练习 |
|---|---|---|---|---|
| 1 | agent 循环与事件流 | 第 5 段 `session.subscribe` | `pi/docs/how-pi-works.md`，`pi-agent-core/README.md` 的 Event Flow | 把所有事件类型打印出来，看一次带工具调用的对话经过哪些事件 |
| 2 | 工具 | 第 4 段 `tools: [...]` | `pi/examples/sdk/05-tools.ts`、`06-extensions.ts` | 去掉 `write`/`edit` 做只读 agent；再用 `pi.registerTool()` 加一个自己的工具 |
| 3 | 系统提示词 | 第 2 段 `SYSTEM_PROMPT` | `pi/examples/sdk/03-custom-prompt.ts` | 改提示词，观察同一个任务行为怎么变 |
| 4 | 权限与拦截 | 第 3 段 `getExtensions` | `pi/docs/extensions.md`、`pi/docs/security.md` | 写一个扩展，在 `tool_call` 里拦截危险的 `bash` 命令 |
| 5 | 会话存储 | 第 4 段 `SessionManager.inMemory` | `pi/docs/sessions.md`、`session-format.md`、`examples/sdk/11-sessions.ts` | 改成落盘，退出后能恢复上次对话 |
| 6 | 上下文压缩 | 第 4 段 `compaction` | `pi/docs/compaction.md` | 把阈值调得很低，观察压缩前后的消息列表 |
| 7 | 模型与密钥 | 第 1 段 `ModelRuntime` | `pi/docs/models.md`、`providers.md`、`custom-provider.md` | 接入第二家模型，运行时切换 |
| 8 | skills 与提示词模板 | 第 3 段 `getSkills`/`getPrompts` | `pi/docs/skills.md`、`prompt-templates.md` | 写一个 skill，让 agent 按需加载 |
| 9 | 界面 | 第 5、6 段 | `pi/docs/rpc.md`、`tui.md` | 把 readline 换成更好的界面，或走 RPC 接前端 |

想看循环本身怎么实现的，读 `node_modules/@earendil-works/pi-agent-core/` 的源码；想手写一个最小循环，放在 `learn/` 目录，不进产品代码。

每学完一块，在 `notes/` 里记一篇笔记。
