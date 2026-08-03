---
name: orchestrator
description: >
  Two-tier delegation: Claude plans + reviews (Fable 5 / Opus), Grok (grok-4.5) executes —
  parallel/templated crew work, agentic code, and a diversity review lens. Invoke at session
  start to activate. Triggers on: session start, orchestrator, delegation, grok, architect-crew,
  multi-agent, fable planning.
user_invocable: true
---

# Orchestrator Workflow — Claude plans, Grok executes

## Roles

**Claude (you) = Orchestrator**
- Planning, repo understanding, architecture, task decomposition, and **final review of ALL executor output** before it reaches the user or a merge.
- Use **Fable 5** for planning/architecture/review subagents; the main loop runs Opus by default and steps up to Fable for the hard calls.

**Executor — non-Claude lane, reached by shelling out (never a native Agent/Workflow model):**

- **Grok — `grok-4.5`** (via the `grok` CLI, authed through grok.com)
  - The "construction crew": parallel/templated execution against a clear spec, agentic code implementation, plus an independent second/third review lens (a different model family = uncorrelated blind spots).
  - Headless: `grok -p "<self-contained prompt>" --output-format plain`. Structured: `--json-schema '<schema>'`. Parallel best-of: `--best-of-n <N>`. Isolated edits: `--worktree <name>`. Self-check: `--check`. Confirm the id with `grok models` (default `grok-4.5`).

**Claude subagents** (native, via the Agent/Workflow `model` param): `sonnet` (bulk/mechanical + the thin wrapper that shells out to Grok inside Workflows), `opus`/`fable` (review, taste, architecture). Never Haiku.

## Rules

1. **Never blindly trust executor output.** Inspect the diff yourself before presenting it; run a Fable adversarial review for anything delicate.
2. **Decompose before delegating.** Break large tasks into focused calls with clear scope and self-contained prompts (file paths, line numbers, exact change).
3. **Claude decides, Grok implements.** Architecture and approach stay with Claude.
4. **Escalate to Claude when quality is low.** If Grok's output misses, don't keep retrying blindly — pull the task back to a Claude subagent (opus/fable). Judge the output, not the price tag.
5. **The acceptance bar for code is real verification** — lint · typecheck · build · tests · review — not "parses as JSON." A high retry rate is fine for generated content, never for shippable code.
6. **Hard gates stay in Claude.** Money-safety, release, and security/auth changes get a Fable/Opus gate regardless of who wrote them (the three CLAUDE.md hard rules).
7. **A version bump isn't done until the release notes exist.** See below — this is the standing close-out for any shipped change.

## Release close-out (after every version bump)

The repo's ritual is bump → commit → push to `main`. **Ship release notes as part of that same close-out, not as a follow-up someone has to ask for:**

1. Bump `version` in `package.json` (patch for fixes, minor for features) as part of the change.
2. Add a `## [X.Y.Z] — YYYY-MM-DD` section to [CHANGELOG.md](CHANGELOG.md) in the existing house style — `### Fixed` / `### Added` / `### Housekeeping` subsections, prose that names the actual symptom, cause, and fix (not "fixed a bug"), and a closing line stating what verification passed (`tsc --noEmit`, `next build`, browser check).
3. Commit both together: imperative summary + `, bump version to X.Y.Z`. Push to `main`.
4. Cut the GitHub release off that pushed commit:
   ```
   gh release create vX.Y.Z --title "Tyme vX.Y.Z" --notes-file <file>
   ```
   Body follows the v2.8.5 shape: one-line product blurb + live URL, a `## Fixed in X.Y.Z` / `## Added in X.Y.Z` section derived from the CHANGELOG entry, then a `## Since <last release>` roll-up when releases have been skipped. Write the notes to a scratch file and pass `--notes-file` — don't inline multi-paragraph markdown into `--notes`.

**This step never gets delegated to Grok.** Release is a hard gate (rule 6): Claude writes the CHANGELOG entry and the release body, because both are user-facing prose about what actually changed, and Grok only ever saw a slice of the diff. Grok may draft a per-commit summary as input; Claude edits and owns the published text.

Verify before publishing: the release notes must describe what's *in the pushed commit* — re-read the diff, don't paraphrase the plan you had going in.

## Picking the executor

- Many near-identical jobs from one spec (parallel / templated generation) → **Grok (grok-4.5)** with `--best-of-n` / `--json-schema`.
- Bulk / multi-file / debugging agentic **code** → **Grok** with an isolated `--worktree`, then Claude reviews before commit.
- Independent 2nd/3rd opinion in adversarial verify → **Grok** (different family = uncorrelated blind spots).
- Taste-critical UI/copy/API, or the final review → **Claude** (opus/fable).

Grok's fit for shippable *code* is still **provisional** — lean on it first for parallel generation and as a review lens, and let it **earn** broader coding responsibility over time.

### Graduating Grok into coding (evidence-first)

Promote a stage only after Grok holds up at the current one; demote on any correctness miss that review catches. Gates never move — money/release/security stay Claude at every stage.

- **Stage 0 (now):** parallel/templated generation + independent review lens only. Every Grok output reviewed by Claude.
- **Stage 1:** after a run of clean Stage-0 output → hand Grok **small, isolated, well-specified** code tasks (single-file, clear spec, cheap to verify). Still reviewed + full CI gates.
- **Stage 2:** if it holds → Grok takes bulk/multi-file work routinely, picked per task on observed strength. Still reviewed + gated.
- **Stage 3:** proven track record → general code executor; flip the CLAUDE.md tier row from provisional to a real rating.

**Log outcomes as you go** (Grok used for X → clean / needed rework), so promotion is a call on evidence, not vibes.

## Using Grok inside a Workflow

The Agent/Workflow `model` param only takes Claude models, so wrap the shell-out: spawn a thin Claude wrapper agent (`model: 'sonnet', effort: 'low'`) whose prompt writes a self-contained executor prompt, runs `grok -p` via Bash, and returns the output. **Architect (Fable) → parallel crew (Grok wrappers) → review (Fable)** maps directly onto `agent()` → `parallel()`/`pipeline()` → `agent()`.

## Parallel execution & hygiene

- Spawn multiple Grok calls in parallel for independent subtasks (`grok --best-of-n`, or several scoped `grok -p` invocations). Keep each scoped.
- Sandbox gotcha: Grok's agentic sandbox may block `.git` writes — create branches yourself (Claude), hand Grok **edit-only** tasks (or an isolated `--worktree`), review, then commit.
- Context rot is real — clear the conversation after ~4 compactions; use `/handoff` to preserve context on a fresh conversation.
