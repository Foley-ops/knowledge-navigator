---
concept_id: concept.machine_learning.decision_trees
title: Decision Trees
slug: /concepts/decision-trees
aliases:
  - CART
  - recursive partitioning
kind: method
tier: 1
review_state: generated-draft
summary: A decision tree predicts by routing an input through single-feature tests to a leaf holding a constant, carving the feature space into axis-aligned boxes chosen greedily because finding the best tree is NP-hard.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: prerequisite_of
    target: concept.machine_learning.random_forests
    note: A random forest is an average of many decision trees, so its construction and its variance-reduction argument are unreadable without knowing how a single tree is grown.
  - type: contrasts_with
    target: concept.machine_learning.logistic_regression
    note: Both are standard classifiers for tabular data, but a tree fits a piecewise-constant function on boxes with no global form, where logistic regression fits one global linear logit.
  - type: contributes_to
    target: concept.machine_learning.bias_variance
    note: A fully grown tree is the textbook low-bias, high-variance predictor, and its depth is an unusually direct knob on that trade-off.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
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
    checked_on: 2026-09-17
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.breiman2001.random_forests
    title: Random Forests
    url: https://link.springer.com/article/10.1023/A:1010933404324
    source_kind: primary-research
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.chen2016.xgboost
    title: 'XGBoost: A Scalable Tree Boosting System'
    url: https://arxiv.org/abs/1603.02754
    source_kind: preprint
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Morgan and Sonquist's AID (1963) and the pre-CART lineage of automatic interaction detection
    reason: No source in the registry covers the statistical prehistory of recursive partitioning; the attribution here is stated from general knowledge and should be checked against the original before the page leaves draft state.
    sections:
      - history-and-attribution
  - label: Strobl et al. on the bias of impurity-based variable importance toward high-cardinality and continuous predictors
    reason: The registry has sources for the split-selection bias itself and for permutation importance, but none that studies the importance measure's bias directly.
    sections:
      - limitations-and-common-mistakes
  - label: Mixed-integer-programming and dynamic-programming solvers for provably optimal decision trees
    reason: This is an active line of work from roughly 2017 onward and no registry source covers it, so it is described here without named papers.
    sections:
      - variants-and-alternatives
claims: []
---

## Definition

A **decision tree** is a predictor built from a rooted tree whose internal nodes
each test a single feature — $x_j \le t$ for a numeric feature, $x_j \in S$ for a
categorical one — and whose leaves each carry a constant: a class label or a
vector of class probabilities for classification, a real number for regression.
Prediction routes an input from the root to exactly one leaf and returns that
leaf's constant. A tree is therefore a piecewise-constant function whose pieces
are axis-aligned boxes tiling the feature space, and **learning** one means
choosing the boxes. Every algorithm in practical use chooses them greedily by
**recursive partitioning**: at each node, score every candidate split by how much
it reduces an impurity measure of the children, take the best, recurse.

## Why it matters

Trees are the default answer to a specific, common situation: heterogeneous
tabular data, with numeric and categorical columns on incomparable scales,
missing values, outliers, and interactions nobody wants to specify by hand. A
tree is invariant to any monotone rescaling of an individual feature, so log-
versus-raw makes no difference to it; it needs no standardisation, no dummy
coding, no interaction terms. Interactions come free, because every split below a
node is conditional on the splits above it.

Trees also matter because they are the wrong answer in an instructive way. A
single tree is unstable — small changes to the data change the tree — and it is
precisely that instability that bagging, random forests and gradient boosting
convert into accuracy. The tree is the component that makes the tabular
ensembles work.

## Intuition

Twenty questions, asked with a fixed budget and no chance to revise. Each
question splits the remaining cases into two groups, and a good question is one
that makes the two groups more homogeneous in the label than the group you
started with.

The analogy breaks in two places worth naming. First, the questions are chosen
greedily with no lookahead: a split that looks mediocre now but sets up two
excellent splits below it will lose to a split that looks good now and leads
nowhere. Second, a tree can only cut perpendicular to an axis, so a boundary like
$x_1 + x_2 = 1$ is approximated by a staircase — many splits to express something
a single linear model writes down in one line.

## Concrete example

Ten loan applicants, with income in thousands, an employment flag, and whether
they defaulted:

| income | employed | default |     | income | employed | default |
|--------|----------|---------|-----|--------|----------|---------|
| 22     | 0        | 1       |     | 62     | 1        | 1       |
| 31     | 0        | 1       |     | 70     | 1        | 0       |
| 38     | 1        | 1       |     | 85     | 1        | 0       |
| 40     | 1        | 0       |     | 95     | 1        | 0       |
| 55     | 0        | 0       |     | 120    | 1        | 0       |

The root holds 4 defaults out of 10, so its Gini impurity is
$1 - (0.4^2 + 0.6^2) = 0.48$ and its entropy is
$-0.4\log_2 0.4 - 0.6\log_2 0.6 = 0.971$ bits.

Consider the numeric split at the midpoint $47.5$, which CART would evaluate
because it lies between two consecutive distinct income values. The left child
holds the four applicants with income $\le 47.5$, three of whom defaulted:
Gini $= 1 - (0.75^2 + 0.25^2) = 0.375$. The right child holds six, one of whom
defaulted: Gini $= 1 - ((1/6)^2 + (5/6)^2) = 0.278$. The weighted child impurity
is $0.4(0.375) + 0.6(0.278) = 0.317$, a decrease of $\mathbf{0.163}$.

Now the employment split. Three applicants are unemployed, two of whom defaulted
(Gini $0.444$); seven are employed, two of whom defaulted (Gini $0.408$). The
weighted impurity is $0.3(0.444) + 0.7(0.408) = 0.419$, a decrease of
$\mathbf{0.061}$. Income wins, and entropy agrees — its gains are $0.256$ bits
against $0.091$ bits. The two criteria disagree only rarely and never
dramatically.

```python
from collections import Counter

def gini(labels):
    n = len(labels)
    return 1.0 - sum((count / n) ** 2 for count in Counter(labels).values())

def weighted_child_gini(rows, feature, threshold):
    left = [y for x, y in rows if x[feature] <= threshold]
    right = [y for x, y in rows if x[feature] > threshold]
    n = len(rows)
    return (len(left) * gini(left) + len(right) * gini(right)) / n

# ((income, employed), defaulted)
rows = [((22, 0), 1), ((31, 0), 1), ((38, 1), 1), ((40, 1), 0), ((55, 0), 0),
        ((62, 1), 1), ((70, 1), 0), ((85, 1), 0), ((95, 1), 0), ((120, 1), 0)]

parent = gini([y for _, y in rows])
print(parent)                                       # 0.48
print(parent - weighted_child_gini(rows, 0, 47.5))  # 0.1633...  income
print(parent - weighted_child_gini(rows, 1, 0))     # 0.0609...  employment
```

## Formal treatment

Let the training set be $S = \{(x_i, y_i)\}_{i=1}^{n}$ with $x_i \in
\mathbb{R}^d$. A tree $T$ with leaves $R_1, \dots, R_{|T|}$ partitions
$\mathbb{R}^d$ and represents

$$
f(x) = \sum_{m=1}^{|T|} c_m \, \mathbf{1}[x \in R_m].
$$

Write $N_m$ for the number of training points in $R_m$ and, for classification
with $K$ classes, $\hat p_{mk} = N_m^{-1} \sum_{x_i \in R_m} \mathbf{1}[y_i = k]$.
Under squared loss the optimal leaf constant is the mean of the $y_i$ in $R_m$;
under 0–1 loss it is the majority class.

The three standard node impurities $Q_m(T)$ are

$$
\text{misclassification: } 1 - \max_k \hat p_{mk}, \qquad
\text{Gini: } \sum_{k} \hat p_{mk}(1 - \hat p_{mk}) = 1 - \sum_k \hat p_{mk}^2,
$$

$$
\text{entropy: } -\sum_{k} \hat p_{mk} \log_2 \hat p_{mk}.
$$

A split of a node holding $N$ points into children of sizes $N_L, N_R$ is scored
by the weighted impurity decrease

$$
\Delta = Q(\text{parent}) - \frac{N_L}{N} Q(L) - \frac{N_R}{N} Q(R),
$$

which is non-negative for any concave $Q$ by Jensen's inequality. Gini and
entropy are *strictly* concave; misclassification error is concave but piecewise
linear, and this matters. In Hastie, Tibshirani and Friedman's example, a
400/400 node split into $(300,100)$ and $(100,300)$ and the same node split into
$(200,400)$ and $(200,0)$ both leave 200 errors, so misclassification error
cannot tell them apart — but the second produces a pure leaf, and Gini prefers it
($0.333$ against $0.375$). Misclassification error is used for pruning, not for
growing.

Searching splits is cheap. Sort each feature once, sweep the sorted order
maintaining running class counts, and every threshold for that feature is scored
in $O(N)$; a node costs $O(dN)$ after the initial $O(dn\log n)$ sort.

Growing to purity overfits, so CART grows a large tree $T_0$ and prunes it by
**cost-complexity**: for $\alpha \ge 0$ define

$$
C_\alpha(T) = \sum_{m=1}^{|T|} N_m Q_m(T) + \alpha |T|,
$$

and minimise over subtrees of $T_0$ obtained by collapsing internal nodes.
Weakest-link pruning produces a finite nested sequence of subtrees containing the
minimiser for every $\alpha$, and $\alpha$ is chosen by cross-validation. The
greedy growth is a heuristic and known to be one: finding the smallest tree
consistent with a training set is NP-hard, a result Hyafil and Rivest established
in 1976, so no practical algorithm searches the space of trees directly.

## Assumptions and requirements

Trees assume nothing about the distribution of $x$ — no linearity, no
homoscedasticity, no normality. What they do assume is structural.

*The target must be well approximated by axis-aligned boxes.* A smooth or
additive function is representable only as a staircase, so a tree wastes depth on
geometry a linear term would capture exactly.

*Some single feature must look informative at each node.* Greedy growth needs
marginal signal. Pure XOR on two balanced binary features is the clean
counterexample: neither feature alone changes the impurity at all, so $\Delta = 0$
for every root split and the greedy criterion has nothing to prefer, even though a
depth-2 tree fits the data exactly.

*Leaves must hold enough data.* The leaf constant is an average over $N_m$
points, and its variance scales like $1/N_m$; a leaf of size 1 is a memorised
label.

*The prediction is bounded by the training labels.* A tree cannot extrapolate: a
regression tree predicts the same constant for $x = 10^{6}$ as for the largest
training point in that leaf.

*Cross-validated pruning assumes exchangeable data.* With time series or grouped
records, ordinary $k$-fold cross-validation leaks and selects $\alpha$ too small.

## Uses and applicability

Reach for a tree when the data is tabular and heterogeneous, when someone must be
able to read the decision rule, when inference must be very fast (a prediction is
a handful of comparisons), or when you want a quick, assumption-light baseline
before committing to a model family. Trees are also the standard base learner
inside the gradient-boosting libraries that still win most tabular competitions —
the XGBoost paper reports it was used in the majority of the winning solutions
published on Kaggle in 2015.

Do not reach for a single tree when the signal is smooth or close to linear, when
you need calibrated probabilities from few samples, when extrapolation matters,
or when the input is raw pixels, audio or text, where the axis-aligned boxes
correspond to nothing meaningful. And if you only want accuracy on tabular data,
use an ensemble of trees rather than a tree.

## Limitations and common mistakes

**Greedy is not optimal, and the gap is not a technicality.** Because optimal
tree construction is NP-hard, every standard implementation is a heuristic with
no approximation guarantee. A tree can be arbitrarily worse than the best tree of
the same size.

**Instability.** Resample the data slightly and the root split can change,
rewriting everything below it; the hierarchical structure propagates an early
error all the way down. Practitioners misread this as the tree "finding the real
structure" when it has found one of several nearly tied splits. This variance is
what bagging and random forests were built to average away.

**Impurity-based feature importance is biased.** Summed impurity decrease favours
features with many possible split points — continuous features and
high-cardinality categoricals — because more candidate thresholds means more
chances to fit noise. Hastie and colleagues note the same mechanism for
categorical predictors with many levels, where the number of candidate
partitions grows exponentially in the number of levels. Permutation importance,
introduced with random forests, avoids this particular bias, though it has
trouble of its own with correlated features.

**Zero training error means nothing.** A tree grown to purity interpolates the
training set whenever no two points share a feature vector with different labels.
Judge trees by cross-validated error and by size.

**Early stopping is weaker than pruning.** Halting when no split improves the
criterion is exactly the lookahead failure described above. Grow large, then
prune.

**"Interpretable" has a size limit.** A depth-3 tree is readable; a depth-20 tree
with thousands of leaves is not, and among correlated features the one that
appears in the tree is close to arbitrary.

## Variants and alternatives

**CART** uses binary splits, Gini for classification, squared error for
regression, and cost-complexity pruning; it is what scikit-learn implements.
**ID3** and its successor **C4.5** use information gain, allow multiway splits on
categorical features, and introduce the **gain ratio**, which divides gain by the
split's own entropy specifically to counteract the pull toward high-cardinality
features. **Conditional inference trees** select splits by a statistical test
rather than by impurity, buying unbiased variable selection at the cost of
speed. **Oblique trees** split on linear combinations of features, fixing the
staircase problem and destroying the readability. **Model trees** put a linear
model rather than a constant in each leaf. A more recent line of work uses
mixed-integer programming or dynamic programming to find provably optimal trees,
which is tractable only for small depth and modest feature counts.

The genuinely different alternatives are ensembles and non-tree models.
**Bagging** and **random forests** average many trees fitted to perturbed data,
trading interpretability for a large variance reduction. **Gradient boosting**
fits shallow trees sequentially to residuals, usually beating a forest at the
price of more tuning. Away from trees, a linear or logistic model buys smoothness
and extrapolation, generalised additive models buy smoothness with
interpretability, and $k$-nearest neighbours gives a different piecewise-constant
fit whose regions are data-driven rather than axis-aligned.

## History and attribution

Recursive partitioning has at least two independent origins. In statistics, the
AID program of Morgan and Sonquist (1963) split survey data recursively to detect
interactions in social-science data — a regression-tree idea long before the
name. In artificial intelligence, Quinlan's ID3 (1986) and later C4.5 grew trees
from examples with an information-gain criterion, in the context of learning
classification rules from data.

The modern formulation is *Classification and Regression Trees* by Breiman,
Friedman, Olshen and Stone (1984), which gave the binary-split construction,
Gini, the squared-error regression tree, cost-complexity pruning and surrogate
splits for missing values. Hyafil and Rivest had already shown in 1976 that
constructing an optimal binary decision tree is NP-complete, which is why the
book's algorithm is avowedly greedy. Breiman then spent the following decade on
the consequence of tree instability: bagging in 1996 and random forests in 2001.

## Sources

*The Elements of Statistical Learning* is the reference for the construction
itself — the impurity measures, the misclassification-error example, the
cost-complexity pruning sequence, and the frank section on instability, lack of
smoothness and the bias toward many-level categorical predictors.
*Understanding Machine Learning* gives the learning-theoretic view: trees as a
hypothesis class, the NP-hardness of finding a minimal consistent tree, and a
description-length argument for why smaller trees generalise better. Breiman's
*Random Forests* is where tree instability becomes a resource rather than a
defect, and where permutation importance is introduced. The *XGBoost* paper
documents both the engineering of large-scale tree boosting and the empirical
standing of tree ensembles on tabular problems.

## Prerequisites and next connections

You need very little to start: the idea of a supervised training set, and enough
probability to read $\hat p_{mk}$ as an empirical frequency, which
[Probability Theory](./probability-theory.md) covers. To take the NP-hardness
claim seriously rather than on trust, read
[Computational Complexity](./computational-complexity.md); for the cost of split
search, [Complexity Analysis](./complexity-analysis.md).

Trees open onto three directions. The ensembles — bagging, random forests,
gradient boosting — are the reason trees remain in use, and all of them start
from the instability described above. The bias-variance decomposition is unusually
concrete here, since depth moves a predictor from high bias to high variance along
a single axis you control. And the optimal-tree literature connects back to
[Integer Programming](./integer-programming.md), where the greedy heuristic is
replaced by an exact solver that pays for optimality in running time.
