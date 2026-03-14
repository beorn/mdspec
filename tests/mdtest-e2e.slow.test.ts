// Wrapper to register mdspec's own .spec.md files with Bun test runner
import { registerMdTests } from "../src/integrations/bun.js"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const testPattern = join(__dirname, "*.spec.md")

await registerMdTests(testPattern)
