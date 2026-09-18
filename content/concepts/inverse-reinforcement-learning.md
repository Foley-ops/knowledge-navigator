---
concept_id: concept.reinforcement_learning.inverse_reinforcement_learning
title: Inverse Reinforcement Learning
slug: /concepts/inverse-reinforcement-learning
aliases:
  - inverse optimal control
kind: problem
tier: 1
review_state: generated-draft
summary: The problem of reading a reward function off observed behaviour, which is badly ill-posed — a constant reward explains every policy — so that every method is really a rule for choosing among the many rewards the data allows.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.markov_decision_processes
    note: The problem is literally stated as an MDP with the reward deleted, and the optimality conditions that constrain the reward are the MDP's own Bellman conditions rearranged.
  - type: contrasts_with
    target: concept.reinforcement_learning.imitation_learning
    note: Both start from demonstrations, but imitation learning fits the expert's action mapping directly while IRL insists on the reward behind it, which is slower and only pays off when the reward must transfer.
  - type: contributes_to
    target: concept.reinforcement_learning.rlhf
    note: The reward-model stage of RLHF is reward inference from human data with a Boltzmann-style likelihood, the same machinery IRL developed, applied to comparisons rather than demonstrations.
  - type: equivalent_under
    target: concept.deep_learning.generative_adversarial_networks
    note: Under a max-entropy formulation with a particular convex reward penalty, running RL on the output of IRL reduces to a GAN-style minimax game in which the discriminator separates learner from expert state-action pairs.
sources:
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - assumptions-and-requirements
    checked_on: 2026-09-18
  - source_id: source.amodei2016.concrete_problems
    title: Concrete Problems in AI Safety
    url: https://arxiv.org/abs/1606.06565
    source_kind: preprint
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
  - source_id: source.ouyang2022.instructgpt
    title: Training language models to follow instructions with human feedback
    url: https://arxiv.org/abs/2203.02155
    source_kind: preprint
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
unresolved_references:
  - label: The primary IRL literature (Kalman's inverse optimal control, Ng and Russell, Abbeel and Ng, Ziebart et al., Ramachandran and Amir, Ho and Ermon) and the potential-based shaping theorem
    reason: The registry holds no entry for any of these papers, so the formal statements, the named algorithms and the attributions here rest on the survey treatment in Russell and Norvig rather than on the primary sources.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Inverse reinforcement learning** is the problem of recovering a reward
function from observed behaviour. You are handed everything about a Markov
decision process except the reward — states, actions, dynamics, discount — plus
trajectories from an agent you are willing to treat as behaving well in it, and
must return a reward under which that behaviour is optimal or near-optimal. It
is a problem statement rather than an algorithm: IRL methods differ almost
entirely in which of the many consistent rewards they pick.

## Why it matters

In reinforcement learning the reward is the specification; everything else is
machinery for satisfying it. Writing one down is where most applications fail,
because hand-built proxies get optimised in ways nobody intended — the agent
finds the loophole rather than the behaviour. That is the reward hacking Amodei
et al. list among the concrete safety problems, and the reward-design difficulty
Sutton and Barto treat as central.

Demonstration is usually easier: no one can write the function scoring "drives
like a careful human", but there are millions of recorded trips. A reward is also
more portable than a policy, re-solvable when the car or the actuator changes
where a policy is welded to the dynamics it was trained under — one of the
field's original motivations, and only as good as the identifiability discussed
below.

## Intuition

The picture is revealed preference. Watching choices gives an ordering and little
else: if someone always takes the left fork you learn left beats right, not by
how much. Sequential decisions make this worse — you observe a policy, and one
policy is optimal for a whole cone of rewards, a cone that always contains the
constant reward, under which _every_ policy is optimal. So every IRL algorithm is
a tie-break rule wearing the clothes of an inference, and the assumption each one
smuggles in is the real content of the method.

The analogy breaks in two places. Preferences here are over trajectories rather
than items on a shelf, so one reward has infinitely many rearrangements of credit
across time. And the demonstrator is not assumed exactly rational; the form of
irrationality assumed changes the answer.

## Concrete example

Take a deterministic MDP with a start state $s_0$ and two actions. Action $a$
moves to $s_1$, action $b$ to $s_2$; both are absorbing. Discount
$\gamma = 0.9$. The expert always plays $a$.

Every one of these rewards explains that perfectly: $R(s_1)=1,\,R(s_2)=0$;
$R(s_1)=100,\,R(s_2)=99.9$; $R(s_1)=0.001,\,R(s_2)=0$; and $R(s_1)=R(s_2)=7$,
under which $b$ is equally optimal and the data is still consistent. No amount
of further demonstration of the same policy narrows this.

Feature matching is the standard escape. Let the reward be linear in two
features, fraction of time on road and on grass, with expert feature
expectations $\mu_E = (0.98,\,0.02)$, and find any policy with
$\|\mu_\pi - \mu_E\|_2 \le 0.1$. Then for _any_ $\|w\|_2 \le 1$,

$$
|w^\top \mu_E - w^\top \mu_\pi| \;\le\; \|w\|_2\,\|\mu_E - \mu_\pi\|_2 \;\le\; 0.1 ,
$$

so the learner is within $0.1$ of the expert's value under the true reward,
whatever it is. The ambiguity in $w$ was not resolved; it was made not to matter.

## Formal treatment

Let $M \setminus R = (S, A, P, \gamma)$ be a finite MDP with the reward removed,
$\pi$ the observed policy, $P_\pi \in \mathbb{R}^{|S| \times |S|}$ the matrix
with entries $P(s' \mid s, \pi(s))$, and $P_a$ the same for the constant action
$a$. For a state-only reward vector $R \in \mathbb{R}^{|S|}$ the value is
$V^\pi = (I - \gamma P_\pi)^{-1} R$, and $\pi$ is optimal if and only if

$$
(P_\pi - P_a)\,(I - \gamma P_\pi)^{-1} R \;\succeq\; 0
\qquad \text{for every } a \in A ,
$$

componentwise — Ng and Russell's characterisation. The inequalities are _linear_
in $R$, so the solutions form a polyhedral cone. Put $R = c\mathbf{1}$: since
$P_\pi \mathbf{1} = \mathbf{1}$, $V^\pi = \tfrac{c}{1-\gamma}\mathbf{1}$ and
$(P_\pi - P_a)V^\pi = 0$, so the constant reward lies in the cone for every MDP
and every policy. That is the ill-posedness, exactly. A second degeneracy is
exact rather than permissive: potential-based shaping,
$R'(s,a,s') = R(s,a,s') + \gamma \Phi(s') - \Phi(s)$ for any
$\Phi : S \to \mathbb{R}$, leaves the optimal policy unchanged in every MDP, so
no behavioural observation can distinguish $R$ from $R'$.

**Maximum margin.** With $R_w(s) = w^\top \phi(s)$ and feature expectations
$\mu(\pi) = \mathbb{E}_\pi[\sum_t \gamma^t \phi(s_t)]$, value is linear, and one
solves $\max_{\|w\|_2 \le 1} \min_{\pi \in \Pi} w^\top (\mu_E - \mu_\pi)$: a
quadratic program alternating with a full RL solve.

**Maximum entropy.** Take $p_w(\tau) = \exp(w^\top \phi(\tau)) / Z(w)$, the
maximum-entropy trajectory distribution matching empirical feature counts
$\tilde{\mu}_E$. The log likelihood is concave in $w$ with gradient

$$
\nabla_w \mathcal{L}(w) = \tilde{\mu}_E - \mathbb{E}_{p_w}\!\left[\phi(\tau)\right] ,
$$

so each step computes expected features of the current soft-optimal policy.
Near-ties now appear as nearly equal action probabilities, so the reward's
_cardinal_ scale is partly recovered, not just its ordering.

**Bayesian.** Prior $p(R)$, Boltzmann likelihood
$p(a \mid s, R) \propto \exp(\beta Q^*_R(s,a))$, posterior by MCMC: uncertainty
instead of a point estimate, at one $Q^*_R$ solve per proposal.

**Adversarial.** Occupancy measures turn imitation into distribution matching,
and RL composed with maximum-entropy IRL becomes

$$
\min_\pi \max_D \;\mathbb{E}_\pi[\log D(s,a)] + \mathbb{E}_{\pi_E}[\log(1 - D(s,a))] - \lambda H(\pi) ,
$$

the GAN objective with the discriminator in place of the reward. Skipping the
inner RL solve is what made large continuous-control imitation practical.

## Assumptions and requirements

The demonstrator is assumed optimal, or Boltzmann-rational, for _some_ reward in
your hypothesis class and under the _same_ dynamics you are modelling. Drop
optimality without supplying a noise model and the inequalities above leave no
room for a mistake: every demonstrated action has to come out exactly optimal,
so demonstrations that conflict at one state can be satisfied only by a reward
that makes those actions tie. Classical IRL also needs the transition model $P$,
since scoring a candidate reward means solving the forward problem under it;
without $P$ you need sampling-based or adversarial variants and pay in
interaction.

The reward must be expressible in the features you supplied, and the state must
contain what the expert was responding to. If the expert cares about something
you did not encode, the fit attributes the behaviour to whatever correlates with
it — and an expert who knows something the learner's state omits simply looks
irrational, which the algorithm records as a preference.

Identifiability needs structure beyond one optimal policy in one environment:
demonstrations across differing dynamics, or a noise model whose magnitude
reveals value differences, are what recover a reward beyond shaping and scale.

## Uses and applicability

Reach for IRL when the reward is hard to write but behaviour is easy to produce,
and when you need the reward rather than a copy of the policy — because the
dynamics or the embodiment will change, or because you want to inspect what is
being optimised. Route prediction from driver traces, manipulation from
teleoperated demonstrations, helicopter aerobatics, and models of animal and
pedestrian behaviour are the recurring applications. The same inference appears
in other costume wherever a reward model is fit to human judgements, as in the
reward-model stage of InstructGPT-style training.

Do not reach for it when you already have a workable reward, when you only need
to reproduce behaviour in the environment you saw it in (behaviour cloning is
cheaper and usually better), or when demonstrations are few relative to the
reward class, where the tie-break rule rather than the data decides.

## Limitations and common mistakes

The first mistake is believing IRL recovers _the_ reward. It recovers one
consistent with the behaviour under your rationality assumption: reward and
planner are jointly unidentifiable, since any behaviour is either a perfect
optimiser of a strange reward or a flawed optimiser of a plain one.

The second is missing how much work the regulariser does — the constant reward
always fits, so degeneracy is excluded by hand, and that exclusion is a prior
about what rewards look like. The third is cost: classical IRL puts a full RL
solve inside the learning loop, which together with its demand for a transition
model is why the adversarial and sampling-based variants exist.

The fourth is confusing adversarial imitation with IRL proper. A GAIL
discriminator imitates well but is not a transferable reward: it separates two
distributions and degenerates as the learner matches the expert. More generally,
shaping is the harmless part of the ambiguity — it leaves the optimal policy
alone whatever the dynamics — but two rewards in the cone that differ by more
than shaping and scale can disagree about the optimal policy once the dynamics
change, so a reward that imitates perfectly where it was fit may fail where you
wanted it.

Finally, IRL is not RLHF: RLHF fits a reward to pairwise comparisons of a model's
own samples, IRL infers one from demonstrations assumed near-optimal, and the
shared structure is only the Boltzmann-style likelihood over choices. An RLHF
reward is just as gameable, hence the KL penalty it comes with.

## Variants and alternatives

Named variants: **linear-programming IRL** (the original, exact on small finite
MDPs, degenerate without a margin term); **apprenticeship learning** and
**maximum margin planning** (feature matching with the guarantee shown above,
committed to linear rewards); **maximum-entropy IRL** and its deep and
sample-based descendants (a real probabilistic model and cardinal
identification, at the cost of a partition function that must be approximated);
**Bayesian IRL** (uncertainty quantified, computationally brutal);
**adversarial imitation** (fast and scalable, no reusable reward); and
**adversarial IRL**, which adds structure specifically to make the recovered
reward transferable.

Different approaches entirely: behaviour cloning, supervised learning on
state-action pairs that needs no dynamics but compounds error off the
demonstrated distribution; interactive imitation, which queries the expert on the
learner's own states to fix that; preference-based reward learning, which needs
no teacher able to perform the task; and hand-engineering the reward, still the
right answer more often than the literature suggests.

## History and attribution

The inverse question predates reinforcement learning: Kalman posed the inverse
problem of optimal control in the early 1960s, asking which cost functions make
a given linear control law optimal. Russell framed it for AI in 1998, and Ng and
Russell gave the first algorithms in 2000, including the characterisation above
and the observation that degenerate solutions must be excluded explicitly.
Abbeel and Ng introduced apprenticeship learning by feature matching in 2004,
Ramachandran and Amir the Bayesian treatment in 2007. Ziebart and colleagues
introduced maximum-entropy IRL in 2008 while predicting Pittsburgh taxi routes,
a setting where demonstrations are plainly noisy and a model assigning
probability to suboptimal behaviour is not optional. Ho and Ermon connected the
picture to generative adversarial networks in 2016.

## Sources

Russell and Norvig is the general reference: the problem statement, the
non-uniqueness of the reward, the apprenticeship and maximum-entropy families,
and the attributions. Sutton and Barto supplies the MDP machinery the formal
section rearranges and the account of why reward design is hard. Amodei et al.
is the source for reward hacking; Ouyang et al. shows what an industrial learned
reward model looks like and anchors the RLHF comparison. The primary IRL papers
are not in the registry; that gap is in `unresolved_references`.

## Prerequisites and next connections

Read [Markov Decision Processes](./markov-decision-processes.md) first; without
the Bellman optimality conditions the inequality defining the solution cone is
unreadable. [Dynamic Programming](./dynamic-programming.md) and
[Q-Learning](./q-learning.md) are the forward solve inside every classical IRL
loop, and its expense explains most of the field's design choices.

From here, [Policy Gradients](./policy-gradients.md) optimises the learner once a
reward or discriminator is in hand,
[Generative Adversarial Networks](./generative-adversarial-networks.md) is the
objective the adversarial formulation borrows wholesale, and
[Bayesian Inference](./bayesian-inference.md) is what the Bayesian resolution
applies to a posterior over rewards.
