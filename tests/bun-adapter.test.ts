/**
 * @failure Bun Markdown registration drops serial registration or the resolved block timeout.
 * @level l1
 * @consumer #26691 mdspec/bun lazy adapter
 * @testonly none
 */
import { fileURLToPath } from "node:url"
import { expect, test, vi } from "vitest"

const runner = vi.hoisted(() => ({
  load: vi.fn(),
  describeSerial: vi.fn((_name: string, register: () => void) => register()),
  testSerial: vi.fn(),
  beforeAll: vi.fn(),
  afterAll: vi.fn(),
  beforeEach: vi.fn(),
  afterEach: vi.fn(),
}))

vi.mock("bun:test", () => {
  runner.load()
  return {
    describe: { serial: runner.describeSerial },
    test: { serial: runner.testSerial },
    beforeAll: runner.beforeAll,
    afterAll: runner.afterAll,
    beforeEach: runner.beforeEach,
    afterEach: runner.afterEach,
  }
})

const fixture = fileURLToPath(new URL("./fixtures/bun-runner/ordered.spec.md", import.meta.url))

test("Bun adapter registers Markdown tests through serial runner methods", async () => {
  const { registerMdTestFile, registerMdTests } = await import("../src/integrations/bun.js")
  await registerMdTestFile(fixture)
  await registerMdTests([])

  expect(runner.load).toHaveBeenCalledOnce()
  expect(runner.describeSerial.mock.calls.map(([name]) => name)).toEqual([
    "ordered.spec.md",
    "write first",
    "read second",
  ])
  expect(runner.testSerial).toHaveBeenCalledTimes(2)
  expect(runner.testSerial.mock.calls.map(([name]) => name)).toEqual([
    expect.stringContaining("$ printf first > order.txt"),
    expect.stringContaining("$ cat order.txt"),
  ])
  expect(runner.testSerial.mock.calls.map((call) => call[2])).toEqual([5000, 45000])
  expect(runner.beforeAll).toHaveBeenCalledOnce()
  expect(runner.afterAll).toHaveBeenCalledOnce()
})
