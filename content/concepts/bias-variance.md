---
concept_id: concept.machine_learning.bias_variance
title: Bias-Variance
slug: /concepts/bias-variance
aliases:
  - bias-variance decomposition
kind: concept
tier: 1
review_state: generated-draft
summary: An exact identity splitting the expected squared prediction error of a learning procedure into squared bias, variance across training sets, and irreducible noise — together with a rule of thumb about model complexity that does not always hold.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: The decomposition is algebra on expectations and variances taken over a random training set, so a reader needs expectation, independence and variance before the two-line derivation says anything.
  - type: contributes_to
    target: concept.machine_learning.generalization
    note: It supplies one exact, loss-specific account of where out-of-sample error comes from, and most practical discussion of generalization is conducted in its vocabulary.
  - type: contrasts_with
    target: concept.machine_learning.vc_dimension
    note: VC dimension bounds error uniformly over a hypothesis class without reference to the target function, where this decomposition is exact but depends on the specific target, distribution and sample size.
  - type: contributes_to
    target: concept.machine_learning.random_forests
    note: Bagging is engineered directly against the variance term — averaging decorrelated deep trees shrinks variance while leaving each tree's low bias largely intact.
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
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: Double descent beyond the interpolation threshold
    reason: No source in the registry covers the double-descent literature, so the statements here about what has been observed empirically, what has been proved for linear and random-feature models, and when the term entered use rest on no cited source.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
  - label: Geman, Bienenstock and Doursat, Neural Networks and the Bias/Variance Dilemma (1992)
    reason: The paper that carried the decomposition from statistics into neural-network research is not in the registry, so that attribution is uncited.
    sections:
      - history-and-attribution
claims: []
---

## Definition

The **bias-variance decomposition** splits the expected squared error of a
learning procedure, at one input point, into three non-negative pieces: how far
the procedure's _average_ prediction sits from the truth, how much its
prediction moves when the training set is redrawn, and the noise in the label
that no predictor can remove. At a test point $x_0$,

$$
\mathbb{E}\big[(Y - \hat f_D(x_0))^2 \mid X = x_0\big]
= \underbrace{\sigma^2}_{\text{noise}}
+ \underbrace{\big(\bar f(x_0) - f(x_0)\big)^2}_{\text{bias}^2}
+ \underbrace{\mathbb{E}_D\big[(\hat f_D(x_0) - \bar f(x_0))^2\big]}_{\text{variance}} .
$$

Bias and variance are properties of a _procedure_ — an algorithm, a hypothesis
class and a sample size together — evaluated against a distribution. They are
not properties of the one model you happen to have trained.

## Why it matters

A test error is a single number and does not tell you what to do next. The
decomposition splits it into three terms with three different remedies. More
data shrinks variance and leaves bias alone. A richer model class shrinks bias
and usually inflates variance. Noise responds to neither, and caps what any
amount of engineering can achieve. Knowing which term dominates is the
difference between labelling more examples, changing the model, and stopping.

It is also the design rationale behind a long list of methods. Ridge and lasso
accept bias to buy variance. Bagging averages decorrelated fits to cancel
variance. Boosting fits stage-wise to chip away at bias. Early stopping is a
variance control with a wall-clock knob. Each is a deliberate move along one of
these axes.

## Intuition

The standard picture is a dart board: bias is how far the cluster of darts sits
from the bullseye, variance is how spread the cluster is. The analogy is
genuinely useful and breaks in two places worth naming. First, each dart is a
model trained on a _different_ dataset that you never see — you throw exactly
one dart, and the cluster is a thought experiment. Second, the bullseye moves:
bias is defined at each $x_0$ separately, so a procedure can aim high in one
region of input space and low in another.

## Concrete example

Take a fixed design $x_i \in \{0, 0.1, \ldots, 1.0\}$, eleven points, with
$y_i = x_i^2 + \varepsilon_i$ and $\operatorname{Var}(\varepsilon_i) = \sigma^2 = 0.25$.
Fit $k$-nearest-neighbour regression, $\hat f(x_0) = \frac{1}{k}\sum_{\ell \in N_k(x_0)} y_\ell$,
and predict at $x_0 = 0.5$. Because the design is fixed and the neighbours of
$0.5$ are a symmetric window, both terms are closed-form: the variance of an
average of $k$ independent noisy labels is $\sigma^2/k$, and the bias is
$f(x_0)$ minus the average of $f$ over the window.

| $k$ | bias$^2$ | variance | total error |
| --- | -------- | -------- | ----------- |
| 1   | 0.0000   | 0.2500   | 0.5000      |
| 3   | 0.00004  | 0.0833   | 0.3334      |
| 5   | 0.0004   | 0.0500   | 0.3004      |
| 7   | 0.0016   | 0.0357   | 0.2873      |
| 9   | 0.0044   | 0.0278   | 0.2822      |
| 11  | 0.0100   | 0.0227   | 0.2827      |

At $k=1$ the fit is unbiased at this point and pays the full noise variance
twice over. As $k$ grows, variance falls like $1/k$ while the window reaches
into curvature of $x^2$ and bias grows. The minimum is at $k=9$, and it is
shallow: $k=7$ through $k=11$ all sit within $2\%$ of it. Note also what the
table does not move — the noise floor of $0.25$ is $89\%$ of the best error
available. No choice of $k$ touches it.

## Formal treatment

Assume $Y = f(X) + \varepsilon$ with $\mathbb{E}[\varepsilon] = 0$,
$\operatorname{Var}(\varepsilon) = \sigma^2 < \infty$, and $\varepsilon$
independent of $X$ and of the training set $D = \{(x_i, y_i)\}_{i=1}^{n}$. A
learning procedure maps $D$ to a predictor $\hat f_D$. Write $\hat f = \hat f_D(x_0)$
and $\bar f(x_0) = \mathbb{E}_D[\hat f]$, the average prediction at $x_0$ over
training sets. Expectations below are over $D$ and the test noise jointly.

Split off the noise first:

$$
\mathbb{E}\big[(\varepsilon + f(x_0) - \hat f)^2\big]
= \mathbb{E}[\varepsilon^2] + \mathbb{E}_D\big[(f(x_0) - \hat f)^2\big]
+ 2\,\mathbb{E}[\varepsilon]\,\mathbb{E}_D\big[f(x_0) - \hat f\big] .
$$

The cross term vanishes because the test noise is mean-zero and independent of
$D$, leaving $\sigma^2 + \mathbb{E}_D[(f(x_0) - \hat f)^2]$. Now add and
subtract $\bar f(x_0)$ inside the remaining term:

$$
\mathbb{E}_D\big[(f(x_0) - \bar f(x_0) + \bar f(x_0) - \hat f)^2\big]
= \big(f(x_0) - \bar f(x_0)\big)^2 + \mathbb{E}_D\big[(\bar f(x_0) - \hat f)^2\big] ,
$$

since that cross term carries the factor $\mathbb{E}_D[\bar f(x_0) - \hat f] = 0$
by the definition of $\bar f$. That is the identity. Integrating against the
marginal of $X$ gives the aggregate form, with $\sigma^2$ replaced by
$\mathbb{E}[\sigma^2(X)]$ if the noise is heteroscedastic.

Both steps used the fact that squared error is a quadratic form, so mean-zero
cross terms disappear. Nothing comparable holds for 0-1 loss: there, variance
around a systematically wrong prediction can _reduce_ error, because a noisy
estimate sometimes lands on the correct side of the decision boundary. Unified
decompositions have been proposed for 0-1 and log loss, but they require a
loss-specific definition of the central prediction, and the terms no longer
simply add.

## Assumptions and requirements

The derivation needs the test noise to be mean-zero and independent of the
training set. If the test point leaks into training, or labels are correlated
across the split, the first cross term survives and the identity is false.

It needs $\hat f_D(x_0)$ to have a finite second moment over training sets. This
is not automatic. Minimum-norm least squares with the feature count near the
sample size has near-singular Gram matrices and a variance term that can be
enormous — which is exactly where the double-descent peak sits.

For randomised procedures the expectation must run over the joint randomness of
the sample _and_ the algorithm: initialisation, minibatch order, bagging draws,
dropout masks. Vary the seed only and you measure something narrower than the
variance in the identity.

Train and test must come from the same distribution, and the sample must be
i.i.d. from it; the learning-theory treatments make this explicit because
without it no finite-sample statement about unseen data is available at all.
Under covariate shift the identity still holds pointwise, but $\bar f$ is the
average under the _training_ distribution, so shift hides inside the bias term
rather than appearing as a fourth one.

Finally, the whole decomposition is relative to a fixed $n$. "This model has high
variance" without a stated sample size is not a claim.

## Uses and applicability

The most useful thing it buys is a triage rule. Low training error with a large
gap to test error points at variance: gather more data, regularise, average more
models. High error on both points at bias: more data will not help, and knowing
that before labelling another hundred thousand examples is worth real money.

It guides ensembling: bagging and random forests target variance by averaging
decorrelated low-bias members, boosting targets bias by fitting stage-wise. It
is the standard justification for shrinkage estimators, and it is how a
complexity knob — $k$ in $k$-NN, tree depth, ridge $\lambda$ — is discussed.

Reach for it less when the loss is not squared error, when the error is
dominated by distribution shift rather than sampling variability, or when
reasoning about very large interpolating networks, where the classical curve is
not what is observed.

## Limitations and common mistakes

**You cannot measure the split from one training run.** Cross-validation
estimates total error, not its decomposition; separating bias from variance
needs repeated resampling, and those estimates are themselves noisy.

**The U-shaped curve is not a theorem.** The classical story — error falls then
rises as complexity grows — describes particular families of estimators, not all
of them. Double descent is the empirical observation that past the interpolation
threshold, roughly where a model first fits the training data exactly, test
error can fall again, sometimes below the earlier minimum. It has been
documented as a function of model size, of training epochs, and of training-set
size, where near the threshold more data can hurt. What is established: the
phenomenon is real and reproducible under specific conditions, and it is
analysable in linear and random-feature models. It does not contradict the
decomposition, which remains an exact identity; what it refutes is the folk
premise that variance rises monotonically with parameter count. Analyses of the
interpolating regime find variance to be unimodal, peaking at the threshold. What
is not settled is which notion of complexity should index the horizontal axis, and
how much of the peak survives well-tuned regularisation — there is evidence that
good ridge tuning removes it.

**Statistical bias is not dataset or social bias.** Same word, unrelated concept.

**Bias is signed and pointwise.** A procedure can aim high in one region and low
in another; those do not cancel in the aggregate, because the term is squared
before averaging.

**"Regularisation trades bias for variance" is a tendency, not an identity.** A
better-matched inductive bias — weight sharing for images, say — can lower
variance and bias at once relative to an unstructured model of the same size.

## Variants and alternatives

The **approximation-estimation decomposition** of learning theory splits excess
risk into the gap between the best predictor in the class and the best possible
one, plus the gap between what the algorithm returned and the best in class. It
works for any loss and underpins uniform-convergence analysis, but it is not the
same split: approximation error is a deterministic property of the class,
whereas bias involves the dataset-averaged output of a procedure, which need not
lie in the class.

The **bias-variance-covariance decomposition** extends the identity to an
average of $M$ predictors, where the variance term shrinks like $1/M$ but a
covariance term does not — the formal reason decorrelating ensemble members is
the whole game in bagging.

The **optimism** framing writes in-sample error as training error plus a
correction $\frac{2}{n}\sum_i \operatorname{Cov}(\hat y_i, y_i)$, which gives
effective degrees of freedom, Mallows' $C_p$ and AIC. It buys a computable
estimate of the gap and costs generality.

**Uniform convergence bounds** are distribution-free and apply to any bounded
loss, at the price of worst-case looseness. The **Bayesian** stance declines the
split: average over the posterior rather than choosing one estimator, and the
object of interest is the posterior predictive, not an estimator's error.

## History and attribution

The identity that mean squared error equals variance plus squared bias is
classical mathematical statistics and predates machine learning; it belongs to
no single paper. Its use as a diagnostic for supervised learning, and the phrase
"bias/variance dilemma", entered neural-network research through Geman,
Bienenstock and Doursat in 1992, who argued that the networks of the day needed
impractically large samples because their variance was high, and that useful
learning requires built-in structure rather than generic flexibility. The
textbook treatments that made the $k$-NN and ridge calculations standard came
through the statistical-learning literature of the following decade. Double
descent is recent by comparison, from around 2019, and its theory is still
confined largely to linear and random-feature models.

## Sources

_The Elements of Statistical Learning_ carries the decomposition, the exact
$k$-NN formula used in the worked example, the optimism and effective-degrees-of-freedom
material, and the bagging analysis. Murphy's _Probabilistic Machine Learning_
states the decomposition and is explicit that the tradeoff is a property of
squared loss rather than of learning in general. Shalev-Shwartz and Ben-David
supply the approximation-estimation view and the sampling assumptions any
finite-sample statement requires. Goodfellow, Bengio and Courville connect
capacity, underfitting and overfitting to the two terms, and give the practical
methodology for deciding what to change next.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first — expectation,
variance and independence are the whole toolkit the derivation uses.
[Frequentist Inference](./frequentist-inference.md) is where bias and variance
of an estimator are defined in their original setting, before any of this is
about prediction.

From here, Generalization treats the same question without committing to
squared loss; VC Dimension and PAC Learning give the distribution-free,
worst-case alternative account; Random Forests is the clearest engineered
attack on the variance term. For the regime where the classical curve fails,
[High-Dimensional Statistics](./high-dimensional-statistics.md) supplies the
proportional-asymptotics tools the analyses of interpolation are built from.
