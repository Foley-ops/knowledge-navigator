---
concept_id: concept.linear_algebra.tensor_decomposition
title: Tensor Decomposition
slug: /concepts/tensor-decomposition
aliases:
  - tensor factorization
kind: concept
tier: 1
review_state: generated-draft
summary: Writing a multi-way array as a short combination of simple factors — CP, Tucker, tensor train — which buys an essential uniqueness that no unconstrained matrix factorisation has, at the cost of almost every computational guarantee the SVD provides.
categories:
  - Mathematics/Linear & Multilinear Algebra
primary_category: Mathematics/Linear & Multilinear Algebra
relationships:
  - type: requires
    target: concept.linear_algebra.tensors
    note: Every statement here is about an order-d array and its modes, and a reader who has not separated the multilinear-map sense of the word from the framework-array sense will read the rank claims as claims about arrays of numbers.
  - type: generalizes
    target: concept.linear_algebra.matrix_decompositions
    note: At d = 2 the CP decomposition is exactly a rank-revealing matrix factorisation, but existence of a best rank-k approximation, nested truncation and polynomial-time rank are lost in the generalisation, which is the whole content of the subject.
  - type: contrasts_with
    target: concept.linear_algebra.spectral_theory
    note: The spectral theorem buys orthogonality at the price of an arbitrary rotation inside each eigenspace, while CP gives up orthogonality entirely and gets essential uniqueness of the factors instead.
  - type: contributes_to
    target: concept.probability.high_dimensional_statistics
    note: Third-order moments of a latent-variable model form a tensor whose CP decomposition is essentially unique, which turns non-identifiable second-moment problems into identifiable third-moment ones.
sources:
  - source_id: source.axler.linear_algebra_done_right
    title: Sheldon Axler, Linear Algebra Done Right
    url: https://linear.axler.net/
    source_kind: authoritative-secondary
    supports:
      - definition
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.mathworld
    title: Wolfram MathWorld
    url: https://mathworld.wolfram.com/
    source_kind: reference-documentation
    supports:
      - definition
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.arora_barak.computational_complexity
    title: 'Sanjeev Arora and Boaz Barak, Computational Complexity: A Modern Approach'
    url: https://theory.cs.princeton.edu/complexity/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

A **tensor decomposition** expresses an order-$d$ array
$\mathcal{T} \in \mathbb{F}^{n_1 \times \cdots \times n_d}$, over
$\mathbb{F} = \mathbb{R}$ or $\mathbb{C}$, as a combination of pieces simpler
than itself. Three forms dominate:

- **CP** (canonical polyadic, also CANDECOMP/PARAFAC) — a sum of $R$ **rank-one**
  tensors, each an outer product of one vector per mode. The least such $R$ is
  the **tensor rank** of $\mathcal{T}$.
- **Tucker** — a small dense core transformed by one factor matrix per mode; its
  size parameter is the **multilinear rank**, a $d$-tuple, not a number.
- **Tensor train** (TT) — one order-3 core per mode, multiplied along the chain.

At $d = 2$, CP is just "write $A$ as a sum of $R$ rank-one matrices", so all three
generalise [Matrix Decompositions](./matrix-decompositions.md). What does not
generalise is the reason those are pleasant to use.

## Why it matters

Two things, independent of each other.

The first is **size**. A $d$-way array of side $n$ has $n^d$ entries; at $d = 50$
and $n = 2$ that is about $1.1 \times 10^{15}$ numbers, while a tensor train with
all ranks $10$ stores about $d n r^2 = 10^4$ and supports sums, inner products
and norms without ever expanding. This is how quantum many-body states and
high-dimensional PDE solutions are handled at all.

The second is **uniqueness**, and it is the surprise. An unconstrained matrix
factorisation is never unique: the factors are determined only up to a $GL(R)$
ambiguity, $A B^{\top} = (AM)(B M^{-\top})^{\top}$ for any invertible $M$, so
PCA and factor analysis must impose orthogonality, sparsity or nonnegativity to
name their factors — assumptions about the world rather than consequences of the
data. The SVD is not a counterexample but the clearest case of the price: with
distinct singular values it is essentially unique, up to a sign per column, and
it buys that by imposing orthogonality. A CP decomposition, under Kruskal's
condition below, is unique up to permuting and rescaling its terms, with no such
constraint. A third mode is a
second independent view of the same latent objects, and that is enough.

## Intuition

Carry two pictures. The SVD is a telescoping series: terms ordered by size,
mutually orthogonal, and you may stop anywhere, so the best rank-$k$ fit sits
inside the best rank-$(k{+}1)$ fit. CP is a chemical mixture: each term is a
triple of profiles — one spectrum, one time course, one concentration — not
orthogonal, not ordered, not nested. The best single component is generally not
one of the best two.

The analogy breaks hardest at approximation. The set of rank-$\le k$ matrices is
closed, so a nearest one exists. For order $\ge 3$ the rank-$\le R$ set is not
closed once $R \ge 2$: a rank-3 tensor can sit in the closure of the rank-2 set,
so you get arbitrarily close with two terms and never arrive. "The best rank-2
approximation" is then a phrase with no referent.

## Concrete example

Two $2 \times 2 \times 2$ tensors carry most of the theory.

**Rank depends on the field.** Let $\mathcal{X}$ have frontal slices
$X_1 = \bigl(\begin{smallmatrix}1&0\\0&1\end{smallmatrix}\bigr)$ and
$X_2 = \bigl(\begin{smallmatrix}0&1\\-1&0\end{smallmatrix}\bigr)$. For a
$2\times2\times2$ tensor with invertible first slice, the rank is 2 exactly when
$M = X_1^{-1}X_2$ is diagonalisable over $\mathbb{F}$, and 3 otherwise. Here $M$
has eigenvalues $\pm i$: rank 2 over $\mathbb{C}$, rank 3 over $\mathbb{R}$. The
array of numbers did not change; the field did.

**The best rank-2 approximation need not exist.** With $a = e_1$, $b = e_2$, set
$\mathcal{T} = a\otimes a\otimes b + a\otimes b\otimes a + b\otimes a\otimes a$.
Its $M$ is nilpotent, hence not diagonalisable over either field, so its rank is
3 over both. Then

$$
\mathcal{S}_\varepsilon = \tfrac{1}{\varepsilon}\Bigl[(a+\varepsilon b)^{\otimes 3} - a^{\otimes 3}\Bigr]
$$

is a sum of two rank-one tensors, and
$\lVert \mathcal{T} - \mathcal{S}_\varepsilon\rVert_F = \sqrt{3\varepsilon^2 + \varepsilon^4}$.

```python
import numpy as np
a, b = np.array([1.0, 0.0]), np.array([0.0, 1.0])
op = lambda x, y, z: np.einsum('i,j,k->ijk', x, y, z)
T = op(a, a, b) + op(a, b, a) + op(b, a, a)          # rank 3, border rank 2
for eps in (1e-1, 1e-2, 1e-3):
    S = (op(a + eps*b, a + eps*b, a + eps*b) - op(a, a, a)) / eps
    print(eps, np.linalg.norm(T - S))                # 0.1735, 0.01732, 0.001732
```

The infimum over rank-$\le 2$ tensors is $0$ and is not attained. Note what the
factors do: their norms grow like $1/\varepsilon$ while their sum stays bounded.
That is the "degenerate solution" a fitting routine reports — two huge components
that nearly cancel.

## Formal treatment

Write $\otimes$ for the outer product, so
$(u^{(1)} \otimes \cdots \otimes u^{(d)})_{i_1 \ldots i_d} = \prod_k u^{(k)}_{i_k}$.

**CP.**

$$
\mathcal{T} \;=\; \sum_{r=1}^{R} \lambda_r \, a^{(1)}_r \otimes a^{(2)}_r \otimes \cdots \otimes a^{(d)}_r ,
$$

where $\lambda_r \in \mathbb{F}$ scales unit-norm factor vectors $a^{(k)}_r$, and
$\operatorname{rank}_{\mathbb{F}}(\mathcal{T})$ is the least admissible $R$.

**Kruskal's uniqueness theorem** ($d = 3$). Collect the vectors into factor
matrices $A, B, C$ with $R$ columns each, and let the Kruskal rank $k_A$ be the
largest $k$ such that every $k$ columns of $A$ are linearly independent. If

$$
k_A + k_B + k_C \;\ge\; 2R + 2 ,
$$

the rank-$R$ decomposition is unique up to a common permutation of the $R$ terms
and scalings $\alpha_r\beta_r\gamma_r = 1$. No orthogonality is assumed. The
condition is sufficient, not necessary.

**Tucker.** $\mathcal{T} = \mathcal{G} \times_1 U^{(1)} \times_2 \cdots \times_d U^{(d)}$
with core $\mathcal{G} \in \mathbb{F}^{r_1 \times \cdots \times r_d}$ and
$r_k = \operatorname{rank}(T_{(k)})$, the mode-$k$ unfolding rank. The set of
multilinear rank $\le (r_1,\dots,r_d)$ _is_ closed, so a best approximation
exists; the truncated higher-order SVD is not optimal but lands within $\sqrt{d}$
of it in Frobenius norm.

**Tensor train.** $\mathcal{T}_{i_1 \ldots i_d} = G_1(i_1) G_2(i_2)\cdots G_d(i_d)$
with $G_k(i_k) \in \mathbb{F}^{r_{k-1}\times r_k}$ and $r_0 = r_d = 1$; the TT
ranks are those of the unfoldings splitting $\{1,\dots,k\}$ from the rest, and
TT-SVD is likewise quasi-optimal, within $\sqrt{d-1}$.

Four theorems mark the boundary with the matrix case. Rank is field-dependent,
$\operatorname{rank}_{\mathbb{C}} \le \operatorname{rank}_{\mathbb{R}}$, strictly
for the example above. The rank-$\le R$ set is not closed for $R \ge 2$, $d \ge 3$
(de Silva and Lim, 2008), so best rank-$R$ approximation is ill-posed; the least
$R$ achievable in the limit is the **border rank**. Deciding tensor rank is
NP-hard (Håstad, 1990, over finite fields and $\mathbb{Q}$; Hillar and Lim, 2013,
over $\mathbb{R}$ and $\mathbb{C}$). And there is no generic rank over
$\mathbb{R}$: a real $2\times2\times2$ tensor with i.i.d. Gaussian entries has
rank 2 with probability $\pi/4 \approx 0.79$ and rank 3 otherwise, both sets
having positive measure. Over $\mathbb{C}$ a generic rank does exist, but it is
not the naive parameter count — $3\times3\times3$ has generic rank 5, not
$\lceil 27/7 \rceil = 4$. One guarantee survives: the rank-$\le 1$ set is closed,
so a best rank-one approximation always exists.

## Assumptions and requirements

State the field. "Rank 2" is meaningless without it, and a real-arithmetic solver
will never find a decomposition that exists only over $\mathbb{C}$.

Kruskal's condition assumes three modes and exactly $R$ terms; multi-way
extensions exist, usually by grouping modes, and are weaker. Even when it holds,
uniqueness is only _essential_: permutation and scaling (including sign flips in
pairs) always remain, so "component 1" is not a stable label. The quasi-optimality
bounds for HOSVD and TT-SVD assume the Frobenius norm and orthonormal factors and
say nothing in other norms.

Underneath all of it sits a modelling assumption: the modes must be comparable,
so that one set of factors can explain every slice. Stack unrelated matrices into
a third mode and a low-rank CP model will still fit something, and it will mean
nothing.

## Uses and applicability

Reach for CP when the factors themselves are the answer and a multilinear model
is plausible. The canonical success is fluorescence spectroscopy, where
excitation $\times$ emission $\times$ sample data is trilinear by the physics and
PARAFAC recovers the actual chemical spectra. The same logic drives moment
methods: a third-moment tensor with an essentially unique CP decomposition
identifies mixture components that second-order statistics cannot separate.

Reach for Tucker or TT when you want compression, not interpretation — model
order reduction, weight matrices, quantum states, high-dimensional quadrature.
Those problems are well posed and truncated-SVD algorithms come with bounds.
Reach for neither when one mode dominates: unfolding and running an SVD keeps
every guarantee and often loses nothing. Tensor rank also has a life outside data
analysis — the rank of the $2\times2$ matrix-multiplication tensor is 7, which is
Strassen's algorithm.

## Limitations and common mistakes

The first mistake is expecting an SVD: truncation is not nested, CP factors are
not orthogonal, the terms have no canonical order, and the largest unfolding rank
is a lower bound on the rank, not the rank. Related is confusing the two ranks —
multilinear rank $(3,3,3)$ does not mean CP rank 3, and the HOSVD core is dense
rather than diagonal.

The second is reading a fit as a result. Alternating least squares has no global
convergence guarantee, and when $R$ exceeds the rank or the data sits near the
ill-posed boundary it returns diverging, cancelling components — a symptom of
non-existence, not of bad initialisation. Norm penalties, or nonnegativity
constraints (under which a minimiser always exists), restore well-posedness.

The third is over-reading NP-hardness: it is a worst-case statement about exact
rank on adversarial inputs, and ALS on a real $100^3$ array with $R = 5$ usually
works fine. Hardness does not forbid your instance; convergence does not certify
your $R$.

## Variants and alternatives

**CP** and **Tucker** are the classical poles, with **block term decompositions**
interpolating (sums of low-multilinear-rank terms). **HOSVD** and **HOOI** are the
standard Tucker algorithms, a one-pass truncation and an iterative refinement.
**Tensor train**, **hierarchical Tucker** and **tensor ring** avoid Tucker's $r^d$
core and scale to large $d$. **Cross/CUR approximation** builds factors from
actual fibres, keeping sparsity and never touching the full array.
**Nonnegative** factorisation trades a smaller feasible set for existence and
interpretability. The **t-SVD**, built on a circulant product along the third
mode, does restore an Eckart–Young-type optimality — but for a tubal rank under a
different algebra, and it treats the third mode asymmetrically. The plainest
alternative remains unfolding plus SVD.

## History and attribution

Hitchcock introduced the polyadic form and tensor rank in 1927. Cattell argued in
1944 that a third mode resolves the rotation ambiguity of factor analysis —
"parallel proportional profiles", the uniqueness idea before it had a theorem.
Tucker gave his three-mode model in 1966, and in 1970 Carroll and Chang
(CANDECOMP) and Harshman (PARAFAC) published the same decomposition
independently, in psychometrics and in phonetics; the name CP acknowledges both.
Kruskal proved the uniqueness condition in 1977. Strassen's 1969 algorithm made
tensor rank a complexity question, and Håstad showed in 1990 that deciding it is
NP-complete. De Lathauwer, De Moor and Vandewalle formalised the HOSVD in 2000,
de Silva and Lim the ill-posedness of low-rank approximation in 2008. Oseledets
named the tensor train in 2011, though the same object was already used in
quantum many-body physics as matrix product states.

## Sources

The cited sources cover the surrounding material, not this page's core results,
and that is worth saying plainly. Axler is the reference for multilinear maps,
the tensor product, rank-one elements, and the care about $\mathbb{R}$ versus
$\mathbb{C}$ that the field-dependence example turns on; MathWorld for a compact
definition of the outer product, and for that only — its "Tensor Rank" entry
uses _rank_ in the order sense, the number of indices, which is the reading this
page warns against and not the CP rank defined above; MIT 18.065 for the matrix
baseline this page is measured against, SVD and Eckart–Young and low-rank
approximation. Arora and Barak is cited only for what NP-hardness does and does
not claim about your instance; it does not contain Håstad's result. The
specialised literature — Kruskal, de Silva and Lim, Oseledets, the Kolda–Bader
survey — is not in the registry, so check the theorems above against those
primary sources before relying on them.

## Prerequisites and next connections

Read [Tensors](./tensors.md) first: every rank statement here is about the
multilinear object, not the framework array. [Matrix
Decompositions](./matrix-decompositions.md) is the baseline you need in order to
feel which guarantees have gone missing, and [Matrix
Theory](./matrix-theory.md) supplies the rank and unfolding vocabulary.

Afterwards, [Spectral Theory](./spectral-theory.md) reads differently: the
rotation ambiguity inside an eigenspace is exactly the non-uniqueness a third
mode removes. The routes onward are algebraic geometry, where border and generic
rank become statements about secant varieties of the Segre variety, and algebraic
complexity theory.
