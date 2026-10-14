# mdspec Tests

**Test Infrastructure — Markdown Test Runner**: Parse markdown files with console/sh code blocks and execute them as tests.

## What to Test Here

- **Parsing**: fence detection (console/sh), code block extraction, info string parsing, `$` command lines vs expected output
- **Markdown**: heading parsing with depth, `findNearestHeading` for code block association
- **Matching**: line-by-line output comparison, pattern matching (regex, glob), `splitNorm` normalization
- **Shell**: `shellEscape` (safe strings, spaces, special chars, single quotes), `buildScript`, `buildHookScript`
- **Vitest integration**: `registerMdTests` loading `.spec.md` files into vitest
- **Bun integration**: `registerMdTests` for Bun test runner (`.slow.` gated)
- **CLI integration**: end-to-end mdspec execution via `bun` subprocess
- **PTY sessions**: real terminal session execution (`.slow.` gated)

## What NOT to Test Here

- Test framework internals (vitest/bun) — mdspec only bridges to them
- Terminal rendering — mdspec produces pass/fail, not visual output

## Helpers

- `mkBlock(code, info)`: creates a fenced code block string
- `createTestFile(content)`: writes content to a temp `.md` file
- `runMdspec(file, args)`: runs the mdspec CLI via `bun` subprocess

## Patterns

````typescript
import { parseMarkdown } from "../src/markdown"

test("parses console fence", () => {
  const { codeBlocks } = parseMarkdown("# Test\n```console\n$ echo hi\nhi\n```\n")
  expect(codeBlocks).toHaveLength(1)
  expect(codeBlocks[0]!.lang).toBe("console")
})
````

Self-testing: `mdtest-e2e.test.ts` registers `*.spec.md` files in the test directory, so mdspec tests itself.

## Ad-Hoc Testing

```bash
bun vitest run tests/              # All mdspec tests (fast only)
bun vitest run tests/parser.test.ts    # Parser tests
bun vitest run tests/shell.test.ts     # Shell escaping
bun vitest run tests/headings.test.ts  # Heading parsing
```

## Efficiency

Parser and shell tests are fast (~50ms). E2E tests spawn subprocesses (~500ms). Slow tests (bun integration, PTY sessions, CLI E2E) are gated behind `.slow.` suffix. The self-hosting `mdtest-e2e.test.ts` runs `*.spec.md` files which execute real shell commands (mdspec testing itself).

## See Also

- [Test layering philosophy](../../.claude/skills/tests/test-layers.md)
