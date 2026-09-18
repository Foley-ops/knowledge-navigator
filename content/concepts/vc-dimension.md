---
concept_id: concept.machine_learning.vc_dimension
title: VC Dimension
slug: /concepts/vc-dimension
aliases:
  - Vapnik-Chervonenkis dimension
kind: mathematical-object
tier: 1
review_state: generated-draft
summary: A single integer attached to a class of binary classifiers — the size of the largest point set it can label in every possible way — that decides, with no reference to any data distribution, whether and how fast the class can be learned.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: contributes_to
    target: concept.machine_learning.pac_learning
    note: Finiteness of the VC dimension is the exact condition under which a binary hypothesis class is PAC learnable, and the integer itself sets the sample complexity.
  - type: guarantees
    target: concept.machine_learning.generalization
    note: A finite VC dimension forces empirical error to converge to true error uniformly over the class, so any hypothesis with low training error generalises.
  - type: requires
    target: concept.probability.concentration_inequalities
    note: The bound is proved by symmetrisation followed by a Hoeffding-type tail bound and a union bound over the finitely many behaviours Sauer's lemma leaves, so the probabilistic machinery has to come first.
  - type: contrasts_with
    target: concept.machine_learning.bias_variance
    note: Both describe the cost of capacity, but VC theory gives a worst-case bound uniform over all distributions where the bias-variance decomposition is an exact identity for one fixed distribution and loss.
sources:
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
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
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: VC dimension of piecewise-linear neural networks
    reason: The near-tight scaling of the VC dimension of a ReLU network in its weight count and depth is a specific published result, and no source in the registry states it; the page therefore describes the scaling qualitatively and derives the vacuity from the weaker fact that the VC dimension is at least the number of points the network can fit arbitrarily.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

Let $\mathcal{X}$ be a domain and $\mathcal{H}$ a set of functions $h : \mathcal{X} \to \{0,1\}$.
For a finite set $C = \{x_1, \dots, x_m\} \subseteq \mathcal{X}$, the **restriction** of
$\mathcal{H}$ to $C$ is the set of label patterns the class can produce on those points,

$$
\mathcal{H}_C \;=\; \bigl\{\, (h(x_1), \dots, h(x_m)) \;:\; h \in \mathcal{H} \,\bigr\}
\;\subseteq\; \{0,1\}^m .
$$

$\mathcal{H}$ **shatters** $C$ when $\mathcal{H}_C = \{0,1\}^m$: every one of the $2^m$ ways of
labelling those $m$ points is realised by some member of the class. The
**Vapnik–Chervonenkis dimension** $\mathrm{VCdim}(\mathcal{H})$ is the supremum of $|C|$ over
all shattered $C$, and $\infty$ if arbitrarily large sets are shattered.

Three things follow from the wording and are worth fixing immediately. It is a supremum over
sets, so $\mathrm{VCdim}(\mathcal{H}) = d$ means _some_ set of size $d$ is shattered, not every
one. It is a property of the hypothesis class alone — no data, no distribution, no learning
algorithm enters. And it can be finite even when $\mathcal{H}$ is uncountable.

## Why it matters

It collapses a question about an infinite class into one integer. The obvious generalisation
argument — a union bound over hypotheses — works only for finite $\mathcal{H}$ and says nothing
about the uncountably many halfspaces in $\mathbb{R}^d$. VC dimension explains why that class is
nevertheless easy to learn while a class with the same number of real parameters can be impossible.

The payoff is the fundamental theorem of statistical learning: for binary classification under
0-1 loss, a class is agnostic PAC learnable _if and only if_ its VC dimension is finite, empirical
risk minimisation is a successful learner whenever it is, and the number of samples needed is
$\Theta\bigl((d + \log(1/\delta))/\varepsilon^2\bigr)$. Learnability, uniform convergence and
finiteness of one combinatorial quantity turn out to be the same condition.

## Intuition

Count how many distinct labellings $\mathcal{H}$ can produce on the worst $m$ points. For small
$m$ the count is the maximum possible, $2^m$. It cannot stay there forever unless the class is
wild. Sauer's lemma says the count falls off a cliff: the moment it stops being $2^m$ it becomes
a polynomial in $m$ of degree $d$, with no intermediate regime. The VC dimension is the location
of that cliff.

The tempting analogy is degrees of freedom, and it is useful but wrong in an instructive way.
Halfspaces in $\mathbb{R}^d$ have $d+1$ parameters and VC dimension $d+1$, which flatters the
analogy. But the one-parameter class
$\{\, x \mapsto \mathbb{1}[\sin(\omega x) > 0] \;:\; \omega \in \mathbb{R} \,\}$ has infinite VC
dimension: a single real number carries unbounded labelling power. Capacity is about the richness
of the realisable behaviours, not the size of the parameter vector.

## Concrete example

Take linear separators in the plane: $\mathcal{H} = \{\, h_{w,b}(x) = \mathbb{1}[\langle w, x
\rangle + b \ge 0] : w \in \mathbb{R}^2, b \in \mathbb{R} \,\}$.

**Three points are shattered.** Use $x_1 = (0,0)$, $x_2 = (1,0)$, $x_3 = (0,1)$. For the labelling
$(1,0,0)$ take $w = (-1,-1)$, $b = 0.1$: the three scores are $0.1$, $-0.9$, $-0.9$. For
$(0,1,1)$ take $w = (1,1)$, $b = -0.5$: scores $-0.5$, $0.5$, $0.5$. The remaining six labellings
go the same way, and the all-ones and all-zeros patterns are free. So
$\mathrm{VCdim}(\mathcal{H}) \ge 3$.

**No four points are shattered.** Radon's theorem says any four points in $\mathbb{R}^2$ can be
split into two groups whose convex hulls intersect. A halfspace has a convex positive region and
a convex negative region, so if it realised that split the two hulls would lie in disjoint convex
sets and could not meet. That labelling is therefore unachievable, for every set of four points.
Hence $\mathrm{VCdim} = 3$, and the same argument in $\mathbb{R}^d$ gives $d+1$.

Note what the choice of points did. Three _collinear_ points $x_1, x_2, x_3$ in that order are
not shattered — the labelling $(1,0,1)$ would need a convex positive region containing the outer
two but not the middle one. The dimension is 3 because a good triple exists, not because every
triple works.

## Formal treatment

Define the **growth function**

$$
\Pi_{\mathcal{H}}(m) \;=\; \max_{x_1, \dots, x_m \in \mathcal{X}} \bigl| \mathcal{H}_{\{x_1,\dots,x_m\}} \bigr| ,
$$

the largest number of labellings on any $m$ points. Trivially $\Pi_{\mathcal{H}}(m) \le 2^m$,
with equality exactly when some $m$-set is shattered.

**Sauer's lemma.** If $\mathrm{VCdim}(\mathcal{H}) = d < \infty$ then for every $m$,

$$
\Pi_{\mathcal{H}}(m) \;\le\; \sum_{i=0}^{d} \binom{m}{i},
\qquad\text{and for } m \ge d \ge 1, \quad \sum_{i=0}^{d} \binom{m}{i} \;\le\; \Bigl(\frac{e m}{d}\Bigr)^{d} .
$$

An exponential count is replaced by a polynomial of degree $d$ — the whole reason the union bound
becomes usable.

Now let $D$ be a distribution on $\mathcal{X} \times \{0,1\}$, let $S$ be $m$ i.i.d. draws from it,
and write $L_D(h) = \mathbb{P}_{(x,y) \sim D}[h(x) \ne y]$ and $L_S(h)$ for the fraction of
training points $h$ gets wrong. Symmetrisation against a ghost sample plus a Hoeffding bound
gives the classical VC inequality

$$
\mathbb{P}\Bigl[\, \sup_{h \in \mathcal{H}} \bigl| L_D(h) - L_S(h) \bigr| > \varepsilon \,\Bigr]
\;\le\; 4\, \Pi_{\mathcal{H}}(2m)\, e^{-m\varepsilon^2/8} .
$$

Setting the right side to $\delta$ and applying Sauer's lemma yields the generalisation bound:
with probability at least $1-\delta$, **simultaneously for every** $h \in \mathcal{H}$,

$$
L_D(h) \;\le\; L_S(h) \;+\; \sqrt{\frac{8\left( d \ln\frac{2em}{d} + \ln\frac{4}{\delta} \right)}{m}} .
$$

The rate is $O(\sqrt{d/m})$ up to logarithms, and the supremum is what makes it a statement about
any hypothesis the learner might return rather than about one fixed in advance.

## Assumptions and requirements

The sample must be i.i.d. from a fixed distribution $D$, and $\mathcal{H}$ must be fixed before
$S$ is drawn. Both are load-bearing. Dependent data (a time series, an active-learning loop that
chooses its own queries) breaks the symmetrisation step. Choosing $\mathcal{H}$ after inspecting
the data — the usual practice of trying architectures until the validation number looks good —
means the effective class is the union of everything considered, and the bound for the one you
picked does not apply.

Labels must be binary and the loss 0-1. The equivalence between learnability, uniform convergence
and finite VC dimension is specific to this setting; in more general learning problems learnability
can hold without uniform convergence, so the fundamental theorem does not simply transfer.
Measurability conditions are also needed to make $\sup_{h}$ a random variable, though for the
classes that arise in practice they hold and are routinely suppressed.

The decisive assumption is the one that is _absent_: nothing is assumed about $D$. The bound holds
for every distribution, including adversarial ones. That is the theory's strength and the direct
cause of its looseness — it must cover the worst distribution consistent with the class, and real
data is nowhere near the worst case.

## Uses and applicability

Reach for VC dimension when the question is qualitative and worst-case: is this class learnable at
all, does the sample requirement grow linearly or catastrophically in the input dimension, is one
class fundamentally richer than another. It is the right tool for proving impossibility, since an
infinite VC dimension rules out distribution-free learning outright. It also motivated structural
risk minimisation, in which nested classes are ordered by capacity and one picks the level
minimising training error plus a complexity penalty.

Do not reach for it to predict the test error of a trained model. Held-out estimation and
cross-validation give numbers that are both tighter and honest about the distribution you actually
have. Goodfellow, Bengio and Courville note that capacity bounds of this kind are rarely used in
practice with deep learning; the reason is not neglect but that the numbers are uninformative.

## Limitations and common mistakes

**The bounds are vacuous for realistic neural networks, and that is a fact rather than an
embarrassment.** A network that can fit $n$ arbitrarily labelled training points has VC dimension
at least $n$, and for piecewise-linear networks the dimension grows roughly with the weight count.
Take a convolutional network with about $2.5 \times 10^7$ weights trained on $m \approx
1.28 \times 10^6$ images. Since $m \ll d$, Sauer's lemma buys nothing: $\Pi_{\mathcal{H}}(2m)$ is
at worst $2^{2m}$, and the bound becomes
$\varepsilon \approx \sqrt{(8/m)(2m\ln 2 + \ln(4/\delta))} \approx 3.3$. It asserts that the test
error is at most the training error plus $3.3$ — true, and worthless, since error never exceeds
$1$. The theory is not wrong; it is answering the distribution-free question, and these networks
generalise because real image distributions are benign, not because their worst case is.

**Confusing VC dimension with parameter count.** The $\sin(\omega x)$ class settles this: the
relationship between parameters and capacity is a fact about particular parameterisations, not a
theorem.

**Reading $\mathrm{VCdim} = d$ as "every $d$-set is shattered".** It is a supremum; collinear
triples in the plane are the standard counterexample.

**Expecting the bound to be tight.** It is a worst case over both hypotheses and distributions,
with generous constants from symmetrisation and the union bound; a gap of one or two orders of
magnitude against the observed generalisation gap is normal even for simple classes.

## Variants and alternatives

Within the combinatorial family: the **Natarajan dimension** extends shattering to multiclass
labels; the **pseudo-dimension** and the scale-sensitive **fat-shattering dimension** handle
real-valued functions, where "all labellings" must be replaced by a margin condition; the
**Littlestone dimension** plays the same characterising role for online learning under adversarial
sequences.

The main competitors are distribution-dependent. **Rademacher complexity** measures how well the
class correlates with random noise _on the actual sample_, so it adapts to benign data and can be
estimated empirically, at the cost of no longer being a single distribution-free integer.
**Covering numbers and chaining** give finer control for real-valued classes. **PAC-Bayes**,
**algorithmic stability** and **compression bounds** each drop the uniform-over-the-class
requirement and bound only the hypothesis the algorithm actually produced — the route by which
non-vacuous bounds for neural networks have been obtained. Outside the bound-proving tradition,
**cross-validation** and the information criteria of the model-selection literature estimate the
same quantity empirically, and are what practitioners actually use.

## History and attribution

Vladimir Vapnik and Alexey Chervonenkis introduced the ideas in 1971, in work on when empirical
frequencies of events converge uniformly to their probabilities — a question in empirical process
theory arising from pattern recognition, not a question about machine learning as later
constituted. The combinatorial lemma at the centre was proved independently at about the same
time by Norbert Sauer and by Saharon Shelah, the latter in model theory, where finite VC dimension
is the same condition as a formula being dependent (NIP). The connection to Leslie Valiant's PAC
framework was made by Blumer, Ehrenfeucht, Haussler and Warmuth at the end of the 1980s, and it is
that synthesis — learnability equals finite VC dimension — that the name now evokes.

## Sources

_Understanding Machine Learning_ is the primary reference here: it develops shattering, Sauer's
lemma, the halfspace computation and the fundamental theorem in a single chapter, and its
bibliographic remarks are the basis for the attributions above. Vershynin's _High-Dimensional
Probability_ gives the probabilistic side — symmetrisation and the uniform law of large numbers —
in the language of empirical processes, and is the better source for why concentration makes the
argument work. _The Elements of Statistical Learning_ situates VC dimension among the practical
model-selection tools it competes with, and _Deep Learning_ is cited for the point that capacity
bounds of this kind are not used in practice on deep networks.

## Prerequisites and next connections

Read [Concentration Inequalities](./concentration-inequalities.md) first: Hoeffding's bound and
the union bound are the two moving parts of the proof, and the $\sqrt{1/m}$ rate comes directly
from them. Basic [Probability Theory](./probability-theory.md) suffices for the rest, and the
Radon argument in the worked example belongs to [Convex Geometry](./convex-geometry.md).

Two directions then open up.
[High-Dimensional Statistics](./high-dimensional-statistics.md) takes the uniform-convergence
machinery further into empirical processes and non-asymptotic rates, while
[Model Theory](./model-theory.md) studies the same finiteness condition under the name NIP — a
coincidence that turned out to be a genuine structural connection rather than a pun.
