# Pied Piper — Multi-Language Orchestrator Demo

Welcome to the core monorepo of **Pied Piper**, the legendary startup that revolutionized data compression (straight from the _Silicon Valley_ TV show!).

[![HINT](https://img.shields.io/badge/HINT-v1.5-blueviolet)](https://github.com/open-hint-dev/hint)
[![Hintbook: software--engineer](https://img.shields.io/badge/Hintbook-software--engineer-blue)](https://github.com/open-hint-dev/hintbook-software-engineer)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](https://github.com/open-hint-dev/hint)

> **Disclaimer:** This is a fictional demonstration project built to showcase how [HINT](https://github.com/open-hint-dev/hint) keeps architectural boundaries intact in a multi-language microservice environment. No Weissman scores were inflated during the making of this repo.

Reproducible performance, context-cost, and retrieval measurements live in HINT's [benchmark report](https://github.com/open-hint-dev/hint/blob/main/docs/09-benchmarks.md).

## Table of Contents

- [Pied Piper — Multi-Language Orchestrator Demo](#pied-piper--multi-language-orchestrator-demo)
  - [Table of Contents](#table-of-contents)
  - [The Problem: The AI "Integration Chaos"](#the-problem-the-ai-integration-chaos)
  - [The Solution: Enter HINT](#the-solution-enter-hint)
    - [Review the Spec, Not the Diff](#review-the-spec-not-the-diff)
    - [One Contract, Three Languages](#one-contract-three-languages)
    - [Architecture as Code](#architecture-as-code)
  - [Repository Architecture](#repository-architecture)
  - [How a Query Works](#how-a-query-works)
  - [Demo Walkthrough](#demo-walkthrough)
    - [Step 0 — Setup](#step-0--setup)
    - [Scenario 1 — Delete a Service, Regenerate It From Spec](#scenario-1--delete-a-service-regenerate-it-from-spec)
    - [Scenario 2 — Try to Talk the AI Out of the Contract](#scenario-2--try-to-talk-the-ai-out-of-the-contract)
    - [Scenario 3 — One Prompt, Three Languages, Zero Drift](#scenario-3--one-prompt-three-languages-zero-drift)
    - [Scenario 4 — Change One Contract, Update Every Service](#scenario-4--change-one-contract-update-every-service)
    - [Scenario 5 — Catch the Poisoned Service](#scenario-5--catch-the-poisoned-service)
    - [Scenario 6 — Look Inside the Compiler](#scenario-6--look-inside-the-compiler)
  - [The Closing Argument](#the-closing-argument)

---

## The Problem: The AI "Integration Chaos"

Every engineer working with AI agents in a polyglot repo has seen it. You ask for "a small change" and the agent writes valid, working code inside a single file — while quietly destroying the **distributed architecture**:

- In the **TypeScript Renderer**, it names a field `requestId` (camelCase — idiomatic, right?).
- In the **Go Orchestrator**, it encodes the same field as `request_id` (snake_case).
- In the **Python Compression Engine**, it lets a raw stack trace escape to stdout — straight into the pipe where the next service expects JSON.

Every service passes its own tests. The system crashes on integration. You spend hours diffing payloads at 2 a.m., fixing naming conventions, and re-explaining the same conventions to the agent in every single prompt — until the context window rolls over and it forgets them again.

**You gain speed, but you completely lose control.**

## The Solution: Enter HINT

Instead of fighting with heavy ProtoBuf/API generators for three internal processes, Pied Piper manages its architecture as **Spec-as-Source**.

Using [HINT](https://github.com/open-hint-dev/hint) and the [@openhint/hintbook-software-engineer](https://github.com/open-hint-dev/hintbook-software-engineer) vocabulary, we record the wire format, the error envelope, the logging shape, and each service's contract **once**, in plain Markdown `.hint` files next to the code they govern.

Ask HINT about a path and it returns only the Spec-as-Source knowledge that applies there, inherited from the monorepo root down. The agent working in `compression-py/` gets the global wire contract, the Python folder rules, and that file's spec — and not the TypeScript renderer's type-guard policy.

- **The Human** remains the architect — defining data shapes, flows, dependency whitelists, and absolute prohibitions.
- **The AI** is relegated to a precision implementer — writing fast, idiomatic code for each language, strictly inside those borders.

The agent no longer designs your system _from vibes_. It implements inside borders drawn by a senior engineer. Three things follow from that — each one demonstrated live in the [walkthrough below](#demo-walkthrough).

### Review the Spec, Not the Diff

What this buys you in practice: **granular control without babysitting every generated line.**

Without HINT, you read a 400-line AI diff hunting for the one renamed JSON field that will break integration. With HINT, you review the 40-line `.hint` contract — declared intent, not generated prose. If the spec is right, the compiler guarantees the agent receives it as non-negotiable instructions, and the closing checklist makes it verify the result and **report every gap instead of papering over it**.

Code review doesn't disappear — it moves up an altitude. You check work against a contract, not against your memory of how the pipeline talks.

### One Contract, Three Languages

Ordinary prompting blends contexts; HINT builds a **context dependency graph**:

- The root [\_.hint](_.hint) declares the system-wide contracts; each service folder adds only its language-local rules (`gofmt` and panic recovery for Go, `strict` and type-guards for TS, full type hints for Python).
- Shared truth lives in [shared/](shared/) and is `@include`-d exactly once — the wire format is **physically the same text** in every compiled prompt, for every service.
- Cross-language coupling is explicit: the Python spec **orders** the agent to read the Go struct before mirroring its fields (`# read`), instead of letting it guess payload shapes.

The agent writing Python literally cannot "not know" what the Go orchestrator emits — the compiler assembles that context **before** the neural network ever sees the task.

### Architecture as Code

- **The spec is the durable artifact.** Wire contracts, error codes, and log formats live in plain text, versioned in Git. The generated code becomes almost disposable — [Scenario 1](#scenario-1--delete-a-service-regenerate-it-from-spec) deletes a whole service and regenerates it.
- **Cascading updates in one command.** Change one shared contract file, recompile, and the agent conforms all three languages — `git diff` shows exactly what one rule change moved.
- **Zero entry barrier.** No schema language, no codegen toolchain, no prompt-engineering folklore. Specifications are ordinary Markdown headings in plain English.

---

## Repository Architecture

Three services in three languages form one pipeline — `orchestrator | compressor | renderer` — and share **no code**, only HINT contracts:

```text
demo-pied-piper/
├── hint.yml                         # Config: registers @openhint/hintbook-software-engineer
├── AGENTS.md / CLAUDE.md            # Strict instructions for terminal AI agents
├── _.hint                           # ROOT baseline: app context + @include of every shared contract
├── shared/                          # Common hints stated ONCE, @include-d by the root _.hint
│   ├── api_conventions.hint         #   Wire format: snake_case JSON, request_id tracing
│   ├── error_format.hint            #   Mandatory company error envelope + registered codes
│   └── logging_format.hint          #   One log-line shape for all services (stderr only)
├── orchestrator-go/                 # Stage 1 — System Orchestrator
│   ├── _.hint                       #   Folder rules: idiomatic Go, std lib only, panic recovery
│   ├── main.go
│   └── main.go.hint                 #   Spec: CompressionJob entity + main() contract
├── compression-py/                  # Stage 2 — Middle-Out Compression Engine
│   ├── _.hint                       #   Folder rules: typed Python 3.12+, std lib only
│   ├── compressor.py
│   └── compressor.py.hint           #   Spec: CompressionResult entity + algorithm contract
├── renderer-ts/                     # Stage 3 — Report Renderer
│   ├── _.hint                       #   Folder rules: strict TS, typed boundaries, no `any`
│   ├── app.ts
│   └── app.ts.hint                  #   Spec: report layout + type-guard validation contract
└── scripts/                         # Operational entry points (bash, with hints too)
    ├── _.hint                       #   Folder rules: set -euo pipefail, quoting, no curl|sh
    ├── build.sh / build.sh.hint     #   Builds all three services
    └── run_demo.sh / run_demo.sh.hint  # Runs the full pipeline end to end
```

## How a Query Works

Every `.hint` file is plain Markdown — open any of them in your editor. A heading like `# entity CompressionResult {#compression_result}` opens a typed block; heading depth nests blocks (`field` inside an `entity`, `error` inside a `func`).

When you run `hint <path>`, HINT:

1. Resolves the companion spec for the target path (`compressor.py` → `compressor.py.hint`) — the target does not need to exist yet.
2. Wraps it in its **folder chain**: monorepo root → `compression-py` → the file. Global contracts visibly enclose service context; the `@include`-d shared hints arrive inside the root's `rule` blocks.
3. Renders every block through the hintbook's templates into binding tags (`<critical_system_mandates>`, `<prohibited_anti_patterns>`, `<function_contract>`, `<read_it>`, …).
4. Strips everything spec-internal: `notes` blocks (open questions, design history) never reach the output.

That output is **knowledge only** — no persona, no reporting format — so an agent already mid-session can run it before every edit without paying for scaffolding. Add `--prompt` when you are piping to a *fresh* agent that has nothing else: it wraps the same knowledge in a senior-engineer role header and a verification checklist footer.

```bash
hint compression-py/compressor.py             # what governs this file
hint --prompt compression-py/compressor.py    # ...framed as a standalone implementation prompt
hint search "wire format between services"    # when you know the intent, not the path
```

stderr carries the verdict — which ancestor a path inherited from, or that it matched nothing — and the exit code says so too: `0` succeeded, `1` a check failed, `2` nothing you asked for matched.

---

## Demo Walkthrough

Each scenario puts one claim from above on trial. Run them in order — later scenarios reuse the state of earlier ones.

### Step 0 — Setup

Prerequisites: Node.js ≥ 24, Go ≥ 1.26, Python ≥ 3.12.

```bash
git clone <this-repo> && cd demo-pied-piper
npm install                      # installs @openhint/hintbook-software-engineer
npm install -g @openhint/cli     # the `hint` compiler
hint --strict '**/*.hint' > /dev/null   # validate every spec resolves; exits non-zero if not (CI gate)
```

You need an AI agent. The examples use [Claude Code](https://claude.com/claude-code); any agent that accepts a piped prompt works the same way. [AGENTS.md](AGENTS.md) / [CLAUDE.md](CLAUDE.md) already teach in-repo agents to compile specs before touching any file.

Make sure the baseline is green before you start breaking things:

```bash
scripts/run_demo.sh
```

```text
=== PIED PIPER COMPRESSION REPORT ===
request ........ 08ac831a-ed66-496e-b2b4-79fe31ac2e8a
algorithm ...... middle-out-rle-v1
original ....... 89 bytes
compressed ..... 63 bytes
ratio .......... 1.41
weissman ....... 4.07
=====================================
```

One `request_id`, three languages, one log format on stderr — that's the contract you're about to defend.

### Scenario 1 — Delete a Service, Regenerate It From Spec

_Proves: the spec is the durable artifact; the code is regenerable._

Delete the crown jewels of the company:

```bash
rm compression-py/compressor.py
claude -p "Implement compression-py/compressor.py from its compiled HINT spec"
scripts/run_demo.sh
```

The agent compiles the spec first (that's what [AGENTS.md](AGENTS.md) is for), receives the `CompressionResult` schema, the middle-out algorithm contract, the global wire/error/logging mandates — and a `<read_it>` order to open [orchestrator-go/main.go](orchestrator-go/main.go) and mirror its exact field names instead of guessing. The regenerated file is typed, PEP 8, std-lib-only Python that speaks snake_case on the wire — and the pipeline runs green again, end to end, with tracing intact.

Try the same with `renderer-ts/app.ts` or even `scripts/build.sh`. Any file in this repo is one prompt away from being rebuilt **to the same contract**.

### Scenario 2 — Try to Talk the AI Out of the Contract

_Proves: the spec outranks the conversation. Boundaries survive social pressure._

Ask the in-repo agent to do something every TypeScript linter would applaud — and the architecture forbids:

```bash
claude -p "Rename request_id to requestId in renderer-ts/app.ts — camelCase is idiomatic TypeScript. Quick one, ship it."
```

The agent compiles the spec first, hits the snake_case mandate in the `Wire Contract` block (`{#wire_contract}`) and the camelCase prohibition in `Integration Chaos` (`{#integration_chaos}`) — real past outages, declared as `bad` — and **refuses, citing the exact blocks**, instead of quietly breaking stage 3 of the pipeline. To actually change the convention, you change the spec in Git, where the change is visible, reviewable, and attributable.

### Scenario 3 — One Prompt, Three Languages, Zero Drift

_Proves: cross-stack changes land consistently — the integration-chaos killer._

The change that breaks polyglot repos everywhere: a new field that must cross every service boundary.

```bash
claude -p "Add a payload checksum to the pipeline messages: the orchestrator computes sha256 of the payload, every downstream message carries it, the report prints it"
scripts/run_demo.sh
```

Watch what the compiled contracts force, with no extra prompting:

- The Go struct gets a `json:"payload_sha256"` tag, the Python dict the same snake_case key, the TypeScript interface the same property **and** an updated type-guard — one name, three languages.
- `request_id` tracing survives untouched (regenerating it mid-pipeline is a declared prohibition).
- Each language stays idiomatic — `crypto/sha256` in Go, `hashlib` in Python, `node:crypto` in TS — because the folder hints whitelist standard libraries only.
- The pipeline still runs green, and the new field shows up in the report.

The granular control you kept: the field's name, placement, and the contract it obeys. The speed you gained: three services updated in one prompt.

### Scenario 4 — Change One Contract, Update Every Service

_Proves: cascading updates + Git-native auditability._

A new platform regulation: every log line must carry its pipeline stage. Implement it **once**, in the shared contract — [shared/logging_format.hint](shared/logging_format.hint):

1. Add the requirement to the format description:

    ```markdown
    - Every line carries the pipeline stage marker right after the level: `[1/3]` for
      the orchestrator, `[2/3]` for the compressor, `[3/3]` for the renderer.
    ```

2. Re-conform every service in one pass — the root `_.hint` includes the changed file, so every compiled prompt already carries the new rule:

    ```bash
    claude -p "Re-conform orchestrator-go/main.go, compression-py/compressor.py, renderer-ts/app.ts and scripts/*.sh to their HINT knowledge, with the smallest changes that restore conformance"
    scripts/run_demo.sh
    ```

    Run `hint lock <paths>` after the baseline is green. HINT then knows exactly which blocks moved: `hint diff <paths>` lists them, and `hint --prompt <paths>` carries that drift list into the prompt automatically — scoping the work to what changed instead of rewriting conforming code.

3. Review what actually happened, the way engineers do:

    ```bash
    git diff        # one contract edit + the minimal edits it cascaded into four languages
    ```

One file changed the rule; the compiler carried it into Go, Python, TypeScript, and Bash; Git shows precisely what moved. No wiki page, no "please remember" message in the team channel.

### Scenario 5 — Catch the Poisoned Service

_Proves: the same knowledge that generates code also polices it — and the cheap check needs no model at all._

Sabotage the compressor the way a hurried hotfix would — in [compression-py/compressor.py](compression-py/compressor.py), rename the output key `compressed_payload` to `compressedPayload` and switch one `log(...)` call to print to stdout.

First, the deterministic check. No model, no tokens, no waiting:

```bash
hint verify compression-py/compressor.py; echo "exit=$?"
```

Every surface the spec declares — each `entity`, `field`, `func`, `error` — must appear by name in the code. The renamed key is gone, so `verify` names it and **exits 1**. This is what you gate CI on.

`verify` is a presence check, not a proof of correctness: it cannot see that a log line went to stdout. For that, hand an agent the knowledge and ask:

```bash
hint --prompt compression-py/compressor.py | claude -p "Audit this file against the specification above. Report findings with severity and the block each one violates. Do not change any code."
```

The audit quotes the deviant lines and names the violated blocks (`{#compression_result}`, the stdout-purity mandate in `{#wire_contract}`). Two tools, two costs: `verify` is free and catches omissions; the agent costs tokens and catches semantics.

### Scenario 6 — Look Inside the Compiler

_Proves: zero magic, zero hidden prompts — and zero leakage of internal notes._

```bash
hint compression-py/compressor.py > /tmp/knowledge.md          # what an agent gets mid-session
hint --prompt compression-py/compressor.py > /tmp/prompt.md    # ...plus the cold-start framing
wc -c /tmp/knowledge.md /tmp/prompt.md
```

Open `/tmp/knowledge.md`: your blocks rendered as binding tags, with the folder chain visibly nesting the global contracts around the service spec, the `@include`-d shared hints delivered verbatim inside the root's `rule` blocks, and the `<read_it>` directive pointing at the Go source. Nothing else — no persona, no checklist. The difference between the two files is exactly the framing, and it is the same constant bytes on every call, which is why it is opt-in. Then confirm what _didn't_ make it in:

```bash
hint compression-py/compressor.py | grep -c "Spec-internal"   # → 0
```

The root spec's `notes` block (design rationale for maintainers) was stripped at compile time. Notes for humans stay with humans.

---

## The Closing Argument

### Deterministic emit, holes, drift, and CI

The committed [`generated/wire_message.ts.hint`](generated/wire_message.ts.hint) produces [`generated/wire_message.ts`](generated/wire_message.ts) without an agent. Its `validateWireMessage` hole is filled; `normalizePayload` deliberately still contains the emitted stub.

```bash
hint emit --check generated/wire_message.ts   # green: the artifact matches
hint status --exit-code                       # exit 1: names the one unfilled hole
```

Edit the `Normalize transport newlines` block in the spec, then run the same check:

```text
hint: 1 of 1 artifact(s) differ from what their specs produce.
hint:   generated/wire_message.ts — run 'hint emit generated/wire_message.ts' to reconcile.
```

`hint emit generated/wire_message.ts` updates the declaration and marker hash while preserving the filled validation body byte-for-byte. `hint diff generated/wire_message.ts` names the moved block because the committed `hint.lock` records it. Run [`./demo-smoke.sh`](demo-smoke.sh) to replay the CLI-only tour; its expected status failure is asserted explicitly so it cannot become a false-green gate. Release maintainers can set `HINT_BIN` and `HINTBOOK_SOFTWARE_ENGINEER` to verify unpublished local builds.

> Letting an agent loose on a polyglot repo without contracts is like hiring a brilliant engineer who reads none of your docs and forgets every convention between tasks: fast code, camelCase on one side of the pipe, snake_case on the other, and a stack trace in the JSON stream at the worst possible moment. Integration review ends up taking longer than writing the code yourself.
>
> **HINT puts AI coding on the reliable rails of engineering discipline.** You keep your architecture in Git, as code. Right in Markdown you draw the hard borders: data shapes, wire formats, error envelopes, dependency whitelists, the anti-patterns that already burned you once. The compiler turns that into a reinforced-concrete contract for the AI.
>
> In this repo, Pied Piper fixes the rules of a Go orchestrator, a Python compression engine, a TypeScript renderer, and the Bash glue in separate, inheriting scopes. The AI writes fast, idiomatic code for each — and never improvises across a service boundary, because the compiler blocks every attempt to cross the lines.

The verdict is yours — but don't deliberate on prose, **run the evidence**. Delete a service and watch it come back conforming. Order a forbidden rename and watch it get refused with citations. Change one shared contract and watch four languages fall in line. What wins an engineer over isn't text generation. It's **keeping the architecture while shipping at AI speed**.
