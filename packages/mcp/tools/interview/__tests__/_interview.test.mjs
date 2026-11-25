/**
 * The interview: answers become one document, and a gap stays a gap.
 *
 * An interview that invents an answer is worse than one that stops, so the
 * incomplete case is the one the tests lean on.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import { KINDS, interview } from "../_interview.js";

const QUESTIONS = [
  { id: "problem", prompt: "What problem does this solve?", required: true },
  { id: "owner", prompt: "Who owns it?", required: false },
  { id: "db", prompt: "Which database?", options: ["postgres", "sqlite"] },
];

test("a complete interview renders one document of the kind asked", () => {
  const result = interview({
    kind: "adr",
    topic: "Use PostgreSQL",
    questions: QUESTIONS,
    answers: { problem: "We need joins", owner: "the platform team", db: "postgres" },
  });

  assert.equal(result.status, "ok");
  assert.deepEqual(result.open, []);
  assert.match(result.text, /^# Use PostgreSQL$/mu);
  assert.match(result.text, /## What problem does this solve\?\n\nWe need joins/u);
  assert.match(result.text, /Every question is answered/u);
});

test("an unanswered question is marked, and the document says it is incomplete", () => {
  const result = interview({ kind: "plan", topic: "x", questions: QUESTIONS, answers: { owner: "me" } });

  assert.equal(result.status, "incomplete");
  assert.deepEqual(result.open, ["problem", "db"]);
  assert.match(result.text, /_Unanswered\._/u);
  assert.match(result.text, /2 question\(s\) unanswered, 1 of them required/u);
  assert.match(result.text, /This document is incomplete\./u);
});

test("an option list is shown only where an answer is missing", () => {
  const result = interview({ questions: QUESTIONS, answers: { db: "postgres" } });

  const answered = result.text.split("## Which database?", 2)[1]?.split("---", 1)[0] ?? "";

  assert.doesNotMatch(answered, /Options offered/u, "an answered question does not list them");

  const openOne = interview({ questions: QUESTIONS, answers: {} });

  assert.match(openOne.text, /Options offered: `postgres`, `sqlite`/u, "the open question lists its options");
});

test("an answer nobody asked for is ignored and named", () => {
  const result = interview({ questions: QUESTIONS, answers: { problem: "a", ghost: "b" } });

  assert.deepEqual(result.ignored, ["ghost"]);
  assert.match(result.text, /ignored: `ghost`/u);
});

test("no questions and an unknown kind are refused", () => {
  assert.equal(interview({ questions: [] }).status, "refused");
  assert.equal(interview({ kind: "poem", questions: QUESTIONS }).status, "refused");
  assert.deepEqual(KINDS, ["adr", "plan", "requirements"]);
});
