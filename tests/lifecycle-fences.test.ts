import { afterEach, describe, expect, test } from "vitest"
import { spawnSync } from "node:child_process"
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const mdspecCli = join(import.meta.dirname, "../src/index.ts")
const tempDirs: string[] = []

function tempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "mdspec-lifecycle-"))
  tempDirs.push(dir)
  return dir
}

function runMdspec(spec: string): { exitCode: number; output: string } {
  const result = spawnSync("bun", [mdspecCli, spec], { encoding: "utf8" })
  return {
    exitCode: result.status ?? 1,
    output: result.stdout + result.stderr,
  }
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("lifecycle fences", () => {
  test("beforeAll reset sets up once and afterAll tears down once", async () => {
    const dir = tempDir()
    const fixture = join(dir, "fixture")
    const marker = join(dir, "torn-down")
    const spec = join(dir, "lifecycle.spec.md")

    writeFileSync(
      spec,
      `# Lifecycle

\`\`\`beforeAll reset
export FIXTURE=${JSON.stringify(fixture)}
mkdir -p "$FIXTURE"
printf 'ready\\n' > "$FIXTURE/status"
\`\`\`

\`\`\`console
$ cat "$FIXTURE/status"
ready
\`\`\`

\`\`\`afterAll
test -d "$FIXTURE"
printf 'yes\\n' > ${JSON.stringify(marker)}
rm -rf -- "$FIXTURE"
\`\`\`
`,
    )

    const result = runMdspec(spec)

    expect(result.output).toContain("1 block(s), 0 failed")
    expect(result.output).not.toContain(`export FIXTURE=${JSON.stringify(fixture)}`)
    expect(result.exitCode).toBe(0)
    expect(readFileSync(marker, "utf8")).toBe("yes\n")
    expect(existsSync(fixture)).toBe(false)
  })

  test("afterAll runs when an executable fence fails", async () => {
    const dir = tempDir()
    const marker = join(dir, "after-failure")
    const spec = join(dir, "failure.spec.md")

    writeFileSync(
      spec,
      `# Lifecycle failure

\`\`\`beforeAll reset
export MARKER=${JSON.stringify(marker)}
\`\`\`

\`\`\`console
$ false
\`\`\`

\`\`\`afterAll
printf 'yes\\n' > "$MARKER"
\`\`\`
`,
    )

    const result = runMdspec(spec)

    expect(result.exitCode).toBe(1)
    expect(readFileSync(marker, "utf8")).toBe("yes\n")
  })

  test("beforeAll fails on the first failing shell command and still runs afterAll", async () => {
    const dir = tempDir()
    const continued = join(dir, "continued")
    const tornDown = join(dir, "after-setup-failure")
    const spec = join(dir, "setup-failure.spec.md")

    writeFileSync(
      spec,
      `# Setup failure

\`\`\`beforeAll reset
false
printf 'wrong\\n' > ${JSON.stringify(continued)}
\`\`\`

\`\`\`console
$ true
\`\`\`

\`\`\`afterAll
printf 'yes\\n' > ${JSON.stringify(tornDown)}
\`\`\`
`,
    )

    const result = runMdspec(spec)

    expect(result.exitCode).toBe(1)
    expect(existsSync(continued)).toBe(false)
    expect(readFileSync(tornDown, "utf8")).toBe("yes\n")
  })
})
