# Custom Commands

Test REPLs and interactive shells using `cmd="..."` to keep a subprocess running across commands within a block.

## Basic Usage

````markdown
```console cmd="node -i"
$ 1 + 1
2
$ 'hello'.toUpperCase()
'HELLO'
```
````

A single subprocess is started for the block. Commands are sent to stdin and output is captured from stdout. State persists between commands within the block.

## PTY vs Pipe Mode

On POSIX systems (macOS, Linux), mdspec uses PTY mode by default, giving the subprocess a real terminal (`isTTY = true`). This enables TTY-aware features like colors, prompts, and OSC 133 completion detection.

Force pipe mode with `pty=false` when you need separate stderr capture:

````markdown
```console cmd="my-repl" pty=false
$ command-that-logs-to-stderr
expected stdout only
```
````

|                 | PTY (default on POSIX) | Pipe (`pty=false` or Windows)       |
| --------------- | ---------------------- | ----------------------------------- |
| Subprocess sees | `isTTY=true`           | `isTTY=false`                       |
| OSC 133         | Auto-detected          | Requires `TERM_SHELL_INTEGRATION=1` |
| stderr          | Merged with stdout     | Separate stream                     |
| Platform        | macOS, Linux           | All platforms                       |

## OSC 133 Completion Detection

Programs that emit [OSC 133 shell integration](https://sw.kovidgoyal.net/kitty/shell-integration/) sequences signal command completion immediately, making tests deterministic and fast (~6x faster than silence-based detection).

To support this in your REPL:

```typescript
// After command output, emit completion marker with exit code
if (process.stdout.isTTY) {
  process.stdout.write(`\x1b]133;D;${exitCode}\x07`)
}
```

Without OSC 133, mdspec falls back to silence-based detection -- waiting for output to stop for a configurable duration.

## Timing Options

| Option         | Default (PTY) | Default (Pipe) | Description                           |
| -------------- | ------------- | -------------- | ------------------------------------- |
| `startupDelay` | 300ms         | 0ms            | Max wait for subprocess to be ready   |
| `minWait`      | 50ms          | 100ms          | Silence duration to assume completion |
| `maxWait`      | 2000ms        | 2000ms         | Maximum wait before timeout           |

````markdown
```console cmd="slow-repl" startupDelay=500 minWait=200 maxWait=5000
$ slow-command
expected output
```
````

## Detection Flow

**Ready detection** (before sending a command):

1. OSC 133;A marker detected -- immediate ready
2. Any output received -- subprocess started, proceed
3. `startupDelay` elapsed -- timeout, proceed anyway

**Completion detection** (after sending a command):

1. OSC 133;D marker detected -- immediate completion
2. `minWait` ms of silence -- assume complete
3. `maxWait` ms elapsed -- timeout

## Use Cases

- Testing REPLs where state persists (Node.js, Python, etc.)
- Testing TUI shells with in-memory state
- Any interactive command-line tool with a prompt-response pattern
