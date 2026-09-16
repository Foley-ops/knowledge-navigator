---
concept_id: concept.deep_learning.pooling
title: Pooling
slug: /concepts/pooling
aliases:
  - spatial pooling
kind: method
tier: 1
review_state: generated-draft
summary: A fixed aggregation over local spatial windows that reduces resolution and discards position information, trading detail for tolerance to small shifts.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_layer
    note: Pooling operates on the feature maps a convolutional layer produces and is placed between convolutional stages.
sources:
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
  - source_id: source.boureau2010.pooling_analysis
    title: A Theoretical Analysis of Feature Pooling in Visual Recognition
    url: https://icml.cc/Conferences/2010/papers/638.pdf
    source_kind: primary-research
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-16
  - source_id: source.springenberg2015.all_convolutional_net
    title: 'Striving for Simplicity: The All Convolutional Net'
    url: https://arxiv.org/abs/1412.6806
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-16
  - source_id: source.lecun1998.gradient_based_learning
    title: Gradient-Based Learning Applied to Document Recognition
    url: https://ieeexplore.ieee.org/document/726791
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-16
---

## Definition

**Pooling** replaces each local window of a feature map with a single summary
value, independently per channel and with no learned parameters. The two
classical choices are

$$
y_{c,i,j} \;=\; \max_{(u,v) \in W_{i,j}} x_{c,u,v}
\qquad\text{(max pooling)},
$$

$$
y_{c,i,j} \;=\; \frac{1}{|W_{i,j}|} \sum_{(u,v) \in W_{i,j}} x_{c,u,v}
\qquad\text{(average pooling)},
$$

where $W_{i,j}$ is the window of size $k \times k$ whose top-left corner is at
$(s i, s j)$ for stride $s$. Unlike a
[Convolutional Layer](./convolutional-layer.md), pooling does not mix channels
and has nothing to learn.

## Why it matters

Pooling does two jobs at once. It **reduces resolution**, so later layers are
cheaper and their [Receptive Field](./receptive-field.md) covers more of the
input per layer. And it **discards position within the window**, so the
representation tolerates small displacements of the evidence. Both effects are
useful; both are lossy; and because they arrive bundled, it is easy to attribute
a benefit to the wrong one.

## Intuition

Ask of each small patch: "did this feature appear anywhere here?" — that is max
pooling. Or ask "how much of this feature was here on average?" — that is average
pooling. Either way the answer no longer says exactly _where_ inside the patch it
happened. If the object shifts by one pixel and stays inside the same window, the
answer does not change. If it shifts across a window boundary, it does.

## Concrete example

Take a single channel

$$
x = \begin{bmatrix} 1 & 3 & 2 & 0 \\ 4 & 2 & 1 & 1 \\ 0 & 1 & 5 & 2 \\ 2 & 0 & 1 & 3 \end{bmatrix}
$$

with $2 \times 2$ windows and stride $2$. Max pooling gives
$\begin{bmatrix} 4 & 2 \\ 2 & 5 \end{bmatrix}$; average pooling gives
$\begin{bmatrix} 2.5 & 1.0 \\ 0.75 & 2.75 \end{bmatrix}$. The $4 \times 4$ map
becomes $2 \times 2$: three quarters of the values are gone, and the position of
the maximum inside each window is gone with them.

Shift $x$ one column right. The top-left max may stay $4$ or may not, depending
on whether the $4$ crossed a window boundary — invariance here is exact only
_within_ a window.

## Formal treatment

Output size follows the same arithmetic as a strided convolution,

$$
H' = \left\lfloor \frac{H + 2p - k}{s} \right\rfloor + 1 ,
$$

and the common configuration $k = s = 2$, $p = 0$ halves each spatial dimension
and reduces the number of activations by four.

The backward passes differ in kind. Max pooling routes the incoming gradient to
the single arg-max position and sends zero elsewhere, so it is a **selector**:

$$
\frac{\partial y_{c,i,j}}{\partial x_{c,u,v}}
= \begin{cases} 1 & (u,v) = \arg\max_{W_{i,j}} x \\ 0 & \text{otherwise.}\end{cases}
$$

Average pooling spreads the gradient evenly, $1/|W|$ to every position in the
window, so it is a fixed low-pass filter followed by subsampling.

Boureau, Ponce and LeCun analyse the two under a simple statistical model and
show that which is better depends on the sparsity of the features and the
dictionary — max pooling is favoured when feature activations are sparse and the
window is not too large, and the advantage is not universal.

## Assumptions and requirements

Pooling assumes that _where_ a feature occurred within the window is not needed
downstream, and that the feature map is dense enough that summarising a window
retains the signal. Both assumptions weaken as windows grow: pooling over a large
region of a sparse map throws away most of what is there.

Max pooling additionally assumes activations are comparable in scale across the
window, since it selects on raw magnitude. Average pooling assumes the mean is
meaningful, which fails when positive and negative responses cancel — one reason
it is usually placed after a non-negative activation.

## Uses and applicability

Pooling is appropriate between convolutional stages in a classification network,
where resolution is being deliberately traded for semantic reach, and as a global
aggregation at the head of the network, where global average pooling collapses
each channel to one number and gives whole-image
[Translation Equivariance](./translation-equivariance.md)'s invariant
counterpart.

It is a poor fit in dense-prediction networks — segmentation, super-resolution,
optical flow — where the discarded spatial detail is precisely the output. Such
networks either avoid pooling, use dilation instead, or restore resolution with
skip connections from earlier, higher-resolution layers.

## Limitations and common mistakes

The most common overstatement is that pooling makes a network
translation-invariant. It does not. Invariance is exact only to shifts that keep
the evidence inside the same window, and the stride simultaneously **breaks**
equivariance for shifts that are not multiples of it, which is why small
translations can change a pooled network's predictions.

The second mistake is treating pooling as necessary. Springenberg et al. showed
that replacing max pooling with a stride-$2$ convolution matches or exceeds its
accuracy on standard benchmarks, which suggests that much of pooling's value is
the downsampling, not the aggregation. A strided convolution learns _how_ to
summarise the window instead of fixing the rule in advance, at the cost of extra
parameters; the choice is a real trade-off, not a settled question.

A third is stacking aggressive pooling and then expecting fine detail to survive.
Repeated $2 \times 2$ pooling reduces a $224 \times 224$ input to
$7 \times 7$ after five stages: small objects have been reduced to less than a
cell.

## Variants and alternatives

**Max** and **average** pooling are the classical pair. **Global average
pooling** pools the whole map at once and is the standard classification head in
[ResNet](./resnet.md)-era architectures. **Overlapping pooling** uses $s < k$.
**Mixed** and **stochastic** pooling interpolate between or sample from the
window. **Adaptive** pooling fixes the output size and derives the window.
**Blur-pooling** applies a low-pass filter before subsampling to restore
approximate shift-equivariance. The main alternative is **strided convolution**,
which subsamples with learned weights; dilation is the alternative that widens
reach without subsampling at all.

## History and attribution

Local averaging with subsampling appears as the **C-layer** of Fukushima's
neocognitron — the fixed, non-trainable cells that blur over a neighbourhood of
S-cell responses to tolerate positional shift, and whose density is thinned from
layer to layer. (The trainable S-layer is the feature-extracting stage, and is
the ancestor of the convolutional layer rather than of pooling.) The same idea
appears as the subsampling layers of [LeNet](./lenet.md), where averaging is
followed by a trainable coefficient and bias rather than being purely fixed. Max pooling became the default through the
2000s and early 2010s, and its necessity was directly questioned by the
all-convolutional net of Springenberg et al. (2015).

## Sources

- **Deep Learning, Chapter 9** — the definition, the invariance argument and its
  limits, and the role of pooling in a convolutional stage.
- **A Theoretical Analysis of Feature Pooling in Visual Recognition** — when max
  beats average and under what conditions.
- **Striving for Simplicity: The All Convolutional Net** — evidence that strided
  convolution can replace max pooling without loss.
- **Gradient-Based Learning Applied to Document Recognition** — the original
  subsampling layers.

## Prerequisites and next connections

Read [Convolutional Layer](./convolutional-layer.md) first; pooling acts on its
output.

Next, [LeNet](./lenet.md) shows the classical convolution-and-subsample stage in
a complete network, [VGG](./vgg.md) shows the same pattern scaled up, and
[Receptive Field](./receptive-field.md) explains how much reach each pooling
stage buys.
