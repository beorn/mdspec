import { parseInfo } from "./core.js"
import { findNearestHeading } from "./markdown.js"
import type { CodeBlock, Heading } from "./markdown.js"
import type { PluginExecutor } from "./plugin-executor.js"

export const LIFECYCLE_KINDS = ["beforeAll", "afterAll", "beforeEach", "afterEach"] as const
export type LifecycleKind = (typeof LIFECYCLE_KINDS)[number]

export function isLifecycleKind(lang: string | null): lang is LifecycleKind {
  return lang !== null && LIFECYCLE_KINDS.includes(lang as LifecycleKind)
}

export async function executeLifecycleFences(
  executor: PluginExecutor,
  codeBlocks: CodeBlock[],
  headings: Heading[],
  kind: LifecycleKind,
  onReset?: () => void,
): Promise<void> {
  for (const block of codeBlocks) {
    if (block.lang !== kind) continue

    if (parseInfo(block.meta ?? "").reset) onReset?.()

    const heading = findNearestHeading(headings, block.position.start)
    const result = await executor.executeBlock(
      {
        lang: kind,
        info: block.meta ?? "",
        text: block.value,
      },
      heading,
    )
    if (!result) throw new Error(`No plugin handles the ${kind} lifecycle fence`)
    if (result.exitCode === null || result.exitCode === 0) continue

    const stdout = result.results.flatMap((entry) => entry.stdout).join("\n")
    const stderr = result.results.flatMap((entry) => entry.stderr).join("\n")
    const detail = [stderr, stdout].filter(Boolean).join("\n")
    throw new Error(`${kind} lifecycle fence failed with exit ${result.exitCode}${detail ? `:\n${detail}` : ""}`)
  }
}
