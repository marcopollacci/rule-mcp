# 250: Ship the help guard only to hosts that cannot answer help themselves

- **Date**: 2026-11-24
- **Status**: accepted
- **Tags**: cli, agent-commands, surface
- **Author**: Emiliano Pisu <pisuemiliano.1980@gmail.com>

## Context

The rendered command body opened with a guard that named the help tokens and embedded the usage block. A host without an input hook needs it, because the model is the only thing that can print the block. Pi and opencode do not: Pi stops `/<command> help` in its input hook and opencode answers `/rule-help`. On those two hosts the guard was text the user read in the transcript next to the expanded command, and the model never used it. The block also cost context on every invocation, help or not.

## Decision

The guard travels with a per-target flag. Command targets declare `helpGuard`: `block` for a host that relies on the model, `none` for a host that answers help before a model turn. Pi and opencode declare `none`. Renderer, sync and the uninstall scan read the flag, so the rendering and the written file cannot disagree. A host with `none` writes the task as the first line of the body.

## Consequences

Positive: the transcript shows only the task on Pi and opencode, and every non-help invocation carries no usage block. Negative: if the Pi extension is not loaded (a session that predates the install), `/rule-<command> help` reaches the model as an ordinary argument again. The other eight hosts keep the exact block, unchanged.

## What would end this

A host exposes a way to render help outside the model turn without an installed artifact, so the guard is never needed.

## Alternatives Considered

1. Keep the block everywhere and accept the noise. The user reads the guard on every command, and the cost repeats on every turn.
1. Write a one-line guard on every host. That hides the block but still leaks a line into the transcript, and the model has to derive the usage from the description.
