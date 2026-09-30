// vendor-kit: publish-shebang@f4e14dc86a6f — generated; edit km/packages/km-infra/vendor-kit/templates/publish-shebang.ts.tmpl in km, then re-sync
// Stamp each packed bin with the interpreter its manifest promises (hh #26691, @cto d7f039e2). The rule is
// verify-publishable's binShebangRuntime, imported from this repository's pinned devDependency, so it has one home;
// this script only applies it to the built files. Run it after the build, from the package directory:
//   bun scripts/publish-shebang.ts
import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const SHEBANG = { node: "#!/usr/bin/env node", bun: "#!/usr/bin/env bun" } as const

async function rule(): Promise<(engines: unknown) => keyof typeof SHEBANG> {
  let runtime: { binShebangRuntime?: unknown }
  try {
    runtime = await import("verify-publishable/runtime")
  } catch (error) {
    throw new Error(
      "PUBLISH_SHEBANG_RULE_MISSING: the pinned verify-publishable does not export ./runtime; move its pin to a commit " +
        `that does (7657e6b or later). cause=${error instanceof Error ? error.message : String(error)}`,
    )
  }
  if (typeof runtime.binShebangRuntime !== "function") {
    throw new Error("PUBLISH_SHEBANG_RULE_MISSING: verify-publishable/runtime has no binShebangRuntime export")
  }
  return runtime.binShebangRuntime as (engines: unknown) => keyof typeof SHEBANG
}

interface Manifest {
  name?: string
  engines?: unknown
  bin?: unknown
  publishConfig?: { bin?: unknown }
}

function bins(manifest: Manifest): Array<[string, string]> {
  const declared = manifest.publishConfig?.bin ?? manifest.bin
  if (declared === undefined) return []
  if (typeof declared === "string") return [[String(manifest.name).split("/").at(-1) ?? "", declared]]
  if (declared === null || typeof declared !== "object" || Array.isArray(declared)) {
    throw new Error(`PUBLISH_SHEBANG_BIN_INVALID: package=${manifest.name} bin=${JSON.stringify(declared)}`)
  }
  return Object.entries(declared).map(([name, target]) => {
    if (typeof target !== "string" || target === "") {
      throw new Error(
        `PUBLISH_SHEBANG_BIN_INVALID: package=${manifest.name} bin=${name} target=${JSON.stringify(target)}`,
      )
    }
    return [name, target]
  })
}

const packageDir = process.argv[2] ?? process.cwd()
const manifest = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8")) as Manifest
const declared = bins(manifest)
if (declared.length === 0) {
  process.stdout.write(`publish-shebang: ${manifest.name} declares no bin; nothing stamped\n`)
} else {
  const shebang = SHEBANG[(await rule())(manifest.engines)]
  for (const [name, target] of declared) {
    const path = join(packageDir, target)
    if (!existsSync(path)) {
      throw new Error(
        `PUBLISH_SHEBANG_TARGET_MISSING: package=${manifest.name} bin=${name} target=${target}; build first`,
      )
    }
    const content = readFileSync(path, "utf8")
    const newline = content.indexOf("\n")
    const firstLine = newline === -1 ? content : content.slice(0, newline)
    const next = firstLine.startsWith("#!")
      ? shebang + (newline === -1 ? "\n" : content.slice(newline))
      : `${shebang}\n${content}`
    if (next === content) {
      process.stdout.write(`publish-shebang: ${manifest.name} bin ${name} (${target}) already ${shebang}\n`)
      continue
    }
    writeFileSync(path, next)
    process.stdout.write(`publish-shebang: ${manifest.name} bin ${name} (${target}) stamped ${shebang}\n`)
  }
}
