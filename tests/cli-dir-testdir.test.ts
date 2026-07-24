// CLI integration: directory arguments + $TESTDIR/$ROOT fence env
// - a directory argument runs every *.spec.md under it (recursive)
// - an empty directory fails loud (exit 2), never silently passes
// - fences see cram-style $TESTDIR = dir of the spec file (invocation-independent)

import { describe, test, expect } from "vitest"
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { execFileSync } from "node:child_process"

const CLI = join(dirname(fileURLToPath(import.meta.url)), "../src/index.ts")

function runCli(args: string[], cwd: string): { status: number; out: string } {
  try {
    const out = execFileSync("bun", [CLI, ...args], { cwd, encoding: "utf8", stdio: "pipe" })
    return { status: 0, out }
  } catch (e) {
    const err = e as { status: number | null; stdout?: string; stderr?: string }
    return { status: err.status ?? -1, out: `${err.stdout ?? ""}${err.stderr ?? ""}` }
  }
}

describe("CLI directory args + fence env", () => {
  test("directory arg runs nested *.spec.md and fences see $TESTDIR", () => {
    const root = mkdtempSync(join(tmpdir(), "mdspec-dir-"))
    try {
      const sub = join(root, "specs", "sub")
      mkdirSync(sub, { recursive: true })
      writeFileSync(
        join(sub, "env.spec.md"),
        [
          "# env",
          "",
          "```console",
          '$ basename "$TESTDIR"',
          "sub",
          "```",
        ].join("\n"),
      )
      // Run from OUTSIDE the spec dir: $TESTDIR must be spec-file-anchored, not cwd-anchored
      const res = runCli([join(root, "specs")], root)
      expect(res.out).toContain("1 block(s), 0 failed")
      expect(res.status).toBe(0)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("relative frontmatter cwd is spec-file-anchored", () => {
    const root = mkdtempSync(join(tmpdir(), "mdspec-cwd-"))
    try {
      const sub = join(root, "anchor", "specs")
      mkdirSync(sub, { recursive: true })
      writeFileSync(
        join(sub, "cwd.spec.md"),
        [
          "---",
          "mdspec:",
          "  cwd: ..",
          "---",
          "# cwd",
          "",
          "```console",
          "$ basename \"$(pwd)\"",
          "anchor",
          "```",
        ].join("\n"),
      )
      // Invoked from an unrelated cwd: `cwd: ..` must resolve against the SPEC's dir
      const res = runCli([join(sub, "cwd.spec.md")], root)
      expect(res.out).toContain("1 block(s), 0 failed")
      expect(res.status).toBe(0)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("frontmatter path: exposes a spec-anchored bin dir as bare commands", () => {
    const root = mkdtempSync(join(tmpdir(), "mdspec-path-"))
    try {
      const specs = join(root, "specs")
      const bin = join(root, "bin")
      mkdirSync(specs, { recursive: true })
      mkdirSync(bin, { recursive: true })
      writeFileSync(join(bin, "hellotool"), "#!/bin/sh\necho from-hellotool\n", { mode: 0o755 })
      writeFileSync(
        join(specs, "path.spec.md"),
        [
          "---",
          "mdspec:",
          "  path: ../bin",
          "---",
          "# path",
          "",
          "```console",
          "$ hellotool",
          "from-hellotool",
          "```",
        ].join("\n"),
      )
      const res = runCli([join(specs, "path.spec.md")], root)
      expect(res.out).toContain("1 block(s), 0 failed")
      expect(res.status).toBe(0)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  test("directory with no *.spec.md fails loud with exit 2", () => {
    const root = mkdtempSync(join(tmpdir(), "mdspec-empty-"))
    try {
      const res = runCli([root], root)
      expect(res.status).toBe(2)
      expect(res.out).toContain("contains no *.spec.md")
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})
