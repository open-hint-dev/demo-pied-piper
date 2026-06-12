# Pied Piper — Multi-Language Orchestrator Demo

Welcome to the core monorepo of **Pied Piper**, the legendary startup that revolutionized data compression (straight from the _Silicon Valley_ TV show!).

[![Compiler: HINT](https://img.shields.io/badge/Compiler-HINT%20v1.0.0-blueviolet)](https://github.com/open-hint-dev/hint)
[![Hintbook: software--engineer](https://img.shields.io/badge/Hintbook-software--engineer-blue)](https://github.com/open-hint-dev/hintbook-software-engineer)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](https://github.com/open-hint-dev/hint)

> **Disclaimer:** This is a fictional demonstration project built to showcase how [HINT (Human Intent Native Transpiler)](https://github.com/open-hint-dev/hint) enforces strict architectural boundaries in a multi-language microservice environment. No Weissman scores were inflated during the making of this repo.

## Table of Contents

- [Pied Piper — Multi-Language Orchestrator Demo](#pied-piper--multi-language-orchestrator-demo)
  - [Table of Contents](#table-of-contents)
  - [The Problem: The AI "Integration Chaos"](#the-problem-the-ai-integration-chaos)
  - [The Solution: Enter HINT](#the-solution-enter-hint)
    - [Review the Spec, Not the Diff](#review-the-spec-not-the-diff)
    - [One Contract, Three Languages](#one-contract-three-languages)
    - [Architecture as Code](#architecture-as-code)
  - [Repository Architecture](#repository-architecture)
  - [How a Compilation Works](#how-a-compilation-works)
  - [Demo Walkthrough](#demo-walkthrough)
    - [Step 0 — Setup](#step-0--setup)
    - [Scenario 1 — Delete a Service, Regenerate It From Spec](#scenario-1--delete-a-service-regenerate-it-from-spec)
    - [Scenario 2 — Try to Talk the AI Out of the Contract](#scenario-2--try-to-talk-the-ai-out-of-the-contract)
    - [Scenario 3 — One Prompt, Three Languages, Zero Drift](#scenario-3--one-prompt-three-languages-zero-drift)
    - [Scenario 4 — Change One Contract, Update Every Service](#scenario-4--change-one-contract-update-every-service)
    - [Scenario 5 — Audit Mode: Catch the Poisoned Service](#scenario-5--audit-mode-catch-the-poisoned-service)
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

Instead of fighting with heavy ProtoBuf/API generators for three internal processes, Pied Piper manages its architecture the way it manages code — _Intent-as-Code_.

Using [HINT](https://github.com/open-hint-dev/hint) and the [@openhint/hintbook-software-engineer](https://github.com/open-hint-dev/hintbook-software-engineer) vocabulary, we declare the wire format, the error envelope, the logging shape, and each service's contract **once**, in plain Markdown `.hint` files. The HINT transpiler compiles them into a rigid, binding execution contract for the AI agent.

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

## How a Compilation Works

Every `.hint` file is plain Markdown — open any of them in your editor. A heading like `# entity CompressionResult {#compression_result}` opens a typed block; heading depth nests blocks (`field` inside an `entity`, `error` inside a `func`).

When you run `hint <path>`, the compiler:

1. Resolves the companion spec for the target path (`compressor.py` → `compressor.py.hint`) — the target does not need to exist yet.
2. Wraps it in its **folder chain**: monorepo root → `compression-py` → the file. Global contracts visibly enclose service context; the `@include`-d shared hints arrive inside the root's `rule` blocks.
3. Renders every block through the hintbook's templates into binding tags (`<critical_system_mandates>`, `<prohibited_anti_patterns>`, `<function_contract>`, `<read_it>`, …), prefixed by a senior-engineer role header and closed by a verification checklist footer.
4. Strips everything spec-internal: `notes` blocks (open questions, design history) never reach the prompt.

Three modes, one set of specs: `hint` **implements**, `hint --mode fix` **repairs** code that violates the spec, `hint --mode review` **audits** and reports findings with severity — no edits.

---

## Demo Walkthrough

Each scenario puts one claim from above on trial. Run them in order — later scenarios reuse the state of earlier ones.

### Step 0 — Setup

Prerequisites: Node.js ≥ 24, Go ≥ 1.26, Python ≥ 3.12.

```bash
git clone <this-repo> && cd demo-pied-piper
npm install                      # installs @openhint/hintbook-software-engineer
npm install -g @openhint/cli     # the `hint` compiler
hint --dry-run '**/*.hint'       # validate every spec resolves (CI-friendly)
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
    claude -p "Run hint --mode fix for orchestrator-go/main.go, compression-py/compressor.py, renderer-ts/app.ts and scripts/*.sh, and apply the smallest conforming changes"
    scripts/run_demo.sh
    ```

3. Review what actually happened, the way engineers do:

    ```bash
    git diff        # one contract edit + the minimal edits it cascaded into four languages
    ```

One file changed the rule; the compiler carried it into Go, Python, TypeScript, and Bash; Git shows precisely what moved. No wiki page, no "please remember" message in the team channel.

### Scenario 5 — Audit Mode: Catch the Poisoned Service

_Proves: the same specs that generate code also police it._

Sabotage the compressor the way a hurried hotfix would — in [compression-py/compressor.py](compression-py/compressor.py), rename the output key `compressed_payload` to `compressedPayload` and switch one `log(...)` call to print to stdout. Then audit:

```bash
hint --mode review compression-py/compressor.py | claude -p
```

The report walks the specification block by block, quotes the deviant lines, names the violated blocks (`{#compression_result}`, the stdout-purity mandate in `{#wire_contract}`), assigns severity, proposes the minimal fix — and closes with an explicit **does-not-conform** verdict. Findings, never silent fixes — and `--mode fix` applies the smallest conforming repair when you want it done.

### Scenario 6 — Look Inside the Compiler

_Proves: zero magic, zero hidden prompts — and zero leakage of internal notes._

```bash
hint compression-py/compressor.py > /tmp/prompt.md
```

Open `/tmp/prompt.md`: a senior-engineer role header, your blocks rendered as binding tags with the folder chain visibly nesting the global contracts around the service spec, the `@include`-d shared hints delivered verbatim inside the root's `rule` blocks, the `<read_it>` directive pointing at the Go source — and a closing implementation checklist. Then confirm what _didn't_ make it in:

```bash
hint compression-py/compressor.py | grep -c "Spec-internal"   # → 0
```

The root spec's `notes` block (design rationale for maintainers) was stripped at compile time. Notes for humans stay with humans.

---

## The Closing Argument

> Letting an agent loose on a polyglot repo without contracts is like hiring a brilliant engineer who reads none of your docs and forgets every convention between tasks: fast code, camelCase on one side of the pipe, snake_case on the other, and a stack trace in the JSON stream at the worst possible moment. Integration review ends up taking longer than writing the code yourself.
>
> **HINT puts AI coding on the reliable rails of engineering discipline.** You keep your architecture in Git, as code. Right in Markdown you draw the hard borders: data shapes, wire formats, error envelopes, dependency whitelists, the anti-patterns that already burned you once. The compiler turns that into a reinforced-concrete contract for the AI.
>
> In this repo, Pied Piper fixes the rules of a Go orchestrator, a Python compression engine, a TypeScript renderer, and the Bash glue in separate, inheriting scopes. The AI writes fast, idiomatic code for each — and never improvises across a service boundary, because the compiler blocks every attempt to cross the lines.

The verdict is yours — but don't deliberate on prose, **run the evidence**. Delete a service and watch it come back conforming. Order a forbidden rename and watch it get refused with citations. Change one shared contract and watch four languages fall in line. What wins an engineer over isn't text generation. It's **keeping the architecture while shipping at AI speed**.
