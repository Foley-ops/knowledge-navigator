---
concept_id: concept.reinforcement_learning.offline_reinforcement_learning
title: Offline Reinforcement Learning
slug: /concepts/offline-reinforcement-learning
aliases:
  - batch reinforcement learning
  - offline RL
kind: concept
tier: 1
review_state: generated-draft
summary: Learning a control policy from a fixed, previously collected dataset with no further environment interaction, where the central difficulty is that the learner cannot check the actions it wants to take.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.q_learning
    note: The failure that defines the offline setting is a maximisation inside the Q-learning backup evaluated at actions the dataset never contains, so the update rule has to be in hand before the problem is even visible.
  - type: contrasts_with
    target: concept.reinforcement_learning.imitation_learning
    note: Both consume the same fixed dataset, but imitation learning reproduces the behaviour policy and stays inside its support, while offline RL tries to exceed it, which is exactly what forces it to evaluate unseen actions.
  - type: contrasts_with
    target: concept.reinforcement_learning.sac
    note: SAC is off-policy and trains from a replay buffer, which makes it look applicable to a fixed dataset, yet running it unmodified on one is the standard demonstration of offline divergence because it keeps interacting in the online case and cannot here.
  - type: contrasts_with
    target: concept.reinforcement_learning.rlhf
    note: RLHF fits its reward model on a fixed human dataset but then improves the policy with fresh rollouts scored by that model, so it sidesteps out-of-distribution bootstrapping and inherits reward-model overoptimisation in its place.
sources:
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
  - source_id: source.mnih2015.human_level_control
    title: Human-level control through deep reinforcement learning
    url: https://www.nature.com/articles/nature14236
    source_kind: primary-research
    supports:
      - history-and-attribution
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
  - source_id: source.haarnoja2018.sac
    title: 'Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor'
    url: https://arxiv.org/abs/1801.01290
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-18
unresolved_references:
  - label: In-sample (expectile) offline value learning
    reason: The registry has no source for implicit, in-sample value learning, which postdates the Levine et al. tutorial; the conservative value-penalty family is covered by that tutorial, in its section on conservative Q-learning and pessimistic value functions.
    sections:
      - variants-and-alternatives
      - history-and-attribution
  - label: Decision Transformer and Trajectory Transformer
    reason: No registry source covers return-conditioned sequence modelling of offline trajectories, so the description of that family and of the dispute over whether it can stitch trajectories rests on no citation here.
    sections:
      - variants-and-alternatives
      - history-and-attribution
  - label: D4RL and comparable standardised offline benchmark suites
    reason: The registry lists no offline benchmark, so the claim that scores swing with the behaviour policy that produced each dataset split is uncited.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Offline reinforcement learning** is the problem of producing a good policy for
a Markov decision process from a fixed dataset
$\mathcal{D} = \{(s_i, a_i, r_i, s'_i)\}_{i=1}^{N}$ that was logged earlier by
one or more _behaviour_ policies, with no environment interaction at any point
during learning. The learner may not try an action to see what happens, may not
explore, and may not roll out an intermediate policy to check whether it is
improving. It is the fully data-driven corner of reinforcement learning:
everything it will ever know is already in the file.

The term of art in the 2000s was _batch reinforcement learning_, and the two
names denote the same setting.

## Why it matters

Reinforcement learning has been held back less by its algorithms than by its
appetite for interaction. An agent that must explore cannot be let loose on a
patient, a power grid or a live recommender, and cannot cheaply be let loose on
a physical robot. Yet logs from those systems already exist in quantity, and
offline RL is the attempt to convert them into the pattern that made supervised
learning work: collect once, train many times, reuse across problems. The prize
is access to whole application areas where online exploration is illegal,
dangerous or commercially impossible.

## Intuition

A supervised learner is graded on inputs that look like its training set. An
offline RL agent grades _itself_, on actions it chose, and nothing stops it from
wanting actions it has no data about. Some improvement comes from re-weighting
actions the behaviour policy already took, but an unconstrained maximisation will
reach past them, and those are the actions the dataset cannot referee.

The picture to carry is of a critic that is confidently wrong in exactly the
places the actor is shopping. The critic scores every action, including those it
is extrapolating from nothing; the actor picks the highest score, which selects
for wherever the critic's error is most positive. Online, that is
self-correcting — the agent tries the overrated action, gets a mediocre reward,
and the estimate comes down. That correction is the loop offline RL cuts. The
optimism survives, and bootstrapping spreads it backwards through the dataset.

The analogy to covariate shift in supervised learning is useful but breaks in one
place: here the shift is _caused_ by the learner's own optimisation, and it grows
as training proceeds. It is not a property of a mismatched test set.

## Concrete example

Take a case where the true answer is known: every reward is zero, so every $Q$
value is zero, with $\gamma = 0.99$ and five actions per state, only one of which
appears in the data. A function approximator fit to the logged action generalises
to the four unseen ones as _its fitted value plus some error_; model that error
as standard normal. Each backup maxes over five numbers, four carrying fresh
noise, so the target gains a positive increment —
$\mathbb{E}[\max$ of four standard normals$] \approx 1.03$ — which discounting
then carries into the next backup:

```python
import random
random.seed(0)
gamma, n_ood, n_iters = 0.99, 4, 2000
bias = 0.0  # over-estimation of Q at the logged action; the true value is 0
for _ in range(n_iters):
    ood_max = bias + max(random.gauss(0, 1) for _ in range(n_ood))
    bias = gamma * max(bias, ood_max)
print(round(bias, 1))  # 98.5
```

The estimate settles near $100$, roughly $1.03\,\gamma/(1-\gamma)$, for a
quantity whose true value is $0$. Nothing here is a bug: the regression fits its
targets, the operator is applied correctly, and the error does not average out
because the max is a one-sided selector. This is why offline value estimates
diverge upward by orders of magnitude while the policy they induce performs worse
than the data it was trained on.

## Formal treatment

Write $d^{\pi}(s,a)$ for the discounted state-action occupancy of policy $\pi$,
and let the dataset be drawn from $d^{\pi_\beta}$ for behaviour policy
$\pi_\beta$. Fitted Q iteration solves, at each round $k$,

$$
Q^{k+1} \;=\; \arg\min_{Q \in \mathcal{Q}} \;
\mathbb{E}_{(s,a,r,s') \sim \mathcal{D}}
\Big[\big(Q(s,a) - (r + \gamma \max_{a'} Q^{k}(s',a'))\big)^2\Big].
$$

The Bellman optimality operator is a $\gamma$-contraction in the sup norm over
_all_ of $\mathcal{S}\times\mathcal{A}$, but the regression controls error only
where $\mathcal{D}$ has support, while the inner $\max$ ranges over every $a'$.
That disagreement is the whole subject.

Error propagation is usually bounded through a concentrability coefficient

$$
C^{\pi} \;=\; \sup_{s,a} \frac{d^{\pi}(s,a)}{d^{\pi_\beta}(s,a)},
$$

giving performance-gap bounds of order
$\tfrac{2\gamma}{(1-\gamma)^2}\, C^{\pi} \varepsilon$ for per-iteration Bellman
error $\varepsilon$. When $\pi$ visits a state-action pair that $\pi_\beta$ never
does, $C^{\pi} = \infty$ and the bound says nothing. The two $(1-\gamma)^{-1}$
factors are the horizon cost of compounding: an error made once is re-used at
every subsequent backup.

The remedies are different ways of refusing to trust $Q$ off the data. A
**policy constraint** solves
$\max_{\pi} \mathbb{E}_{s \sim \mathcal{D}}\big[\mathbb{E}_{a\sim\pi}Q(s,a)\big]$
subject to $D(\pi(\cdot|s)\,\|\,\pi_\beta(\cdot|s)) \le \epsilon$, which requires
estimating $\pi_\beta$. **Conservative value estimation** instead penalises the
critic at actions the data does not contain, adding a term like
$\alpha\big(\mathbb{E}_{a \sim \mu}[Q(s,a)] - \mathbb{E}_{a\sim\pi_\beta}[Q(s,a)]\big)$
so that the learned $Q$ lower-bounds the true value and the actor cannot profit
from extrapolation. **Sequence modelling** removes the operator entirely: fit an
autoregressive model of trajectories and sample
$a_t \sim p(a_t \mid s_{\le t}, a_{<t}, \hat{R}_t)$ conditioned on a desired
return $\hat{R}_t$, so nothing is ever maximised over an unseen action.

## Assumptions and requirements

**Support, not sample size.** Every guarantee needs the target policy's
occupancy to be covered by the data. Ten billion transitions from one
deterministic controller still say nothing about any other action.

**Same MDP throughout.** Transitions logged under different dynamics — a
different plant, a different software version, a different hospital protocol —
break the Markov assumption the backup relies on, and pooling them biases the fit
silently.

**Recorded rewards.** The setting presumes $r$ is in the log. Where it is not,
the problem becomes reward inference, not offline control.

**No unobserved confounding.** If the behaviour policy acted on information the
recorded state omits — a clinician's impression, a gauge that is not logged —
then $a$ and $s'$ are correlated through a hidden cause and the Bellman target is
biased in a way no amount of pessimism repairs. This is the assumption most often
violated by real logs and least often checked.

**A genuinely frozen dataset.** Tuning the constraint strength by running the
policy is online interaction, and it changes what the result means.

## Uses and applicability

Reach for offline RL when interaction is the binding constraint and you hold logs
of decisions, outcomes and rewards under a policy that was at least occasionally
doing something other than the obvious: treatment sequencing, dialogue and
recommendation, industrial and energy control, robotics with pooled
demonstrations. It earns its keep when the data is _suboptimal but diverse_,
because an algorithm that reasons about values can then recombine good fragments
of different trajectories into a policy better than any single one in the data.

Do not reach for it when a fast, faithful simulator exists — online methods are
simpler and stronger there — or when the data is uniformly expert, where cloning
is a much cheaper baseline. If the question is "how good is this candidate
policy?", that is off-policy evaluation, a related but distinct problem.

## Limitations and common mistakes

The most common mistake is believing that an off-policy algorithm is already an
offline algorithm. Q-learning's update is off-policy by design, and DQN and SAC
train from a buffer, which makes them look ready; run one on a frozen buffer and
value estimates typically explode while the policy degrades below the behaviour
policy. DQN's buffer is continuously refreshed by the current policy, and that
refresh was the part doing the correcting.

The second is expecting more data to help. Distributional shift here is about
support, not variance, and the deadly-triad diagnosis — function approximation,
bootstrapping and off-policy data together permitting divergence — is a
structural statement, not a small-sample one.

The third is evaluation. Choosing a checkpoint or a constraint coefficient means
estimating the value of a policy that was never run. Importance-sampling
estimators have variance growing exponentially in the horizon, and fitted
evaluation inherits the coverage problem it is supposed to referee. Many
published offline results were tuned using online rollouts, which is not offline
RL; treat any result without a stated model-selection protocol as provisional.

The fourth is reading benchmark tables as rankings of algorithms. Scores depend
heavily on which behaviour policy produced the split: near-expert data flatters
constraint-based and cloning methods, mixed or replay-derived data flatters
value-based methods that can stitch. A method that wins on one split routinely
loses on another from the same environment.

Finally, over-constraining is a real failure, not a safe default. Push the
divergence penalty far enough and the method is an expensive behavioural cloner
that cannot exceed the data by construction.

## Variants and alternatives

**Policy-constraint methods** add an explicit divergence or support constraint
against an estimated behaviour policy, or simply a behavioural-cloning term in
the actor loss: simple and stable, capped by the quality of that estimate.

**Conservative value estimation** penalises the critic rather than the actor,
producing a value lower bound; it removes the need to model $\pi_\beta$ but adds
a penalty weight that is hard to tune without evaluation.

**In-sample methods** never query the critic at an unseen action at all, using
expectile or quantile regression over logged actions only — robust by
construction, since no extrapolated value ever enters a backup, though how much
improvement that forgoes relative to the other families is unsettled.

**Sequence modelling** treats the dataset as text and conditions on a target
return. It avoids bootstrapping entirely and inherits sequence-model scaling, but
whether it can stitch sub-trajectories into a better policy — the main thing
dynamic programming buys — is disputed rather than settled.

**Model-based offline RL** learns the dynamics and plans inside it, penalising by
model uncertainty so synthetic rollouts stay near the data.

The competing approach that is not offline RL at all is imitation: clone the
behaviour policy, or filter to its best trajectories and clone those.

## History and attribution

The setting is older than the name. Batch reinforcement learning was studied
through the 2000s, with fitted Q iteration and neural fitted Q iteration
establishing the pattern of repeated supervised regression onto bootstrapped
targets from a fixed sample. Experience replay, introduced by Long-Ji Lin in the
early 1990s and made standard by DQN, then showed that off-policy learning from
stored transitions worked — while quietly depending on those transitions being
continuously refreshed.

The modern framing dates to around 2019, when the diagnosis sharpened from
"off-policy learning is unstable" to the specific claim that the damage comes
from evaluating the critic at out-of-distribution actions, and that the fix
belongs in the constraint rather than the optimiser. Levine, Kumar, Tucker and
Fu's 2020 tutorial named the area, collected the algorithms and stated the open
problems — most sharply that offline model selection is unsolved. The
conservative and in-sample families and the return-conditioned sequence models
followed over the next two years.

## Sources

The **Levine et al. tutorial** is the reference for the whole area: the problem
statement, the distributional-shift argument, the concentrability-style bounds,
the policy-constraint algorithms and the open problems around evaluation.
**Sutton and Barto** supply the machinery underneath — Bellman operators, the
off-policy setting and the deadly triad, which is the general form of the
divergence this page describes. The **DQN paper** documents the replay buffer and
the online refresh this setting removes. The **Soft Actor-Critic paper** is the
off-policy actor-critic that many offline algorithms modify rather than replace.

## Prerequisites and next connections

Read [Markov Decision Processes](./markov-decision-processes.md) and then
[Q-Learning](./q-learning.md) first; the failure mode here is a specific
malfunction of that update, and it will not be visible without it.
[Temporal Difference Learning](./temporal-difference-learning.md) supplies the
bootstrapping that does the amplifying, and [DQN](./dqn.md) shows the replay
buffer that makes the offline setting look deceptively familiar.

From here, [Actor-Critic](./actor-critic.md) and
[Policy Gradients](./policy-gradients.md) are where the constrained-actor
remedies are implemented, and [Transformers](./transformers.md) are the machinery
behind the return-conditioned sequence-modelling family.
