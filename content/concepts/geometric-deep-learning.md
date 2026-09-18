---
concept_id: concept.deep_learning.geometric_deep_learning
title: Geometric Deep Learning
slug: /concepts/geometric-deep-learning
aliases:
  - GDL
kind: concept
tier: 1
review_state: generated-draft
summary: A programme that derives neural network architectures from the symmetry group of the domain the data lives on, under which convolutional, graph, transformer and mesh networks turn out to be one blueprint instantiated on different domains.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.equivariance
    note: Every layer in the blueprint is defined by the condition that it commutes with a group action, so the equivariance condition has to be understood before any of the architectures can be read off from it.
  - type: generalizes
    target: concept.analysis.translation_equivariance
    note: The grid with its translation group is one entry in the blueprint's table, and the programme replaces the translation group in that argument with an arbitrary symmetry group acting on an arbitrary domain.
  - type: generalizes
    target: concept.deep_learning.graph_neural_networks
    note: A graph network is what the blueprint produces when the domain is a node set, the group is the full permutation group and the equivariant layer is restricted to be local.
  - type: contributes_to
    target: concept.deep_learning.spherical_cnns
    note: Spherical CNNs are one of the few architectures designed forward from the symmetry argument rather than recovered by it — the sphere and the rotation group fix the form of the layer before any experiment is run.
sources:
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.cohen2016.group_equivariant_networks
    title: Group Equivariant Convolutional Networks
    url: https://arxiv.org/abs/1602.07576
    source_kind: preprint
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.cohen2018.spherical_cnns
    title: Spherical CNNs
    url: https://arxiv.org/abs/1801.10130
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
    checked_on: 2026-09-17
unresolved_references:
  - label: 'Bronstein, Bruna, LeCun, Szlam and Vandergheynst, "Geometric deep learning: going beyond Euclidean data" (2017)'
    reason: The registry holds only the 2021 proto-book, but the name of the field was coined in this earlier survey; the attribution of the term is stated here without a citation that points at it directly.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Geometric deep learning** derives the admissible layers of a neural network
from the symmetry group of the domain its inputs live on. Fix a domain $\Omega$,
a group $G$ acting on it, and signals $x : \Omega \to \mathbb{R}^C$; ask which
maps between signal spaces commute with the action of $G$; take the answer as the
layer's design space. Out comes a blueprint — equivariant layers, pointwise
nonlinearities, coarsening, invariant readout — and a table of instantiations
whose five entries give Bronstein, Bruna, Cohen and Veličković their subtitle:
grids, groups, graphs, geodesics and gauges.

## Why it matters

A $224 \times 224$ colour image is a point in roughly 150,000 dimensions. Fitting
an arbitrary function there from a few million examples is hopeless; something
has to cut the hypothesis space down, and symmetry does it as an exact algebraic
constraint rather than a heuristic. A dense layer on a length-$n$ signal has
$n^2$ free parameters. Require it to commute with cyclic shifts and only $n$
survive — the layer _is_ a convolution, and the parameter sharing that
[Convolutional Networks](./convolutional-networks.md) were built with by hand
falls out of the constraint instead of being stipulated.

It also answers a design question that used to be answered by taste. Confronted
with molecules, meshes, point clouds or omnidirectional images, "what is the
convolution here?" has a derivation: the maps that commute with the relevant
group. And it supplies a taxonomy — a way of saying precisely what a
convolutional network and a graph network have in common.

## Intuition

Felix Klein's Erlangen Programme of 1872 proposed that a geometry be identified
not by its axioms but by its group of transformations: Euclidean geometry is what
survives rigid motions, projective geometry what survives projective maps.
Geometric deep learning runs the same move on architectures — declare which
transformations of the input should not change the answer, and the layers fall
out.

Picture it as filtering the space of all linear maps. Start with every matrix;
impose commutation with the group; what remains is a small structured subspace,
and it is always some form of weight sharing — the same weights reused across
group elements.

Where the analogy breaks: Klein's groups act on spaces that really are exactly
symmetric. Data are not. Photographs have a canonical "up", so their rotation
symmetry is a modelling choice, whereas a graph's invariance to node relabelling
is exact. Choosing the group wrongly costs accuracy, not elegance.

## Concrete example

Take a set of $n = 3$ elements with scalar features and ask for the linear maps
commuting with every permutation. A general map is a $3 \times 3$ matrix: nine
parameters. Equivariance collapses it to a two-dimensional space,

$$
B = \alpha I + \beta \mathbf{1}\mathbf{1}^{\top} .
$$

With $\alpha = 2$, $\beta = 1$ and $x = (1, 2, 4)$, we get
$Bx = 2x + (\textstyle\sum_i x_i)\mathbf{1} = (2,4,8) + (7,7,7) = (9, 11, 15)$.
Permute the input to $(2, 4, 1)$ and the output is $(11, 15, 9)$ — the same
permutation, applied to the same numbers.

```python
import numpy as np

n, alpha, beta = 3, 2.0, 1.0
B = alpha * np.eye(n) + beta * np.ones((n, n))
x = np.array([1.0, 2.0, 4.0])
P = np.array([[0, 1, 0], [0, 0, 1], [1, 0, 0]], dtype=float)  # a permutation

assert np.allclose(B @ (P @ x), P @ (B @ x))   # equivariance
print(B @ x)                                   # [ 9. 11. 15.]
```

The two surviving parameters mean "keep yourself" and "add the sum over the
whole set, yourself included". Replace the all-ones matrix by an adjacency
matrix, so the sum runs over neighbours instead, and you have the standard graph
layer. This one calculation is the method in miniature.

## Formal treatment

Let $\mathcal{X}(\Omega, \mathbb{R}^C) = \{x : \Omega \to \mathbb{R}^C\}$ be the
signal space. A group $G$ acting on $\Omega$ induces a linear representation on
signals, $(\rho(g)x)(u) = x(g^{-1}u)$ for $u \in \Omega$ — the _regular_
representation. A map $f$ between signal spaces is **$G$-equivariant** if
$f \circ \rho(g) = \rho'(g) \circ f$ for all $g \in G$, and **$G$-invariant** if
$\rho'(g)$ is the identity. The blueprint is any network of the form

$$
f \;=\; A \circ \sigma_J \circ B_J \circ P_{J-1} \circ \cdots \circ P_1 \circ \sigma_1 \circ B_1 ,
$$

where each $B_j$ is a local $G$-equivariant linear layer, $\sigma_j$ is a
pointwise nonlinearity, each $P_j$ is a coarsening $\Omega_j \to \Omega_{j+1}$
compatible with the action, and $A$ is an invariant global readout. Three
principles do the work: **symmetry** (the constraint on $B_j$), **locality**
($(B_j x)(u)$ depends only on $x$ near $u$) and **scale separation** (the target
factors approximately through the coarsened domains, which is what licenses
$P_j$ at all).

When $G$ acts transitively on $\Omega$ and features carry the regular
representation, every linear equivariant map is a group convolution,

$$
(x \star \theta)(g) \;=\; \sum_{h \in G} x(h)\,\theta(g^{-1}h) ,
$$

written here for discrete $G$; for a compact continuous group the sum becomes an
integral against the Haar measure. For $G = \mathbb{Z}^2$ on a grid this is
ordinary discrete [Convolution](./convolution.md), and for $G = SO(3)$ on the
sphere it is spherical correlation. The table of instantiations then reads: grid
and translations, a CNN; a discrete group such as $p4$, a group-equivariant CNN;
sphere and $SO(3)$, a spherical CNN; set or graph and the permutation group,
Deep Sets and [Graph Neural Networks](./graph-neural-networks.md); complete
graph, [Transformers](./transformers.md); manifold with isometries and local
gauge freedom, mesh and gauge-equivariant networks.

## Assumptions and requirements

The symmetry has to hold in the data-generating process, or be harmless. Quotient
out a real asymmetry and the model cannot express it: a fully rotation-invariant
digit classifier cannot separate 6 from 9.

Pointwise nonlinearities preserve equivariance only when the group action
permutes the coordinates of the feature vector, as it does for regular
representations — which is why group-equivariant CNNs may use ReLU unchanged. For
steerable features carrying irreducible representations of a continuous group,
elementwise ReLU is _not_ equivariant, and norm-based or gated nonlinearities are
required instead. This is the most often missed hypothesis.

Coarsening must commute with the action too. A stride-2 pooling layer respects
only the subgroup of even shifts, which is why real CNNs are approximately rather
than exactly shift-equivariant (see [Pooling](./pooling.md)). Scale separation is
an assumption about the target function, not a theorem: nothing guarantees that a
stack of local layers can substitute for a global one.

## Uses and applicability

Reach for the programme when the domain is not a grid or the symmetry is exact
and large: molecules and force fields (E(3)- and SE(3)-equivariant networks),
meshes and point clouds, spherical signals in omnidirectional vision, cosmology
and climate, and anything graph-structured. Cohen et al. demonstrate the
spherical case on 3D shape recognition and molecular energy regression, where the
input has no preferred orientation. It is also the quickest route to seeing a
transformer as a permutation-equivariant network on a complete graph, and to
understanding that positional encoding exists to _break_ that symmetry.

Do not reach for it when the symmetry is only approximate and data are plentiful,
where augmentation is cheaper; when the exact constraint is expensive, as
spherical convolution is; or when you cannot say what the group is.

## Limitations and common mistakes

The framework is explanatory and unifying before it is generative. Most of its
cells were filled by architectures invented for other reasons and read back into
the blueprint afterwards. The exceptions are genuine — group-equivariant,
spherical, gauge and E(3)-equivariant networks were designed forward from the
symmetry argument — but "the blueprint predicts new architectures" overstates
what it has done.

It also explains only one axis of a working network. Depth, width, residual
connections, normalisation, initialisation, the optimiser and the generalisation
of overparameterised models all sit outside it. The blueprint constrains the
linear map inside a layer and says nothing about learning dynamics; a
symmetry-correct network can still train badly.

Equivariance is a constraint, not a capability: permutation-equivariant message
passing is bounded above in what it can distinguish, so symmetry does not buy
expressive power. Nor is more symmetry always better — empirically, with very
large pretraining sets, the weakly constrained
[Vision Transformer](./vision-transformer.md) matches or beats convolutional
models on image benchmarks. Symmetry buys sample efficiency; whether that
advantage survives scale, and whether baked-in equivariance beats plain
augmentation, are not settled.

## Variants and alternatives

**Group-equivariant CNNs** handle discrete groups such as $p4$ and $p4m$
cheaply and exactly, but only discretely. **Steerable CNNs** handle continuous
groups through irreducible representations and steerable kernel bases, buying
exact rotation behaviour at the cost of representation theory and restricted
nonlinearities. **Spherical CNNs** realise $SO(3)$ equivariance through a
generalised Fourier transform, exact but expensive. **Gauge-equivariant and mesh
CNNs** work where there is no global symmetry at all, using local frames on a
[Manifold](./manifolds.md).

Competing approaches avoid constraining the architecture. **Data augmentation**
gives approximate invariance for free and is a strong baseline.
**Canonicalisation and frame averaging** apply an unconstrained network at a
canonical pose, or average its output over a small set of poses — exact
invariance at no architectural cost, though the canonicalisation map can be
discontinuous. **Relaxed equivariance** treats the symmetry as a soft penalty
where it only approximately holds.
**Invariant features** — distances and angles instead of coordinates — are the
simplest option and lose directional information.

## History and attribution

This idea has several independent origins. Klein's Erlangen Programme of 1872
supplies the organising analogy, and symmetry-first reasoning has been standard
in physics since the early twentieth century. Weight sharing derived from
translation symmetry goes back to the neocognitron and the convolutional networks
of the late 1980s, well before the group-theoretic framing became standard. The
term _geometric deep learning_ was coined in a 2017 survey by Bronstein and
co-authors on learning over graphs and manifolds. The explicit group-theoretic
derivation of layers came with Cohen and Welling's group-equivariant CNNs in
2016, extended to the sphere in 2018; the blueprint in its present form, with
the Erlangen analogy made explicit, is the 2021 proto-book.

## Sources

The **Geometric Deep Learning** proto-book is the primary reference: the
blueprint, the five domains, the permutation-equivariant layer and the Erlangen
framing all come from it. **Group Equivariant Convolutional Networks** is the
cleanest statement of group convolution on a discrete group and of why pointwise
nonlinearities survive it. **Spherical CNNs** covers the continuous-group case
and its applications. **Deep Learning, Chapter 9** is the background on parameter
sharing and equivariance in ordinary convolution.

## Prerequisites and next connections

Read [Group Theory](./group-theory.md) first — group actions and their
representations are the language the blueprint is written in — and be comfortable
with equivariance as a property before reading the layer derivations.
[Translation Equivariance](./translation-equivariance.md) is the special case
everything else varies on.

From here, [Graph Neural Networks](./graph-neural-networks.md) and
[Message Passing](./message-passing.md) are the permutation-symmetric branch,
[Transformers](./transformers.md) the complete-graph case, and
[Lie Groups](./lie-groups.md) with
[Representation Theory](./representation-theory.md) are what the continuous-group
architectures require.
