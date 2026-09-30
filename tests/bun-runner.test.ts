/**
 * @failure Bun stops collecting tests registered after awaited Markdown discovery.
 * @level l4
 * @consumer #26691 mdspec/bun runner integration
 * @testonly none
 * @cto #26691: Vitest owns this suite; one focused child exercises the Bun
 * test runner because Vitest cannot prove its async test collection semantics.
 */
import { spawnSync } from "node:child_process"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const packageRoot = dirname(fileURLToPath(new URL("../package.json", import.meta.url)))
const fixture = fileURLToPath(new URL("./fixtures/bun-runner/runner.spec.ts", import.meta.url))

test("Bun collects awaited Markdown registration and runs its tests in serial order", () => {
  const result = spawnSync("bun", ["test", fixture], {
    cwd: packageRoot,
    encoding: "utf8",
  })
  const output = result.stdout + result.stderr
  expect(result.error).toBeUndefined()
  expect(result.status, output).toBe(0)
  expect(output).toContain("write first")
  expect(output).toContain("read second")
  expect(output.indexOf("write first")).toBeLessThan(output.indexOf("read second"))
  expect(output).toMatch(/2 pass/)
  expect(output).not.toMatch(/[1-9][0-9]* fail/)
})
