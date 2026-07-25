# Getting Started

> Early release (0.x) -- API may evolve before 1.0.

## Requirements

- **Bun** >= 1.0.0 (runtime and package manager)
- **Shell**: bash / POSIX shell (macOS, Linux; Windows via WSL)

> **Security note**: mdspec executes shell commands from markdown blocks. Do not run it on untrusted content.

## Installation

::: code-group

```bash [bun]
bun add -d mdspec
```

```bash [npm]
npm install -D mdspec
```

```bash [pnpm]
pnpm add -D mdspec
```

```bash [yarn]
yarn add -D mdspec
```

:::

> **Note**: All package managers can install mdspec, but **Bun is required to run it**. Use `bunx mdspec` or `bun mdspec` to execute tests.

## Write a Test

Create a file called `example.spec.md`:

````markdown
# My CLI Tests

```console
$ echo "Hello, mdspec!"
Hello, mdspec!
```

```console
$ date +"%Y"
/\d{4}/
```
````

Each `console` code fence is a test block. Lines starting with `$` are commands; everything else is expected output.

## Set Up and Tear Down Once

Each spec file already starts in a fresh temporary directory. Define
`beforeAll` and `afterAll` lifecycle fences when the examples need a shared
fixture or another resource with an explicit lifetime. Their bodies are raw
shell, without console-style `$` prompts:

````markdown
## Setup

```beforeAll reset
export FIXTURE_DIR="$(mktemp -d)"
cd "$FIXTURE_DIR"
printf 'ready\n' > status.txt
```

```afterAll
rm -rf "$FIXTURE_DIR"
```

## Example

```console
$ cat status.txt
ready
```
````

`reset` clears accumulated shell state before setup and returns to the spec's
temporary working directory. The new shell still inherits mdspec's process
environment, so explicitly export empty values for any ambient application
variables that would make a fixture target live services. mdspec runs
`beforeAll` once before the test blocks and guarantees `afterAll` after the last
block even when setup or a test fails. Lifecycle fences are declarations, not
tests, so they do not appear in the executable block count.

Environment variables, the working directory, and shell functions created by
the setup hook persist between blocks. `$ROOT` points back to the source tree
when a fixture needs project files.

Use a `console reset` fence when a later example must discard accumulated shell
state and return to the spec's original temporary directory:

````markdown
```console reset
$ echo "${FIXTURE_DIR:-unset}"
unset
```
````

Resetting shell context does not stop external processes or remove temporary
directories; lifecycle resources still belong in `afterAll`.

## Run It

```bash
mdspec example.spec.md
```

Output is markdown-formatted with pass/fail indicators, colored diffs, and headings from your document structure.

### Glob Patterns

```bash
mdspec tests/**/*.spec.md
```

### Snapshot Updates

When expected output changes, update it automatically:

```bash
mdspec --update tests/**/*.spec.md
```

The markdown file is rewritten in place with the actual output replacing the expected output.

## Vitest Integration

Run markdown tests through Vitest alongside your TypeScript test suite.

**Setup:** Create a test file (e.g., `tests/md.test.ts`):

```typescript
import { registerMdTests } from "mdspec/vitest"
await registerMdTests("tests/**/*.spec.md")
```

**Run:**

```bash
bunx --bun vitest run tests/md.test.ts
```

This gives you Vitest's reporters, `--watch` mode, `--coverage`, and `--bail` integration.

> **Note**: Vitest integration still uses Bun under the hood for test execution.

## Debug Mode

Enable debug output with the `DEBUG` environment variable:

```bash
DEBUG='mdspec:*' mdspec tests/example.spec.md
```

Available namespaces:

| Namespace        | What it shows                                  |
| ---------------- | ---------------------------------------------- |
| `mdspec:runner`  | Test file discovery, parsing, and execution    |
| `mdspec:files`   | Helper file creation from `file=` blocks       |
| `mdspec:session` | Session state management (env, cwd, functions) |

## How It Works

1. **Parse** -- Markdown is parsed with remark, extracting `console` code fences
2. **Isolate** -- Each test file runs in a fresh temp directory (`$ROOT` points back to the source tree)
3. **Execute** -- Commands run individually with state persisted between them via temp files
4. **Match** -- Actual output is compared against expected output using pattern matching
5. **Report** -- Results are printed as markdown with diffs for failures
