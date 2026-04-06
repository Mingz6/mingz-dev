import { defineConfig } from "astro/config"
import mdx from "@astrojs/mdx"
import tailwind from "@astrojs/tailwind"
import solidJs from "@astrojs/solid-js"

// https://astro.build/config
export default defineConfig({
  site: "https://mingz.dev",
  integrations: [mdx(), solidJs(), tailwind({ applyBaseStyles: false })],
})