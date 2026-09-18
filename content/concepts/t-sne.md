---
concept_id: concept.machine_learning.t_sne
title: t-SNE
slug: /concepts/t-sne
aliases:
  - t-distributed stochastic neighbor embedding
kind: method
tier: 1
review_state: generated-draft
summary: t-SNE makes a low-dimensional visualization by matching local neighbor probabilities while using a heavy-tailed output distribution to reduce crowding.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: t-SNE represents similarities as conditional and joint probabilities and minimizes a divergence between distributions.
  - type: contrasts_with
    target: concept.machine_learning.principal_component_analysis
    note: PCA preserves directions of linear variance with an explicit map, while t-SNE optimizes a nonlinear neighborhood visualization without a default parametric transform.
  - type: contributes_to
    target: concept.learning.unsupervised_learning
    note: The embedding explores unlabeled neighborhood structure but does not itself validate clusters or predictive relationships.
  - type: contrasts_with
    target: concept.machine_learning.umap
    note: Both create nonlinear neighborhood embeddings, but they define similarities and optimization objectives differently.
sources:
  - source_id: source.vandermaaten2008.tsne
    title: Visualizing Data using t-SNE
    url: https://www.jmlr.org/papers/v9/vandermaaten08a.html
    source_kind: primary-research
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
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**t-distributed stochastic neighbor embedding** (**t-SNE**) is a nonlinear
method for placing high-dimensional observations in two or three dimensions for
visualization. It converts pairwise distances in the input into probabilities
that emphasize local neighbors, converts distances in the map into another
probability distribution, and adjusts the map to minimize the Kullback–Leibler
divergence from the input distribution to the map distribution.

The output is a set of coordinates, not a clustering, density estimate, or
general-purpose metric space. Its strongest promise concerns preservation of
local neighborhoods, not global distance, area, or cluster size.

## Why it matters

High-dimensional observations cannot be inspected directly, and linear
projections can overlap groups that lie on curved or otherwise nonlinear
structure. t-SNE can expose neighborhoods, subgroups, mislabeled examples, and
continuous transitions in a view that a person can examine. It is therefore a
useful exploratory companion to quantitative analysis.

The method also addresses the **crowding problem**. Many moderately distant
neighbors in high dimensions cannot all be placed at comparable distances in a
low-dimensional map. A heavy-tailed output distribution permits moderately
dissimilar points to be modeled far apart without an overwhelming cost, leaving
space for close neighbors.

## Intuition

For every observation, imagine assigning lottery tickets to other observations:
nearby points get many tickets and remote points get few. The map creates a
second ticket allocation from its two-dimensional distances. Optimization moves
the plotted points until important input-neighbor tickets receive similar
weight in the map.

Because the loss is asymmetric, missing a true neighbor is penalized more than
placing unrelated points somewhat too close. This produces readable local
groups but can distort the spaces between groups. Separate islands in a t-SNE
plot are evidence about the fitted visualization, not by themselves proof of
separate populations.

## Concrete example

Suppose point $i$ has squared distances $1$ and $4$ to points $j$ and $k$, and
use input variance $\sigma_i^2=1$. Its unnormalized conditional weights are
$e^{-1/2}$ and $e^{-2}$. Therefore

$$
p_{j\mid i}=\frac{e^{-1/2}}{e^{-1/2}+e^{-2}}\approx0.818,
\qquad
p_{k\mid i}\approx0.182.
$$

Now place the corresponding low-dimensional points at distances $1$ and $3$
from $y_i$. Student-$t$ weights with one degree of freedom are $1/(1+1)=1/2$
and $1/(1+9)=1/10$. Normalizing only this illustrative pair gives

$$
q_{ij}=\frac{1/2}{1/2+1/10}=\frac56\approx0.833,
\qquad
q_{ik}=\frac16\approx0.167.
$$

The map allocates almost the same relative neighbor mass as the input for this
pair. A real t-SNE objective uses symmetrized probabilities and one global
normalization over all ordered pairs, so this calculation illustrates the
local mechanism rather than a complete three-point run.

## Formal treatment

For $i\ne j$, input conditional similarities are

$$
p_{j\mid i}=
\frac{\exp(-\lVert x_i-x_j\rVert^2/(2\sigma_i^2))}
{\sum_{k\ne i}\exp(-\lVert x_i-x_k\rVert^2/(2\sigma_i^2))}.
$$

Each $\sigma_i$ is chosen so that the entropy of this distribution corresponds
to a user-selected perplexity. Symmetrization gives

$$
p_{ij}=\frac{p_{j\mid i}+p_{i\mid j}}{2n}.
$$

For map coordinates $y_i$, t-SNE uses

$$
q_{ij}=
\frac{(1+\lVert y_i-y_j\rVert^2)^{-1}}
{\sum_{k\ne l}(1+\lVert y_k-y_l\rVert^2)^{-1}}
$$

and minimizes

$$
C=\operatorname{KL}(P\Vert Q)=
\sum_{i\ne j}p_{ij}\log\frac{p_{ij}}{q_{ij}}.
$$

Gradient-based optimization commonly uses momentum and an early-exaggeration
phase. The objective is nonconvex, so initialization and optimization details
can affect the final coordinates.

## Assumptions and requirements

Input distances must express relevant neighborhood similarity. Features need
appropriate encoding and scaling, and very noisy dimensions may need removal
using a training-independent or carefully validated step such as
[Principal Component Analysis](./principal-component-analysis.md). Perplexity
must be smaller than the sample count and should reflect the neighborhood scale
of interest.

The analysis requires enough repeated runs and parameter sensitivity checks to
distinguish stable neighborhoods from optimization artifacts. Any preprocessing
and hyperparameter selection should be disclosed. The method also assumes that
a two- or three-dimensional visualization is the goal; it should not be chosen
merely because downstream code expects vectors.

## Uses and applicability

Use t-SNE to inspect learned representations, compare whether known labels are
locally coherent, find near-duplicate or suspicious examples, and generate
hypotheses about substructure. Color or annotate points using metadata only
after the unsupervised map is built when that distinction matters to the study.

Do not use plotted separation alone to estimate a cluster count, and do not
measure scientific effect sizes from inter-island distances. For prediction,
fit and evaluate the predictive model itself. For a reusable linear transform,
PCA is more appropriate.

## Limitations and common mistakes

t-SNE can distort global geometry, relative group sizes, and between-group
distances. Different random seeds can rotate, split, merge, or rearrange visible
islands. The objective has no requirement to preserve density, and a visually
dense patch need not represent a denser input population. Standard t-SNE also
does not directly provide coordinates for unseen observations.

Common mistakes include treating axes as interpretable features, running once,
choosing perplexity after seeing desired labels, reading empty space as measured
separation, clustering the visualization without checking the original space,
and comparing two plots by their absolute orientation. Attractive geometry is
not a validation statistic.

## Variants and alternatives

The original stochastic neighbor embedding used Gaussian similarities in both
spaces; t-SNE's heavy-tailed output is the defining change that reduces
crowding. Barnes–Hut and interpolation-based implementations improve scale but
are computational approximations whose settings should be reported.
[UMAP](./umap.md) is another neighborhood visualization with a different graph
construction and objective. PCA preserves a global linear subspace and gives an
explicit transform. Spectral embeddings connect visualization to graph
eigenvectors.

## History and attribution

Laurens van der Maaten and Geoffrey Hinton introduced t-SNE in the registered
2008 Journal of Machine Learning Research paper. Their contribution replaced
the low-dimensional Gaussian similarity of earlier stochastic neighbor
embedding with a heavy-tailed Student distribution and analyzed the resulting
crowding behavior. The paper is the primary basis for the definitions,
objective, and attribution on this page.

## Sources

- van der Maaten and Hinton's primary paper supports the probability
  construction, perplexity, heavy-tailed map, objective, optimization, examples,
  limitations, and historical attribution.
- _The Elements of Statistical Learning_ supports the broader dimensionality-
  reduction setting and the cautions involved in interpreting exploratory
  unsupervised representations.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) for conditional distributions
and divergence, [Unsupervised Learning](./unsupervised-learning.md) for honest
evaluation, and [Principal Component Analysis](./principal-component-analysis.md)
for the linear baseline. Then compare [UMAP](./umap.md) and
[Spectral Clustering](./spectral-clustering.md), keeping visualization and
clustering as distinct tasks.
