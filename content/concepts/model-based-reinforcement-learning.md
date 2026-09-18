---
concept_id: concept.reinforcement_learning.model_based_reinforcement_learning
title: Model-Based Reinforcement Learning
slug: /concepts/model-based-reinforcement-learning
aliases:
  - MBRL
  - model-based RL
kind: method
tier: 1
review_state: generated-draft
summary: The family of reinforcement learning methods that learn a predictive model of the environment's dynamics and then plan in it or train on its simulated experience, buying sample efficiency at the price of model error that compounds over a rollout.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The object being learned is precisely the MDP's transition kernel and reward function, so there is nothing to call a model until states, actions, transitions and discounting are defined.
  - type: approximates
    target: concept.reinforcement_learning.dynamic_programming
    note: Planning inside a learned model is dynamic programming or forward search run against an estimated transition kernel instead of the true one, which is exactly where its error comes from.
  - type: contrasts_with
    target: concept.reinforcement_learning.sac
    note: A model-free actor-critic such as SAC never represents dynamics and so cannot be misled by model bias, which is the trade the sample-efficiency comparison between the two families turns on.
  - type: used_to_solve
    target: concept.reinforcement_learning.offline_reinforcement_learning
    note: Fitting a model to a fixed dataset and planning in it with an uncertainty penalty is one of the main algorithm families for learning from logged data without further interaction.
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
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.schrittwieser2020.muzero
    title: Mastering Atari, Go, Chess and Shogi by Planning with a Learned Model
    url: https://arxiv.org/abs/1911.08265
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.mnih2015.human_level_control
    title: Human-level control through deep reinforcement learning
    url: https://www.nature.com/articles/nature14236
    source_kind: primary-research
    supports:
      - why-it-matters
    checked_on: 2026-09-18
  - source_id: source.levine2020.offline_rl
    title: 'Offline Reinforcement Learning: Tutorial, Review, and Perspectives on Open Problems'
    url: https://arxiv.org/abs/2005.01643
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
unresolved_references:
  - label: Deep model-based control results and their remedies (Gaussian-process policy search, probabilistic ensembles with trajectory sampling, short branched rollouts, latent-imagination world models)
    reason: The registry has no paper on deep model-based continuous control or on latent world models, so the specific sample-efficiency comparisons and the short-rollout and ensemble fixes are described qualitatively here rather than cited to the papers that established them.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: The simulation lemma and the total-variation compounding bound for model error
    reason: Sutton and Barto do not state the total-variation error-accumulation bound or the simulation lemma, and the registry has no source for either, so the formal treatment gives the argument in full rather than citing the result.
    sections:
      - formal-treatment
claims: []
---

## Definition

**Model-based reinforcement learning** is any approach in which the agent holds
a model of the environment — an estimate $\hat p(s' \mid s, a)$ of the transition
dynamics and $\hat r(s,a)$ of the reward — and uses that model to produce
behaviour, either by _planning_ (searching over imagined action sequences at
decision time) or by _generating simulated transitions_ on which a value function
or policy is trained. Model-free methods such as [Q-Learning](./q-learning.md) or
[Policy Gradients](./policy-gradients.md), by contrast, map experience directly to
a value function or a policy and never represent dynamics. Sutton and Barto draw
the same line as _planning_ versus _learning_, and note that both end in the same
place by the same update rule, differing only in whether the transitions consumed
were experienced or imagined.

## Why it matters

Real transitions are the scarce resource: a robot arm collects samples at the
speed of physics and breaks, and a patient or a factory cannot be reset.
Model-free deep RL is profligate with exactly that resource — the DQN result that
established the field trained on roughly 50 million frames per Atari game, around
38 days of game experience, to reach human-level scores.

A model changes the accounting. Fitting $\hat p$ is ordinary supervised learning
on every transition ever collected, and once fitted it answers queries for free,
so one real step can fund hundreds of updates. The second payoff is reuse:
dynamics are independent of the reward, so a model can be replanned against a new
objective without new data, which no learned value function permits.

## Intuition

The model is a simulator you built from your own experience and can rewind; the
working picture is rehearsal — run the candidate plan forward in your head, keep
the one that looks best, act on its first step.

The analogy breaks in a specific way. The simulator was fit to states you have
actually visited, while the planner searches for whichever action sequence the
model scores highest — so it is drawn to exactly the regions where the model is
over-optimistic, because that is what "highest score" selects for. A learned model
is not a neutral approximation sampled at random points; it is probed by something
that rewards its mistakes.

## Concrete example

Dyna-Q on the standard $6 \times 9$ gridworld maze: one real step, then $n$
updates drawn from a table that memorises what each previously tried
state–action pair did.

```python
import random

WALLS = {(1, 2), (2, 2), (3, 2), (4, 5), (0, 7), (1, 7), (2, 7)}
START, GOAL = (2, 0), (0, 8)
MOVES = [(-1, 0), (1, 0), (0, -1), (0, 1)]

def step(s, a):
    r, c = s[0] + MOVES[a][0], s[1] + MOVES[a][1]
    if not (0 <= r < 6 and 0 <= c < 9) or (r, c) in WALLS:
        r, c = s                      # bump into a wall or the border
    return (r, c), 1.0 if (r, c) == GOAL else 0.0

Q, model = {}, {}                     # Q[(s, a)] -> value; model[(s, a)] -> (r, s')
alpha, gamma, eps, n = 0.1, 0.95, 0.1, 50

def greedy(s):                        # random tie-break: ties must not bias the walk
    best = max(Q.get((s, b), 0.0) for b in range(4))
    return random.choice([b for b in range(4) if Q.get((s, b), 0.0) == best])

def update(s, a, r, s2):
    q = Q.get((s, a), 0.0)
    Q[(s, a)] = q + alpha * (r + gamma * max(Q.get((s2, b), 0.0)
                                             for b in range(4)) - q)

s = START
for t in range(5000):
    a = random.randrange(4) if random.random() < eps else greedy(s)
    s2, r = step(s, a)
    update(s, a, r, s2)               # learn from the real transition
    model[(s, a)] = (r, s2)           # learn the model
    for _ in range(n):                # plan: replay imagined transitions
        (sp, ap), (rp, sp2) = random.choice(list(model.items()))
        update(sp, ap, rp, sp2)
    s = START if s2 == GOAL else s2
```

Setting `n = 0` deletes the model and leaves plain one-step Q-learning. Run both:
the planning agent is within a step or two of the optimal 14-step path by its
third episode, the non-planning agent not until somewhere around its thirtieth —
on identical real transitions. The difference is entirely in how many updates each transition is
made to pay for. Note what the model is here: a lookup table assuming determinism
and a fixed maze. Wall off a corridor mid-run and the agent keeps planning through
it until real experience overwrites that entry.

## Formal treatment

Work in an MDP $(\mathcal S, \mathcal A, p, r, \gamma)$. From a dataset
$\mathcal D = \{(s,a,r,s')\}$ the model is fit by maximum likelihood,

$$
\hat\theta = \arg\max_{\theta} \sum_{(s,a,s') \in \mathcal D} \log \hat p_\theta(s' \mid s, a),
$$

with the reward either given analytically or regressed alongside. Model
predictive control then solves, at each state $s_t$,

$$
a^{\star}_{t:t+H-1} = \arg\max_{a_{t:t+H-1}} \ \mathbb{E}_{\hat p}\!\left[\sum_{k=0}^{H-1} \gamma^{k}\,\hat r(s_{t+k}, a_{t+k}) \;+\; \gamma^{H} \hat V(s_{t+H})\right],
$$

executes only $a^{\star}_t$, observes the true $s_{t+1}$, and re-solves.

The central quantitative fact is how error accumulates with $H$. Write
$D_{\mathrm{TV}}(P,Q) = \sup_A |P(A) - Q(A)|$ and suppose the model is uniformly
accurate at one step, $D_{\mathrm{TV}}(p(\cdot \mid s,a), \hat p(\cdot \mid s,a))
\le \epsilon$ for every $(s,a)$. For a fixed policy the $H$-step trajectory
distributions then satisfy

$$
D_{\mathrm{TV}}\big(P^{\pi}_{H}, \hat P^{\pi}_{H}\big) \le H \epsilon ,
$$

by replacing one step at a time and summing. Since
$|\mathbb E_P f - \mathbb E_{\hat P} f| \le 2 D_{\mathrm{TV}}(P, \hat P)\,\|f\|_\infty$
and an $H$-step undiscounted return is bounded by $H R_{\max}$, the gap in
predicted return is at most $2 H^{2} \epsilon R_{\max}$: **linear in the horizon
for the trajectory distribution, quadratic for the return**. The discounted
version of the same argument, with effective horizon $1/(1-\gamma)$, is the
classical simulation lemma, whose value gap scales as
$O\!\big(\epsilon R_{\max} / (1-\gamma)^{2}\big)$; constants differ with the
normalisation of total variation.

Two distinct consequences follow. Even a uniform $\epsilon$ makes long rollouts
worthless, which is why short horizons and frequent replanning are structural
rather than tuning. And the uniform-$\epsilon$ hypothesis is itself false for a
learned model: error is small where data was dense and unbounded elsewhere, and
the $\arg\max$ above actively selects the elsewhere.

## Assumptions and requirements

The state must be Markov, or the model must carry a latent state that is
approximately Markov; fitting $\hat p(s' \mid s, a)$ to partial observations gives
a model wrong in a way no amount of data fixes. The model class must cover the
dynamics _including their stochasticity_ — a deterministic network trained with
mean-squared error on a bimodal transition predicts the average of two outcomes,
which may be a state that never occurs. Guarantees are distributional: the data
must cover the state–action region the planner reaches, and no bound speaks to
states it does not. The planner must be tractable at control frequency. And the
environment must be stationary over the timescale on which the model is reused;
Sutton and Barto's blocking- and shortcut-maze experiments show how long a
correct-then-stale model goes on misleading the planner — Dyna-Q is slow to route
around a newly blocked path and never finds a newly opened shortcut — and
motivate Dyna-Q+'s bonus for long-untried actions.

## Uses and applicability

Reach for a model when real interaction is expensive, slow or dangerous —
robotics, industrial control, any setting whose sample budget is thousands rather
than billions of steps — when the dynamics are simpler than the value function,
as in physical systems with smooth state, or when the reward will change but the
physics will not. Offline, fitting a model to logged data and planning against a
reward penalised by model uncertainty is one of the standard algorithm families,
treated alongside the model-free ones in Levine et al.'s tutorial.

Do not reach for a _learned_ model when a fast, accurate simulator already
exists: the model is then free and exact, and a model-free learner with massive
parallel rollouts is often the simpler option. Be wary when observations are high-dimensional
and visually rich, where predicting the next frame is harder than predicting the
return — the response being not to abandon models but to learn a latent one, as
MuZero does.

## Limitations and common mistakes

The sample-efficiency advantage is real and consistently reported; the claim that
model-based methods are simply _better_ is not. A biased model caps final
performance, and strong model-free methods trained to convergence frequently
match or exceed model-based ones asymptotically. Which family wins at convergence
is task-dependent and not settled.

The most damaging mistake is to judge a model by its one-step prediction loss.
Low per-step mean-squared error says nothing about the $H$-step trajectory error
the bound above governs, and less still about decision-relevant error: a model can
be accurate almost everywhere and contain one hallucinated high-reward state
sequence, which the planner will find. That is model exploitation, and it is the
mechanism behind most spectacular model-based failures.

Three smaller confusions. "Model-based" does not mean "learned model" — AlphaZero
plans with the given rules of the game, a far easier problem. A model means
_dynamics_: a learned value function is not one, which is why [DQN](./dqn.md) is
model-free despite its large network. And sample efficiency is not compute
efficiency; planning thousands of trajectories per timestep can make a model-based
agent far slower in wall-clock terms than the baseline it beats on samples.

## Variants and alternatives

**Background planning** uses the model between decisions to manufacture updates:
Dyna-Q as above, prioritised sweeping ordering those updates by expected change,
and modern variants branching short imagined rollouts from real replay-buffer
states to keep $H$ small. **Decision-time planning** computes an action on demand:
random shooting and the cross-entropy method sample action sequences and keep the
best, trajectory optimisation differentiates through the model, and Monte Carlo
tree search is the discrete-action equivalent. **Uncertainty-aware models** —
Gaussian-process posteriors or ensembles of probabilistic networks — propagate
epistemic uncertainty so the planner can be pessimistic rather than credulous.
**Latent world models** compress observations, roll out in latent space and train
the policy on imagined trajectories; **value-equivalent models** such as MuZero's
model only the quantities planning consumes. The genuinely different competitor is
model-free RL, paying samples for freedom from model bias.

## History and attribution

Planning with a known model long predates RL: Bellman's dynamic programming in
the 1950s and model predictive control in process industries from the 1970s both
compute actions by optimising over a model, and classical adaptive control had
already paired system identification with control. The reinforcement-learning
contribution proper is Sutton's Dyna architecture, introduced around 1990, whose
insight was that learning, planning and reacting need not be separate systems:
one value function takes the same update rule from real and simulated
transitions, so planning becomes a way of spending compute on data already held.
The deep-RL era added function approximation and latent state, with MuZero (2019)
showing that a model learned for its usefulness to planning rather than its
predictive fidelity could match model-free performance at scale.

## Sources

Sutton and Barto's chapter on planning and learning is the reference for the
definition, for Dyna and prioritised sweeping, and for the stale-model mazes.
MuZero is the clearest published case of planning inside a learned latent model
and of value equivalence. The DQN paper supplies the sample-cost figure. Levine et
al.'s tutorial covers model-based methods on fixed datasets and the
distribution-shift failures they share with model-free ones.

## Prerequisites and next connections

Read [Markov Decision Processes](./markov-decision-processes.md) first — the model
being learned is that object's transition kernel — then
[Dynamic Programming](./dynamic-programming.md), which is planning with an exact
model. [Temporal Difference Learning](./temporal-difference-learning.md) supplies
the update rule Dyna applies to imagined transitions and
[Monte Carlo Methods](./monte-carlo-methods.md) the sampling view of a rollout.

From here, [Q-Learning](./q-learning.md) and [DQN](./dqn.md) are the model-free
baselines the comparison is made against, and
[Gaussian Processes](./gaussian-processes.md) show what an uncertainty-aware
dynamics model provides.
