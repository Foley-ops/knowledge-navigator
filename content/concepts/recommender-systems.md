---
concept_id: concept.applications.recommender_systems
title: Recommender Systems
slug: /concepts/recommender-systems
aliases:
  - recommendation systems
kind: problem
tier: 1
review_state: generated-draft
summary: A recommender system predicts which items a person will value from their past behaviour and other people's, and because its recommendations shape the very behaviour it later learns from, it is a feedback loop rather than an ordinary prediction problem.
categories:
  - Artificial Intelligence/Domains
primary_category: Artificial Intelligence/Domains
relationships:
  - type: requires
    target: concept.linear_algebra.matrix_decompositions
    note: Matrix factorisation, the central collaborative-filtering method, approximates the sparse user-item matrix by a low-rank product, which is a low-rank decomposition adapted to missing entries.
  - type: contrasts_with
    target: concept.learning.supervised_learning
    note: Supervised learning assumes a fixed distribution of examples, but a recommender decides which items people see and therefore which interactions it gets to learn from, so its training data depends on its own past outputs.
sources:
  - source_id: source.murphy2022.probabilistic_ml_intro
    title: 'Probabilistic Machine Learning: An Introduction'
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
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Industrial recommender literature (the Netflix Prize papers, two-tower retrieval, feedback-loop studies)
    reason: The Netflix Prize winning methods, the retrieval-then-ranking architectures of large deployed systems, and empirical studies of popularity bias and feedback loops are described from the wider literature; the registry holds only Murphy's textbook for this topic.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

A **recommender system** predicts how much a person will value items they have
not yet interacted with — films, products, songs, articles, people — and shows
them the ones predicted to matter most. Its inputs are records of past
interactions, which may be **explicit** (a rating) or **implicit** (a click, a
purchase, a listen), often alongside descriptions of the users and the items.
The output is usually a ranked list, so what matters is ordering the top few
items well rather than predicting every score accurately.

## Why it matters

Catalogues are far larger than anyone can browse, so for many services the
recommender decides most of what people actually see: what to watch, buy, read
and listen to. That makes it commercially central and socially consequential —
it shapes which creators find an audience and what information reaches whom.
It is also a clean example of machine learning deployed inside a loop, where the
model's outputs change the data it will be trained on next.

## Intuition

The core idea, **collaborative filtering**, is that people who agreed in the
past tend to agree in the future: if your ratings resemble someone else's, the
films they liked that you have not seen are good bets. You never need to know
why the films are alike — the pattern of who liked what carries it.

Matrix factorisation makes this precise by describing every user and every item
with a short vector of hidden **factors**. A factor might end up encoding
something like "how much this film is an action film" and, for a user, "how much
they like action films"; a predicted rating is how well the two align. Nobody
names the factors; they are whatever best explains the observed ratings.

## Concrete example

Suppose a model with two factors gives user $u$ the vector $p_u = (0.8, 0.3)$
and item $i$ the vector $q_i = (1.0, -0.5)$, with a global mean rating
$\mu = 3.5$, a user bias $b_u = 0.2$ (this user rates generously) and an item
bias $b_i = -0.3$ (this item is rated low in general). The predicted rating is

$$
\hat r_{ui} = \mu + b_u + b_i + p_u^\top q_i
= 3.5 + 0.2 - 0.3 + (0.8 - 0.15) = 4.05 .
$$

The biases absorb who rates high and what is rated high overall; the factor
product captures the specific match between this user and this item. The model
would rank this item above one whose predicted rating came out at, say, $3.6$.

## Formal treatment

Let $R$ be the users-by-items matrix with entry $r_{ui}$ where user $u$ rated
item $i$, and let $\Omega$ be the set of observed entries — a small fraction of
the matrix. Matrix factorisation fits user vectors $p_u$, item vectors $q_i$ and
biases to the observed entries only, minimising

$$
\sum_{(u,i) \in \Omega} \bigl(r_{ui} - \mu - b_u - b_i - p_u^\top q_i\bigr)^2
+ \lambda \Bigl(\sum_u \lVert p_u \rVert^2 + \sum_i \lVert q_i \rVert^2 + \sum_u b_u^2 + \sum_i b_i^2\Bigr),
$$

by stochastic gradient descent or alternating least squares. The regulariser
matters because with few ratings per user the factors would otherwise overfit.
Unlike the SVD, which needs every entry, this objective is defined on the
observed entries alone.

For implicit feedback, where only positive interactions are seen, the task is
recast as ranking and evaluated with measures such as precision and recall
within the top $k$ items.

## Assumptions and requirements

- **Enough interactions.** Collaborative filtering needs overlapping histories to
  find similar users and items; with too little data it cannot say anything.
- **Missing is not random.** People rate what they chose to consume, so the
  unobserved entries are not a random sample; treating them as if they were
  biases the model toward what is already popular.
- **Implicit signals need interpretation.** A click is not a like, and absence
  of a click is not a dislike.
- **Stable tastes over the training window,** or explicit modelling of how they
  change over time.

## Uses and applicability

Recommenders drive product suggestions in retail, video and music streaming,
news and social feeds, job and dating matching, and advertising. Collaborative
filtering is the right tool when there is abundant interaction data; content-based
methods, which recommend items similar in their features to what a user liked,
help when interaction data is thin. Most deployed systems combine both.

## Limitations and common mistakes

**The cold-start problem.** New users and new items have no history, so pure
collaborative filtering cannot recommend to or recommend them; content features or
popularity have to fill the gap.

**Popularity bias and feedback loops.** Items that are recommended get more
interactions, which makes them look better and get recommended more. The system
can narrow what people see in ways the training loss does not register.

**Offline accuracy is not online value.** Predicting held-out ratings well does
not guarantee better engagement or satisfaction; changes are usually confirmed by
controlled experiments with real users.

**Optimising the wrong thing.** Maximising clicks can favour attention-grabbing
items over ones people would say they value.

## Variants and alternatives

- **Neighbourhood methods** recommend from similar users or similar items,
  simple and easy to explain.
- **Content-based filtering** uses item features and so handles new items.
- **Deep and sequence models** encode users and items with neural networks, and
  model the order of recent interactions.
- **Two-stage systems** retrieve a few hundred candidates cheaply from a very
  large catalogue and then rank them with a more expensive model.

## History and attribution

Collaborative filtering was introduced in the early 1990s for filtering email and
news. The Netflix Prize, launched in 2006, offered a million dollars for a 10%
improvement over Netflix's own rating predictor; it was won in 2009 by a team
whose solution blended many models, and it popularised matrix factorisation for
recommendation.

## Sources

Murphy's probabilistic machine learning text has a chapter on recommender systems
covering explicit and implicit feedback, matrix factorisation with biases and
regularisation, the Netflix Prize, and the cold-start problem, and it is the source
for this page's framing.

## Prerequisites and next connections

Read [Matrix Decompositions](./matrix-decompositions.md) for low-rank
approximation and [Supervised Learning](./supervised-learning.md) for the setup
this problem departs from.

From here, [Embeddings](./embeddings.md) is the general idea of learned vector
representations that item and user factors are an instance of, and
[Multi-Armed Bandits](./multi-armed-bandits.md) is how a recommender can explore
rather than only exploit what it already knows.
