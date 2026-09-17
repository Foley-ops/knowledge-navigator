import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { Config, Plugin, PluginContentLoadedActions } from '@docusaurus/types';
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

  plugins: [
    // The Explore page reads the compiled graph directly rather than calling
    // the API, so browsing keeps working even when the API is down.
    function navigatorGeneratedAliases() {
      const here = dirname(fileURLToPath(import.meta.url));
      return {
        name: 'navigator-generated-aliases',
        configureWebpack: () => ({
          resolve: {
            alias: {
              '@generated-graph': resolve(here, '../../generated/graph.json'),
            },
          },
        }),
      };
    },

    /**
     * One identity route per canonical concept, generated from the compiled
     * graph (v2 runbook M04).
     *
     * Routes are created at build time rather than matched at runtime so that
     * every identity is real static HTML. A client-side catch-all would render
     * correctly after a click and 404 on a direct link or a refresh, which is
     * exactly the case a stable address exists to serve.
     */
    function navigatorIdentityRoutes(): Plugin<unknown> {
      const here = dirname(fileURLToPath(import.meta.url));
      return {
        name: 'navigator-identity-routes',
        async contentLoaded({ actions }: { actions: PluginContentLoadedActions }) {
          const graphPath = resolve(here, '../../generated/graph.json');
          const graph = JSON.parse(await readFile(graphPath, 'utf8')) as {
            nodes: { id: string; slug: string }[];
          };
          for (const node of graph.nodes) {
            // The slug's final segment, never the dotted concept id: a path
            // segment containing dots is read as a file name by ordinary static
            // servers, which then 404 on a direct link.
            const key = node.slug.slice(node.slug.lastIndexOf('/') + 1);
            actions.addRoute({
              path: `/identity/${key}`,
              component: '@site/src/components/IdentityPanel.tsx',
              exact: true,
            });
          }
        },
      };
    },
  ],

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
        { to: '/compare', label: 'Compare', position: 'left' },
        { to: '/path', label: 'Path', position: 'left' },
        // Backlog is deliberately not a top-level item: it is reached from
        // Coverage, which is where a reader learns what a gap means.
        { to: '/coverage', label: 'Coverage', position: 'left' },
        { to: '/workspace', label: 'Workspace', position: 'left' },
        { to: '/about', label: 'About', position: 'right' },
      ],
    },
    footer: {
      style: 'light',
      links: [],
      copyright:
        'Private, local-first, and experimental. Every page is a generated draft until a person checks it against its sources.',
    },
    docs: { sidebar: { hideable: true, autoCollapseCategories: false } },
  } satisfies Preset.ThemeConfig,
};

export default config;
