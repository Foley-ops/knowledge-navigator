---
concept_id: concept.analysis.complex_analysis
title: Complex Analysis
slug: /concepts/complex-analysis
aliases:
  - theory of functions of a complex variable
kind: concept
tier: 1
review_state: generated-draft
summary: The study of functions of a complex variable, where being differentiable once at every point of an open set forces infinite differentiability, a convergent power series and a rigidity that has no real-variable counterpart.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: requires
    target: concept.analysis.real_analysis
    note: The limit, uniform convergence and power series machinery is borrowed wholesale; only the field the quotient is taken in changes.
  - type: requires
    target: concept.analysis.multivariable_calculus
    note: A contour integral is a line integral in the plane, Cauchy's theorem is Green's theorem in disguise, and the Cauchy-Riemann equations are a condition on the real Jacobian.
  - type: used_to_solve
    target: concept.analysis.partial_differential_equations
    note: Real and imaginary parts of a holomorphic function are harmonic, so conformal maps transport solutions of Laplace's equation between plane domains.
  - type: contributes_to
    target: concept.analysis.fourier_analysis
    note: Contour shifting and residues evaluate Fourier and Laplace inversion integrals, and decay of a transform is read off the analyticity strip of the function.
sources:
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.multivariable_calculus
    title: MIT 18.02 Multivariable Calculus (Fall 2007)
    url: https://ocw.mit.edu/courses/18-02-multivariable-calculus-fall-2007/
    source_kind: lecture-or-course
    supports:
      - intuition
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.dlmf.nist
    title: NIST Digital Library of Mathematical Functions
    url: https://dlmf.nist.gov/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Complex analysis** is the theory of _holomorphic_ functions: maps
$f : U \to \mathbb{C}$ on an open set $U \subseteq \mathbb{C}$ such that at every
$z \in U$ the limit

$$
f'(z) \;=\; \lim_{h \to 0} \frac{f(z+h) - f(z)}{h},
\qquad h \in \mathbb{C} \setminus \{0\},
$$

exists. Two things in that formula do all the work: $h$ may approach $0$ from
any direction in the plane and the limit must be the same for all of them, and
the quotient is division by a complex number rather than by a vector. Imposing
this at every point of an open set is far stronger than asking the corresponding
map $\mathbb{R}^2 \to \mathbb{R}^2$ to be differentiable, and almost every
theorem below follows from how much stronger it is.

## Why it matters

It buys three things. Computation: definite integrals with no elementary
antiderivative collapse into finite sums of residues. Rigidity: a holomorphic
function on a connected domain is pinned down by its values on any set with an
accumulation point, which licenses analytic continuation — the reason $\Gamma$
and the Riemann zeta function have unambiguous values far outside where their
defining formulas converge. Plane physics: real and imaginary parts are
harmonic, so two-dimensional electrostatics, ideal fluid flow and steady heat
flow move between domains by conformal maps.

## Intuition

A derivative is a local linear approximation. For a differentiable map
$\mathbb{R}^2 \to \mathbb{R}^2$ it is an arbitrary linear map — four real
numbers, free to stretch one axis, shear or reflect. Holomorphy demands
multiplication by a single complex number: a rotation with a uniform scaling,
two real numbers. A holomorphic map is therefore infinitesimally a
rotate-and-scale and never a shear, which is why it preserves angles wherever
$f'(z) \neq 0$.

The analogy to watch: "rotate and scale" sounds like a mild pointwise condition.
It is not, because imposing it at _every_ point of an open set turns it into an
overdetermined elliptic system of partial differential equations, and elliptic
regularity is the honest reason one derivative buys infinitely many. The
conformal picture also fails at the zeros of $f'$: $z \mapsto z^2$ doubles
angles at the origin.

## Concrete example

Evaluate $\int_{-\infty}^{\infty} \frac{\cos x}{x^2+1}\,dx$, which has no
elementary antiderivative. Put $f(z) = e^{iz}/(z^2+1)$ and integrate over the
contour made of the segment $[-R, R]$ and the semicircular arc of radius $R$ in
the upper half-plane. The poles are at $z = \pm i$; only $z = i$ lies inside for
$R > 1$, and it is simple, so

$$
\operatorname{Res}(f, i) \;=\; \frac{e^{i \cdot i}}{2i} \;=\; \frac{1}{2ei},
\qquad
\oint f \;=\; 2\pi i \cdot \frac{1}{2ei} \;=\; \frac{\pi}{e}.
$$

The arc contributes nothing in the limit: $|e^{iz}| = e^{-\operatorname{Im} z}
\le 1$ in the upper half-plane and $|z^2+1| \ge R^2 - 1$, so the arc integral is
at most $\pi R/(R^2-1) \to 0$. The imaginary part of the real-axis integral
vanishes because $\sin x/(x^2+1)$ is odd, leaving

$$
\int_{-\infty}^{\infty} \frac{\cos x}{x^2+1}\,dx \;=\; \frac{\pi}{e}
\;=\; 1.1557273\ldots
$$

Simpson's rule over $[-200, 200]$ gives $1.155683$; the gap is the discarded
tail. Note that $e$ appears in the answer and nowhere in the integrand: it
enters through the auxiliary factor $e^{iz}$ evaluated at $z = i$.

## Formal treatment

Write $f = u + iv$ with $u, v$ real-valued functions of $(x,y)$. If $f$ is
complex differentiable at $z_0$, the first partials exist there and satisfy the
**Cauchy-Riemann equations**

$$
\frac{\partial u}{\partial x} = \frac{\partial v}{\partial y},
\qquad
\frac{\partial u}{\partial y} = -\frac{\partial v}{\partial x}.
$$

Conversely, if $u$ and $v$ are _real-differentiable_ at $z_0$ and satisfy these,
then $f'(z_0)$ exists and equals $u_x + i v_x$. Equivalently: the real Jacobian
$\begin{pmatrix} u_x & u_y \\ v_x & v_y \end{pmatrix}$ has the form
$\begin{pmatrix} a & -b \\ b & a \end{pmatrix}$, the matrix of multiplication by
$a + ib$. In Wirtinger notation, $\partial f/\partial \bar{z} = 0$: $f$ depends
on $z$ and not on $\bar z$.

**Cauchy's integral theorem** (Cauchy-Goursat): if $f$ is holomorphic on an open
$U$ and $\gamma$ is a closed curve null-homotopic in $U$, then
$\oint_\gamma f(z)\,dz = 0$. Goursat proved the triangle case around 1900
without assuming $f'$ continuous — that continuity is a conclusion here, not a
hypothesis. **Cauchy's integral formula** follows: for a positively oriented
simple closed curve $\gamma$ in $U$ whose interior lies in $U$, and $a$ inside,

$$
f(a) = \frac{1}{2\pi i} \oint_\gamma \frac{f(z)}{z-a}\,dz,
\qquad
f^{(n)}(a) = \frac{n!}{2\pi i} \oint_\gamma \frac{f(z)}{(z-a)^{n+1}}\,dz .
$$

The right-hand side makes sense for every $n$, so a holomorphic function is
$C^\infty$ and equals its Taylor series on any disc contained in $U$:
**holomorphic implies analytic**. The Cauchy estimates
$|f^{(n)}(a)| \le n!\,M/r^n$, with $M$ the maximum of $|f|$ on $|z-a| = r$, give
Liouville's theorem (a bounded entire function is constant) and with it the
fundamental theorem of algebra; the identity, maximum modulus and open mapping
theorems follow too, and Morera's theorem is the converse.

On a punctured disc around an isolated singularity $a$, $f$ has a Laurent
expansion $f(z) = \sum_{n=-\infty}^{\infty} c_n (z-a)^n$, and
$\operatorname{Res}(f,a) := c_{-1}$. The **residue theorem** states
$\oint_\gamma f = 2\pi i \sum_a n(\gamma, a)\operatorname{Res}(f,a)$, with
$n(\gamma,a)$ the winding number. For a pole of order $m$,

$$
\operatorname{Res}(f,a) = \frac{1}{(m-1)!}\lim_{z \to a}
\frac{d^{m-1}}{dz^{m-1}}\Big[(z-a)^m f(z)\Big].
$$

## Assumptions and requirements

Cauchy's theorem needs the _curve_ null-homotopic in the domain, not merely
closed: on the punctured plane $\oint_{|z|=1} dz/z = 2\pi i \neq 0$ even though
$1/z$ is holomorphic there. Simple connectivity of the domain is the usual
sufficient condition.

The converse half of Cauchy-Riemann needs real differentiability, not just
existence of the four partials (see below). Continuity plus the equations
holding everywhere does suffice, by the Looman-Menchoff theorem, but that is a
hard result rather than a working hypothesis.

Evaluating a real integral by residues needs three things at once: the real
integral must converge; the auxiliary function must decay on the closing arc (a
rational $P/Q$ needs $\deg Q \ge 2 + \deg P$, while a factor $e^{iaz}$ with
$a>0$ lets Jordan's lemma get by with less, and forces the arc into the _upper_
half-plane); and no singularity may sit on the contour, since a simple pole on
the real axis needs an indentation and contributes $i\pi\operatorname{Res}$ to
the principal value. The identity theorem needs the domain connected: on a
disjoint union, set $f \equiv 0$ on one piece and $f \equiv 1$ on another.

## Uses and applicability

Reach for complex analysis when an integral or transform resists real methods
(residues, Bromwich contours for Laplace inversion); when an integral with a
large parameter needs asymptotics (steepest descent, stationary phase); when a
function must be extended past its defining series (analytic continuation, and
the special-function machinery catalogued in the DLMF); when a two-dimensional
Laplace problem sits on an awkward domain a conformal map straightens; and when
roots must be counted in a region (the argument principle and Rouché's theorem,
which is also what the Nyquist stability criterion is).

Do not reach for it when the dimension is wrong or the structure absent. In
$\mathbb{R}^n$ for $n \ge 3$ the conformal maps are only Möbius transformations,
so the mapping trick is a two-dimensional luxury. Several complex variables is a
different subject, not a routine extension: the Hartogs phenomenon forces
extension across compact holes, and the Riemann mapping theorem fails. And if
you need to alter a function on a small region and leave it alone elsewhere,
holomorphy forbids it — there are no holomorphic bump functions, which is why
real analysis has partitions of unity and this subject does not.

## Limitations and common mistakes

The commonest conflation is treating "holomorphic" and "analytic" as two words
for one definition. They are two definitions — differentiable once, versus
locally a convergent power series — that a theorem proves equivalent _for one
complex variable_. Over the reals they come apart: $e^{-1/x^2}$ extended by $0$
is $C^\infty$ with every derivative vanishing at $0$, and is not analytic there.

The second is thinking the Cauchy-Riemann equations alone certify holomorphy.
Take $f(z) = \bar z^2 / z$ for $z \neq 0$ and $f(0) = 0$: it is continuous at the
origin, where the partials exist and satisfy the equations. But on
$z = re^{i\theta}$ the difference quotient is $f(z)/z = e^{-4i\theta}$, which
depends on the direction of approach, so $f'(0)$ does not exist.

Other recurring errors: closing the contour in the wrong half-plane (for
$e^{-ix}$ close _below_, or the exponential blows up like $e^{R}$); ignoring
branch cuts, since $\log z$ and $z^a$ are multivalued and a contour crossing a
cut computes nothing; and forgetting winding number and orientation.

One misconception is worth inverting, because it explains a real-variable
mystery. The Maclaurin series of $1/(1+x^2)$ has radius of convergence $1$
though the function is smooth and bounded on all of $\mathbb{R}$. Nothing on the
real line accounts for that; the poles at $\pm i$ do. Radius of convergence is
the distance to the nearest singularity _in the complex plane_.

## Variants and alternatives

Three developments reach the same theorems from different starting points:
Cauchy's, built on contour integrals; Weierstrass's, on convergent power series
and analytic continuation; Riemann's, on geometry and potential theory. They are
equivalent in content and genuinely different in emphasis, so a reader who finds
one opaque should try another. Beyond one variable: Riemann surfaces make
multivalued functions single-valued by changing the domain; quasiconformal maps
relax angle preservation to bounded distortion; potential theory in
$\mathbb{R}^n$ keeps the harmonic half of the story and loses the multiplicative
structure that makes residues possible. For one specific integral, the honest
competitors are numerical quadrature and symbolic integration, which win when
the integrand has no exploitable analytic structure.

## History and attribution

The subject has several origins rather than one. Cauchy, from the mid-1810s
onward, developed contour integration and then residues while working on
definite integrals and on wave propagation — the technique in the example above
came from wanting real integrals, not complex functions. The picture of complex
numbers as points in a plane was established earlier and independently by
Wessel, Argand and Gauss. Riemann's 1851 dissertation recast the subject
geometrically and tied it to potential theory; Riemann surfaces are his.
Weierstrass, in the 1860s and 1870s, rebuilt the material on power series so
that nothing rested on geometric intuition. The Cauchy-Riemann equations are
older than either name on them, appearing in eighteenth-century work on fluid
flow by d'Alembert and Euler.

## Sources

MIT 18.100A supplies the limit and convergence machinery this page assumes and
the real-variable facts it contrasts against, including the
smooth-but-not-analytic example. MIT 18.02 covers line integrals, Green's
theorem, path independence and the Jacobian — the real-variable statements
Cauchy's theorem and the Cauchy-Riemann equations translate. Wolfram MathWorld
is a compact reference for the standard statements and residue conventions. The NIST Digital Library of Mathematical Functions is
where the applied payoff lives: analytic continuation and asymptotics.

## Prerequisites and next connections

Read [Real Analysis](./real-analysis.md) first — $\varepsilon$-$\delta$ limits,
uniform convergence and power series are used here without comment, and the
contrast with the real case is half the point. Read
[Multivariable Calculus](./multivariable-calculus.md) alongside it: a contour
integral is a line integral, Cauchy's theorem is Green's theorem with the
Cauchy-Riemann equations substituted in, and the derivative is a Jacobian of a
special shape. [Single Variable Calculus](./single-variable-calculus.md) is the
computational floor beneath both.

What it opens up: Fourier and Laplace transforms, whose inversion formulas are
contour integrals; the conformal-mapping solution of Laplace's equation;
asymptotics by steepest descent; and analytic number theory.
