---
concept_id: concept.machine_learning.logistic_regression
title: Logistic Regression
slug: /concepts/logistic-regression
kind: method
tier: 1
review_state: generated-draft
summary: A model of the probability of a binary outcome as a logistic function of a linear score, fitted by maximising a Bernoulli likelihood whose negative logarithm is the convex cross-entropy objective.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: specializes
    target: concept.machine_learning.generalized_linear_models
    note: It is the generalized linear model with a Bernoulli response and the logit as canonical link, so everything the GLM page says about link functions and iteratively reweighted least squares specialises to it.
  - type: requires
    target: concept.probability.frequentist_inference
    note: The fitting rule is maximum likelihood under a Bernoulli model, so a reader needs the likelihood function and the meaning of an estimator before the objective on this page makes sense.
  - type: contrasts_with
    target: concept.machine_learning.linear_regression
    note: Both fit a score that is linear in the parameters, but least squares models a real-valued conditional mean and has a closed-form solution, while this models a probability and has none.
  - type: contrasts_with
    target: concept.machine_learning.decision_trees
    note: Both are standard baselines on tabular data, but a tree carves the feature space into axis-aligned regions while logistic regression imposes one global linear structure on the log-odds.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - definition
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
      - why-it-matters
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary history of the logit (Verhulst, Berkson, Cox)
    reason: No registry source covers the origin of the logistic function or the papers that introduced the logit and the binary regression model; the attributions in this section are stated from general knowledge and should be checked against the originals before this page leaves generated-draft.
    sections:
      - history-and-attribution
  - label: Non-collapsibility of the odds ratio
    reason: The fact that adjusting for a covariate changes the odds ratio even when that covariate is not a confounder is epidemiological-methods material that none of the cited sources treats.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Logistic regression** models the conditional probability of a binary outcome
$y \in \{0, 1\}$ given a feature vector $x \in \mathbb{R}^d$ as

$$
\Pr(y = 1 \mid x) \;=\; \sigma(\theta^\top x),
\qquad
\sigma(z) = \frac{1}{1 + e^{-z}},
$$

with parameters $\theta \in \mathbb{R}^d$ and an intercept absorbed by fixing
$x_1 = 1$. Inverting the logistic function gives the equivalent statement, which
is the one worth memorising: the model asserts that the **log-odds** of the
outcome are affine in the features,

$$
\log \frac{\Pr(y = 1 \mid x)}{\Pr(y = 0 \mid x)} \;=\; \theta^\top x .
$$

The parameters are estimated by maximum likelihood under a Bernoulli model of
the labels. Nothing in the model produces a class: it produces a number in
$(0,1)$, and a classifier is obtained only by thresholding it.

## Why it matters

The obvious alternative — least squares on the 0/1 labels — produces fitted
values outside $[0,1]$, which cannot be read as probabilities, and weights a
confident wrong prediction the same as a hesitant one. Logistic regression
instead optimises the log loss, a proper scoring rule: if the true conditional
probability lies in the model class, the minimiser of the expected loss is that
true probability, so a well-fitted model gives calibrated risks and not merely a
decision boundary.

The second reason is computational. Minimising the count of misclassifications
over linear rules is combinatorially hard; the log loss is a smooth convex
surrogate, so the fit is a convex optimisation with no local optima and no
random restarts. Two people who fit the same model to the same data get the same
coefficients. That reproducibility, plus coefficients that read as log-odds, is
why the method survives in clinical risk scoring, credit decisions and
epidemiology, and why a softmax output layer — multinomial logistic regression
on learned features — sits on top of nearly every neural classifier.

## Intuition

Read $z = \theta^\top x$ as accumulated **evidence**, measured in log-odds
units, and $\sigma$ as the fixed dial that converts evidence into a probability.
Each feature contributes its own additive quantity of evidence; the sigmoid does
the rest. In base-2 units the score is literally bits of evidence for the
hypothesis $y = 1$, which is MacKay's framing of the single sigmoid neuron as a
classifier.

The place the analogy misleads is the mapping from evidence to probability.
Additivity holds on the log-odds scale and nowhere else: since
$\sigma'(z) = \sigma(z)(1 - \sigma(z))$, which peaks at $1/4$ when $z = 0$, one
unit of evidence moves the probability a great deal near $0.5$ and almost not at
all near the ends. The second place it misleads is the word "evidence" itself.
It suggests each feature carries an independent piece of information, as in
naive Bayes. Logistic regression makes no such assumption — the coefficients are
fitted jointly — which is exactly why a coefficient changes when a correlated
feature joins the model.

## Concrete example

Suppose one feature, hours of study, with fitted coefficients
$\theta = (-4,\, 1.5)$. At $x = 2$ hours the score is $z = -1$, so
$p = \sigma(-1) = 0.269$ and the odds are $e^{-1} = 0.368$. At $x = 3$ the score
is $0.5$, so $p = 0.622$ and the odds are $e^{0.5} = 1.649$. The odds ratio is
$1.649 / 0.368 = e^{1.5} = 4.48$: one extra hour multiplies the odds by $4.48$,
and that factor is the same everywhere. The probability change is not. From
$x = 2$ to $x = 3$ the probability rises by $0.354$; from $x = 6$ to $x = 7$ it
rises from $0.993$ to $0.999$, a change of $0.005$, with the same coefficient.

Now the divergence that separation causes. The following runs as written and
needs no libraries:

```python
from math import exp

X = [(1.0, 1.0), (1.0, 2.0), (1.0, 3.0), (1.0, 4.0)]   # (intercept, hours)
y = [0.0, 0.0, 1.0, 1.0]

def fit(lam, steps, rate=0.05):
    theta = [0.0, 0.0]
    for _ in range(steps):
        g = [0.0, 0.0]
        for (x0, x1), yi in zip(X, y):
            mu = 1.0 / (1.0 + exp(-(theta[0] * x0 + theta[1] * x1)))
            g[0] += (mu - yi) * x0
            g[1] += (mu - yi) * x1
        g[1] += lam * theta[1]                # ridge penalty on the slope only
        theta = [theta[0] - rate * g[0], theta[1] - rate * g[1]]
    return theta

for steps in (1_000, 10_000, 100_000):
    print(steps, fit(0.0, steps), fit(1.0, steps))
```

The data are perfectly separable: every $x \le 2$ is a $0$ and every $x \ge 3$
is a $1$. Unpenalised, the slope reported at $1{,}000$, $10{,}000$ and
$100{,}000$ steps is $3.22$, $7.11$ and $11.70$ — it is not converging slowly,
it is diverging, and the same is true of the intercept. With the ridge term the
fit settles at $\theta \approx (-2.396,\, 0.958)$ and stays there, giving
predicted probabilities $0.19, 0.38, 0.62, 0.81$. As a bonus check, the gradient
at $\theta = 0$ is $(0, -2)$, because every $\mu_i = 0.5$ there and
$\sum_i (0.5 - y_i)x_{i2} = 0.5 + 1 - 1.5 - 2 = -2$.

## Formal treatment

Write $\mu_i = \sigma(\theta^\top x_i)$ for the fitted probability of example
$i$, and let $X \in \mathbb{R}^{n \times d}$ stack the feature vectors. Under
the Bernoulli model $p(y_i \mid x_i) = \mu_i^{y_i}(1 - \mu_i)^{1 - y_i}$ with
examples independent given the features, the negative log-likelihood is the
**cross-entropy**

$$
\mathcal{L}(\theta) \;=\; -\sum_{i=1}^{n}
\Big[\, y_i \log \mu_i + (1 - y_i)\log(1 - \mu_i) \Big]
\;=\; \sum_{i=1}^{n} \Big[\log\!\big(1 + e^{\theta^\top x_i}\big) - y_i\,\theta^\top x_i \Big].
$$

Cross-entropy is not a separate design choice bolted onto the model; it _is_
the negative log-likelihood. Differentiating gives a gradient of unusually clean
form,

$$
\nabla \mathcal{L}(\theta) \;=\; \sum_{i=1}^{n} (\mu_i - y_i)\, x_i \;=\; X^\top(\mu - y),
$$

the features weighted by the prediction error, and a Hessian

$$
\nabla^2 \mathcal{L}(\theta) \;=\; \sum_{i=1}^{n} \mu_i (1 - \mu_i)\, x_i x_i^\top
\;=\; X^\top S X, \qquad S = \operatorname{diag}\big(\mu_i(1-\mu_i)\big).
$$

Since $\mu_i(1 - \mu_i) > 0$, the Hessian is positive semidefinite for every
$\theta$, so $\mathcal{L}$ is convex — the second form of $\mathcal{L}$ above is
a sum of log-sum-exp terms, which is the standard textbook example of a convex
function, and the fit is a convex program in the sense of Boyd and
Vandenberghe. It is _strictly_ convex when $X$ has full column rank. Newton's
method on this objective is iteratively reweighted least squares,
$\theta^{+} = \theta + (X^\top S X)^{-1} X^\top (y - \mu)$, which is a weighted
least-squares solve per iteration.

Convexity does not guarantee a minimiser exists. If the data are **separable** —
there is a $\theta_0$ with $\theta_0^\top x_i > 0$ whenever $y_i = 1$ and
$< 0$ whenever $y_i = 0$ — then $\mathcal{L}(c\,\theta_0) \to 0$ as
$c \to \infty$ while the infimum $0$ is never attained, so the maximum
likelihood estimate diverges. Adding $\tfrac{\lambda}{2}\lVert\theta\rVert_2^2$
makes the objective strictly convex and coercive, restoring a unique finite
solution. This is the least ideological reason to regularise: not variance
control but existence.

The $K$-class extension replaces $\sigma$ with the softmax,
$\Pr(y = k \mid x) = e^{\theta_k^\top x} / \sum_{j} e^{\theta_j^\top x}$, which
is identified only up to adding a common vector to every $\theta_k$.

## Assumptions and requirements

Four hypotheses carry the results above. **Linearity of the log-odds** in the
supplied features: not linearity in the probability, and not linearity in the
raw measurements, since splines, interactions and indicator codings are all
fair. Drop it and the fit is still well-defined but biased in a way no amount of
data removes. **Conditional independence of the observations** given the
features: violated by clustered or repeated-measures data, where the point
estimates often survive but the standard errors are badly understated.
**Full column rank of $X$**: exact collinearity leaves a flat direction and no
unique optimum, which is convexity failing to be strict. **No separation**, for
an unpenalised fit to exist at all.

Two further requirements are practical. Newton's method needs $X^\top S X$
invertible, which fails when $d > n$ or when fitted probabilities saturate and
$S$ becomes numerically zero, so high-dimensional fits use penalised gradient
methods instead. And probabilities are only calibrated on the population the
data came from — with one useful exception: under case-control sampling, where
cases and controls are sampled at different rates, the slope coefficients remain
consistent and only the intercept is biased.

## Uses and applicability

Reach for it when the output should be a probability rather than a label: risk
scores, click-through estimates, anything fed into a downstream cost
calculation. Reach for it when the coefficients must be defensible to a
regulator, a clinician or a reviewer, since each one is an interpretable
log-odds effect with a standard error. It is also the right first model on wide
sparse data — text with millions of features, one-hot categorical interactions —
where an $\ell_1$ or $\ell_2$ penalty plus stochastic gradient descent scales
comfortably and a nonlinear model would overfit or not finish.

Reach elsewhere when the structure is strongly nonlinear or interaction-heavy
and interpretability is negotiable, where gradient-boosted trees usually win on
tabular data; when only a decision rule is wanted and probability is irrelevant;
or when the outcome is a count, a duration or an ordered category, each of which
has its own more suitable model.

## Limitations and common mistakes

**A coefficient is a log-odds effect, not a probability effect.** This is the
most misread output in applied statistics. $\theta_j = 0.7$ means that a
one-unit increase in $x_j$, holding the other features fixed, multiplies the
_odds_ by $e^{0.7} \approx 2.01$. It does not double the probability, and the
change in probability depends on where you start. An odds ratio also is not a
risk ratio; the two agree only when the outcome is rare.

**The name misleads.** "Regression" is accurate — it is a regression of a
conditional probability — but this is not least squares on the labels, and
"logistic regression is a classifier" is true only of the thresholding step that
follows the model.

**Enormous coefficients with enormous standard errors are a symptom of
separation**, not of a powerful predictor. The usual cause is a rare indicator
variable that happens to line up perfectly with the outcome in the sample.

**Threshold $0.5$ is a convention, not an optimum.** The cost-minimising
threshold under asymmetric costs is elsewhere, and rebalancing an imbalanced
training set shifts the intercept rather than improving the ranking.

**Adjusting for a covariate changes the coefficients even when it is not a
confounder.** Odds ratios are not collapsible, so a marginal and a
covariate-adjusted odds ratio differ for reasons that have nothing to do with
causal bias — a trap when coefficients from two differently specified models are
compared.

## Variants and alternatives

Within the family: **multinomial (softmax) regression** for unordered classes;
**ordinal logistic regression**, which shares one slope across cumulative
splits; **conditional logistic regression** for matched sets; and the penalised
forms — **ridge** for stability and existence, **lasso** for sparsity,
**elastic net** for correlated groups of features. **Firth's penalised
likelihood** attacks separation and small-sample bias directly rather than
through a variance-shrinking penalty.

Changing the link gives **probit regression**, whose normal-CDF link yields fits
almost indistinguishable from the logit in the middle of the range but whose
coefficients live on a different scale by a factor of roughly $1.6$, and
**complementary log-log**, which is deliberately asymmetric. Genuinely different
competitors: **linear discriminant analysis**, which models the features
generatively and is more efficient when its Gaussian assumption holds and
misleading when it does not; **support vector machines**, which optimise a
margin under hinge loss and return no probability; and **gradient-boosted
trees**, which find interactions automatically at the cost of interpretability
and of needing explicit calibration afterwards.

## History and attribution

The logistic curve itself predates the statistics: Verhulst introduced it in the
nineteenth century as a model of population growth under a carrying capacity.
Its use as a regression model for binary outcomes came from bioassay, where
Berkson argued in the 1940s for the logit against the then-dominant probit and
coined the name. D. R. Cox's work on binary data in the late 1950s and 1960s
established the regression form in its modern shape, and epidemiological
application followed in the 1960s, notably in analyses of coronary risk in the
Framingham cohort. Nelder and Wedderburn's generalized linear model framework in
1972 folded it in as one member of a family with a shared fitting algorithm,
iteratively reweighted least squares, which is how most software still fits it.
These attributions are recorded in `unresolved_references`: no cited source here
covers the primary history.

## Sources

_The Elements of Statistical Learning_ is the reference for the model as a
statistical method — the log-odds parameterisation, Newton's method, the
separation problem, the $\ell_1$-penalised version and the comparison with
discriminant analysis. Murphy's _Probabilistic Machine Learning_ gives the same
material from the probabilistic-modelling side, with the multinomial extension
and the Bayesian treatment. Boyd and Vandenberghe supply the optimisation
foundation: log-sum-exp convexity and maximum likelihood as a convex program.
MacKay's _Information Theory, Inference, and Learning Algorithms_ is the source
for the single-neuron-as-classifier picture and evidence measured in bits.

## Prerequisites and next connections

Understand maximum likelihood first — [Frequentist
Inference](./frequentist-inference.md) covers what a likelihood is and what it
means to estimate by maximising one — together with the Bernoulli distribution
from [Probability Theory](./probability-theory.md) and the gradient of a
multivariable function. The optimisation content sits on
[Convex Optimization](./convex-optimization.md), which supplies the reason a
positive semidefinite Hessian guarantees that any stationary point is a global
minimum and describes the Newton step used here.

From here, the generalized linear model framework shows what happens when the
Bernoulli response and logit link are replaced by another pair. The penalised
variants lead into [High-Dimensional Statistics](./high-dimensional-statistics.md),
where the $d > n$ regime is the normal case rather than a pathology. And a
cross-entropy objective over a softmax is exactly the loss at the top of a
neural classifier, so the gradient $X^\top(\mu - y)$ derived here is the first
quantity backpropagation computes in a network trained with
[PyTorch](./pytorch.md).
