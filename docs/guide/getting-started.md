# Getting Started

> Early release (0.x) -- API may evolve before 1.0.

## Requirements

- **Bun** >= 1.0.0 (runtime and package manager)
- **Shell**: bash / POSIX shell (macOS, Linux; Windows via WSL)

> **Security note**: mdtest executes shell commands from markdown blocks. Do not run it on untrusted content.

## Installation

::: code-group

```bash [bun]
bun add -d @beorn/mdtest
```

```bash [npm]
npm install -D @beorn/mdtest
```

```bash [pnpm]
pnpm add -D @beorn/mdtest
```

```bash [yarn]
yarn add -D @beorn/mdtest
```

:::

> **Note**: All package managers can install mdtest, but **Bun is required to run it**. Use `bunx mdtest` or `bun mdtest` to execute tests.

## Write a Test

Create a file called `example.test.md`:

````markdown
# My CLI Tests

```console
$ echo "Hello, mdtest!"
Hello, mdtest!
```

```console
$ date +"%Y"
/\d{4}/
```
````

Each `console` code fence is a test block. Lines starting with `$` are commands; everything else is expected output.

## Run It

```bash
mdtest example.test.md
```

Output is markdown-formatted with pass/fail indicators, colored diffs, and headings from your document structure.

### Glob Patterns

```bash
mdtest tests/**/*.test.md
```

### Snapshot Updates

When expected output changes, update it automatically:

```bash
mdtest --update tests/**/*.test.md
```

The markdown file is rewritten in place with the actual output replacing the expected output.

## Vitest Integration

Run markdown tests through Vitest alongside your TypeScript test suite.

**Setup:** Create a test file (e.g., `tests/md.test.ts`):

```typescript
import { registerMdTests } from "@beorn/mdtest/vitest"
await registerMdTests("tests/**/*.test.md")
```

**Run:**

```bash
bunx vitest run tests/md.test.ts
```

This gives you Vitest's reporters, `--watch` mode, `--coverage`, and `--bail` integration.

> **Note**: Vitest integration still uses Bun under the hood for test execution.

## Debug Mode

Enable debug output with the `DEBUG` environment variable:

```bash
DEBUG='mdtest:*' mdtest tests/example.test.md
```

Available namespaces:

| Namespace        | What it shows                                  |
| ---------------- | ---------------------------------------------- |
| `mdtest:runner`  | Test file discovery, parsing, and execution    |
| `mdtest:files`   | Helper file creation from `file=` blocks       |
| `mdtest:session` | Session state management (env, cwd, functions) |

## How It Works

1. **Parse** -- Markdown is parsed with remark, extracting `console` code fences
2. **Isolate** -- Each test file runs in a fresh temp directory (`$ROOT` points back to the source tree)
3. **Execute** -- Commands run individually with state persisted between them via temp files
4. **Match** -- Actual output is compared against expected output using pattern matching
5. **Report** -- Results are printed as markdown with diffs for failures
