---
concept_id: concept.machine_learning.generalized_linear_models
title: Generalized Linear Models
slug: /concepts/generalized-linear-models
aliases:
  - GLM
kind: concept
tier: 1
review_state: generated-draft
summary: A single framework — an exponential-family response, a linear predictor and a link function — that contains linear, logistic and Poisson regression as three settings of the same three parts, all fitted by the same algorithm.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: generalizes
    target: concept.machine_learning.linear_regression
    note: Least squares is the GLM with a Gaussian response and the identity link; the other cases keep the linear predictor and change only the family and the link.
  - type: generalizes
    target: concept.machine_learning.logistic_regression
    note: Logistic regression is the GLM with a Bernoulli response and the logit link, which is that family's canonical link.
  - type: requires
    target: concept.probability.frequentist_inference
    note: Fitting is maximum likelihood and the deviance table is a likelihood-ratio test, so a reader without sampling distributions and likelihood cannot follow what a GLM reports.
  - type: contrasts_with
    target: concept.machine_learning.decision_trees
    note: Trees attack the same tabular regression and classification problems by recursively partitioning the feature space instead of assuming any monotone link to a linear predictor.
sources:
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.cran.manuals
    title: The Comprehensive R Archive Network — manuals
    url: https://cran.r-project.org/manuals.html
    source_kind: reference-documentation
    supports:
      - concrete-example
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.boyd.convex_optimization
    title: Stephen Boyd and Lieven Vandenberghe, Convex Optimization
    url: https://web.stanford.edu/~boyd/cvxbook/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-17
unresolved_references:
  - label: Nelder and Wedderburn's 1972 unification of linear models
    reason: The original paper and the McCullagh–Nelder monograph that became the standard reference are not in the source registry, so the attribution here rests on general knowledge rather than on a source this corpus can point at.
    sections:
      - history-and-attribution
  - label: Overdispersion diagnostics and quasi-likelihood for counts
    reason: No registry source treats overdispersion, the Pearson dispersion estimate, quasi-Poisson or negative-binomial regression directly; the R manuals document the quasi families but not the diagnostics or the negative-binomial alternative.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

A **generalized linear model** is specified by three parts, chosen
independently:

1. a **random component** — the response $Y_i$, given covariates, is drawn from
   an exponential dispersion family;
2. a **systematic component** — a linear predictor $\eta_i = x_i^\top \beta$;
3. a **link function** $g$, monotone and differentiable, tying the two together
   by $g(\mu_i) = \eta_i$, where $\mu_i = \mathbb{E}[Y_i \mid x_i]$.

Linearity is imposed on a transformation of the _mean_, not on the data and not
on the noise. Fix the family to Gaussian and the link to the identity and you
have least squares; fix it to Bernoulli with the logit link and you have
logistic regression; fix it to Poisson with the log link and you have Poisson
regression.

## Why it matters

Before the unification, each of those models was its own literature with its own
estimation routine, its own tests and its own software. Afterwards there is one
likelihood, one fitting algorithm (iteratively reweighted least squares), one
goodness-of-fit statistic (the deviance) and one way to compare nested models.
Adding a new response type — positive skewed costs, counts with exposure, an
ordered rating — becomes a matter of choosing $b$ and $g$, not of writing a new
estimator.

The practical payoff is that you stop pretending bounded or count data is
Gaussian. A linear model on counts predicts negative counts near the low end and
assumes constant variance where the variance visibly grows with the mean; a
Poisson GLM does neither, because the family supplies the mean–variance relation
for free.

## Intuition

Carry two pictures. The first: regression is still a straight line, but you get
to choose the ruler it is straight on. Log-mean for counts, log-odds for
probabilities, mean itself for continuous symmetric data. The second: the family
is not just a noise model bolted on afterwards — it _dictates_ how the variance
grows with the mean, so choosing Poisson is a claim that variance equals mean,
not merely a claim about the shape of the residuals.

The tempting analogy is "GLM = ordinary regression on transformed data", and it
is wrong in a way worth internalising. Regressing $\log y$ on $x$ models
$\mathbb{E}[\log Y]$; a log-link GLM models $\log \mathbb{E}[Y]$. Jensen's
inequality separates the two, and the first is undefined the moment a count is
zero.

## Concrete example

Nine counts, three at each level of a covariate $x$:

```r
y <- c(2, 3, 6, 7, 8, 9, 10, 12, 15)
x <- c(1, 1, 1, 2, 2, 2, 3, 3, 3)
fit <- glm(y ~ x, family = poisson(link = "log"))
```

Maximum likelihood gives $\hat\beta_0 = 0.8325$ and $\hat\beta_1 = 0.5706$, with
standard errors $0.387$ and $0.156$. Because the link is the log, the slope is
multiplicative: each unit of $x$ multiplies the expected count by
$e^{0.5706} = 1.769$. The fitted means are $4.07$, $7.20$ and $12.74$ against
group averages of $3.67$, $8.00$ and $12.33$.

Running the IRLS loop by hand from the usual starting value $\eta_i = \log(y_i +
0.1)$, the deviance goes $4.0715 \to 3.9724 \to 3.97234 \to 3.97234$: four
iterations to twelve digits. That residual deviance of $3.97$ on $9 - 2 = 7$
degrees of freedom, and a Pearson statistic of $3.83$, give a dispersion
estimate $\hat\phi = 3.83/7 = 0.55$ — below one, which at $n = 9$ is noise, not
evidence of underdispersion.

## Formal treatment

The response density or mass function belongs to an **exponential dispersion
family**:

$$
f(y; \theta, \phi) \;=\; \exp\!\left\{ \frac{y\theta - b(\theta)}{a(\phi)} + c(y, \phi) \right\},
$$

where $\theta$ is the **canonical parameter**, $\phi$ the **dispersion
parameter**, $b$ the **cumulant function** and $a(\phi)$ typically $\phi / w_i$
for a prior weight $w_i$. Differentiating the log-likelihood gives the two
identities the whole framework runs on:

$$
\mu = \mathbb{E}[Y] = b'(\theta), \qquad
\operatorname{Var}(Y) = a(\phi)\, b''(\theta) = a(\phi)\, V(\mu),
$$

with $V(\mu) = b''(b'^{-1}(\mu))$ the **variance function**. The variance is not
a free parameter: it is determined by the mean up to the scalar $\phi$.

The **canonical link** is the $g$ that makes the linear predictor equal the
canonical parameter, $\theta_i = \eta_i$, that is $g = (b')^{-1}$. Three cases:

| Family    | $b(\theta)$            | $V(\mu)$     | canonical link         | $\phi$     |
| --------- | ---------------------- | ------------ | ---------------------- | ---------- |
| Gaussian  | $\theta^2/2$           | $1$          | identity               | $\sigma^2$ |
| Bernoulli | $\log(1 + e^{\theta})$ | $\mu(1-\mu)$ | $\operatorname{logit}$ | $1$        |
| Poisson   | $e^{\theta}$           | $\mu$        | $\log$                 | $1$        |

The score equations are

$$
\sum_{i=1}^{n} \frac{(y_i - \mu_i)}{V(\mu_i)\, g'(\mu_i)}\, x_i \;=\; 0 ,
$$

which under a canonical link collapse to $X^\top (y - \mu) = 0$: the fitted
values match the data on every covariate direction. With a canonical link the
log-likelihood is concave in $\beta$, so the maximum is global and Newton's
method is the natural solver — the setting Boyd and Vandenberghe treat as
convex maximum-likelihood estimation.

**IRLS** is exactly Fisher scoring written as weighted least squares. With
working weights $w_i = 1/\big(V(\mu_i)\, g'(\mu_i)^2\big)$ and working response
$z_i = \eta_i + (y_i - \mu_i)\, g'(\mu_i)$, each step is

$$
\beta^{(t+1)} = (X^\top W X)^{-1} X^\top W z ,
$$

recomputing $W$ and $z$ at the current fit. Under a canonical link the observed
and expected information coincide, so Fisher scoring _is_ Newton–Raphson.

The **deviance** compares the fit to the saturated model that reproduces every
observation, $D = 2\,\big(\ell_{\text{sat}} - \ell(\hat\beta)\big)\,\phi$. For
Gaussian responses it is the residual sum of squares; for Poisson it is
$2\sum_i \big[y_i \log(y_i/\hat\mu_i) - (y_i - \hat\mu_i)\big]$. Differences in
deviance between nested models are asymptotically $\chi^2$ with degrees of
freedom equal to the difference in parameters when $\phi$ is known, and call for
an $F$-test when it is estimated.

## Assumptions and requirements

Observations must be independent given the covariates; clustered or repeated
measurements violate this and the damage lands on the standard errors, not on
the point estimates. The mean model must be right in both halves — the right
covariates, and the right link — since a misspecified link biases $\hat\beta$
itself. The variance function must be right up to the scalar $\phi$; the link
must be monotone and differentiable so that $g'(\mu)$ exists and the weights are
finite.

The asymptotic $\chi^2$ behaviour of deviance differences needs the usual
regularity conditions and enough information per parameter: with sparse binary
data or very small counts the approximation degrades, and the deviance of a
single fit is not in general $\chi^2$ even when the model is true. Dropping the
variance assumption alone is survivable — under quasi-likelihood, $\hat\beta$
stays consistent if only the mean model is correct — which is precisely why
overdispersion corrupts inference rather than estimates.

## Uses and applicability

Reach for a GLM when the response has a known distributional shape and you
believe some monotone transformation of its mean is roughly linear in the
covariates: counts with a log link and an offset $\log(\text{exposure})$ for
rates, binary or grouped-binomial outcomes for classification with calibrated
probabilities, Gamma with a log link for positive skewed quantities like claim
sizes, log-linear Poisson models for contingency tables. Coefficients are
interpretable as multiplicative or log-odds effects, standard errors and
confidence intervals come out of the same fit, and the model extrapolates in a
controlled way.

Do not reach for one when the response–covariate relationship is not monotone on
any plausible scale, when interactions matter more than main effects, or when
predictive accuracy on large, messy tabular data is the only goal — gradient
boosting and random forests routinely win there. A GLM is also a poor first
choice when most of the mass is at zero for structural reasons.

## Limitations and common mistakes

**Overdispersion is the usual failure of a Poisson GLM.** The family forces
$\operatorname{Var}(Y) = \mu$; real counts are almost always more variable than
that, because of omitted covariates, clustering, contagion or excess zeros. The
consequence is specific: $\hat\beta$ remains consistent, but the standard errors
are too small, $z$-statistics are inflated and coefficients look significant
when they are not. Diagnose it with the Pearson statistic divided by residual
degrees of freedom — preferred over deviance/df, which is unreliable when the
fitted means are small — and treat a value well above one as a symptom. The
standard responses are a quasi-Poisson fit, which keeps the same point estimates
and multiplies standard errors by $\sqrt{\hat\phi}$; a negative-binomial model,
which replaces the variance function with $\mu + \mu^2/k$ and is a genuine
likelihood, so AIC and likelihood-ratio tests remain available; sandwich or
cluster-robust standard errors; or, best of all, fixing the mean model that
caused it. A dispersion of, say, $40/7 \approx 5.7$ means honest standard errors
are $2.4$ times the naive ones.

Other recurring errors: reading a log-link coefficient as an additive effect on
the mean; back-transforming a fitted $\log y$ regression without a correction for
the bias Jensen's inequality creates; expecting raw residuals to be normal and
homoscedastic — use deviance or Pearson residuals; comparing deviances across
models fitted to differently transformed responses; treating deviance/df as a
formal test rather than a diagnostic; and, in logistic regression, ignoring
complete separation, where the MLE diverges to infinity and the software
silently reports huge coefficients with huge standard errors.

## Variants and alternatives

Inside the framework: **quasi-likelihood** specifies only a mean and a variance
function, with no full distribution, and the R `quasi`, `quasipoisson` and
`quasibinomial` families implement it. **Negative binomial** and **Tweedie**
models extend the available variance functions. **Multinomial** and
**cumulative-logit** models handle unordered and ordered categories.
**Generalized additive models** replace $x^\top\beta$ with a sum of smooth
functions, buying curvature at the cost of interpretable single coefficients.
**GLMMs** add random effects and **GEEs** model correlation directly, both for
clustered data. **Regularized GLMs** add an $\ell_1$ or $\ell_2$ penalty to the
same likelihood for high-dimensional problems, and Bayesian GLMs put priors on
$\beta$ and report a posterior instead of a confidence interval.

Outside it: tree ensembles, kernel methods and neural networks all drop the
linear-predictor assumption entirely. They generally predict better and explain
worse, and none of them hands you a $p$-value on a coefficient.

## History and attribution

The framework was introduced by John Nelder and Robert Wedderburn in 1972, in a
paper whose contribution was recognising that probit analysis, logit models,
log-linear models for contingency tables and ordinary least squares were all the
same model under different links and families, and could all be fitted by the
same iteratively reweighted least squares algorithm. Wedderburn followed in 1974
with quasi-likelihood, loosening the requirement of a full distribution to just
a mean and a variance function. McCullagh and Nelder's monograph, first
published in 1983, became the standard reference, and the GLIM software spread
the practice. The ingredients are older: Fisher's scoring method, Bliss's probit
analysis from the 1930s and Berkson's logistic bioassay work from the 1940s all
predate the synthesis. What was new in 1972 was the unification, not any of the
individual models.

## Sources

Murphy's _Probabilistic Machine Learning_ gives the exponential-family algebra,
the mean and variance identities from the cumulant function, and the GLM
construction as a modern probabilistic-modelling chapter. _The Elements of
Statistical Learning_ is the place for the estimation and model-selection side —
logistic regression fitted by IRLS, deviance, and the additive and regularized
extensions — and for where GLMs sit relative to trees and boosting. The R
manuals document `glm`, its families and links, and the quasi families whose
dispersion is estimated rather than fixed at one, which is what the code block
here is calling. Boyd and Vandenberghe cover the optimisation half: why a
canonical-link likelihood is a convex problem and what Newton's method does with
it. Nothing in the registry covers overdispersion diagnostics or
negative-binomial regression, and nothing covers the original 1972 paper; both
gaps are recorded in the frontmatter.

## Prerequisites and next connections

Read [Frequentist Inference](./frequentist-inference.md) first: maximum
likelihood, sampling distributions and likelihood-ratio tests are the language a
GLM's output is written in, and [Probability Theory](./probability-theory.md)
supplies the families themselves. The fitting side connects to
[Convex Optimization](./convex-optimization.md), since a canonical-link GLM is a
convex problem and IRLS is Newton's method in disguise.

From here, [Bayesian Inference](./bayesian-inference.md) is the natural next
step — the same three-part model with a prior on $\beta$, which is also how
partial pooling across groups gets handled — and
[R](./r-language.md) is where the GLM tooling is most complete, `glm` being part
of the base language rather than a package.
