---
concept_id: concept.deep_learning.residual_connection
title: Residual Connection
slug: /concepts/residual-connection
aliases:
  - skip connection
  - shortcut connection
kind: method
tier: 1
review_state: generated-draft
summary: An identity shortcut added around a block so the block learns a residual, introduced to make very deep networks trainable and to give gradients a direct path backwards.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.backpropagation_through_convolution
    note: The argument for residual connections is about how gradients behave as they are propagated back through many convolutional layers.
sources:
  - source_id: source.he2016.deep_residual_learning
    title: Deep Residual Learning for Image Recognition
    url: https://arxiv.org/abs/1512.03385
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-16
  - source_id: source.he2016.identity_mappings
    title: Identity Mappings in Deep Residual Networks
    url: https://arxiv.org/abs/1603.05027
    source_kind: preprint
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-16
  - source_id: source.veit2016.residual_networks_as_ensembles
    title: Residual Networks Behave Like Ensembles of Relatively Shallow Networks
    url: https://arxiv.org/abs/1605.06431
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - uses-and-applicability
    checked_on: 2026-09-16
  - source_id: source.li2018.loss_landscape
    title: Visualizing the Loss Landscape of Neural Nets
    url: https://arxiv.org/abs/1712.09913
    source_kind: preprint
    supports:
      - intuition
      - limitations-and-common-mistakes
    checked_on: 2026-09-16
---

## Definition

A **residual connection** adds a block's input to its output:

$$
y \;=\; \mathcal{F}(x, \{W_i\}) \;+\; x ,
$$

where $\mathcal{F}$ is the block — typically two or three
[Convolutional Layer](./convolutional-layer.md)s with non-linearities and
normalisation — and the added $x$ is the **identity shortcut**. The block is then
said to learn the _residual_ $\mathcal{F} = y - x$ rather than the full mapping
$y$.

When the block changes shape, the shortcut must be projected:
$y = \mathcal{F}(x) + W_s x$, with $W_s$ usually a $1 \times 1$ convolution with
matching stride.

## Why it matters

He et al. observed a **degradation** problem: adding layers to a plain deep
network made its _training_ error worse, not just its test error. That is not
overfitting — a deeper network can represent everything a shallower one can, by
setting the extra layers to the identity, so a worse training error means the
optimiser was failing to find a solution it demonstrably had available. Residual
connections made that identity solution easy to express, and networks of $50$,
$101$ and $152$ layers became trainable where plain networks of comparable depth
were not.

## Intuition

If the useful thing for a block to do is "leave the representation roughly
alone", a plain block must learn to reproduce its input exactly through several
non-linear layers — a hard target. With a shortcut, the same behaviour is
$\mathcal{F} = 0$, which weight decay reaches naturally. The block only has to
learn the _correction_.

Backwards, the shortcut gives the gradient a route that is not multiplied by the
block's Jacobian, so it cannot be attenuated by that block. Li et al.'s loss-surface
visualisations show noticeably smoother landscapes for residual networks than for
otherwise identical plain networks — a suggestive picture rather than a proof.

## Concrete example

A basic ResNet block on a $64 \times 56 \times 56$ feature map:

```text
x ─┬─► conv 3×3, 64 ─► BN ─► ReLU ─► conv 3×3, 64 ─► BN ─┐
   │                                                     (+)─► ReLU ─► y
   └─────────────────── identity ────────────────────────┘
```

Both convolutions preserve shape, so the shortcut is a plain identity — no
parameters, no multiplications. At a stage transition where channels double and
resolution halves, the shortcut becomes a $1 \times 1$ convolution with stride
$2$ so the two tensors can be added.

If the block's weights are all zero, $y = x$ exactly: the block is a no-op and
the network behaves as if it were absent.

## Formal treatment

Stack $L$ residual blocks. With the pre-activation arrangement of He et al.
(2016b), where normalisation and activation sit _inside_ $\mathcal{F}$ and the
shortcut path is a clean identity, the composition telescopes:

$$
x_L \;=\; x_\ell \;+\; \sum_{i=\ell}^{L-1} \mathcal{F}(x_i, W_i) .
$$

Differentiating,

$$
\frac{\partial L}{\partial x_\ell}
\;=\; \frac{\partial L}{\partial x_L}
\left( 1 + \frac{\partial}{\partial x_\ell} \sum_{i=\ell}^{L-1} \mathcal{F}(x_i, W_i) \right).
$$

The leading $1$ is the point: the gradient reaching layer $\ell$ contains an
additive term that is **not** a product of Jacobians, so it cannot vanish through
repeated multiplication by small factors. The original block places a ReLU after
the addition, which breaks the clean identity slightly; the pre-activation
variant removes that obstruction and trains deeper networks more reliably.

Note what this does **not** say. It does not say gradients cannot vanish — the
second term still can, and the network can still be badly conditioned. It says
the identity path supplies a floor.

## Assumptions and requirements

The addition requires the two tensors to have identical shape. At every stage
where channel count or spatial size changes, a projection shortcut is needed, and
that projection reintroduces a multiplicative factor on the gradient path for
that stage.

The telescoping identity above assumes the shortcut is a _clean_ identity: no
normalisation, no activation, no gating on the shortcut path. He et al. (2016b)
test scaling, gating and convolutional shortcuts and report that all of them
perform worse than the plain identity, and that placing operations on the
shortcut path degrades results as depth grows.

Residual blocks in practice also assume a normalisation layer inside
$\mathcal{F}$; without it the two summands can differ in scale by orders of
magnitude and the shortcut is swamped.

## Uses and applicability

Residual connections are the default in deep convolutional networks, in
transformers, and in most deep sequence and generative architectures. They are
worth reaching for whenever depth is the thing being increased, whenever
degradation is observed — training error rising with depth — and whenever a block
should be able to cheaply do nothing.

They are unnecessary in shallow networks, where there is no degradation to fix,
and they add memory cost: the input of every block must be retained until the
addition, which raises peak activation memory.

## Limitations and common mistakes

The most common overstatement is that residual connections "solve the vanishing
gradient problem". They give an unattenuated additive path; they do not make the
optimisation problem convex, do not guarantee convergence, and do not remove the
need for normalisation and sensible initialisation. Normalisation layers were
already addressing much of the gradient-scale issue before residual networks
appeared.

A second is assuming that a residual network of depth $L$ behaves like a single
$L$-deep function. Veit et al. show that a residual network can be unrolled into
an exponential collection of paths of differing length, that the effective
gradient contribution is dominated by relatively _short_ paths, and that deleting
individual blocks at test time degrades performance only gracefully — behaviour
unlike a plain deep network. On that reading, residual networks act somewhat like
ensembles of shallower networks. This is a well-supported empirical account, not
a settled theory, and it coexists with the optimisation-landscape account rather
than replacing it.

A third is putting operations on the shortcut path — a ReLU, a normalisation, a
gate — which the identity-mappings study reports as harmful.

## Variants and alternatives

**Pre-activation** blocks move batch normalisation and ReLU before the
convolutions, leaving the shortcut a pure identity. **Bottleneck** blocks use
$1 \times 1$, $3 \times 3$, $1 \times 1$ convolutions to cut cost at high channel
counts. **Projection** shortcuts handle shape changes. **Dense connections**
concatenate rather than add, so features are reused instead of summed.
**Highway networks** gate the shortcut with a learned function — the immediate
predecessor, and the thing the identity shortcut simplified. **Stochastic depth**
drops whole blocks during training, which is coherent precisely because a
residual block can be the identity. **LayerScale** and **ReZero** initialise the
block's contribution near zero so training starts from the identity.

## History and attribution

Shortcut connections appear earlier — in highway networks, which gate them, and
further back in the neural-network literature. The specific contribution of He,
Zhang, Ren and Sun (2015) is the _ungated identity_ shortcut together with the
degradation diagnosis that motivates it, presented in the paper that introduces
[ResNet](./resnet.md). The follow-up study of what belongs on the shortcut path,
and the pre-activation ordering, is He et al. (2016).

## Sources

- **Deep Residual Learning for Image Recognition** — the degradation observation,
  the residual formulation, the basic and bottleneck blocks, and projection
  shortcuts.
- **Identity Mappings in Deep Residual Networks** — the telescoping derivation,
  the evidence that the shortcut should carry nothing, and pre-activation
  ordering.
- **Residual Networks Behave Like Ensembles of Relatively Shallow Networks** —
  the path-unrolling account and the block-deletion experiments.
- **Visualizing the Loss Landscape of Neural Nets** — the loss-surface comparison
  between plain and residual networks.

## Prerequisites and next connections

Read [Backpropagation Through Convolution](./backpropagation-through-convolution.md)
first; the argument here is about what happens to those gradients across many
layers.

Next, [ResNet](./resnet.md) is the architecture built from these blocks, and
[VGG](./vgg.md) is the deep plain network whose depth limits motivated them.
