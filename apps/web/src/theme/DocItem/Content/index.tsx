import type { ReactNode } from 'react';
import Content from '@theme-original/DocItem/Content';
import type ContentType from '@theme/DocItem/Content';
import type { WrapperProps } from '@docusaurus/types';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { ConceptFooter, ConceptProvenance } from '@site/src/components/ConceptMeta';
import { readConceptFrontmatter } from '@site/src/lib/concept-frontmatter';

type Props = WrapperProps<typeof ContentType>;

/**
 * A canonical concept page is more than its Markdown: provenance goes above the
 * prose, and relationships, neighbourhood and sources go below it.
 */
export default function ContentWrapper(props: Props): ReactNode {
  const { frontMatter } = useDoc();
  const concept = readConceptFrontmatter(frontMatter);

  if (concept === undefined) return <Content {...props} />;

  return (
    <>
      <ConceptProvenance concept={concept} />
      <Content {...props} />
      <ConceptFooter concept={concept} />
    </>
  );
}
