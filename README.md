# mdspec

**Executable Markdown Testing.**

Your docs are your tests. Write CLI commands and expected output in markdown code fences — mdspec runs them with persistent shell context, pattern matching, and snapshot updates.

> Early release (0.x) — API may evolve before 1.0.

## Why mdspec?

Testing CLI tools shouldn't require a separate testing DSL. Your README already shows commands and their output — mdspec makes those examples executable. When your docs drift from reality, your tests fail.

**Design goals:**
- **Docs as tests** — no separate test files, no custom syntax. Standard markdown with console code fences.
- **Persistent context** — environment variables, working directory, and shell state carry across blocks within a file, just like a real terminal session.
- **Pattern matching** — wildcards, regex, and named captures for dynamic output (timestamps, UUIDs, paths).
- **Snapshot updates** — when output changes, `mdspec --update` rewrites the markdown in place.
- **Plugin system** — replace shell execution with in-process plugins for 8x faster test runs.
- **Test runner integration** — runs as a Vitest plugin or Bun test adapter, not just a standalone CLI.

## Related Projects

mdspec draws inspiration from and improves upon:

| Project | Language | How mdspec differs |
|---------|----------|-------------------|
| [Cram](https://bitheap.org/cram/) | Python | Markdown-native (not `.t` files), persistent context across blocks, plugin system, test runner integration |
| [trycmd](https://github.com/assert-rs/trycmd) | Rust | Not Rust-specific, supports regex/captures, REPL testing, in-process plugins |
| [mdbook-cmdrun](https://github.com/FauconFan/mdbook-cmdrun) | Rust | Bidirectional (asserts output, not just generates it), snapshot updates, pattern matching |
| [doctest](https://docs.python.org/3/library/doctest.html) | Python | Shell commands (not Python expressions), cross-language, persistent state |
| [shelltestrunner](https://github.com/simonmichael/shelltestrunner) | Haskell | Standard markdown format, captures, plugins, integrated with JS test runners |

## Requirements

- **Bun** >= 1.0.0 (runtime and package manager)
- **Shell**: bash / POSIX shell (macOS, Linux; Windows via WSL)

> **Security note**: mdspec executes shell commands from markdown blocks. Do not run it on untrusted content.

## Quick Start

Install:

```bash
bun add -d mdspec
```

Write a test (`example.spec.md`):

````markdown
# My CLI

```console
$ echo "Hello, mdspec!"
Hello, mdspec!
```

```console
$ date +"%Y"
/\d{4}/
```
````

Run it:

```bash
mdspec example.spec.md
```

### When Tests Fail

When expected output changes, mdspec shows a colored diff. Update snapshots automatically:

```bash
mdspec --update example.spec.md
```

The markdown file is rewritten in place with the actual output replacing the expected output.

## Features

### Pattern Matching

Match dynamic output with wildcards, regex, and named captures:

````markdown
```console
$ uuidgen
{{id:/[0-9A-F-]{36}/}}
```

```console
$ echo "Your ID: {{id}}"
Your ID: {{id}}
```
````

Ellipsis wildcards (`[...]` or `...`) match any text inline or zero or more lines when alone on a line.

### Persistent Context

Environment variables, working directory, and bash functions carry across blocks:

````markdown
```console
$ export NAME="world"
```

```console
$ echo "Hello, $NAME!"
Hello, world!
```
````

### Plugins

Replace bash subprocess execution with in-process plugins for up to 8x faster test runs:

```markdown
---
mdspec:
  plugin: ./my-plugin.ts
---
```

### REPL Testing

Test interactive shells with persistent subprocess mode and OSC 133 completion detection:

````markdown
```console cmd="node -i"
$ 1 + 1
2
$ 'hello'.toUpperCase()
'HELLO'
```
````

### Helper Files

Create test fixtures from code fences:

````markdown
```json file=config.json
{ "port": 3000 }
```

```console
$ cat config.json
{ "port": 3000 }
```
````

## CLI

```bash
mdspec <patterns...>            # Run tests
mdspec --update tests/*.spec.md # Update snapshots
mdspec --dots tests/*.spec.md   # Compact dots reporter
mdspec --tap tests/*.spec.md    # TAP output
```

## Vitest Integration

```typescript
// tests/md.test.ts
import { registerMdTests } from "mdspec/vitest"
await registerMdTests("tests/**/*.spec.md")
```

```bash
bunx vitest run tests/md.test.ts
```

## Documentation

Full documentation: [https://beorn.github.io/mdspec/](https://beorn.github.io/mdspec/)

## License

MIT
