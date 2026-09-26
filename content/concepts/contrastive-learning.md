---
concept_id: concept.learning.contrastive_learning
title: Contrastive Learning
slug: /concepts/contrastive-learning
aliases:
  - contrastive representation learning
kind: method
tier: 1
review_state: generated-draft
summary: Contrastive learning trains an encoder by pulling two views of the same item together and pushing every other item in the batch apart, so that a choice of augmentation becomes the supervision signal.
categories:
  - Artificial Intelligence/Learning Paradigms
  - Mathematics/Information Theory
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: specializes
    target: concept.learning.self_supervised_learning
    note: It is one family of self-supervised objective, distinguished by learning through discrimination against negatives rather than by reconstructing masked or corrupted input.
  - type: contrasts_with
    target: concept.learning.supervised_learning
    note: Both minimise a softmax cross-entropy, but the classes here are manufactured per batch by the augmentation pipeline instead of being fixed human labels.
  - type: contributes_to
    target: concept.learning.transfer_learning
    note: Its output is a frozen encoder whose value is measured entirely by how well the features transfer to downstream detection, segmentation and classification tasks.
sources:
  - source_id: source.chen2020.simclr
    title: A Simple Framework for Contrastive Learning of Visual Representations
    url: https://arxiv.org/abs/2002.05709
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.he2020.moco
    title: Momentum Contrast for Unsupervised Visual Representation Learning
    url: https://arxiv.org/abs/1911.05722
    source_kind: preprint
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.radford2021.clip
    title: Learning Transferable Visual Models From Natural Language Supervision
    url: https://arxiv.org/abs/2103.00020
    source_kind: preprint
    supports:
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: 'van den Oord, Li and Vinyals, Representation Learning with Contrastive Predictive Coding'
    reason: 'The InfoNCE loss and its lower bound on mutual information come from this paper, which the registry does not list; the papers cited here use the loss and cite it rather than deriving the bound.'
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: 'Variational bounds on mutual information and their looseness'
    reason: 'The claim that InfoNCE cannot certify more than log N nats, and the empirical finding that a tighter mutual-information estimate does not imply a better representation, rest on later analysis work that no registered source covers.'
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: 'Non-contrastive siamese methods such as BYOL, SimSiam, Barlow Twins and VICReg'
    reason: 'The methods that drop negatives and prevent collapse by architectural asymmetry or feature decorrelation postdate the registered sources and are described here from general knowledge.'
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Contrastive learning** trains an encoder by solving a manufactured
multiple-choice problem: given an anchor, pick which of $N$ candidates is its
designated _positive_, the other $N-1$ being _negatives_. Nothing in the raw
data says which pairs are positive. A designer chooses that, usually by
declaring two randomly augmented copies of one item to be the same thing, or by
taking a pairing the dataset already carries, such as an image and the caption
published beside it. The objective is a softmax cross-entropy over similarities
between embeddings, not a distance threshold, and the only thing being learned
is the encoder.

## Why it matters

Labels are expensive and augmentations are free, so an objective that converts a
choice of augmentation into a training signal turns an unlabelled pile of data
into a usable representation. The payoff is measured by probing: freeze the
encoder, fit a linear classifier on top, and see how far it gets. SimCLR reports
76.5% ImageNet top-1 under linear evaluation with a wide ResNet-50, matching a
supervised ResNet-50 trained on the labels, and 85.8% top-5 after fine-tuning on
1% of the labels. MoCo showed the features transferring to detection and
segmentation and beating supervised ImageNet pre-training on several of those
tasks, which is the result that made people stop treating self-supervised
pre-training as a curiosity.

## Intuition

The loss is a quiz with a new answer key every batch. The anchor asks "which of
these is you?", and the encoder can only score well by placing each item
somewhere that its other view can find and nothing else occupies.

The picture that matters is the unit sphere. Embeddings are usually normalised,
so the loss has exactly two jobs: pull each positive pair onto the same point
(_alignment_), and keep everything else spread out (_uniformity_). Negatives are
what supplies the second job, and without them the sphere would collapse to a
point.

Where the classifier analogy breaks: a supervised classifier's classes mean
something outside the batch, whereas here the "class" is one particular image and
is gone next step. And the objective never says what should be represented, only
what may be ignored. The augmentation distribution is the whole specification.

## Concrete example

Take four normalised embeddings on a circle and a temperature $\tau = 0.1$.
The anchor $z_1$ sits at $0°$, its positive $z_2$ at $20°$, a _hard_ negative
$z_3$ at $25°$ (a near-duplicate image), and an _easy_ negative $z_4$ at $100°$.
Cosine similarities divided by $\tau$ give logits $9.397$, $9.063$ and $-1.737$.
Exponentiating gives $12051$, $8631$ and $0.176$, a denominator of $20682$, so
the probability assigned to the positive is $0.583$ and the loss is
$-\log 0.583 = 0.540$.

Now read the softmax weights as gradient shares. The hard negative takes
$8631/20682 = 0.417$ of the pressure; the easy one takes $8.5 \times 10^{-6}$,
about fifty thousand times less. Hard negative mining is not a separate
technique bolted on: the softmax already does it, and the temperature sets how
aggressively.

If the encoder collapsed and emitted the same vector for all four, every logit
would be $10$, the positive would get probability $1/3$ and the loss would be
$\log 3 = 1.099$ — worse than $0.540$. That gap is what negatives buy.

The batched version of the same loss:

```python
import torch
import torch.nn.functional as F

def nt_xent(z1, z2, tau=0.1):
    # z1[i] and z2[i] are two augmented views of the same example
    n = z1.shape[0]
    z = F.normalize(torch.cat([z1, z2]), dim=1)   # (2N, d)
    sim = z @ z.T / tau                           # (2N, 2N)
    sim.fill_diagonal_(float("-inf"))             # a view is not its own negative
    target = torch.cat([torch.arange(n, 2 * n), torch.arange(0, n)])
    return F.cross_entropy(sim, target)
```

## Formal treatment

Let $(x, y_1) \sim p(x, y)$ be a positive pair and let $y_2, \dots, y_N$ be drawn
independently from the marginal $p(y)$. For a critic $h(x, y) \in \mathbb{R}$,
the **InfoNCE** loss is

$$
\mathcal{L}_N \;=\; -\,\mathbb{E}\!\left[\log
\frac{e^{h(x, y_1)}}{\sum_{j=1}^{N} e^{h(x, y_j)}}\right],
$$

the cross-entropy of an $N$-way classification whose correct answer is the
positive. It satisfies

$$
I(x; y) \;\ge\; \log N - \mathcal{L}_N ,
$$

where $I$ is mutual information in nats. Two consequences follow immediately.
Because $\mathcal{L}_N \ge 0$, the bound can never certify more than $\log N$
nats: at batch size $4096$ that is $12$ bits, which is a small fraction of what
two crops of a photograph plausibly share. And the bound is attained only by the
optimal critic $h^*(x, y) = \log\frac{p(y \mid x)}{p(y)} + c(x)$, so a finite
encoder minimising $\mathcal{L}_N$ is maximising a loose lower bound, not
estimating $I$.

In practice $h$ is a normalised inner product scaled by a temperature,
$h(x,y) = z_x^\top z_y / \tau$ with $\|z\| = 1$. SimCLR's NT-Xent form takes a
batch of $N$ items, augments each twice to give $2N$ views, and for the positive
pair $(i, j)$ uses

$$
\ell_{i,j} = -\log \frac{\exp(z_i^\top z_j / \tau)}
{\sum_{k \ne i} \exp(z_i^\top z_k / \tau)},
$$

summed over both orderings of all $N$ pairs. Writing $p_k$ for the softmax
probability of candidate $k$, the gradient with respect to logit $h_k$ is
$p_k - \mathbb{1}[k = j]$, which is the statement that negatives are weighted by
how nearly they fooled the model.

CLIP uses the same loss across modalities. Given $N$ image embeddings and $N$
text embeddings from a batch of paired data, it forms the $N \times N$ matrix of
cosine similarities scaled by a learned temperature and applies cross-entropy
along both axes, so each image must find its caption and each caption its image.
No augmentation is involved: the dataset's pairing defines the positives.

## Assumptions and requirements

The positives must be equivalent _for the downstream task_. Colour jitter
declares colour irrelevant, which is useful for object recognition and
destructive for identifying birds by plumage; random cropping declares that a
part stands for the whole, which fails when the label depends on the scene's
global layout. SimCLR's ablation makes the sharper point that no single
augmentation suffices — composition, especially crop plus colour distortion, is
what makes the task hard enough to be informative.

The negatives must be mostly true negatives. In-batch sampling assumes a random
other item is semantically different, which holds for ImageNet-scale data with a
thousand classes and fails badly on a dataset with five.

The mutual-information bound additionally assumes the $N-1$ negatives are drawn
i.i.d. from the marginal; sampling a batch without replacement and reusing every
item as both anchor and negative violates this mildly, which is one more reason
to treat the bound as an interpretation rather than a measurement.

Two conventions are load-bearing rather than cosmetic. Without $L_2$
normalisation the model can lower the loss by inflating embedding norms instead
of aligning directions. And SimCLR found that contrasting through a small
nonlinear projection head and then _discarding_ it improves the representation
taken from the backbone — an empirical finding that has replicated widely, not a
theorem.

## Uses and applicability

Reach for it when unlabelled data vastly outnumbers labelled data and you want
one encoder to serve several downstream tasks; when the embedding itself is the
product, as in retrieval, re-ranking and near-duplicate detection, since the
loss optimises exactly the inner product that will be queried; and when two
modalities need a shared space, which is what makes CLIP's zero-shot
classification work — class names are written as text prompts and the nearest
caption embedding wins.

Do not reach for it when labels are plentiful and the task is fixed, where
supervised training is simpler and stronger, or when the invariances you would
have to impose destroy the signal, as in fine-grained colour or pose tasks. Be
cautious for dense prediction: an objective that trains one global vector per
image has no reason to preserve the spatial detail segmentation needs.

## Limitations and common mistakes

The most common overstatement is that contrastive learning maximises mutual
information. It maximises a lower bound that is capped at $\log N$ and is loose
long before that, and the relationship between a tighter bound and a better
representation is not settled — estimators that report higher mutual information
have been shown to yield worse features, which means the quality is coming from
the inductive biases of the encoder and the augmentations, not from the
information-theoretic story.

The second is treating batch size as a free dial. More negatives help, with
sharply diminishing returns, and the effect is entangled with training length;
MoCo's queue exists precisely because scaling the batch is an expensive way to
buy negatives.

The third is ignoring false negatives. Every other item in the batch is pushed
away even when it belongs to the same class, so the loss is actively wrong on
those pairs; this is worst when classes are few or the data is redundant.

The fourth is thinking collapse is impossible. With negatives, a constant
encoder gives loss $\log(2N-1)$ and loses to almost anything, so collapse is not
a minimiser. Drop the negatives and it becomes the _global_ minimum, which is why
non-contrastive methods need a predictor, a stop-gradient, a momentum target or
an explicit variance term — mechanisms that are still debated rather than
derived.

Finally, temperature is not a minor hyperparameter. It sets how much of the
gradient the hardest negatives receive, and a very small $\tau$ turns false
negatives into the dominant training signal.

## Variants and alternatives

**SimCLR** keeps negatives in the batch and pays for them with batch size.
**MoCo** replaces the batch with a queue of embeddings from recent steps,
encoded by a slowly updated momentum copy of the network, decoupling the number
of negatives from the batch and keeping the dictionary consistent enough for the
comparison to mean something. **CLIP** drops augmentation entirely and lets a
web-scale image-text pairing define positives, buying open-vocabulary transfer
at the cost of needing hundreds of millions of pairs. **Supervised contrastive**
learning uses labels to mark all same-class items as positives.

The older alternative is margin-based metric learning — contrastive and triplet
losses that look at one or two negatives at a time and need explicit mining;
InfoNCE's softmax over many candidates is largely what removed that need.
The genuinely different competitors are **non-contrastive siamese methods**,
which delete negatives and prevent collapse structurally, and
**masked-prediction** objectives, which reconstruct hidden parts of the input
instead of discriminating and therefore impose no invariance at all.

## History and attribution

The idea has several independent origins. Its statistical ancestor is
noise-contrastive estimation, introduced by Gutmann and Hyvärinen around 2010 to
fit unnormalised probability models by training a classifier to tell data from
noise, and described as such in the Deep Learning book's treatment of the
partition function. Its representation-learning ancestor is margin-based metric
learning with siamese networks from the 1990s and 2000s, where the word
"contrastive" was already attached to a loss of this shape.

The modern form dates to 2018, when contrastive predictive coding packaged the
softmax-over-candidates loss as InfoNCE and connected it to mutual information.
The method became mainstream in 2020, when MoCo and SimCLR independently showed
that with enough negatives, strong augmentation and long training, the resulting
features matched or beat supervised pre-training. CLIP extended the same loss
across modalities in 2021.

## Sources

**A Simple Framework for Contrastive Learning of Visual Representations** is the
clearest statement of the loss and, more usefully, of the ablations: which
augmentations matter, what the projection head does, how batch size and training
length interact. **Momentum Contrast** is the reference for the dictionary view
of negatives and for the transfer results to detection and segmentation.
**Learning Transferable Visual Models From Natural Language Supervision** shows
the same objective applied symmetrically across two modalities and what zero-shot
transfer buys. **Deep Learning** covers noise-contrastive estimation, the
statistical technique the loss descends from.

## Prerequisites and next connections

You need the softmax cross-entropy and the mechanics of minibatch training
before this page makes sense, plus enough geometry of high-dimensional spaces to
see why normalising to the sphere changes the problem;
[High-Dimensional Statistics](./high-dimensional-statistics.md) explains why
random points there are nearly orthogonal, which is what makes easy negatives
easy. The encoder in almost every result quoted above is a
[ResNet](./resnet.md), built from the [Convolutional Layer](./convolutional-layer.md).

Next, the practical constraints: reproducing these results means gathering
negatives across devices and running long schedules, which is a
[Training Infrastructure](./training-infrastructure.md) problem as much as a
modelling one, and the loss above is a dozen lines of
[PyTorch](./pytorch.md). Conceptually this opens onto self-supervised learning
more broadly, of which contrastive objectives are one branch, and onto transfer
learning, which is where the frozen encoder is finally judged.
