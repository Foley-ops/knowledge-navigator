---
concept_id: concept.learning.self_supervised_learning
title: Self-Supervised Learning
slug: /concepts/self-supervised-learning
aliases:
  - self-supervision
kind: concept
tier: 1
review_state: generated-draft
summary: Training on labels that the data generates about itself — the next token, the masked word, the matching view — so that supervision scales with raw data instead of with annotation effort.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: specializes
    target: concept.learning.supervised_learning
    note: The training loop, loss and generalisation behaviour are those of supervised learning; only the origin of the labels differs, since a rule computes them from the input.
  - type: contrasts_with
    target: concept.learning.unsupervised_learning
    note: Both consume unannotated data, but self-supervision constructs an explicit prediction target and a per-example loss rather than fitting structure such as clusters or densities directly.
  - type: generalizes
    target: concept.learning.contrastive_learning
    note: Contrastive objectives are one family of pretext task, in which the derived label is which views came from the same underlying example.
  - type: contributes_to
    target: concept.learning.transfer_learning
    note: Self-supervised pretraining is the step that produces the general-purpose weights a transfer pipeline then adapts to a labelled downstream task.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.brown2020.gpt3
    title: Language Models are Few-Shot Learners
    url: https://arxiv.org/abs/2005.14165
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.chen2020.simclr
    title: A Simple Framework for Contrastive Learning of Visual Representations
    url: https://arxiv.org/abs/2002.05709
    source_kind: preprint
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Context prediction and the chromatic aberration shortcut
    reason: The patch-position pretext task and the lens-artefact shortcut it exposed are described from the vision literature, and no source in the registry covers that experiment.
    sections:
      - limitations-and-common-mistakes
  - label: Non-contrastive self-distillation (BYOL, DINO)
    reason: Negative-free methods that avoid collapse through a predictor and an exponential-moving-average target are named as competing variants, but the registry has no source for them.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

**Self-supervised learning** withholds part of each unlabelled example, asks the
model to predict it from the rest, and trains with an ordinary supervised loss on
the pair. The withholding rule — the **pretext task** — is written once by the
practitioner and then applied mechanically to every example, so the labels cost
nothing per example. Nothing else about the setup is unusual: the same
cross-entropy, the same optimiser, the same overfitting.

This is not a third category beside supervised and unsupervised learning.
Goodfellow, Bengio and Courville make the same observation about the boundary
itself: the chain rule of probability turns the apparently unsupervised problem of
modelling $p(x)$ for a vector $x \in \mathbb{R}^n$ into $n$ supervised problems,
one per coordinate. Self-supervision is that move taken as a design principle.

## Why it matters

Annotation scales with money and human hours rather than with disk space. A
hand-labelled image collection runs to a million or so examples; a web crawl runs
to billions of documents, and every token in it is already a label for the token
in front of it. A 300-billion-token corpus of the kind used to train GPT-3
supplies on the order of $10^{11}$ supervised prediction problems without a single
annotator.

That changes what limits a project: the ceiling moves from the labelling budget to
compute and raw data. It is also what makes one general-purpose backbone
reasonable — a single expensive pretraining run, then many cheap adaptations to
tasks that individually could never have afforded enough labels.

## Intuition

Fill in the blank. To guess the missing word in "the trophy would not fit in the
suitcase because it was too ___", a model has to resolve what "it" refers to,
which means knowing something about trophies and suitcases. Nobody wants the
filled-in word; what is wanted is the representation the model had to build to
produce it.

The analogy breaks at the grading. A student filling in blanks is assumed to be
trying to understand; a network is graded only on the blank and learns whatever is
cheapest that fills it. If the blank is guessable from punctuation, or a colour
statistic, or a compression artefact, that is what the representation encodes. The
pretext task does not merely enable learning, it selects what is learned.

## Concrete example

Masked language modelling, as BERT defines it: choose 15% of the tokens in each
sequence at random; of those chosen, replace 80% with a special `[MASK]` token,
10% with a random token from the vocabulary, and leave 10% unchanged. Predict the
original token at every chosen position. The 10% unchanged and 10% random cases
exist because `[MASK]` never appears at fine-tuning time, so a model trained only
on it would learn a feature that vanishes downstream.

The label construction is a few lines:

```python
import torch

V = 30522                                  # vocabulary size
tokens = torch.randint(0, V, (4, 128))     # a batch of sequences
chosen = torch.rand(tokens.shape) < 0.15   # 15% of positions become targets

inputs = tokens.clone()
inputs[chosen] = 103                       # the [MASK] id
labels = torch.full_like(tokens, -100)     # -100 is ignored by the loss
labels[chosen] = tokens[chosen]            # the label is the original token

model = torch.nn.Sequential(torch.nn.Embedding(V, 64), torch.nn.Linear(64, V))
logits = model(inputs)                     # (4, 128, V)
loss = torch.nn.functional.cross_entropy(
    logits.reshape(-1, V), labels.reshape(-1), ignore_index=-100
)
```

No annotator was involved, and `loss` is the same cross-entropy a labelled
classification task would use.

## Formal treatment

Let $x \sim p_{\text{data}}$ be a raw example and let $m$ be randomness in the
pretext rule (which positions to mask, which crop to take). The rule produces a
corrupted input $\tilde{x}_m$ and a target $y_m(x)$, and training minimises

$$
\mathcal{L}(\theta) \;=\;
\mathbb{E}_{x \sim p_{\text{data}}} \, \mathbb{E}_{m}
\big[\, \ell\big(f_\theta(\tilde{x}_m),\, y_m(x)\big) \,\big],
$$

with $f_\theta = h \circ g_\theta$ a representation encoder $g_\theta$ followed by
a task head $h$. Only $g_\theta$ is kept afterwards; $h$ is discarded.

Two instances differ in an important way. **Autoregressive** prediction takes
$\tilde{x}_{<t} = (x_1,\dots,x_{t-1})$ and $y = x_t$, and summing the
cross-entropy over $t$ gives

$$
-\log p_\theta(x) \;=\; -\sum_{t=1}^{T} \log p_\theta(x_t \mid x_{<t}),
$$

which is exact maximum likelihood for the joint distribution. Next-token
prediction is density estimation written as $T$ supervised problems.

**Masked** prediction optimises $\sum_{i \in M} \log p_\theta(x_i \mid x_{\setminus M})$
over a random mask set $M$. These conditionals see context on both sides, which is
the point, but they do not compose into a valid joint density: the objective is a
conditional surrogate, not a likelihood. Bidirectional context is bought with the
ability to score or sample a sequence exactly.

**Contrastive** objectives fit the same template with a different target — given
two augmented views of one example, the derived label is which item in the batch
is the matching view, scored by a softmax over similarities. That family has its
own page.

## Assumptions and requirements

The pretext target must be predictable from what remains, but not _cheaply_
predictable. A task solvable by a superficial local rule teaches that rule; a task
with no signal teaches nothing. Most of the engineering here is a search for the
band between.

Augmentation-based tasks add a second assumption: the invariances the
augmentations impose must be invariances the downstream task also wants. SimCLR
draws much of its accuracy from composing random cropping with strong colour
distortion — but a model trained to ignore colour is a poor start for grading
fruit ripeness or identifying birds by plumage. An augmentation set is a claim
about which factors are nuisance.

Third, the pretext features must overlap with the downstream ones. There is no
theorem here; it is an empirical alignment that holds well for language and
natural images and much less predictably for tabular records with no sequential or
spatial structure to exploit.

## Uses and applicability

Reach for it when unlabelled data vastly exceeds labelled data, when one backbone
must serve many downstream tasks, or when the downstream label set is not yet
known. It is the default first stage for language, speech, code and increasingly
vision.

Do not reach for it when the raw corpus is small — the method spends data to buy
generality — or when you already have ample labels for the one task you care
about, where a directly supervised model is simpler and often better. It fits
badly wherever no cheap rule can hide part of the input meaningfully.

## Limitations and common mistakes

The first mistake is taxonomic: treating it as a third paradigm with its own
theory. It has the generalisation behaviour, the optimiser sensitivities and the
label-noise problems of supervised learning, because that is what it is.

The second is optimising the pretext task as if it were the goal. A lower masked
prediction loss can come from memorising local texture and leave downstream
accuracy flat or worse; the representation has to be evaluated separately, by
linear probe or fine-tuning.

The third is shortcut learning, the characteristic failure. SimCLR reports that
two random crops of one photograph share a colour histogram, so a network can
match them on colour statistics alone and learn nothing about shape — strong
colour distortion exists to close that escape route. In the earlier patch-position
task, predicting where one image patch sits relative to another, networks
exploited chromatic aberration, a lens artefact whose direction reveals absolute
position in the frame, and solved the task without learning any semantics. Pretext
accuracy looked fine in both cases.

The fourth is believing the supervision is free of human judgement. The labels are
free; the pretext task and augmentation set are hand-designed priors, and they do
the work annotation used to do.

Two more, briefly. Contamination matters: when the pretraining crawl overlaps the
evaluation set, downstream scores are inflated, and the GPT-3 authors devote a
section to measuring it. And the relationship between scale and capability is an
empirical regularity over particular model families and corpora, not a law.

## Variants and alternatives

**Autoregressive prediction** (the GPT line) gives an exact likelihood and
generation for free, at the cost of unidirectional context. **Masked prediction**
(BERT, and masked autoencoders in vision) gives context on both sides and stronger
discriminative features, at the cost of exact likelihood and a mismatch around the
mask token. **Contrastive instance discrimination** (SimCLR, MoCo, CLIP) needs no
decoder but does need many negatives — a large batch or a memory mechanism — and a
tuned augmentation set. **Non-contrastive self-distillation** such as BYOL and
DINO drops negatives entirely, preventing collapse with an asymmetric predictor
and a slowly updated target network: a simpler pipeline, a less transparent
explanation of why it works.

Genuinely different competitors: supervised pretraining on a large labelled
corpus, stronger per example but bounded by labels; weak supervision from metadata
such as alt-text, which is what CLIP uses — cheap, noisy, still human-produced;
and semi-supervised methods such as pseudo-labelling, which bootstrap a large
unlabelled set from a small labelled one rather than avoiding labels at all.

## History and attribution

The idea has several independent origins. Statistical language modelling had been
predicting the next symbol from raw text since Shannon, long before anyone called
it self-supervision. Autoencoders — in particular denoising autoencoders, which
reconstruct a corrupted input — supplied the corrupt-and-reconstruct template, and
greedy layer-wise unsupervised pretraining in the mid-2000s established the
pretrain-then-fine-tune workflow; the _Deep Learning_ book covers both strands.
Word embeddings trained by predicting neighbouring words made derived labels
ordinary practice in language processing around 2013.

The term spread through computer vision in the mid-to-late 2010s, attached to
pretext tasks like predicting patch layout or colourising a greyscale image. The
modern era is usually dated to BERT (2018) for masked prediction, GPT-3 (2020) for
the scaling argument, and SimCLR and MoCo (2020) for contrastive vision.

## Sources

The _Deep Learning_ book is the reference for the claim that the supervised and
unsupervised boundary is a convention rather than a formal distinction, and for
the autoencoder and unsupervised-pretraining history. The BERT paper gives the
masking recipe with its exact proportions and the reasoning behind the 80/10/10
split. The GPT-3 paper is the clearest statement of the scaling argument and
documents benchmark contamination honestly. SimCLR is the source for augmentation
composition and the colour-histogram shortcut.

## Prerequisites and next connections

Understand plain supervised learning first — loss, optimiser, train-validation
split — because all of it carries over unchanged. A working grasp of
[Probability Theory](./probability-theory.md), specifically the chain rule
factorisation of a joint distribution, is what makes the autoregressive case
legible as maximum likelihood rather than a trick, and [PyTorch](./pytorch.md) is
enough to read the masking code above.

From here, the contrastive learning page covers instance discrimination in detail
and the transfer learning page covers what happens to the encoder afterwards.
Because pretraining runs are large and long,
[Training Infrastructure](./training-infrastructure.md) stops being an
implementation detail and becomes part of the method.
