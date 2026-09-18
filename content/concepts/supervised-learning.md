---
concept_id: concept.learning.supervised_learning
title: Supervised Learning
slug: /concepts/supervised-learning
aliases:
  - learning with a teacher
kind: concept
tier: 1
review_state: generated-draft
summary: The paradigm in which a predictor is fitted to labelled input-output pairs with the goal of scoring well on new inputs drawn from the same distribution, not on the examples it was shown.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: The setup is an unknown joint distribution over inputs and labels, and every quantity that matters — risk, the i.i.d. sample, the Bayes error — is an expectation under it.
  - type: supported_by
    target: concept.probability.concentration_inequalities
    note: The reason a finite training sample says anything about future error is that empirical means concentrate around their expectations, which is what turns empirical risk minimisation into a guarantee.
  - type: contrasts_with
    target: concept.learning.unsupervised_learning
    note: Both fit structure to data, but unsupervised learning has no target variable and therefore no external loss to minimise, which changes what "correct" can even mean.
  - type: prerequisite_of
    target: concept.learning.transfer_learning
    note: Transfer learning reuses a predictor fitted on one labelled task for another, so a reader needs the source task's hypothesis class, loss and risk before the transfer has anything to transfer.
sources:
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - definition
      - formal-treatment
      - assumptions-and-requirements
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
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.rosenblatt1958.perceptron
    title: 'The Perceptron: A Probabilistic Model for Information Storage and Organization in the Brain'
    url: https://psycnet.apa.org/doi/10.1037/h0042519
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Dataset shift and domain adaptation
    reason: No registry source is devoted to distribution shift, so the claim that accuracy degrades once the deployment distribution moves away from the training one is argued here from the i.i.d. assumption rather than from measured shift benchmarks.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Supervised learning** is the problem of picking a function $h : \mathcal{X} \to \mathcal{Y}$ out of
a declared set of candidates, using a finite sample of labelled pairs $(x_i, y_i)$, so as to minimise
the expected loss of $h$ on *future* pairs from the same unknown distribution. Three things are fixed
before any fitting happens: a **hypothesis class** $\mathcal{H}$, the functions the learner may
return; a **loss** $\ell(\hat{y}, y)$, what a wrong answer costs; and the process that sampled the
data. The learner can evaluate its loss only on the sample it holds. The quantity it cares about is
an expectation it can never compute.

## Why it matters

Supervised learning is the form most working machine learning takes: spam classification, credit
scoring, speech transcription, demand forecasting, the last layer of nearly every model that ends in
a decision. Its deeper contribution is that it makes "is this model any good?" a question with a
number behind it, so that two models can be compared and a regression can be caught.

It also separates two failure modes that are indistinguishable on the training set: a model that has
not learned the pattern and one that has memorised the sample can report the same training loss.
Only held-out data tells them apart, which is why the evaluation protocol is substance rather than
bureaucracy.

## Intuition

The training set is a stack of practice problems with the answers printed at the back. The risk is
your score on the real exam, which you do not see until it is too late to study. Memorising the
answer key scores perfectly on the practice and teaches nothing, so the only honest check is a paper
you have never looked at.

Where the analogy breaks matters more than where it holds. The theory assumes the exam is drawn from
the same pool as the practice problems. Deployment rarely honours that: populations drift, and a
model's own predictions can change who shows up. Nothing in supervised learning covers that case,
and pretending otherwise is the standard way people are surprised by a model that tested well.

## Concrete example

Eight soil samples, one feature (pH), and a binary label for whether a crop established. The
generating rule is "$1$ for pH in $[5.5, 7.5]$", and the reading at pH 6.0 was mislabelled:

| pH | 4.5 | 5.0 | 5.5 | 6.0 | 6.5 | 7.0 | 7.5 | 8.0 |
|----|-----|-----|-----|-----|-----|-----|-----|-----|
| y  | 0   | 0   | 1   | 0   | 1   | 1   | 1   | 0   |

Take $\mathcal{H}$ to be the thresholds $h_\theta(x) = \mathbb{1}[x \ge \theta]$ and $\ell$ to be
0–1 loss. Empirical risk minimisation is then a one-line search:

```python
data = [(4.5, 0), (5.0, 0), (5.5, 1), (6.0, 0),
        (6.5, 1), (7.0, 1), (7.5, 1), (8.0, 0)]

def risk(theta):
    return sum((x >= theta) != (y == 1) for x, y in data) / len(data)

print(min((risk(t), t) for t in [4.75, 5.25, 6.25, 6.75, 7.75]))  # (0.25, 5.25)
```

The best threshold, $\theta = 5.25$, gets two of eight wrong: it calls pH 6.0 a success when the
label says otherwise, and pH 8.0 a success when it was not. Now enlarge the class to unions of
intervals. The hypothesis "$1$ on $[5.4, 5.6] \cup [6.4, 7.6]$, else $0$" has **zero** empirical
risk — it carves a gap around the single point at 6.0 and excludes 8.0. It is a strictly better fit
and a worse predictor: the 6.0 label was noise, and on a fresh sample at pH 6.2 the interval model
answers $0$ where the threshold model answers $1$, correctly. The larger class did not learn more.
It absorbed one wrong label and paid for it on the next observation.

## Formal treatment

Let $\mathcal{D}$ be an unknown distribution over $\mathcal{X} \times \mathcal{Y}$ and let the
training sample $S = ((x_1, y_1), \dots, (x_m, y_m))$ be drawn i.i.d. from $\mathcal{D}$. For a loss
$\ell : \mathcal{Y} \times \mathcal{Y} \to [0, 1]$, define the **risk** and the **empirical risk**

$$
L_{\mathcal{D}}(h) = \mathbb{E}_{(x, y) \sim \mathcal{D}}\big[\ell(h(x), y)\big],
\qquad
L_S(h) = \frac{1}{m} \sum_{i=1}^{m} \ell(h(x_i), y_i).
$$

Empirical risk minimisation returns $\hat{h} \in \arg\min_{h \in \mathcal{H}} L_S(h)$. Writing
$L^{\ast} = \inf_h L_{\mathcal{D}}(h)$ over all measurable $h$ (the **Bayes risk**), the excess risk
splits:

$$
L_{\mathcal{D}}(\hat{h}) - L^{\ast}
= \underbrace{\Big(L_{\mathcal{D}}(\hat{h}) - \min_{h \in \mathcal{H}} L_{\mathcal{D}}(h)\Big)}_{\text{estimation}}
+ \underbrace{\Big(\min_{h \in \mathcal{H}} L_{\mathcal{D}}(h) - L^{\ast}\Big)}_{\text{approximation}} .
$$

Enlarging $\mathcal{H}$ shrinks the approximation term and inflates the estimation term. That
trade-off is the whole game, and the interval class above is it in miniature.

The estimation term is controlled by uniform convergence. For a finite class, Hoeffding's inequality
plus a union bound over $\mathcal{H}$ gives, with probability at least $1 - \delta$ over the draw of
$S$, simultaneously for every $h \in \mathcal{H}$,

$$
\big|L_S(h) - L_{\mathcal{D}}(h)\big| \le \sqrt{\frac{\log(2|\mathcal{H}| / \delta)}{2m}},
$$

hence $L_{\mathcal{D}}(\hat{h}) \le \min_{h \in \mathcal{H}} L_{\mathcal{D}}(h) + 2\varepsilon$. For
infinite classes the $\log|\mathcal{H}|$ is replaced by a capacity measure such as the VC dimension.

This also explains the **train/validation/test** discipline exactly. Validation error is used to
*choose* among candidates, so the chosen model's validation score inherits the union-bound penalty
over everything you tried and is optimistic. A test set touched once evaluates a single hypothesis
fixed before the data was seen, so no union bound is needed and plain Hoeffding applies: with
probability $1 - \delta$ on a fresh sample of size $n$,
$|L_{\text{test}}(h) - L_{\mathcal{D}}(h)| \le \sqrt{\log(2/\delta) / (2n)}$. The moment you look at
the test set and change something, that factor of one becomes a factor of however many things you
tried, and the guarantee degrades silently.

## Assumptions and requirements

Four hypotheses carry the results above, and each fails in a recognisable way.

*Identically distributed train and test data.* The bounds compare $L_S$ to $L_{\mathcal{D}}$ for one
$\mathcal{D}$. Under distribution shift there are two distributions and the inequality says nothing
about the second — not a loose bound, no bound.

*Independence.* Time series, repeated measurements of one patient, and multiple crops from one
field all break it. The effective sample size is the number of independent groups, not of rows, so
a random row-level split leaks information across the boundary and inflates the estimate.

*A hypothesis class fixed in advance.* $\mathcal{H}$ must not depend on $S$. Choosing features by
inspecting all the labels and only then splitting violates this, and the resulting estimate can be
arbitrarily optimistic.

*A bounded, decision-relevant loss.* The $[0, 1]$ range is what Hoeffding needs; unbounded losses
need heavier-tailed arguments. More practically, $\ell$ must encode the real cost, because
minimising the wrong loss well is still minimising the wrong thing.

Label noise is not an assumption you can restore by working harder. If the conditional
$\eta(x) = \Pr(y = 1 \mid x)$ is strictly between 0 and 1, the Bayes risk is positive and no
hypothesis, in any class, at any sample size, drives error to zero.

## Uses and applicability

Reach for supervised learning when labels exist or can be bought, when the deployment population
resembles the one sampled, and when the task is genuinely prediction. It is the right tool for
mapping a fixed input to a known target and the wrong one for three common situations.

When labels are expensive or absent, the label itself is the bottleneck, and semi-supervised, active
or self-supervised strategies buy more than a better classifier will. When the system acts and its
actions change the data it later sees, the i.i.d. assumption is violated by construction and the
problem is sequential decision-making, not prediction. When the question is "what happens if we
intervene?", a supervised model answers a different question well: it estimates a conditional
distribution, which reflects how treatment was historically assigned rather than what a new policy
would cause.

## Limitations and common mistakes

The most persistent misconception is that the objective is to fit the training data. It is not:
training loss is a means, and a class rich enough to drive it to zero has usually bought that with
estimation error. The paired misconception is that a high training-validation gap always indicates
overfitting — it also appears when the split leaked, when the validation set is tiny, or when the
two halves are not exchangeable.

Leakage is the most common and most embarrassing failure. Selecting features, normalising, or
imputing using statistics computed over the whole dataset before splitting puts test information
into the fitting procedure; the resulting cross-validation number can look excellent while the model
is worthless. Preprocessing has to be refitted inside each fold.

Reusing the test set is the slow version of the same error. Every decision made after looking at it
consumes a little of its independence, which is the concrete reason to touch it once.

Accuracy on imbalanced data misleads: at 1% positives, predicting "negative" scores 99%. Pick a loss
and a metric that reflect the asymmetric cost before you start.

Finally, the two assumptions violated most often in practice are label noise and distribution shift.
Noisy labels put a floor under achievable error and, worse, make model comparison noisy near that
floor. Shift means the number you measured describes a world that no longer exists — and, because
nothing in the training loop can detect it, it usually surfaces as unexplained degradation weeks
after deployment.

## Variants and alternatives

Within the paradigm, the target type gives **regression** (real-valued $y$, squared or absolute
loss), **classification** (0–1 or cross-entropy loss), **ranking** and **structured prediction**
(where $y$ is a sequence, tree or segmentation). The objective varies too: **regularised ERM** adds a
penalty $\lambda R(h)$ that trades a little fit for less variance, **structural risk minimisation**
makes that trade explicit across a nested family of classes, and **maximum likelihood** is ERM with
log loss, so probabilistic modelling and risk minimisation are the same computation described in two
vocabularies. **Distributionally robust** objectives minimise the worst case over a neighbourhood of
the empirical distribution, which buys some shift tolerance at the cost of conservatism.

Where full labelling is impractical, **semi-supervised** learning adds unlabelled data,
**weak** or **noisy supervision** uses cheap imperfect labels, **active learning** chooses which
points to label, and **positive-unlabelled** learning handles the case where only positives are
observed. As different paradigms, unsupervised learning drops the target entirely, self-supervised
learning manufactures targets from the input so the supervised machinery runs without annotation,
and reinforcement learning replaces labels with rewards that arrive late and depend on the actions
taken.

## History and attribution

The idea has several independent origins rather than one inventor. Least-squares regression from
observed pairs long predates computing, and statistical discriminant analysis arrived decades before
the term "supervised learning" existed; the phrase itself comes from the mid-twentieth-century
pattern-recognition and cybernetics literature, and I would not confidently attribute it to one
author.

The algorithmic lineage is clearer. Rosenblatt's perceptron (1958), developed as a probabilistic
model of information storage in the brain, learns a linear classifier by correcting its weights on
labelled examples, and is the ancestor of the error-driven fitting loop still in use. The
statistical framing — hypothesis class, risk, uniform convergence — came from Vapnik and
Chervonenkis's work on the convergence of empirical frequencies, and the computational framing from
Valiant's PAC model, which asked what is *efficiently* learnable rather than merely learnable in the
limit. Shalev-Shwartz and Ben-David's bibliographic remarks trace those two threads and their
merger into the modern treatment.

## Sources

**Understanding Machine Learning** is the source for the formal skeleton: hypothesis class, the
realizability and i.i.d. assumptions, ERM, the estimation-approximation split, PAC learning and the
uniform-convergence bounds, together with the historical remarks behind them. **The Elements of
Statistical Learning** is the source for practice — the bias-variance trade-off, model selection,
cross-validation and its well-known wrong version, and the catalogue of supervised methods that
compete with each other. **Deep Learning**, chapter 5, states the i.i.d. assumptions plainly and
connects capacity, underfitting and overfitting to the training-set/test-set protocol used in
modern practice. **The Perceptron** is the primary source for the earliest error-driven supervised
learning rule, in the author's own framing.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first: risk is an expectation, the sample is a
random object, and "generalisation" is a statement about a distribution you never observe. Then
[Concentration Inequalities](./concentration-inequalities.md) supplies the machinery — Hoeffding and
its relatives — that makes the empirical risk a usable estimate of the true one, and is the honest
answer to why any of this works.

From here, [Frequentist Inference](./frequentist-inference.md) and
[Bayesian Inference](./bayesian-inference.md) offer two ways to think about what the fitted
predictor claims, and [High-Dimensional Statistics](./high-dimensional-statistics.md) covers the
regime where the number of parameters is comparable to the number of examples and classical
intuition about overfitting stops applying. On the optimisation side,
[Convex Optimization](./convex-optimization.md) covers the case where the empirical risk has a
unique minimum you can actually find, and [Stochastic Optimization](./stochastic-optimization.md)
covers minimising it by sampling, which is what training at scale really does. For getting a fitted
model into use, see [Deployment](./deployment.md) and
[Experiment Tracking](./experiment-tracking.md) — the latter being where the discipline of touching
the test set once is either enforced or quietly lost.
