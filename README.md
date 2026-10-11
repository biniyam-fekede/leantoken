# LeanToken

**An optimization layer for AI coding agents that favors the simplest complete implementation, plus a benchmark that measures whether it actually helps.**

AI coding agents often over-engineer. They install a date library to format one date, write a custom parser when a helper already exists, or build a cache framework when a `Map` would do. LeanToken gives the agent a short decision ladder to walk *before* it writes code. It also ships a paired benchmark, so improvements are measured instead of assumed.

> The best code is often the code you never needed to write.

**[Try the interactive demo →](https://biniyam-fekede.github.io/leantoken/)**

LeanToken is an **experimental platform for measuring coding-agent efficiency**, with code-minimization as the first experiment.

## The decision ladder

The agent stops at the first rung that fully solves the task:

| # | Question | Action |
|---|----------|--------|
| 1 | Is the change actually necessary? | Make no change |
| 2 | Does the codebase already solve it? | Reuse existing code |
| 3 | Can the standard library solve it? | Use built-ins |
| 4 | Does the platform support it? | Use native capabilities |
| 5 | Is a dependency already installed? | Reuse it |
| 6 | Is a new abstraction necessary? | Avoid it if not |
| 7 | What's the smallest complete change? | Implement and verify |

Correctness, security checks and error handling are guardrails. They are never traded for brevity.

**Observability:** the agent ends each task with a decision record (`LeanToken: rung=3 used Intl.DateTimeFormat`). The benchmark parses it, so you can see *which* rung drove each decision, not just the final line count.

The full ruleset is versioned in [`rules/leantoken.md`](rules/leantoken.md).

## Install

**As a Claude Code plugin.** The rules load automatically at session start through a `SessionStart` hook:

```
/plugin marketplace add biniyam-fekede/leantoken
/plugin install leantoken@leantoken
```

Turn it off at any time with `/plugin disable leantoken`.

**Or per project, through `CLAUDE.md`.** This works with any agent that reads an instruction file:

```bash
git clone https://github.com/biniyam-fekede/leantoken && cd leantoken && npm install && npm link
leantoken install              # adds a marked block to ./CLAUDE.md
leantoken install --file AGENTS.md
leantoken uninstall            # removes exactly that block, nothing else
```

## Benchmark

```bash
leantoken tasks                                    # list the 28 bundled tasks
leantoken bench --runs 3 --model sonnet --concurrency 4
leantoken bench --tasks format-date,reuse-csv --runs 5
leantoken bench --variants no-step-3 --runs 1      # ablation: the ruleset without step 3
leantoken report                                   # re-print the summary
leantoken export                                   # write docs/results.json for the project page
```

How a run works:

1. The task's `repo/` is copied into a fresh temp git repository.
2. `claude -p` runs the task prompt. The `leantoken` variant also gets the ruleset through `--append-system-prompt`. The model, prompt and starting state are otherwise identical.
3. The runner records tokens, cost and time from Claude Code's JSON output, lines changed from `git diff --numstat` (lockfiles excluded), and new dependencies from `package.json`.
4. **Hidden tests** are copied in only *after* the agent finishes, so they can't be read or edited, and then run with `node --test`.
5. Every run is appended to `results/runs.jsonl` (one JSON object per line), including the diff the agent produced.

Variants are interleaved within each repetition, so drift such as rate limits or model updates affects both sides equally. The headline numbers are the **median of per-task changes**, so one large task can't dominate the result. Errored runs are excluded from the medians but count as failures in the pass rate.

> **Isolation note:** if you installed the LeanToken plugin globally, disable it before benchmarking. Otherwise the baseline gets the rules too.

### Bundled tasks

28 small tasks, each aimed at one checklist step. Every task's hidden tests were checked to fail on the starting code and pass with a minimal correct solution.

| Step | Tasks |
|------|-------|
| 1 – not needed | `already-done`, `already-sorted`, `already-trims` |
| 2 – in the codebase | `reuse-csv`, `reuse-retry`, `reuse-money`, `reuse-chunk` |
| 3 – standard library | `format-date`, `unique-id`, `deep-clone`, `group-orders`, `url-params`, `relative-time`, `currency-format`, `sort-names`, `dedupe`, `hash-sha256`, `file-ext` |
| 4 – platform | `date-field`, `env-config` |
| 5 – installed dependency | `installed-lib` |
| 6 – no new abstraction | `feature-flag`, `add-option` |
| 7 – smallest change | `validate-email`, `cache-rate`, `rate-limit`, `paginate`, `password-rules` |

Each task is `benchmark-tasks/<id>/{task.json, repo/, test/}`. To add one, drop in a new folder. Hidden tests must be `*.test.js` files that use `node:test`.

### Results

**27 tasks × 3 runs × 2 variants on Claude Sonnet (162 runs).** Raw data, including every diff: [`data/runs-sonnet.jsonl`](data/runs-sonnet.jsonl). Full write-up: [biniyam-fekede.github.io/leantoken/writeup.html](https://biniyam-fekede.github.io/leantoken/writeup.html).

| Metric (median per-task change) | Result |
|---|---|
| Lines changed | 0% on the median task; −50% to −83% on the 5 tasks with an obvious built-in |
| Output tokens | +7% |
| Cost | +5% |
| Time | +13% |
| Tests passed | 95% without → 96% with |
| New packages added | 0 → 0 |
| Decision recorded | 81 of 81 runs |

On small, clearly worded tasks, Sonnet is already fairly lean, so the checklist mostly adds a little overhead. Where a built-in exists, it cuts code sharply and can improve correctness: on `url-params`, the baseline hand-rolled a parser that failed 2 of 3 runs, while LeanToken used `URLSearchParams` and passed 3 of 3. `hash-sha256` failed on both sides because the task didn't specify sync vs. async; that's a task-wording flaw.

Ablation runs (one checklist step removed at a time) are next.

Fewer lines do not automatically mean better code. Correctness is the primary metric.

## Development

```bash
npm install
npm run build
npm test
```

```
src/
  cli.ts       command-line entry (node:util parseArgs, no CLI framework)
  rules.ts     load the ruleset; install/uninstall the CLAUDE.md block
  bench.ts     run one task under one variant in a throwaway repo
  metrics.ts   pure parsing + aggregation + report formatting
rules/         versioned ruleset
hooks/         Claude Code SessionStart hook
.claude-plugin/ plugin + marketplace manifests
benchmark-tasks/
tests/         vitest unit tests
```

The project follows its own rules. It has zero runtime dependencies: `parseArgs` instead of Commander, and JSONL instead of SQLite until the data needs queries.

## Roadmap

- [x] Versioned ruleset with a decision record
- [x] Claude Code plugin + `CLAUDE.md` installer with clean rollback
- [x] Paired benchmark runner with hidden tests and a CLI report
- [ ] Grow the suite to 20–30 tasks, including multi-file and frontend tasks
- [ ] Publish the first reproducible results
- [ ] Rule ablations: which rungs actually move the numbers?
- [ ] Context-optimization experiments (filtering/compressing what the agent reads)
- [ ] More agents (Codex, Cursor) via the same portable ruleset

## License

MIT
