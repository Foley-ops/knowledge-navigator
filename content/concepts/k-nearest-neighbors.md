---
concept_id: concept.machine_learning.k_nearest_neighbors
title: k-Nearest Neighbors
slug: /concepts/k-nearest-neighbors
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: k-Nearest Neighbors predicts from the labels or responses of the k training points closest to a query under a chosen distance, replacing an explicit fitted model with a local neighborhood rule.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.learning.supervised_learning
    note: The basic classifier and regressor require labeled examples whose responses can be aggregated near a query.
  - type: assumes
    target: concept.machine_learning.bias_variance
    note: The neighborhood size k directly trades the variance of very local fits against the bias of broad averaging.
  - type: contrasts_with
    target: concept.machine_learning.linear_regression
    note: Nearest neighbors makes local predictions without a global functional form, whereas linear regression commits to one affine response surface.
  - type: useful_when
    target: concept.machine_learning.principal_component_analysis
    note: A carefully validated low-dimensional representation can make distances more meaningful and neighbor search cheaper.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
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
unresolved_references:
  - label: Historical priority for nearest-neighbor classification and the k-neighbor extension
    reason: The registered sources provide modern treatments but are not primary historical records, so this draft does not assign priority or dates.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**k-Nearest Neighbors** (k-NN) predicts at a query $x$ using the $k$ training
inputs closest to $x$ under a chosen distance. For regression it usually averages
their responses. For classification it usually chooses their majority class, or
estimates each class probability by its fraction among the neighbors. Training
stores the data; nearly all computation occurs when a query arrives.

The method is local and nonparametric: it does not posit one fixed formula for
the response over the entire feature space. Nevertheless, choosing a metric,
feature representation, scaling rule, and $k$ is substantial modeling work.

## Why it matters

k-NN is the cleanest demonstration that similarity plus labeled examples can be
a predictor. It can approximate curved decision boundaries without specifying
their shape, naturally supports multiclass problems, and provides a strong
baseline when nearby inputs genuinely should have nearby outputs.

It also exposes central machine-learning issues unusually clearly. Increasing
$k$ smooths the fit; irrelevant dimensions corrupt distance; sparse regions make
local estimates unreliable; and prediction cost grows with the stored data.
These are not implementation details but direct consequences of the rule.

## Intuition

Ask the most similar past cases what happened and combine their answers. With
$k=1$, the training set is partitioned into Voronoi cells and each cell inherits
its site's label. With larger $k$, several cells vote, smoothing isolated labels.

The analogy breaks when recorded coordinates do not measure semantic
similarity. Euclidean distance says that a one-unit change in every standardized
coordinate contributes equally in squared distance. If a coordinate is an ID,
an angle wrapped at $360^\circ$, or an unscaled income next to a binary flag,
the nearest numerical case may not be the nearest meaningful case.

## Concrete example

Suppose labeled points are
$A=(0,0)$ red, $B=(1,0)$ red, $C=(0,2)$ blue,
$D=(3,2)$ blue, and the query is $q=(1,1)$. Euclidean distances are

$$
d(q,A)=\sqrt2,\quad d(q,B)=1,\quad d(q,C)=\sqrt2,\quad d(q,D)=\sqrt5.
$$

For $k=1$, $B$ is uniquely closest, so the prediction is red. For $k=3$, the
neighbors are $B,A,C$ and red wins $2$ votes to $1$; the estimated red
probability is $2/3$. An inverse-distance vote with weights
$w_i=1/d(q,x_i)$ gives red weight
$1+1/\sqrt2\approx1.707$ and blue weight $1/\sqrt2\approx0.707$, again red.

Now rescale the second coordinate by $10$. The distances to $A,B,C,D$ become
$\sqrt{101}\approx10.05$, $10$, $\sqrt{101}\approx10.05$, and
$\sqrt{104}\approx10.20$. Almost all separation supplied by the first
coordinate disappears relative to the scaled second coordinate. The example
computes the practical warning: units define neighborhoods unless preprocessing
removes their arbitrary influence.

## Formal treatment

For training data $\{(x_i,y_i)\}_{i=1}^n$ in a metric space $(\mathcal X,d)$,
let $N_k(x)$ be indices of the $k$ smallest values of $d(x,x_i)$, with a fixed
tie rule. The regression estimate is

$$
\hat f_k(x)=\frac1k\sum_{i\in N_k(x)}y_i.
$$

For classes $c\in\{1,\ldots,C\}$,

$$
\hat p(c\mid x)=\frac1k\sum_{i\in N_k(x)}\mathbf1[y_i=c],
\qquad \hat y(x)=\arg\max_c\hat p(c\mid x).
$$

Weighted k-NN replaces $1/k$ with nonnegative weights normalized to sum to one.
Naive exact search costs $O(nd)$ per query for $n$ points in $d$ dimensions and
stores $O(nd)$ values. Spatial indexes can accelerate low-dimensional search,
but their advantage deteriorates as dimension rises.

Small $k$ gives a flexible estimate with low smoothing bias and high sampling
variance. Large $k$ averages noise but can cross class boundaries and erase
local structure. Validation must select $k$ together with the metric and
preprocessing, because changing any one changes the neighbor sets.

## Assumptions and requirements

The core assumption is local regularity: points close under the selected metric
have similar conditional responses. Training and future queries must share that
geometry and distribution. Features need comparable, meaningful scales, and
missing values require a distance rule that does not silently change from pair
to pair.

Useful neighborhoods also require enough local data. In high dimension, the
volume of a small-radius ball is tiny, so a fixed sample becomes sparse and
nearest distances become less distinctive. Dimensionality reduction may help,
but fitting it on all data before cross-validation leaks validation information;
it belongs inside each training fold.

## Uses and applicability

Use k-NN for small or moderate data with a defensible similarity measure, local
decision structure, and cheap enough query-time search. It is valuable as a
baseline, for matching and retrieval-style prediction, and when new training
examples should be incorporated immediately without refitting parameters.

Avoid it when inference latency is strict, storage is constrained, dimensions
are numerous and mostly irrelevant, or the response must extrapolate beyond the
observed sample. A parametric model is often preferable when a stable global
relationship is scientifically meaningful.

## Limitations and common mistakes

k-NN is sensitive to scaling, irrelevant features, duplicates, class imbalance,
and the exact treatment of ties. Accuracy can be dominated by a dense majority
class even near a minority region. Distance-weighting does not fix a bad metric;
it merely makes the closest points under that metric more influential.

Common errors are reporting training error for $k=1$, selecting $k$ after seeing
test performance, standardizing before splitting, and treating neighbor class
fractions as well-calibrated probabilities. Approximate search adds another
trade-off: faster retrieval can change the predictor because missed neighbors
change the vote.

## Variants and alternatives

Radius neighbors use every point within a threshold, allowing neighborhood size
to adapt to density. Weighted k-NN emphasizes closer cases. Metric learning
estimates a task-specific geometry; local linear regression fits a small model
inside each neighborhood instead of a constant. Decision trees also partition
space locally, but learn axis-aligned regions rather than using a fixed metric.

## History and attribution

The registered modern textbooks treat nearest-neighbor rules as foundational
nonparametric methods, but they are not primary historical records. Accordingly,
this draft makes no claim about who first proposed the one-neighbor or k-neighbor
versions or the year of priority; that historical attribution remains unresolved.

## Sources

- _The Elements of Statistical Learning_ supports the neighbor rule, local-
  averaging view, bias-variance behavior, and dimensionality limitations.
- _Probabilistic Machine Learning_ supports the predictive-rule formulation,
  metric choices, and comparison with other nonparametric methods.

## Prerequisites and next connections

Start with [Supervised Learning](./supervised-learning.md) and
[Bias-Variance](./bias-variance.md). Continue to
[Principal Component Analysis](./principal-component-analysis.md) for a possible
low-dimensional representation, while remembering that variance preservation is
not the same as preserving class-relevant neighborhoods. Compare
[Linear Regression](./linear-regression.md) for a global parametric alternative.
