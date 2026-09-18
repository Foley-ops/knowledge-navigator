---
concept_id: concept.machine_learning.random_forests
title: Random Forests
slug: /concepts/random-forests
aliases:
  - random decision forests
kind: algorithm
tier: 1
review_state: generated-draft
summary: An ensemble of decision trees grown on bootstrap resamples with a random subset of features considered at each split, whose averaged prediction has far lower variance than a single tree because the second randomisation decorrelates them.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.machine_learning.decision_trees
    note: A forest is defined by modifying the tree-growing procedure, so a reader who does not know how a single tree chooses splits cannot follow what the randomisation changes.
  - type: assumes
    target: concept.machine_learning.bias_variance
    note: Averaging leaves the bias of the individual trees untouched, so the method only pays off when a single deep tree's error is dominated by its variance.
  - type: contrasts_with
    target: concept.machine_learning.linear_regression
    note: A forest fits a piecewise-constant, axis-aligned function and is flat outside the training range, where a linear model extrapolates by construction and states a global functional form.
  - type: contributes_to
    target: concept.machine_learning.generalization
    note: Out-of-bag error turns the bootstrap into a held-out estimate of generalisation error that costs no extra fitting and needs no validation split.
sources:
  - source_id: source.breiman2001.random_forests
    title: Random Forests
    url: https://link.springer.com/article/10.1023/A:1010933404324
    source_kind: primary-research
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.chen2016.xgboost
    title: 'XGBoost: A Scalable Tree Boosting System'
    url: https://arxiv.org/abs/1603.02754
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: scikit-learn implementation defaults and API for random forests
    reason: The code block and the remark about differing default values of m describe one library's conventions, which no source in the registry documents.
    sections:
      - concrete-example
      - assumptions-and-requirements
  - label: Bias of impurity-based feature importance toward high-cardinality predictors, and the behaviour of permutation importance under correlated features
    reason: Both are well established in the ensembles literature but no registry source states them, and they are the basis of the advice to prefer held-out permutation importance.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **random forest** is a collection of $B$ decision trees combined by averaging
(regression) or majority vote (classification), where each tree is grown on its
own bootstrap resample of the training set and, at every node, is allowed to
split on only $m$ features drawn at random from the $p$ available. The trees are
grown deep and are not pruned. Both randomisations are deliberate: the bootstrap
makes the trees differ, and the per-node feature restriction makes them differ
from each other in ways the bootstrap alone cannot achieve.

## Why it matters

A fully grown tree has low bias and high variance — change a few training rows
and the root split can change, and everything below it with it. Bagging (fitting
trees to bootstrap samples and averaging) removes part of that variance, but not
enough: if one predictor is strongly informative, nearly every bagged tree picks
it at the root, the trees end up looking alike, and averaging similar mistakes
does not remove them. Restricting each node to $m$ candidate features forces
trees to use the second- and third-best predictors, which is what actually drives
the correlation between trees down.

The payoff is practical. A forest needs almost no tuning, handles numeric and
categorical features and wildly different scales without preprocessing, produces
a validation estimate for free, and remains a strong baseline on tabular data —
usually the number a more complicated model has to beat, not a straw man.

## Intuition

Averaging $B$ measurements cuts the noise by a factor of $B$ only if the
measurements are independent. Correlated measurements share error, and no amount
of averaging removes shared error. That is exactly the forest's situation: trees
fit to resamples of the same data are correlated, and the variance of their
average has a floor set by that correlation, not by $B$.

The analogy breaks in one important place. Measurements of a fixed quantity are
usually taken to be unbiased, so averaging is pure gain. Trees are not: the
forest's bias is the bias of one of its trees, and pushing $m$ down decorrelates
the trees while making each one worse. So $m$ is not a knob you turn to zero — it
trades correlation against bias, and that trade is the whole design.

A second picture is worth carrying: the fraction of trees in which a query point
lands in the same leaf as training point $x_i$ is a data-adaptive weight, so a
forest behaves like a nearest-neighbour method whose notion of "near" was learned
from the data rather than fixed in advance.

## Concrete example

Take the variance formula at face value. Suppose each tree's prediction at a
point has variance $\sigma^2 = 1$ and you use $B = 500$ trees. Bagged trees
without feature subsampling might have pairwise correlation $\rho = 0.5$:

$$
\rho\sigma^2 + \frac{1-\rho}{B}\sigma^2 = 0.5 + \frac{0.5}{500} = 0.501 .
$$

Set $m = \lfloor\sqrt{p}\rfloor$ and suppose the correlation falls to
$\rho = 0.05$:

$$
0.05 + \frac{0.95}{500} = 0.0519 .
$$

A tenfold reduction in variance from the same 500 trees, bought entirely by
decorrelation. Note that the $1/B$ term is negligible in both lines — beyond a
few hundred trees, $B$ buys almost nothing and $\rho$ buys everything.

The other free lunch, out-of-bag error, and the importance measures look like
this:

```python
import numpy as np
from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from sklearn.inspection import permutation_importance
from sklearn.model_selection import train_test_split

X, y = make_classification(n_samples=2000, n_features=20, n_informative=3,
                           n_redundant=0, shuffle=False, random_state=0)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0)

rf = RandomForestClassifier(n_estimators=500, max_features="sqrt",
                            oob_score=True, random_state=0).fit(Xtr, ytr)

print(rf.oob_score_)                             # held-out accuracy, no split used
print(np.round(rf.feature_importances_[:5], 3))  # impurity importance (MDI)
perm = permutation_importance(rf, Xte, yte, n_repeats=10, random_state=0)
print(np.round(perm.importances_mean[:5], 3))    # permutation importance, held out
```

With `shuffle=False` the three informative features are columns 0 to 2. Both
measures rank those on top; the difference shows in the other seventeen columns,
which are pure noise and still collect a non-trivial share of the impurity
importance, while their permutation importance sits near zero.

## Formal treatment

Let the training set be $\mathcal{D} = \{(x_i, y_i)\}_{i=1}^{N}$ with
$x_i \in \mathbb{R}^p$. For $b = 1, \dots, B$: draw a bootstrap sample
$\mathcal{D}^{*b}$ of size $N$ with replacement from $\mathcal{D}$, and grow a
tree $T_b$ in which each node selects $m \le p$ features uniformly at random
without replacement, splits on the best variable and cut-point among those $m$,
and recurses until nodes reach a minimum size $n_{\min}$. The forest predicts
$\hat f(x) = \frac{1}{B}\sum_{b} T_b(x)$ for regression and by vote for
classification. Common settings are $m = \lfloor\sqrt{p}\rfloor$ with
$n_{\min} = 1$ for classification and $m = \lfloor p/3 \rfloor$ with
$n_{\min} = 5$ for regression.

**Variance of the average.** If the $T_b(x)$ are identically distributed with
variance $\sigma^2$ and pairwise correlation $\rho$ — identically distributed
because they are i.i.d. draws of the randomisation, not independent because they
share the data — then

$$
\operatorname{Var}\!\left(\frac{1}{B}\sum_{b=1}^{B} T_b(x)\right)
= \rho\,\sigma^2 + \frac{1-\rho}{B}\,\sigma^2
\;\xrightarrow[B \to \infty]{}\; \rho\,\sigma^2 .
$$

Because $\mathbb{E}\hat f(x) = \mathbb{E}T_b(x)$, the bias is unchanged. Every
gain is in the variance term, and the limit is $\rho\sigma^2$, so the only way to
improve the limit is to lower $\rho$.

**Out-of-bag.** An observation is absent from a given bootstrap sample with
probability $(1 - 1/N)^N \to e^{-1} \approx 0.368$. Predicting $y_i$ using only
the roughly $0.368\,B$ trees that did not see it, and averaging the resulting
error over $i$, gives the **out-of-bag error**, which behaves much like an
$N$-fold cross-validation estimate and is available while the forest is being
fitted.

**Breiman's bound.** For classification, define the strength $s$ as the expected
margin of a single randomised tree and $\bar\rho$ as the mean correlation between
the raw margin functions of two independent trees. The generalisation error
$PE^{*}$ of the forest satisfies

$$
PE^{*} \;\le\; \frac{\bar\rho\,(1 - s^{2})}{s^{2}} .
$$

The bound is loose and is not useful as a numerical prediction, but it names the
right quantity to minimise: the ratio of correlation to squared strength, which
is precisely the trade $m$ controls.

## Assumptions and requirements

The variance argument assumes the trees are exchangeable and that $\sigma^2$ and
$\rho$ are meaningful at the point of interest; this holds because the trees are
i.i.d. given the data. It assumes nothing about $\rho$ being small — that has to
be arranged, and is what $m$ is for.

The method assumes a single deep tree is variance-limited. If the target is
smooth or close to linear, or the good decision boundary is oblique in feature
space, the trees are biased in the same direction and the forest inherits that
bias exactly; hundreds more trees will not touch it.

It assumes enough relevant features relative to $p$. With $r$ relevant features
out of $p$ and $m$ candidates per node, the chance that a split even sees a
relevant feature is $1 - \binom{p-r}{m}\big/\binom{p}{m}$. For $r = 3$,
$p = 100$, $m = 10$ that is about $0.27$: most splits are made among noise. Push
$m$ lower in this regime and accuracy falls, which is why the usual default is a
starting point rather than a rule. Library defaults differ, so check what your
implementation uses for $m$ rather than assuming $\lfloor p/3 \rfloor$.

Out-of-bag validity assumes the rows are exchangeable. Grouped observations,
repeated measurements on the same subject, or time-ordered data leak across the
bootstrap, and the out-of-bag estimate becomes optimistic in exactly the way a
random cross-validation split would.

## Uses and applicability

Reach for a forest on tabular data of moderate size, with mixed types, when you
want a strong result quickly and cannot afford a tuning budget; as the baseline a
more complex model must beat; and as a fast read on which variables carry signal
before committing to a model. The leaves support more than a conditional mean —
quantiles, survival curves, proximities and missing-value imputation are all read
off the same fitted forest.

Avoid it when you need extrapolation: predictions are constant outside the range
covered by the training data, because every leaf holds a fixed value. Avoid it
for very high-dimensional sparse data such as bag-of-words text, where linear
models are usually both better and far cheaper. Weigh it carefully when latency
or memory matters — a 500-tree forest is large and slow relative to a linear
model — and when you need an interpretable model rather than a ranking of
variables.

## Limitations and common mistakes

"Random forests do not overfit" is the most common error, and it is a garbled
version of something true. Adding trees does not increase overfitting: the
average converges as $B$ grows, so $B$ is a compute decision, not a complexity
knob. But the object it converges to can still overfit. With low
signal-to-noise, fully grown trees fit noise and limiting depth or raising
$n_{\min}$ helps.

The second error is expecting a forest to fix bias. It does not: the bias is the
bias of one randomised tree, and heavy randomisation makes it worse.

The third is trusting impurity importance. The default `feature_importances_` in
most libraries is the total impurity decrease attributable to each variable,
computed on the training data, and it is biased toward continuous and
high-cardinality categorical variables — a unique identifier column can look
important. Permutation importance computed on held-out data is the more
trustworthy default. Even it has a known failure mode: with correlated
predictors, permuting one leaves the information available through the others, so
credit is split and both look unimportant, and the permuted rows are off the data
manifold.

Two smaller traps. Selecting hyperparameters by out-of-bag score and then
reporting that same score is selection bias, and the number will be optimistic.
And vote proportions are not calibrated probabilities; they are ensemble
frequencies, reasonable as a ranking but worth calibrating before thresholding
against real costs. Under strong class imbalance, voting drifts toward the
majority class unless you weight classes or balance the bootstrap.

## Variants and alternatives

**Extremely randomised trees** (Geurts, Ernst and Wehenkel, 2006) go further by
drawing cut-points at random instead of optimising them, and typically skip the
bootstrap: lower variance and much faster fitting, at the cost of higher bias per
tree. **Forest-RC**, Breiman's own variant, splits on random linear combinations
of features, which helps when the boundary is oblique but gives up axis-aligned
readability. The **random subspace** method fixes a feature subset per tree
rather than per node. **Quantile regression forests** and **survival forests**
reuse the same leaves to estimate distributions rather than means.

The serious competitor is **gradient-boosted trees** — XGBoost, LightGBM,
CatBoost — which fit trees sequentially to the residuals of the current model and
therefore attack bias rather than variance. Well-tuned boosting usually beats a
forest on tabular benchmarks; it also has more ways to go wrong and needs the
tuning to get there, so the forest keeps its place as the robust default. Whether
neural networks close this gap on tabular data is genuinely unsettled.

## History and attribution

Leo Breiman named and analysed random forests in 2001, combining his own
**bagging** (1996) with randomised split selection. He was explicit about
building on two earlier lines: Tin Kam Ho's random subspace method, which grew
each tree in a randomly chosen feature subspace, and Amit and Geman's 1997 work
on shape recognition, which selected at random among a large pool of candidate
splits at each node — the direct ancestor of the per-node feature draw. Thomas
Dietterich's randomised C4.5 belongs to the same period. The original Fortran
implementation was written by Breiman with Adele Cutler, and the pairing of their
names on the method is a legacy of that code.

## Sources

Breiman's 2001 paper is the definition, the strength-and-correlation analysis and
the convergence result, and it is also where the out-of-bag estimate and
permutation importance are proposed. The Elements of Statistical Learning is the
best treatment of the variance formula and the decorrelation argument, and is
careful about what the method does and does not do to bias; it is the source for
the nearest-neighbour reading too. Murphy's Probabilistic Machine Learning places
forests inside the wider family of bagged and boosted tree ensembles. The XGBoost
paper is cited only as the reference point for the boosting alternative.

## Prerequisites and next connections

Read the Decision Trees page first: everything here is a modification of how a
single tree is grown, and the terms — split, node, impurity, depth — come from
there. [Probability Theory](./probability-theory.md) supplies the variance of a
sum of correlated variables, which is the one piece of mathematics the whole
method rests on, and [Frequentist Inference](./frequentist-inference.md) supplies
the resampling logic the bootstrap belongs to.

From here, the natural next steps are boosted trees, which reverse the emphasis
from variance to bias, and the model-selection machinery that out-of-bag error
stands in for. [High-Dimensional Statistics](./high-dimensional-statistics.md) is
the right place to understand why feature subsampling stops helping when the
relevant variables become a vanishing fraction of the available ones.
