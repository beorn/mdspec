import { defineConfig } from "vitepress"

export default defineConfig({
  title: "mdspec",
  description: "Write tests in markdown. Run them as code.",
  base: "/mdtest/",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/mdtest/favicon.svg" }]],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Reference", link: "/reference/cli" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/guide/getting-started" },
          { text: "Pattern Matching", link: "/guide/pattern-matching" },
          { text: "Persistent Context", link: "/guide/persistent-context" },
          { text: "Plugins", link: "/guide/plugins" },
          { text: "Custom Commands", link: "/guide/custom-commands" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "CLI", link: "/reference/cli" },
          { text: "API", link: "/reference/api" },
          { text: "Block Options", link: "/reference/block-options" },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/beorn/mdtest" }],
    footer: { message: "Released under the MIT License." },
    search: { provider: "local" },
  },
})
