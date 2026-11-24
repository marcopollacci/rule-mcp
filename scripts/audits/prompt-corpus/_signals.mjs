/**
 * @module scripts/audits/prompt-corpus/signals
 *
 * What a prompt asks for, expressed as the patterns one can count.
 *
 * Two layers, because they answer different questions. Families are broad
 * topics (docs, tests, UI). Signals are the request shapes the plan acts on:
 * "advance the plan", "something is broken", "resume". A signal is narrower on
 * purpose, so a count is evidence rather than a word that happened to appear.
 */

/** A slash command's expansion, not a human request. */
export const TEMPLATE =
  /Call `(?:rule|pix)_tool|Depth intent|Check intent|Process this request through|Verify the last handoff|Generate a session handoff|Interview mode:|You are a handoff specialist|Base directory for this skill|If the text typed after this command|If the arguments are only/i;

/** Broad topics, for orientation only. */
export const FAMILIES = [
  ["fix a failing test or CI", /\b(test|tests? (fail|failing)|ci\b|pipeline|flaky|build fail)/i],
  ["commit or release", /\b(commit|conventional|release|tag|version|bump|changelog|push|merge|rebase|squash)\b/i],
  ["review or audit", /\b(review|audit|analisi|analizza|verifica|controlla|ispeziona|rivedi)\b/i],
  ["explain or understand", /\b(spiega|spiegami|come funziona|why|perch[eé]|explain|capire|understand)\b/i],
  ["refactor or restructure", /\b(refactor|ristruttura|split|spezza|estrai|extract|rename|rinomina|semplific)\b/i],
  ["write docs or prose", /\b(docs?|documentazione|readme|adr|ste100|prose|changelog)\b/i],
  ["style or UI", /\b(css|ui|ux|hover|color|spacing|layout|font|design|responsive|a11y)\b/i],
  ["set up tooling or config", /\b(config|setup|installa|install|scaffold|eslint|prettier|vite|pnpm|docker|hook)\b/i],
  ["find or search code", /\b(trova|find|search|cerca|where is|grep)\b/i],
  ["plan or roadmap", /\b(plan|piano|roadmap|milestone|fase|phase)\b/i],
  ["clean up or sweep", /\b(clean|pulisci|sweep|rimuovi|remove|delete|cancella|obsolete)\b/i],
  ["security or secrets", /\b(secret|credential|token|sicurezza|security|vulnerab)\b/i],
];

/**
 * The request shapes a missing capability would answer.
 *
 * Each one is a phrase a person writes when nothing in the surface does the
 * job. A count here is the argument for building the tool.
 */
export const SIGNALS = [
  ["advance the plan (vai / procedi / continua + fase|step)", /^(?:vai|procedi|andiamo|continua)\b|\b(?:vai con|procedi con|andiamo avanti|proceed with|go with|continue with)\b/i],
  ["name a plan id (fase N | Phase N | M6 | S3 | OSS-001 | WS2-T3)", /\b(?:fase|phase|step|passo)\s*\d|\b[A-Z]{2,6}-\d|\bM\d\b|\bS\d\b/i],
  ["resume or recall earlier work", /\b(?:recuper\w* il lavoro|riprendi|da dove eri|dove eravamo|resume|riparti da)\b/i],
  ["start or stop a dev server or app", /\b(?:stoppa|avvia|riavvia|kill)\b[^.]{0,24}\b(?:server|app|applicazione|electron|dev server|watch)\b|\blsof\b|\bporta \d{4}/i],
  ["commit atomically and push", /\b(?:commit atomici|atomic commit|pusha|fai push|push tutto|committa tutto|commit e push)\b/i],
  ["project state recap", /\b(?:recap|stato del progetto|project state|piani appesi|piani aperti|analizza la repo)\b/i],
  ["interview me", /\b(?:interview|intervistami|fammi domande|questionario)\b/i],
  ["clean up stale docs or plans", /\b(?:sweep|pulisci|elimina i piani|documenti obsoleti|stale)\b/i],
  ["distrust a claim and re-verify", /\b(?:sei sicuro|non (?:e|è) vero|ricontrolla|verifica (?:davvero|che)|non mi convince|double.?check|are you sure|re-?verify)\b/i],
  ["something is broken", /\b(?:non funziona|non va|rotto|broken|errore|error|crash|si blocca|fallisce|fails)\b/i],
];

/** The words only one of the two languages uses, for a share that means something. */
const ITALIAN =
  /\b(che|non|per|con|una|uno|gli|della|questo|questa|sono|deve|devi|fai|fammi|vorrei|adesso|anche|senza|sulla|dopo|prima|perché|perche|cioè|allora|quindi|molto|troppo)\b/i;

/** Whether a prompt reads as Italian. */
export const isItalian = (text) => ITALIAN.test(text);

/** A prompt reduced to the words that carry content. */
export function contentWords(text) {
  return text
    .toLowerCase()
    .replaceAll(/`[^`]*`/g, " ")
    .replaceAll(/[^a-zàèéìòù\s]/gi, " ")
    .replaceAll(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter((word) => word.length > 3);
}
