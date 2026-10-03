// Wrapper to register mdspec's own .spec.md files with Vitest.
import { registerMdTests, registerMdTestFile } from "../src/integrations/vitest.js"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const testPattern = join(__dirname, "*.spec.md")

await registerMdTests(testPattern)

// @failure Declared long block is cut off by the framework default30s.
// @level l3
// @consumer mdspec Vitest registration (#27244)
await registerMdTestFile(join(__dirname, "fixtures", "timeouts", "declared.slow.spec.md"))
