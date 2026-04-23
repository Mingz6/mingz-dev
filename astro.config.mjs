import mdx from "@astrojs/mdx"
import sitemap from "@astrojs/sitemap"
import solidJs from "@astrojs/solid-js"
import tailwind from "@astrojs/tailwind"
import { defineConfig } from "astro/config"
import rehypeExternalLinks from "rehype-external-links"

// https://astro.build/config
export default defineConfig({
  site: "https://mingz.dev",
  redirects: {
    "/blog/01-why-astro": "/blog/why-astro",
    "/blog/02-mcp-teams-chat": "/blog/mcp-teams-chat",
    "/blog/03-gpon-ont-bypass": "/blog/gpon-ont-bypass",
    "/blog/04-docker-to-orbstack": "/blog/docker-to-orbstack",
    "/blog/05-onedrive-junction-sync": "/blog/onedrive-junction-sync",
    "/blog/06-version-drift-standardizer": "/blog/version-drift-standardizer",
    "/blog/07-signalr-sse-websockets": "/blog/signalr-sse-websockets",
    "/blog/08-agent-harness-patterns": "/blog/agent-harness-patterns",
    "/blog/09-multi-agent-orchestration-omo": "/blog/multi-agent-orchestration-omo",
    "/blog/10-voxel-food-vlm-hackathon": "/blog/voxel-food-vlm-hackathon",
  },
  integrations: [
    mdx(),
    sitemap(),
    solidJs(),
    tailwind({ applyBaseStyles: false }),
  ],
  markdown: {
    rehypePlugins: [
      [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
    ],
  },
})