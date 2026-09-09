# Block Options

Options are set on the code fence info string, space-separated:

````markdown
```console cwd=/tmp env=DEBUG=1 timeout=5000 reset
$ command
```
````

## Standard Options

### `cwd`

Set the working directory for the block. Persists to subsequent blocks.

````markdown
```console cwd=/tmp
$ pwd
/tmp
```
````

### `env`

Set environment variables. Comma-separated `KEY=VALUE` pairs. Persists to subsequent blocks.

````markdown
```console env=DEBUG=1,NODE_ENV=test
$ echo "$DEBUG $NODE_ENV"
1 test
```
````

### `exit`

Expected exit code for the block. Can also be specified inline with `[N]` at the end of expected output.

````markdown
```console exit=1
$ false
```
````

Equivalent to:

````markdown
```console
$ false
[1]
```
````

### `reset`

Clear all accumulated state (env, cwd, functions) before this block and return
to the spec file's original temporary directory.

````markdown
```console reset
$ echo "${MYVAR:-unset}"
unset
```
````

Use `beforeAll`/`afterAll` lifecycle fences for resources with an explicit
lifetime and `reset` when a particular block needs fresh shell context. The
common setup form is:

````markdown
```beforeAll reset
cd "$MDSPEC_FIXTURE"
```
````

`$MDSPEC_FIXTURE` is a scratch directory the harness creates before the first
block and removes after the last one, exported to every block and fence. It is
namespaced so it cannot clobber a `FIXTURE` name a spec already uses. Specs must
not create or delete their own: `afterAll` runs only when every preceding block
succeeded, so a hand-rolled pair leaks on the first failure it was written to
survive.

Lifecycle fence bodies are raw shell. They are declarations rather than tests,
so they do not count as executable blocks. Resetting shell state does not clean
up external resources; keep that work in `afterAll`.

### `timeout`

Maximum execution time in milliseconds. Default: 30000 (30 seconds).

````markdown
```console timeout=5000
$ sleep 10
! Command timed out after 5000ms
[124]
```
````

### `file`

Create a helper file in the temp directory. Used on non-console fences.

````markdown
```json file=config.json
{ "key": "value" }
```
````

## Custom Command Options

These options apply when using `cmd="..."` for REPL/subprocess testing.

### `cmd`

Start a persistent subprocess. Commands are sent to its stdin.

````markdown
```console cmd="node -i"
$ 1 + 1
2
```
````

### `pty`

PTY mode. Default: `true` on POSIX. Set `false` for pipe mode with separate stderr.

````markdown
```console cmd="my-repl" pty=false
$ command
output
```
````

### `minWait`

Milliseconds of silence before assuming command completion. Default: 50ms (PTY), 100ms (pipe).

### `maxWait`

Maximum wait time per command in milliseconds. Default: 2000ms.

### `startupDelay`

Maximum wait for subprocess to be ready before the first command. Default: 300ms (PTY), 0ms (pipe). If OSC 133;A is detected before this timeout, execution proceeds immediately.

## Output Syntax

Within a console block, these conventions define expected output:

| Syntax           | Meaning                                  |
| ---------------- | ---------------------------------------- |
| `$ command`      | Command to execute                       |
| `> continuation` | Multi-line command continuation          |
| plain lines      | Expected stdout                          |
| `! line`         | Expected stderr (without the `!` prefix) |
| `[N]`            | Expected exit code (default: 0)          |

## Options Merging

Options can be set at three levels. Later levels override earlier ones:

1. **Frontmatter** -- file-level defaults
2. **Heading attributes** -- `## Section {key=value}`
3. **Fence info** -- `\`\`\`console key=value`

```markdown
---
mdspec:
  plugin: ./plugin.ts
  fixture: default
---

## Tests {fixture=override}

\`\`\`console fixture=final
$ command
\`\`\`
```

In this example, `fixture` resolves to `"final"`.
