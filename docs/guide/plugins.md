# Plugins

By default, mdtest executes console blocks by spawning bash subprocesses for each command. This is flexible but adds ~200ms overhead per command. For test suites with hundreds of commands, this adds up.

Plugins replace subprocess execution with custom engines that can run commands in-process, reducing test time from ~41s to ~5s (8x speedup).

## Plugin Interface

A plugin is a TypeScript module that exports a factory function:

```typescript
import type { Plugin, FileOpts, BlockOpts, ReplResult } from "@beorn/mdtest"

export default function myPlugin(fileOpts: FileOpts): Plugin {
  return {
    block(blockOpts: BlockOpts): ((cmd: string) => Promise<ReplResult>) | null {
      if (blockOpts.type !== "console") return null

      return async (cmd: string) => {
        return {
          stdout: "...",
          stderr: "",
          exitCode: 0,
        }
      }
    },
  }
}
```

The `block()` method is called for each code block. Return an executor function to handle it, or `null` to fall back to bash.

## Using Plugins

Add frontmatter to your test file:

```markdown
---
mdtest:
  plugin: ./my-plugin.ts
  customOption: value
---
```

Plugin resolution:

- **Relative path** (`./` or `../`) -- resolved relative to the test file
- **Built-in name** (`bash`) -- uses the built-in bash plugin
- **Bare specifier** (`@scope/package`) -- resolved from `node_modules`

## Options Merging

Options cascade from three levels, with later levels overriding earlier ones:

```markdown
---
mdtest:
  plugin: ./plugin.ts
  fixture: default
---

## Test Suite {fixture=two-columns}

\`\`\`console fixture=custom reset
$ command
\`\`\`
```

Priority: **frontmatter** < **heading** < **fence** (fence wins).

## Built-in Bash Plugin

The default bash execution logic is available as a plugin for composition:

```typescript
import { bash } from "@beorn/mdtest/plugins"

export default function myPlugin(opts: FileOpts): Plugin {
  if (hasMixedCommands) {
    return bash(opts) // Delegate to bash
  }

  return {
    block(blockOpts) {
      return async (cmd) => executeInProcess(cmd)
    },
  }
}
```

The bash plugin provides state persistence (env, cwd, functions), hook support, continuation lines, and reset flag handling.

## Lifecycle Hooks

Plugins can provide setup/teardown hooks:

```typescript
export default function myPlugin(opts: FileOpts): Plugin {
  let db: Database

  return {
    async beforeAll() {
      db = await initialize()
    },

    async beforeEach() {
      await db.reset()
    },

    async afterEach() {
      await db.cleanup()
    },

    async afterAll() {
      await db.dispose()
    },

    block(opts) {
      return async (cmd) => executeWith(db, cmd)
    },
  }
}
```

| Hook         | When it runs                                            |
| ------------ | ------------------------------------------------------- |
| `beforeAll`  | Once before any blocks (after the first block executes) |
| `beforeEach` | Before each block                                       |
| `afterEach`  | After each block (even on failure)                      |
| `afterAll`   | Once after all blocks (even on failure)                 |

## State Management

Plugins can maintain state across blocks:

```typescript
export default function statefulPlugin(opts: FileOpts): Plugin {
  let connection: Connection | null = null

  return {
    block(blockOpts) {
      if (blockOpts.reset) {
        connection?.close()
        connection = null
      }

      return async (cmd: string) => {
        if (!connection) {
          connection = await connect()
        }
        return executeWithConnection(connection, cmd)
      }
    },
  }
}
```

## Mixing Plugins and Bash

Return `null` from `block()` for any blocks that should fall back to bash:

```typescript
export default function selectivePlugin(opts: FileOpts): Plugin {
  return {
    block(blockOpts) {
      if (blockOpts.heading.includes("Setup")) {
        return null // Let bash handle setup blocks
      }

      return async (cmd) => executeInProcess(cmd)
    },
  }
}
```

## Performance

Typical performance improvement with in-process plugins:

| Execution Mode            | Per-command overhead | 222 commands |
| ------------------------- | -------------------- | ------------ |
| Bash subprocess (default) | ~200ms               | ~44s         |
| Bun shell plugin          | ~20ms                | ~7s          |
| True in-process (planned) | ~1ms                 | ~3s          |

## Example: Real-world Plugin

A plugin for testing a CLI tool in-process:

```typescript
import type { Plugin, FileOpts, BlockOpts, ReplResult } from "@beorn/mdtest"
import { $ } from "bun"

export default function cliPlugin(_opts: FileOpts): Plugin {
  return {
    block(blockOpts: BlockOpts) {
      if (blockOpts.type !== "console") return null

      return async (cmd: string): Promise<ReplResult> => {
        const result = await $`bash -c ${cmd}`.quiet()
        return {
          stdout: result.stdout.toString().trimEnd(),
          stderr: result.stderr.toString().trimEnd(),
          exitCode: result.exitCode,
        }
      }
    },
  }
}
```
