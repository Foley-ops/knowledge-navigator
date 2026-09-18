---
concept_id: concept.reinforcement_learning.imitation_learning
title: Imitation Learning
slug: /concepts/imitation-learning
aliases:
  - behavioural cloning
  - learning from demonstration
kind: concept
tier: 1
review_state: generated-draft
summary: Learning a control policy from recorded expert behaviour instead of from reward, where the catch is that the learner's own mistakes carry it into states the expert never demonstrated.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The error bound below is stated over an MDP's induced state distribution, horizon and cost-to-go, and none of those objects can be read without the MDP formalism first.
  - type: requires
    target: concept.learning.supervised_learning
    note: Behavioural cloning is literally a supervised classification or regression fit to state-action pairs, so the reader needs the supervised setting before seeing how sequential execution breaks its assumptions.
  - type: contrasts_with
    target: concept.reinforcement_learning.inverse_reinforcement_learning
    note: Both consume the same demonstrations, but inverse RL recovers a reward function and then optimises it, where imitation learning fits the expert's state-to-action map directly.
  - type: contributes_to
    target: concept.reinforcement_learning.rlhf
    note: The supervised fine-tuning stage that precedes reward modelling in an RLHF pipeline is behavioural cloning of human-written demonstrations.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-18
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-18
  - source_id: source.silver2016.alphago
    title: Mastering the game of Go with deep neural networks and tree search
    url: https://www.nature.com/articles/nature16961
    source_kind: primary-research
    supports:
      - concrete-example
      - uses-and-applicability
    checked_on: 2026-09-18
unresolved_references:
  - label: Ross and Bagnell, Efficient Reductions for Imitation Learning (2010); Ross, Gordon and Bagnell, DAgger (2011)
    reason: The quadratic-in-horizon regret bound for behavioural cloning, the example showing it is tight, and the DAgger algorithm with its linear-in-horizon guarantee all come from these two papers. Neither is in the source registry and no registered source states the bounds, so the technical core of this page is written from general knowledge and should be checked against the originals before this page leaves generated-draft.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
  - label: Causal confusion in imitation learning
    reason: The failure mode in which a cloned policy latches onto a nuisance correlate of the expert's action, so that giving the learner more observation than the expert had makes it worse, is documented in the imitation learning literature but is not covered by any registered source.
    sections:
      - limitations-and-common-mistakes
      - assumptions-and-requirements
  - label: Pomerleau, ALVINN (NIPS 1988, published 1989); Pomerleau, Efficient Training of Artificial Neural Networks for Autonomous Navigation (Neural Computation, 1991)
    reason: The split between ALVINN's original training on 1200 simulated road images and the later on-the-fly scheme that imitated a human driver, with each image laterally shifted to synthesise off-centre views, comes from these two papers. Neither is in the source registry, and no registered source distinguishes the two training schemes, so the ALVINN sentence should be checked against the originals.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Imitation learning** is the problem of recovering a control policy from
recorded demonstrations of desired behaviour, without any reward signal. The
input is a dataset of state-action pairs $\mathcal{D} = \{(s_i, a_i)\}$ produced
by an expert; the output is a policy $\hat\pi$ meant to behave like the expert
when it is run.

Its simplest instance is **behavioural cloning**: treat $\mathcal{D}$ as a
supervised dataset, fit $\hat\pi$ by minimising a classification or regression
loss against the expert's action, and stop. What makes this a subject rather than
a corollary of [Supervised Learning](./supervised-learning.md) is that the fitted
policy is then _executed_, and its own outputs decide which inputs it sees next.

## Why it matters

Reward functions are hard to write and demonstrations are often cheap. A driving
reward that trades comfort, progress and safety correctly is a research project;
an hour of recorded driving is an afternoon. And where exploration is dangerous —
a vehicle, a patient, a production system — the interaction reinforcement
learning needs is unavailable while a log of competent behaviour already exists.

Imitation also gives a _dense_ signal: a sparse-reward task provides one bit at
the end of an episode, a demonstration labels every state along the way. Hence
imitation usually initialises a policy that reinforcement learning then improves,
rather than competing with it.

## Intuition

Picture a student who has only ever watched an expert drive down the centre of
the lane, and so has seen no example of a car near the shoulder. A small steering
error now puts the car slightly off centre — a state the training set does not
cover — where the policy's behaviour is unconstrained, so the next error is
_more_ likely, not less. Errors compound rather than average out.

The analogy's limit: many systems are self-correcting, so a small deviation is
pulled back on its own, which is why cloning works far better in practice than
the worst case below suggests. The failure is not a law of the method; it is what
the method offers no protection against.

## Concrete example

Behavioural cloning is short enough to write out completely. Nothing in it knows
about time, transitions or return.

```python
import torch
from torch import nn

d, n_actions, N = 8, 4, 2048
states = torch.randn(N, d)                 # states the expert visited
actions = torch.randint(n_actions, (N,))   # the action the expert took there

policy = nn.Sequential(nn.Linear(d, 64), nn.ReLU(), nn.Linear(64, n_actions))
opt = torch.optim.Adam(policy.parameters(), lr=1e-3)

for _ in range(200):
    loss = nn.functional.cross_entropy(policy(states), actions)
    opt.zero_grad()
    loss.backward()
    opt.step()
```

At scale: AlphaGo's supervised-learning policy network was behavioural cloning of
human play, trained on 30 million positions from the KGS Go Server to predict the
expert's move. It reached 57.0% accuracy on held-out positions (55.7% from the
raw board and move history alone), while a much smaller linear rollout policy
reached 24.2% but ran in 2 microseconds instead of 3 milliseconds. The cloned
policy was a starting point, not an endpoint: a network further trained by
[Policy Gradients](./policy-gradients.md) through self-play won more than 80% of
games against the supervised network it was initialised from.

## Formal treatment

Work in a finite-horizon [Markov Decision Process](./markov-decision-processes.md)
with states $s \in \mathcal{S}$, actions $a \in \mathcal{A}$, horizon $T$ and a
per-step cost $C(s,a) \in [0,1]$ in place of reward. Write $d_\pi^t$ for the
state distribution at step $t$ under $\pi$ and

$$
d_\pi \;=\; \frac{1}{T}\sum_{t=1}^{T} d_\pi^{t}
$$

for the average state distribution it induces, so the quantity to minimise is
$J(\pi) = T\,\mathbb{E}_{s \sim d_\pi}\!\left[C(s,\pi(s))\right]$. Let $\pi^\star$
be the expert and $\ell(s,\pi) = \mathbb{1}[\pi(s) \neq \pi^\star(s)]$ the
$0$–$1$ disagreement loss. Over a policy class $\Pi$, behavioural cloning returns

$$
\hat\pi \;=\; \arg\min_{\pi \in \Pi}\; \mathbb{E}_{s \sim d_{\pi^\star}}\!\left[\ell(s,\pi)\right],
$$

and the mismatch is now visible in the subscripts: the loss is measured under
$d_{\pi^\star}$, while $J(\hat\pi)$ is an expectation under $d_{\hat\pi}$.

**The bound.** If the fitted policy achieves
$\mathbb{E}_{s \sim d_{\pi^\star}}[\ell(s,\hat\pi)] = \epsilon$ and costs lie in
$[0,1]$, then

$$
J(\hat\pi) \;\le\; J(\pi^\star) + T^{2}\epsilon .
$$

The two factors of $T$ have different origins. One counts the opportunities to
deviate: the expected number of disagreements along the horizon is $T\epsilon$.
The other is the price of one deviation: off the expert's distribution there is
no guarantee at all, so a single mistake can cost the entire remaining horizon,
up to $T$. The analysis is not merely loose — there are MDPs and policy classes
for which the gap really is of order $T^2\epsilon$ when $\epsilon \le 1/T$.

Numbers show how weak this is. With $T = 1000$ and $\epsilon = 10^{-3}$ — a
policy agreeing with the expert 99.9% of the time — the bound gives
$T^2\epsilon = 1000$, the maximum cost attainable for costs in $[0,1]$ over 1000
steps. The guarantee is vacuous.

**DAgger** (Dataset Aggregation) removes one factor of $T$ by changing what the
data are. Start with $\hat\pi_1$ cloned from the expert; at iteration $i$, roll
out $\hat\pi_i$, collect the states it actually visits, ask the expert what it
would have done _at those states_, add the new pairs to $\mathcal{D}$, and refit
on the aggregate. Framed as online learning, iteration $i$ presents the loss
$\ell_i(\pi) = \mathbb{E}_{s \sim d_{\hat\pi_i}}[\ell(s,\pi)]$, and a no-regret
algorithm over that sequence yields a policy with
$J(\hat\pi) \le J(\pi^\star) + uT\epsilon_N + O(uT\gamma_N)$, where $\epsilon_N$
is the best loss achievable in hindsight over the aggregated distributions,
$\gamma_N$ the vanishing average regret, and $u$ a bound on how much worse one
wrong action makes the expert's cost-to-go. The horizon dependence is now linear.

The price is in the algorithm itself: DAgger needs an **interactive expert**,
queryable at states the learner reached and the expert would never have visited.
A fixed dataset of demonstrations is not enough.

## Assumptions and requirements

The $T^2\epsilon$ bound assumes a finite horizon $T$, per-step costs bounded in
$[0,1]$, the $0$–$1$ loss, and — the assumption doing the real work — that
$\epsilon$ is measured under the expert's own state distribution. Unbounded costs
break it immediately. DAgger additionally needs a no-regret online learner and a
bounded cost-to-go gap $u$, and without an expert answering queries at
learner-visited states its analysis does not apply at all.

Two structural assumptions matter more in practice. First, the expert's action
must be a function of what the _learner_ observes; if the demonstrator conditions
on information the policy cannot see, cloning fits a different function and the
residual looks like irreducible noise. Second, demonstrations must be consistent:
two experts who avoid an obstacle on opposite sides are each competent, but a
squared-error fit to their average steers into it. Multimodality has to be
carried by the policy class — a mixture, a discretised action space, a generative
head — rather than averaged away.

## Uses and applicability

Reach for imitation learning when a reward is hard to write but the behaviour is
easy to demonstrate, when exploration is unsafe, or when reward is sparse enough
that reinforcement learning alone would never find the first success. Cloning to
initialise and then improving with reinforcement learning is the standard
composition; AlphaGo is its best-documented instance.

Do not reach for it when the goal is to _exceed_ the demonstrator: cloning has no
mechanism for that, because nothing in its objective says the expert was good.
Nor when demonstrations are inconsistent and the loss will average them, or when
the demonstrator saw more than the learner will.

## Limitations and common mistakes

The most common misreading is to treat compounding error as overfitting. It is
not, and more demonstrations do not fix it: they are more samples from
$d_{\pi^\star}$, which is the wrong distribution. Only data from the learner's
own distribution helps — which is why DAgger's interaction requirement is the
substance of the method rather than an implementation detail.

The second is to trust held-out action accuracy. Validation loss on the expert's
states is an open-loop metric whose relationship to closed-loop task performance
is loose in both directions; early-stopping on it optimises the wrong quantity.

The third is causal confusion: because the demonstrator's past actions leave
traces in the state, a cloned policy can learn to read the trace instead of the
cause, so giving the learner a _richer_ observation than the expert had can make
it worse.

Finally, imitation is not automatically safe because training involved no
exploration. The deployed policy explores by accident, precisely where it has no
supervision.

## Variants and alternatives

**DAgger** and its relatives trade expert queries for a better horizon
dependence; variants mix the expert into the rollout policy early so the learner
does not wander uselessly far. **Noise injection and data augmentation**
approximate the same effect without an interactive expert, by perturbing the
demonstrator's state and recording the correction.

**Inverse reinforcement learning** works from the other end, recovering a reward
consistent with the demonstrations and then optimising it. That buys a reward
transferable to new dynamics and, if the demonstrator is modelled as noisily
optimal, the possibility of beating it. It costs well-posedness — many rewards
explain any behaviour, including the constant zero — and an inner loop that
solves the MDP repeatedly.

**Adversarial imitation** matches the learner's state-action occupancy to the
expert's with a discriminator, borrowing the machinery of
[Generative Adversarial Networks](./generative-adversarial-networks.md); it skips
the explicit reward but needs environment interaction and inherits adversarial
instability.

**Offline reinforcement learning** takes the same fixed dataset with reward
labels attached, and can improve on the behaviour that produced it by stitching
together good fragments of different trajectories — which cloning cannot do — at
the cost of a new distribution-shift problem in the value estimates.

## History and attribution

The idea has several independent origins in control and robotics. The best-known
early neural instance is Pomerleau's ALVINN at Carnegie Mellon, a network that
steered the CMU Navlab from camera input. The 1989 version was trained not on
human driving but on simulated road images; it was the 1991 "on-the-fly" scheme
that learned by watching a human driver, and that scheme already contained a
workaround for the central problem, since each camera image was laterally shifted
in software to synthesise views from road positions the driver never occupied,
labelled with the steering correction those positions call for. Through the 1990s
robotics developed the same idea as _learning from
demonstration_ and _programming by demonstration_.

The reward-recovering alternative was posed as inverse reinforcement learning by
Ng and Russell around 2000 and turned into apprenticeship learning by Abbeel and
Ng a few years later. The compounding-error analysis and the DAgger correction
are due to Ross and Bagnell (2010) and Ross, Gordon and Bagnell (2011), who
framed imitation as a reduction to no-regret online learning; adversarial
imitation followed in 2016. Today's largest-scale deployment of cloning is the
supervised fine-tuning of instruction-tuned language models on human-written
responses.

## Sources

_Artificial Intelligence: A Modern Approach_ gives the textbook framing of
imitation, apprenticeship and inverse reinforcement learning and the lineage
between them. _Reinforcement Learning: An Introduction_ supplies the MDP
machinery the bounds above are stated over. The offline reinforcement learning
tutorial covers distributional shift as a general phenomenon and what offline RL
can do that cloning cannot. The AlphaGo paper supplies the numbers for cloning at
scale and for what reinforcement learning added on top.

## Prerequisites and next connections

Read [Supervised Learning](./supervised-learning.md) first — cloning is nothing
more than that, and the surprise only lands once the i.i.d. assumption it rests
on is clear. Then [Markov Decision Processes](./markov-decision-processes.md),
which supplies the horizon, induced state distribution and cost-to-go the error
bound quantifies over.

From here, [Policy Gradients](./policy-gradients.md) is how a cloned policy is
improved once a reward is available, and the composition of the two is the
standard recipe;
[Generative Adversarial Networks](./generative-adversarial-networks.md) explains
the discriminator machinery adversarial imitation reuses.
