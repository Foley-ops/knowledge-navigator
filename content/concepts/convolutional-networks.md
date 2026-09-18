---
concept_id: concept.deep_learning.convolutional_networks
title: Convolutional Networks
slug: /concepts/convolutional-networks
aliases:
  - CNN
kind: concept
tier: 1
review_state: generated-draft
summary: An architecture family in which almost all computation is local filtering with weights shared across position, so that depth buys a hierarchy of receptive fields instead of a larger parameter count.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_layer
    note: A convolutional network is a stack of these layers, so the layer's arithmetic must be understood before the architecture makes sense.
  - type: specializes
    target: concept.deep_learning.multilayer_perceptrons
    note: Each convolutional layer is a fully connected layer whose weight matrix is forced to be sparse and to repeat one small block at every position.
  - type: guarantees
    target: concept.analysis.translation_equivariance
    note: A stack of stride-one convolutions and pointwise nonlinearities commutes exactly with translation on an unbounded or circular domain.
  - type: contrasts_with
    target: concept.deep_learning.vision_transformer
    note: Both map images to features, but one builds locality and weight sharing into the architecture while the other learns them from data via global attention over patches.
sources:
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.lecun1998.gradient_based_learning
    title: Gradient-Based Learning Applied to Document Recognition
    url: https://ieeexplore.ieee.org/document/726791
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.dosovitskiy2021.vision_transformer
    title: 'An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale'
    url: https://arxiv.org/abs/2010.11929
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.liu2022.convnext
    title: A ConvNet for the 2020s
    url: https://arxiv.org/abs/2201.03545
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Evidence that zero padding lets a convolutional network encode absolute position
    reason: The claim that boundary padding leaks position information into an otherwise position-agnostic stack is an empirical result, and no source cited here establishes it.
    sections:
      - assumptions-and-requirements
claims: []
---

## Definition

A **convolutional network** is a feedforward network whose trunk composes
[Convolutional Layer](./convolutional-layer.md)s with pointwise nonlinearities,
interleaved with resolution reduction, and ends in a task head — one that
collapses the spatial axes for classification, or keeps them for dense
prediction. Three commitments define the family:

- **local connectivity** — a unit reads a small window of the layer below, not the
  whole map;
- **weight sharing** — one filter bank applies at every position, so the parameter
  count does not depend on the input size;
- **hierarchy** — depth composes those windows, so a late unit has a
  [Receptive Field](./receptive-field.md) covering much of the input even though
  every individual layer stayed local.

Everything else — nonlinearity, normalisation, how downsampling happens, what the
head looks like — is design, not definition.

## Why it matters

Count the parameters. A fully connected layer mapping a $224 \times 224 \times 3$
image to $4096$ units holds $150{,}528 \times 4096 \approx 6.2 \times 10^{8}$
weights and knows nothing about which coordinates are adjacent: permute the pixels
consistently and it learns just as well. The first convolutional layer of a
standard image network holds $3 \times 3 \times 3 \times 64 + 64 = 1{,}792$
weights, applies to an image of any size, and treats a vertical edge at the
top-left and one at the bottom-right as the same event for the same filter.

That is the trade: the architecture gives up arbitrary functions of pixel
position and gets back orders of magnitude fewer parameters plus a prior roughly
true of natural signals. LeCun and collaborators made exactly this argument for
character recognition — fully connected networks on images have too many
parameters, no notion of locality, and no way to tolerate a shift.

## Intuition

Picture a set of rubber stamps swept over the image. Each stamp reports how
strongly its pattern occurs at each position, producing a map, not a number.
Stack another set of stamps on those maps and they detect arrangements of the
first patterns; stack again and the arrangements get larger and more specific.
Downsampling between stages means each stamp of a later stage covers more of the
original image for the same kernel size.

The analogy breaks twice. Units at one depth are not really "looking for the same
thing everywhere": boundary padding and stride quantisation make position matter a
little. And the theoretical receptive field is not what a unit uses — influence
decays from the centre, so the _effective_ field is much smaller.

## Concrete example

A trunk of $3 \times 3$ convolutions with channel doubling and $2 \times 2$
pooling, the pattern [VGG](./vgg.md) made standard, written so it runs:

```python
import torch
from torch import nn

def stage(cin, cout, n):
    layers = []
    for i in range(n):
        layers += [nn.Conv2d(cin if i == 0 else cout, cout, 3, padding=1),
                   nn.BatchNorm2d(cout), nn.ReLU(inplace=True)]
    return nn.Sequential(*layers, nn.MaxPool2d(2))

net = nn.Sequential(
    stage(3, 64, 2), stage(64, 128, 2), stage(128, 256, 3),
    stage(256, 512, 3), stage(512, 512, 3),
    nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.Linear(512, 1000),
)
print(net(torch.randn(2, 3, 224, 224)).shape)      # torch.Size([2, 1000])
print(sum(p.numel() for p in net.parameters()))    # 15236136
```

Spatial size runs $224 \to 112 \to 56 \to 28 \to 14 \to 7$, channels run
$3 \to 64 \to \dots \to 512$, and the thirteen convolutions hold $14{,}714{,}688$
weights — fewer than the single fully connected layer above. The receptive field
at the end of the trunk is $212$ pixels: a unit there sees most of a $224$-pixel
input, not all of it.

Note where the architecture changes character. Up to `AdaptiveAvgPool2d` the
trunk maps feature maps that _move when the input moves_; the $1000$ outputs do
not move, and the line converting one into the other is the global average pool.

## Formal treatment

Write a feature map as $x^{(l)} \in \mathbb{R}^{C_l \times H_l \times W_l}$. One
layer, with kernel size $k$, stride $s$ and pointwise nonlinearity $\sigma$:

$$
x^{(l+1)}_{c,i,j} \;=\; \sigma\!\left( b^{(l)}_c + \sum_{c'=1}^{C_l}\;
\sum_{u=0}^{k-1}\sum_{v=0}^{k-1} w^{(l)}_{c,c',u,v}\, x^{(l)}_{c',\,si+u,\,sj+v} \right).
$$

The weights $w^{(l)}$ do not depend on $(i,j)$: that is the sharing. As a linear
map on the flattened input, the layer is a doubly block-Toeplitz matrix — sparse,
one small block repeated down every diagonal — which is why a convolutional
network is a multilayer perceptron with a constrained weight matrix rather than a
different species of model.

Let $(T_\tau x)(p) = x(p - \tau)$ be translation by $\tau \in \mathbb{Z}^2$. For
$s = 1$ on an unbounded or circular domain, each layer satisfies $g(T_\tau x) =
T_\tau g(x)$, and since $\sigma$ acts pointwise it commutes with $T_\tau$ too.
The whole trunk $F$ therefore inherits
[Translation Equivariance](./translation-equivariance.md),

$$
F(T_\tau x) \;=\; T_\tau F(x).
$$

This is equivariance, not invariance: the features move with the object.
Invariance is a separate step, produced by a head $\rho$ that is invariant to
permutations of position — global average or global max
[Pooling](./pooling.md) — because then

$$
\rho\big(F(T_\tau x)\big) \;=\; \rho\big(T_\tau F(x)\big) \;=\; \rho\big(F(x)\big).
$$

With stride $s > 1$ the equality holds only for $\tau \in s\mathbb{Z}^2$; for
other shifts the subsampling grid lands differently. The nominal receptive field
grows as $r_{l+1} = r_l + (k_{l+1}-1)\prod_{i \le l} s_i$, which is why
downsampling buys reach so cheaply.

## Assumptions and requirements

The exact equivariance statement needs stride one, no boundary, and a pointwise
nonlinearity. Drop the first and equivariance survives only for shifts that are
multiples of the stride; drop the second — real images have edges, and padding
fills them with zeros — and the network can read absolute position off the
boundary.

The architectural prior needs more. It assumes **grid topology** with meaningful
adjacency, so shuffling the coordinates would destroy information. It assumes
approximate **stationarity**: the statistics that make a filter useful in one
place make it useful everywhere. That fails when absolute position carries
meaning — a fixed-camera scene, a canonically cropped face — and the repairs are
coordinate channels or untied (locally connected) layers that keep locality and
give up sharing. It assumes **compositional locality**: what matters is built
from small neighbourhoods, so long-range dependence is paid for with depth,
dilation, or a non-convolutional mechanism.

## Uses and applicability

Reach for a convolutional network when the signal lives on a grid: images,
volumes, video, audio waveforms and spectrograms, and sequences where position is
metric rather than symbolic. It is the natural trunk for dense
prediction — segmentation, depth, flow, super-resolution — because its output
already moves with the input.

It is also the choice when data is limited relative to the task: a strong
inductive bias substitutes for examples. The vision transformer results make the
trade explicit — at ImageNet-scale pre-training a convolutional network of similar
size wins, and only at far larger pre-training scale does an architecture without
a locality prior overtake it. That is an empirical crossover on particular
datasets, not a theorem, and it moves with the training recipe.

Do not reach for one when adjacency is meaningless — tabular features in arbitrary
column order — or when dependencies are genuinely global and content-dependent.

## Limitations and common mistakes

**"Convolutional networks are translation invariant."** They are equivariant; the
invariance comes from the head, it is approximate, and stride makes it worse.
Shifting an input by one pixel can change a prediction, because the subsampling
grid moved relative to the content.

**"Deeper means it sees more."** The nominal receptive field grows, but the
effective one grows much more slowly and concentrates near the centre. A unit
with a $212$-pixel nominal field does not use $212$ pixels.

**Confusing parameter cost with compute cost.** Weight sharing saves parameters,
not FLOPs. One $3 \times 3$, $512 \to 512$ convolution holds $2{,}359{,}296$
weights and, applied at $14 \times 14$ positions, performs about
$4.6 \times 10^{8}$ multiply-accumulates: the same weights, paid for once per
position.

**Attributing architecture gains to the wrong cause.** When transformers began
beating convolutional baselines, the training recipes changed too — augmentation,
optimiser, schedule, regularisation. Re-tuning a purely convolutional network on
the same recipe closes much of the gap.

## Variants and alternatives

The family varies along independent axes. **Dimensionality**: 1-D for audio and
sequences, 3-D for volumes and video. **Connectivity within a layer**: grouped and
depthwise-separable convolutions factor channel mixing away from spatial mixing
and cut cost sharply, while $1 \times 1$ convolutions do only the former.
**Resolution**: dilation widens reach without subsampling, transposed convolution
restores it, and encoder-decoder designs with skip connections carry detail
forward. **Inter-layer connectivity**: residual and dense shortcuts, which make
very deep stacks trainable — see [Residual Connection](./residual-connection.md).
**Symmetry group**: group-equivariant convolutions extend weight sharing from
translations to rotations and reflections.

The serious alternatives replace the prior rather than tune it. Vision
transformers cut the image into patches and let global attention learn which
positions interact, buying long-range mixing at the cost of more data or stronger
augmentation. Modernised convolutional designs — larger kernels, inverted
bottlenecks, depthwise convolutions, fewer normalisation layers — go the other
way, importing transformer design choices into a purely convolutional stack.
Neither has retired the other.

## History and attribution

The lineage has several stages and no single inventor. Hubel and Wiesel's work on
the cat visual cortex in the 1960s described simple cells with small oriented
receptive fields and complex cells pooling over them — the biological template the
alternating filter-and-pool structure imitates. Fukushima's neocognitron (1980)
turned that into a layered artificial network with local receptive fields and
shift tolerance, but without gradient training. LeCun and collaborators supplied
the missing piece in the late 1980s by training such networks with
backpropagation on handwritten digits; the 1998 paper on gradient-based learning
is the canonical statement: local receptive fields, shared weights, spatial
subsampling. Dominance in computer vision dates from a convolutional network
winning the 2012 ImageNet classification challenge by a wide margin.

## Sources

**Deep Learning, Chapter 9** is the reference treatment: sparse interactions,
parameter sharing, equivariant representations, pooling and invariance, and the
infinitely-strong-prior framing that makes the assumptions explicit.
**Gradient-Based Learning Applied to Document Recognition** is the primary source
for the architecture and the case against fully connected networks on images.
**An Image is Worth 16x16 Words** gives the data-scale comparison, and **A ConvNet
for the 2020s** the modernised design space and the recipe confound.

## Prerequisites and next connections

Read [Convolutional Layer](./convolutional-layer.md) first — this page assumes its
arithmetic — and ideally [Convolution](./convolution.md) before that. The two
properties the architecture turns on have their own pages:
[Translation Equivariance](./translation-equivariance.md) for what the stack
preserves, [Receptive Field](./receptive-field.md) for what depth buys, and
[Pooling](./pooling.md) for the operation that converts the first into
approximate invariance.

Then the concrete architectures: [LeNet](./lenet.md) for the original complete
network, [VGG](./vgg.md) for the uniform stack scaled up,
[ResNet](./resnet.md) for what had to change before depth kept paying, and
[Backpropagation Through Convolution](./backpropagation-through-convolution.md)
for why a shared-weight layer's backward pass is itself a convolution.
