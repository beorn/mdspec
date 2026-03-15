// Bun test integration for .spec.md files
// Usage: Create a wrapper test file that calls registerMdTests()
//
// Example: tests/md.test.ts
// import { registerMdTests } from 'mdspec/bun'
// await registerMdTests('tests/e2e/**/*.spec.md')

import { test, describe, beforeAll, afterAll, beforeEach, afterEach } from "bun:test"
import type { FrameworkAdapter } from "./shared.js"
import {
  registerMdTests as registerMdTestsShared,
  registerMdTestFile as registerMdTestFileShared,
  discoverMdTests,
} from "./shared.js"
import { portableShell } from "../spawn.js"

// Bun adapter: uses describe.serial/test.serial for sequential execution
const bunAdapter: FrameworkAdapter = {
  describe: (name, fn) => describe.serial(name, fn),
  test: (name, fn) => test.serial(name, fn),
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
}

// Re-export discovery API
export { discoverMdTests }

// Register all .spec.md files as Bun tests
export async function registerMdTests(pattern: string | string[] = "**/*.spec.md"): Promise<void> {
  return registerMdTestsShared(bunAdapter, pattern)
}

// Register a single .spec.md file as Bun tests
export async function registerMdTestFile(filePath: string): Promise<void> {
  return registerMdTestFileShared(bunAdapter, filePath)
}

// ============ Shell Adapter ============

/**
 * Execute command via portable spawn (Bun.spawn or Node.js child_process)
 *
 * @param cmd - Command array (e.g., ['bash', '-lc', script])
 * @param opts - Execution options (cwd, env, timeout)
 * @returns Promise<ShellResult> with stdout, stderr, exitCode
 */
export const bunShell = portableShell
