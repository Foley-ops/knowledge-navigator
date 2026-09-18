---
concept_id: concept.deep_learning.equivariance
title: Equivariance
slug: /concepts/equivariance
aliases:
  - G-equivariance
kind: property
tier: 1
review_state: generated-draft
summary: The condition that a map commutes with a group acting on its input and on its output, which is how a known symmetry of a problem becomes a constraint the architecture cannot violate.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.algebra.group_theory
    note: The definition is a statement about a group acting on two spaces, and a reader who has not met groups, actions and homomorphisms cannot read it.
  - type: generalizes
    target: concept.analysis.translation_equivariance
    note: Translation equivariance is this condition with G fixed to the translation group acting the same way on input and output.
  - type: contributes_to
    target: concept.deep_learning.geometric_deep_learning
    note: Equivariance to a domain's symmetry group is the organising constraint that the geometric deep learning blueprint uses to derive architectures.
  - type: contrasts_with
    target: concept.deep_learning.vision_transformer
    note: Vision transformers deliberately drop built-in spatial equivariance and recover approximate tolerance from data and augmentation instead, which is the opposing side of the same design trade-off.
sources:
  - source_id: source.cohen2016.group_equivariant_networks
    title: Group Equivariant Convolutional Networks
    url: https://arxiv.org/abs/1602.07576
    source_kind: preprint
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.bronstein2021.geometric_deep_learning
    title: 'Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges'
    url: https://arxiv.org/abs/2104.13478
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.dosovitskiy2021.vision_transformer
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale'
    url: https://arxiv.org/abs/2010.11929
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Quantitative generalisation theory for equivariant hypothesis classes, and measurements of residual equivariance error in augmentation-trained networks
    reason: The registry has no source that proves a sample-complexity or risk bound for equivariant models, and none that reports measured equivariance error of networks trained with augmentation, so the comparison between built-in and learned symmetry is stated qualitatively here rather than with numbers.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Deep architectures built over general symmetry groups before the 2016 group-convolution papers
    reason: The registry has no source for the pre-2016 work that already formed deep feature maps over arbitrary symmetry groups, so the history section credits Cohen and Welling with the formulation now in use and notes only that the priority is not theirs alone, without naming the earlier work.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Equivariance** is the condition that a map commutes with a group action. Let
$G$ be a group acting on an input space $X$ through $\rho(g) : X \to X$ and on an
output space $Y$ through $\rho'(g) : Y \to Y$, where both $\rho$ and $\rho'$ are
group homomorphisms into the invertible maps of their space. A map
$\Phi : X \to Y$ is **$G$-equivariant** when

$$
\Phi\bigl(\rho(g)\,x\bigr) \;=\; \rho'(g)\,\Phi(x)
\qquad \text{for all } g \in G,\; x \in X ,
$$

and **$G$-invariant** when the same holds with $\rho'(g) = \mathrm{id}_Y$, so
that $\Phi(\rho(g)x) = \Phi(x)$. Invariance is not a separate idea: it is
equivariance with a trivial action on the output.

Three things must be named before the word means anything: the group, the action
on the input, and the action on the output. "The network is equivariant", with
those unstated, is not a claim.

## Why it matters

A symmetry is knowledge you hold before seeing any data: rotating a molecule does
not change its energy. An unconstrained network spends capacity and examples
rediscovering that pose by pose. Building equivariance in removes that whole
direction of variation from the hypothesis space without discarding the correct
hypothesis, which was equivariant to begin with.

The mechanism is parameter sharing generalised from position to a group.
Convolution shares one filter across all translations, so an edge detector learned
once works everywhere; a group convolution shares it across all of $G$, so a
filter learned from an upright example already works at every rotation in the
group, with no growth in parameter count. That the constrained class is strictly
smaller is a mathematical fact; that the constraint improves accuracy is an
empirical finding, strongest where data are scarce and the symmetry exact.

## Intuition

The picture to carry is a commuting square. Transform the input and then run the
network, or run the network and then transform the output, and you land in the
same place. The network is not blind to the transformation; it tracks it.

The useful analogy is a change of coordinates in physics: the law does not care
which frame you chose, but the components of a vector change with the frame, in a
known way. A feature map behaves like a field, not a bag of numbers.

The analogy breaks at the output action, which people read as "the same
transformation applied to the output" and often is not. Rotate the input of a
group-convolutional network and its feature maps rotate spatially _and_ permute
among the channels indexing the group. Getting $\rho'$ wrong is the most common
way a claimed equivariance turns out false.

## Concrete example

Take $G = p4$: translations of the square grid together with rotations by
multiples of $90^\circ$. A first layer _lifts_ an image to four feature maps, one
per rotation of the same filter. Rotating the input rotates each map and cyclically
shifts which map is which.

```python
import numpy as np

def corr2d(x, k):
    kh, kw = k.shape
    H, W = x.shape[0] - kh + 1, x.shape[1] - kw + 1
    return np.array([[(x[i:i + kh, j:j + kw] * k).sum() for j in range(W)]
                     for i in range(H)])

def lift(x, psi):
    """p4 lifting correlation: one image -> 4 maps, one per 90-degree rotation."""
    return np.stack([corr2d(x, np.rot90(psi, r)) for r in range(4)])

rng = np.random.default_rng(0)
x, psi = rng.standard_normal((8, 8)), rng.standard_normal((3, 3))

y = lift(x, psi)                 # shape (4, 6, 6)
y_rot = lift(np.rot90(x), psi)   # network applied to the rotated image

expected = np.roll(np.rot90(y, axes=(1, 2)), 1, axis=0)  # rotate maps, roll index
assert np.allclose(y_rot, expected)                      # this is rho'(r)
```

The assertion holds to floating-point precision, not approximately. Note what
$\rho'$ had to be: a spatial rotation _and_ a roll along the new axis. Drop the
roll and the identity fails immediately.

## Formal treatment

An action of $G$ on $X$ is a map $G \times X \to X$ with $e \cdot x = x$ and
$g \cdot (h \cdot x) = (gh) \cdot x$. When $X$ is a vector space and each
$\rho(g)$ is linear, $\rho$ is a _representation_, and an equivariant linear map
between representations is an intertwiner. Equivariance composes: if $\Phi_1$ is
equivariant from $(\rho, \rho')$ and $\Phi_2$ from $(\rho', \rho'')$, then
$\Phi_2 \circ \Phi_1$ is equivariant from $(\rho, \rho'')$ — which is why it can
be engineered layer by layer.

The structural result behind group-convolutional networks is that correlation of
signals on a group with a fixed filter is equivariant. For $f, \psi : G \to
\mathbb{R}$ define

$$
(f \star \psi)(g) \;=\; \sum_{h \in G} f(h)\,\psi(g^{-1}h) ,
$$

and let $G$ act on signals by $(\Lambda_u f)(g) = f(u^{-1}g)$. Then

$$
(\Lambda_u f) \star \psi \;=\; \Lambda_u (f \star \psi) ,
$$

which Cohen and Welling verify by substitution. For a compact group the sum
becomes an integral against the Haar measure. The first layer is the case where
$f$ lives on the grid $\mathbb{Z}^2$ and its output on $G$ — the lift above.

Non-linearities need care. A pointwise function on signals over $G$ is equivariant
when the action permutes the domain, since permuting coordinates and applying a
function coordinatewise commute. That argument does **not** cover general
representations: if $\rho'(g)$ mixes channels, a pointwise ReLU breaks
equivariance, and norm-based or gated non-linearities are used instead. Invariance
is then taken deliberately at the end, by pooling over the group:
$\max_{g \in G} \Phi(x)(g)$ and its mean are $G$-invariant by construction.

## Assumptions and requirements

The transformations must form a group. "Rotations up to $15^\circ$" is not closed
under composition and nothing above applies to it; partial and approximate
symmetry is a real topic but a different one.

The group must act on the data's actual domain, exactly. The four $90^\circ$
rotations act on a square pixel grid with no interpolation, which is why $p4$ is
cheap and exact; continuous rotations do not, so an $SO(2)$-equivariant grid
network pays an interpolation error. Compactness matters too: group pooling needs
a finite sum or a normalisable invariant measure, and scaling or translation of
the real line admits no uniform group average.

The symmetry must be a symmetry _of the task_, not merely of the input space. If
the label depends on pose — a $6$ against a rotated $9$, "up" in a road scene, the
chirality of a molecule — imposing invariance to that group makes the correct
function unrepresentable, and no training recovers it. This is the assumption most
often false in practice, and it fails silently.

## Uses and applicability

Reach for built-in equivariance when the symmetry is exact, the data are limited,
and test inputs will appear in poses the training set did not cover: molecules and
point clouds under $E(3)$, spherical signals under $SO(3)$ in climate and
omnidirectional imaging, microscopy and astronomy images with no canonical
orientation, and any task on sets or graphs, where permutation equivariance of
message passing is what makes a
[Graph Neural Network](./graph-neural-networks.md) well defined at all.

It is worth recognising where equivariance already holds unadvertised.
Self-attention is exactly permutation-equivariant in its tokens — a fact about the
operation, and precisely why a [Transformer](./transformers.md) needs positional
information injected before order can matter.

Do not reach for it when the per-layer cost, which scales with $|G|$, buys little:
on tasks with a canonical orientation and millions of labels the constraint is
mostly overhead.

## Limitations and common mistakes

The first mistake is trading the word for invariance. A convolutional body is
equivariant, not invariant, and any invariance comes from aggregation at the end;
[Translation Equivariance](./translation-equivariance.md) works that case through.

The second is assuming the architecture delivers what the theory promises. Any
non-equivariant component destroys it: strides and [Pooling](./pooling.md) break
translation equivariance for shifts that are not multiples of the stride, padding
breaks it at the boundary, interpolation for off-grid transformations introduces
error, and a pointwise non-linearity on a channel-mixing representation breaks it
outright. Equivariance is measurable — report
$\lVert \Phi(\rho(g)x) - \rho'(g)\Phi(x) \rVert / \lVert \Phi(x) \rVert$ over
sampled $g$ rather than asserting it is zero.

The third is expecting a symmetry the operation does not have: ordinary
convolution is equivariant to translation and not, in general, to rotation, scale
or reflection — the rotation and scale cases a point the Deep Learning book makes
explicitly.

The fourth is believing more prior is always better. Vision transformers carry far
weaker image-specific inductive bias, and Dosovitskiy et al. found they trail
convolutional networks on mid-sized data yet match or beat them after large-scale
pre-training. Built-in symmetry bets that data are scarcer than compute; the bet
is not always right.

## Variants and alternatives

**Group-convolutional networks** handle discrete groups such as $p4$ and $p4m$
exactly — both are infinite, since each contains every translation of the grid —
at a cost multiplying activations by the number of rotations and reflections the
group adds to translation: four for $p4$, eight for $p4m$. **Steerable** and
**harmonic** networks constrain the filter basis so features transform under
chosen irreducible representations, buying continuous rotation equivariance for a
more intricate implementation and restricted non-linearities. **Spherical CNNs**
work in the Fourier domain of $SO(3)$, and **gauge-equivariant** networks extend
the idea to manifolds with no global symmetry group. **Frame averaging** and
**canonicalisation** instead make any network equivariant, by averaging outputs
over the group or mapping each input to a canonical pose: architecture-agnostic,
but costly per sample or reliant on a canonicalisation that may be discontinuous.

The genuine competitor is **data augmentation**: show the model transformed copies
and let it learn approximate equivariance. It imposes no architectural constraint,
works for transformations that form no group, and degrades gracefully when the
symmetry is only approximate. It gives up the guarantee — learned equivariance
holds where the data were dense and fails elsewhere, costs capacity and training
steps, and cannot be audited by reading the architecture. Which is preferable is
not settled, and turns on data scale, exactness of the symmetry, and inference
budget.

## History and attribution

The mathematics is old and was not invented for neural networks: equivariant maps
between representations are standard in representation theory, and Klein's 1872
Erlangen programme recast geometry as the study of the invariants of a
transformation group — the explicit model Bronstein and co-authors take for
geometric deep learning. In neural networks the translation case came first and
implicitly, as the weight sharing of the neocognitron and of
[LeNet](./lenet.md).

Cohen and Welling (2016), working on sample efficiency in image classification,
gave the group-theoretic formulation that group-equivariant deep networks are
built on today, showing that convolution generalises to the symmetry groups $p4$
and $p4m$ of the square grid while staying cheap. Earlier work had already built
deep feature maps over general symmetry groups, so the priority is not theirs
alone. The unification of grids, groups, graphs, geodesics and
gauges under one symmetry-based blueprint was set out by Bronstein, Bruna, Cohen
and Veličković (2021).

## Sources

- **Group Equivariant Convolutional Networks** — the definition, the proof that
  group correlation is equivariant, and the $p4$/$p4m$ construction.
- **Geometric Deep Learning: Grids, Groups, Graphs, Geodesics, and Gauges** — the
  group-action framing, the Erlangen lineage, and the survey of steerable,
  spherical and gauge-equivariant variants.
- **Deep Learning, Chapter 9** — equivariance from parameter sharing, and that
  convolution is not equivariant to rotation or scale.
- **An Image is Worth 16x16 Words** — evidence that weak inductive bias plus scale
  can outperform strong architectural priors.

## Prerequisites and next connections

Read [Group Theory](./group-theory.md) first — groups, homomorphisms and actions
are the whole content of the definition — then
[Translation Equivariance](./translation-equivariance.md), the case where every
abstraction above becomes concrete.

From here, [Representation Theory](./representation-theory.md) supplies the
machinery for the continuous case, [Lie Groups](./lie-groups.md) the groups
themselves, [Convolutional Layer](./convolutional-layer.md) the operation being
generalised, and [Graph Neural Networks](./graph-neural-networks.md) the
permutation-equivariant setting where the principle shapes a very different
architecture.
