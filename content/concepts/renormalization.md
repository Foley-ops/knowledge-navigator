---
concept_id: concept.geometry.renormalization
title: Renormalization
slug: /concepts/renormalization
aliases:
  - renormalization group
  - RG flow
kind: concept
tier: 1
review_state: generated-draft
summary: The systematic construction of coarser descriptions of a system at successively larger scales, whose induced flow on parameter space has fixed points that explain why physically unrelated systems share the same critical exponents.
categories:
  - Mathematics/Geometry & Topology
primary_category: Mathematics/Geometry & Topology
relationships:
  - type: requires
    target: concept.analysis.dynamical_systems
    note: The renormalization transformation is an iterated map on a space of models, and every statement made about it — fixed point, linearization, stable manifold, unstable eigenvalue — is borrowed wholesale from the theory of iterated maps.
  - type: contributes_to
    target: concept.analysis.chaos
    note: Feigenbaum's doubling operator explains why the period-doubling route to chaos has the same two constants in every smooth unimodal map with a non-degenerate quadratic critical point, maps with a degenerate turning point forming their own universality class with their own constants, which is a result about chaos obtained by renormalizing.
  - type: contrasts_with
    target: concept.geometry.fractal_geometry
    note: A fixed point of a renormalization flow is statistically self-similar rather than exactly self-similar, so critical configurations are random fractals that no single iterated function system produces as its attractor, even though their dimensions are ordinary real numbers an iterated function system could match.
  - type: contributes_to
    target: concept.probability.probability_theory
    note: The central limit theorem reads as a renormalization statement, with rescaled convolution as the coarse-graining map, the Gaussian as its attracting fixed point and the stable laws as the other fixed points.
sources:
  - source_id: source.wilson1982.renormalization_group
    title: The Renormalization Group and Critical Phenomena (Nobel Lecture)
    url: https://www.nobelprize.org/prizes/physics/1982/wilson/lecture/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.statistical_physics_of_fields
    title: 'MIT 8.334 Statistical Mechanics II: Statistical Physics of Fields (Spring 2014)'
    url: https://ocw.mit.edu/courses/8-334-statistical-mechanics-ii-statistical-physics-of-fields-spring-2014/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - concrete-example
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.nonlinear_dynamics_and_chaos
    title: 'MIT 12.006J Nonlinear Dynamics: Chaos (Fall 2022)'
    url: https://ocw.mit.edu/courses/12-006j-nonlinear-dynamics-chaos-fall-2022/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Rigorous renormalization in one-dimensional dynamics (Lanford, Sullivan, McMullen, Lyubich)
    reason: No registry source covers the computer-assisted existence proof or the later hyperbolicity results for the Feigenbaum fixed point; the cited course and reference state the constants but not the proofs.
    sections:
      - formal-treatment
      - history-and-attribution
  - label: Renormalization-group analogies for deep neural networks
    reason: No registry source covers the literature drawing analogies between coarse-graining and depth in neural networks, so the page can only mark the analogy as speculative rather than assess it.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Renormalization** replaces a description of a system by a coarser one — integrating out,
averaging over, or discarding the degrees of freedom finer than some scale — and records the
map this induces on the parameters of the description. If $R_b$ denotes coarse-graining by a
linear factor $b$ followed by a rescaling of lengths, then $R_b \circ R_{b'} = R_{bb'}$, and
the orbit of a model under repeated $R_b$ is its **renormalization-group flow**.

$R_b$ has no inverse. Coarse-graining destroys information and many fine descriptions map to
the same coarse one, so the renormalization group is a _semigroup_; "group" is a historical
misnomer that never got corrected.

## Why it matters

At a continuous phase transition the correlation length $\xi$ diverges, so every scale from the
lattice spacing to the sample size contributes at once. Perturbation theory organised around a
single scale fails, and mean-field theory predicts the wrong exponents below four dimensions.
Renormalization converts "all scales at once" into one map iterated, which is a problem with a
vocabulary.

The payoff is universality. The liquid–vapour critical point of carbon dioxide, the Curie point
of a uniaxial ferromagnet and the demixing point of a binary alloy share critical exponents
($\nu \approx 0.6300$, $\beta \approx 0.3264$, $\gamma \approx 1.2372$) although they share no
microscopic physics. All three flow to the same fixed point, and what distinguishes them is an
irrelevant direction the flow contracts away.

## Intuition

Kadanoff's picture is the one people carry. Group the spins of a lattice into $b \times b$
blocks, replace each block by its majority, shrink lengths by $b$, then ask what coupling
the new lattice needs to reproduce the old statistics.

Off criticality, $\xi$ in lattice units shrinks by $b$ at each step, so the system looks
progressively less correlated and the flow runs to a trivial fixed point. At criticality
$\xi = \infty$, and $\infty / b$ is still $\infty$, so the system looks the same after
squinting. Fixed points of the flow are exactly the scale-invariant descriptions.

Where the analogy breaks: majority rule is one arbitrary choice among many, and the
coarse-grained model leaves the family you started in. Blocking a nearest-neighbour Ising
model generates next-nearest-neighbour and four-spin couplings. The flow lives in an
infinite-dimensional space, and every practical calculation truncates it.

## Concrete example

Take the one-dimensional Ising chain with no field, weight $\exp(K \sum_i s_i s_{i+1})$ over
$s_i = \pm 1$, and sum out every second spin. For fixed neighbours $s_1, s_3$,

$$
\sum_{s_2 = \pm 1} e^{K s_2 (s_1 + s_3)} = 2\cosh\!\big(K(s_1+s_3)\big),
$$

and matching this to $A\,e^{K' s_1 s_3}$ in the two cases $s_1 s_3 = \pm 1$ gives the
exact flow

$$
e^{2K'} = \cosh 2K, \qquad \text{equivalently} \qquad \tanh K' = \tanh^2 K .
$$

Starting at $K = 1$ and iterating:

```python
from math import cosh, log

K = 1.0
for _ in range(5):
    K = 0.5 * log(cosh(2 * K))
    print(round(K, 6))
```

which prints $0.662501$, $0.350061$, $0.113672$, $0.012812$, $0.000164$.

The coupling collapses to $K^* = 0$ — infinite temperature, no correlation. The only other
fixed point, $K^* = \infty$, is unstable: any finite $K$ runs away from it. The chain has no
fixed point at finite nonzero coupling, and therefore no phase transition at positive
temperature — a result Ising obtained by direct summation, recovered here in two lines.

## Formal treatment

Let a model be a point $\mu$ in a space of couplings and $R_b$ a coarse-graining that preserves
the partition function. A **fixed point** satisfies $R_b \mu^* = \mu^*$ for all $b$. Because
$\xi(R_b \mu) = \xi(\mu)/b$, a fixed point has $\xi = 0$ or $\xi = \infty$; the second kind are
the critical theories.

Linearize about $\mu^*$. Writing $\mu = \mu^* + \sum_i g_i O_i$ in a basis of eigenoperators of
$DR_b$,

$$
R_b\Big(\mu^* + \sum_i g_i O_i\Big) = \mu^* + \sum_i b^{y_i} g_i O_i + O(g^2),
$$

with **scaling dimensions** $y_i$. A direction with $y_i > 0$ is **relevant** (the flow
amplifies it, driving the system off criticality), $y_i < 0$ is **irrelevant** (the flow
contracts it, so it does not affect the asymptotics), and $y_i = 0$ is **marginal**, where the
linear analysis is silent.

The **critical surface** is the stable manifold of $\mu^*$; its codimension is the number of
relevant directions, which is the number of knobs an experimenter must tune to sit at
criticality — for a simple ferromagnet, temperature and field. The **universality class** of
$\mu^*$ is its basin of attraction, and exponents follow from the $y_i$: with $t$ the reduced
temperature and $y_t$ its scaling dimension,

$$
\xi \sim |t|^{-\nu}, \qquad \nu = 1/y_t .
$$

What fixes the class is dimensionality, the symmetry of the order parameter and the range of
the interaction — not the lattice, not the chemistry.

### Period doubling

The same machinery works on maps rather than lattices. For smooth unimodal maps of an
interval, define the **doubling operator**

$$
(\mathcal{R}f)(x) = -\alpha\, f\big(f(-x/\alpha)\big), \qquad \alpha = -1/f(1),
$$

normalised by $f(0) = 1$: compose the map with itself, then rescale so the picture fits the
original frame. Its fixed point solves the Cvitanović–Feigenbaum equation
$g(x) = -\alpha\,g(g(-x/\alpha))$ with $\alpha = 2.502907875\ldots$, and $D\mathcal{R}$ at $g$
has exactly one eigenvalue outside the unit circle,

$$
\delta = 4.669201609\ldots
$$

That single relevant direction is the whole content of Feigenbaum universality. For the logistic
map $x_{n+1} = r x_n (1 - x_n)$, period doublings occur at $r_1 = 3$,
$r_2 = 1 + \sqrt{6} \approx 3.44949$ and $r_3 \approx 3.54409$, accumulating at
$r_\infty \approx 3.56995$; the ratio $(r_2 - r_1)/(r_3 - r_2) \approx 4.751$ is already close
to $\delta$. The sine map $x_{n+1} = r\sin(\pi x)$ gives the same two constants, differing from
the logistic map only along irrelevant directions.

## Assumptions and requirements

The construction needs a **scale separation**: a microscopic cutoff (lattice spacing, or the
smoothness scale of a map) far below the scale of interest. With no cutoff there is nothing to
integrate out; with one dominant scale, the flow has nowhere to run.

It needs **locality**. Short-range interactions make the generated couplings decay fast enough
for a truncation to mean anything; long-range interactions $r^{-(d+\sigma)}$ flow to different
fixed points with different exponents.

It needs the coarse-graining to **preserve the quantity being computed**. Decimation, block spins
and momentum-shell integration all preserve the partition function exactly; a blocking rule that
does not is not a renormalization, however much it looks like averaging.

The exponents require the fixed point to be **hyperbolic** — no eigenvalue on the unit circle. At
the upper critical dimension, where a coupling turns marginal, scaling picks up logarithmic
corrections. Feigenbaum's operator needs a smooth unimodal map with a **non-degenerate quadratic
critical point**; a quartic turning point has its own constants, different from $4.6692\ldots$.

## Uses and applicability

Reach for renormalization when the question is about behaviour near a critical point, about
which features of a model survive coarse-graining, or about why a measured exponent is
insensitive to detail. Beyond critical phenomena it organises running couplings in quantum field
theory, Wilson's solution of the Kondo problem, polymer and percolation scaling, and
period-doubling and circle-map universality.

Do not reach for it when the interesting behaviour sits at one scale, when the system has few
degrees of freedom, or when the answer wanted is non-universal. The RG predicts exponents,
scaling functions and amplitude _ratios_, not the critical temperature of carbon dioxide, which
depends on everything the flow throws away.

## Limitations and common mistakes

The first mistake is reading "universality" as "the details do not matter". They matter for
almost everything, and fail to matter only for a short list of quantities, near the fixed point,
at large scales. $T_c$ and the width of the critical region are non-universal.

The second is trusting a truncation. Keeping four couplings out of infinitely many carries no
error bar, and two reasonable truncations can disagree. The $\epsilon$-expansion around $d = 4$
is asymptotic, not convergent: to first order $\nu = \tfrac{1}{2} + \epsilon/12$, which at
$\epsilon = 1$ gives $0.583$ against the true $0.630$. Resummation, not more terms, closes that
gap.

The third is expecting the group axioms. There is no inverse, so "running a coupling backwards"
is analytic continuation of a formula, not an undoing of coarse-graining.

The fourth concerns machine learning. Analogies between the layers of a deep network and
successive coarse-grainings are frequently drawn and are **speculative**. There is no agreed
coarse-graining map for which a trained network is the orbit, no identified fixed point, and no
critical exponent a network and an unrelated system have been measured to share. The vocabulary
transfers; the theorems do not.

## Variants and alternatives

**Real-space** schemes (decimation, block spins, Migdal–Kadanoff) are intuitive and often exactly
soluble in one dimension, but uncontrolled in higher dimensions. **Momentum-shell** or Wilsonian
RG integrates out Fourier modes in a thin shell near the cutoff, which is what makes the
$\epsilon$-expansion possible. **Field-theoretic** RG uses renormalization constants and the
Callan–Symanzik equation instead of an explicit cutoff, buying higher-order computations at the
cost of the picture. **Functional (exact) RG** flows the whole effective action, truncating the
functional rather than a list of couplings.

Genuinely different competitors exist. The **conformal bootstrap** pins the three-dimensional
Ising exponents to many digits from consistency conditions on the fixed-point theory alone, with
no flow at all; **Monte Carlo with finite-size scaling** measures them numerically; and **exact
solutions** settle the matter outright where they exist, as Onsager's two-dimensional Ising
solution does.

## History and attribution

The idea has several independent origins. Stueckelberg and Petermann in 1953 and Gell-Mann and
Low in 1954 introduced renormalization-group equations in quantum electrodynamics, asking how
the effective charge depends on the scale at which it is measured. Widom proposed the scaling
hypothesis for critical phenomena in 1965, with Domb and Hunter and, independently,
Patashinskii and Pokrovskii reaching scaling at about the same time; Kadanoff supplied the
block-spin picture in 1966, which gave the scaling hypothesis a physical derivation. Kenneth Wilson
made the flow itself the object of study in the early 1970s, developed the $\epsilon$-expansion
with Michael Fisher, applied the method to the Kondo problem, and received the 1982 Nobel Prize
in Physics for the work.

Mitchell Feigenbaum found $\delta$ and $\alpha$ numerically in the mid-1970s while iterating maps
on a hand calculator, and recognised the renormalization structure behind them; Coullet and
Tresser reached the same functional equation independently at about the same time.

## Sources

Wilson's Nobel lecture is the best short statement of what the renormalization group is for and
where it came from, told by the person who assembled it. MIT 8.334 is the technical backbone —
coupling-space flows, fixed points, relevant and irrelevant operators, the $\epsilon$-expansion
and the soluble one-dimensional example. MIT 12.006J covers the period-doubling cascade and the
universality of its constants; MathWorld gives their numerical values and functional equation.

## Prerequisites and next connections

Read [Dynamical Systems](./dynamical-systems.md) first. Fixed points, linearization, stable
manifolds and hyperbolicity are not analogies here — the renormalization flow is an iterated map
and those are its exact tools.

Afterwards, [Chaos](./chaos.md) is where the period-doubling material lands, since the Feigenbaum
constants describe how a family of maps arrives at chaotic behaviour. [Probability
Theory](./probability-theory.md) holds the cleanest toy version: rescaled convolution of
independent sums is a coarse-graining, the Gaussian is its attracting fixed point, finite
variance puts a distribution in that basin, and the stable laws are the other fixed points.
