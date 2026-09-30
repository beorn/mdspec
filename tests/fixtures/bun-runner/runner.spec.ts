/**
 * @failure The Bun runner cannot collect tests from an awaited mdspec registration.
 * @level l4
 * @consumer #26691 mdspec/bun runner integration
 * @testonly none
 * @cto #26691: exercised only by the focused Bun runner child of a Vitest test.
 */
import { fileURLToPath } from "node:url"
import { registerMdTests } from "../../../src/integrations/bun.js"

await registerMdTests([fileURLToPath(new URL("./ordered.spec.md", import.meta.url))])
await registerMdTests([])
