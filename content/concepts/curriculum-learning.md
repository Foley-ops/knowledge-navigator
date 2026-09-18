---
concept_id: concept.learning.curriculum_learning
title: Curriculum Learning
slug: /concepts/curriculum-learning
kind: method
tier: 1
review_state: generated-draft
summary: Curriculum learning orders training data from easy to hard instead of sampling it uniformly, a schedule that clearly helps in a few specific regimes and whose benefit on ordinary supervised benchmarks is small, inconsistent, and easily confounded.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: requires
    target: concept.learning.supervised_learning
    note: The notion of an example's difficulty is defined through a per-example loss on labelled data, so the supervised training loop is the object a curriculum modifies.
  - type: used_to_solve
    target: concept.optimization.nonconvex_optimization
    note: Bengio et al. cast a curriculum as a continuation method that attacks a non-convex training objective by solving a sequence of smoothed, easier objectives first.
  - type: contrasts_with
    target: concept.learning.continual_learning
    note: Both train on a non-stationary stream, but continual learning has the sequence imposed on it and fights forgetting, while curriculum learning chooses the sequence to speed up one fixed task.
  - type: contributes_to
    target: concept.learning.meta_learning
    note: Automated curricula make the ordering itself the thing being learned, turning "what should the student see next" into an outer optimisation problem over the student's learning progress.
sources:
  - source_id: source.bengio2009.curriculum_learning
    title: Curriculum Learning
    url: https://dl.acm.org/doi/10.1145/1553374.1553380
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.kirkpatrick2017.ewc
    title: Overcoming catastrophic forgetting in neural networks
    url: https://arxiv.org/abs/1612.00796
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: Self-paced learning (Kumar, Packer and Koller, 2010)
    reason: The registry has no entry for the self-paced learning paper, so the objective, the threshold rule and the worked selection example are stated from the method as it is standardly presented rather than from a source this corpus can cite.
    sections:
      - formal-treatment
      - concrete-example
      - variants-and-alternatives
  - label: Controlled empirical evaluations of curriculum learning
    reason: The registry contains no replication or ablation study of curriculum learning, so the claims that gains largely vanish against a tuned baseline and concentrate in short-budget and noisy-label regimes are uncited here.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
  - label: Automated and teacher-student curricula, and curricula in reinforcement learning
    reason: No registry source covers learning-progress bandits, automatic task generation or opponent-strength curricula, so the description of the automated variants rests on no citation.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
claims: []
---

## Definition

**Curriculum learning** is any training scheme in which the examples or tasks a
learner sees are drawn from a deliberately chosen, changing distribution rather
than uniformly from the training set — canonically, easy material first and hard
material later. Bengio, Louradour, Collobert and Weston formalise it as a family
of reweightings of the target training distribution that ends at that
distribution, so the model finishes on the data it will be evaluated against.

A curriculum has two free parts and the method supplies neither. A **difficulty
measure** ranks examples; a **pacing function** says how quickly the harder ones
are admitted. Everything that is empirically interesting about the technique
lives in those two choices, not in the framework that contains them.

## Why it matters

Training a deep network is non-convex optimisation with no guarantee about the
point stochastic gradient descent reaches. The argument in the 2009 paper is that
a curriculum is a **continuation method**: solve an easy, smoothed version of the
objective, then deform it back toward the real one while tracking the solution.
If the easy problem's basin overlaps a good basin of the hard problem, the
optimiser starts the hard phase somewhere better than initialisation would have
put it. Goodfellow, Bengio and Courville present curriculum learning under
exactly this heading, alongside other continuation strategies.

The second reason is budget. Under a fixed number of gradient steps, steps spent
on examples the model cannot yet learn from are wasted, and steps spent on
examples that are cheap as well as easy — short sequences, small images, weak
opponents — cost less wall-clock time. That is a real and measurable saving, and
it is independent of whether final accuracy improves.

What does **not** justify the technique is a reliable accuracy gain on ordinary
supervised benchmarks. The evidence for that is genuinely mixed, and the sections
below say where it holds and where it does not.

## Intuition

The advertised picture is a syllabus: arithmetic before calculus. The analogy is
worth carrying, but it breaks in a way that matters. A human curriculum works
partly because a teacher observes the student and because the student carries
abstractions forward deliberately. A network under SGD has no such mechanism —
all an ordering can do is change which gradients arrive in which order, and SGD
is free to leave any region that early gradients put it in. Nothing in the
procedure protects the structure learned during the easy phase.

The more honest picture is the continuation one: you are not teaching, you are
smoothing. Restricting training to easy examples defines a different, simpler
loss surface; the pacing function slowly turns that surface back into the one you
actually care about. Curricula fail when the simple surface's minimum is not near
any good minimum of the real one, which is why "easy" must mean easy _for this
model on this objective_, not easy for a person to describe.

## Concrete example

Self-paced learning makes the model define its own difficulty. Take eight
training examples whose current per-example losses are

$$
\ell = (0.12,\; 0.35,\; 0.44,\; 0.81,\; 1.02,\; 1.50,\; 2.30,\; 4.70).
$$

Admit example $i$ when $\ell_i < \tau$. At $\tau = 0.5$ the model trains on three
examples; at $\tau = 1.2$ on five; at $\tau = 5.0$ on all eight. Raising $\tau$ on
a schedule is the whole method.

Notice what the last element is doing. A loss of $4.70$ is either the most
informative example in the set or a mislabelled one, and this rule cannot tell
the difference — it simply defers both. That ambiguity is the central weakness of
loss-based difficulty, not an implementation detail.

A predefined curriculum instead fixes the order in advance and moves a cutoff
through it:

```python
def competence(step, total_steps, start=0.2, power=2.0):
    """Fraction of the difficulty-sorted training set visible at `step`."""
    frac = min(1.0, step / total_steps)
    return min(1.0, (start**power + (1.0 - start**power) * frac) ** (1.0 / power))

def pool(sorted_examples, step, total_steps):
    n = max(1, round(competence(step, total_steps) * len(sorted_examples)))
    return sorted_examples[:n]      # sample uniformly from this prefix
```

With 50,000 examples and a 10,000-step schedule, the pool is 10,000 examples at
step 0, about 36,000 at step 5,000, and the full set from step 10,000 on. The
early examples are therefore visited many more times than the late ones — a fact
that is easy to forget and that confounds most naive comparisons.

## Formal treatment

Let $z$ denote an example and $P(z)$ the target training distribution. A
curriculum is a family of distributions indexed by $\lambda \in [0,1]$,

$$
Q_\lambda(z) \;\propto\; W_\lambda(z)\, P(z), \qquad 0 \le W_\lambda(z) \le 1,
$$

subject to three conditions: the entropy $H(Q_\lambda)$ is non-decreasing in
$\lambda$; the weight $W_\lambda(z)$ is non-decreasing in $\lambda$ for every
fixed $z$; and $W_1(z) = 1$ for all $z$, so $Q_1 = P$. Training increases
$\lambda$ from $0$ to $1$ on a schedule. The first two conditions say the
distribution only ever broadens — no example is ever down-weighted as training
proceeds — and the third says the curriculum ends on the real distribution.

Self-paced learning obtains the weights from the model rather than from a fixed
score. With parameters $w$, per-example losses $\ell_i(w)$ and selection
variables $v \in [0,1]^n$,

$$
\min_{w,\, v \in [0,1]^n} \; \sum_{i=1}^{n} v_i\, \ell_i(w) \;-\; \tau \sum_{i=1}^{n} v_i .
$$

For fixed $w$ the coefficient of $v_i$ is $\ell_i(w) - \tau$, so the minimiser is
the hard threshold $v_i = \mathbb{1}[\ell_i(w) < \tau]$; the problem is then
solved by alternating a threshold step with a gradient step on the selected
subset, annealing $\tau$ upward. The objective is biconvex in $(w, v)$ when each
$\ell_i$ is convex in $w$, which is what makes alternating minimisation
well-behaved there; for a deep network it is not convex in $w$ and this is a
heuristic.

No theorem in this literature states that a curriculum lowers the final risk. The
continuation argument is a heuristic about basins of attraction, and the 2009
paper presents it as one.

## Assumptions and requirements

The difficulty measure must correlate with what _this model_ finds hard at _this
stage_. A proxy chosen by human intuition — sentence length, object size — that
turns out to be uncorrelated with the model's loss makes the curriculum a random
reordering with extra machinery.

The easy subproblem's solution must lie near a good solution of the full problem.
Continuation tracks a path; if the path leads somewhere unhelpful, following it
carefully makes things worse, not better.

Standard generalisation theory — the PAC framework in Shalev-Shwartz and
Ben-David — bounds the gap between empirical and true risk under the assumption
that the training sample is drawn i.i.d. from the data distribution. A curriculum
deliberately breaks that assumption during training. The requirement $Q_1 = P$ is
what repairs it: the guarantees apply to the final phase, so a curriculum that
never returns to the full distribution has no theory behind it at all.

Finally, the schedule must leave enough steps after the curriculum ends for the
hard tail to be learned, and loss-based difficulty requires either a reference
model or repeated re-scoring, which is real compute.

## Uses and applicability

Reach for a curriculum when uniform sampling supplies no usable signal at all.
Sparse-reward reinforcement learning, where a randomly initialised policy never
reaches the goal, is the clearest case: some easier task distribution is not an
optimisation refinement but the difference between learning and not learning.
Self-play is the same idea with the curriculum generated automatically, since the
opponent's strength tracks the learner's.

Reach for it when difficulty and cost coincide. Sequence-length, resolution and
context-length schedules are used widely in large-scale training because short
inputs are cheap; the saving is in compute, and it does not depend on the
accuracy question being settled.

It is also reasonable under heavy label noise, where deferring high-loss examples
defers the corrupted ones, and under a hard step budget, where the model will
never reach the hard tail anyway.

Do not reach for it as a default accuracy improvement on a well-tuned supervised
pipeline trained to convergence. That is the setting where controlled comparisons
most often find nothing.

## Limitations and common mistakes

The literature is equivocal and should be described that way. Replication studies
report that easy-to-hard ordering gives little or no gain against a properly
tuned baseline trained to convergence, with benefits concentrating in
short-training and noisy-label regimes — and anti-curricula, hardest first,
sometimes match or beat curricula on the same tasks. Treating curriculum learning
as an established win is the single most common error on this page's subject.

Most reported gains are confounded. Restricting the pool changes the effective
batch composition, the number of times each example is visited, and the effective
scale of the gradient early in training — all of which are separately tunable
knobs. A curriculum run compared against an untouched baseline is a comparison of
two different training schedules, not a test of ordering. Seed variance on
standard benchmarks is often larger than the reported effect, so single-seed
results establish nothing.

Easy-then-hard training is sequential training on a shifting distribution, and
the failure mode of that is catastrophic forgetting: performance on the easy
portion can degrade once the model moves on, which is the phenomenon elastic
weight consolidation was built to counter in the harder task-sequential case. If
the easy examples matter at evaluation time, check them at the end rather than
assuming they are retained.

It is also worth noticing that the most successful example-weighting family in
machine learning runs the other way. Boosting and hard-negative mining up-weight
exactly the examples the current model gets wrong. Both directions cannot be
universal laws, which is evidence that the right ordering depends on the
regime — noise level, budget, and how the difficulty measure was built.

Finally, defining difficulty by the model's own loss is circular: the ranking
changes as the model changes, and a model that is confidently wrong assigns low
loss to exactly the examples it should be corrected on.

## Variants and alternatives

**Predefined curricula** fix a difficulty score externally — human annotation,
a structural proxy, or the loss of a separately trained reference model — and
move a pacing function through the sorted list. They are cheap and reproducible
and depend entirely on whether the score transfers to the model being trained.

**Self-paced learning** derives the weights from the model's own losses, as
above; it buys adaptivity and robustness to mislabelled data, and costs
circularity. Hybrids add a fixed prior to the self-paced threshold so the model
cannot exclude a whole region of the data.

**Automated curricula** treat the choice of the next task as a decision problem,
using a bandit or a policy that maximises some measure of the student's learning
progress. They remove the hand-designed difficulty measure and add an outer
optimisation problem, its own hyperparameters, and a noisy progress signal.

**Anti-curricula** and hard-example mining invert the order; **boosting** is the
classical version. **Continuation methods** in the wider sense smooth the
objective rather than the data — annealing a temperature or a noise level — and
curriculum learning is the data-side instance of that family. The genuinely
different alternative is to leave the data order alone and spend the effort on
the learning-rate schedule, data cleaning, or pretraining on a related task,
which is transfer learning rather than a curriculum.

## History and attribution

The idea has several independent origins. Shaping — rewarding successive
approximations of a target behaviour — is standard in animal training and is
cited in the 2009 paper as the direct antecedent. In neural networks, Elman's
1993 "starting small" experiments showed recurrent networks learning grammatical
structure when input complexity or memory was restricted early, and failing
without that restriction.

The term _curriculum learning_ and the continuation-method formalisation are due
to Bengio, Louradour, Collobert and Weston at ICML 2009, who were motivated by
the difficulty of optimising deep networks in the pre-ReLU, pre-batch-norm era —
a context worth remembering, since several of that era's optimisation problems
were later solved by architecture and initialisation instead. _Deep Learning_
(2016) treats it in the optimisation chapter, as one continuation strategy among
several. Self-paced learning is due to Kumar, Packer and Koller (2010), and
bandit-driven automated curricula appeared around 2017. The systematic
replications that tempered the claims came later, largely between 2019 and 2021.

## Sources

**Curriculum Learning** (Bengio et al., 2009) is the origin of the term and the
place to read the reweighting formalism, the continuation-method argument and the
original vision and language experiments. **Deep Learning** covers curriculum
learning inside its optimisation chapter, which is the right framing for why
anyone expected it to work and how it relates to other continuation strategies.
**Understanding Machine Learning** supplies the i.i.d. sampling assumption that
generalisation bounds rest on and that a curriculum suspends until its final
phase. **Overcoming catastrophic forgetting in neural networks** documents the
forgetting that sequential training on a shifting distribution causes, in the
harder task-sequential setting — the mechanism a long curriculum risks in milder
form.

## Prerequisites and next connections

Understand the ordinary supervised training loop first: a curriculum is a change
to how that loop samples, and nothing else. The optimisation background is the
part that makes the argument legible —
[Nonconvex Optimization](./nonconvex-optimization.md) supplies the picture of
basins of attraction that the continuation argument depends on, and
[Stochastic Optimization](./stochastic-optimization.md) explains why the
distribution a minibatch is drawn from is the object under discussion.

From here, the practical next step is measurement rather than more theory. Any
claim about a curriculum needs multiple seeds and a retuned baseline, so
[Experiment Tracking](./experiment-tracking.md) is what turns this from a plausible
story into a testable one, and [Training Infrastructure](./training-infrastructure.md)
covers the data pipeline that a pacing function has to be implemented inside.
