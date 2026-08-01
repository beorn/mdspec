import { describe, expect, test } from "vitest"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

/**
 * Two harness-owned safety properties:
 *
 *   1. `set -u` by default. An unset variable aborts the command instead of
 *      expanding to the empty string. That expansion is what turns a mangled
 *      fixture path into either a no-op that reads as success, or — once a
 *      suffix is appended — an absolute path under `/`.
 *   2. `$MDSPEC_FIXTURE` — a harness-created scratch root, removed after the
 *      file regardless of outcome, so specs never write their own teardown.
 *      Namespaced because `FIXTURE` is a name specs already use themselves.
 *
 * `set -e` is deliberately NOT applied: the runner asserts exit codes itself
 * and specs routinely exercise failing commands.
 */

const mdspecCli = join(import.meta.dirname, "../src/index.ts")
const dirs: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "mdspec-nounset-"))
  dirs.push(dir)
  return dir
}

function run(spec: string): { exitCode: number; output: string } {
  const result = spawnSync("bun", [mdspecCli, spec], { encoding: "utf8" })
  return { exitCode: result.status ?? 1, output: result.stdout + result.stderr }
}

function writeSpec(body: string): string {
  const dir = tempDir()
  const spec = join(dir, "s.spec.md")
  writeFileSync(spec, body)
  return spec
}

afterEachCleanup()
function afterEachCleanup(): void {
  process.on("exit", () => {
    for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true })
  })
}

describe("set -u by default", () => {
  test("an unset variable aborts the command instead of expanding to empty", () => {
    const spec = writeSpec(`# Nounset

\`\`\`console
$ echo "start:$NEVER_SET_ANYWHERE:end"
start::end
\`\`\`
`)
    const result = run(spec)
    // The block must NOT pass by printing "start::end" — the empty expansion is
    // precisely the dangerous behaviour.
    expect(result.exitCode).not.toBe(0)
    expect(result.output).toMatch(/unbound variable/u)
  })

  test("nounset=false opts a block back out", () => {
    const spec = writeSpec(`# Nounset off

\`\`\`console nounset=false
$ echo "start:\${NEVER_SET_ANYWHERE}:end"
start::end
\`\`\`
`)
    expect(run(spec).exitCode).toBe(0)
  })

  test("an explicit default is still fine under set -u", () => {
    const spec = writeSpec(`# Defaults

\`\`\`console
$ echo "start:\${NEVER_SET_ANYWHERE:-fallback}:end"
start:fallback:end
\`\`\`
`)
    expect(run(spec).exitCode).toBe(0)
  })

  test("set -e is NOT applied — a failing command still yields to the runner", () => {
    const spec = writeSpec(`# Exit codes

\`\`\`console exit=3
$ bash -c 'exit 3'
\`\`\`

\`\`\`console
$ echo after
after
\`\`\`
`)
    expect(run(spec).exitCode).toBe(0)
  })
})

describe("$MDSPEC_FIXTURE", () => {
  test("is exported, writable, and shared across blocks in a file", () => {
    const spec = writeSpec(`# Fixture

\`\`\`console
$ test -d "$MDSPEC_FIXTURE" && printf 'dir\\n'
dir
\`\`\`

\`\`\`console
$ printf 'x\\n' > "$MDSPEC_FIXTURE/f" && cat "$MDSPEC_FIXTURE/f"
x
\`\`\`
`)
    expect(run(spec).exitCode).toBe(0)
  })

  test("is removed after the file, and its path is not left behind", () => {
    const dir = tempDir()
    const spec = join(dir, "s.spec.md")
    const record = join(dir, "recorded-path")
    writeFileSync(
      spec,
      `# Fixture removal

\`\`\`console
$ printf '%s\\n' "$MDSPEC_FIXTURE" > ${JSON.stringify(record)} && printf 'ok\\n'
ok
\`\`\`
`,
    )
    expect(run(spec).exitCode).toBe(0)
    const recorded = readFileSync(record, "utf8").trim()
    expect(recorded).not.toBe("")
    expect(existsSync(recorded)).toBe(false)
  })

  test("a spec's own FIXTURE variable is NOT clobbered by the harness", () => {
    const dir = tempDir()
    const spec = join(dir, "s.spec.md")
    const mine = join(dir, "my-own-fixture")
    writeFileSync(
      spec,
      `# No collision

\`\`\`beforeAll reset
export FIXTURE=${JSON.stringify(mine)}
mkdir -p "$FIXTURE"
\`\`\`

\`\`\`console
$ printf '%s\\n' "$FIXTURE"
${mine}
\`\`\`
`,
    )
    expect(run(spec).exitCode).toBe(0)
  })
})
