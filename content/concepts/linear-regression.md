---
concept_id: concept.machine_learning.linear_regression
title: Linear Regression
slug: /concepts/linear-regression
aliases:
  - ordinary least squares
  - OLS
kind: method
tier: 1
review_state: generated-draft
summary: Fitting a function that is linear in its parameters by minimising the sum of squared residuals, which is exactly an orthogonal projection of the response onto the span of the predictors.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: specializes
    target: concept.machine_learning.generalized_linear_models
    note: Least-squares regression is the member of the GLM family with a Gaussian response and the identity link, which is why its estimates have a closed form and the rest of the family does not.
  - type: requires
    target: concept.linear_algebra.matrix_decompositions
    note: The estimator is computed in practice by QR factorising the design matrix, and the rank-deficient case is handled by the SVD, so the numerical story cannot be followed without decompositions.
  - type: contributes_to
    target: concept.machine_learning.bias_variance
    note: Ridge regression is the textbook demonstration that deliberately biasing an estimator can lower its mean squared error, and the shrinkage path makes the trade-off visible coefficient by coefficient.
  - type: contrasts_with
    target: concept.machine_learning.decision_trees
    note: Both predict a numeric response from the same tabular data, but a tree fits a piecewise-constant function by recursive partitioning and makes no global linearity assumption at all.
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
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - concrete-example
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Legendre (1805), Gauss (1809) and the priority dispute over least squares; Galton's coinage of "regression"
    reason: No source in the registry is a history of statistics; the registry's statistical-learning texts document the modern method and the ridge and lasso attributions, but not the nineteenth-century record.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Linear regression** models a scalar response $y$ as $x^{\top}\beta$ plus noise
and estimates $\beta$ by minimising the squared error
$\lVert y - X\beta \rVert_2^2$. "Linear" constrains the _parameters_, not the
predictors: $y = \beta_0 + \beta_1 x + \beta_2 x^2$ is a linear regression in
$(\beta_0, \beta_1, \beta_2)$, and any fixed basis expansion of the inputs —
polynomials, splines, indicator variables for categories — stays inside the
method. What must not appear is a parameter inside a nonlinearity.

## Why it matters

It is the one supervised method with a closed-form solution, an exact
finite-sample optimality theorem, and a complete theory of its own failure. That
combination makes it the baseline against which every other regressor is
measured: if a gradient-boosted ensemble cannot beat a least-squares fit on your
data, the extra machinery is buying nothing. It is also the computational core
of a much larger family — Gaussian processes, Kalman filters, and the
iteratively reweighted least squares that fits every generalised linear model
are all least-squares problems or sequences of them. And because its
coefficients carry the units of the problem, it remains the working tool of
econometrics, epidemiology and experimental science, where the estimate and its
standard error are the result, not a step towards one.

## Intuition

Stack the observations into a matrix $X$ whose columns are the predictors. The
set of values the model can produce, $\{X\beta : \beta \in \mathbb{R}^p\}$, is
the column space of $X$ — a $p$-dimensional plane sitting inside
$\mathbb{R}^n$. The observed response $y$ is a point in $\mathbb{R}^n$ that
almost certainly does not lie on that plane. Least squares drops a
perpendicular: the fitted vector $\hat y$ is the closest point on the plane, and
the residual $y - \hat y$ is orthogonal to every column of $X$.

Everything else follows from that picture. The normal equations are just the
statement "residual $\perp$ columns". Collinear predictors make the plane's basis
nearly parallel, so $\hat y$ is well determined while the coefficients $\beta$
that produce it are not. Adding a predictor can never increase the residual,
because it enlarges the plane. The picture misleads in one place worth naming:
the perpendicular is taken in the ordinary Euclidean metric on $\mathbb{R}^n$,
which silently assumes every observation carries equal noise. Weighted least
squares is the same geometry with a different inner product.

## Concrete example

Fit $y = \beta_0 + \beta_1 x$ to four points: $x = (1, 2, 3, 4)$,
$y = (2, 3, 5, 6)$. With $\bar x = 2.5$, $\bar y = 4$,

$$
S_{xx} = \sum (x_i - \bar x)^2 = 5, \qquad
S_{xy} = \sum (x_i - \bar x)(y_i - \bar y) = 7,
$$

so $\hat\beta_1 = 7/5 = 1.4$ and $\hat\beta_0 = 4 - 1.4 \times 2.5 = 0.5$.
Fitted values $(1.9, 3.3, 4.7, 6.1)$, residuals $(0.1, -0.3, 0.3, -0.1)$. The
residuals sum to zero and $\sum x_i r_i = 0$ — orthogonality to both columns,
exactly as the geometry demands. The residual sum of squares is $0.20$, so
$\hat\sigma^2 = 0.20 / (4 - 2) = 0.10$. Since

$$
(X^{\top}X)^{-1} = \begin{bmatrix} 4 & 10 \\ 10 & 30 \end{bmatrix}^{-1}
= \begin{bmatrix} 1.5 & -0.5 \\ -0.5 & 0.2 \end{bmatrix},
$$

the standard error of the slope is $\sqrt{0.10 \times 0.2} \approx 0.141$.

Ridge shrinks it. On centred data the penalised slope is
$S_{xy}/(S_{xx} + \lambda)$: at $\lambda = 1$ it is $7/6 \approx 1.167$, at
$\lambda = 5$ it is $0.7$ — half the unpenalised value, because the penalty now
matches the signal in $S_{xx}$.

In code, note what is _not_ called:

```python
import numpy as np

x = np.array([1.0, 2.0, 3.0, 4.0])
y = np.array([2.0, 3.0, 5.0, 6.0])
X = np.column_stack([np.ones_like(x), x])

beta, *_ = np.linalg.lstsq(X, y, rcond=None)   # SVD, not (X.T @ X)^-1 @ X.T @ y
print(beta)                                    # [0.5 1.4]
```

## Formal treatment

Let $X \in \mathbb{R}^{n \times p}$ be the design matrix,
$y \in \mathbb{R}^n$ the response, $\beta \in \mathbb{R}^p$ the coefficients.
The objective $\mathrm{RSS}(\beta) = \lVert y - X\beta \rVert_2^2$ is convex and
quadratic, and setting its gradient $-2X^{\top}(y - X\beta)$ to zero gives the
**normal equations**

$$
X^{\top}X\hat\beta = X^{\top}y .
$$

If $\operatorname{rank}(X) = p$ then $X^{\top}X$ is invertible,
$\hat\beta = (X^{\top}X)^{-1}X^{\top}y$, and
$\hat y = Hy$ with $H = X(X^{\top}X)^{-1}X^{\top}$. That $H$ satisfies
$H = H^{\top} = H^2$ and has rank $p$: it is the orthogonal projector onto
$\operatorname{col}(X)$.

**Gauss–Markov theorem.** Suppose $y = X\beta + \varepsilon$ with $X$ fixed and
of full column rank, $\mathbb{E}[\varepsilon] = 0$ and
$\operatorname{Cov}(\varepsilon) = \sigma^2 I_n$. Then for every
$c \in \mathbb{R}^p$, the estimator $c^{\top}\hat\beta$ has the smallest variance
among all estimators $a^{\top}y$ that are unbiased for $c^{\top}\beta$, and
$\operatorname{Cov}(\hat\beta) = \sigma^2 (X^{\top}X)^{-1}$.

Three things this does _not_ say. It assumes nothing about the shape of the
error distribution — only zero mean, constant variance $\sigma^2$
(homoscedasticity) and zero correlation between observations. Normality is
needed later, to make $t$ and $F$ statistics exactly distributed in finite
samples and to identify $\hat\beta$ as the maximum-likelihood estimate, but not
for the theorem. And "best" is best _within the class of linear unbiased_
estimators; nonlinear or biased estimators are unconstrained by it.

**Numerics.** Forming $X^{\top}X$ squares the conditioning:
$\kappa_2(X^{\top}X) = \kappa_2(X)^2$. A design with
$\kappa_2(X) \approx 10^{8}$ — routine with correlated predictors on different
scales — yields a cross-product matrix with condition number near $10^{16}$,
about the reciprocal of double-precision epsilon, and the Cholesky factorisation
can fail outright on a matrix that is mathematically positive definite.
Production solvers therefore factor $X = QR$ with $Q$ having orthonormal columns
and $R$ upper triangular, then solve $R\hat\beta = Q^{\top}y$ by back
substitution. Householder QR is backward stable and its accuracy degrades with
$\kappa_2(X)$, not its square. When $X$ is rank deficient the SVD gives the
minimum-norm solution $\hat\beta = X^{+}y$ via the pseudoinverse; this is what
`lstsq` routines in LAPACK-backed libraries do by default.

## Assumptions and requirements

Fitting requires nothing. Least squares is a deterministic projection and always
returns a best approximation, whatever generated the data. The assumptions buy
_interpretation_, and each buys a different piece:

- **Correct linear form.** $\mathbb{E}[y \mid X] = X\beta$ for the chosen basis.
  Dropped, the coefficients estimate the best linear approximation to a
  nonlinear truth — often useful, but no longer the thing you named.
- **Full column rank.** Dropped, $\hat\beta$ is not unique; $\hat y$ still is.
  With $p > n$ this is automatic and unpenalised least squares is undefined.
- **Exogeneity**, $\mathbb{E}[\varepsilon \mid X] = 0$. Dropped — an omitted
  variable correlated with a predictor, or noise in the predictors themselves —
  $\hat\beta$ is biased, and no sample size fixes it.
- **Homoscedastic, uncorrelated errors.** Dropped, $\hat\beta$ stays unbiased
  but loses the Gauss–Markov guarantee and the usual standard errors are wrong.
  The repairs are weighted or generalised least squares, or robust
  (heteroscedasticity-consistent) variance estimates.
- **Normality.** Needed only for exact finite-sample inference; with large $n$ a
  central limit argument gives approximate normality of $\hat\beta$ anyway.

## Uses and applicability

Reach for it when the sample is small relative to the number of predictors, when
the coefficients themselves are the deliverable, when you need calibrated
uncertainty, or when you need a floor to judge something fancier against. It also
handles unavoidable extrapolation more honestly than the alternatives: a linear
trend extends in an obvious, criticisable way, whereas a tree ensemble outputs a
constant beyond the training range.

Avoid it — or add structure to it — when the response is bounded, discrete or a
count (that is what the rest of the GLM family is for), when interactions matter
and you do not know which, or when $n$ is large and the relationship is genuinely
nonlinear with no basis expansion in mind. Those are the conditions under which
ensembles and neural networks earn their complexity.

## Limitations and common mistakes

The commonest error is believing least squares assumes Gaussian noise. It does
not; the Gauss–Markov theorem needs only uncorrelated errors of equal variance.

The second is over-reading "best linear unbiased". Ridge regression is biased
and frequently has lower mean squared error than $\hat\beta$; no contradiction
arises, because ridge is outside the class the theorem quantifies over.

The third is interpreting coefficients under collinearity. "The effect of $x_1$
holding $x_2$ fixed" is meaningless when the data contain no variation in $x_1$
at fixed $x_2$; coefficients then swing wildly, sometimes changing sign, while
predictions stay stable. A large variance inflation factor is the symptom.

The fourth is numerical: computing `inv(X.T @ X) @ X.T @ y`. It is the textbook
formula and the wrong algorithm, for the conditioning reason above.

Smaller traps: $R^2$ never decreases when a predictor is added, so it cannot
compare models of different size; ridge and lasso are not scale-invariant, so
predictors must be standardised and the intercept left unpenalised.

## Variants and alternatives

**Weighted and generalised least squares** change the inner product to match a
known error covariance — the fix for heteroscedasticity and correlated errors.
**Ridge** adds $\lambda \lVert \beta \rVert_2^2$, giving
$\hat\beta_{\text{ridge}} = (X^{\top}X + \lambda I)^{-1}X^{\top}y$; in SVD
coordinates it multiplies the $j$-th singular direction by
$d_j^2/(d_j^2 + \lambda)$, so it shrinks low-variance directions hardest. It buys
stability under collinearity and costs bias. **Lasso** uses
$\lambda \lVert \beta \rVert_1$; it has no closed form, is solved by coordinate
descent or least-angle regression, and buys exact zeros — genuine variable
selection — at the cost of arbitrary choices among correlated predictors.
**Elastic net** blends the two; **principal components regression** and
**partial least squares** instead reduce dimension before fitting.

Genuinely different competitors: **robust regression** (Huber loss, or
least-absolute-deviations and quantile regression) replaces the squared loss, so
a single outlier no longer dominates; **total least squares** puts noise in the
predictors too and minimises perpendicular rather than vertical distance; and
**Bayesian linear regression** returns a posterior rather than a point estimate,
with ridge recovered as the posterior mode under a Gaussian prior and lasso under
a Laplace prior.

## History and attribution

Least squares has two credible originators. Legendre published the method in
1805; Gauss published in 1809, claimed he had been using it since the 1790s, and
added the error-distribution argument connecting it to the normal law. The
priority dispute is real and was never fully resolved. The term "regression" came
later and from a different problem: Francis Galton's study of inheritance, where
the children of tall parents were on average less tall — "regression" toward the
mean. Gauss's optimality result predates Markov's restatement of it, and the
modern name attaches to both. The penalised variants are firmly dated: ridge to
Hoerl and Kennard in 1970, the lasso to Tibshirani in 1996.

## Sources

_The Elements of Statistical Learning_ chapter 3 matches this page most closely:
least squares, the projection geometry, the Gauss–Markov statement, the QR route,
and ridge, lasso and their relatives in one place, with bibliographic notes
naming Hoerl–Kennard and Tibshirani. MIT 18.06 develops the projection-matrix
picture and small worked line fits from the linear algebra side. MIT 18.065
treats least squares as a numerical problem — which factorisation to use, what
conditioning costs, how the pseudoinverse handles rank deficiency. Murphy's
_Probabilistic Machine Learning_ supplies the probabilistic reading: least
squares as Gaussian maximum likelihood, ridge and lasso as maximum a posteriori
estimates under Gaussian and Laplace priors.

## Prerequisites and next connections

Read [Vector Spaces](./vector-spaces.md) first, and specifically the idea of a
column space and an orthogonal complement — the entire method is one projection.
[Matrix Decompositions](./matrix-decompositions.md) explains the QR and SVD
factorisations that make it computable, and
[Convex Optimization](./convex-optimization.md) places the squared-error
objective in the wider class where a stationary point is a global minimum.

From here, [Frequentist Inference](./frequentist-inference.md) supplies the
standard errors, $t$-tests and confidence intervals that turn a fit into a claim,
and [Bayesian Inference](./bayesian-inference.md) gives the posterior alternative
that makes ridge a prior rather than a penalty. For response types least squares
cannot handle, continue to generalised linear models and logistic regression.
