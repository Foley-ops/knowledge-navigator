---
concept_id: concept.machine_learning.umap
title: UMAP
slug: /concepts/umap
aliases:
  - uniform manifold approximation and projection
kind: method
tier: 1
review_state: generated-draft
summary: UMAP builds a fuzzy weighted neighbor graph in the input space and optimizes a low-dimensional graph with similar local connectivity for visualization or representation.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.algorithms.graph_algorithms
    note: UMAP constructs and optimizes a weighted nearest-neighbor graph whose edges encode local connectivity.
  - type: assumes
    target: concept.geometry.manifolds
    note: Its motivating derivation treats observations as samples from a locally connected manifold with a locally approximately constant metric.
  - type: contrasts_with
    target: concept.machine_learning.t_sne
    note: UMAP and t-SNE both emphasize local neighborhoods but use different similarity construction, loss functions, and modeling motivation.
  - type: contrasts_with
    target: concept.machine_learning.principal_component_analysis
    note: UMAP is a nonlinear neighbor-graph embedding, whereas PCA gives an explicit linear projection optimized for variance and reconstruction.
sources:
  - source_id: source.mcinnes2018.umap
    title: 'UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction'
    url: https://arxiv.org/abs/1802.03426
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.nicolaescu.geometry_of_manifolds
    title: Lectures on the Geometry of Manifolds
    url: https://academicweb.nd.edu/~lnicolae/Lectures.pdf
    source_kind: authoritative-secondary
    supports:
      - intuition
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Uniform manifold approximation and projection** (**UMAP**) is a nonlinear
dimension-reduction method. It builds a weighted $k$-nearest-neighbor graph in
the input space, interprets its edge weights as degrees of fuzzy local
connectivity, and finds low-dimensional coordinates whose corresponding fuzzy
graph resembles the input graph.

UMAP is commonly used to produce a two-dimensional visualization, but its
output dimension can be larger. It is not itself a clustering algorithm and
does not guarantee preservation of metric distances, densities, topology, or
global geometry in every finite dataset.

## Why it matters

Real data often live in high-dimensional feature spaces while varying along
fewer effective degrees of freedom. A local graph can represent which
observations are neighbors without requiring one global linear coordinate
system. UMAP makes that graph visible and can also provide compact features for
carefully validated downstream use.

The method combines local scaling with a global optimization. Local scaling
helps when the same raw distance has different meaning in crowded and sparse
regions. The optimized map can preserve more large-scale arrangement than a
purely local display in some datasets, but that is an empirical behavior to
check, not an unconditional guarantee.

## Intuition

Give every observation its own adjustable ruler. Use that ruler to decide how
strongly the observation connects to its nearest neighbors, then combine the
one-way neighborhood opinions into one weighted graph. Lay the vertices out on
a sheet so edges with high membership stay short while absent or weak edges
usually stay apart.

The manifold language motivates why local rulers can be combined, but a fitted
UMAP map does not prove that the data truly sample a smooth manifold. Sampling
gaps, noise, discrete branches, and a poor metric can all produce a persuasive
picture with the wrong scientific interpretation.

## Concrete example

Suppose point $i$ has three neighbor distances $1,2,4$. Set its local
connectivity offset to $\rho_i=1$ and, for illustration, local scale
$\sigma_i=2$. The directed membership strength to neighbor $j$ is

$$
v_{j\mid i}=
\exp\left(-\frac{\max(0,d(x_i,x_j)-\rho_i)}{\sigma_i}\right).
$$

The three weights are therefore

$$
1,\qquad e^{-1/2}\approx0.607,\qquad e^{-3/2}\approx0.223.
$$

The closest neighbor receives full membership because the offset removes the
distance to the nearest observed point. If the reverse directed weight from
$j$ to $i$ is $v_{i\mid j}=0.5$, the fuzzy union used to symmetrize the edge is

$$
v_{ij}=v_{j\mid i}+v_{i\mid j}-v_{j\mid i}v_{i\mid j}.
$$

For the middle neighbor this is
$0.607+0.5-(0.607)(0.5)\approx0.804$. The example shows that symmetrization is
not a simple average: strong membership in either direction can preserve an
edge.

## Formal treatment

UMAP first finds approximate nearest neighbors under a chosen metric. For each
point $i$, it chooses a local offset $\rho_i$ and scale $\sigma_i$, with the
scale calibrated from the requested neighbor count, and assigns directed edge
memberships of the exponential form shown above. Directed memberships are
combined by the probabilistic fuzzy union

$$
v_{ij}=v_{j\mid i}+v_{i\mid j}-v_{j\mid i}v_{i\mid j}.
$$

In the output space, a smooth curve models membership as a function of distance:

$$
w_{ij}=\frac{1}{1+a\lVert y_i-y_j\rVert^{2b}},
$$

where $a$ and $b$ are fitted from user-facing distance parameters. The
coordinates minimize a fuzzy-set cross-entropy containing attractive terms for
strong input edges and repulsive terms where output membership is too high.
Practical stochastic optimization samples edges and negative examples rather
than enumerating every absent edge.

The mathematical derivation uses fuzzy simplicial sets and local manifold
metrics. The computational pipeline—neighbor search, weighted graph,
initialization, and stochastic layout—is what determines an actual result.

## Assumptions and requirements

The source's motivating assumptions include approximately uniform sampling from
a [Manifold](./manifolds.md), a locally approximately constant Riemannian metric,
and local connectivity. Applications routinely violate these assumptions, so
the embedding must be treated as exploratory unless task-specific validation
supports more.

Features, metric, missing-data treatment, number of neighbors, output dimension,
and minimum-distance setting all require justification. The neighbor count
controls the scale at which structure is sought; it does not reveal a uniquely
correct scale. Repeated seeds and nearby parameter values are needed to assess
stability.

## Uses and applicability

UMAP is useful for visual inspection of representations, locating duplicate or
unusual samples, exploring whether annotations align with neighborhoods, and
forming hypotheses about continuous trajectories or subgroups. It can serve as
a downstream feature transform only when fitted without leakage and evaluated
for that specific predictive task.

Avoid it when exact distance preservation, calibrated density, or an invertible
scientific coordinate system is required. A two-dimensional map is especially
unsuitable as the sole evidence for a biological lineage, market segment, or
other consequential structure.

## Limitations and common mistakes

UMAP is stochastic and nonconvex. Apparent islands, relative areas, and gaps can
change with seed, initialization, sample composition, or parameters. A dense
patch in the display need not correspond to high density in the input.
Approximate neighbor search introduces another source of variation, especially
when distance contrasts are weak.

Common mistakes include treating axis directions as named latent variables,
selecting a plot after trying many settings without disclosure, clustering the
map as though it were raw data, fitting the transformation on a full dataset
before cross-validation, and equating closer-looking clusters with a measured
semantic relationship. UMAP organizes evidence; it does not certify the story
drawn over it.

## Variants and alternatives

The output dimension, metric, neighbor count, local-connectivity setting, and
minimum distance define useful variants of the same pipeline. Supervised and
semi-supervised extensions can incorporate labels, but then the plot is no
longer evidence that the labels emerged unsupervised.
[t-SNE](./t-sne.md) uses neighbor probabilities and a different divergence;
[Principal Component Analysis](./principal-component-analysis.md) supplies a
deterministic linear baseline with an explicit inverse approximation. Spectral
methods also embed a graph, while autoencoders learn a parametric nonlinear
mapping under a reconstruction objective.

## History and attribution

Leland McInnes, John Healy, and James Melville introduced the method and its
mathematical-computational account in the registered UMAP preprint. That source
connects the construction to Riemannian geometry and algebraic topology while
also specifying the practical algorithm. This draft attributes those claims to
the registered preprint and does not use later software behavior to rewrite the
original method.

## Sources

- McInnes, Healy, and Melville's UMAP paper supports the local metric,
  nearest-neighbor memberships, fuzzy union, low-dimensional objective,
  optimization, empirical uses, limitations, and attribution.
- _Lectures on the Geometry of Manifolds_ supports the manifold and local-metric
  background used to qualify, rather than prove, UMAP's modeling assumptions.

## Prerequisites and next connections

Read [Graph Algorithms](./graph-algorithms.md),
[Manifolds](./manifolds.md), and
[Unsupervised Learning](./unsupervised-learning.md). Compare
[t-SNE](./t-sne.md) for another local visualization and
[Principal Component Analysis](./principal-component-analysis.md) for a linear,
more directly interpretable transform.
