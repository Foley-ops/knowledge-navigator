---
concept_id: concept.learning.meta_learning
title: Meta-Learning
slug: /concepts/meta-learning
aliases:
  - learning to learn
kind: concept
tier: 1
review_state: generated-draft
summary: Training across a distribution of tasks so that the result — an initialisation, a metric, or a learning rule — lets a new task be learned from a handful of examples.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: requires
    target: concept.learning.supervised_learning
    note: The inner loop of a standard few-shot meta-learner is an ordinary supervised fit on a labelled support set, so the episodic protocol is unreadable without supervised learning first.
  - type: contrasts_with
    target: concept.learning.transfer_learning
    note: Both aim at a new task with little data, but transfer learning reuses a representation fitted for some other objective while meta-learning makes adaptation itself the training objective — and strong transfer baselines match meta-learners on many benchmarks.
  - type: contrasts_with
    target: concept.learning.self_supervised_learning
    note: Self-supervised pretraining plus a linear probe is the competing route to few-shot performance, reaching it through representation quality rather than through an explicit adaptation objective.
  - type: contributes_to
    target: concept.learning.continual_learning
    note: Meta-learning supplies continual learning with update rules and initialisations optimised so that learning a new task interferes less with old ones.
sources:
  - source_id: source.finn2017.maml
    title: Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks
    url: https://arxiv.org/abs/1703.03400
    source_kind: preprint
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
    checked_on: 2026-09-17
  - source_id: source.brown2020.gpt3
    title: Language Models are Few-Shot Learners
    url: https://arxiv.org/abs/2005.14165
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.radford2021.clip
    title: Learning Transferable Visual Models From Natural Language Supervision
    url: https://arxiv.org/abs/2103.00020
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: The few-shot baseline and benchmark-critique literature (Chen et al., A Closer Look at Few-shot Classification; Tian et al., Rethinking Few-Shot Image Classification; Raghu et al., ANIL)
    reason: The registry has no entry for the papers that established that a well-pretrained backbone with a simple classifier matches many meta-learners, or that MAML's gains come mostly from feature reuse, so those claims are stated from general knowledge and should be checked against the papers before this page leaves generated-draft.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: Metric-based meta-learning primaries (Matching Networks, Prototypical Networks) and the pre-2010 origins of learning to learn
    reason: None of these are in the source registry, so the prototype formula, the episodic protocol's attribution and the early history rest on general knowledge rather than on a citable source here.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Meta-learning** treats a *task* rather than an example as the unit of data:
it optimises some meta-parameter $\theta$ over a distribution of tasks so that
a task drawn fresh from that distribution can be learned from very few
examples. The structure is bilevel. An **inner loop** adapts to a single task
using its small labelled **support set**; an **outer loop** scores that
adaptation on a held-out **query set** from the same task and updates $\theta$
to make the next adaptation better. What is learned in the outer loop is not a
solution to any task but a mechanism — an initialisation, an embedding, a
similarity metric, a learning rate, or an entire update rule.

## Why it matters

Ordinary supervised training wants hundreds or thousands of labelled examples
per class, and many real problems refuse to supply them: a rare disease with
forty confirmed cases, a robot that must adapt on its first day in a new
building. The standard answer is to transfer a representation learned elsewhere
and hope it fits. Meta-learning makes the hope an objective: it measures,
during training, how well the model does *after* being given $k$ examples, and
optimises that. The same machinery extends past few-shot classification into
learned optimisers and learned hyperparameters.

## Intuition

The picture worth carrying is geometric. Multi-task learning looks for one
parameter vector that is simultaneously decent at every task. Optimisation-based
meta-learning looks for a point from which a short gradient descent path reaches
a good solution for *any* task in the family — a point that may be mediocre at
every task on its own, but has small *optimisation distance* to all of them.

The tempting analogy is a student who has sat many exams and learned how to
revise. It breaks in a specific way: the student's skill generalises to subjects
she has never seen, and a meta-learner's does not. It is tuned to the task
distribution it was meta-trained on, and tasks of a different shape degrade it
much as ordinary distribution shift degrades a classifier.

## Concrete example

A **5-way 1-shot episode** is the canonical unit. Sample 5 classes from the
pool; take 1 labelled image per class as the support set (5 examples total) and
15 more per class as the query set (75 examples). The model adapts on the 5, is
scored on the 75, and both sets are thrown away — the next episode uses 5
different classes. Chance is 20%. On miniImageNet with a four-layer
convolutional backbone, MAML reported 48.70% ± 1.84% on this setting.

Here is one MAML meta-gradient in PyTorch, with the second-order term intact:

```python
import torch
from torch.func import functional_call
from torch.nn.functional import cross_entropy

model = torch.nn.Linear(4, 5)
theta = {k: v.detach().clone().requires_grad_(True)
         for k, v in model.named_parameters()}
alpha = 0.4

def task_loss(params, x, y):
    return cross_entropy(functional_call(model, params, (x,)), y)

xs, ys = torch.randn(5, 4), torch.arange(5)                       # support
xq, yq = torch.randn(75, 4), torch.arange(5).repeat_interleave(15)  # query

g = torch.autograd.grad(task_loss(theta, xs, ys), list(theta.values()),
                        create_graph=True)          # keep the graph -> 2nd order
phi = {k: v - alpha * gi for (k, v), gi in zip(theta.items(), g)}
meta_grad = torch.autograd.grad(task_loss(phi, xq, yq), list(theta.values()))
```

`create_graph=True` is the whole second-order story. Drop it (or detach `phi`)
and you have first-order MAML.

## Formal treatment

Let $p(\mathcal{T})$ be a distribution over tasks. Each task $\mathcal{T}_i$
yields a support set $D^{\text{sup}}_i$ and a query set $D^{\text{qry}}_i$. Let
$\mathrm{Alg}$ be the inner learner, producing task parameters
$\phi_i = \mathrm{Alg}(\theta, D^{\text{sup}}_i)$. The meta-objective is the
bilevel problem

$$
\min_{\theta}\ \mathbb{E}_{\mathcal{T}_i \sim p(\mathcal{T})}
\Big[\, \mathcal{L}\big(\mathrm{Alg}(\theta, D^{\text{sup}}_i),\, D^{\text{qry}}_i\big) \Big].
$$

**MAML** takes $\mathrm{Alg}$ to be one (or a few) gradient steps with inner
step size $\alpha$, so $\phi_i = \theta - \alpha \nabla_\theta \mathcal{L}(\theta, D^{\text{sup}}_i)$,
and $\theta$ is updated with outer step size $\beta$ by
$\theta \leftarrow \theta - \beta \nabla_\theta \sum_i \mathcal{L}(\phi_i, D^{\text{qry}}_i)$.
The chain rule through the inner step gives

$$
\nabla_\theta\, \mathcal{L}(\phi_i, D^{\text{qry}}_i)
= \Big( I - \alpha \nabla^2_\theta \mathcal{L}(\theta, D^{\text{sup}}_i) \Big)
\, \nabla_{\phi} \mathcal{L}(\phi_i, D^{\text{qry}}_i),
$$

where $\nabla^2_\theta \mathcal{L}$ is the Hessian of the support loss at
$\theta$. **First-order MAML** drops that Hessian and uses
$\nabla_{\phi}\mathcal{L}(\phi_i, D^{\text{qry}}_i)$ directly, which needs no
second derivatives and no graph through the inner step.

A scalar case makes the difference legible. Take
$\mathcal{L}^{\text{sup}}(\theta) = \tfrac12(\theta - 2)^2$ and
$\mathcal{L}^{\text{qry}}(\theta) = \tfrac12(\theta - 3)^2$, with $\theta = 0$
and $\alpha = 0.5$. The inner step gives $\phi = 0 - 0.5(0 - 2) = 1$. The exact
meta-gradient is $(1 - 0.5 \cdot 1)(1 - 3) = -1$; the first-order approximation
is $(1 - 3) = -2$. Same direction, twice the size: the curvature factor
rescales the step rather than redirecting it, which is why the cheap version
so often works.

**Metric-based** methods put the learning in the embedding instead. With an
embedding $f_\theta$ and a class prototype $c_k = \frac{1}{|S_k|}\sum_{x \in S_k} f_\theta(x)$
averaged over that class's support examples, the prediction is
$p(y = k \mid x) \propto \exp(-d(f_\theta(x), c_k))$ for a distance $d$; the
inner loop is a closed-form average rather than an optimisation.
**Model-based** methods make the inner loop a forward pass: a recurrent or
attentional network consumes the support set as a sequence and emits
predictions for the query, with adaptation living in the activations.

## Assumptions and requirements

The load-bearing assumption is that meta-training and meta-test tasks come from
the *same* task distribution. Nothing in the formulation protects against a
shift in task structure, and cross-domain few-shot accuracy typically drops
sharply.

Second, there must be enough distinct tasks. A meta-learner overfits the finite
set of meta-training tasks exactly as a classifier overfits a finite set of
examples, and the failure is harder to see because accuracy within each episode
still looks like held-out accuracy.

Third, optimisation-based methods need the inner algorithm to be
differentiable, or need implicit differentiation to avoid backpropagating
through it. Metric-based methods additionally tend to assume the test episode
has the same N-way, K-shot shape as training, since prototypes and distances
are calibrated to it.

Finally, the second-order term assumes usable curvature. Finn et al. note that
ReLU networks are locally almost linear, so those second derivatives are near
zero much of the time — a large part of why dropping them costs so little.

## Uses and applicability

Reach for meta-learning when new tasks genuinely keep arriving, they share
structure, and each carries few labels: few-shot classification of rare
categories, fast adaptation in robotics and reinforcement learning,
personalisation per user, and low-data scientific domains. The bilevel
machinery is also the standard way to learn hyperparameters, learning rates and
architectures by differentiating through training.

Do not reach for it when you have enough data for the target task — fine-tune
and move on — or when a large pretrained model already covers the domain.
Large language models perform in-context few-shot learning with no explicit
meta-objective, purely as a by-product of scale, which removes the motivation
for episodic meta-training across a broad class of text tasks.

## Limitations and common mistakes

The most important honest finding is that the headline benchmarks are weaker
than they look. Standard few-shot suites draw all their classes from a single
dataset, so the task distribution is narrow and meta-test tasks are close
relatives of meta-training ones. Reported gaps between methods are often within
overlapping confidence intervals, and they shrink or vanish once backbones are
made deeper and comparable. A plain baseline — pretrain a representation on the
merged meta-training classes, then fit a linear or nearest-centroid classifier
on the support set — matches many published meta-learners. CLIP makes the
neighbouring point at scale: zero-shot classification from a large pretrained
model can be competitive with few-shot linear probes on strong supervised
features. Related: much of MAML's advantage appears to come from feature reuse
rather than rapid adaptation, since adapting only the head in the inner loop
costs little accuracy.

Three implementation mistakes recur. Query examples leaking into the inner loop
inflates results and is easy to do by accident. Batch normalisation computed
over the query set makes the model transductive — it sees the test batch —
which is not comparable to inductive evaluation but is often reported as if it
were. And backpropagating through many inner steps is memory-hungry and
numerically fragile; the meta-gradient vanishes or explodes much as it does
through a long recurrence.

## Variants and alternatives

**Optimisation-based**: MAML; first-order MAML and Reptile, which trade the
Hessian for speed; Meta-SGD, which learns per-parameter inner learning rates;
implicit MAML, which uses implicit differentiation so cost does not grow with
inner steps; ANIL, which adapts only the final layer. **Metric-based**:
Matching Networks, Prototypical Networks and Relation Networks — cheap, stable,
no second derivatives, but the inner loop is fixed by construction.
**Model-based**: memory-augmented networks and recurrent meta-learners such as
$\text{RL}^2$, flexible but harder to train and weaker at extrapolation.
**Bayesian** treatments read the whole thing as hierarchical inference, with
$\theta$ a prior over task parameters, which buys calibrated uncertainty.

The genuine competitors are not variants at all: large-scale supervised or
self-supervised pretraining followed by fine-tuning, and in-context learning in
large language models, where adaptation happens in the forward pass at
inference time.

## History and attribution

The idea has several independent origins. Schmidhuber's 1987 diploma thesis
proposed self-referential systems that modify their own learning; Bengio, Bengio
and Cloutier explored learning a synaptic learning rule in 1991; Thrun and
Pratt's 1998 edited volume *Learning to Learn* gave the field its name and its
framing as generalisation across tasks; and Hochreiter, Younger and Conwell
showed in 2001 that a recurrent network could carry a learning algorithm in its
activations.

The modern wave dates to 2016–2017: Vinyals and colleagues introduced Matching
Networks together with the episodic N-way K-shot protocol everything since has
been measured on, Ravi and Larochelle trained an LSTM as the optimiser, and
Finn, Abbeel and Levine introduced MAML in 2017 — model-agnostic because it
assumes nothing about the architecture beyond differentiability, and applied in
the same paper to few-shot regression, classification and reinforcement
learning.

## Sources

The MAML paper is the primary reference for the bilevel formulation, the exact
meta-gradient including its Hessian factor, the first-order approximation with
its local-linearity argument, and the benchmark number quoted above.
Goodfellow, Bengio and Courville's *Deep Learning* covers the surrounding
motivation — transfer, one-shot and zero-shot learning through shared
representations — rather than meta-learning algorithms themselves. The GPT-3
paper is the reference for in-context few-shot learning as an alternative route
to adaptation, and CLIP for the evidence that large-scale pretraining alone
yields zero- and few-shot performance competitive with task-specific methods.
The few-shot baseline critiques behind the limitations section are not in the
registry and are declared as unresolved references.

## Prerequisites and next connections

Understand supervised learning first — the inner loop is nothing more than that
— and be comfortable with gradient-based training as covered in
[Stochastic Optimization](./stochastic-optimization.md), since the outer loop is
stochastic gradient descent whose samples are tasks. The meta-gradient is a
chain rule through a gradient step, so the Hessian-vector products of
[Multivariable Calculus](./multivariable-calculus.md) are the mathematics
actually in use, and the landscape is decidedly
[nonconvex](./nonconvex-optimization.md).

Implementing any of this needs higher-order automatic differentiation:
[PyTorch](./pytorch.md) via `create_graph=True` and functional parameter calls,
[JAX](./jax.md) via nesting `grad` inside `grad`. From here, transfer learning
and self-supervised learning are the baselines meta-learning must beat, and
[Bayesian Inference](./bayesian-inference.md) gives the reading of the outer
loop as a prior over task parameters.
