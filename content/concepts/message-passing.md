---
concept_id: concept.deep_learning.message_passing
title: Message Passing
slug: /concepts/message-passing
kind: method
tier: 1
review_state: generated-draft
summary: The layer scheme behind almost every graph neural network, in which each node rebuilds its state from a permutation-invariant summary of its neighbours — cheap enough to run on millions of edges, and provably blind to whatever the Weisfeiler-Lehman test cannot see.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.algorithms.graph_algorithms
    note: The layer is defined over neighbourhoods of a graph, so a reader needs adjacency, degree and neighbourhood vocabulary before the update rule means anything.
  - type: contributes_to
    target: concept.deep_learning.graph_neural_networks
    note: Nearly every graph neural network in use is an instance of this scheme with particular choices of message, aggregation and update function.
  - type: contrasts_with
    target: concept.deep_learning.attention
    note: Self-attention is message passing on a complete graph, which removes the sparsity that makes this cheap and the locality that causes over-squashing.
  - type: contrasts_with
    target: concept.deep_learning.convolutional_layer
    note: A convolutional layer exploits a canonical ordering of grid neighbours to give each offset its own weight; dropping that ordering is exactly what forces a graph aggregator to be permutation invariant.
sources:
  - source_id: source.gilmer2017.message_passing
    title: Neural Message Passing for Quantum Chemistry
    url: https://arxiv.org/abs/1704.01212
    source_kind: preprint
    supports:
      - definition
      - formal-treatment
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.xu2019.how_powerful_are_gnns
    title: How Powerful are Graph Neural Networks?
    url: https://arxiv.org/abs/1810.00826
    source_kind: preprint
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.kipf2017.graph_convolutional_networks
    title: Semi-Supervised Classification with Graph Convolutional Networks
    url: https://arxiv.org/abs/1609.02907
    source_kind: preprint
    supports:
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - why-it-matters
      - intuition
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Li, Han and Wu (2018), the analysis that named over-smoothing in graph convolutional networks
    reason: No registry source studies what repeated neighbourhood averaging does as depth grows, so the claim that node states within a connected component converge toward a common direction is stated here without a citation.
    sections:
      - limitations-and-common-mistakes
  - label: Alon and Yahav (2021) on the bottleneck of graph neural networks, and the curvature-based rewiring work that followed it
    reason: The registry has nothing on over-squashing or graph rewiring, so the account of exponentially growing receptive fields compressed into fixed-width vectors is uncited.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Message passing** updates every node of a graph from its own state and the
states of its neighbours, using three functions shared by all nodes. For a graph
$G = (V, E)$ with node states $h_v^{(k)}$ at round $k$ and optional edge features
$e_{uv}$,

$$
m_v^{(k+1)} = \bigoplus_{u \in \mathcal{N}(v)} M_k\!\left(h_v^{(k)}, h_u^{(k)}, e_{uv}\right),
\qquad
h_v^{(k+1)} = U_k\!\left(h_v^{(k)}, m_v^{(k+1)}\right),
$$

where $M_k$ is the **message function**, $\bigoplus$ the **aggregator**, $U_k$ the
**update function**, and $\mathcal{N}(v)$ the neighbours of $v$. After $K$ rounds
a **readout** $R$ collapses the node states into one vector for graph-level
tasks. The aggregator receives a _multiset_ — neighbours arrive unordered and
values may repeat — and must return the same answer whatever order they come in.
Sum, mean and max are the usual choices.

## Why it matters

A graph has no canonical node ordering: the same molecule can be numbered in any
of $n!$ ways, and a model that answered differently for different numberings
would be learning the numbering. Permutation invariance of the aggregator is what
makes the layer well defined, and it is the whole reason the scheme has this
shape — Bronstein and colleagues treat it as the graph case of a general
principle: fix the symmetry group of the domain, then build layers respecting it.

The payoff is that one set of weights handles graphs of any size and shape at
$O(|E|)$ cost per layer rather than $O(|V|^2)$, and that one framework covers
models invented separately: Gilmer and colleagues showed graph convolutions,
gated graph networks and interaction networks to be this rule with different $M$,
$\bigoplus$ and $U$.

## Intuition

Picture gossip. Each round, every node tells its neighbours something about
itself, listens to everything arriving, and rewrites its own state. After $K$
rounds it has been influenced by everything within $K$ hops — its **receptive
field** is the $K$-hop neighbourhood.

The analogy breaks in an instructive place. Real gossip is attributed: you know
who said what. Here the aggregator deliberately destroys attribution, since
keeping it would need an ordering of neighbours that does not exist. A node gets
a summary, not a transcript. Almost every limitation below follows from that
concession.

## Concrete example

Take four nodes with edges $1\text{–}2$, $2\text{–}3$, $3\text{–}4$, $2\text{–}4$
and scalar features $h = (1, 2, 3, 5)$. Use the identity as the message function
and sum aggregation, so $m = (2,\ 9,\ 7,\ 5)$: node 1 hears only from node 2,
node 2 hears $1+3+5$, and so on.

With the update $h_v' = h_v + m_v$ the new states are $(3,\ 11,\ 10,\ 10)$. Nodes
3 and 4 have collided although they started at $3$ and $5$, and they will never
separate again: they are symmetric in the graph, so the layer must give them
equal states from here on. The collision was not forced by that symmetry — their
inputs differed — but by an update weighting a node and its neighbours
identically, which is therefore not injective. Setting
$h_v' = (1+\epsilon) h_v + m_v$ with $\epsilon = 0.5$ gives
$(3.5,\ 12,\ 11.5,\ 12.5)$ and keeps them apart. That is the trick GIN uses.

In code, the sparse implementation is a scatter-add over an edge list:

```python
import numpy as np

h = np.array([1.0, 2.0, 3.0, 5.0])
edges = np.array([[0, 1], [1, 0], [1, 2], [2, 1],
                  [2, 3], [3, 2], [1, 3], [3, 1]])   # both directions

m = np.zeros_like(h)
np.add.at(m, edges[:, 0], h[edges[:, 1]])            # sum into each target
print(1.5 * h + m)                                   # [ 3.5 12.  11.5 12.5]
```

Kipf and Welling's graph convolution is the same loop with a fixed normalization,
$H^{(k+1)} = \sigma\!\left(\tilde{D}^{-1/2} \tilde{A} \tilde{D}^{-1/2} H^{(k)} W^{(k)}\right)$,
$\tilde{A} = A + I$: a degree-weighted mean of $W h_u$ over neighbours and self.

## Formal treatment

Collect node states in $H \in \mathbb{R}^{|V| \times d}$. A message passing layer
$F(H, A)$ is **permutation equivariant**: for any permutation matrix $P$,

$$
F\!\left(PH,\ PAP^{\top}\right) = P\, F(H, A),
$$

which holds precisely because $\bigoplus$ is a function of a multiset. A readout
that is itself invariant, such as summing the final states, turns that
equivariance into an invariant graph-level output.

The expressivity ceiling is sharp. Xu and colleagues proved that if a network of
this form maps two graphs to different embeddings, the one-dimensional
Weisfeiler-Lehman colour-refinement test also separates them: message passing is
**at most as powerful as 1-WL** at distinguishing graphs, and no choice of $M$,
$\bigoplus$ and $U$ escapes that. The bound is attained when the feature space is
countable and $M$, $\bigoplus$, $U$ and $R$ are injective. Their Graph
Isomorphism Network realises this with

$$
h_v^{(k+1)} = \mathrm{MLP}^{(k)}\!\left((1 + \epsilon^{(k)})\, h_v^{(k)} + \sum_{u \in \mathcal{N}(v)} h_u^{(k)}\right).
$$

The aggregator decides how much of the multiset survives. Sum is injective on
multisets from a countable universe; mean keeps only the proportions, so
$\{a, a, b, b\}$ and $\{a, b\}$ collide; max keeps only the distinct elements.
Mean and max are therefore strictly weaker than sum — a theorem about
representational capacity, not a claim that sum trains better.

The concrete consequence: a 6-cycle and two disjoint triangles, with identical
initial features, are indistinguishable to every message passing network, since
every node in both has degree 2 and sees the same multiset every round.

## Assumptions and requirements

The graph is given and fixed during the forward pass; message passing learns
functions on a graph, not the graph itself. Neighbourhoods are assumed unordered
— on a grid they are not, and treating them as such discards the positional
structure a convolution exploits.

The lower bound carries real hypotheses: a **countable** feature space, injective
functions realised exactly, and enough rounds. An MLP only approximates
injectivity on a bounded domain, so "as powerful as 1-WL" describes what the
architecture can represent, not what training finds. If all nodes carry identical
features, structure is visible only through 1-WL colours and the ceiling bites
hardest.

Depth sets reach: evidence more than $K$ hops away cannot arrive in $K$ rounds.
And while nothing requires **homophily**, the benchmarks that made mean-style
aggregators popular were homophilous citation graphs; where neighbours tend to
disagree with a node's label, averaging can do worse than ignoring the graph —
an empirical finding, not a property of the scheme.

## Uses and applicability

Reach for it when relational structure is irregular, informative and local:
molecular property prediction (Gilmer et al. trained on QM9), semi-supervised
node classification in citation graphs, recommendation over user-item graphs,
simulation over particle neighbourhood graphs.

Do not, when the graph is complete or nearly so — attention over all pairs is the
same computation without the sparsity assumption — when the domain is a grid,
where ordered neighbourhoods buy more, or when the task needs counting
substructures such as triangles, which plain message passing provably cannot do.

## Limitations and common mistakes

**Over-smoothing and over-squashing are different problems with different
causes**, and conflating them leads to the wrong fix. Over-smoothing is about
depth: an averaging aggregator is a low-pass operator, and in the linear case,
ignoring weights and nonlinearities, powers of the normalized adjacency converge
to a projection onto its top eigenvector, so node states within a connected
component stop being distinguishable. Hence most deployed models are two to five
layers deep, and the fixes are residual connections, normalization across nodes,
and decoupling propagation from transformation.

Over-squashing happens even in shallow models. A node's $K$-hop neighbourhood can
grow exponentially in $K$, and all of it is compressed into one fixed-width
vector, so distant evidence arrives attenuated to nothing — especially across
bottleneck edges joining two dense regions. Adding layers makes it worse, and the
fixes are structural: rewiring the graph, adding a virtual node joined to
everything, or switching to global attention.

Three misconceptions. That deeper is better: usually not here. That mean
aggregation is a safe default: it silently discards degree and multiplicity. And
that the 1-WL ceiling makes these models weak: the bound concerns telling graphs
apart, and most real tasks have node features 1-WL separates easily. Attention
does not raise the ceiling either.

## Variants and alternatives

**GCN** fixes the message to a symmetrically normalized mean and learns only the
linear map. **GraphSAGE** samples a fixed number of neighbours and concatenates
the self state instead of adding it. **Graph attention networks** learn the
aggregation weight per edge — Bronstein and colleagues call this the attentional
flavour, between fixed convolution and fully general message passing. **GIN**
uses sum plus an MLP and hits the 1-WL bound. Edge-conditioned variants let $M$
depend on rich edge features, which molecular models need.

Past the ceiling lie higher-order schemes passing messages between tuples of
nodes, subgraph methods running a network on many perturbed copies, and
positional encodings supplying what 1-WL cannot derive — each buying expressivity
with computation. The genuinely different competitors are spectral filtering, in
the graph Laplacian's eigenbasis rather than hop by hop, and graph transformers,
which pay $O(|V|^2)$ to eliminate over-squashing.

## History and attribution

The idea has several origins. The name comes from belief propagation on graphical
models, where sum-product messages along edges have been standard since the
1980s. Neural versions date to the recursive-network work of Sperduti and Gori in
the 1990s and the graph neural network of Scarselli and colleagues in 2009, which
computed states as the fixed point of a contraction rather than in a fixed number
of rounds. The modern framing — message, update and readout as three
interchangeable pieces — is due to Gilmer, Schoenholz, Riley, Vinyals and Dahl in
2017, who were predicting quantum-chemical properties and noticed that the
existing architectures were one algorithm. The expressivity analysis arrived in
2019, when Xu, Hu, Leskovec and Jegelka and, independently, Morris and colleagues
tied it to the Weisfeiler-Lehman isomorphism heuristic of 1968.

## Sources

Gilmer et al. give the message-update-readout formulation, the unification of
earlier models, and the chemistry application. Xu et al. supply the
Weisfeiler-Lehman bound, the injectivity conditions, the sum-mean-max comparison
and GIN. Kipf and Welling give the graph convolution used above. Bronstein et al.
place permutation invariance in the wider symmetry-based account of deep
learning. The papers naming over-smoothing and over-squashing are not in the
registry and are flagged in the frontmatter.

## Prerequisites and next connections

Read [Graph Algorithms](./graph-algorithms.md) first for adjacency, degree and
neighbourhood; the update rule is stated in that vocabulary. A reader who knows
the [Convolutional Layer](./convolutional-layer.md) has most of the intuition
already — message passing is what a convolution becomes when neighbours lose
their canonical ordering.

From here, [Attention](./attention.md) and the [Transformer](./transformers.md)
are the complete-graph limit of this scheme, and [Pooling](./pooling.md) is the
same aggregation question in grid form: the readout is global pooling over nodes.
