import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

// Placeholder route required by runbook §4.5. Built out in Phase F.
export default function AboutPage(): ReactNode {
  return (
    <Layout title="About">
      <main>
        <h1>About</h1>
      </main>
    </Layout>
  );
}
