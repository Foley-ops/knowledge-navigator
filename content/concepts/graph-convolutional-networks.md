---
concept_id: concept.deep_learning.graph_convolutional_networks
title: Graph Convolutional Networks
slug: /concepts/graph-convolutional-networks
aliases:
  - GCN
kind: method
tier: 1
review_state: generated-draft
summary: The architecture that made graph learning ordinary — a single sparse matrix multiply per layer, obtained by truncating a spectral filter on the graph Laplacian to first order and renormalising it with self-loops.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: specializes
    target: concept.deep_learning.message_passing
    note: A GCN layer is the message-passing scheme with the message fixed to a symmetrically degree-normalised copy of the neighbour's state and the update fixed to one shared linear map, so it has no per-edge parameters at all.
  - type: requires
    target: concept.linear_algebra.spectral_theory
    note: The layer is derived by diagonalising the normalised graph Laplacian and truncating a function of its eigenvalues, and the argument for the self-loop renormalisation is entirely about where the propagation matrix's spectrum sits.
  - type: contrasts_with
    target: concept.deep_learning.graph_attention_networks
    note: Both aggregate over the same neighbourhoods, but GCN fixes each neighbour's weight from degrees alone while attention learns it from the pair of feature vectors, buying anisotropy at the cost of parameters and a harder optimisation.
  - type: contributes_to
    target: concept.deep_learning.geometric_deep_learning
    note: GCN is the worked graph case of the permutation-equivariance blueprint, and is the example that showed a symmetry-derived layer could be cheap enough to be a default.
sources:
  - source_id: source.kipf2017.graph_convolutional_networks
    title: Semi-Supervised Classification with Graph Convolutional Networks
    url: https://arxiv.org/abs/1609.02907
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.vonluxburg2007.spectral_clustering
    title: A Tutorial on Spectral Clustering
    url: https://arxiv.org/abs/0711.0189
    source_kind: preprint
    supports:
      - intuition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.xu2019.how_powerful_are_gnns
    title: How Powerful are Graph Neural Networks?
    url: https://arxiv.org/abs/1810.00826
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - why-it-matters
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: 'The spectral lineage: Hammond, Vandergheynst and Gribonval (wavelets on graphs, Chebyshev approximation), Bruna et al. (Spectral Networks), Defferrard, Bresson and Vandergheynst (ChebNet)'
    reason: The registry has no entry for any of these, so this page''s account of the Chebyshev truncation and of what ChebNet does follows Kipf and Welling''s summary of them rather than the primary papers.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
  - label: 'The over-smoothing literature: Li, Han and Wu, Deeper Insights into Graph Convolutional Networks (2018); Oono and Suzuki, Graph Neural Networks Exponentially Lose Expressive Power (2020)'
    reason: No registered source names or proves over-smoothing. The spectral argument given here is elementary linear algebra applied to the propagation matrix, and the empirical depth finding is Kipf and Welling''s, but the named result and its exponential rate are uncited.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: 'Wu et al., Simplifying Graph Convolutional Networks (2019), and Shchur et al., Pitfalls of Graph Neural Network Evaluation (2018)'
    reason: The claims that the renormalised operator is best read as a fixed low-pass filter, and that tuned simple baselines are closer to GCN than the original citation-network table suggests, come from these papers and from no source cited here.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

A **graph convolutional network** is a neural network whose layer is the single
propagation rule

$$
H^{(l+1)} = \sigma\!\left(\hat{A} H^{(l)} W^{(l)}\right),
\qquad
\hat{A} = \tilde{D}^{-1/2}\tilde{A}\tilde{D}^{-1/2},
\qquad
\tilde{A} = A + I_N ,
$$

where $A \in \mathbb{R}^{N\times N}$ is the adjacency matrix of a graph on $N$
nodes, $\tilde{D}_{ii} = \sum_j \tilde{A}_{ij}$, $H^{(l)} \in
\mathbb{R}^{N\times C_l}$ holds one row per node, $W^{(l)} \in
\mathbb{R}^{C_l \times C_{l+1}}$ is shared by every node, and $\sigma$ is an
elementwise nonlinearity. $H^{(0)} = X$, the input node features. Three pieces
do three separate jobs: $A$ routes information along edges, $I_N$ adds a
self-loop so a node keeps its own state, and the two $\tilde{D}^{-1/2}$ factors
normalise symmetrically so that a high-degree node neither shouts nor is shouted
at.

## Why it matters

Before this rule, a spectral graph filter meant eigendecomposing an $N\times N$
Laplacian — $O(N^3)$ once, and $O(N^2)$ per forward pass to multiply by the
dense eigenvector matrix — and it produced filters that were not localised, so a
"filter" on a citation network could couple two papers with nothing between them.
The GCN layer is one sparse matrix product, $O(|\mathcal{E}| C_l C_{l+1})$, with
$|\mathcal{E}|$ the edge count, and its receptive field is exactly one hop per
layer. That collapse in cost is why GCN is still the baseline every new graph
architecture is measured against, and it is the cleanest worked example in
geometric deep learning of a layer derived from a symmetry — permutation of the
node labels — rather than chosen by taste.

## Intuition

The picture to carry is a **weighted local average, applied once per layer**.
Each node replaces its feature vector with a degree-weighted mean of its own
vector and its neighbours', then passes the result through one shared linear map.
Stack two layers and information travels two hops.

The spectral reading says the same thing in the frequency domain. The normalised
Laplacian's quadratic form $x^\top L x = \tfrac{1}{2}\sum_{ij} A_{ij}(x_i/\sqrt{d_i} -
x_j/\sqrt{d_j})^2$ measures how much a signal disagrees across edges, so small
eigenvalues mark signals that vary smoothly over the graph and large ones mark
signals that alternate. The propagation matrix $\hat{A}$ shrinks the
large-eigenvalue components and keeps the small ones: a low-pass filter on the
graph.

The analogy to image convolution is where people go wrong. A GCN layer has one
weight matrix for the whole neighbourhood, not one tap per offset, because a
graph has no "the neighbour above". It cannot learn an edge detector, and it
cannot weight one neighbour differently from another except through their
degrees. It is closer to a fixed blur than to a learned filter bank.

## Concrete example

Take the graph with edges $\{1\text{–}2,\ 1\text{–}3,\ 2\text{–}3,\
3\text{–}4\}$: a triangle with a pendant node. Degrees are $(2,2,3,1)$, and with
self-loops $\tilde{d} = (3,3,4,2)$. The propagation matrix is

$$
\hat{A} = \begin{bmatrix}
0.3333 & 0.3333 & 0.2887 & 0 \\
0.3333 & 0.3333 & 0.2887 & 0 \\
0.2887 & 0.2887 & 0.2500 & 0.3536 \\
0 & 0 & 0.3536 & 0.5000
\end{bmatrix}.
$$

Now compare spectra. The un-renormalised operator $I_N + D^{-1/2}AD^{-1/2}$ has
eigenvalues $(0.271,\ 0.500,\ 1.229,\ 2.000)$ — a spectral radius of $2$, so
repeated application grows a signal. After the renormalisation, $\hat{A}$ has
eigenvalues $(-0.148,\ 0.000,\ 0.564,\ 1.000)$: radius exactly $1$, nothing
explodes, and the negative end has been pulled well away from $-1$.

Push the one-hot signal $x = (1,0,0,0)^\top$ through repeatedly and the
over-smoothing is visible in a dozen steps:

```python
import math
A  = [[0,1,1,0],[1,0,1,0],[1,1,0,1],[0,0,1,0]]
At = [[A[i][j] + (i == j) for j in range(4)] for i in range(4)]
dt = [sum(row) for row in At]
Ah = [[At[i][j] / math.sqrt(dt[i]*dt[j]) for j in range(4)] for i in range(4)]
mv = lambda M, v: [sum(M[i][j]*v[j] for j in range(4)) for i in range(4)]

v = [1.0, 0.0, 0.0, 0.0]
for _ in range(12):
    v = mv(Ah, v)
# v -> [0.2502, 0.2502, 0.2886, 0.2038]
```

The direction $(0.500, 0.500, 0.577, 0.408)$ is exactly $\tilde{D}^{1/2}\mathbf{1}$
normalised. After a dozen hops the signal remembers only the degrees, not which
node it started at. One layer reaches node 2 and 3; two reach node 4; twelve
reach a fixed point that carries no information.

## Formal treatment

Let $L = I_N - D^{-1/2}AD^{-1/2} = U\Lambda U^\top$ be the symmetric normalised
Laplacian, $U$ its orthonormal eigenvectors and $\Lambda = \mathrm{diag}(\lambda_1,
\dots,\lambda_N)$ with $0 = \lambda_1 \le \dots \le \lambda_N \le 2$. The **graph
Fourier transform** of a signal $x\in\mathbb{R}^N$ is $\hat{x} = U^\top x$, and a
spectral convolution with filter $g_\theta$ is defined as multiplication in that
basis:

$$
g_\theta \star x = U\, g_\theta(\Lambda)\, U^\top x .
$$

Approximate $g_\theta$ by a truncated Chebyshev expansion, $g_{\theta'}(\Lambda)
\approx \sum_{k=0}^{K}\theta'_k T_k(\tilde\Lambda)$ with $\tilde\Lambda =
\tfrac{2}{\lambda_N}\Lambda - I_N$ and $T_k$ the Chebyshev polynomials. Because
$U T_k(\tilde\Lambda) U^\top = T_k(\tilde L)$, the $U$ disappears and the filter
becomes a degree-$K$ polynomial in $L$ — hence $K$-localised, since
$(L^k)_{ij} = 0$ whenever $i$ and $j$ are more than $k$ hops apart.

Now take $K = 1$ and approximate $\lambda_N \approx 2$, so $\tilde{L} = L - I_N =
-D^{-1/2}AD^{-1/2}$:

$$
g_{\theta'} \star x \approx \theta'_0 x - \theta'_1 D^{-1/2}AD^{-1/2} x .
$$

Constraining the two free parameters to $\theta = \theta'_0 = -\theta'_1$ leaves

$$
g_\theta \star x \approx \theta\left(I_N + D^{-1/2}AD^{-1/2}\right) x .
$$

That operator has eigenvalues in $[0,2]$, and stacking it repeatedly is
numerically unstable. The **renormalisation trick** substitutes

$$
I_N + D^{-1/2}AD^{-1/2} \;\longrightarrow\; \tilde{D}^{-1/2}\tilde{A}\tilde{D}^{-1/2},
\qquad \tilde{A} = A + I_N,\ \ \tilde{D}_{ii}=\textstyle\sum_j \tilde{A}_{ij}.
$$

This is a substitution, not an identity: the self-loop is folded into the
adjacency _before_ the degrees are computed. The result has spectrum in
$(-1,1]$, with $1$ attained once per connected component by
$\tilde{D}^{1/2}\mathbf{1}$, and $-1$ excluded because a self-loop is an odd
cycle, so no component of $\tilde{A}$ is bipartite. Generalising a signal to $C$
channels and $F$ filters gives $Z = \hat{A}X\Theta$ with $\Theta \in
\mathbb{R}^{C\times F}$, which is the layer in the Definition.

The over-smoothing consequence follows from that spectrum. Take a connected
graph and drop the nonlinearities and weights; then $l$ layers compute
$\hat{A}^l X$, and since every other eigenvalue then has modulus $|\lambda| < 1$,
$\hat{A}^l$ converges to the projection onto $\tilde{D}^{1/2}\mathbf{1}$ at a rate
set by the second-largest eigenvalue modulus — $0.564^l$ in the example above. Nonlinearities and learned weights complicate this but do
not reverse it.

## Assumptions and requirements

The derivation assumes the adjacency is **symmetric**, because $L$ must be
symmetric for $U$ to be orthonormal and for the Chebyshev argument to go through.
Directed graphs break the spectral story and need a different construction.

The truncation assumes $\lambda_N \approx 2$, which is exact only when a component
is bipartite; elsewhere it is an approximation the learned weights are expected to
absorb.

Statistically the layer assumes **homophily**: adjacent nodes tend to share
labels, so smoothing along edges is the right prior. On a heterophilous graph,
where an edge signals difference, a plain GCN can do worse than ignoring the
graph.

The setting it was designed for assumes the whole graph and all node features are
available at training time with only labels withheld. That is transductive: a new
node arriving later is not covered, and the full-graph matrix product may not fit
in memory for very large graphs.

## Uses and applicability

Reach for a GCN when you have one moderately sized homophilous graph, few labels,
and informative node features: citation networks, co-purchase graphs, node
classification on a knowledge graph. It is the right first thing to try and the
right thing to beat before a more elaborate architecture earns its place.

Do not reach for it when neighbours must be told apart — a recommendation edge
whose type matters, a molecule where bond order matters — because the layer has
no per-edge parameters. Do not reach for it for long-range reasoning: the range
is the depth, and the depth is capped by over-smoothing.

## Limitations and common mistakes

**Depth is not free.** Kipf and Welling's own depth study shows performance on
citation networks peaking at two or three layers and degrading after, with
residual connections only partly mitigating. Over-smoothing is the usual
diagnosis and the spectral argument above supports it, but vanishing gradients
and the extra parameters of a deeper model contribute too, and the relative
weight of these causes is not settled. The practical fact is solid: most deployed
GCNs are two layers.

**It is not a convolution in the sense a vision reader expects.** One $W$ per
layer, not one per neighbour offset — two neighbours of equal degree are weighted
identically regardless of what they contain.

**Its aggregator is strictly weaker than a sum.** Xu et al. show that mean-style
aggregation — which the degree normalisation makes GCN's — cannot distinguish
two multisets with the same distribution of elements, such as $\{a,b\}$ and
$\{a,a,b,b\}$, so a GCN misses non-isomorphic
neighbourhoods a sum aggregator separates, and it sits strictly below the
1-Weisfeiler-Lehman bound the best message-passing networks reach.

**The renormalisation trick is not just "adding self-loops".** It also recomputes
the degrees from $\tilde{A}$. Adding $I_N$ to $A$ while normalising by the _old_
$D$ gives a different, worse-conditioned operator.

**The headline citation-network numbers are fragile.** They come from one fixed
split per dataset, and later work found tuned simple baselines close much of the
reported gap under repeated random splits. A benchmark result, not a law.

## Variants and alternatives

**ChebNet** keeps Chebyshev terms up to order $K > 1$, so one layer spans $K$
hops with $K+1$
parameters per channel pair: more expressive per layer, more parameters, and
harder to tune. GCN is its $K=1$ renormalised special case. **Graph attention
networks** replace the fixed degree weights with learned, feature-dependent
coefficients. **GraphSAGE**-style layers keep the node's own state out of the
aggregate and sample a fixed-size neighbourhood, which makes minibatch training
on large graphs possible. **Graph isomorphism networks** swap the normalised mean
for a sum inside an MLP, reaching the 1-WL expressiveness ceiling. **Relational
GCN** gives each edge type its own weight matrix. **Simplified GCN** removes the
nonlinearities entirely, precomputes $\hat{A}^K X$ once, and fits logistic
regression on it — competitive on the standard benchmarks, which is itself
evidence about how much of GCN's performance is the smoothing rather than the
learning.

## History and attribution

Thomas Kipf and Max Welling introduced the rule in a 2016 preprint, published at
ICLR 2017. The problem they were actually attacking was semi-supervised node
classification: given a citation network with labels on a handful of documents
per class, classify the rest. The prior approach regularised a classifier with an
explicit graph-Laplacian penalty, which forces the assumption that edges encode
similarity into the loss; their contribution was to put the graph into the model
instead and train end-to-end.

The layer did not appear from nothing. It is the last step of a chain: spectral
networks on graphs, then the Chebyshev-polynomial approximation that made spectral
filters localised and eigendecomposition-free, then this first-order renormalised
truncation. Kipf and Welling's own framing puts the value in the simplification,
and in the observation that the simplified operator reads as a differentiable,
parameterised generalisation of the Weisfeiler-Lehman hash — a connection the
expressiveness literature later made precise.

## Sources

- **Semi-Supervised Classification with Graph Convolutional Networks** — the
  propagation rule, the full spectral derivation from the Chebyshev truncation,
  the renormalisation trick and its stability argument, the citation-network
  experiments, and the depth study.
- **A Tutorial on Spectral Clustering** — the graph Laplacians, the normalised
  Laplacian's spectrum, and the quadratic form that makes "smooth on the graph"
  precise. The reference for the Laplacian facts the derivation rests on, not for
  anything neural.
- **How Powerful are Graph Neural Networks?** — where mean-style aggregation
  fails, and the Weisfeiler-Lehman ceiling on message passing.
- **Geometric Deep Learning** — the symmetry-first framing that places this layer
  among group-convolutional and manifold architectures.

## Prerequisites and next connections

Read [Message Passing](./message-passing.md) first for the aggregate-then-update
pattern this layer is a fixed instance of, and
[Spectral Theory](./spectral-theory.md) for the eigendecomposition the derivation
turns on. [Spectral Clustering](./spectral-clustering.md) uses the same graph
Laplacian for a different purpose and is the fastest way to get comfortable with
what its eigenvectors mean; [Fourier Analysis](./fourier-analysis.md) is where
the classical version of the transform lives.

Next, [Graph Neural Networks](./graph-neural-networks.md) places GCN beside the
alternatives it is compared with, and
[Residual Connection](./residual-connection.md) is the standard first attempt at
making a deep GCN trainable — worth reading to see why it helps less here than in
a [Convolutional Network](./convolutional-networks.md).
