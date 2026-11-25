/**
 * my-agent 入口：基于 pi-coding-agent SDK 的最小 coding agent。
 *
 * 所有配置都显式写出（不自动发现 ~/.pi 下的任何东西），
 * 每一块对应一个学习主题，见 notes/learning-map.md。
 *
 * 用法：
 *   npm start                 进入交互模式
 *   npm start -- "你的问题"    单次执行
 */

import { createInterface } from "node:readline/promises";
import { getModel } from "@earendil-works/pi-ai/compat";
import {
	createAgentSession,
	createExtensionRuntime,
	ModelRuntime,
	type ResourceLoader,
	SessionManager,
	SettingsManager,
} from "@earendil-works/pi-coding-agent";

const cwd = process.cwd();
const agentDir = `${cwd}/.my-agent`; // agent 自己的状态目录，已在 .gitignore 中

// ── 1. 模型与密钥 ────────────────────────────────────────────
const modelRuntime = await ModelRuntime.create({
	authPath: `${agentDir}/auth.json`,
	modelsPath: `${agentDir}/models.json`,
});
const apiKey = process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN;
if (!apiKey) throw new Error("请先设置环境变量 ANTHROPIC_API_KEY");
await modelRuntime.setRuntimeApiKey("anthropic", apiKey);

const modelId = process.env.MY_AGENT_MODEL ?? "claude-sonnet-5-5";
const baseModel = getModel("anthropic", modelId as never);
if (!baseModel) throw new Error(`找不到模型: ${modelId}`);
// 如果走代理/网关，用 ANTHROPIC_BASE_URL 覆盖默认地址
const model = process.env.ANTHROPIC_BASE_URL
	? { ...baseModel, baseUrl: process.env.ANTHROPIC_BASE_URL }
	: baseModel;

// ── 2. 系统提示词 ────────────────────────────────────────────
const SYSTEM_PROMPT = `你是 my-agent，一个通用的 coding agent。
你可以用工具读写文件、执行 shell 命令来完成用户的编程任务。
当前工作目录: ${cwd}
先了解情况再动手，改动尽量小，做完后简要说明做了什么。`;

// ── 3. 资源加载：扩展 / skills / 提示词模板，目前全部为空 ──────
const resourceLoader: ResourceLoader = {
	getExtensions: () => ({ extensions: [], errors: [], runtime: createExtensionRuntime() }),
	getSkills: () => ({ skills: [], diagnostics: [] }),
	getPrompts: () => ({ prompts: [], diagnostics: [] }),
	getThemes: () => ({ themes: [], diagnostics: [] }),
	getAgentsFiles: () => ({ agentsFiles: [] }),
	getSystemPrompt: () => SYSTEM_PROMPT,
	getSystemPromptSource: () => undefined,
	getAppendSystemPrompt: () => [],
	getAppendSystemPromptSources: () => [],
	extendResources: () => {},
	reload: async () => {},
};

// ── 4. 创建会话：工具、会话存储、设置 ─────────────────────────
const { session } = await createAgentSession({
	cwd,
	agentDir,
	model,
	thinkingLevel: "off",
	modelRuntime,
	resourceLoader,
	tools: ["read", "write", "edit", "bash", "grep", "find", "ls"],
	sessionManager: SessionManager.inMemory(cwd),
	settingsManager: SettingsManager.inMemory({
		compaction: { enabled: true },
		retry: { enabled: true, maxRetries: 2 },
	}),
});

// ── 5. 界面：订阅事件流，自己决定怎么显示 ─────────────────────
session.subscribe((event) => {
	switch (event.type) {
		case "message_update":
			if (event.assistantMessageEvent.type === "text_delta") {
				process.stdout.write(event.assistantMessageEvent.delta);
			}
			break;
		case "message_end":
			// 模型调用失败不会抛异常，而是作为一条 stopReason 为 error 的消息结束
			if (event.message.role === "assistant" && event.message.stopReason === "error") {
				console.log(`\x1b[31m✗ 模型调用失败: ${event.message.errorMessage}\x1b[0m`);
			}
			break;
		case "tool_execution_start":
			console.log(`\n\x1b[2m→ ${event.toolName} ${JSON.stringify(event.args)}\x1b[0m`);
			break;
		case "tool_execution_end":
			if (event.isError) console.log(`\x1b[31m✗ ${event.toolName} 失败\x1b[0m`);
			break;
	}
});

// ── 6. 运行：单次或交互 ──────────────────────────────────────
try {
	const oneShot = process.argv.slice(2).join(" ").trim();
	if (oneShot) {
		await session.prompt(oneShot);
		console.log();
	} else {
		const rl = createInterface({ input: process.stdin, output: process.stdout });
		console.log(`my-agent (${model.id})  输入 exit 退出\n`);
		while (true) {
			const input = (await rl.question("> ")).trim();
			if (!input) continue;
			if (input === "exit") break;
			await session.prompt(input);
			console.log("\n");
		}
		rl.close();
	}
} finally {
	session.dispose();
}
