import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/**
 * Knowledge Navigator reading surface.
 *
 * Canonical Markdown lives outside this workspace, in content/concepts/, and is
 * the authority for everything the site shows. The sidebar is generated.
 *
 * No externally hosted font, script, analytics or image asset is referenced
 * anywhere in this configuration (runbook §4.5).
 */
const config: Config = {
  title: 'Knowledge Navigator',
  tagline: 'Understand unfamiliar ideas, expose assumptions, find a defensible next move.',
  favicon: 'img/favicon.svg',

  // Local-only service. These values exist because Docusaurus requires them;
  // nothing is ever deployed to a public origin by this project.
  url: 'http://127.0.0.1',
  baseUrl: '/',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  onDuplicateRoutes: 'throw',

  markdown: {
    // `detect` parses .md as CommonMark and only .mdx as MDX, so canonical
    // Markdown can never execute an import or evaluate embedded JSX.
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
      onBrokenMarkdownImages: 'throw',
    },
  },

  i18n: { defaultLocale: 'en', locales: ['en'] },

  presets: [
    [
      'classic',
      {
        docs: {
          path: '../../content/concepts',
          // Site root: canonical frontmatter slugs are absolute `/concepts/<name>`
          // paths and Docusaurus resolves `slug` relative to routeBasePath, so the
          // docs plugin is mounted at `/` to reproduce them exactly.
          routeBasePath: '/',
          sidebarPath: './sidebars.generated.ts',
          showLastUpdateTime: false,
          showLastUpdateAuthor: false,
          breadcrumbs: true,
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        pages: {},
        theme: { customCss: './src/css/custom.css' },
        sitemap: false,
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: { defaultMode: 'light', respectPrefersColorScheme: true },
    navbar: {
      title: 'Knowledge Navigator',
      items: [
        { to: '/explore', label: 'Explore', position: 'left' },
        { to: '/search', label: 'Search', position: 'left' },
        { to: '/ask', label: 'Ask', position: 'left' },
        { to: '/about', label: 'About', position: 'right' },
      ],
    },
    footer: { style: 'light', links: [] },
    docs: { sidebar: { hideable: true, autoCollapseCategories: false } },
  } satisfies Preset.ThemeConfig,
};

export default config;
