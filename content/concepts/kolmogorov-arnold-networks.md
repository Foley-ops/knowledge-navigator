---
concept_id: concept.deep_learning.kolmogorov_arnold_networks
title: Kolmogorov-Arnold Networks
slug: /concepts/kolmogorov-arnold-networks
aliases:
  - KAN
kind: method
tier: 1
review_state: generated-draft
summary: An architecture that moves the learnable nonlinearity from the nodes to the edges — every connection carries its own univariate spline and every node just adds — inspired by, but not licensed by, the Kolmogorov-Arnold representation theorem.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: contrasts_with
    target: concept.deep_learning.multilayer_perceptrons
    note: The two differ in exactly one structural choice — a fixed shape on the node and a scalar on the edge, versus a learned shape on the edge and a plain sum on the node — so every comparison between them isolates that choice.
  - type: contrasts_with
    target: concept.deep_learning.radial_basis_function_networks
    note: Both replace the dot-product unit with a basis expansion, but an RBF network expands in basis functions of the distance to a centre in the full input space and fits the output layer linearly, while a KAN expands each coordinate separately and stacks the result.
  - type: contrasts_with
    target: concept.machine_learning.generalized_linear_models
    note: A generalized additive model replaces the linear predictor with a sum of univariate splines, which is exactly a one-layer KAN; KANs stack that construction and give up its convex fit and per-coordinate readability to gain depth.
  - type: requires
    target: concept.deep_learning.backpropagation
    note: Nothing about the architecture changes how it is fitted — the spline coefficients are ordinary parameters trained by gradients through the composition — so a reader who does not know backpropagation cannot follow how a KAN is trained.
sources:
  - source_id: source.liu2024.kolmogorov_arnold_networks
    title: 'KAN: Kolmogorov-Arnold Networks'
    url: https://arxiv.org/abs/2404.19756
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.deep_learning_book.mlp
    title: Deep Learning, Chapter 6 — Deep Feedforward Networks
    url: https://www.deeplearningbook.org/contents/mlp.html
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - concrete-example
    checked_on: 2026-09-17
unresolved_references:
  - label: Kolmogorov (1957) and Arnold (1957), and Vitushkin's obstruction to a smooth superposition theorem
    reason: The registry holds no primary source for the superposition theorem or for the results showing its constituent functions cannot be taken smooth, so the statement and its caveats here follow the restatement in Liu et al. and standard accounts rather than the original papers.
    sections:
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
  - label: Independent parameter- and compute-matched comparisons of KANs against MLPs published after Liu et al. (2024)
    reason: The registry contains no replication or follow-up benchmark studies, so the mixed state of the evidence is reported as the contested empirical situation it is, without a citable source for any individual result.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
claims: []
---

## Definition

A **Kolmogorov-Arnold Network** is a feedforward network in which every edge
carries a learnable univariate function and every node computes a plain sum of
the incoming values. There is no weight matrix and no fixed activation: one layer
maps $x \in \mathbb{R}^{n_l}$ to $\mathbb{R}^{n_{l+1}}$ by

$$
x^{(l+1)}_j \;=\; \sum_{i=1}^{n_l} \phi^{(l)}_{j,i}\!\left(x^{(l)}_i\right),
\qquad j = 1, \dots, n_{l+1},
$$

where each $\phi^{(l)}_{j,i} : \mathbb{R} \to \mathbb{R}$ is parameterised, in the
formulation of Liu et al. (2024), as a B-spline plus a residual term,

$$
\phi(x) \;=\; w_b \,\mathrm{silu}(x) \;+\; w_s \sum_{m=1}^{G+k} c_m B_m(x),
$$

with $B_m$ the order-$k$ B-spline basis on a grid of $G$ intervals and
$w_b, w_s, c_1, \dots, c_{G+k}$ all learned.

## Why it matters

In a [Multilayer Perceptron](./multilayer-perceptrons.md) the learnable content of
a connection is one number and the nonlinear shape is chosen in advance by the
architect. A KAN inverts that: the shape is learned, per connection, and the
architect chooses only how much resolution it gets. That is a genuinely different
place to spend capacity, and it makes two things possible. The model can fit a
function whose per-coordinate warp is unknown and sharp — a logarithm, a
threshold, a resonance — without building it out of many ReLU pieces. And because
each learned object is a function of one variable, it can be plotted, pruned and
sometimes matched against a symbolic form, which is why KANs are pitched at small
scientific fitting problems rather than large-scale representation learning.

## Intuition

Picture an MLP's edge as a volume knob and its node as a fixed distortion pedal.
A KAN replaces each knob with a graphic equaliser and removes the pedal: the
connection itself decides what to do with the signal, and the node only mixes.

The analogy breaks in one place. A node sums, so a single KAN layer is an
_additive_ model of univariate functions: nothing inside one layer multiplies two
inputs together, and interactions appear only through depth, exactly as in an MLP.
"Each edge learns its own function, so interactions are free" is wrong, and the
multiplication example below shows why.

## Concrete example

Multiplication is the cleanest case. Since

$$
xy = \tfrac{1}{4}\left[(x+y)^2 - (x-y)^2\right],
$$

a $[2,2,1]$ KAN represents $xy$ exactly. The first layer's four edge functions are
$x \mapsto x$, $y \mapsto y$ into the first hidden node and $x \mapsto x$,
$y \mapsto -y$ into the second; the second layer's two are $u \mapsto u^2/4$ and
$v \mapsto -v^2/4$. Take $x = 0.3$, $y = 0.7$: the hidden node values are
$u = 1.0$ and $v = -0.4$, the output edges give $0.25$ and $-0.04$, and the sum is
$0.21 = xy$. Every function used is a polynomial of degree at most two, and a
cubic ($k = 3$) spline space contains those exactly on its grid range, so with the
residual weights $w_b$ at zero the fit is exact rather than approximate. No ReLU
MLP represents $xy$ exactly at any finite width, because a piecewise-linear
function is not a quadratic.

A layer, written out with the Cox-de Boor recursion for the basis:

```python
import torch

def b_splines(x, grid, k):          # x: (B, n_in), grid: (n_in, G + 2k + 1)
    x = x.unsqueeze(-1)
    bases = ((x >= grid[:, :-1]) & (x < grid[:, 1:])).to(x.dtype)
    for p in range(1, k + 1):
        left = (x - grid[:, : -(p + 1)]) / (grid[:, p:-1] - grid[:, : -(p + 1)])
        right = (grid[:, p + 1 :] - x) / (grid[:, p + 1 :] - grid[:, 1:-p])
        bases = left * bases[..., :-1] + right * bases[..., 1:]
    return bases                    # (B, n_in, G + k)

class KANLayer(torch.nn.Module):
    def __init__(self, n_in, n_out, G=5, k=3, lo=-1.0, hi=1.0):
        super().__init__()
        h = (hi - lo) / G
        knots = torch.arange(-k, G + k + 1) * h + lo
        self.register_buffer("grid", knots.expand(n_in, -1).contiguous())
        self.k = k
        self.coef = torch.nn.Parameter(0.1 * torch.randn(n_out, n_in, G + k))
        self.w_b = torch.nn.Parameter(torch.ones(n_out, n_in))

    def forward(self, x):           # (B, n_in) -> (B, n_out)
        bs = b_splines(x, self.grid, self.k)
        return (torch.einsum("bik,oik->bo", bs, self.coef)
                + torch.nn.functional.silu(x) @ self.w_b.T)
```

The coefficient tensor is `(n_out, n_in, G + k)`: a layer holds
$n_{\text{in}} n_{\text{out}} (G+k)$ spline parameters where a dense layer holds
$n_{\text{in}} n_{\text{out}}$.

## Formal treatment

**Kolmogorov-Arnold representation theorem.** For every continuous
$f : [0,1]^n \to \mathbb{R}$ there exist continuous univariate functions
$\phi_{q,p} : [0,1] \to \mathbb{R}$ and $\Phi_q : \mathbb{R} \to \mathbb{R}$ with

$$
f(x_1, \dots, x_n) \;=\; \sum_{q=0}^{2n} \Phi_q\!\left( \sum_{p=1}^{n} \phi_{q,p}(x_p) \right).
$$

Every continuous function of $n$ variables is therefore a finite superposition of
continuous functions of _one_ variable and addition. Refinements due to Lorentz
and Sprecher sharpen this: the inner functions can be chosen once and for all,
independent of $f$ and monotone, with all of the $f$-dependence in the $2n+1$
outer functions.

**The gap between that theorem and this architecture is the whole subject.** The
theorem is an exact-representation statement about a fixed two-layer shape of width
$2n+1$, and the functions it produces are merely continuous — Vitushkin showed
there is no smooth analogue, so they are in general badly non-differentiable and a
fixed low-order spline space cannot hold them. It also says nothing about learning
them from data. A KAN is deeper than two layers, arbitrary in width and constrained
to splines; it is not the object the theorem is about, and no theorem says a deep
spline network inherits the superposition theorem's universality.

What Liu et al. prove instead is a spline approximation bound whose hypothesis
does the work. _If_ $f$ admits a representation as an $L$-layer KAN whose
univariate functions are $(k{+}1)$-times continuously differentiable, then for
grid size $G$ there are coefficients with

$$
\left\| f - \Phi^{G} \right\|_{C^m} \;\le\; C\, G^{-k-1+m},
$$

where $\|\cdot\|_{C^m}$ bounds derivatives up to order $m$ and $C$ depends on $f$
and on that representation — and therefore, as Liu et al. concede, on $n$ as well.
What is independent of $n$ is the _rate_ in $G$, and that is a consequence of the
assumed smooth representation, not a defeat of the curse of dimensionality: the
assumption, and the constant it hides, is where the dimension went.

## Assumptions and requirements

The spline grid must cover the range the activations actually take. Outside it the
basis is zero and only the residual $\mathrm{silu}$ term survives, so inputs must
be scaled or the grid updated from the running activation range during training, as
the reference implementation does. A grid that never adapts to a drifting
distribution silently turns the layer into a plain SiLU network.

The efficiency argument assumes the target is smooth enough for low-order splines
— the same assumption spline regression makes, and it fails for discontinuous or
highly oscillatory targets, where the knot count must grow. The interpretability
argument assumes more: that the true function is sparse and compositional, that
pruning found that structure, and that the surviving edges are few enough to read.
Training converging is not evidence for any of the three.

## Uses and applicability

Reach for a KAN on low-dimensional regression of a function you believe has
compositional structure and want to _read_: physical relations, symbolic formula
recovery, PDE surrogates on modest inputs. The published successes are of this
kind, and grid extension — refitting the same network on a finer grid — buys
accuracy cheaply once the shape of the solution is known.

Do not reach for one as a general drop-in for dense layers at scale. Whether KANs
beat parameter-matched MLPs on ordinary vision, language and tabular benchmarks is
contested: independent comparisons since 2024 have been mixed, the advantage
largely holding on symbolic function-fitting and largely disappearing elsewhere.
Treat the original benchmark claims as promising and unsettled.

## Limitations and common mistakes

The first and largest mistake is believing the theorem proves the architecture
works. It does not, for the reasons above, and Liu et al. are themselves explicit
that the theorem is inspiration rather than justification.

The second is counting parameters as if they were cost. Every edge holds $G+k$
coefficients and, worse, applies a _different_ function, which destroys the single
large matrix multiply that makes dense layers fast. The original paper reports
KANs training roughly an order of magnitude slower than MLPs at equal parameter
count and names this the main bottleneck; wall-clock and FLOPs at matched accuracy
are the currency that matters.

The third is over-reading interpretability. A learned edge function that looks
like a sine is not evidence that the mechanism is a sine — it is one component of
a composition that a sparsification and symbolic-snapping pipeline, often with a
human choosing, has been steered toward, on targets that really were
compositional.

Smaller traps: results are sensitive to grid range, grid-update schedule and
initialization, and the fast reimplementations in circulation differ in how the
residual and scale terms are handled, so numbers from different codebases are not
comparable by default.

## Variants and alternatives

The obvious axis of variation is the basis: Chebyshev polynomials, Fourier
features, wavelets and Gaussian radial basis functions have all replaced the
B-splines. RBF versions are much faster, the basis being a closed form rather than
a recursion, at the cost of local support and knot adaptivity. Structural variants
put KAN layers inside convolutions or in place of the feedforward sublayer of a
transformer block.

The genuine alternatives are worth naming. A plain MLP with a smooth activation is
the baseline and usually the faster one. **Generalized additive models** with
spline terms get the same per-coordinate readability with a convex fit, at depth
one. **Learned activations** — PReLU, maxout, adaptive activations — are the
shallow version of the same idea, keeping the matrix multiply. And for the
interpretability goal specifically, symbolic regression attacks the problem
directly rather than fitting a network and then reading it.

## History and attribution

The theorem answers Hilbert's thirteenth problem (1900), which asked whether the
roots of the general seventh-degree equation could be written as superpositions of
continuous functions of two variables. Kolmogorov reduced functions of $n$
variables to superpositions of functions of three in 1956; Arnold, then his
student, brought the count to two in 1957; Kolmogorov's 1957 paper reached one
variable plus addition, the form quoted above.

Reading the theorem as a neural network is much older than KANs: Hecht-Nielsen
proposed the mapping in 1987, Girosi and Poggio argued in 1989 that the theorem is
irrelevant to networks because its constituent functions are non-smooth and depend
on $f$ discontinuously, and Kůrková replied in the early 1990s that approximate
versions with smooth constituents are relevant after all. Liu et al. (2024)
revived the line with the spline parameterisation, grid extension and the
sparsify-prune-symbolify workflow, aimed explicitly at AI for science; the
follow-up literature and the disagreement about the benchmark claims both date
from that paper.

## Sources

The KAN paper of Liu et al. covers the architecture, the spline parameterisation,
the approximation bound and its hypothesis, grid extension, the interpretability
workflow and the authors' own account of the speed penalty. The Elements of
Statistical Learning is the reference for B-spline bases, knot placement and
additive models — the classical statistics a KAN layer reproduces one layer at a
time. Deep Learning, Chapter 6 supplies the MLP baseline, and the PyTorch
documentation the machinery the code block uses.

## Prerequisites and next connections

Read [Multilayer Perceptrons](./multilayer-perceptrons.md) first — a KAN is one
swap away from it, and the comparison is unreadable without it — and
[Backpropagation](./backpropagation.md), since the spline coefficients are trained
no differently from any other parameter.

From here, [Radial Basis Function Networks](./radial-basis-function-networks.md)
is the closest classical relative and shows what a basis expansion buys when the
fit is linear, [Kernel Methods](./kernel-methods.md) is the other route to rich
function classes with a convex objective, and
[Regularization](./regularization.md) and [Pruning](./pruning.md) are the general
forms of the steps that make a trained KAN small enough to read.
