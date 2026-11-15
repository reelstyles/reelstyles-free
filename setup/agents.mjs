#!/usr/bin/env node
// One table for every agent ReelStyles supports: where it reads instructions and skills. Two users:
//   tools/pack-repo.mjs  packFiles(): the files the buyer pack carries at its root (open the pack folder in any agent, it finds the skills)
//   setup.sh / setup.ps1 `wire`: node setup/agents.mjs wire auto|list|<agent>... [--global] [--dir <project>]  (pointer files in the user's project)
// Docs checked 2026-11-14 (.claude/research/2026-11-14-agent-harness-setup.md in the ReelStyles source repo):
//   claude   code.claude.com/docs/en/skills, /memory      .claude/skills, ~/.claude/skills; reads AGENTS.md when there is no CLAUDE.md (v2.1.277+)
//   codex    learn.chatgpt.com/docs/build-skills, /agents-md   .agents/skills (cwd up to repo root), ~/.agents/skills; AGENTS.md, ~/.codex/AGENTS.md (32 KiB total)
//   opencode opencode.ai/docs/skills, /rules              .agents/skills, .claude/skills, ~/.agents/skills; AGENTS.md, ~/.config/opencode/AGENTS.md
//   cursor   cursor.com/docs/skills, /context/rules       .agents/skills, .cursor/skills, ~/.cursor/skills; .cursor/rules/*.mdc; AGENTS.md
//   roo      roocodeinc.github.io/Roo-Code/features/skills  .roo/skills, .agents/skills; .roo/rules; AGENTS.md (repo archived 2026-05-15)
//   cline    docs.cline.bot/customization/skills, /features/cline-rules  .cline/skills, ~/.cline/skills (name = folder); .clinerules/; AGENTS.md
//   gemini   geminicli.com/docs/cli/skills, /gemini-md    .agents/skills, ~/.agents/skills; GEMINI.md, ~/.gemini/GEMINI.md (AGENTS.md only via context.fileName)
//   copilot  docs.github.com copilot-cli custom instructions + agent skills; code.visualstudio.com agent-skills
//            .github/skills (VS Code), .agents/skills (CLI), ~/.copilot/skills; .github/copilot-instructions.md, ~/.copilot/copilot-instructions.md, AGENTS.md
//   windsurf docs.devin.ai/desktop/cascade/memories, /skills (Windsurf is Devin Desktop since 2026-06-02)
//            .devin/skills, .agents/skills, ~/.agents/skills; .devin/rules/*.md (legacy .windsurf/rules still read); AGENTS.md
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const NAME = "reelstyles";
export const AGENT_IDS = ["claude", "codex", "opencode", "cursor", "roo", "cline", "gemini", "copilot", "windsurf"];
export const DESC = "Make an animated video in a ReelStyles style (whiteboard, cut-paper, cartoon, collage, 3D and more), animated in code and rendered with HyperFrames. Use for any video, film, Short, explainer or animation request.";
export const SETUP_DESC = "Set up ReelStyles on this computer: checks and installs Node.js 22+, ffmpeg and Chrome for HyperFrames, connects the agent and renders a 5 s test film. Use when the user says \"set up ReelStyles\" or \"install ReelStyles\", or before the first ReelStyles video if setup has not passed.";

// text of the pointers; `skill` and `setup` are paths to the two real SKILL.md files, `where` names the pack folder
const point = (skill, setup, where) => `When the user asks for a video, an animation, a Short/Reel/TikTok or a film in a ReelStyles style, read \`${skill}\` and follow it step by step (its styles, formats and render steps sit next to it). If the user says "set up ReelStyles", or ReelStyles setup has not passed on this machine yet (\`bash setup/setup.sh check\`, on Windows \`setup\\setup.ps1 check\`, both run in ${where}), follow \`${setup}\` first.`;
const skillMd = (name, desc, body) => `---\nname: ${name}\ndescription: ${JSON.stringify(desc)}\n---\n\n${body}\n`;
// the two pointer skills an agent with skill support gets (folder name = name: Cursor, Roo, Cline and VS Code refuse anything else)
const pointerSkills = (root, skill, setup, where) => ({
  [`${root}/${NAME}/SKILL.md`]: skillMd(NAME, DESC, `${point(skill, setup, where)}\n\nThe full skill is \`${skill}\`: read it now and follow it. Paths in it are relative to its own folder.`),
  [`${root}/${NAME}-setup/SKILL.md`]: skillMd(`${NAME}-setup`, SETUP_DESC, `Read \`${setup}\` now and follow it step by step. The setup scripts are in the \`setup/\` folder of ${where}.`),
});

// ---------- files at the pack root (the pack is the project the agent opens; paths from its root) ----------
// `agentsMd` = the text of the pack's AGENTS.md (built by pack-repo per tier). Claude Code reads AGENTS.md only through a built-in plugin
// that can be off (a headless run on 11-14 loaded nothing), so .claude/CLAUDE.md imports it; not ./CLAUDE.md, the plugin validator warns on that.
export function packFiles(agentsMd = "") {
  const skill = `skills/${NAME}/SKILL.md`, setup = `skills/${NAME}-setup/SKILL.md`;
  const where = "the ReelStyles folder (the one with AGENTS.md, three folders above this file)";
  return {
    "AGENTS.md": agentsMd,
    ".claude/CLAUDE.md": "@../AGENTS.md\n",
    // Gemini CLI reads GEMINI.md, not AGENTS.md (unless the user changed context.fileName): the same text, no @import to depend on
    "GEMINI.md": agentsMd,
    // .agents/skills: Codex, Gemini CLI, OpenCode, Cursor, Roo, Copilot CLI, Devin Desktop (Windsurf). Gemini lists both (checked 11-14)
    ...pointerSkills(".agents/skills", skill, setup, where),
    // VS Code's Copilot harness reads .github/skills; Cline reads .cline/skills, .clinerules/skills, .claude/skills
    ...pointerSkills(".github/skills", skill, setup, where),
    ...pointerSkills(".cline/skills", skill, setup, where),
  };
}

// ---------- wire: pointer files in the user's own project (absolute paths to the pack) ----------
const fwd = p => p.replaceAll("\\", "/");
function plan(agent, g, dir, home, repo) {
  const skill = `${repo}/skills/${NAME}/SKILL.md`, setup = `${repo}/skills/${NAME}-setup/SKILL.md`, P = point(skill, setup, `\`${repo}\``);
  const S = root => pointerSkills(root, skill, setup, `\`${repo}\``);
  const B = f => ({ [f]: { block: P } });            // marked block inside a file the user may also edit
  const rule = (f, head = "# ReelStyles\n") => ({ [f]: `${head}${P}\n` });
  const d = dir, h = home;
  const t = {
    claude:   g ? S(`${h}/.claude/skills`) : S(`${d}/.claude/skills`),
    codex:    g ? { ...S(`${h}/.agents/skills`), ...B(`${fwd(process.env.CODEX_HOME || `${h}/.codex`)}/AGENTS.md`) } : { ...S(`${d}/.agents/skills`), ...B(`${d}/AGENTS.md`) },
    opencode: g ? { ...S(`${h}/.agents/skills`), ...B(`${h}/.config/opencode/AGENTS.md`) } : { ...S(`${d}/.agents/skills`), ...B(`${d}/AGENTS.md`) },
    cursor:   g ? S(`${h}/.cursor/skills`) : { ...S(`${d}/.agents/skills`), ...rule(`${d}/.cursor/rules/reelstyles.mdc`, `---\ndescription: ${DESC}\nalwaysApply: false\n---\n\n`) },
    roo:      g ? { ...S(`${h}/.agents/skills`), ...rule(`${h}/.roo/rules/reelstyles.md`) } : { ...S(`${d}/.agents/skills`), ...rule(`${d}/.roo/rules/reelstyles.md`) },
    // ponytail: global Cline rules go to ~/Documents/Cline/Rules; a OneDrive-redirected Documents folder is not looked up (skills in ~/.cline/skills still work)
    cline:    g ? { ...S(`${h}/.cline/skills`), ...rule(`${h}/Documents/Cline/Rules/reelstyles.md`) } : { ...S(`${d}/.cline/skills`), ...rule(`${d}/.clinerules/reelstyles.md`) },
    gemini:   g ? { ...S(`${h}/.agents/skills`), ...B(`${h}/.gemini/GEMINI.md`) } : { ...S(`${d}/.agents/skills`), ...B(`${d}/GEMINI.md`) },
    copilot:  g ? { ...S(`${h}/.copilot/skills`), ...B(`${h}/.copilot/copilot-instructions.md`) } : { ...S(`${d}/.github/skills`), ...S(`${d}/.agents/skills`), ...B(`${d}/.github/copilot-instructions.md`) },
    windsurf: g ? { ...S(`${h}/.agents/skills`), ...rule(`${h}/.devin/rules/reelstyles.md`, `---\ntrigger: model_decision\ndescription: ${DESC}\n---\n\n`) }
                : { ...S(`${d}/.agents/skills`), ...rule(`${d}/.devin/rules/reelstyles.md`, `---\ntrigger: model_decision\ndescription: ${DESC}\n---\n\n`) },
  };
  return t[agent];
}
const has = c => spawnSync(process.platform === "win32" ? "where" : "sh", process.platform === "win32" ? [c] : ["-c", `command -v ${c}`], { stdio: "ignore" }).status === 0;
export function detect(dir, home) {
  const e = p => existsSync(join(p));
  const docs = join(home, "Documents");
  return AGENT_IDS.filter(a => ({
    claude:   () => has("claude") || e(`${home}/.claude`) || e(`${dir}/.claude`),
    codex:    () => has("codex") || e(`${home}/.codex`),
    opencode: () => has("opencode") || e(`${home}/.config/opencode`) || e(`${dir}/.opencode`) || e(`${dir}/opencode.json`),
    cursor:   () => has("cursor") || has("cursor-agent") || e(`${home}/.cursor`) || e(`${dir}/.cursor`),
    roo:      () => e(`${home}/.roo`) || e(`${dir}/.roo`) || e(`${dir}/.roorules`),
    cline:    () => has("cline") || e(`${home}/.cline`) || e(`${docs}/Cline`) || e(`${dir}/.clinerules`) || e(`${dir}/.cline`),
    gemini:   () => has("gemini") || e(`${home}/.gemini`) || e(`${dir}/.gemini`),
    copilot:  () => has("copilot") || e(`${home}/.copilot`) || e(`${dir}/.github/copilot-instructions.md`),
    windsurf: () => has("windsurf") || has("devin-desktop") || e(`${home}/.codeium/windsurf`) || e(`${home}/.devin`) || e(`${dir}/.windsurf`) || e(`${dir}/.devin`),
  })[a]());
}

const MARK = /<!-- reelstyles:start -->[\s\S]*?<!-- reelstyles:end -->\r?\n?/;
function write(f, body) {   // body: string = whole file, { block } = our marked block inside a user file
  const old = existsSync(f) ? readFileSync(f, "utf8") : "";
  let s = body;
  if (typeof body !== "string") {
    let kept = old.replace(MARK, "");
    if (kept && !kept.endsWith("\n")) kept += "\n";
    s = `${kept}<!-- reelstyles:start -->\n## ReelStyles\n${body.block}\n<!-- reelstyles:end -->\n`;
  }
  if (old === s) return console.log(`  unchanged ${f}`);
  mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); console.log(`  wrote     ${f}`);
}

export function wire(args, { repo, home = fwd(homedir()) } = {}) {
  let g = false, dir = fwd(process.cwd()), agents = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--global") g = true;
    else if (args[i] === "--dir") dir = fwd(resolve(args[++i]));
    else agents.push(args[i]);
  }
  if (!agents.length) agents = ["auto"];
  if (agents[0] === "list") return console.log(`Detected: ${detect(dir, home).join(" ")}`), 0;
  if (!g && resolve(dir) === resolve(repo)) {
    console.log(`This is the ReelStyles folder itself. It already has AGENTS.md, GEMINI.md, .claude/CLAUDE.md, .agents/skills, .github/skills and .cline/skills, so every supported agent finds ReelStyles here. Nothing to wire. To use ReelStyles in another project, run wire from that project's folder.`);
    return 0;
  }
  if (agents[0] === "auto") {
    agents = detect(dir, home);
    const pl = `${home}/.claude/plugins/installed_plugins.json`;
    if (existsSync(pl) && readFileSync(pl, "utf8").includes(`"${NAME}@`)) { agents = agents.filter(a => a !== "claude"); console.log(`claude: the ${NAME} plugin is installed, nothing to wire.`); }
    if (!agents.includes("codex")) agents.push("codex");   // AGENTS.md + .agents/skills: read by most agents, always worth having
  }
  const bad = agents.filter(a => !AGENT_IDS.includes(a));
  if (bad.length) { console.log(`unknown agent ${bad.join(", ")} (use: ${AGENT_IDS.join(" ")})`); return 1; }
  console.log(`Wiring ReelStyles into ${g ? "your user settings" : dir} (pointer files only; the kits stay in ${repo})`);
  for (const a of agents) { console.log(`${a}:`); for (const [f, body] of Object.entries(plan(a, g, dir, home, repo))) write(f, body); }
  console.log("Done. Restart your agent (or start a new chat) so it reads the new files.");
  return 0;
}

// run as a script (real paths: a symlinked or junctioned folder must still count, or wire would silently do nothing)
const real = p => { try { return realpathSync(p); } catch { return p; } };
if (process.argv[1] && real(resolve(process.argv[1])) === real(fileURLToPath(import.meta.url))) {
  const [cmd, ...rest] = process.argv.slice(2);
  const repo = fwd(resolve(dirname(fileURLToPath(import.meta.url)), ".."));
  if (cmd === "wire") process.exit(wire(rest, { repo }));
  if (cmd === "selftest") {   // node setup/agents.mjs selftest: every agent writes only files with the right shape
    const { mkdtempSync, rmSync } = await import("node:fs"), { tmpdir } = await import("node:os");
    const tmp = fwd(mkdtempSync(join(tmpdir(), "rs-wire-"))), proj = `${tmp}/proj`, home = `${tmp}/home`;
    mkdirSync(proj); writeFileSync(`${proj}/AGENTS.md`, "# mine\n");
    const log = console.log; console.log = () => {};
    for (const g of [[], ["--global"]]) { wire([...AGENT_IDS, "--dir", proj, ...g], { repo, home }); wire([...AGENT_IDS, "--dir", proj, ...g], { repo, home }); }
    wire(["auto", "--dir", repo], { repo, home });
    console.log = log;
    const read = f => readFileSync(`${proj}/${f}`, "utf8");
    const fails = [];
    const ok = (c, m) => c || fails.push(m);
    ok(read("AGENTS.md").startsWith("# mine\n") && read("AGENTS.md").split("reelstyles:start").length === 2, "AGENTS.md block not idempotent or user text lost");
    for (const r of [".agents/skills", ".claude/skills", ".cline/skills", ".github/skills"].map(r => `${proj}/${r}`).concat(`${home}/.cursor/skills`, `${home}/.claude/skills`)) {
      for (const n of [NAME, `${NAME}-setup`]) {
        const f = `${r}/${n}/SKILL.md`;
        ok(existsSync(f) && readFileSync(f, "utf8").startsWith(`---\nname: ${n}\ndescription: `), `bad skill ${r}/${n}`);
      }
    }
    ok(read(".cursor/rules/reelstyles.mdc").startsWith("---\ndescription:"), "cursor mdc frontmatter");
    ok(read(".devin/rules/reelstyles.md").startsWith("---\ntrigger: model_decision"), "devin rule frontmatter");
    ok(existsSync(`${home}/.codex/AGENTS.md`) && existsSync(`${home}/.copilot/copilot-instructions.md`) && existsSync(`${home}/.config/opencode/AGENTS.md`), "global files");
    for (const [f, s] of Object.entries(packFiles())) if (f.endsWith("SKILL.md")) ok(JSON.parse(s.split("\n")[2].slice(13)).length <= 1024, `${f} description > 1024`);
    rmSync(tmp, { recursive: true, force: true });
    console.log(fails.length ? `FAIL\n${fails.join("\n")}` : "agents.mjs ok"); process.exit(fails.length ? 1 : 0);
  }
  console.log("usage: node setup/agents.mjs wire auto|list|<agent>... [--global] [--dir <project>] | selftest"); process.exit(2);
}
