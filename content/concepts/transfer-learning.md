---
concept_id: concept.learning.transfer_learning
title: Transfer Learning
slug: /concepts/transfer-learning
aliases:
  - inductive transfer
kind: concept
tier: 1
review_state: generated-draft
summary: Reusing a model fitted on one task to learn another — by freezing its representation or by continuing to train it — which usually beats training from scratch when target labels are scarce, and can be worse than scratch when the two tasks share little.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: requires
    target: concept.learning.supervised_learning
    note: Both feature extraction and fine-tuning end in fitting a labelled objective on the target task, so the supervised setup — loss, labels, generalisation gap — has to be understood before the transfer step makes sense.
  - type: contributes_to
    target: concept.learning.self_supervised_learning
    note: A self-supervised pretext objective has no value in itself; it is judged almost entirely by how well the representation it produces transfers, so transfer is the step that gives pretraining its purpose.
  - type: contrasts_with
    target: concept.learning.meta_learning
    note: Meta-learning explicitly optimises the initialisation for fast adaptation across a distribution of tasks, whereas transfer learning reuses a model that was never trained with adaptability as an objective.
  - type: contrasts_with
    target: concept.learning.continual_learning
    note: Transfer moves in one direction and is free to forget the source task, while continual learning must keep performing on everything it has seen; the same gradient step that makes transfer work is the one continual learning tries to prevent.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - why-it-matters
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.radford2021.clip
    title: Learning Transferable Visual Models From Natural Language Supervision
    url: https://arxiv.org/abs/2103.00020
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.russakovsky2015.imagenet_challenge
    title: ImageNet Large Scale Visual Recognition Challenge
    url: https://arxiv.org/abs/1409.0575
    source_kind: dataset-or-benchmark
    supports:
      - concrete-example
    checked_on: 2026-09-17
unresolved_references:
  - label: Yosinski, Clune, Bengio and Lipson (2014), "How transferable are features in deep neural networks?"
    reason: The layer-by-layer transferability measurements, the co-adaptation effect and the direct demonstration of negative transfer are attributed to this study, and no registry source reports them.
    sections:
      - intuition
      - limitations-and-common-mistakes
  - label: Ben-David and colleagues' generalisation bound for domain adaptation
    reason: The bound stated in the formal treatment, with the H-divergence term and the joint-error term, comes from this line of work and no registry source states it.
    sections:
      - formal-treatment
      - assumptions-and-requirements
  - label: Pre-2010 transfer learning literature (Pratt; Thrun; Caruana; the Pan and Yang survey)
    reason: The attributions and the domain-versus-task terminology in the history section rest on these, and the registry holds none of them.
    sections:
      - history-and-attribution
      - formal-treatment
  - label: Parameter-efficient fine-tuning methods, and evidence on when pre-training stops helping
    reason: Adapters, LoRA and prompt tuning, and the finding that pre-training mainly accelerates convergence once the target dataset is large, are named without a registry source that covers them.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
claims: []
---

## Definition

**Transfer learning** is the practice of using data or parameters from a _source_
task to improve learning on a different _target_ task. In deep learning it almost
always takes one concrete form: split a trained network into a representation
$\phi$ and a task head $g$, throw away $g$, keep $\phi$, and fit a new head on the
target data. Two things can then happen to $\phi$.

- **Feature extraction** (or _linear probing_): $\phi$ is frozen and only the new
  head is trained, so the pretrained network is a fixed function from inputs to
  vectors.
- **Fine-tuning**: gradients continue into $\phi$, so the pretrained weights are an
  initialisation rather than a fixed function.

**Domain adaptation** is the special case where the task is the same — same labels,
same decision rule — but the input distribution differs: train on studio
photographs, deploy on phone snapshots.

## Why it matters

Deep networks need more labelled data than most problems have. A ResNet-50 has
about 25.6 million parameters; a clinic with three thousand annotated photographs
cannot fit that from a random initialisation, and no amount of regularisation
rescues it. Starting from weights fitted on a large generic corpus turns a hopeless
estimation problem into a tractable one, because the expensive part — learning what
edges, textures and syntax look like — was paid for once, on data the practitioner
will never see.

This also changed what a model _is_. Since BERT, the normal unit of work in
language processing is not a task-specific architecture but one pretrained network
fine-tuned separately per task, at a cost of hours rather than weeks. The same
shift happened in vision a few years earlier.

## Intuition

Carry two pictures at once.

The first: the pretrained network is a **measuring instrument**, calibrated by
pretraining to report useful quantities — is there a vertical edge here, is this
token a proper noun — that the new head only has to read off. The analogy breaks
where fine-tuning starts: an instrument is inert, while $\phi$ is being rebuilt
under you, and a large learning rate can destroy in twenty steps what pretraining
took a week to build.

The second is repeated most and understood least: **early layers learn general
features, later layers learn task-specific ones**. This is an empirical observation
with real evidence behind it — Yosinski and colleagues transferred the first $k$
layers of an ImageNet network to a disjoint task for each $k$ and measured the cost
of each cut — not a theorem. Two findings are usually dropped in the retelling. The
loss from cutting a network in the middle is partly the specificity of the upper
layers and partly the breaking of **co-adaptation** between adjacent layers, which
has nothing to do with generality. And letting the transferred layers fine-tune
recovers most of the loss, even across dissimilar tasks. The depth ordering is also
far less clean in transformers than in convolutional stacks.

## Concrete example

The source is a ResNet-50 pretrained on ImageNet-1k: roughly 1.28 million training
images over 1000 classes. The target is 2,400 labelled photographs of plant leaves
in 12 disease classes, at $224 \times 224$.

ImageNet ResNet-50's final layer maps 2048 features to 1000 logits,
$2048 \times 1000 + 1000 = 2{,}049{,}000$ parameters, all useless here. Replace it
with a 12-way layer: $2048 \times 12 + 12 = 24{,}588$ parameters, about ten per
training image, which is fittable. Unfreezing the whole backbone instead gives 25.6
million trainable parameters against 2,400 examples — ten thousand per example —
which will fit the training set exactly and generalise on the strength of the
initialisation alone.

The usual compromise is staged, in PyTorch:

```python
import torch
import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights

model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
for p in model.parameters():
    p.requires_grad = False
model.fc = nn.Linear(model.fc.in_features, 12)  # 2048 -> 12, 24,588 new parameters

# Stage 1: head only, large learning rate, a few epochs.
opt = torch.optim.AdamW(model.fc.parameters(), lr=1e-3)

# Stage 2: unfreeze the last residual stage at a much smaller rate.
for p in model.layer4.parameters():
    p.requires_grad = True
opt = torch.optim.AdamW([
    {"params": model.layer4.parameters(), "lr": 1e-5},
    {"params": model.fc.parameters(), "lr": 1e-3},
])
```

The decision rule this instantiates: small target set and a similar domain, freeze
and train the head; large target set and a similar domain, fine-tune everything at
a small rate; small target set and a distant domain, cut lower and unfreeze a
middle block; large target set and a distant domain, question whether the source is
buying anything at all.

## Formal treatment

Write a domain as $\mathcal{D} = (\mathcal{X}, P(X))$ and a task as
$\mathcal{T} = (\mathcal{Y}, P(Y \mid X))$. Transfer learning uses
$(\mathcal{D}_S, \mathcal{T}_S)$ to improve an estimate of the target predictor when
$\mathcal{D}_S \neq \mathcal{D}_T$ or $\mathcal{T}_S \neq \mathcal{T}_T$.

Let $h = g_w \circ \phi_\theta$ with $\phi_\theta : \mathcal{X} \to \mathbb{R}^d$
and $\theta_S$ the pretrained parameters. Given target data
$\{(x_i, y_i)\}_{i=1}^{n}$ and loss $\ell$, feature extraction solves

$$
\hat{w} \;=\; \arg\min_{w} \; \frac{1}{n} \sum_{i=1}^{n} \ell\!\left(g_w(\phi_{\theta_S}(x_i)), \, y_i\right),
$$

with $\theta$ held at $\theta_S$. If $g_w$ is linear and $\ell$ convex this is a
convex problem with a unique optimum, which is why the _linear probe_ is the
standard yardstick for representation quality: it measures the representation, not
the optimisation run. Fine-tuning instead solves

$$
(\hat{\theta}, \hat{w}) \;=\; \arg\min_{\theta, w} \; \frac{1}{n} \sum_{i=1}^{n} \ell\!\left(g_w(\phi_{\theta}(x_i)), \, y_i\right),
\quad \theta \text{ initialised at } \theta_S .
$$

Nothing in this objective refers to $\theta_S$ after step zero. All the source
knowledge is carried by the initialisation, which is why the learning rate and step
count are not tuning details but the actual controls on how much transfer survives.
Adding $\lambda \lVert \theta - \theta_S \rVert^2$, or a Fisher-weighted version,
is the alternative to controlling it through the optimiser.

For domain adaptation there is a genuine bound. For a hypothesis class
$\mathcal{H}$ and any $h \in \mathcal{H}$,

$$
\varepsilon_T(h) \;\le\; \varepsilon_S(h) \;+\; \tfrac{1}{2} d_{\mathcal{H}\Delta\mathcal{H}}(\mathcal{D}_S, \mathcal{D}_T) \;+\; \lambda,
\qquad \lambda \;=\; \min_{h' \in \mathcal{H}} \left[\varepsilon_S(h') + \varepsilon_T(h')\right],
$$

where $\varepsilon_S, \varepsilon_T$ are the source and target risks and
$d_{\mathcal{H}\Delta\mathcal{H}}$ measures how well any pair of hypotheses in
$\mathcal{H}$ can distinguish the two marginals. The term that matters most is
$\lambda$: if no single hypothesis is good on both domains the bound is vacuous,
and aligning the marginals — what most adaptation methods actually do — cannot
help. This is the formal statement of "transfer requires shared structure".

## Assumptions and requirements

The representation must be evaluated the way it was trained: same input resolution,
same normalisation constants, same tokeniser. Feeding differently-normalised images
to a frozen backbone degrades its features silently, with no error and only worse
numbers.

There must be shared structure, in the sense of a small $\lambda$ above. _Deep
Learning_ puts this as a requirement that the tasks share underlying factors of
variation; when they do not, nothing in the procedure creates them.

The number of unfrozen parameters must be supportable by the number of target
labels — a choice, not a property of the method, and exactly what the freezing cut
controls.

Importance weighting for covariate shift additionally requires support overlap: the
weights $w(x) = P_T(x)/P_S(x)$ exist only where $P_S$ has mass. If the target
distribution lives partly where the source has none, reweighting cannot repair it
and no finite sample reveals the problem.

## Uses and applicability

Reach for transfer whenever target labels are expensive and a large pretrained
model exists in a related modality: medical and satellite imagery, document
understanding, audio classification, and essentially all applied language work,
where fine-tuning one pretrained encoder per task is the default. CLIP extends the
range to **zero-shot transfer**, classifying into categories named in text with no
target gradient steps at all, which suits label sets that are not fixed in advance.

Be sceptical in three situations. When the target dataset is already large,
pre-training is reported mainly to accelerate convergence rather than to raise the
final number, so its value is compute, not accuracy. When the modality does not
match — arbitrary tabular schemas, most scientific instrument data — no pretrained
$\phi$ computes anything meaningful about your inputs. And when the requirement is
robustness rather than accuracy: CLIP's authors found that fine-tuning raised
in-distribution accuracy while _reducing_ effective robustness under distribution
shift, so the better in-distribution model was the worse model to ship.

## Limitations and common mistakes

**Negative transfer is real.** Initialising from a source model can leave you worse
off than a random initialisation. It shows up when the tasks share little, when the
target set is large enough to learn its own features, and when a cut through
co-adapted layers does damage that fine-tuning does not fully repair. Nothing warns
you; the only detection is a from-scratch baseline, and skipping that baseline is
the most common methodological error here.

Second, freezing does not always freeze. Setting `requires_grad = False` stops
gradients but not batch-normalisation layers from updating their running mean and
variance in training mode, so a "frozen" feature extractor drifts across epochs and
the probe measures a moving target. Call `.eval()` on the frozen modules.

Third, the learning rate. A randomly initialised head produces large gradients in
the first steps and those flow straight into the pretrained weights; train the head
first, then unfreeze one or two orders of magnitude lower. Fourth, contamination:
the source corpus may already contain your evaluation set, and a number obtained
that way measures memorisation. Fifth, choosing the freezing depth on the test set,
which turns a design decision into a leak.

Finally, "pretrained" is not a synonym for "good". Comparing linear probes across
models is only meaningful with the probe, the preprocessing and the feature
dimensionality held fixed.

## Variants and alternatives

Along the how-much-to-unfreeze axis: linear probing, partial fine-tuning, gradual
unfreezing, discriminative learning rates, full fine-tuning. Along the
how-many-parameters axis: adapters, LoRA and prompt tuning update well under one
percent of the weights, making hundreds of task-specific variants cheap to store
and catastrophic damage to the base model impossible by construction. BERT's own
ablation compared the frozen feature-based route against fine-tuning on
named-entity recognition and found fine-tuning ahead but the gap modest, which is
about the size of gap to expect.

Genuinely different approaches: **multi-task learning** trains on source and target
together rather than in sequence, avoiding forgetting but requiring source data at
target-training time. **Meta-learning** optimises the initialisation so adaptation
is fast, making transferability the objective instead of a hoped-for side effect.
**Domain adaptation** methods — importance weighting, adversarial feature
alignment, self-training on unlabelled target data — attack the marginal-shift term
specifically. And **training from scratch** with heavy augmentation stays in the
comparison often enough to be worth running.

## History and attribution

The idea has several independent origins and predates deep learning by decades.
Lorien Pratt worked on transferring between neural networks in the early 1990s,
Sebastian Thrun framed lifelong learning and "learning to learn" in the
mid-1990s, and Rich Caruana's 1997 work on multitask learning established that
related tasks trained together improve each other. The domain-versus-task
vocabulary used above was standardised by the survey literature around 2010.

The modern practice arrived with large pretrained networks. In vision, ImageNet
classifiers turned out to be reusable feature extractors for tasks their authors
had not considered, and by the mid-2010s a pretrained backbone was the default
start for detection and segmentation. In language the shift came with BERT in 2018,
whose stated contribution was precisely that one pretrained model, fine-tuned with
a single added output layer, reached state of the art across eleven tasks.

## Sources

The _Deep Learning_ textbook's chapter on representation learning gives the
conceptual framing: what transfer requires in terms of shared factors of variation,
and how domain adaptation, concept drift and zero-shot learning sit in one family.
_BERT_ is the primary document for the pretrain-then-fine-tune paradigm in language
and holds the direct comparison of the frozen feature-based route against
fine-tuning. _Learning Transferable Visual Models From Natural Language
Supervision_ is the reference for zero-shot transfer, for linear probing as an
evaluation protocol, and for the robustness trade-off. The _ImageNet Large Scale
Visual Recognition Challenge_ paper documents the dataset scale quoted in the
example.

## Prerequisites and next connections

Understand supervised learning first: everything after the freezing decision is an
ordinary labelled fitting problem, and the parameters-versus-examples reasoning in
the example is standard generalisation reasoning.
[Stochastic Optimization](./stochastic-optimization.md) makes the learning-rate
discussion concrete, since the whole transfer budget is spent through the
optimiser. To reproduce the example, read [PyTorch](./pytorch.md) and
[ResNet](./resnet.md) — the residual backbone is the one people actually fine-tune
— and [Convolutional Layer](./convolutional-layer.md) for what the frozen layers
compute.

From here, self-supervised and contrastive pretraining are the methods that now
produce the representations being transferred, meta-learning is what you get when
adaptability is optimised rather than hoped for, and continual learning is the
mirror image: the forgetting transfer exploits is the failure it must prevent.
[Deployment](./deployment.md) covers what happens to the fine-tuned checkpoint
afterwards.
