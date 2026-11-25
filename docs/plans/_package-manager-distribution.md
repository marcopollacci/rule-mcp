# Package-manager distribution

Status: `planned`
Owner: rule-mcp
Created: 2026-11-25
Reference: [`docs/04-install.md`](../04-install.md)

## Context

The project has one install route: clone the repository, or unpack the release tarball. ADR 245 says the release asset is the source tree built with pnpm. Nothing installs it from a package manager, so a user on macOS, Linux or Windows must find the repository first.

The request is to publish through Homebrew and the corresponding channels on Linux and Windows.

## Dependency graph

Depends on: ADR 245 (the release asset is the source tree), ADR 248 (the wizard writes every host up to its ceiling). A formula needs a stable tarball URL and a checksum, and both already exist in `scripts/build/checksums`.

Feeds: `docs/04-install.md`, `docs/08-release.md` and the release workflow. Each channel adds one install paragraph and one publish step.

Shared files: `.github/workflows/release.yml`, `scripts/release/`, `docs/04-install.md`, `docs/08-release.md`, `docs/22-install-targets.md`.

```text
WS1 decide the channels
   |
   v
WS2 macOS formula --> WS3 Linux packages --> WS4 Windows packages
   |                     |                     |
   v                     v                     v
        WS5 one documented route per OS --> WS6 release wiring
```

## WS1 Channels and the one question that gates them

- [ ] WS1-T1 Write the decision as an ADR: which channels are in scope, and which are refused with a reason. A channel that needs a paid account, a hosted service, or a binary this project cannot build stays out.
- [ ] WS1-T2 Name the runtime dependency. Every channel must ship Node 24 or refuse to start, and the refusal must be a sentence a user reads, not a stack trace.

## WS2 macOS

- [ ] WS2-T1 A Homebrew formula in a tap, pinned to the release tarball and its checksum from `scripts/SHA256SUMS`.
- [ ] WS2-T2 The formula depends on node 24 and runs `rule-mcp install` as its caveat step, so a user is not left with a binary and no agent configuration.
- [ ] WS2-T3 A test that the formula's URL and sha256 match the released asset, so a tag that forgets the tap fails here.

## WS3 Linux

- [ ] WS3-T1 Homebrew on Linux, if WS1 keeps it: the same formula, one paragraph.
- [ ] WS3-T2 A tarball install path for a distribution without Homebrew: unpacks to `/opt`, links the shim, and names the config file it wrote.
- [ ] WS3-T3 Document the systemd user unit the daemon mode needs, since `rule-mcp daemon` already writes one.

## WS4 Windows

- [ ] WS4-T1 Winget manifest, refreshed by the release workflow from the same tarball.
- [ ] WS4-T2 Scoop manifest, when the bucket exists: one file, one hash, no service.
- [ ] WS4-T3 Say what a Windows user loses: no guard daemon, no launchd equivalent, and the daemon mode that remains.

## WS5 One route per OS

- [ ] WS5-T1 One table in `docs/04-install.md`: OS, channel, command, what it writes, and how to remove it.
- [ ] WS5-T2 Each channel's removal command, next to the install one.

## WS6 Release wiring

- [ ] WS6-T1 `release.yml` publishes the manifests after the tarball exists, not before.
- [ ] WS6-T2 A release that fails to update a manifest fails the run, so a stale version cannot ship.

## Acceptance

A user on each of the three systems installs with one command from a channel this plan names, and `rule-mcp doctor` answers after it. A channel that cannot meet that is refused in WS1 with the reason recorded.
