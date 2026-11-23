/** Every prompt: implementation, one argument, help path, commit-scope closer. */
import { strict as assert } from "node:assert";
import { test } from "node:test";
import { AREA_PROMPTS, getPrompt, listPrompts, prompts } from "./_prompts.fixture.mjs";

test("every listed prompt has a getPrompt implementation with messages", () => {
  for (const p of prompts) {
    const full = getPrompt(p.name);
    assert.ok(full, `${p.name}: getPrompt returned null`);
    assert.ok(Array.isArray(full.messages) && full.messages.length > 0, `${p.name}: messages required`);
    const text = full.messages.map((m) => m.content?.text ?? "").join("\n");
    assert.ok(text.length > 0, `${p.name}: message text required`);
  }
});

test("refactor: one dispatcher per area and persona family, removed commands gone", () => {
  const names = new Set(listPrompts().map((p) => p.name));
  // ADR 251: the id travels as the first argument, so the families are two
  // prompts, not 30.
  for (const name of AREA_PROMPTS) {
    assert.ok(names.has(name), `${name} must exist`);
  }
  for (const name of names) {
    assert.ok(!name.startsWith("rule-area-"), `${name} must not be a per-area prompt`);
    assert.ok(!name.startsWith("rule-persona-"), `${name} must not be a per-role prompt`);
  }
  for (const removed of [
    "rule-mcp-a11y-audit",
    "rule-mcp-code-review",
    "rule-compression",
    "rule-process-compression",
    "rule-mcp-flight",
    "rule-process-flight",
    "rule-area-process-flight",
    "rule-process-compression",
    "rule-area-process-compression",
    "rule-process-handoff",
    "rule-area-process-handoff",
    "rule-mcp-tdd",
    "rule-mcp-new-feature",
    "rule-mcp-pull-request",
    "rule-mcp-setup-project",
    "rule-mcp-write-tests",
    "rule-mcp-generate-component",
    "rule-mcp-a11y-test",
    "rule-mcp-a11y-review",
    "rule-mcp-adr",
    "rule-process-check",
    "rule-mcp-audit-security",
    "rule-mcp-plan-security",
    "rule-mcp-review-security",
  ]) {
    assert.ok(!names.has(removed), `${removed} must be removed`);
  }
  // rule-check is an agent command (not an MCP prompt) - not in this registry
  assert.ok(!names.has("rule-check"), "rule-check is an agent command, not an MCP prompt");
});

// ── Content rules (commit scope + TDD/a11y baselines) ────────────

test("every prompt exposes one free-form primary, plus the dispatcher id", () => {
  for (const p of prompts) {
    const dispatcher = p.name === "rule-area" || p.name === "rule-persona";
    const expected = dispatcher ? 2 : 1;

    assert.equal(p.arguments.length, expected, `${p.name} must expose ${expected} argument(s)`);

    if (dispatcher) {
      assert.ok(p.arguments[0].required, `${p.name}: the id is required`);
    }
  }
});

test("every prompt supports /<name> help as an instant assistant message", () => {
  for (const p of prompts) {
    const argument = p.arguments[0];
    for (const token of ["help", "--help", "-h"]) {
      const full = getPrompt(p.name, { [argument.name]: token });
      assert.ok(full, `${p.name}: getPrompt with ${token} must return a prompt`);
      assert.equal(full.messages.length, 1, `${p.name}: help must be a single message`);
      assert.equal(full.messages[0].role, "assistant", `${p.name}: ${token} help must be an assistant message (shown instantly, no model call)`);
      const text = full.messages[0].content.text;
      assert.match(text, /^RuleMCP Help: command `\/rule-[^`]+`\n\nUsage: \/rule-/, `${p.name}: ${token} must open with the heading and the usage line`);
      assert.ok(!/Do NOT call/i.test(text), `${p.name}: ${token} help must be pure content, no meta-instruction`);
    }
  }
});

test("every prompt ends with a commit-scope proposal and involves TDD/a11y or asks the user", () => {
  for (const p of prompts) {
    const text = getPrompt(p.name)
      .messages.map((m) => m.content?.text ?? "")
      .join("\n");
    const isCommitWithScope = /commit/i.test(text) && /scope/i.test(text);
    assert.ok(isCommitWithScope, `${p.name}: must propose a commit with scope`);
    const isBaselines = /tdd|a11y|test/i.test(text) || /ask/i.test(text);
    assert.ok(isBaselines, `${p.name}: must involve TDD/a11y baselines or ask the user what to do`);
  }
});

console.log(`\nprompts registry: all checks passed (${prompts.length} prompts)`);
