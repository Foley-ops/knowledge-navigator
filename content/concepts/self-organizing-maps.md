---
concept_id: concept.deep_learning.self_organizing_maps
title: Self-Organizing Maps
slug: /concepts/self-organizing-maps
aliases:
  - Kohonen map
  - Kohonen network
kind: algorithm
tier: 1
review_state: generated-draft
summary: A self-organizing map fits a fixed low-dimensional grid of prototype vectors to high-dimensional data by competitive learning, so that neighbouring grid cells come to hold similar prototypes and the grid becomes a coarse, reusable map of the data.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: specializes
    target: concept.machine_learning.k_means
    note: A SOM is online k-means with prototypes tied to a fixed lattice and neighbours dragged along with the winner; shrinking the neighbourhood radius to zero recovers online k-means exactly.
  - type: contrasts_with
    target: concept.machine_learning.t_sne
    note: Both produce a two-dimensional picture of high-dimensional data, but a SOM commits in advance to a fixed grid of prototypes while t-SNE places every individual point freely to match neighbourhood probabilities.
  - type: contrasts_with
    target: concept.machine_learning.umap
    note: UMAP is the tool most researchers now reach for when they want the two-dimensional layout, and unlike a SOM it optimises an explicit objective over a graph of the data rather than a fixed lattice.
  - type: contrasts_with
    target: concept.deep_learning.autoencoders
    note: An autoencoder also learns a low-dimensional code without labels, but by gradient descent on a reconstruction loss into a continuous latent space rather than by competitive assignment to discrete lattice cells.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.vandermaaten2008.tsne
    title: Visualizing Data using t-SNE
    url: https://www.jmlr.org/papers/v9/vandermaaten08a.html
    source_kind: primary-research
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mcinnes2018.umap
    title: 'UMAP: Uniform Manifold Approximation and Projection for Dimension Reduction'
    url: https://arxiv.org/abs/1802.03426
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Kohonen's original self-organizing map papers, and the earlier von der Malsburg and Willshaw models of cortical map formation
    reason: The registry holds no Kohonen reference and no source on the neurobiological modelling the algorithm came out of, so the attribution here rests on uncited knowledge.
    sections:
      - history-and-attribution
  - label: The theoretical literature on SOM convergence and energy functions, including the one-dimensional convergence results and the repaired winner rule
    reason: No registry source covers the theoretical analysis of the SOM, and these are precisely the claims the page makes about what is and is not proved.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **self-organizing map** is an unsupervised algorithm that fits $K$ prototype
vectors to a data set while tying them to a low-dimensional lattice — almost
always a two-dimensional rectangular or hexagonal grid, fixed before training.
Each sample selects its nearest prototype, the **best-matching unit**, and then
that prototype _and its neighbours on the lattice_ move toward the sample, by an
amount falling off with lattice distance and shrinking over time. The lattice is
not learned; what is learned is which region of the data space each cell owns.

## Why it matters

A SOM produces a clustering and a layout at once, and the layout is a fixed
object you can reuse: the cells mean the same thing next month, so two cohorts
or two time windows can be compared on one panel cell by cell — something a
freshly fitted t-SNE plot cannot give, its coordinates carrying no meaning
across runs. Projecting a new point costs one nearest-prototype search, so a map
fitted once serves as an online monitor, and training is a streaming update with
$O(Kp)$ memory however many points arrive.

## Intuition

Picture a fishing net thrown into a cloud of data: the knots are prototypes, the
strings are the lattice. Each point tugs the nearest knot toward itself, and
because the knots are tied together the tug drags its neighbours partway along.
Early on the strings are stiff — a wide neighbourhood — so the net moves as one
sheet and finds the gross shape of the cloud; as the radius decays the strings
slacken and each knot settles into its own pocket.

The analogy breaks twice: a real net cannot pass through itself, and it resists
stretching. This one can fold through itself with no restoring force to undo the
fold, and its only coupling decays to nothing.

## Concrete example

Five units on a one-dimensional chain with lattice coordinates $1,\dots,5$ and
prototypes in the plane:

$$
m_1 = (0.0,\, 0.0),\;\; m_2 = (0.5,\, 0.2),\;\; m_3 = (1.0,\, 0.0),\;\;
m_4 = (1.5,\, -0.2),\;\; m_5 = (2.0,\, 0.0).
$$

Present $x = (1.2,\, 0.6)$. Squared distances are $1.80,\, 0.65,\, 0.40,\,
0.73,\, 1.00$, so unit $3$ wins. With $\alpha = 0.5$ and Gaussian width $\sigma
= 1$ the neighbourhood weights are $h = (0.135,\, 0.607,\, 1,\, 0.607,\, 0.135)$
and every prototype moves:

$$
m_1 = (0.081,\, 0.041),\;\; m_2 = (0.712,\, 0.321),\;\; m_3 = (1.100,\, 0.300),\;\;
m_4 = (1.409,\, 0.043),\;\; m_5 = (1.946,\, 0.041).
$$

Units $1$ and $5$ moved by the same fraction of their displacement, $0.5 \times
0.135$, even though $m_5$ is closer to $x$ than $m_1$ is. Data distance
picks the winner; lattice distance distributes the update.

```python
import numpy as np

lattice = np.arange(5)[:, None]
M = np.array([[0.0, 0.0], [0.5, 0.2], [1.0, 0.0], [1.5, -0.2], [2.0, 0.0]])

def step(M, x, alpha, sigma):
    c = np.argmin(((M - x) ** 2).sum(axis=1))        # best-matching unit
    d2 = ((lattice - lattice[c]) ** 2).sum(axis=1)   # distance on the lattice
    h = np.exp(-d2 / (2 * sigma ** 2))
    return M + alpha * h[:, None] * (x - M)

M = step(M, np.array([1.2, 0.6]), alpha=0.5, sigma=1.0)
```

## Formal treatment

Let the data be $x \in \mathbb{R}^p$ and let prototypes $m_k \in \mathbb{R}^p$,
$k = 1,\dots,K$, sit at fixed lattice coordinates $r_k \in \mathbb{Z}^2$. The
best-matching unit for $x$ is $c(x) = \arg\min_{k} \lVert x - m_k \rVert$, and
the online update, applied to **every** prototype on presentation of $x$ at step
$t$, is

$$
m_k \;\leftarrow\; m_k \;+\; \alpha(t)\, h_{\sigma(t)}\!\left(r_{c(x)},\, r_k\right)\,
\left(x - m_k\right),
\qquad
h_{\sigma}(r, r') = \exp\!\left(-\frac{\lVert r - r' \rVert^2}{2\sigma^2}\right).
$$

The "bubble" neighbourhood $h_\sigma(r,r') = \mathbb{1}[\lVert r - r'\rVert \le
\sigma]$ is equally common. Both $\alpha(t)$ and $\sigma(t)$ decay monotonically
— typically $\alpha$ from about $1$ toward $0$, and $\sigma$ from roughly the
lattice diameter down to one cell, over some thousands of updates. As $\sigma
\to 0$ the weight becomes $\mathbb{1}[k = c(x)]$ and the rule is exactly online
k-means: the neighbourhood strength is the knob setting how rigid the lattice
constraint is.

The batch form averages over the data set,

$$
m_k \;=\; \frac{\sum_i h_{\sigma}\!\left(r_{c(x_i)}, r_k\right) x_i}
{\sum_i h_{\sigma}\!\left(r_{c(x_i)}, r_k\right)} ,
$$

iterated with $\sigma$ decayed between sweeps. This resembles alternating
minimisation of the distortion $E = \sum_i \sum_k h_\sigma(r_{c(x_i)}, r_k)
\lVert x_i - m_k \rVert^2$: the averaging step does minimise $E$ over the
prototypes, but the assignment takes the _nearest_ prototype rather than the
index $j$ minimising $\sum_k h_\sigma(r_j, r_k)\lVert x_i - m_k\rVert^2$, so $E$
need not decrease. Redefining the winner as that minimiser makes batch SOM a
genuine alternating minimisation, at the cost of a dearer assignment step.

For the online rule with the standard winner no such objective exists: for
continuous input distributions the update is not stochastic gradient descent on
any energy function. Almost-sure convergence and ordering have been proved for a
one-dimensional chain with one-dimensional input; the multidimensional case has
no general convergence theorem. That is a gap in the theory, not in this
exposition.

## Assumptions and requirements

The winner is chosen by Euclidean distance, so features must be on comparable
scales: an unstandardised variable with a wide range dominates every assignment
and the map ends up encoding it alone. A meaningful metric on the raw features
is assumed — categorical or mixed data needs an encoding first.

The lattice dimension must be no less than the intrinsic dimension you care
about. Data on an intrinsically three-dimensional manifold cannot be laid on a
two-dimensional lattice without folding or tearing, which is where topology
preservation loses any guarantee.

The schedules matter. If $\sigma(t)$ shrinks before the map has globally
ordered, topological defects — kinks where the sheet crosses itself — freeze in,
the coupling that could undo them being gone. If $\alpha(t)$ does not decay
toward zero the prototypes never settle. And $K$, the grid shape and the
initialisation are chosen by hand.

## Uses and applicability

Reach for a SOM when the fixed panel is the point: monitoring a process where a
cell must mean the same thing across months, comparing groups on a shared
layout, bucketing a corpus into retrievable cells, or handling a stream. Each
cell also hands back a prototype in the original units, which a domain expert
can read.

Do not reach for it when the goal is a faithful exploratory picture of local
neighbourhood structure in a fixed data set — that is what t-SNE and UMAP are
built for — nor when you need a likelihood, a density or principled model
selection. And do not use it where plain k-means would serve: the lattice
constraint costs distortion, and you should be buying something with that cost.

## Limitations and common mistakes

**"Topology preserving" is a description, not a theorem.** Nothing guarantees
that lattice neighbours end up near each other in data space, or that nearby
data map to nearby cells; folds are common and depend on initialisation and
schedule. Measure it: the _topographic error_, the fraction of samples whose
best and second-best units are not lattice-adjacent, belongs beside the
quantisation error in any report.

**No objective is being minimised, so the usual tooling does not apply.** You
cannot pick the grid size by comparing final objective values, there is no
convergence criterion to stop on, and two seeds can give genuinely different
maps. Comparing reconstruction error against k-means is diagnosis, not model
selection.

**Distance on the map is not distance in the data.** Adjacent cells can sit far
apart wherever the sheet stretches across a gap between clusters, so reading
cluster boundaries straight off the grid is the commonest misreading; the
U-matrix, shading each cell by the average distance from its prototype to its
lattice neighbours', exists to show those gaps. The axes carry no individual
meaning either.

**It is not a supervised network.** No labels, no backpropagation, no loss;
calling the prototypes "weights" invites the wrong model of what happens.

That t-SNE and UMAP give better exploratory pictures is a community-level
empirical judgement, not a proved superiority.

## Variants and alternatives

**Batch SOM** trades the online character for determinism and speed.
**Hexagonal lattices** give every cell six equidistant neighbours, so the
neighbourhood decays isotropically; **toroidal lattices** wrap the edges,
removing the boundary effect that crowds prototypes at the rim. **Growing** and
**hierarchical** variants add cells where distortion is high rather than fixing
$K$ in advance. **Neural gas** drops the lattice and ranks prototypes by distance
in the data space, adapting better to irregular manifolds but giving up the fixed
layout that makes a SOM a map. The **Generative Topographic Mapping** replaces
the heuristic with a latent-variable model fitted by EM, buying a likelihood, a
convergence guarantee and model selection at the price of a Gaussian noise
assumption and heavier computation.

Among genuinely different approaches: PCA gives a linear projection with
interpretable axes but cannot bend around a curved manifold; t-SNE matches
neighbourhood probabilities in high and low dimensions and resolves local
cluster structure far better, at the cost of unstable global geometry and no
projection for new points; UMAP does something comparable through a fuzzy
neighbourhood graph, faster and with a transform for new data; autoencoders
learn a continuous code end to end and scale, but give no layout unless the code
is held to two dimensions.

## History and attribution

The algorithm is Teuvo Kohonen's, developed in Finland and published in the
early 1980s, which is why it is still called a Kohonen map. His problem was not
visualisation but a question from neuroscience: how ordered cortical maps —
retinotopic, tonotopic, orientation columns — could arise from initially
disordered connections under purely local learning. Models of that
self-organisation had been proposed in the 1970s by Christoph von der Malsburg,
and by David Willshaw with him. Kohonen's contribution was to strip such a model
to a minimal, cheap rule — pick a winner, pull a neighbourhood — and to
recognise the result as a general data analysis tool. It became one of the most
widely applied neural network methods of the 1990s.

## Sources

_The Elements of Statistical Learning_ is the best single reference here: its
section on self-organizing maps gives the online and batch updates, the decay
schedules, the framing of the SOM as a constrained k-means, and the advice to
compare reconstruction error against unconstrained k-means. The **t-SNE** and
**UMAP** papers are cited only as the authoritative descriptions of their own
methods. The convergence results and the attribution are flagged in
`unresolved_references`: no registry source covers them.

## Prerequisites and next connections

Read [k-Means](./k-means.md) first; nearly everything structural about a SOM is
clearer as a modification of it, and the $\sigma \to 0$ limit is literally
k-means. [Unsupervised Learning](./unsupervised-learning.md) sets the wider frame.

From here, [t-SNE](./t-sne.md) and [UMAP](./umap.md) repay reading against this
page: both optimise an explicit neighbourhood-matching objective, exactly what
the SOM lacks. [Principal Component Analysis](./principal-component-analysis.md)
is the linear baseline, and [Autoencoders](./autoencoders.md) the
gradient-trained route to the same goal.
[Hopfield Networks](./hopfield-networks.md) are a counterpoint from the same era:
a network whose dynamics _do_ descend an explicit energy function, the guarantee
the SOM never got.
