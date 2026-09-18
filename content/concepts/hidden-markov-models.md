---
concept_id: concept.machine_learning.hidden_markov_models
title: Hidden Markov Models
slug: /concepts/hidden-markov-models
aliases:
  - HMMs
kind: method
tier: 1
review_state: generated-draft
summary: A hidden Markov model describes a sequence using an unobserved finite-state Markov chain whose current state probabilistically emits each observation.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.stochastic_processes
    note: The latent states form a Markov chain and the observations are random variables conditionally generated from those states.
  - type: requires
    target: concept.probability.probability_theory
    note: Filtering, smoothing, decoding, and learning use conditional probability, marginalization, and likelihood.
  - type: specializes
    target: concept.machine_learning.bayesian_networks
    note: A finite unrolling of an HMM is a directed graphical model with repeated transition and emission structure.
  - type: contrasts_with
    target: concept.machine_learning.conditional_random_fields
    note: An HMM models a joint distribution over observations and labels, while a linear-chain CRF models labels conditional on the observed sequence.
sources:
  - source_id: source.rabiner1989.hidden_markov_models
    title: A Tutorial on Hidden Markov Models and Selected Applications in Speech Recognition
    url: https://ieeexplore.ieee.org/document/18626
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **hidden Markov model** (**HMM**) is a probabilistic model for a sequence in
which an unobserved state $Z_t$ evolves as a first-order Markov chain and each
observation $X_t$ is conditionally independent of the rest given the current
state. A finite-state HMM is specified by an initial distribution, a transition
matrix, and an emission distribution for each state.

“Hidden” means that states are not directly observed, not that they are
unknowable. Inference computes probabilities over them or finds a likely state
path from the observations.

## Why it matters

Sequential observations often have persistent regimes: speech moves through
acoustic units, machines move between operating conditions, and weather moves
between latent patterns. An HMM separates **dynamics**—how regimes change—from
**emissions**—what each regime tends to produce. This permits missing-state
reasoning with a compact repeated parameterization.

The model also makes three distinct tasks precise: evaluate the probability of
an observed sequence, infer hidden states, and learn parameters from sequences.
Dynamic programming solves the first two without enumerating exponentially many
state paths, turning a simple conditional-independence assumption into a major
computational advantage.

## Intuition

Imagine a machine behind a curtain. Each minute it changes internal mode by
rolling a mode-dependent die, then rings a bell drawn from a distribution tied
to the new mode. You hear bells but never see modes. A run of similar bells
suggests persistence in one mode, while an unusual bell creates evidence for a
transition.

The analogy breaks if duration is not geometrically distributed, if today's
mode depends on a long history beyond yesterday's mode, or if an observation
depends directly on several states. A standard HMM can approximate such
behavior by expanding its state space, but the interpretation and parameter
cost change.

## Concrete example

Let hidden weather states be sunny $S$ and rainy $R$, with initial distribution
$P(S)=0.6$, $P(R)=0.4$. Let

$$
A=
\begin{bmatrix}
0.7&0.3\\
0.4&0.6
\end{bmatrix},
$$

where rows are current states and columns are next states. Suppose the
probability of observing an umbrella is $0.2$ in $S$ and $0.9$ in $R$.
After observing an umbrella at time one, the unnormalized state probabilities
are $0.6(0.2)=0.12$ and $0.4(0.9)=0.36$. The observation likelihood is $0.48$,
so the filtered probabilities are $P(S\mid U)=0.25$ and $P(R\mid U)=0.75$.

Before the next observation, prediction gives

$$
P(Z_2=S\mid U)=0.25(0.7)+0.75(0.4)=0.475,
$$

$$
P(Z_2=R\mid U)=0.25(0.3)+0.75(0.6)=0.525.
$$

The calculation shows how emission evidence updates the present state and the
transition model propagates that belief forward.

## Formal treatment

For states $z_{1:T}$ and observations $x_{1:T}$, an HMM factorizes as

$$
p(z_{1:T},x_{1:T})=
p(z_1)\prod_{t=2}^{T}p(z_t\mid z_{t-1})
\prod_{t=1}^{T}p(x_t\mid z_t).
$$

The forward quantity
$\alpha_t(j)=p(x_{1:t},Z_t=j)$ satisfies

$$
\alpha_t(j)=p(x_t\mid Z_t=j)
\sum_i\alpha_{t-1}(i)p(Z_t=j\mid Z_{t-1}=i).
$$

Summing $\alpha_T$ gives the sequence likelihood. The backward recursion
combines future evidence with forward messages for smoothed state marginals.
The Viterbi algorithm replaces sums by maxima and records backpointers to find
the highest-probability complete state path. Baum–Welch is the expectation-
maximization procedure that alternates posterior expected transition/emission
counts with parameter updates.

For $K$ states and sequence length $T$, standard forward and Viterbi recursions
cost $O(TK^2)$ with a dense transition matrix.

## Assumptions and requirements

The standard model assumes first-order, time-homogeneous transitions and
conditional independence of observations given states. State count and emission
families must be chosen, parameters must remain valid probabilities, and the
training data must contain enough transitions and emissions to estimate them.

Long sequences require scaled probabilities or log-space calculations to avoid
numerical underflow. Multiple random starts may be needed because likelihood
training has local optima and state labels are interchangeable. Missing
observations and variable sequence boundaries must be represented explicitly,
not silently treated as ordinary symbols.

## Uses and applicability

HMMs fit discrete regimes with repeated local dynamics: speech recognition,
biological sequence annotation, activity recognition, fault monitoring, and
regime segmentation. They are especially useful when probabilistic filtering,
smoothing, or path decoding is needed and the state space is small enough for
exact dynamic programming.

They are a poor fit when long-range context dominates, state duration needs a
non-geometric model, or high-dimensional emissions cannot be described well by
the chosen distribution. A discriminative sequence model may be preferable
when predicting labels is the only goal.

## Limitations and common mistakes

The Markov and emission-independence assumptions are restrictive. Ordinary
self-transition probabilities imply geometric state durations. Maximum-
likelihood fitting does not reveal a unique semantic state: permutations of
state labels have identical likelihood, and extra states can divide one regime
without acquiring distinct meaning.

Common mistakes include confusing filtered, smoothed, and Viterbi estimates;
multiplying many probabilities outside log space; choosing the best path by
independently maximizing each time marginal; fitting and evaluating on the same
sequences; overlooking sequence boundaries; and interpreting latent state names
causally merely because they are convenient labels.

## Variants and alternatives

Discrete, Gaussian, mixture, and other emission models adapt HMMs to different
observations. Higher-order and hidden semi-Markov models change memory or
duration assumptions, though detailed claims about them require sources beyond
this page. State-space models extend the idea to continuous latent states.
[Conditional Random Fields](./conditional-random-fields.md) model label
sequences conditional on observations and accept overlapping input features.
Recurrent neural networks offer richer learned memory at the cost of different
data, optimization, and interpretability tradeoffs.

## History and attribution

Leonard Rabiner's 1989 tutorial is the registered historical and technical
source used here. It presents the evaluation, decoding, and learning problems,
their dynamic-programming solutions, and the speech-recognition setting, while
crediting the earlier mathematical development within its own historical
account. This draft does not independently restate priority claims beyond that
documented synthesis.

## Sources

- Rabiner's tutorial supports the HMM definition, three canonical problems,
  forward-backward and Viterbi recursions, Baum–Welch training, scaling issues,
  applications, limitations, and historical account.
- Murphy's _Probabilistic Machine Learning_ supports the modern graphical-model
  factorization, message-passing interpretation, inference distinctions, and
  model-comparison cautions.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) and
[Stochastic Processes](./stochastic-processes.md). Continue to
[Bayesian Networks](./bayesian-networks.md) for the broader directed-graph
factorization and [Conditional Random Fields](./conditional-random-fields.md)
for discriminative structured prediction.
