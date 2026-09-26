---
concept_id: concept.vision.visual_place_recognition
title: Visual Place Recognition
slug: /concepts/visual-place-recognition
kind: problem
tier: 1
review_state: generated-draft
summary: Visual place recognition decides where a photograph was taken by finding the most similar images in a database of pictures with known locations, which turns localisation into image retrieval and makes robustness to changing appearance the central difficulty.
categories:
  - Artificial Intelligence/Domains/Computer Vision
primary_category: Artificial Intelligence/Domains/Computer Vision
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_networks
    note: Learned place recognition usually builds its image descriptors on the feature maps of a convolutional backbone, so what those features encode determines what the descriptor can match.
  - type: requires
    target: concept.algorithms.searching
    note: Recognising a place is a nearest-neighbour search over descriptors of every reference image, and at large scale it depends on an efficient, usually approximate, search structure.
  - type: contrasts_with
    target: concept.vision.classification
    note: A classifier chooses among a fixed set of labels learned in training, whereas place recognition matches against a database of places that can grow without retraining.
sources:
  - source_id: source.arandjelovic2016.netvlad
    title: 'NetVLAD: CNN architecture for weakly supervised place recognition'
    url: https://arxiv.org/abs/1511.07247
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Classical and recent place recognition methods (bag of visual words, VLAD, FAB-MAP, foundation-model descriptors)
    reason: The bag-of-visual-words and VLAD retrieval pipelines, FAB-MAP's use in SLAM loop closure, re-ranking with local features, and descriptors built on large self-supervised vision models are described from the wider literature; the registry holds only the NetVLAD paper for this topic.
    sections:
      - variants-and-alternatives
      - uses-and-applicability
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Visual place recognition** (VPR) is the task of deciding which known place a
query photograph shows, by comparing it with a database of reference images
whose locations are recorded. It is almost always posed as **retrieval**: compute
a compact descriptor for every image, find the reference descriptors nearest the
query's, and report their locations. The answer is a place — a position within
some tolerance — rather than the camera's exact position and orientation.

## Why it matters

GPS fails indoors, in urban canyons and underground; a camera does not. Place recognition lets a robot or vehicle recognise that it has returned
somewhere it has been, which is how simultaneous localisation and mapping
corrects accumulated drift through **loop closure**. It underlies relocalising a
lost robot, geo-tagging photographs, and augmented-reality systems that must
anchor content to real locations.

## Intuition

A good place descriptor has to hold two opposed properties at once. It must
stay the same when the place looks different — at night, in snow, from a few
metres to the side, with a bus parked in front — and it must differ between
places that look alike, such as two stretches of identical suburban road. The
first is **appearance invariance**; failure at the second is called
**perceptual aliasing**.

The VLAD idea, which NetVLAD makes trainable, is to describe an image not by
what its local features are but by how they are distributed relative to a
learned vocabulary of visual "words": for each word, sum how far, and in which
direction, the features assigned to it sit from it.
Distinctive arrangements of distinctive local structure identify a place more
reliably than a whole-image summary.

## Concrete example

Evaluation reports **Recall@N**: the fraction of queries for which at least one
of the top $N$ retrieved images lies within a distance threshold of the query's
true location — 25 metres in the NetVLAD benchmarks. Suppose five queries, with
the rank of the first correct match in each:

```text
query:          1     2     3      4     5
first correct:  1     2     none   1     3
```

Recall@1 is $2/5 = 40\%$, since only queries 1 and 4 are right at rank one.
Recall@3 is $4/5 = 80\%$, since queries 2 and 5 are recovered within three. Query
3 failed entirely. The gap between the two figures is the queries where a wrong
place looked more similar than the right one — through aliasing, or because the
right place has changed appearance since its reference image was taken.

## Formal treatment

Given $N$ local features $x_i \in \mathbb{R}^D$ from a convolutional feature map
and $K$ cluster centres $c_k$, VLAD forms a $D \times K$ matrix

$$
V(j, k) = \sum_{i=1}^{N} a_k(x_i)\,\bigl(x_i(j) - c_k(j)\bigr),
$$

where classical VLAD uses a hard assignment $a_k(x_i) \in \{0, 1\}$ to the
nearest centre. NetVLAD makes the assignment soft and trainable,

$$
a_k(x_i) = \frac{e^{w_k^\top x_i + b_k}}{\sum_{k'} e^{w_{k'}^\top x_i + b_{k'}}},
$$

so the whole layer is differentiable. The result is normalised within each
cluster, flattened and $L_2$-normalised; with $K = 64$ and $D = 512$ it has
$64 \times 512 = 32{,}768$ dimensions, which are usually reduced before search.

Training is **weakly supervised**. GPS tags say which reference images are
near the query — potential positives, not all of which actually show the same
view — and which are far enough to be definite negatives. The loss uses the
closest potential positive $p^\ast$ and penalises every negative $n_j$ that is
not farther by a margin $m$:

$$
\mathcal{L} = \sum_j \max\!\Bigl(0,\; d^2(q, p^\ast) + m - d^2(q, n_j)\Bigr).
$$

## Assumptions and requirements

- **A reference database.** Only places that have been imaged and located can
  be recognised; an unmapped street cannot be.
- **Some overlap in view.** The query must share visible structure with a
  reference image. Opposite viewing directions of the same spot usually fail.
- **Locations to learn from.** Weak supervision needs positions for the training
  images, and the noise in which nearby images truly overlap is handled by the
  loss, not removed.
- **A threshold that means something.** Recall@N depends on the distance counted
  as correct; figures reported at different thresholds are not comparable.

## Uses and applicability

Use it for loop closure in visual SLAM, for relocalising a robot or vehicle
after tracking is lost, for coarse localisation that seeds a precise
geometric pose estimate, and for geo-locating photographs against street-level
imagery. It is the right first stage when the space of places is large and the
answer needed is "which place" rather than "which exact pose".

## Limitations and common mistakes

**Treating a match as a pose.** Retrieval says the query resembles a reference
image; recovering six-degree-of-freedom pose requires geometric
verification against that image.

**Trusting Recall@1 under aliasing.** Repetitive environments produce
confident, wrong top matches; systems that act on a single match need
verification or temporal consistency across several frames.

**Benchmark overfitting.** Datasets differ in the appearance changes they
contain, and a method strong on one condition — urban daytime — can fail on
another, such as seasonal or night-time change.

**Ignoring scale.** A descriptor that works on thousands of images may be too
large to search, or too indistinct, across millions.

## Variants and alternatives

- **Bag of visual words and VLAD** on hand-crafted local features preceded
  learned descriptors and remain useful baselines.
- **Probabilistic appearance models** such as FAB-MAP reason about the
  likelihood that a view comes from a new place, suited to loop closure.
- **Re-ranking** retrieves candidates with a global descriptor and then
  re-scores them by matching local features geometrically.
- **General-purpose descriptors** from large self-supervised vision models,
  used with little or no place-specific training, are a recent alternative whose
  robustness across conditions is still being established.

## History and attribution

Retrieval-based place recognition grew out of text-retrieval ideas applied to
images, with visual vocabularies in the early 2000s and aggregated descriptors
such as VLAD around 2010. Arandjelović, Gronát, Torii, Pajdla and Sivic
introduced NetVLAD in a paper presented at CVPR in 2016, making the aggregation
a trainable network layer and learning it end to end from weakly labelled
street-level imagery.

## Sources

The NetVLAD paper defines the task as retrieval, motivates it, introduces the
trainable aggregation layer and the weakly supervised triplet loss, and uses
Recall@N with a distance threshold for evaluation. The older pipelines it builds
on, and the methods that followed it, are recorded as uncited on this page.

## Prerequisites and next connections

Read [Convolutional Networks](./convolutional-networks.md) for the features the
descriptor aggregates, and [Searching](./searching.md) for nearest-neighbour
search and why exact search does not scale.

From here, [Contrastive Learning](./contrastive-learning.md) is the broader
family the triplet loss belongs to, and [Classification](./classification.md) is
the closed-set task this one is usefully contrasted with.
