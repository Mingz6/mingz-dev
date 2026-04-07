import type { Links, Page, Site, Socials } from "@types"

// Global
export const SITE: Site = {
  TITLE: "MingZ",
  DESCRIPTION: "I build bots, AI tools, and smart home automation.",
  AUTHOR: "MingZ",
}

// Blog Page
export const BLOG: Page = {
  TITLE: "Blog",
  DESCRIPTION: "Build log and guides from things I ship.",
}

// Projects Page 
export const PROJECTS: Page = {
  TITLE: "Projects",
  DESCRIPTION: "Side projects and experiments.",
}

// Search Page
export const SEARCH: Page = {
  TITLE: "Search",
  DESCRIPTION: "Search all posts and projects by keyword.",
}

// Links
export const LINKS: Links = [
  { 
    TEXT: "Home", 
    HREF: "/", 
  },
  { 
    TEXT: "Blog", 
    HREF: "/blog", 
  },
  { 
    TEXT: "Projects", 
    HREF: "/projects", 
  },
]

// Socials
export const SOCIALS: Socials = [
  { 
    NAME: "Github",
    ICON: "github",
    TEXT: "Mingz6",
    HREF: "https://github.com/Mingz6"
  },
  { 
    NAME: "LinkedIn",
    ICON: "linkedin",
    TEXT: "mingzhu6",
    HREF: "https://www.linkedin.com/in/mingzhu6/",
  },
]

