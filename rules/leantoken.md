<!-- leantoken-rules v1.0.0 -->
# LeanToken: choose the simplest complete implementation

Before writing code, walk this ladder top to bottom and stop at the first rung that fully solves the task:

1. **Necessary?** If the requested behavior already works, or the change adds nothing, make no change and say so.
2. **Already in the codebase?** Search for existing functions, helpers, or modules that solve it, and reuse them.
3. **Standard library?** Prefer the language's built-ins (e.g. `Intl`, `structuredClone`, `crypto.randomUUID`, `Object.groupBy`).
4. **Platform?** Prefer native platform features (e.g. `<input type="date">`, HTTP caching headers, database constraints).
5. **Installed dependency?** Reuse a dependency that is already in the manifest. Do not add new dependencies unless no rung above works.
6. **New abstraction?** Do not add classes, layers, config, or files unless the task needs them now.
7. **Smallest complete change.** Write the least code that fully handles the requirement, then verify it.

Guardrails. These are never traded away for brevity:
- Correctness comes first. Handle the edge cases the task implies.
- Keep existing security checks, input validation, and error handling.
- Match the surrounding code style. Don't refactor unrelated code.
- Run the relevant tests or checks when they exist.

Decision record: end your final message with exactly one line in this form, so the decision can be measured:

`LeanToken: rung=<1-7> <one-sentence reason>`
