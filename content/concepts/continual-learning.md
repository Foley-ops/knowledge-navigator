---
concept_id: concept.learning.continual_learning
title: Continual Learning
slug: /concepts/continual-learning
aliases:
  - lifelong learning
  - incremental learning
kind: concept
tier: 1
review_state: generated-draft
summary: Training one model on a stream of tasks it can never revisit, where the central obstacle is that gradient descent on new data quietly overwrites what the same weights encoded about the old.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: requires
    target: concept.optimization.stochastic_optimization
    note: Forgetting is a property of stochastic gradient steps taken on samples from the current distribution only, so the reader needs the sampled-oracle picture before the failure makes sense.
  - type: contrasts_with
    target: concept.learning.supervised_learning
    note: Ordinary supervised learning draws its training batches i.i.d. from one fixed dataset held in full; continual learning is the same objective with exactly that access removed.
  - type: contrasts_with
    target: concept.learning.transfer_learning
    note: Transfer learning is scored only on the target task and is content to degrade the source, whereas continual learning counts that degradation as the failure it is trying to prevent.
  - type: useful_when
    target: concept.ml_engineering.edge_inference
    note: A model adapting on a device cannot ship its user's data back to a training cluster, which rules out the retrain-from-scratch answer and leaves the continual setting.
sources:
  - source_id: source.kirkpatrick2017.ewc
    title: Overcoming catastrophic forgetting in neural networks
    url: https://arxiv.org/abs/1612.00796
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mnih2015.human_level_control
    title: Human-level control through deep reinforcement learning
    url: https://www.nature.com/articles/nature14236
    source_kind: primary-research
    supports:
      - intuition
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.hinton2015.distilling_knowledge
    title: Distilling the Knowledge in a Neural Network
    url: https://arxiv.org/abs/1503.02531
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
unresolved_references:
  - label: The origin of catastrophic interference (McCloskey and Cohen 1989; Ratcliff 1990; French's 1999 survey) and Grossberg's stability–plasticity dilemma
    reason: No registry source covers the connectionist-psychology literature where the phenomenon was first named and analysed; the EWC paper cites that history but is not itself a source for it, so the attributions in the first paragraph of the history section rest on nothing cited here.
    sections:
      - intuition
      - history-and-attribution
  - label: The replay and parameter-isolation method literature (iCaRL, GEM and A-GEM, deep generative replay, progressive networks, PackNet, HAT) and the task/domain/class-incremental evaluation taxonomy
    reason: The registry's only continual-learning source is EWC, which predates or lies outside all of these, so the named methods, the backward-transfer metric and the claim that class-incremental protocols break regularisation methods are stated from general knowledge and should be checked against a survey before this page leaves generated-draft.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - limitations-and-common-mistakes
  - label: Loss of plasticity in long training streams
    reason: The finding that networks trained continually lose the ability to fit new data at all, separately from forgetting the old, comes from work not in the registry and is reported here as an empirical result without a citation to stand behind it.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Continual learning** is the problem of fitting one parameter vector $\theta$ to
a sequence of data distributions $D_1, \dots, D_K$ that arrive one at a time and
cannot be revisited, while ending up good on all of them. The objective is the
one joint training would optimise,

$$
\min_{\theta} \; \frac{1}{K} \sum_{k=1}^{K}
\mathbb{E}_{(x,y) \sim D_k}\!\left[\ell(f_\theta(x), y)\right],
$$

but the learner may only draw samples from $D_k$ during phase $k$, and may carry
at most a bounded memory $M$ of examples out of it. **Catastrophic forgetting**
is the observed failure mode: after phase $k$, loss on $D_1, \dots, D_{k-1}$ has
risen sharply, often to near chance.

## Why it matters

Retraining from scratch on everything is the correct answer whenever it is
available, and it usually is. Continual learning matters exactly where it is
not: data that may not be kept (medical records, a user's messages), data too
large to store (raw sensor streams), an agent whose environment changes while it
is running, or a model on a device that must personalise without sending
anything home. Kirkpatrick et al. framed it as the gap between a network and an
animal, which acquires a new skill without losing yesterday's — and a system
that cannot do this must be periodically rebuilt by an infrastructure that may
not exist.

## Intuition

A stochastic gradient step reduces the loss on the batch in front of it. Nothing
in the update refers to data that is not there. Gradients from $D_1$ are simply
absent once phase 1 ends, so the weights they shaped are free to move, and the
optimiser will move them because that is what reduces the current loss. Deep
replay buffers in reinforcement learning exist for the same reason: Mnih et al.
randomised over stored transitions specifically to break the correlation of a
sequential stream and smooth over changes in the data distribution.

The framing everyone carries is the **stability–plasticity trade-off**: the same
weights must resist change to preserve old behaviour and accept change to learn
new behaviour. The analogy to memory is useful but leaks. Forgetting here is not
erasure — a forgotten task is usually relearned in a fraction of the original
steps, which says the representation survived and mostly the readout moved.

## Concrete example

Take a linear model $f_w(x) = w^\top x$ with $w \in \mathbb{R}^2$ and squared
loss. Task A is the single example $x_A = (1,0)$, $y_A = 2$, so
$L_A(w) = \tfrac12 (w_1 - 2)^2$. Gradient descent from the origin reaches
$w^*_A = (2, 0)$; $w_2$ never moves because $L_A$ does not depend on it.

Task B is $x_B = (1,1)$, $y_B = 0$, so $L_B(w) = \tfrac12 (w_1 + w_2)^2$, whose
minimisers are the whole line $w_1 + w_2 = 0$. Gradient descent from $(2,0)$
always steps along $-(1,1)$ and halts at $(1, -1)$. Task B is now solved, and
$L_A$ has gone from $0$ to $0.5$ — the model predicts $1$ where it used to
predict $2$. Nothing forced this: the point $(2,-2)$ is also a perfect solution
to task B and keeps task A exact. Descent simply took the shortest route.

Elastic weight consolidation repairs it with the Fisher information of task A.
For a Gaussian likelihood the per-example Fisher is $x x^\top$, so here
$F = \operatorname{diag}(1, 0)$: curvature along $w_1$, none along $w_2$.
Minimising $L_B(w) + \tfrac{\lambda}{2} \sum_i F_i (w_i - w^*_{A,i})^2$ gives
stationarity conditions $w_1 + w_2 = 0$ and $\lambda(w_1 - 2) = 0$, so
$w = (2,-2)$ for every $\lambda > 0$ — both losses zero. The penalty did not
freeze the model; it steered the step into the direction the old task did not
care about.

Now make the tasks genuinely conflict: $x_B = (1,0)$, $y_B = 0$. The minimiser
becomes $w_1 = 2\lambda/(1+\lambda)$, so $\lambda = 1$ splits the difference at
$w_1 = 1$ and no $\lambda$ is good at both. That is the trade-off with numbers
in it: regularisation buys you the null directions of the old task and nothing
more.

## Formal treatment

Let $a_{k,j}$ be accuracy on task $j$ after finishing task $k$. The headline
number is final average accuracy $A = \frac{1}{K}\sum_{j} a_{K,j}$, and
forgetting is reported as backward transfer,
$\mathrm{BWT} = \frac{1}{K-1}\sum_{j<K} (a_{K,j} - a_{j,j})$, which is negative
when later training hurt earlier tasks.

Why curvature is the right currency: let $\theta^*_A$ minimise $L_A$, so
$\nabla L_A(\theta^*_A) = 0$. A step $\Delta\theta$ taken for task B changes the
old loss by

$$
\Delta L_A \;\approx\; \tfrac{1}{2}\, \Delta\theta^\top H_A \, \Delta\theta ,
\qquad H_A = \nabla^2 L_A(\theta^*_A),
$$

with the first-order term vanishing. Forgetting is therefore governed by how much
of the step lies in high-curvature directions of the old loss, and movement in
its flat directions is free. EWC uses the diagonal of the Fisher information
$F$ in place of $H_A$, which is justified by a Laplace approximation: treating
$\log p(\theta \mid D_A)$ as Gaussian around $\theta^*_A$ with precision $F$
turns the posterior over both tasks into

$$
L(\theta) \;=\; L_B(\theta) \;+\; \frac{\lambda}{2}\sum_i F_i\,(\theta_i - \theta^*_{A,i})^2 .
$$

Two approximations are doing work. The Fisher equals the Hessian of the expected
negative log-likelihood only at a well-fit optimum, and the *empirical* Fisher
computed from observed labels is a different object again. The diagonal discards
every parameter correlation, which is precisely what a 2-parameter example
cannot show you.

## Assumptions and requirements

The i.i.d. sampling assumption behind empirical risk minimisation, set out in
the Deep Learning book, is what continual learning deletes; every guarantee that
rested on it is gone, and nothing replaces it.

Beyond that: many methods assume **task boundaries are known** at training time,
and some assume task identity is supplied at test time — a much stronger
requirement that quietly makes the problem easier. Regularisation assumes the
quadratic model of the old loss stays valid, which fails once the new task drags
$\theta$ far from $\theta^*_A$, and assumes the previous phase actually reached
a minimum. Replay assumes you are permitted to store raw examples, which in the
settings that motivate continual learning is frequently the one thing you cannot
do. All of it assumes the tasks are compatible enough that one $\theta$ can
serve them; when two tasks give the same input different labels, no method
recovers both without extra capacity or a context signal.

## Uses and applicability

Reach for it when retraining is genuinely blocked: privacy or retention rules,
streams too large to keep, on-device adaptation, agents in non-stationary
environments, or a foundation model being extended to a new domain where the
cost of the original run cannot be repeated. Do not reach for it when you can
store the data and afford a periodic rebuild — joint retraining is simpler, and
it is the upper bound nearly every continual method is measured against and
nearly none reaches.

## Limitations and common mistakes

The first mistake is treating forgetting as a capacity problem. Capacity is
rarely the binding constraint; the optimiser is, and a network with room to
spare will still overwrite.

The second is cross-paper comparison. Reported numbers depend on whether the
network has one head per task or a single shared head, whether task identity is
given at test time, the epochs per task, the replay buffer size, and whether
hyperparameters were tuned using the whole stream — which leaks the future.
Methods that look strong when the task label is supplied can collapse when the
model must also decide which task it is in, and Permuted MNIST is an unusually
forgiving benchmark that predicts little about class-incremental behaviour.
Treat a table that mixes protocols as not comparable.

The third is assuming replay is free because it works. Small buffers are
remarkably effective, but the stored examples are replayed many times and get
overfitted, and the imbalance between a handful of old examples and a full
stream of new ones biases the classifier toward recent classes.

The fourth is measuring only forgetting. Networks trained on long streams also
appear to lose **plasticity** — the ability to fit new data at all — which a
final-average-accuracy table cannot distinguish from a method that is simply
very stable.

## Variants and alternatives

**Regularisation** methods add a penalty: in weight space (EWC's Fisher-weighted
quadratic, and later variants that estimate importance along the training path
instead), or in function space, where the old model's soft outputs are matched
using the distillation mechanism of Hinton et al. Penalties are cheap and store
no data; they degrade as tasks accumulate.

**Replay** keeps a small buffer and mixes it into every batch, or trains a
generator and replays samples from it instead — no stored data, but the
generator forgets too. Replay is the strongest family in practice and assumes
the storage permission you often lack.

**Parameter isolation** gives each task its own parameters: growing the network
per task, masking a fixed network so tasks occupy disjoint weights, or attaching
a small adapter per task. Forgetting becomes zero by construction, at the cost
of parameters that grow with $K$ and, usually, needing to know which task you
are in. Per-task low-rank adapters are the current form of this for large
models.

Genuinely different approaches: retrain jointly; keep knowledge outside the
weights and retrieve it; merge separately-trained models by averaging weights.

## History and attribution

McCloskey and Cohen named catastrophic interference in 1989 while building a
connectionist model of arithmetic facts, and Ratcliff reported it independently
in recognition-memory models shortly after; French surveyed the problem a decade
later. Grossberg had already posed the underlying stability–plasticity dilemma
in his work on adaptive resonance. The phenomenon has been rediscovered often
enough that no single origin is the honest story.

The deep-learning revival dates to around 2016–2017, when several groups
attacked it at once. Kirkpatrick et al., at DeepMind, introduced elastic weight
consolidation with an explicit analogy to synaptic consolidation in neuroscience,
demonstrating it on permuted MNIST and on an agent learning a sequence of Atari
games. Replay-based and architectural methods appeared in the same window. A
subsequent wave of work was mainly about evaluation, arguing that the early
protocols had been measuring an easier problem than the one they claimed.

## Sources

**Overcoming catastrophic forgetting in neural networks** is the primary source
for the Fisher-weighted penalty, its Laplace-approximation derivation, and the
framing of the problem; it is also the source for its own history and
motivation. **Human-level control through deep reinforcement learning** is cited
for experience replay and the argument about correlated non-stationary streams,
not for continual learning as such. **Distilling the Knowledge in a Neural
Network** supplies the soft-target mechanism that function-space regularisation
borrows. The **Deep Learning** book is the reference for the i.i.d. assumption
behind empirical risk minimisation and for regularisation as an added penalty.

## Prerequisites and next connections

Read [Stochastic Optimization](./stochastic-optimization.md) first: forgetting is
a statement about what a sampled-gradient step does and does not see, and the
i.i.d.-oracle assumption there is the one being broken.
[Bayesian Inference](./bayesian-inference.md) supplies the Laplace approximation
and the Fisher information that make the EWC penalty more than a heuristic.

Afterwards, [Deployment](./deployment.md) is where the constraint usually bites
— a model that must adapt in place, on data it may not retain, is the practical
reason anyone chooses this setting over a rebuild.
