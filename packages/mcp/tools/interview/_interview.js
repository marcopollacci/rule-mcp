/**
 * @module tools/interview/interview
 *
 * A schema of questions in, one document out.
 *
 * The corpus shows the pattern 99 times over three hosts: the user asks to be
 * interviewed, then the answers become an ADR, a plan or a requirements list.
 * Each project re-implemented it as prose in a prompt.
 *
 * An unanswered question is never filled in. It appears as unanswered, and the
 * document says it is incomplete, because an interview that invents an answer
 * is worse than one that stops.
 */

/** The document kinds a set of answers can become. */
export const KINDS = ["adr", "plan", "requirements"];

/** A document title per kind, so the shape is predictable. */
const TITLES = {
  adr: (topic) => `# ${topic}`,
  plan: (topic) => `# Plan: ${topic}`,
  requirements: (topic) => `# Requirements: ${topic}`,
};

/** One answered or open question, as Markdown. */
function section(question, answers) {
  const answer = String(answers[question.id] ?? "").trim();
  const options = Array.isArray(question.options) && question.options.length > 0 ? `\n\nOptions offered: ${question.options.map((option) => `\`${option}\``).join(", ")}.` : "";

  return [`## ${question.prompt}`, "", answer === "" ? "_Unanswered._" : answer, ...(answer === "" && options ? [options] : [])].join("\n");
}

/**
 * Render one interview as a document.
 *
 * @param {{ kind?: string, topic?: string, questions?: Array<{ id: string, prompt: string, required?: boolean, options?: string[] }>, answers?: Record<string, string> }} [input]
 * @returns {{ status: "ok"|"incomplete"|"refused", text: string, open: string[], ignored: string[] }}
 */
export function interview({ kind = "requirements", topic = "", questions = [], answers = {} } = {}) {
  const asked = Array.isArray(questions) ? questions.filter((question) => question && question.id && question.prompt) : [];
  const shape = String(kind).toLowerCase();

  if (asked.length === 0) {
    return { status: "refused", text: "Ask at least one question with an id and a prompt.", open: [], ignored: [] };
  }

  if (!KINDS.includes(shape)) {
    return { status: "refused", text: `Unknown kind "${kind}". Use ${KINDS.join(", ")}.`, open: [], ignored: [] };
  }

  const known = new Set(asked.map((question) => question.id));
  const ignored = Object.keys(answers).filter((id) => !known.has(id));
  const open = asked.filter((question) => String(answers?.[question.id] ?? "").trim() === "").map((question) => question.id);
  const blocking = asked.filter((question) => question.required === true && open.includes(question.id));
  const title = TITLES[shape](topic === "" ? "Untitled" : topic);

  const text = [
    title,
    "",
    ...asked.flatMap((question) => [section(question, answers), ""]),
    "---",
    "",
    open.length === 0
      ? "Every question is answered."
      : `${open.length} question(s) unanswered${blocking.length > 0 ? `, ${blocking.length} of them required` : ""}: ${open.map((id) => `\`${id}\``).join(", ")}. This document is incomplete.`,
    ...(ignored.length > 0 ? [`Answers for unknown question(s) were ignored: ${ignored.map((id) => `\`${id}\``).join(", ")}.`] : []),
  ].join("\n");

  return { status: open.length === 0 ? "ok" : "incomplete", text, open, ignored };
}
