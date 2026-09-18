---
concept_id: concept.deep_learning.graph_neural_networks
title: Graph Neural Networks
slug: /concepts/graph-neural-networks
aliases:
  - GNN
kind: concept
tier: 1
review_state: generated-draft
summary: An architecture family whose layers update every node from its neighbours, so that a network can be applied to irregular relational data without fixing a node ordering or a node count.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.message_passing
    note: Every layer family on this page is an instance of the message-passing scheme, and the aggregate-then-update pattern has to be understood before the differences between GCN, GraphSAGE and GAT mean anything.
  - type: equivalent_under
    target: concept.deep_learning.transformers
    note: A transformer layer is attentional aggregation over a complete graph of tokens, so it coincides with a graph attention layer once every node is made adjacent to every other; the graph case differs only in that the sparse edge set is given rather than assumed to be all-to-all.
  - type: contrasts_with
    target: concept.deep_learning.convolutional_networks
    note: A convolution assumes a regular grid with a canonical orientation so that each filter tap has a fixed meaning, while a graph layer must handle variable degree and has no way to say "the neighbour above", which is why its aggregation is order-invariant.
  - type: contrasts_with
    target: concept.algorithms.graph_algorithms
    note: Classical graph algorithms compute exact combinatorial quantities from hand-written rules, whereas a graph network fits an approximate function of the same structure from labelled examples, trading guarantees for the ability to use node features.
sources:
  - source_id: source.kipf2017.graph_convolutional_networks
    title: Semi-Supervised Classification with Graph Convolutional Networks
    url: https://arxiv.org/abs/1609.02907
    source_kind: preprint
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.velickovic2018.graph_attention_networks
    title: Graph Attention Networks
    url: https://arxiv.org/abs/1710.10903
    source_kind: preprint
    supports:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.gilmer2017.message_passing
    title: Neural Message Passing for Quantum Chemistry
    url: https://arxiv.org/abs/1704.01212
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.xu2019.how_powerful_are_gnns
    title: How Powerful are Graph Neural Networks?
    url: https://arxiv.org/abs/1810.00826
    source_kind: preprint
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: 'Hamilton, Ying and Leskovec, Inductive Representation Learning on Large Graphs (GraphSAGE), and the later sampling literature (FastGCN, Cluster-GCN, GraphSAINT)'
    reason: The registry has no entry for GraphSAGE or for any paper on minibatch neighbourhood sampling, so the concatenate-self-and-sample formulation and the claims about bounding neighbourhood explosion rest on nothing cited here.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
  - label: 'Benchmarking studies on tuned simple baselines: Shchur et al., Pitfalls of Graph Neural Network Evaluation; Wu et al., Simplifying Graph Convolutional Networks'
    reason: No registered source evaluates graph networks against tuned non-graph or linearised baselines under a common protocol, so the competitiveness finding is stated from the literature rather than from a citation on this page.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: 'Morris et al., Weisfeiler and Leman Go Neural: Higher-order Graph Neural Networks (AAAI 2019)'
    reason: The registry holds only Xu et al. for the expressiveness result, but the 1-WL upper bound was established concurrently and independently by Morris et al., so the shared credit this page now gives rests on no citation here.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
      - history-and-attribution
  - label: 'The pre-spectral lineage: Sperduti and Starita (1997), Gori et al. (2005), Scarselli et al. (2009)'
    reason: Kipf and Welling cite these as related work but are not a historical source for them, and no registry entry covers the contraction-mapping formulation of the original graph neural network.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **graph neural network** is a network whose layers are functions of a graph
$G = (V, E)$ together with node features $X \in \mathbb{R}^{n \times d}$ and
optional edge features, and which are _equivariant to relabelling the nodes_.
Each layer gives every node a new vector computed from its own current vector
and a permutation-invariant aggregate over its neighbours, so after $L$ layers a
node's vector depends on its $L$-hop neighbourhood. That aggregate-and-update
pattern is the message-passing framework, and its page carries the general form;
this one is about the layer families built on it, the tasks they serve, and how
well they actually work.

## Why it matters

Molecules, citation graphs, road networks, user–item interactions and program
syntax trees have no grid and no canonical order. Flattening the adjacency matrix
into a multilayer perceptron destroys the symmetry: the model would have to learn
separately, for every pair of node indices, that swapping them changes nothing. A
graph layer builds that symmetry in, so one set of weights serves nodes of every
degree and the trained model runs on graphs of a size it never saw. Gilmer et al.
made the point by predicting quantum-chemical properties of molecules straight
from their bond graphs, where the alternative was hand-designed descriptors.

## Intuition

Every node holds a vector. On each round it listens to its neighbours, summarises
what it heard into one vector, and mixes that summary with what it already knew.
Repeat $L$ times and information has diffused $L$ hops.

The diffusion analogy is honest about the mechanism and about the failure: heat
diffusion converges to a constant, and repeated neighbourhood averaging does the
same to node representations — the oversmoothing described below. Where it breaks
is _addressing_. Gossip lets you tell who said what; plain aggregation does not,
because the aggregate is a function of a multiset. A node sees an unlabelled
collection of neighbour states unless edge features or attention weights put the
labels back.

## Concrete example

Take the path graph $1-2-3-4$, one scalar feature $x = (1,0,0,0)^\top$, and a GCN
layer with $W$ the identity and no nonlinearity. Self-loops give
$\tilde{d} = (2,3,3,2)$:

```python
import math
A  = [[0,1,0,0],[1,0,1,0],[0,1,0,1],[0,0,1,0]]
At = [[A[i][j] + (i == j) for j in range(4)] for i in range(4)]
d  = [sum(row) for row in At]
Ah = [[At[i][j] / math.sqrt(d[i]*d[j]) for j in range(4)] for i in range(4)]
mv = lambda M, v: [sum(M[i][j]*v[j] for j in range(4)) for i in range(4)]

h1 = mv(Ah, [1, 0, 0, 0])   # [0.5000, 0.4082, 0.0000, 0.0000]
h2 = mv(Ah, h1)             # [0.4167, 0.3402, 0.1361, 0.0000]
```

One layer moves the signal one hop: node 2 picks up $1/\sqrt{2 \cdot 3} = 0.4082$
and nodes 3 and 4 stay zero. Two layers reach node 3. Node 4, three hops away,
stays exactly zero until a third layer — the receptive field is the layer count,
with no shortcuts.

## Formal treatment

Write $h_v^{(l)}$ for node $v$'s vector at layer $l$, $\mathcal{N}(v)$ for its
neighbours, $A$ for the adjacency matrix, $\tilde{A} = A + I$ and $\tilde{D}$ for
the diagonal degree matrix of $\tilde{A}$.

**GCN** (Kipf and Welling) fixes the aggregation to a symmetrically
degree-normalised sum over the closed neighbourhood:

$$
H^{(l+1)} = \sigma\!\left(\tilde{D}^{-1/2}\tilde{A}\tilde{D}^{-1/2} H^{(l)} W^{(l)}\right).
$$

This is the first-order, renormalised truncation of a spectral filter on the
graph Laplacian, the self-loop being what keeps the propagation matrix's spectrum
in hand.

**GraphSAGE** keeps the node's own state out of the aggregate and samples a
fixed-size neighbourhood $\mathcal{S}(v) \subseteq \mathcal{N}(v)$:

$$
h_v^{(l+1)} = \sigma\!\left(W^{(l)}\big[\,h_v^{(l)} \,\|\, \mathrm{AGG}\{h_u^{(l)} : u \in \mathcal{S}(v)\}\,\big]\right),
$$

with $\mathrm{AGG}$ a mean or an element-wise max over a small MLP. The sampling
is what keeps node-wise minibatch training tractable on a large graph.

**GAT** (Veličković et al.) learns the mixing weights:

$$
\alpha_{vu} = \frac{\exp\!\big(\mathrm{LeakyReLU}(a^\top[Wh_v \| Wh_u])\big)}{\sum_{k \in \mathcal{N}(v)\cup\{v\}} \exp\!\big(\mathrm{LeakyReLU}(a^\top[Wh_v \| Wh_k])\big)},
\qquad h_v' = \sigma\!\Big(\textstyle\sum_u \alpha_{vu} W h_u\Big),
$$

usually with several heads concatenated. One score per edge keeps the cost linear
in $|E|$ rather than quadratic in $|V|$.

Equivariance ties these together: for any permutation matrix $P$,
$f(PAP^\top, PX) = P f(A, X)$. Node-level heads read $h_v$ directly; edge-level
heads score a pair, e.g. $\hat{y}_{uv} = \langle h_u, h_v\rangle$ for link
prediction; graph-level heads apply an _invariant_ readout
$h_G = \bigoplus_{v \in V} h_v$ before a classifier — a sum or mean, never a
concatenation, which would depend on the ordering.

Xu et al., concurrently with and independently of Morris et al., proved the
ceiling: any network of this form is at most as powerful as the 1-dimensional
Weisfeiler–Lehman test at distinguishing non-isomorphic graphs.
Sum aggregation composed with an injective MLP (GIN) attains that bound; mean and
max are strictly weaker because they lose multiset multiplicities.

## Assumptions and requirements

The edges must carry information. GCN-style smoothing additionally assumes
**homophily** — adjacent nodes tend to share labels — which holds on citation
networks and fails where connection signals difference; there a plain GCN can
score below a multilayer perceptron on the node features alone.

The **transductive** setting assumes one fixed graph, with all structure and node
features visible at training time and only labels withheld — what Kipf and
Welling's citation-network experiments do. It permits things an **inductive**
model cannot use: per-node learned embeddings, a spectral basis from the full
Laplacian, anything keyed to a node index. Inductive generalisation, to nodes
added later or to whole graphs never seen, requires every parameter to be a
function of features and local structure. GraphSAGE and GAT are both usable
inductively; GAT's inductive claim was tested on entirely held-out protein
interaction graphs.

Depth assumes the signal lives within $L$ hops, and sampling assumes a sampled
aggregate stands in for the full one — an estimator that is biased once a
nonlinearity sits on top, with variance growing as the fan-out shrinks.

## Uses and applicability

Reach for one when relational structure carries information the node features do
not: molecular property and binding prediction, link prediction and
recommendation on user–item graphs, fraud detection, node classification on
citation and social graphs, traffic forecasting on road networks, and learned
heuristics for combinatorial problems.

Do not, when the graph is nearly complete — a transformer is the same computation
without the bookkeeping — when the structure is a grid or a sequence a convolution
or positional encoding handles better, or when the task turns on a dependency many
hops away, which is where these models are weakest.

## Limitations and common mistakes

**Oversmoothing.** Stacking layers repeatedly averages neighbours and node
representations converge toward each other; a linear GCN's propagation tends to
the dominant eigenvector of its normalised adjacency, which depends on degree and
not on the node. Accuracy on node classification usually peaks at two to four
layers — an empirical regularity, not a theorem, and residual connections push it
somewhat further.

**Oversquashing.** An $L$-hop neighbourhood can hold exponentially many nodes,
all compressed into one fixed-width vector, so signal crossing a graph bottleneck
is crushed. This is distinct from oversmoothing and widening does not fix it.

**The expressiveness ceiling is structural.** More layers and more width do not
lift a message-passing network above 1-WL: it cannot count triangles or tell two
regular graphs of the same size and degree apart. If the task needs that, the architecture
has to change, not the hyperparameters.

**Simple baselines are competitive, and this keeps being found.** On the standard
citation benchmarks and on several larger ones, tuned logistic regression on node
features, label propagation, or a GCN with the nonlinearities removed and
$\hat{A}^K X$ precomputed match or beat published graph-network numbers, and much
of the reported spread between variants disappears under a common split and
tuning budget. Treat a new architecture's margin as provisional until the
baselines were tuned as hard.

**Scaling.** Full-batch training needs the whole graph resident, and minibatching
by node does not work naively, because a node's $L$-hop neighbourhood can cover
the graph — neighbour explosion. Sampling bounds it without making it free:
inference usually still wants full neighbourhoods, so train and test behaviour
differ.

A common evaluation mistake is reporting a transductive split and
describing the result as generalisation; a common interpretive mistake is
reading GAT's attention weights as explanations.

## Variants and alternatives

**GCN** is the cheap isotropic baseline and still a strong one. **GraphSAGE**
separates self from neighbours and samples, buying inductive use and minibatch
scale at the cost of estimator noise. **GAT** learns per-edge weights, buying
anisotropy for one score per edge; GATv2 later fixed a limitation that made the
original's attention effectively static across query nodes. **GIN** maximises
expressiveness within the framework by using sum aggregation. **Relational GCN**
handles typed edges.

Genuinely different approaches: **graph transformers** attend over all pairs with
structural encodings, buying long-range reach for $O(n^2)$ cost; **decoupled
propagation** separates prediction from smoothing and sidesteps depth limits;
**random-walk embeddings** and the **Weisfeiler–Lehman graph kernel** feed an
off-the-shelf classifier without end-to-end training; and **label propagation**
classifies nodes with no learned parameters at all.

## History and attribution

Two lineages merged. Neural networks over structured data go back to Sperduti and
Starita in 1997; the name "graph neural network" comes from Gori, Monfardini and
Scarselli in 2005, with the fuller treatment by Scarselli and colleagues in 2009,
where the model was a contraction mapping iterated to a fixed point rather than a
stack of layers. Separately, Bruna and co-authors defined convolution on graphs
spectrally in 2014, Defferrard and colleagues localised it with Chebyshev
polynomials in 2016, and Kipf and Welling's 2017 first-order renormalised
simplification of that filter — the GCN — made the family popular. The spatial
line ran in parallel through neural molecular fingerprints, GraphSAGE and GAT;
Gilmer et al. unified the lot as message passing in 2017, and Xu et al. and
Morris et al. independently supplied the expressiveness theory in 2019.

## Sources

Kipf and Welling give the GCN propagation rule, its derivation from a spectral
filter, and the transductive semi-supervised setting the early benchmarks used.
Veličković et al. give the attention coefficients, multi-head aggregation and an
explicit inductive evaluation on held-out graphs. Gilmer et al. are the reference
for framing these as one family and for graph-level property prediction on
molecules. Xu et al. supply the Weisfeiler–Lehman bound and which aggregators
reach it.

## Prerequisites and next connections

Read the message passing page first: it carries the aggregate-and-update form
every layer here instantiates, and this page assumes it.
[Multilayer Perceptrons](./multilayer-perceptrons.md) and
[Attention](./attention.md) cover the rest of the machinery.

Afterwards, [Transformers](./transformers.md) is the same computation on a
complete graph and is worth reading against GAT;
[Convolutional Networks](./convolutional-networks.md) shows what the grid
assumption buys that a graph cannot have;
[Spectral Clustering](./spectral-clustering.md) covers the graph Laplacian the
spectral derivation starts from; and
[Graph Algorithms](./graph-algorithms.md) is the exact counterpart to what these
models approximate.
