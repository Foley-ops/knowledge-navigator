---
concept_id: concept.machine_learning.pac_learning
title: PAC Learning
slug: /concepts/pac-learning
aliases:
  - probably approximately correct learning
kind: concept
tier: 1
review_state: generated-draft
summary: Valiant's criterion for when a class of hypotheses is learnable at all — one algorithm, fixed before the data distribution is known, must reach error at most epsilon with probability at least one minus delta from a sample size polynomial in both.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: equivalent_under
    target: concept.machine_learning.vc_dimension
    note: For binary classification under 0-1 loss, a class is PAC learnable exactly when its VC dimension is finite, so the two properties are the same property stated combinatorially and statistically.
  - type: requires
    target: concept.probability.concentration_inequalities
    note: Every PAC sample-complexity bound is proved by bounding the deviation of an empirical error from its mean and then paying a union bound, so a reader without Hoeffding's inequality cannot follow a single proof here.
  - type: contributes_to
    target: concept.machine_learning.generalization
    note: PAC supplies the first precise, distribution-free definition of what a generalization guarantee even asserts, and the vocabulary of sample complexity that later accounts still use.
  - type: contrasts_with
    target: concept.probability.bayesian_inference
    note: PAC quantifies over every distribution and asks for a worst-case guarantee with no prior, where Bayesian inference fixes a prior over targets and reports a posterior, so the two disagree about what an assumption is allowed to be.
sources:
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.vershynin.high_dimensional_probability
    title: Roman Vershynin, High-Dimensional Probability
    url: https://www.math.uci.edu/~rvershyn/papers/HDP-book/HDP-book.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Cryptographic hardness of efficient PAC learning
    reason: The separation between how many examples a class needs and how much computation it needs rests on reductions from cryptographic assumptions, which no source in the registry states and no page in this corpus explains.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
  - label: Optimal realizable sample complexity of PAC learning
    reason: The removal of the logarithmic factor from the realizable upper bound, by an improper majority-vote learner rather than by empirical risk minimisation, postdates the textbooks in the registry, which still present the bound with that factor.
    sections:
      - formal-treatment
      - variants-and-alternatives
---

## Definition

**PAC learning** — probably approximately correct learning — is a definition of
learnability that applies to a *hypothesis class*, not to an algorithm and not
to a dataset. A class $\mathcal H$ of functions from a domain $\mathcal X$ to
$\{0,1\}$ is PAC learnable if there exists a learning algorithm $A$ and a
sample-size function $m_{\mathcal H}(\epsilon, \delta)$ such that for every
accuracy parameter $\epsilon$, every confidence parameter $\delta$, every
probability distribution $\mathcal D$ on $\mathcal X$ and every target in
$\mathcal H$, feeding $A$ at least $m_{\mathcal H}(\epsilon,\delta)$
independent examples yields a hypothesis whose error under $\mathcal D$ is at
most $\epsilon$, except on a set of samples of probability at most $\delta$.

Two words carry the weight. *Approximately*: the output is allowed error
$\epsilon$, not zero. *Probably*: the guarantee may fail with probability
$\delta$, because an unlucky sample can be unrepresentative and no finite
sample rules that out.

## Why it matters

Before 1984 there was no agreed answer to "has this system learned?" that was
both falsifiable and computational. PAC gave one, and with it the machinery to
prove that a class *cannot* be learned — which is the more useful half. It
converts vague questions about model capacity into a single number, the sample
complexity, that can be bounded above by an algorithm and below by an
adversary, and it makes explicit the thing practitioners rediscover every time
a model memorises its training set: low training error is evidence about future
error only to the extent that the class was too small to fit noise.

It also produced algorithms. Kearns and Valiant asked whether a learner barely
better than chance implies a learner of arbitrary accuracy; Schapire answered
yes by construction, and boosting is that answer.

## Intuition

Think of an opinion poll. Nobody can promise a poll is within three points of
the truth — the sample might be freakish — but one can promise it is within
three points nineteen times in twenty. PAC is that promise lifted from
estimating one number to choosing a whole function, with one extra demand: the
promise must hold for *every* population, since the learner is not told the
distribution.

The analogy breaks in an important place. In a poll you estimate a fixed
quantity, and the sampling error follows from a single concentration bound. A
learner *chooses* its hypothesis after seeing the data, so the hypothesis it
returns is correlated with the sample, and its empirical error is optimistically
biased. That is why PAC proofs bound the deviation *uniformly over the whole
class* rather than for one fixed function — and why the size of the class, not
the number of parameters, is what appears in the bound.

## Concrete example

Let $\mathcal X = \mathbb R^2$ and let $\mathcal H$ be the axis-aligned
rectangles: each hypothesis labels points inside some rectangle $1$ and
everything else $0$. The learner returns the tightest rectangle containing all
positive examples seen.

The analysis: let $R^\star$ be the target. The returned $R$ is contained in
$R^\star$, so all error is false negatives in $R^\star \setminus R$. Take four
strips inside $R^\star$, one along each edge, each of probability mass
$\epsilon/4$. If the sample hits every strip, the error region fits inside their
union and the error is at most $\epsilon$. A given strip is missed with
probability at most $(1-\epsilon/4)^m \le e^{-\epsilon m/4}$, so by a union
bound over four strips the learner fails with probability at most
$4 e^{-\epsilon m /4}$, which is below $\delta$ once
$m \ge (4/\epsilon)\ln(4/\delta)$.

With $\epsilon = \delta = 0.05$ that is $351$ examples — for a class with
infinitely many hypotheses, under any distribution whatsoever.

```python
import random

def tightest_fit(sample):                 # the learner
    pos = [p for p, y in sample if y == 1]
    if not pos:
        return None                       # predicts 0 everywhere
    xs, ys = [p[0] for p in pos], [p[1] for p in pos]
    return (min(xs), max(xs), min(ys), max(ys))

def inside(r, p):
    return r is not None and r[0] <= p[0] <= r[1] and r[2] <= p[1] <= r[3]

target = (0.2, 0.8, 0.2, 0.8)             # unknown to the learner

def draw(n):
    pts = [(random.random(), random.random()) for _ in range(n)]
    return [(p, int(inside(target, p))) for p in pts]

random.seed(0)
h = tightest_fit(draw(351))
test = draw(200_000)
print(sum(int(inside(h, p)) != y for p, y in test) / len(test))   # 0.0104
```

Over 2000 repetitions of this experiment the error averages about $0.011$ and
never exceeds $0.039$ — comfortably inside the promised $0.05$. The bound is
correct and loose, which is typical.

## Formal treatment

Write $L_{\mathcal D, f}(h) = \Pr_{x \sim \mathcal D}[h(x) \neq f(x)]$ for the
true error of $h$ against target $f$. The realizable definition is

$$
\exists A,\ \exists m_{\mathcal H} : (0,1)^2 \to \mathbb N \quad
\forall \epsilon, \delta \in (0,1) \quad \forall \mathcal D \quad
\forall f \in \mathcal H \quad \forall m \ge m_{\mathcal H}(\epsilon,\delta):
$$

$$
\Pr_{S \sim \mathcal D^m}\big[\, L_{\mathcal D, f}(A(S)) \le \epsilon \,\big]
\ \ge\ 1 - \delta .
$$

The quantifier order is the definition. $A$ and $m_{\mathcal H}$ are fixed
*before* $\mathcal D$ and $f$ are chosen, so neither may depend on them: this is
what "distribution-free" means. The inner probability is over the draw of the
sample $S$; the $\epsilon$ is over a fresh point from $\mathcal D$. Valiant's
framework adds that $m_{\mathcal H}$ be polynomial in $1/\epsilon$ and
$1/\delta$ (and, for a family $\{\mathcal H_n\}$, in the dimension $n$ and the
representation size of the target). **Efficient PAC learning** further demands
that $A$ run in time polynomial in those quantities and output a hypothesis
evaluable in polynomial time.

For a finite class, the union bound over hypotheses with error above $\epsilon$
gives $|\mathcal H| e^{-\epsilon m} \le \delta$, so

$$
m_{\mathcal H}(\epsilon, \delta) \le
\left\lceil \frac{\log(|\mathcal H| / \delta)}{\epsilon} \right\rceil .
$$

**Agnostic PAC** drops realizability: $\mathcal D$ is a joint distribution on
$\mathcal X \times \{0,1\}$, no hypothesis need be perfect, and the requirement
becomes $L_{\mathcal D}(A(S)) \le \min_{h \in \mathcal H} L_{\mathcal D}(h) +
\epsilon$ with probability $1-\delta$.

The **fundamental theorem of statistical learning** says that for binary
classification under 0-1 loss the following are equivalent: $\mathcal H$ has the
uniform convergence property; every empirical risk minimiser over $\mathcal H$
is an agnostic PAC learner; $\mathcal H$ is agnostic PAC learnable; $\mathcal H$
is PAC learnable; and $\mathcal H$ has finite VC dimension $d$. Quantitatively,
for absolute constants,

$$
m^{\text{agnostic}}_{\mathcal H}(\epsilon, \delta) =
\Theta\!\left(\frac{d + \log(1/\delta)}{\epsilon^{2}}\right),
\qquad
m^{\text{realizable}}_{\mathcal H}(\epsilon, \delta) =
O\!\left(\frac{d \log(1/\epsilon) + \log(1/\delta)}{\epsilon}\right).
$$

The change from $1/\epsilon^2$ to $1/\epsilon$ when the target is realizable is
the difference between a variance-limited and a consistency-limited problem.
The $\log(1/\epsilon)$ in the realizable bound is not an artefact of the proof —
there are classes on which empirical risk minimisation genuinely pays it — but
it is removable by a cleverer, improper learner, a fact established well after
the standard textbooks were written.

## Assumptions and requirements

The examples must be **independent and identically distributed** from a single
$\mathcal D$, and the same $\mathcal D$ must govern the test point. Drop
independence and the concentration step fails; let the distribution shift
between training and deployment and the guarantee says nothing at all, because
$\epsilon$ was measured under the training distribution.

$\mathcal H$ must be **fixed before the sample is seen**. Choosing the class
after looking at the data invalidates the union bound; this is the formal
statement of the sin of tuning on the test set.

The fundamental theorem's equivalence is specific to **binary labels and 0-1
loss**. For real-valued prediction, finite VC dimension is the wrong notion and
scale-sensitive complexity measures replace it; for multiclass problems with
large label sets, the characterisation is genuinely different and was settled
only recently. For uncountable $\mathcal H$ one also needs mild measurability
conditions so that the supremum of the deviation over the class is a random
variable at all.

Nothing requires the returned hypothesis to lie in $\mathcal H$. Allowing an
**improper** learner to output something else is not a technicality: it
sometimes converts an NP-hard problem into a polynomial-time one.

## Uses and applicability

Reach for PAC when the question is whether a class is learnable *in principle*,
when comparing the intrinsic difficulty of two hypothesis classes, or when you
need a guarantee that holds without assuming anything about the data source. It
is the right frame for lower bounds — the no-free-lunch theorem, which says no
learner succeeds on all classes, is a PAC statement — and it underwrites the
design pattern of fitting a restricted class and controlling its capacity, which
is how structural risk minimisation and, more loosely, regularisation-based
model selection are justified.

Do not reach for it to predict the test error of a particular trained network.
VC-style bounds for modern models exceed the size of any real training set by
orders of magnitude while the models generalise anyway, so the numbers are
vacuous even though the theorems are true.

## Limitations and common mistakes

The commonest misreading is treating $1-\delta$ as an accuracy: "correct 95% of
the time". It is not. $\delta$ is the probability that the *training sample* was
bad enough to break the guarantee; $\epsilon$ is the error rate on future data.
Two different randomness sources, two different parameters.

The second is believing that polynomial sample complexity implies a practical
algorithm. It does not. Sample complexity is information-theoretic;
computational complexity is separate, and the gap between them is where the
hardness lives. The sharpest textbook illustration is 3-term DNF: the class is
efficiently PAC learnable improperly, by representing each concept as a 3-CNF
formula, while learning it properly — returning an actual 3-term DNF — is
NP-hard. Stronger separations, where a class has small VC dimension yet no
efficient learner exists at all, follow from cryptographic assumptions.

The third is treating PAC learnability as a property of an algorithm or of a
dataset. It is a property of a class, quantified over all distributions, and
"my model is PAC" is not a meaningful sentence.

Finally, distribution-freeness cuts both ways. Because the bound must survive
the worst distribution, it is usually far from tight for the one you actually
have, and a loose bound is not evidence of a bad model.

## Variants and alternatives

**Agnostic PAC** removes realizability at the cost of a quadratically worse rate.
**Proper versus improper** learning fixes whether the output must lie in
$\mathcal H$. **Efficient PAC** adds the polynomial-time requirement.
**Distribution-specific PAC** fixes $\mathcal D$ in advance — often the uniform
distribution — making classes learnable that are hard in the distribution-free
model. **Exact learning with membership and equivalence queries** gives the
learner the power to interrogate the target rather than only observe samples.
The **mistake-bound (online) model** removes the distribution entirely and
counts errors on an adversarial sequence; it is characterised by the Littlestone
dimension rather than the VC dimension. **PAC-Bayes** bounds the error of a
distribution over hypotheses in terms of its divergence from a prior and gives
numerically non-vacuous bounds where VC arguments do not. **Rademacher
complexity** replaces the combinatorial VC term with a data-dependent one, and
**structural risk minimisation** turns capacity control into a model-selection
rule you can actually run.

## History and attribution

Leslie Valiant introduced the model in 1984 in "A Theory of the Learnable",
asking what could be acquired from examples *in polynomial time* — his concern
was knowledge acquisition in artificial intelligence, and the novelty was
insisting that learnability be a computational question rather than only a
statistical one. He received the Turing Award in 2010, this work prominent among
the reasons. The name "probably approximately correct" is generally credited to
Dana Angluin rather than to Valiant's paper itself.

The statistical half is older and independent. Vapnik and Chervonenkis, working
on the foundations of pattern recognition, proved uniform convergence of
empirical frequencies to probabilities in the early 1970s and introduced the
combinatorial parameter now called VC dimension. Blumer, Ehrenfeucht, Haussler
and Warmuth joined the two traditions at the end of the 1980s, showing that PAC
learnability and finite VC dimension are the same condition. Haussler, and
Kearns, Schapire and Sellie, extended the model to the agnostic setting in the
early 1990s. That the idea has two largely separate origins — Soviet statistical
learning theory and American complexity theory — is not a tidy story, and it
explains why the field carries two vocabularies for one set of results.

## Sources

*Understanding Machine Learning* is the canonical modern treatment and the
reference for essentially everything here: the definitions with their quantifier
order, the finite-class and rectangle examples, the fundamental theorem, the
hardness of proper 3-term DNF learning, PAC-Bayes, and the bibliographic notes
that place Valiant beside Vapnik and Chervonenkis. Vershynin's
*High-Dimensional Probability* supplies the probabilistic machinery underneath —
Hoeffding's inequality, the union bound, Sauer's lemma and the uniform law of
large numbers — and is the place to go if the proofs rather than the statements
are what you need. The *Deep Learning* book is the honest account of why these
bounds are not used numerically for large models. *The Elements of Statistical
Learning* covers VC dimension and structural risk minimisation from the model
selection side, which is where a practitioner is most likely to meet the theory.

## Prerequisites and next connections

Read [Concentration Inequalities](./concentration-inequalities.md) first — every
bound on this page is Hoeffding plus a union bound plus an argument for why one
may take a supremum over a class — and be comfortable with
[Probability Theory](./probability-theory.md) for the product measure
$\mathcal D^m$ that the outer probability is taken over.

From here, VC dimension is the natural next page: it supplies the finite
parameter that the fundamental theorem says PAC learnability is equivalent to.
[Computational Complexity](./computational-complexity.md) is what separates a
class you have enough data for from a class you can actually learn, and the
distinction between proper and improper learning lives entirely there.
[Bayesian Inference](./bayesian-inference.md) is the instructive contrast: it
buys sharper statements by assuming a prior that PAC refuses to assume, and
PAC-Bayes is the hybrid.
[High-Dimensional Statistics](./high-dimensional-statistics.md) carries the same
uniform-convergence machinery into estimation problems where the parameter count
grows with the sample.
