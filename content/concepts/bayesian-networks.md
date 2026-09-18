---
concept_id: concept.machine_learning.bayesian_networks
title: Bayesian Networks
slug: /concepts/bayesian-networks
aliases:
  - belief networks
kind: concept
tier: 1
review_state: generated-draft
summary: A Bayesian network represents a joint probability distribution by a directed acyclic graph and local conditional distributions, making conditional-independence assumptions explicit.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: Bayesian networks use conditional probability, marginalization, factorization, and conditional independence.
  - type: generalizes
    target: concept.machine_learning.naive_bayes
    note: Naive Bayes is a particular directed network in which the class is a parent of conditionally independent features.
  - type: generalizes
    target: concept.machine_learning.hidden_markov_models
    note: A finite unrolling of an HMM is a Bayesian network with repeated transition and emission factors.
  - type: contrasts_with
    target: concept.machine_learning.conditional_random_fields
    note: Bayesian networks direct and normalize local conditional factors for a joint model, while CRFs directly normalize a conditional distribution over outputs.
sources:
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
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
    checked_on: 2026-09-17
  - source_id: source.pearl.causality
    title: 'Judea Pearl, Causality: Models, Reasoning and Inference'
    url: https://bayes.cs.ucla.edu/BOOK-2K/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary historical sources for Bayesian network terminology and algorithms
    reason: The registered books support the modern theory and a secondary historical account, but the registry does not contain the foundational primary papers needed for precise priority claims.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **Bayesian network** is a directed acyclic graph (DAG) whose vertices are
random variables and whose directed edges specify a factorization of their
joint distribution. Each variable has a conditional probability distribution
given its parents. For variables $X_1,\ldots,X_d$ in a topological order,

$$
p(x_1,\ldots,x_d)=\prod_{i=1}^{d}p(x_i\mid x_{\operatorname{pa}(i)}).
$$

Missing edges encode conditional-independence claims through the graph. The
word “Bayesian” names the probabilistic-network tradition; using a Bayesian
network does not require every parameter to have a Bayesian posterior treatment.

## Why it matters

A full joint table for $d$ binary variables contains $2^d-1$ free parameters.
A sparse graph can replace that table with much smaller local conditionals while
making its assumptions inspectable. Inference then combines those factors to
answer queries about unobserved variables given evidence.

The graphical language separates three questions that are otherwise easily
confused: which independences a model asserts, which numerical distributions
parameterize it, and whether an edge is intended to have causal meaning. That
separation supports diagnosis, missing-data reasoning, probabilistic expert
systems, and causal analysis when stronger causal assumptions are supplied.

## Intuition

Think of a recipe in which each variable is generated after its parents. A
cloudy day influences rain and sprinkler use; rain and sprinkler use influence
whether grass is wet. Once the immediate causes of wet grass are known, earlier
weather information adds no further predictive information about wetness in the
model.

Arrows organize dependence, but they are not automatically causal arrows. A
graph learned from observational associations can encode the same conditional
independences under several edge orientations. Interventions require causal
semantics and assumptions beyond fitting a joint distribution.

## Concrete example

Let $R$ mean rain and $W$ mean wet grass, with graph $R\to W$. Suppose
$P(R=1)=0.2$, $P(W=1\mid R=1)=0.9$, and
$P(W=1\mid R=0)=0.1$. The factorization is $P(R,W)=P(R)P(W\mid R)$, so

$$
P(W=1)=0.2(0.9)+0.8(0.1)=0.26.
$$

Bayes' rule gives

$$
P(R=1\mid W=1)=\frac{0.2(0.9)}{0.26}
=\frac{9}{13}\approx0.692.
$$

Now add an independent root $S$ for sprinkler use and edges
$R\to W\leftarrow S$. The path between $R$ and $S$ is blocked at the collider
$W$, so they are marginally independent. Conditioning on wet grass can make
them dependent: learning that the sprinkler was off increases the plausibility
that rain explains the observed wetness. This “explaining away” pattern is a
graphical consequence, not an extra parameter rule.

## Formal treatment

Every DAG admits a topological ordering and the local Markov property

$$
X_i\perp\!\!\!\perp
\operatorname{NonDescendants}(X_i)
\mid \operatorname{Parents}(X_i).
$$

Under standard probability assumptions, the local property corresponds to the
DAG factorization. **d-separation** is the graphical criterion for deciding
whether sets of variables are conditionally independent in every distribution
that factorizes over the graph. Chains and forks are blocked by conditioning on
their middle variable; a collider is blocked until the collider or one of its
descendants is conditioned on.

Exact inference can eliminate hidden variables by multiplying relevant factors
and summing variables out. Its cost depends on graph structure and elimination
order, commonly characterized through induced width rather than simply the
number of vertices. Approximate methods are needed when exact factor operations
become too large.

## Assumptions and requirements

The graph must be acyclic, every local conditional must be normalized, and its
variables and states must match the application. Claimed missing edges require
defensible conditional independences. Parameter estimation needs appropriate
data coverage; rare parent configurations can leave conditional tables poorly
estimated.

Causal use requires more: arrows must represent a causal data-generating model,
relevant common causes must be handled, and the relationship between observation
and intervention must be explicit. Neither a high likelihood nor a DAG drawn by
software establishes these assumptions. Structure learning also needs a search
criterion and usually cannot orient every edge from observational data alone.

## Uses and applicability

Bayesian networks are useful when domain knowledge provides a sparse dependency
structure, when evidence arrives on arbitrary variables, and when uncertainty
must be propagated through missing or latent information. Applications include
diagnosis, risk analysis, fault localization, decision support, and components
of causal models.

They are less suitable when local conditional tables become enormous, when
cycles are intrinsic to the intended static representation, or when the graph
is chosen mainly for visual appeal. A discriminative model can be more direct
when only one conditional prediction matters.

## Limitations and common mistakes

Exact inference is intractable in many densely connected networks. Sparse
appearance alone does not ensure a cheap elimination order. Conditional-
independence assumptions can be badly wrong, hidden confounding can invalidate
causal interpretations, and several DAGs may be observationally equivalent.

Common mistakes include reading every arrow as causal, treating absence of an
edge as marginal independence rather than the relevant conditional claim,
forgetting that conditioning on a collider can create dependence, reporting
posterior probabilities without the parameter priors or fitted conditionals,
and learning and evaluating a structure on the same data without accounting
for search.

## Variants and alternatives

Discrete conditional tables, linear-Gaussian networks, and generalized local
conditionals trade flexibility against inference and parameter cost. Dynamic
Bayesian networks repeat a template over time; [Hidden Markov Models](./hidden-markov-models.md)
are a particularly simple instance. Markov random fields use undirected factors
and a global normalizer. [Conditional Random Fields](./conditional-random-fields.md)
model outputs given inputs without specifying an input distribution.
[Naive Bayes](./naive-bayes.md) is a small directed network whose strong
factorization makes estimation especially cheap.

## History and attribution

The registered sources document the modern theory and place directed
probabilistic graphs within a broader history of probabilistic and causal
reasoning. They do not provide the set of primary papers needed to settle first
use of every term, factorization, or inference algorithm. This draft therefore
does not make a precise invention claim; the primary-source chronology remains
an explicit unresolved reference.

## Sources

- Murphy's _Probabilistic Machine Learning_ supports DAG factorization,
  conditional independence, d-separation, exact and approximate inference,
  learning considerations, and comparison with other graphical models.
- Pearl's _Causality_ supports the distinction between probabilistic and causal
  graphs, intervention semantics, confounding cautions, and the secondary
  historical framing used here.

## Prerequisites and next connections

Start with [Probability Theory](./probability-theory.md) and
[Bayesian Inference](./bayesian-inference.md). Study
[Naive Bayes](./naive-bayes.md) as a restrictive special case,
[Hidden Markov Models](./hidden-markov-models.md) as a repeated sequential case,
and [Conditional Random Fields](./conditional-random-fields.md) for a
discriminative alternative.
