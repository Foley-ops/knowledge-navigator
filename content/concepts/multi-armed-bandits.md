---
concept_id: concept.reinforcement_learning.multi_armed_bandits
title: Multi-Armed Bandits
slug: /concepts/multi-armed-bandits
aliases:
  - k-armed bandit
kind: problem
tier: 1
review_state: generated-draft
summary: The exploration-exploitation problem stripped of state — repeatedly choose among fixed actions with unknown payoffs — where regret is the objective and logarithmic regret is provably the best anyone can do on a fixed instance.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: specializes
    target: concept.reinforcement_learning.markov_decision_processes
    note: 'A bandit is the single-state MDP: actions yield rewards but do not change what situation you face next, so the whole apparatus of transitions, returns and bootstrapping collapses away and only exploration remains.'
  - type: requires
    target: concept.probability.concentration_inequalities
    note: The upper confidence bound is literally an inverted Hoeffding bound, so the width of the exploration bonus and the failure probability it buys cannot be derived without concentration.
  - type: contrasts_with
    target: concept.reinforcement_learning.temporal_difference_learning
    note: TD learning exists to propagate value backwards across transitions, which is exactly the structure a bandit lacks, so a bandit estimator is a plain sample mean with no bootstrapping.
  - type: contributes_to
    target: concept.reinforcement_learning.rlhf
    note: RLHF fine-tuning is usually posed as a one-step contextual bandit — the prompt is the context, the response is the arm, the reward model supplies the payoff, and no transition dynamics are modelled.
sources:
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.vershynin.high_dimensional_probability
    title: Roman Vershynin, High-Dimensional Probability
    url: https://www.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-18
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-18
  - source_id: source.browne2012.mcts_survey
    title: A Survey of Monte Carlo Tree Search Methods
    url: https://ieeexplore.ieee.org/document/6145622
    source_kind: primary-research
    supports:
      - uses-and-applicability
    checked_on: 2026-09-18
unresolved_references:
  - label: Lai and Robbins (1985) asymptotic lower bound, and the finite-time UCB1 analysis of Auer, Cesa-Bianchi and Fischer (2002)
    reason: No registry source states these theorems with their constants; the numerical bounds quoted here are the standard published forms and should be checked against the original papers or a dedicated bandit text before this page leaves generated-draft.
    sections:
      - formal-treatment
      - concrete-example
claims: []
---

## Definition

A **multi-armed bandit** is a sequential decision problem with $K$ actions
("arms"), no state and no transitions. At each round $t = 1, \dots, T$ the learner
picks an arm $A_t \in \{1, \dots, K\}$ and observes a reward $X_t$ drawn from
that arm's fixed but unknown distribution $\nu_{A_t}$ with mean $\mu_{A_t}$. Only
the chosen arm's reward is revealed — this **bandit feedback** is what makes the
problem hard. Performance is measured not by reward but by **regret** against an
oracle that knew the best arm all along:

$$
R_T \;=\; T\mu^{*} - \mathbb{E}\!\left[\sum_{t=1}^{T} X_t\right],
\qquad \mu^{*} = \max_a \mu_a .
$$

## Why it matters

The bandit is the exploration-exploitation trade-off in isolation. In a full
[Markov Decision Process](./markov-decision-processes.md) an agent must estimate
values, propagate them across transitions, and decide what to try; in a bandit
only the last remains, and that isolation is what makes sharp theory possible. We
know, to within constants, how much exploration is necessary and how much is
waste. It is also not a toy: A/B testing, ad selection, clinical trial allocation
and hyperparameter search are bandit problems, and the exploration rule inside
most tabular RL algorithms is a bandit heuristic.

## Intuition

Every pull of a slot machine is both a purchase and a measurement. Pull only the
arm that currently looks best and you may lock onto a bad arm whose first pulls
were lucky; spread pulls evenly and you pay a constant tax forever.

The resolution is **optimism in the face of uncertainty**: rank each arm by the
highest mean still statistically plausible for it rather than by its estimate. An
arm is then tried either because it is good or because you are ignorant about it,
and each pull cures one of those conditions. The gambling analogy breaks in one
place — a real casino is rigged so that no policy has positive expected value,
whereas the bandit problem assumes a genuinely best arm exists and asks only how
fast you can find it.

## Concrete example

Two Bernoulli arms, $\mu_1 = 0.5$ and $\mu_2 = 0.4$, so the gap is
$\Delta = 0.1$. Compare three strategies over a horizon $T$.

**The floor.** The Lai-Robbins bound says no consistent algorithm beats
$\big(\Delta / \mathrm{KL}(\mu_2 \,\|\, \mu_1)\big)\ln T$ asymptotically. Here
$\mathrm{KL}(0.4 \,\|\, 0.5) = 0.4\ln\frac{0.4}{0.5} + 0.6\ln\frac{0.6}{0.5}
\approx 0.0201$, so the constant is $0.1/0.0201 \approx 4.97$ and at $T = 10^4$
($\ln T \approx 9.21$) the floor is about **46**.

**UCB1's guarantee.** The published finite-time bound
$\sum_{a:\Delta_a>0} \frac{8\ln T}{\Delta_a} + (1 + \frac{\pi^2}{3})\sum_a \Delta_a$
gives $\frac{8 \times 9.21}{0.1} + 0.43 \approx$ **737** at $T = 10^4$: the same
$\ln T$ shape with a constant roughly 16× the floor. The bound is loose, and
measured UCB regret sits far below it.

**Fixed $\varepsilon$-greedy.** With $\varepsilon = 0.1$ and two arms the
suboptimal arm is explored with probability $\varepsilon/2 = 0.05$ every round
forever, so regret grows as $0.05 \times 0.1 \times T = 0.005T$: **50** at
$T = 10^4$, competitive with the floor, but **5000** at $T = 10^6$ where the
floor has risen only to about **69**. Constant $\varepsilon$ looks fine on short
horizons and is catastrophic on long ones.

## Formal treatment

Write $N_t(a)$ for the number of pulls of arm $a$ before round $t$ and
$\hat{\mu}_t(a)$ for the sample mean of its rewards. Decomposing regret by arm
gives the identity every bandit proof starts from:

$$
R_T \;=\; \sum_{a=1}^{K} \Delta_a \, \mathbb{E}[N_{T+1}(a)],
\qquad \Delta_a = \mu^{*} - \mu_a .
$$

Bounding regret means bounding how often each suboptimal arm is pulled.

**The lower bound.** Lai and Robbins showed that for any consistent algorithm
(subpolynomial regret on every instance in the class),

$$
\liminf_{T \to \infty} \frac{R_T}{\ln T} \;\ge\;
\sum_{a : \Delta_a > 0} \frac{\Delta_a}{\mathrm{KL}(\nu_a \,\|\, \nu^{*})} .
$$

Logarithmic regret is therefore not a weakness of any particular algorithm but
the price of information, and the KL term says that price scales with how hard
the arms are to _distinguish_, not with how far apart their means are.

**The UCB index.** For rewards in $[0,1]$, Hoeffding's inequality gives
$\Pr[\hat{\mu}_{a} - \mu_a \le -u] \le \exp(-2nu^2)$ after $n$ pulls. Setting
$u = \sqrt{2\ln t / n}$ makes the right side $t^{-4}$, so the index

$$
\mathrm{UCB}_t(a) \;=\; \hat{\mu}_t(a) + \sqrt{\frac{2 \ln t}{N_t(a)}}
$$

is an upper confidence bound failing with probability $O(t^{-4})$ — small enough
that a union bound over all $t$ and $n$ converges. UCB1 plays
$A_t = \arg\max_a \mathrm{UCB}_t(a)$, taking each arm once first so
$N_t(a) \ge 1$. Sutton and Barto write it with a tunable coefficient,
$\hat{\mu}_t(a) + c\sqrt{\ln t / N_t(a)}$, where $c = \sqrt{2}$ recovers UCB1.
The mechanism is visible in the formula: the bonus shrinks as $1/\sqrt{N_t(a)}$
for arms you pull and grows as $\sqrt{\ln t}$ for arms you neglect, so a
neglected arm is always revisited eventually.

**Thompson sampling.** Draw one sample $\theta_a$ from each arm's posterior and
play $\arg\max_a \theta_a$. For Bernoulli arms with a $\mathrm{Beta}(1,1)$ prior,
$s_a$ successes and $f_a$ failures, the posterior is
$\mathrm{Beta}(1 + s_a, 1 + f_a)$ and the algorithm is four lines:

```python
import numpy as np

def thompson(pull, K, T, rng=np.random.default_rng(0)):
    s, f = np.zeros(K), np.zeros(K)          # successes, failures
    for _ in range(T):
        a = int(np.argmax(rng.beta(1 + s, 1 + f)))
        r = pull(a)                          # 0 or 1
        s[a] += r
        f[a] += 1 - r
    return s, f
```

Arms are played in proportion to their posterior probability of being optimal —
exploration with no explicit bonus.

## Assumptions and requirements

The stochastic bandit assumes rewards are **independent across rounds** and
**identically distributed within an arm** — the machine does not change while you
play it. Drop stationarity and the sample mean estimates the past, so UCB and
Thompson sampling converge confidently to a stale answer. This is the most common
way bandits fail in production.

UCB's bonus assumes reward **tails are controlled**: bounded in $[0,1]$, or
sub-Gaussian with a known proxy variance, which is exactly the regime Hoeffding
and its sub-Gaussian generalisation cover. Under heavy tails the concentration
justifying $\sqrt{2\ln t/N}$ fails and the bonus must be rebuilt from a robust
mean estimator.

The lower bound assumes **consistency**, which matters: a rule hard-coding
"always pull arm 1" has zero regret whenever arm 1 is optimal, and the theorem
exists to exclude such instance-tuned policies. Regret is also defined against a
_fixed_ optimal arm; let the comparator change and you are in the adversarial or
tracking setting instead.

## Uses and applicability

Reach for a bandit when actions repeat, feedback is fast and scalar, and your
action does not change the situation you face next: content and ad selection,
online experiment allocation, adaptive dose-finding. Contextual bandits — where
each round supplies a feature vector $x_t$ and the reward depends on $(x_t, a)$,
but successive contexts are drawn independently rather than driven by your
actions — cover recommendation and personalisation, and are the standard framing
for RLHF-style fine-tuning. Bandit indices also appear _inside_ larger
algorithms: UCB1 applied at each node of a search tree is the UCT rule that made
Monte Carlo tree search work.

Do not reach for a bandit when actions have consequences. If your choice changes
what is available later, you need the MDP machinery —
[Q-Learning](./q-learning.md) or [Policy Gradients](./policy-gradients.md).

## Limitations and common mistakes

**Confusing the two regret regimes.** "Logarithmic regret is optimal" and "no
algorithm beats $\Omega(\sqrt{KT})$ in the worst case" are both true. The first
is gap-dependent, with a constant $\propto 1/\Delta$ that explodes as arms become
similar; the second is minimax over all instances, where the hardest gap is
around $\sqrt{K/T}$. Quoting one as if it refuted the other is the standard
error.

**Treating constant $\varepsilon$ as exploration that works.** It gives linear
regret. Decaying schedules such as $\varepsilon_t \propto 1/t$ can achieve
logarithmic regret, but the constant in front of that $1/t$ must be tuned to the
unknown gap — exactly what UCB and Thompson sampling avoid.

**Assuming the guarantees transfer to deep RL.** $\varepsilon$-greedy in
[DQN](./dqn.md) is borrowed from this literature, but no bandit regret bound
survives function approximation and transitions. There they are heuristics, not
theorems.

**Ignoring delay and batching.** The analyses assume the reward arrives before
the next decision. Real systems serve thousands of impressions before a
conversion lands, and a naive UCB then over-explores because $N_t(a)$ lags what
has actually been tried. Note also that regret is measured against an oracle: low
regret where every arm is bad still means bad outcomes.

## Variants and alternatives

**$\varepsilon$-greedy** is the trivial baseline with linear regret at fixed
$\varepsilon$. **Optimistic initialisation** sets initial estimates implausibly
high so every arm is tried early — cheap on stationary problems, but the drive to
explore is transient. **UCB1** and its tighter relatives (UCB-V, using empirical
variance; KL-UCB, replacing the Hoeffding bonus with a KL confidence set and
matching Lai-Robbins exactly) are the frequentist family; **Thompson sampling**
is the Bayesian one, usually strongest empirically and easy to extend to
structured priors. **Gradient bandit algorithms** learn action preferences by
stochastic gradient ascent on expected reward instead of estimating means.
**Gittins indices** solve the Bayesian discounted problem exactly but are awkward
to compute and do not extend to the undiscounted or contextual case. **EXP3**
drops the stochastic assumption for $O(\sqrt{TK\log K})$ regret against an
adversary. **LinUCB** and linear Thompson sampling handle contexts by assuming
$\mu(x, a) = \theta_a^\top x$; **GP-UCB** swaps that linear model for a
[Gaussian Process](./gaussian-processes.md) over continuous actions, the bridge
to Bayesian optimisation. For non-stationary problems, discounted and
sliding-window UCB deliberately forget old data.

## History and attribution

Robbins posed the problem in its modern sequential-design form in 1952, following
questions about the ethics and efficiency of clinical trial allocation. Thompson
had already proposed posterior sampling in 1933 for exactly that application,
deciding between two treatments — one of the oldest algorithms in machine
learning, and one whose asymptotic optimality for Bernoulli arms was not proved
until around 2012. Lai and Robbins established the logarithmic lower bound and
the first asymptotically optimal index policies in 1985; Auer, Cesa-Bianchi and
Fischer gave the finite-time UCB1 analysis in 2002. The "one-armed bandit" name
comes from the slot-machine metaphor and predates the theory.

## Sources

Sutton and Barto's Chapter 2 is the best first pass: it defines the $k$-armed
bandit, gives the UCB index in the tunable-$c$ form, develops
$\varepsilon$-greedy, optimistic initialisation and gradient bandits, and
compares them on a ten-armed testbed. Vershynin supplies the concentration
machinery the confidence bound rests on — Hoeffding's inequality and the
sub-Gaussian framework that says when it generalises. Murphy covers the Bayesian
side and the contextual extension. The Monte Carlo tree search survey documents
how UCB1 became UCT.

## Prerequisites and next connections

Read [Concentration Inequalities](./concentration-inequalities.md) first: UCB is
an inverted Hoeffding bound, and $\sqrt{\ln t / N}$ is unmemorable until you have
seen where it comes from. For Thompson sampling,
[Bayesian Inference](./bayesian-inference.md) supplies the conjugate posterior.

Afterwards, [Markov Decision Processes](./markov-decision-processes.md) adds
exactly the ingredient a bandit omits, which makes clear which difficulties are
about exploration and which are about credit assignment across time.
[Temporal-Difference Learning](./temporal-difference-learning.md) and
[Q-Learning](./q-learning.md) then show what replaces the sample mean once
rewards arrive downstream of the action that earned them.
