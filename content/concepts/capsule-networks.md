---
concept_id: concept.deep_learning.capsule_networks
title: Capsule Networks
slug: /concepts/capsule-networks
aliases:
  - CapsNet
  - routing by agreement
kind: method
tier: 1
review_state: generated-draft
summary: An architecture in which groups of neurons encode an entity's pose in their activity vector and layers are connected by an iterative agreement procedure rather than fixed weights, proposed as a replacement for pooling and never scaled beyond small benchmarks.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: contrasts_with
    target: concept.deep_learning.pooling
    note: Capsules were proposed precisely to avoid pooling's discarding of within-window position, keeping pose in the activity vector instead of summarising it away.
  - type: requires
    target: concept.deep_learning.convolutional_networks
    note: The primary capsules of the vision capsule networks described here are formed by reshaping the output of ordinary convolutional layers, so the convolutional stack is machinery the reader needs first.
  - type: contributes_to
    target: concept.deep_learning.equivariance
    note: Capsules are one attempt to make a representation whose direction changes with viewpoint while its magnitude does not, which is an equivariance-by-training rather than equivariance-by-construction design.
  - type: contrasts_with
    target: concept.deep_learning.attention
    note: Routing by agreement is a competition among units mediated by a softmax, like attention, but the softmax normalises over the receiving capsules rather than over the senders, so parents compete for each child's vote.
sources:
  - source_id: source.sabour2017.dynamic_routing
    title: Dynamic Routing Between Capsules
    url: https://arxiv.org/abs/1710.09829
    source_kind: preprint
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.convnets
    title: Deep Learning, Chapter 9 — Convolutional Networks
    url: https://www.deeplearningbook.org/contents/convnets.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
    checked_on: 2026-09-17
  - source_id: source.cohen2016.group_equivariant_networks
    title: Group Equivariant Convolutional Networks
    url: https://arxiv.org/abs/1602.07576
    source_kind: preprint
    supports:
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
  - label: Capsule successors — matrix capsules with EM routing (2018), stacked capsule autoencoders (2019), and the GLOM part-whole proposal (2021)
    reason: The registry holds only the 2017 dynamic-routing paper; the later capsule and part-whole proposals named in the variants and history sections have no entry, so they are named without citation.
    sections:
      - variants-and-alternatives
      - history-and-attribution
  - label: Independent replications and ablations of routing by agreement
    reason: The claim that uniform coupling often matches or beats iterative routing, and that capsules are not measurably more robust than convolutional baselines, comes from follow-up empirical work that the registry does not cover.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **capsule network** replaces the scalar unit with a _capsule_: a small group of
neurons whose activity vector stands for one instance of one kind of entity — an
object or an object part. The **length** of the vector is read as the probability
that the entity is present; the **direction** encodes its instantiation
parameters, such as position, scale, thickness or skew. Layers are connected by
**dynamic routing**: each capsule $i$ in the layer below produces a prediction
$\hat{u}_{j|i} = W_{ij} u_i$ of what each capsule $j$ above should be, and an
iterative procedure increases the coupling from $i$ to $j$ whenever that
prediction agrees with $j$'s current output. A capsule's output passes through a
**squashing** nonlinearity that maps length into $[0, 1)$ and leaves direction
untouched.

## Why it matters

A convolutional stack with max [Pooling](./pooling.md) answers "does this feature
appear anywhere in this window?" and deliberately throws away where within the
window it appeared. That buys tolerance to small shifts, and it also means
the network's evidence for "face" can be satisfied by an image containing an eye,
a nose and a mouth in the wrong arrangement. Capsules propose to keep the pose
rather than summarise it away, so that recognising a whole becomes a question of
whether the parts' votes about the whole's pose _coincide_ — a criterion that
scrambling the parts fails. The promise was viewpoint generalisation from fewer
examples and an explicit part-whole parse instead of a bag of features. It is
worth separating that promise from what was delivered; the delivery is in
Limitations.

## Intuition

Think of inverse rendering by committee. Each part capsule holds something like a
pose; multiplying it by the learned part-to-whole matrix turns "the nose is here,
at this angle, this big" into "then the face must be here, at this angle, this
big". If nose, eyes and mouth independently point at the same face pose, that
coincidence in a high-dimensional space is unlikely by chance, and the agreement
is itself the evidence.

The analogy breaks in two places worth naming. Nothing constrains $W_{ij}$ to be
a geometric transform — it is an ordinary matrix trained by backpropagation on a
classification loss, so "pose" is whatever that loss makes of it. And routing is
a heuristic clustering of votes, not inference in a generative model of how the
image was rendered.

## Concrete example

Squashing, on real numbers. For $s = (3, 4)$ we have $\lVert s \rVert = 5$, so
$v = \frac{25}{26}\cdot(0.6, 0.8) \approx (0.577, 0.769)$, of length $0.962$. For
$s = (0.3, 0.4)$, length $0.5$, we get $v = 0.2\cdot(0.6, 0.8) = (0.12, 0.16)$:
short vectors are shrunk roughly quadratically, long ones saturate just below $1$.

Routing, on real numbers. Two output capsules $A$ and $B$, three input capsules,
everything two-dimensional. Predictions for $A$ are $(1,0)$, $(1,0)$, $(0,1)$;
predictions for $B$ are $(1,0)$, $(-1,0)$, $(0,-1)$. All logits start at zero, so
every coupling is $0.5$. Then $s_A = (1, 0.5)$, which squashes to
$v_A \approx (0.497, 0.249)$ with length $0.556$, while $s_B = (0,-0.5)$ squashes
to $v_B = (0, -0.2)$. The agreements $\hat{u}_{j|i}\cdot v_j$ are $0.497$, $0.497$
and $0.249$ for $A$, and $0$, $0$, $0.2$ for $B$. After one update the first two
capsules route $0.622$ of their vote to $A$ instead of $0.5$; the third, which
agrees with nobody, sits at $0.512$. Recomputing gives $v_A$ of length $0.644$,
tilted toward the majority vote. The two agreeing parts have amplified each other
and the odd one out has been diluted — in two iterations, with no learning.

The MNIST network from the original paper: a $9\times 9$ convolution to $256$
channels; a second $9\times 9$ stride-$2$ convolution reshaped into $32\times
6\times 6 = 1152$ primary capsules of dimension $8$; then $10$ digit capsules of
dimension $16$, one per class, reached by routing. The transformation matrices
alone are $1152 \times 10 \times 8 \times 16 = 1{,}474{,}560$ parameters, part of
$8.2$M in total.

In code, the squash is three lines, and the epsilon is not decoration — the
gradient of $\lVert s \rVert$ is undefined at zero:

```python
def squash(s, dim=-1, eps=1e-8):
    sq = (s * s).sum(dim=dim, keepdim=True)
    return (sq / (1.0 + sq)) * s / (sq + eps).sqrt()
```

## Formal treatment

Let $u_i \in \mathbb{R}^{d}$ be the output of capsule $i$ in layer $\ell$ and
$v_j \in \mathbb{R}^{d'}$ the output of capsule $j$ in layer $\ell+1$. Each pair
has its own matrix $W_{ij} \in \mathbb{R}^{d' \times d}$, giving the prediction
(or vote) $\hat{u}_{j|i} = W_{ij} u_i$. The input to $j$ is the coupled sum
$s_j = \sum_i c_{ij}\hat{u}_{j|i}$, and the output is

$$
v_j \;=\; \frac{\lVert s_j \rVert^{2}}{1 + \lVert s_j \rVert^{2}}
          \cdot \frac{s_j}{\lVert s_j \rVert},
\qquad\text{so}\qquad
\lVert v_j \rVert = \frac{\lVert s_j \rVert^{2}}{1 + \lVert s_j \rVert^{2}} \in [0,1).
$$

The couplings come from logits $b_{ij}$ through a softmax taken **over $j$**:

$$
c_{ij} = \frac{\exp(b_{ij})}{\sum_{k} \exp(b_{ik})},
\qquad \sum_j c_{ij} = 1 .
$$

Routing initialises $b_{ij} = 0$ and repeats $r$ times (the paper uses $r = 3$):
compute $c_{ij}$, then $s_j$, then $v_j$, then update
$b_{ij} \leftarrow b_{ij} + \hat{u}_{j|i}\cdot v_j$. The $W_{ij}$ are learned by
backpropagation through the unrolled iterations; the $b_{ij}$ are transient state,
reset for every input. There is no proof that this iteration converges, and no
objective it is known to descend.

Training uses a per-class margin loss on capsule lengths,

$$
L_k = T_k \max(0, m^{+} - \lVert v_k \rVert)^{2}
    + \lambda (1 - T_k)\max(0, \lVert v_k \rVert - m^{-})^{2},
$$

with $T_k = 1$ for the present class, $m^{+} = 0.9$, $m^{-} = 0.1$ and
$\lambda = 0.5$, plus a reconstruction term: a small decoder rebuilds the image
from the correct class's $16$-dimensional vector, its squared error scaled by
$0.0005$ so it regularises rather than dominates.

## Assumptions and requirements

Routing assumes the votes from genuinely related parts _cluster_, which requires
the vote vectors to be comparable in scale — the squash supplies that — and
requires enough voters that coincidence is informative. It assumes a fixed
iteration count is enough, since there is no convergence criterion.

The representation assumes at most one instance of each entity type in a given
place: a capsule holds one pose, so two overlapping objects of the same class
cannot both be represented, a limitation the original paper states outright. It
assumes every input belongs to some capsule, which is why applying the design to
cluttered images needed an extra "none of the above" class for background. And it
assumes the layer is small: with $N$ lower and $M$ upper capsules the
transformation matrices cost $N M d d'$ parameters and the routing cost scales
with $N M r$, so both grow as the product of the capsule counts.

## Uses and applicability

The place where capsules genuinely outperformed a comparable baseline was
segmenting highly overlapping objects: on MultiMNIST, two overlaid digits, the
capsule network reached $5.2\%$ error against $8.1\%$ for a comparable
convolutional model, using the routing assignment itself to separate the digits.
On plain MNIST it reached $0.25\%$ error against $0.39\%$ for the baseline, and
on an affine-transformed test set after training on lightly augmented MNIST it
reached $79\%$ against the baseline's $66\%$ — a real but modest generalisation
gain.

Do not reach for a capsule network as a general vision backbone. There is no
regime on natural images where it is the recommended choice today, and anyone
starting a vision project should use a convolutional network or a
[Vision Transformer](./vision-transformer.md).

## Limitations and common mistakes

The honest summary: capsules drew enormous attention and did not scale. On
CIFAR-10 the original paper reports $10.6\%$ error from an ensemble of seven
models — roughly where convolutional networks stood when they were _first_
applied to CIFAR-10, and far from the 2017 state of the art. No capsule
architecture has produced competitive results at ImageNet scale, and capsules are
not part of mainstream practice.

The first misconception is that capsules give equivariance for free. They do not:
the transformation matrices are learned, and whatever viewpoint structure appears
is an empirical property of a trained model, not a guarantee. Group-equivariant
convolutions, by contrast, are equivariant by construction.

The second is that routing by agreement is the ingredient that works. Independent
follow-up work found that replacing the iterative routing with uniform couplings
often matched or beat it, and that capsule networks were not measurably more
robust to input perturbation than convolutional baselines — which points at the
reconstruction regulariser and the architecture, rather than the routing, as the
source of the small-benchmark gains. This is not fully settled, but the burden of
proof has moved.

The third is practical: routing is sequential, weight-tied per capsule pair, and
awkward to express as one dense matrix multiply, so a capsule layer is far slower
per parameter than a convolution on the same hardware. A common implementation
bug is taking the routing softmax over the wrong axis — over senders rather than
receivers — which quietly turns routing into something closer to attention.

## Variants and alternatives

**Matrix capsules with EM routing** replaces the activity vector with a $4\times
4$ pose matrix plus a separate activation scalar and the agreement heuristic with
a Gaussian mixture fit, which is better motivated and more expensive. **Stacked
capsule autoencoders** drop the discriminative routing entirely for an
unsupervised part-discovery objective. Various **attention-routing** variants
substitute a single softmax attention step for the iterative loop. The trivial
baseline — uniform coupling, no routing — is a variant worth running before any
of them.

The genuinely different competitors are equivariant architectures that build
transformation structure into the operator instead of learning it:
group-equivariant convolutions and their steerable descendants give exact
equivariance to a chosen symmetry group with a guarantee attached, at the cost of
committing to that group in advance. Against both stands the empirical answer
that won: large convolutional networks and transformers that learn viewpoint
tolerance from data and augmentation, with no architectural commitment at all.

## History and attribution

The idea is Geoffrey Hinton's and considerably older than the 2017 paper. Hinton,
Krizhevsky and Wang introduced capsules — already under that name — in 2011, in
the transforming-autoencoders paper, motivated by a long-standing objection that
pooling throws away the precise spatial relationships that vision needs. Sabour,
Frosst and Hinton gave
the idea its widely read form in 2017 with the dynamic-routing algorithm and the
MNIST results above. Hinton, Sabour and Frosst followed in 2018 with EM routing,
and Hinton later set out a different route to the same goal — representing
part-whole hierarchies without allocating a capsule per entity — as a design
proposal rather than a trained system.

## Sources

**Dynamic Routing Between Capsules** is the primary source for everything
specific on this page: the squashing function, the routing procedure, the margin
and reconstruction losses, the MNIST and MultiMNIST architecture and numbers, and
the paper's own statement of the two-instances-of-one-type limitation.
**Deep Learning, Chapter 9** supplies the pooling-and-invariance account that the
capsule programme was a reaction against. **Group Equivariant Convolutional
Networks** is the competing approach that gets transformation structure by
construction, and **Geometric Deep Learning** is the map of that wider
symmetry-first design space. The follow-up replications that undercut routing by
agreement are not in the registry, and are declared as unresolved references
rather than attached to a source that does not cover them.

## Prerequisites and next connections

Read [Convolutional Networks](./convolutional-networks.md) first — primary
capsules are a reshaped convolutional feature map, and the capsule argument is
unintelligible without the thing it argues against. [Pooling](./pooling.md) is the
specific target of that argument, and
[Translation Equivariance](./translation-equivariance.md) makes precise what a
convolution does and does not preserve.

From here, [Attention](./attention.md) is the mechanism routing most resembles and
the one that actually scaled; comparing the two normalisation axes is the fastest
way to see why. [Vision Transformer](./vision-transformer.md) and
[ConvNeXt](./convnext.md) are what the field reached for instead.
