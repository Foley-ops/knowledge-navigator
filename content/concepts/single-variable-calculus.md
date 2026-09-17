---
concept_id: concept.analysis.single_variable_calculus
title: Single-Variable Calculus
slug: /concepts/single-variable-calculus
aliases:
  - one-variable calculus
kind: concept
tier: 1
review_state: generated-draft
summary: The computational layer of real analysis — limits, derivatives and integrals of functions of one real variable, tied together by the fundamental theorem that makes differentiation and integration inverse operations.
categories:
  - Mathematics/Analysis
primary_category: Mathematics/Analysis
relationships:
  - type: refined_by
    target: concept.analysis.real_analysis
    note: Real analysis supplies the epsilon-delta proofs and completeness arguments that calculus uses operationally without establishing.
  - type: prerequisite_of
    target: concept.analysis.multivariable_calculus
    note: A partial derivative is a single-variable derivative taken along one coordinate with the others frozen, so the one-variable rules are the computational content.
  - type: prerequisite_of
    target: concept.analysis.convolution
    note: Continuous convolution is defined by a definite integral in one variable, and its differentiation properties follow from the one-variable rules.
  - type: prerequisite_of
    target: concept.deep_learning.backpropagation_through_convolution
    note: Each primitive in the computational graph has a local derivative supplied by the one-variable rules; composing them across the graph is the multivariable chain rule, which sums over every path out of a node.
sources:
  - source_id: source.mit_ocw.single_variable_calculus
    title: MIT 18.01 Single Variable Calculus (Fall 2006)
    url: https://ocw.mit.edu/courses/18-01-single-variable-calculus-fall-2006/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.tao.analysis_i
    title: Terence Tao, Analysis I
    url: https://terrytao.wordpress.com/books/analysis-i/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.real_analysis
    title: MIT 18.100A Real Analysis (Fall 2020)
    url: https://ocw.mit.edu/courses/18-100a-real-analysis-fall-2020/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Single-variable calculus** studies real-valued functions of one real variable
through two limit operations. Differentiation takes the limit of _difference
quotients_,

$$
f'(a) \;=\; \lim_{h \to 0} \frac{f(a+h) - f(a)}{h},
$$

defined exactly when that limit exists. Integration takes the limit of _Riemann
sums_ over partitions $a = x_0 < \dots < x_n = b$ with tags $t_i \in [x_{i-1},
x_i]$,

$$
\int_a^b f(x)\,dx \;=\; \lim_{\max_i \Delta x_i \to 0} \sum_{i=1}^{n} f(t_i)\,\Delta x_i ,
\qquad \Delta x_i = x_i - x_{i-1}.
$$

The subject is the computational and conceptual layer: the rules, the theorems
and the pictures. The proof layer beneath it — what a limit _is_, why the reals
support these arguments — is real analysis.

## Why it matters

Before calculus, "rate of change" and "total accumulated" were separate,
awkward notions. Calculus makes both exact and, through the fundamental theorem,
makes them inverse. That single fact turns the problem of computing an area into
the problem of guessing an antiderivative, and turns a law about rates — a
differential equation — into a statement you can integrate.

Downstream it is the whole substrate of gradient-based learning. Every parameter
update in a neural network is a derivative, and the backward pass applies a
local derivative rule mechanically, once per operation, across a graph with
millions of nodes. Every local rule backpropagation uses is stated below; what
the graph adds is bookkeeping and the multivariable chain rule, which sums a
node's gradient over every path leading out of it.

## Intuition

The derivative is what you see when you zoom in. Magnify a differentiable curve
far enough at a point and it becomes indistinguishable from a straight line; the
derivative is that line's slope. Equivalently, $f(a+h) \approx f(a) + f'(a)h$ is
the best linear approximation near $a$.

The integral is accumulation: run a rate over an interval and add up what
accrues. The odometer-and-speedometer picture is the right one — the odometer
reading is the integral of the speedometer, and the speedometer is the
derivative of the odometer — and it is exactly the fundamental theorem.

The analogy breaks where physical intuition insists every motion has a speed. A
function can be continuous everywhere and differentiable nowhere. The
Weierstrass function is the standard witness, and no zooming picture survives it.

## Concrete example

Differentiate $f(x) = x^2$ at $a = 3$ from the definition. The difference
quotient is

$$
\frac{(3+h)^2 - 9}{h} = \frac{6h + h^2}{h} = 6 + h \quad (h \neq 0),
$$

so at $h = 0.1$ it is $6.1$, at $h = 0.01$ it is $6.01$, and the limit is
$f'(3) = 6$. Note the quotient is undefined _at_ $h = 0$; the limit never
evaluates there.

Now integrate the same function over $[1, 3]$. The exact value is $\int_1^3 x^2
dx = \tfrac{27}{3} - \tfrac{1}{3} = \tfrac{26}{3} \approx 8.6667$. With four
subintervals of width $0.5$, the choice of tag still matters a great deal: the
left sum is $0.5(1 + 2.25 + 4 + 6.25) = 6.75$, the right sum is
$0.5(2.25 + 4 + 6.25 + 9) = 10.75$, and the midpoint sum is
$0.5(1.5625 + 3.0625 + 5.0625 + 7.5625) = 8.625$. All three converge to
$26/3$ as the mesh shrinks:

```python
def midpoint_sum(f, a, b, n):
    h = (b - a) / n
    return h * sum(f(a + (i + 0.5) * h) for i in range(n))

midpoint_sum(lambda x: x**2, 1, 3, 4)    # 8.625
midpoint_sum(lambda x: x**2, 1, 3, 400)  # 8.6666625
```

## Formal treatment

Write $\lim_{x \to a} f(x) = L$ to mean that for every $\varepsilon > 0$ there
is a $\delta > 0$ with $|f(x) - L| < \varepsilon$ whenever $0 < |x - a| <
\delta$. Every statement below rests on this.

**Differentiability implies continuity.** If $f'(a)$ exists then $f(a+h) - f(a)
= h \cdot \frac{f(a+h)-f(a)}{h} \to 0 \cdot f'(a) = 0$, so $f$ is continuous at
$a$. The converse is false: $f(x) = |x|$ is continuous at $0$ but the difference
quotient tends to $-1$ from the left and $+1$ from the right.

**Chain rule.** If $g$ is differentiable at $x$ and $f$ at $g(x)$, then $(f \circ
g)'(x) = f'(g(x))\,g'(x)$. Both hypotheses are needed at the relevant points.

**Fundamental theorem of calculus.** For $f$ continuous on $[a,b]$, the
accumulation function $F(x) = \int_a^x f(t)\,dt$ satisfies $F'(x) = f(x)$ on
$(a,b)$. Conversely, if $F' = f$ on $[a,b]$ _and_ $f$ is Riemann integrable,
then $\int_a^b f = F(b) - F(a)$. That integrability hypothesis is not free:
there exist differentiable functions with bounded derivatives that are not
Riemann integrable (Volterra's construction), so "it is a derivative" does not
imply "it can be integrated in this sense".

Continuity on a closed bounded interval is enough for Riemann integrability, and
the proof runs through uniform continuity, which needs compactness — a result
that belongs to real analysis rather than to calculus.

## Assumptions and requirements

Every theorem above assumes the ambient field is complete; the definitions do
not. A difference quotient and a Riemann sum are algebra, and they read
identically over $\mathbb{Q}$, where $f(x) = 1/(x^2 - 2)$ is continuous at
every point of $[0, 2] \cap \mathbb{Q}$ and unbounded on it. With no least
upper bound to appeal to, the extreme value theorem goes, the intermediate
value theorem goes ($x^2 - 2$ changes sign with no root to show for it), and
continuous functions stop being integrable. Completeness is not a background
courtesy; it is the hypothesis doing the work.

Differentiation at $a$ needs $f$ defined on a neighbourhood of $a$, not merely
at $a$: a two-sided limit needs something on both sides. At an endpoint of the
domain only a one-sided derivative exists, and at an isolated point of the
domain none does. The chain rule costs more than its statement suggests for a
related reason — the obvious proof, multiplying and dividing by $g(x+h) -
g(x)$, divides by a quantity that vanishes for arbitrarily small $h$ whenever
$g$ is locally constant or oscillates through its own value, as $g(x) =
x^2\sin(1/x)$ does at $0$. The rule survives; the naive proof does not.

Riemann integrability assumes two things the notation hides: the interval is
closed and bounded, and $f$ is bounded on it. Drop boundedness and no mesh is
fine enough, because one tag slid towards a vertical asymptote makes a single
term of the sum as large as you please. Integrals over unbounded intervals,
and of unbounded functions, are therefore not instances of the definition but
a second limit taken on top of it — which is why they can converge
conditionally and have to be argued separately.

The mean value theorem — the engine behind "zero derivative implies constant",
the monotonicity tests and the Lagrange form of Taylor's remainder — wants
continuity on the closed interval but differentiability only on the open one,
and both halves are load-bearing. Take $f(x) = x$ on $[0,1]$ and redefine
$f(1) = 0$: it is still differentiable on $(0,1)$ with $f' \equiv 1$, the
secant slope is now $0$, and no interior point has derivative $0$. Continuity
at a single endpoint was all that was given up.

Taylor's theorem needs $n+1$ derivatives on the interval, and the error bound
needs a bound on the $(n+1)$st. Without one the series can be perfectly well
defined and still wrong: $e^{-1/x^2}$, with value $0$ at the origin, is
infinitely differentiable with every derivative vanishing there, so its Taylor
series is identically zero and meets the function at exactly one point.
Infinitely differentiable does not imply analytic.

## Uses and applicability

Reach for it whenever a quantity varies smoothly in one parameter: rates and
accumulations in physics, probability densities where the CDF's derivative is
the density, root-finding by Newton's method, Taylor expansion with a remainder
term you can bound, and first-order optimality conditions. In machine learning
it is the operational core — an automatic-differentiation framework applies
exact derivative rules to each primitive and composes them by the chain rule,
so the error in a gradient is floating-point rounding, not approximation.

Do not reach for it when the objective is not differentiable where it matters
(ReLU at exactly zero — frameworks return $0$ or $1$ there by convention, not by
theorem), when the domain is discrete, or when interchanging limits and
integrals is the crux, which needs the convergence theorems of analysis.

## Limitations and common mistakes

Three misconceptions do most of the damage. First, that continuity gives
differentiability — it does not, in the isolated way ($|x|$) or in the total way
(Weierstrass). Second, that differentiability gives a _continuous_ derivative:
$f(x) = x^2 \sin(1/x)$ with $f(0) = 0$ is differentiable everywhere, yet $f'(x)
= 2x\sin(1/x) - \cos(1/x)$ has no limit at $0$. Derivatives are nevertheless
constrained — by Darboux's theorem they satisfy the intermediate value property
even when discontinuous.

Third, that $dy/dx$ is a fraction. In one variable the pretence is harmless and
even useful, but it is notation; the multivariable analogue fails, where the
cyclic relation among partials of an implicit equation gives $-1$, not $1$.

Two smaller traps: $f'(a) = 0$ does not make $a$ an extremum ($x^3$ at $0$), and
"an antiderivative exists" is not "an elementary antiderivative exists" —
$e^{-x^2}$ is continuous, so it has one, and no formula in elementary functions
expresses it.

## Variants and alternatives

The limit itself has no alternative. Nearly everything built on it has several.

**Darboux's** formulation of the integral replaces tagged sums with an infimum
of upper sums and a supremum of lower sums; it is equivalent to Riemann's for
bounded functions on a compact interval and is easier to prove with, the tags
being gone. **Riemann–Stieltjes** integrates against an integrator,
$\int_a^b f\,d\alpha$, which buys one notation covering sums and integrals at
once — a discrete and a continuous expectation written the same way — at the
cost of a hypothesis that $f$ and $\alpha$ share no point of discontinuity.
**Lebesgue's** integral partitions the range rather than the domain, buying
the convergence theorems, a complete space of integrable functions, and an
integral for things Riemann cannot reach, such as the indicator of the
rationals; it costs measure theory up front, and it is not a superset —
$\int_0^\infty \frac{\sin x}{x}\,dx$ converges as an improper Riemann integral
and is not Lebesgue integrable, because the integral of its absolute value
diverges.

The **gauge**, or Henstock–Kurzweil, integral earns a mention because it
repairs exactly the gap named above. It alters one clause of Riemann's
definition: the fineness may depend on the tag instead of being uniform across
the partition. That buys a fundamental theorem with no integrability
hypothesis at all — every derivative is gauge integrable, Volterra's example
included — and costs the normed-space structure that makes $L^1$ useful, which
is why it stayed a foundational curiosity rather than the working integral.

On the derivative side, **Carathéodory's** definition asks for a $\varphi$
continuous at $a$ with $f(x) - f(a) = \varphi(x)(x-a)$, and reads off
$f'(a) = \varphi(a)$. It picks out the same functions with no quotient
anywhere, and the chain rule drops out by composing two such factors, the
division by zero never arising. Where differentiability fails outright the
principled substitutes are the one-sided and **Dini derivatives**, which
always exist in the extended reals, and for convex functions the
**subdifferential** — the set of slopes of supporting lines, which gives ReLU
at zero the whole interval $[0,1]$ instead of a chosen convention.

Infinitesimals come back in two rigorous forms. Robinson's **non-standard
analysis** embeds the reals in a field with invertible infinitesimals, where
$dy/dx$ really is a quotient; **smooth infinitesimal analysis** gets a similar
effect from nilsquare infinitesimals at the price of intuitionistic logic.
Both buy proofs that read the way the eighteenth century wrote them, and
neither buys a new theorem — by transfer, what they establish about standard
objects was provable without them.

For computing a derivative rather than defining one the practical options are
three: symbolic differentiation, exact but prone to expression swell; finite
differences, needing no formula but trading truncation error against
cancellation, so the best step is near the square root of machine epsilon and
half the digits are lost; and automatic differentiation, exact and cheap, with
forward mode costing a pass per input and reverse mode a pass per output.

## History and attribution

The subject was created twice. Newton worked out his method of fluxions in the
mid-1660s, out of problems about motion and about infinite series, and
circulated it in manuscript for years before printing it; Leibniz reached the
differential calculus independently in the mid-1670s from another direction,
the algebra of difference sequences, and published first — in the _Acta
Eruditorum_ of 1684 for differentials and 1686 for integrals. The priority
quarrel that followed was decided for Newton by a Royal Society committee
whose report he largely drafted himself, and the modern verdict is independent
discovery. Leibniz's notation won regardless: $dy/dx$, and the $\int$ he drew
as an elongated _s_ for _summa_.

Neither invented the pieces. Archimedes computed areas by exhaustion; Fermat's
method for maxima and minima, and his quadratures of power curves, are the two
operations in particular cases in the 1630s; and Barrow, Newton's predecessor
in the Lucasian chair, had a geometric statement of the inverse relation
between tangents and areas. What Newton and Leibniz added was generality —
rules applying to any expression, and the theorem that the two operations undo
each other.

Rigour arrived a century and a half later and turned a method into a theory.
Cauchy rebuilt the calculus on limits in his lectures at the École
Polytechnique in the 1820s; Weierstrass's Berlin lectures gave the
$\varepsilon$–$\delta$ formulation used above, and the nowhere-differentiable
function he presented in 1872 ended the assumption that continuity supplies a
derivative. Riemann's integral comes from his 1854 Habilitation essay on
trigonometric series, published only after his death, and Darboux's
upper-and-lower-sum version from an 1875 memoir — the same one carrying the
intermediate-value property of derivatives that now bears his name. Bolzano
had much of this earlier, a rigorous account of continuity in 1817 and a
continuous nowhere-differentiable function in work from the 1830s that stayed
unpublished for a century, so the standard names record influence rather than
priority. The word _derivative_ and the prime notation are Lagrange's.

No source cited on this page is a history of mathematics. The dates above are
the standard ones and the attributions the uncontested ones; anything finer —
who saw what first, and when — should be checked against a primary historical
source before it is relied on.

## Sources

MIT's 18.01 is the reference for the whole computational layer — the limit
definitions, the differentiation and integration rules, and the worked
mechanics. Tao's _Analysis I_ is where the same statements are proved rather
than asserted, and is the place to see which hypotheses are load-bearing. MIT
18.100A covers the compactness and uniform-continuity results this page defers
to. The _Deep Learning_ book is cited only for the downstream use — how the
chain rule becomes backpropagation.

## Prerequisites and next connections

You need functions, inequalities and algebraic manipulation, plus a willingness
to treat the real numbers as given; real analysis is what returns later and
justifies that.

From here, multivariable calculus generalises the derivative to a linear map and
the integral to regions, and differential equations use the fundamental theorem
as their engine. On the applied side, [Convolution](./convolution.md) is a
definite integral in disguise, and
[Backpropagation Through Convolution](./backpropagation-through-convolution.md)
takes its per-primitive derivative rules from this page, while the law that
composes them across a layer is the multivariable chain rule.
