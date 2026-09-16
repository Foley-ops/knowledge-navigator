---
concept_id: concept.analysis.translation_equivariance
title: Translation Equivariance
slug: /concepts/translation-equivariance
aliases:
  - shift equivariance
kind: property
tier: 1
review_state: generated-draft
summary: The property that shifting a map's input shifts its output the same way, distinct from invariance, where shifting the input leaves the output unchanged.
categories:
  - Mathematics/Analysis
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.convolution
    note: Convolution is the canonical translation-equivariant linear map, and the property is usually stated about it first.
sources:
  - source_id: source.cohen2016.group_equivariant_networks
    title: Group Equivariant Convolutional Networks
    url: https://arxiv.org/abs/1602.07576
    source_kind: preprint
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-16
---

## Definition

Let $T_s$ denote translation by $s$, so $(T_s x)(u) = x(u - s)$. A map $\Phi$ is

- **translation-equivariant** when $\Phi(T_s x) = T_s\,\Phi(x)$ for every $s$, and
- **translation-invariant** when $\Phi(T_s x) = \Phi(x)$ for every $s$.

Equivariance says the output _moves with_ the input. Invariance says the output
_ignores_ the movement. Invariance is the special case of equivariance in which
the group acts trivially on the output.

## Why it matters

The distinction decides what a layer can represent. A feature map that is
equivariant still knows _where_ the evidence was; a representation that is
invariant has thrown that away. A detector needs equivariance in its body so it
can report positions, and invariance only at the very end if the task is
whole-image classification. Confusing the two is how architectures end up unable
to localise, or unable to generalise across position.

## Intuition

Slide an object two pixels to the right in the image. Under equivariance the
feature map slides two pixels to the right as well: the same detector fires, at
the shifted location. Under invariance the summary is identical before and after,
so nothing in it reveals that the object moved.

[Convolution](./convolution.md) gives equivariance because it applies the same
kernel at every position — parameter sharing is the mechanism. Global pooling
gives invariance because it discards position by aggregating over it.

## Concrete example

Take a one-dimensional signal $x = [0, 0, 1, 0, 0]$ and the edge kernel
$g = [1, -1]$. Cross-correlating gives a response with a distinctive pattern
centred where the impulse is. Shift the input to $x' = [0, 0, 0, 1, 0]$ and the
response is the same pattern, shifted one position right: equivariance.

Now apply global max pooling to each response. Both give the same single number.
The shift has become invisible: invariance. Nothing about the kernel changed —
only what was done with its output.

## Formal treatment

For a group $G$ acting on the input space by $\pi_G$ and on the output space by
$\pi'_G$, a map $\Phi$ is **$G$-equivariant** when

$$
\Phi \circ \pi_G(g) \;=\; \pi'_G(g) \circ \Phi \qquad \text{for all } g \in G .
$$

Translation equivariance is this with $G$ the translation group and
$\pi_G = \pi'_G = T$. Invariance is the case $\pi'_G(g) = \mathrm{id}$.

For linear maps on functions over $\mathbb{R}^n$ or $\mathbb{Z}^n$ the property
is a characterisation, not merely an example: a linear, translation-equivariant,
suitably continuous operator **is** a convolution with some kernel. This is the
linear shift-invariant systems theorem of signal processing, and it explains why
convolution is not one choice among many but the only linear option once
equivariance is demanded.

Equivariance composes: if $\Phi_1$ and $\Phi_2$ are $G$-equivariant then so is
$\Phi_2 \circ \Phi_1$. Pointwise non-linearities are translation-equivariant
because they act independently at each position, so a stack of convolutions and
elementwise non-linearities is equivariant as a whole. Cohen and Welling
generalise this to larger groups, building layers equivariant to rotations and
reflections as well.

## Assumptions and requirements

The clean statement assumes an unbounded domain. Real images are finite, so:

- **Boundaries break it.** Near the edge, a shifted object moves into or out of
  the padded region, so equivariance holds only away from the border, or exactly
  under circular padding.
- **Subsampling breaks it.** A stride-$s$ layer is equivariant only to shifts
  that are multiples of $s$; other shifts change the sampling phase. This is why
  small translations can change a strided network's output noticeably.
- **Discretisation breaks it** for non-integer shifts, which require
  interpolation.

Equivariance also assumes the _same_ parameters are used at every position.
Locally connected layers, which use different weights per position, are local but
not equivariant.

## Uses and applicability

Equivariance is the reason a [Convolutional Layer](./convolutional-layer.md) can
learn a detector once and apply it everywhere, which is a statement about sample
efficiency as much as about structure. It is what makes dense prediction —
segmentation, detection, super-resolution — natural in a convolutional network:
the output grid stays aligned with the input grid.

Invariance is appropriate only where position genuinely does not matter, and is
best obtained deliberately at the end of the network — typically by global
pooling — rather than accumulated accidentally through the body.

## Limitations and common mistakes

The most frequent error is claiming that convolutional networks are
_translation-invariant_. They are approximately equivariant in their body; any
invariance comes from the aggregation at the end, and even that is only
approximate once striding and boundaries are accounted for.

A second error is assuming [Pooling](./pooling.md) confers meaningful invariance.
A $2 \times 2$ max-pool gives exact invariance only to shifts within its own
window, and its stride simultaneously breaks equivariance for shifts that are not
multiples of the stride.

A third is expecting equivariance to other transformations. Ordinary convolution
is equivariant to translation and to nothing else: not rotation, not scaling, not
reflection.

## Variants and alternatives

**Group-equivariant convolution** extends the property to rotations and
reflections by convolving over a larger group. **Steerable** and **harmonic**
networks achieve continuous rotation equivariance through structured filter
bases. **Anti-aliased downsampling** inserts a low-pass filter before
subsampling to restore approximate shift-equivariance across a strided stage.
**Data augmentation** buys approximate invariance statistically rather than
structurally, which is weaker but imposes no architectural constraint.

## History and attribution

The characterisation of linear shift-invariant systems as convolutions is
classical signal-processing theory. Its use as a design principle for neural
networks runs through Fukushima's neocognitron and
[LeNet](./lenet.md), where weight sharing is introduced precisely so that a
feature detector applies everywhere. The modern group-theoretic framing, and the
explicit vocabulary of equivariance used above, follow Cohen and Welling (2016).

## Sources

- **Group Equivariant Convolutional Networks** — the group-theoretic definition,
  composition of equivariant layers, and the extension beyond translation.
- **Deep Learning, Chapter 9** — the equivariance-versus-invariance distinction
  for convolutional networks and the role of parameter sharing.
- **MIT 6.003 Signals and Systems** — linear shift-invariant systems and the
  convolution characterisation.

## Prerequisites and next connections

Read [Convolution](./convolution.md) first: it is the operation this property
characterises.

Next, [Convolutional Layer](./convolutional-layer.md) shows parameter sharing in
practice, [Pooling](./pooling.md) shows where invariance is commonly claimed and
what is actually obtained, and [Receptive Field](./receptive-field.md) explains
why the same field applies at every position.
