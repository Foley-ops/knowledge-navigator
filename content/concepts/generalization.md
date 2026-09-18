---
concept_id: concept.machine_learning.generalization
title: Generalization
slug: /concepts/generalization
aliases:
  - generalisation
kind: concept
tier: 1
review_state: generated-draft
summary: A predictor generalizes when its error on fresh data from the training distribution stays close to its error on the training sample, and why heavily overparameterised networks manage this is still unexplained.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: Risk is an expectation over an unknown distribution and the whole subject is stated in terms of i.i.d. sampling, so a reader without expectation and independence cannot follow the definitions here.
  - type: refined_by
    target: concept.machine_learning.vc_dimension
    note: VC dimension turns the informal idea that a hypothesis class can be "too rich to trust" into a combinatorial number that appears directly in a bound on the generalization gap.
  - type: contributes_to
    target: concept.machine_learning.pac_learning
    note: PAC learning is the formal framework built around exactly the demand described here, that low empirical risk should imply low true risk with high probability over the sample.
  - type: contrasts_with
    target: concept.machine_learning.bias_variance
    note: The bias-variance decomposition explains out-of-sample error by splitting it pointwise rather than by bounding a supremum over a class, and its classical U-shaped reading conflicts with what overparameterised models actually do.
sources:
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - definition
      - concrete-example
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
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: 'Zhang, Bengio, Hardt, Recht and Vinyals, Understanding deep learning requires rethinking generalization (ICLR 2017) — the random-label experiments'
    reason: The registry has no entry for this paper, and the random-label result is the single most load-bearing empirical fact on this page; the description of the experiment and of the vacuity of capacity bounds for large networks is stated from general knowledge and should be checked against the paper before this page leaves generated-draft.
    sections:
      - concrete-example
      - limitations-and-common-mistakes
      - history-and-attribution
  - label: Post-2015 generalization theory — double descent, non-vacuous PAC-Bayes bounds for neural networks, and norm-based capacity measures
    reason: No registered source covers the modern literature; the named phenomena and the claim that the field has no settled explanation are stated from general knowledge, and the attributions in those paragraphs are deliberately kept to what is uncontroversial rather than cited.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
  - label: VC dimension of piecewise-linear (ReLU) networks as a function of weight count and depth
    reason: Understanding Machine Learning gives VC bounds for classes in general but not the near-tight modern result for deep ReLU networks, so the statement about how capacity grows with parameter count is given only qualitatively here.
    sections:
      - formal-treatment
claims: []
---

## Definition

**Generalization** is the relationship between how a predictor performs on the
data it was fitted to and how it performs on data drawn afresh from the same
source. Fix a distribution $D$ over input-label pairs, a loss $\ell$, and a
predictor $h$. The quantity anyone cares about is the **true risk**

$$
R(h) \;=\; \mathbb{E}_{(x,y) \sim D}\big[\ell(h(x), y)\big],
$$

and the only quantity anyone can compute is the **empirical risk** on a sample
$S = \{(x_i, y_i)\}_{i=1}^{n}$ drawn i.i.d. from $D$,

$$
\hat{R}_S(h) \;=\; \frac{1}{n} \sum_{i=1}^{n} \ell(h(x_i), y_i).
$$

Their difference $R(h) - \hat{R}_S(h)$ is the **generalization gap**. Two senses
of the word circulate and they are not the same: "this model generalizes" can
mean the gap is small, or it can mean the true risk is small. A predictor that
outputs the constant $0$ has an almost perfect gap and is useless. Low risk needs
both a small gap and a class that contains something good.

## Why it matters

Empirical risk is free. A lookup table that stores the training set and answers
arbitrarily elsewhere has zero training error and no predictive content, so
training error on its own is never evidence that anything was learned. Every
piece of practical machinery in supervised learning — held-out validation sets,
early stopping, weight decay, data augmentation, cross-validation for model
selection, the discipline of not touching the test set — exists to manage the
gap rather than the training loss.

The theoretical stake is larger. A generalization bound is what converts a
statement about $n$ observed examples into a statement about the world, with a
quantified confidence. Without one, fitting a model is curve-drawing.

## Intuition

Two pictures, both useful, both leaky.

The first is the exam analogy: the training set is the practice problems, the
test distribution is the real exam, and memorising the practice answers does not
help. This is the picture most people arrive with, and it is the one modern deep
learning broke. Large networks *do* memorise — the same architecture and
optimiser that reach a few percent error on real labels can drive training error
to zero on entirely random labels — and yet they still generalize when the labels
are real. Memorisation and generalization turn out not to be exclusive.

The second picture is better: searching a large family of candidate functions
gives you many chances to fit the sample by luck. The more functions you are
willing to consider, the more likely one of them matches $n$ observations by
coincidence, so a bound must control the *worst* member of the class, not the one
you happened to pick. This is the uniform-convergence picture, and its own leak is
the reason the subject is unfinished: real training does not search the class
uniformly. Gradient descent from a small initialisation reaches a particular,
heavily biased subset of the parameter space, so the class that is effectively
searched is far smaller than the class that is nominally available — and nobody
has a fully satisfying way of saying how much smaller.

## Concrete example

Take a finite hypothesis class: all decision rules expressible as a lookup on
$20$ binary features, so $|\mathcal{H}| = 2^{20}$. With $n = 10{,}000$ labelled
examples and confidence $1 - \delta = 0.95$, the classical finite-class bound
gives, simultaneously for every $h \in \mathcal{H}$,

$$
\big|R(h) - \hat{R}_S(h)\big| \;\le\; \sqrt{\frac{\ln|\mathcal{H}| + \ln(2/\delta)}{2n}} .
$$

```python
import math

n, size, delta = 10_000, 2**20, 0.05
print(math.sqrt((math.log(size) + math.log(2 / delta)) / (2 * n)))  # 0.02962...
```

Three percentage points, and it holds for whichever hypothesis the learner
returns. That is a useful guarantee.

Now run the same reasoning on a convolutional network with ten million
parameters trained on the 50,000 images of CIFAR-10. Capacity-based bounds of
this shape scale with the number of parameters, so the square root exceeds $1$ by
orders of magnitude and the bound asserts only that the error rate is at most
$100\%$. It is **vacuous** — not wrong, just empty. Meanwhile the network's
actual test error is around five to ten percent. The bound and the observation
are in different worlds, and that distance is the central open problem of the
subject.

## Formal treatment

Let $\ell$ take values in $[0,1]$ and let $h$ be fixed *before* $S$ is drawn.
Hoeffding's inequality gives

$$
\Pr\big[\,|\hat{R}_S(h) - R(h)| \ge \varepsilon\,\big] \;\le\; 2 e^{-2 n \varepsilon^2}.
$$

An empirical risk minimiser is not fixed before $S$ — it is chosen using $S$ —
so this cannot be applied to it directly. A union bound over a finite class
$\mathcal{H}$ repairs that and yields the displayed bound of the previous
section, uniformly over the class. For infinite classes, Sauer's lemma bounds the
number of distinct labellings a class of VC dimension $d$ can produce on $n$
points by $O(n^d)$, and $\ln|\mathcal{H}|$ is replaced by a term of order $d$:
with probability at least $1 - \delta$,

$$
\sup_{h \in \mathcal{H}} \big|R(h) - \hat{R}_S(h)\big|
\;=\; O\!\left(\sqrt{\frac{d + \ln(1/\delta)}{n}}\right).
$$

Rademacher complexity replaces the combinatorial term with a distribution- and
sample-dependent one, $\mathbb{E}\,\sup_{h} \frac{1}{n}\sum_i \sigma_i \ell(h(x_i), y_i)$
for i.i.d. signs $\sigma_i \in \{\pm 1\}$, which measures how well the class fits
pure noise on the actual data and is therefore tighter in principle.

Every bound of this family is a supremum over the class, uniform in the
distribution, and this is precisely where the looseness lives. For deep networks
the relevant capacity grows with the number of weights, which for any practical
architecture puts $d \gg n$ and makes the right-hand side larger than one.

## Assumptions and requirements

The i.i.d. assumption does the heaviest lifting: train and test data are drawn
independently from one fixed $D$. Drop it and nothing above survives — deployment
under distribution shift is outside the theory entirely, and a model with a
certified two-point gap on its own distribution can fail arbitrarily badly on a
different one.

The class, and the complexity term measuring it, must be fixed before the sample
is seen. Choosing the architecture after looking at the test set silently
enlarges the class being union-bounded over, which is why repeated evaluation
against a fixed benchmark erodes its validity.

Boundedness of the loss is what Hoeffding needs; unbounded losses require a tail
condition such as sub-Gaussianity. And the gap is not the risk: a bound on the
gap tells you nothing unless some $h \in \mathcal{H}$ has low risk to begin with.
Finally, the no-free-lunch theorem rules out any distribution-free guarantee that
holds without restricting the class — learning always requires an inductive bias
of some kind.

## Uses and applicability

The reliable practical tool is not a uniform bound at all: it is a held-out test
set. Because the final model is fixed before that set is touched, Hoeffding
applies to it alone, with no union bound and no capacity term. On $10{,}000$ test
points at an error rate of $7\%$, the normal-approximation interval is
$\pm 1.96\sqrt{0.07 \times 0.93 / 10{,}000} \approx \pm 0.5$ percentage points.
That is a tight, honest guarantee obtained by measurement. Cross-validation plays
the same role when data are scarce, at the cost of reusing data across folds.

The classical theory is still worth carrying for its shape rather than its
numbers: error falls like $1/\sqrt{n}$, restricting the class buys guarantees,
and more candidate functions demand more data. Use it to reason about sample
sizes and to justify regularisation. Do not use it to select neural-network
hyperparameters, and do not quote a VC bound as a safety argument.

## Limitations and common mistakes

The largest limitation is stated plainly: **there is no complete theory of why
overparameterised networks generalize.** Zhang and co-authors showed in 2017 that
standard image networks fit randomly relabelled training sets perfectly, which
means any explanation resting only on the capacity of the model class is dead on
arrival — the same class fits pure noise. Whatever explains generalization must
involve the data, the optimiser, or both.

Related, the classical U-shaped picture is empirically incomplete. Test error can
fall, rise near the point where the model first interpolates the training data,
and then fall again as the model grows further. This "double descent" behaviour
has been observed across model families; how far it generalizes and what drives
it are not settled.

Common mistakes worth naming. Treating a vacuous bound as a refutation of the
theory: a loose upper bound is not a false one. Treating a small gap as evidence
of deployment readiness: that requires the i.i.d. assumption, which deployment
usually violates. Reusing a test set across dozens of experiments and reading the
final number as unbiased. Equating overfitting with parameter count, when the
same parameter count with different regularisation, data, or initialisation
behaves differently. And presenting empirical regularities of modern practice —
bigger models generalizing better, for instance — as if they were theorems; they
are observations on particular benchmarks and model families.

## Variants and alternatives

**Uniform convergence** in its VC, Rademacher and covering-number forms is the
classical route: distribution-free and algorithm-independent, which is exactly
what makes it worst-case and loose. There is a published argument that bounds of
this form cannot in principle explain the overparameterised regime; it is
contested.

**PAC-Bayes** bounds the risk of a distribution over predictors in terms of a KL
divergence from a prior, and is the one family that has produced non-vacuous
numerical bounds for trained neural networks. **Algorithmic stability** bounds
the gap by how much the output changes when one training example is swapped,
making the guarantee a property of the algorithm rather than of the class.
**Norm- and margin-based** measures replace parameter counting with the size of
the weights and the confidence of the predictions.

The genuinely different approach is Bayesian: instead of bounding a gap, compare
models by marginal likelihood, where an automatic Occam factor penalises models
that spread their predictive mass thinly. It buys a coherent account of model
complexity and costs you a prior and an intractable integral.

## History and attribution

The mathematical core is due to Vladimir Vapnik and Alexey Chervonenkis, who
proved uniform convergence of empirical frequencies to probabilities around 1971
while working on pattern recognition, and introduced the growth function and the
dimension that carries their names. Leslie Valiant's 1984 framework added the
computational side, asking not only whether learning is statistically possible
but whether it is efficient; the resulting PAC formulation is the one most
courses teach. Rademacher complexity entered learning theory in the early 2000s
as a sharper, data-dependent replacement for the combinatorial arguments.

Independently, statistics had been estimating out-of-sample error directly for
decades; cross-validation was placed on a formal footing by Stone and Geisser in
the 1970s, and the concern with the optimism of training error is older still.

The modern chapter opens in 2017, when Zhang, Bengio, Hardt, Recht and Vinyals
published the random-label experiments. It is fair to say the field has been
rebuilding its account of generalization since, and that no replacement is yet
agreed.

## Sources

Shalev-Shwartz and Ben-David is the reference for the definitions, the
finite-class and VC bounds, the no-free-lunch theorem and the historical notes on
Vapnik, Chervonenkis and Valiant. Hastie, Tibshirani and Friedman is the
statistician's treatment of the same problem: the optimism of the training error,
cross-validation, and what model selection actually does. The Goodfellow, Bengio
and Courville book frames generalization for neural networks and is good on
capacity and regularisation, though it predates most of the debate described
above. MacKay is where the Bayesian alternative and the Occam factor are
developed carefully.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first — risk is an expectation
and the whole subject is about sampling. [Concentration
Inequalities](./concentration-inequalities.md) supplies Hoeffding and its
relatives, which are the engine under every bound here, and
[Frequentist Inference](./frequentist-inference.md) explains the confidence
statement a test-set interval is making.

From here, VC dimension and PAC learning make the capacity argument precise, and
the bias-variance decomposition offers the other classical account of
out-of-sample error. [High-Dimensional
Statistics](./high-dimensional-statistics.md) is the natural next step for the
regime where parameters outnumber samples, and
[Bayesian Inference](./bayesian-inference.md) for the alternative in the last
section.
