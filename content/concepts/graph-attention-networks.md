---
concept_id: concept.deep_learning.graph_attention_networks
title: Graph Attention Networks
slug: /concepts/graph-attention-networks
aliases:
  - GAT
kind: method
tier: 1
review_state: generated-draft
summary: A graph layer that learns how much each neighbour contributes, replacing the degree-derived coefficients of a graph convolution with a softmax over scores computed from the two endpoints' features.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.message_passing
    note: A GAT layer is the aggregate-then-update scheme with one particular choice of aggregation weight, so the scheme has to be in hand before the attention coefficient is anything more than a formula.
  - type: specializes
    target: concept.deep_learning.attention
    note: It is the same attention mechanism with the candidate set restricted from "every item" to "the neighbours of this node", which is why its cost is linear in edges rather than quadratic in nodes.
  - type: contrasts_with
    target: concept.deep_learning.graph_convolutional_networks
    note: Both aggregate over one-hop neighbourhoods, but a graph convolution fixes the edge coefficient at 1/sqrt(d_i d_j) before training while this layer computes it from the endpoint features, and the comparison between the two is the whole argument for attention on graphs.
  - type: contributes_to
    target: concept.deep_learning.graph_neural_networks
    note: It is one of the layer families a survey of graph networks covers, and the one that made content-dependent edge weights standard in the family.
sources:
  - source_id: source.velickovic2018.graph_attention_networks
    title: Graph Attention Networks
    url: https://arxiv.org/abs/1710.10903
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.kipf2017.graph_convolutional_networks
    title: Semi-Supervised Classification with Graph Convolutional Networks
    url: https://arxiv.org/abs/1609.02907
    source_kind: preprint
    supports:
      - why-it-matters
      - concrete-example
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.xu2019.how_powerful_are_gnns
    title: How Powerful are Graph Neural Networks?
    url: https://arxiv.org/abs/1810.00826
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - intuition
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: 'Brody, Alon and Yahav, How Attentive are Graph Attention Networks? (GATv2, ICLR 2022)'
    reason: The registry has the original GAT paper but no entry for the GATv2 analysis, so the static-versus-dynamic attention distinction, the proof sketch that the neighbour ranking is global, and the corrected scoring function are stated here without a citation and should be checked against that paper.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
  - label: 'Bahdanau, Cho and Bengio, Neural Machine Translation by Jointly Learning to Align and Translate (ICLR 2015)'
    reason: The original paper states that its attentional setup closely follows this work, but the registry has no entry for it, so the additive lineage of the LeakyReLU score is named here without a citation and should be checked against that paper.
    sections:
      - history-and-attribution
  - label: Over-smoothing in deep graph networks, and the debate over whether attention weights are explanations
    reason: No registered source studies what repeated neighbourhood averaging does as depth grows, or whether attention coefficients support interpretability claims, so both are stated qualitatively here rather than cited.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **graph attention network** is a graph neural network whose layers weight each
neighbour's contribution by a coefficient computed from the features of that
edge's two endpoints. One layer applies a shared linear map $W$ to every node
vector, scores every edge with a shared scoring function, normalises each node's
incoming scores with a softmax, and returns the weighted sum. Because $W$ and the
scoring function are shared across edges, the parameter count is independent of
the number of nodes and the layer runs unchanged on an unseen graph.

## Why it matters

A graph convolutional layer fixes its edge
coefficient at $1/\sqrt{\tilde d_i \tilde d_j}$ before training starts. That is a
statement about the graph's shape, not its content: a low-degree neighbour gets
more weight whatever it contains. In a citation graph one reference is the paper
the work is built on and nine are polite; in a molecule one bond is the reactive
site. A degree-derived coefficient cannot express that; an attention coefficient
can, for one extra parameter vector per head.

The second gain is structural: nothing in the layer refers to a global quantity —
no Laplacian eigenbasis, no node ordering, no degree statistics of the training
graph. Veličković et al. exploit this, training on one set of protein-protein
interaction graphs and evaluating on entirely held-out ones.

## Intuition

Each node asks the same question of every neighbour and weights the answers by
how relevant each reply looks. This is transformer self-attention with the
candidate set cut down from the whole sequence to the graph neighbourhood —
"masked attention", in the original paper's phrase.

The analogy breaks in three places. There is no positional encoding and no
canonical order, so the layer is permutation-equivariant by construction and
cannot say "the neighbour above". The neighbourhoods are sparse, so cost is
linear in $|E|$, not quadratic in $|V|$. And the original score is not a dot
product of a query against a key but a LeakyReLU of a linear functional of the
concatenated pair — a difference that looks cosmetic and is not.

## Concrete example

Take a node $i$ with three neighbours plus its own self-loop, and suppose the
layer has produced scores $e_{i\cdot} = (1.2,\; 2.0,\; 0.5,\; -1.0)$ for
$(i, j_1, j_2, j_3)$. Exponentiating gives $(3.32,\; 7.39,\; 1.65,\; 0.37)$, which
sums to $12.73$, so

$$\alpha_{i\cdot} = (0.26,\; 0.58,\; 0.13,\; 0.03).$$

Now suppose the same four nodes have self-loop-inclusive degrees
$\tilde d_i = 4$, $\tilde d_{j_1} = 4$, $\tilde d_{j_2} = 9$, $\tilde d_{j_3} = 25$.
A graph convolution would use $c_{ij} = 1/\sqrt{\tilde d_i \tilde d_j}$, giving
$(0.25,\; 0.25,\; 0.17,\; 0.10)$ — note these do not sum to one, because the
symmetric normalisation is not row-stochastic. The attention layer puts 58% of
its mass on $j_1$; the convolution gives $j_1$ exactly $0.25$ no matter what
$j_1$ contains, and discounts $j_3$ only because $j_3$ is a hub.

A minimal dense implementation, correct but memory-hungry:

```python
import torch
import torch.nn.functional as F

def gat_head(h, adj, W, a, slope=0.2):
    # h: (N, F) features; adj: (N, N) bool, adj[i, j] = j in N(i), self-loops included
    Wh = h @ W                                    # (N, F')
    d = Wh.shape[1]
    src = Wh @ a[:d]                              # a_1^T W h_i  -> (N,)
    dst = Wh @ a[d:]                              # a_2^T W h_j  -> (N,)
    e = F.leaky_relu(src[:, None] + dst[None, :], slope)
    e = e.masked_fill(~adj, float("-inf"))
    alpha = torch.softmax(e, dim=1)               # each row sums to 1 over N(i)
    return alpha @ Wh                             # (N, F')
```

The split of the score into a source term and a destination term is not a coding
trick — it is forced by the algebra, and it is the whole of the static-attention
problem.

## Formal treatment

Let $G = (V, E)$ with node features $h_i \in \mathbb{R}^{F}$ and let
$\mathcal{N}_i$ be the neighbourhood of $i$, conventionally including $i$ itself.
With $W \in \mathbb{R}^{F' \times F}$, $\vec a \in \mathbb{R}^{2F'}$ and $\Vert$
denoting concatenation, the unnormalised score on edge $(i,j)$ is

$$e_{ij} = \operatorname{LeakyReLU}\!\left(\vec a^{\top}\,[\,W h_i \,\Vert\, W h_j\,]\right), \qquad j \in \mathcal{N}_i,$$

with negative slope $0.2$ in the original work. Normalising and aggregating,

$$
\alpha_{ij} = \frac{\exp(e_{ij})}{\sum_{k \in \mathcal{N}_i} \exp(e_{ik})},
\qquad
h_i' = \sigma\!\left(\sum_{j \in \mathcal{N}_i} \alpha_{ij}\, W h_j\right).
$$

With $K$ heads, each carrying its own $W^k$ and $\vec a^k$, the outputs are
concatenated,

$$h_i' = \big\Vert_{k=1}^{K}\; \sigma\!\left(\sum_{j \in \mathcal{N}_i} \alpha_{ij}^{k}\, W^{k} h_j\right) \in \mathbb{R}^{K F'},$$

except on the prediction layer, where $K$ copies of $C$ class scores are not
wanted and the heads are averaged before the nonlinearity instead:

$$h_i' = \sigma\!\left(\frac{1}{K}\sum_{k=1}^{K} \sum_{j \in \mathcal{N}_i} \alpha_{ij}^{k}\, W^{k} h_j\right).$$

One head costs $O(|V| F F' + |E| F')$: the dense transform, plus one scalar score
and one accumulated $F'$-vector per edge. The $N \times N$ matrix in the code
above is a convenience, not a requirement; real implementations gather over the
edge list.

**Static attention.** Write $\vec a = [\vec a_1 \Vert \vec a_2]$. Then
$e_{ij} = \operatorname{LeakyReLU}(\vec a_1^{\top} W h_i + \vec a_2^{\top} W h_j)$,
and for a fixed query $i$ the first term is an additive constant. LeakyReLU with
positive slope is strictly increasing and softmax is order-preserving, so for any
two candidates,

$$\alpha_{ij} > \alpha_{ij'} \iff \vec a_2^{\top} W h_j > \vec a_2^{\top} W h_{j'},$$

a condition in which $i$ does not appear. A single head therefore induces one
global ranking of nodes that every query must share. Brody, Alon and Yahav call
this _static_ attention; their GATv2 recovers per-query ranking by moving the
nonlinearity inside,
$e_{ij} = \vec a^{\top} \operatorname{LeakyReLU}(W[h_i \Vert h_j])$. Magnitudes
still vary with $i$, since different neighbourhoods normalise differently, which
is why inspecting a trained GAT's coefficients does not make the defect
obvious.

## Assumptions and requirements

The softmax needs a non-empty neighbourhood, which is why self-loops are part of
the standard formulation; drop them and isolated nodes produce `NaN`.

Sharing one scoring function across all edges assumes a single notion of
relevance serves the whole graph. That is what makes the layer inductive, and
also what stops it expressing any preference not already visible in the features.

Because $\sum_j \alpha_{ij} = 1$ the aggregate is a convex combination, so degree
is destroyed: two neighbours and twenty give outputs on the same scale. If the
task needs counting, degree must enter as a feature or the normalisation must
go.

Edge features and edge direction are absent from the base formulation. On a
directed graph $\mathcal{N}_i$ means in-neighbours; and even on an undirected
graph $\alpha_{ij} \neq \alpha_{ji}$ in general, because the two are normalised
over different sets.

Finally, the published numbers assume their training recipe: dropout at
$p = 0.6$ on layer inputs _and_ on the attention coefficients themselves — a
strong regulariser, and a convention rather than part of the definition.

## Uses and applicability

Reach for it when edges differ in importance and that difference is predictable
from features: citation and web graphs with mixed-quality links, molecular
graphs, bipartite recommendation graphs, and any setting where the test graph is
not the training graph. The original paper's inductive protein-protein experiment
is that case, and where the margin over degree-normalised aggregation is
largest.

Do not reach for it when neighbours are interchangeable and degrees roughly
uniform — a fixed rule is then the better prior and the cheaper layer — when the
task is structural and needs counting, or when the graph is complete, in which
case you have a transformer and should use transformer kernels.

On the small citation benchmarks the advantage is real but modest: 83.0 ± 0.7%
against a graph convolution's 81.5% on Cora. Those splits are small enough that a
gap of that size is weak evidence on its own.

## Limitations and common mistakes

The static-attention limitation above is the substantive one. Its practical
consequence: a head cannot express "for node $i$, neighbour A matters most; for
node $j$, neighbour B matters most" when A and B are adjacent to both. Multiple
heads supply several global rankings, not per-query ones, so they mitigate the
problem without removing it.

Attention weights are not explanations. They are trained only for the downstream
loss, and because $W$ has already mixed features before the score is taken, a
small $\alpha_{ij}$ does not mean $j$ was ignored. Whether attention weights
explain anything is contested; a graph layer inherits that dispute.

Attention buys no expressive power in the Weisfeiler-Lehman sense. Every
message-passing layer is bounded by the 1-dimensional WL test, and softmax
normalisation makes the aggregation a weighted mean, so GAT inherits the mean
aggregator's blindness: neighbourhood multisets proportional to one another, such
as $\{a, b\}$ and $\{a, a, b, b\}$, give identical output. Sum aggregation does
not. Learned coefficients change which neighbours dominate, not which graphs can
be distinguished.

Depth is not the fix. Two layers remains the standard on citation benchmarks;
stacking more typically degrades accuracy as node states converge, and attention
does not prevent that.

Three implementation errors recur: omitting self-loops; softmaxing over the wrong
axis, which normalises over the nodes a node sends to rather than those it
receives from; and concatenating heads on the output layer where averaging was
intended.

## Variants and alternatives

**GATv2** applies $\vec a$ after the nonlinearity and so scores each pair
jointly; same asymptotic cost, strictly more expressive, and a reasonable default.
**Dot-product graph attention** replaces the additive score with
$\langle Q h_i, K h_j \rangle / \sqrt{d}$, which reuses transformer kernels at the
price of a full $d$-dimensional inner product per edge, and is not separable into
a source and a destination term.
**Edge-featured attention** folds a bond or relation embedding into the score,
which molecular and knowledge-graph work needs. **Graph convolution** keeps the
fixed $1/\sqrt{\tilde d_i \tilde d_j}$: fewer parameters, faster, a strong
baseline. **GraphSAGE** samples a fixed number of neighbours and aggregates with
a mean, max-pool or LSTM; the sampling is orthogonal to attention and combines
with it. **GIN** uses sum aggregation with an MLP, reaching the 1-WL bound that
mean-based layers miss.
**Graph transformers** attend over all pairs with a structural encoding, buying
long-range interaction at $O(|V|^2)$.

## History and attribution

Veličković, Cucurull, Casanova, Romero, Liò and Bengio introduced the layer in a
preprint of October 2017, presented at ICLR 2018. Their problem was inherited: spectral graph convolutions were defined through the
eigenbasis of one particular Laplacian, and Kipf and Welling's localised
first-order simplification had removed that dependence while keeping a
coefficient fixed by degree. Vaswani et al.'s self-attention, published months
earlier, supplied the self-attention framing and the multi-head construction; the
scoring function itself, the paper says, follows the older additive attention of
Bahdanau et al. rather than a dot product of query against key.
Weighting neighbours by learned relevance had several independent
developments in 2017, and this formulation is best read as the one that stuck.
Brody, Alon and Yahav identified the static-attention restriction and published
the corrected form as GATv2 at ICLR 2022.

## Sources

The original **Graph Attention Networks** paper is the authority for the layer
equations, the multi-head convention, the complexity claim and the benchmark
numbers quoted here. **Semi-Supervised Classification with Graph Convolutional
Networks** supplies the fixed normalisation contrasted against, and the
citation-graph protocol both share. **How Powerful are Graph Neural Networks?**
gives the 1-WL bound and what mean-style aggregation loses. **Attention Is All
You Need** is where the multi-head construction comes from.
The GATv2 analysis is not in the registry and is flagged in
`unresolved_references`.

## Prerequisites and next connections

Read [Message Passing](./message-passing.md) first: this layer is that scheme
with one specific aggregation weight, and the update rule looks arbitrary without
it. [Attention](./attention.md) supplies the query-key-value mechanism being
restricted to a neighbourhood. Vocabulary alone — adjacency, degree,
neighbourhood — comes from [Graph Algorithms](./graph-algorithms.md).

Afterwards, [Graph Neural Networks](./graph-neural-networks.md) places the layer
among its alternatives, and [Transformers](./transformers.md) shows what the same
mechanism becomes once every node is adjacent to every other.
