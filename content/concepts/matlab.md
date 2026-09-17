---
concept_id: concept.languages.matlab
title: MATLAB
slug: /concepts/matlab
kind: tool
tier: 1
review_state: generated-draft
summary: MATLAB is a proprietary interactive environment and language in which the primitive value is a dense matrix, which makes numerical linear algebra terse to write and fast to run, at the price of a licence that its code carries with it.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: requires
    target: concept.linear_algebra.matrix_theory
    note: The language's semantics are matrix semantics — a reader who does not already know what matrix multiplication, rank and solving a linear system mean cannot read a MATLAB expression, because the operators are those operations.
  - type: implements
    target: concept.linear_algebra.matrix_decompositions
    note: MATLAB exposes LU, Cholesky, QR, eigendecomposition and the SVD as ordinary operators and one-word functions, and the backslash operator picks which decomposition to run from the shape and detected structure of the matrix.
  - type: used_to_solve
    target: concept.analysis.ordinary_differential_equations
    note: Its ODE suite — ode45 and the stiff solvers ode15s and ode23s — is one of the most widely used front ends for numerically integrating initial value problems.
  - type: contrasts_with
    target: concept.languages.julia
    note: Julia targets the same numerical audience and inherits one-based indexing and column-major storage from MATLAB, but is free, compiles user-written scalar code, and resolves operators by multiple dispatch rather than by fixed array semantics.
sources:
  - source_id: source.mathworks.matlab
    title: MATLAB documentation
    url: https://www.mathworks.com/help/matlab/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.linear_algebra
    title: MIT 18.06 Linear Algebra (Spring 2010)
    url: https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/
    source_kind: lecture-or-course
    supports:
      - intuition
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - why-it-matters
    checked_on: 2026-09-17
  - source_id: source.julia.documentation
    title: The Julia Language documentation
    url: https://docs.julialang.org/en/v1/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Cleve Moler's account of the origins of MATLAB, and the LINPACK and EISPACK user guides
    reason: The registry has no source on the history of numerical software, so the lineage from the Fortran libraries and the 1984 founding of MathWorks is stated from general knowledge and should be verified before being relied on.
    sections:
      - history-and-attribution
  - label: GNU Octave manual
    reason: No registry source documents Octave, so the claims about how far its compatibility with the MATLAB language extends are uncited.
    sections:
      - variants-and-alternatives
      - limitations-and-common-mistakes
  - label: Backward error analysis of Gaussian elimination and Householder QR
    reason: The registry holds no numerical analysis text, so the accuracy bound quoted in the formal treatment is standard but uncited here.
    sections:
      - formal-treatment
claims: []
---

## Definition

**MATLAB** — from _matrix laboratory_ — is a commercial numerical computing
environment and the language it runs, sold by MathWorks. Its defining choice is
that the primitive value is a dense, rectangular, double-precision array: a
scalar is a $1 \times 1$ matrix, a row vector $1 \times n$, a character string a
$1 \times n$ array of characters. Arrays are indexed from $1$ and
stored in column-major order. The bare operators `*`, `/`, `\` and `^` mean
matrix multiply, right division, left division (that is, _solve_) and matrix
power; the dotted forms `.*`, `./` and `.^` are the elementwise versions. Code lives
in plain-text `.m` files run by a just-in-time-compiling interpreter, inside an
IDE with a persistent workspace, plotting and a debugger, alongside a large set
of separately licensed **toolboxes**.

## Why it matters

Before an interactive matrix environment existed, solving $Ax = b$ meant writing
a Fortran program that called a library, compiling it, linking it and running it
— a loop of minutes for an operation that takes microseconds. MATLAB collapsed
that loop: `x = A\b` at a prompt gives a library-quality answer immediately. That is the idea every array
language since has inherited. The applied linear algebra of least squares, the
SVD and low-rank approximation becomes something a researcher tries out rather
than something they commission.

## Intuition

The picture to carry is that the matrix is the noun and the loop is the thing
you do not write. `A(:, 2)` is the second column, `A(3, :)` the third row,
`A(A > 0)` every positive entry as a column vector — whole objects, one
expression each.

The analogy to mathematical notation breaks in a specific place: MATLAB grew
outward from the matrix rather than down from the mathematics. Everything that is
not a numeric array — structs, cell arrays, function handles, classes, strings —
was retrofitted later, which is why heterogeneous data needs a cell array with
brace indexing `c{3}`, and why strings come in two overlapping systems.

## Concrete example

```matlab
M = magic(4);   % 16  2  3 13
                %  5 11 10  8
                %  9  7  6 12
                %  4 14 15  1

M(2,3)          % ans = 10     row 2, column 3 -- rows first, counting from 1
M(7)            % ans = 7      one linear index, counting DOWN columns
M(:,2)'         % ans = 2  11  7  14

A = [1 1; 1 2; 1 3];   % fit b = c0 + c1*t at t = 1, 2, 3
b = [1; 2; 2];
x = A \ b              % x = 0.6667
                       %     0.5000
norm(b - A*x)          % ans = 0.4082
```

`M(7)` returning $7$ rather than $10$ is the whole of column-major storage: the
seventh element in memory is row 3 of column 2, not row 2 of column 3. And
`A\b` solved nothing — $A$ is
$3 \times 2$ and the system is inconsistent, so the same operator ran a
Householder QR factorisation and returned the least-squares minimiser of
$\lVert Ax - b \rVert_2$. Had $A$ been square it would have run LU instead.

## Formal treatment

An $m \times n$ array occupies $mn$ contiguous slots, and the element at
$(i, j)$, with $1 \le i \le m$ and $1 \le j \le n$, sits at linear index

$$k \;=\; i + (j - 1)\,m .$$

For an $N$-dimensional array with sizes $d_1, \dots, d_N$, the subscript tuple
$(i_1, \dots, i_N)$ maps to

$$k \;=\; i_1 + \sum_{r=2}^{N} (i_r - 1) \prod_{q=1}^{r-1} d_q ,$$

which is what `A(:)` enumerates and what `reshape` respects.

The left-division operator is overloaded on the shape and the detected structure
of $A \in \mathbb{C}^{m \times n}$, for $b \in \mathbb{C}^{m}$:

- $m = n$: MATLAB tests for diagonal, triangular and permuted-triangular
  structure first, then for Hermitian positive definiteness (Cholesky), and
  otherwise runs LU with partial pivoting.
- $m > n$ with $\operatorname{rank}(A) = n$: Householder QR, returning the unique
  minimiser of $\lVert Ax - b \rVert_2$. The normal equations $A^{\mathsf T} A x
  = A^{\mathsf T} b$ are _not_ formed, because that squares the condition number.
- $\operatorname{rank}(A) < \min(m, n)$: a **basic** solution with at most
  $\operatorname{rank}(A)$ nonzero entries, which is generally not the
  minimum-norm solution $A^{+}b$ that `pinv` or `lsqminnorm` gives.

The computed $\hat x$ is the exact solution of a nearby problem, so the relative
forward error is governed by conditioning: $\lVert \hat x - x \rVert / \lVert x
\rVert$ is on the order of $\kappa(A)\,u$, with unit roundoff $u = 2^{-53}
\approx 1.1 \times 10^{-16}$ in double precision. (MATLAB's `eps` is $2^{-52}$,
twice that.) A matrix with $\kappa(A) \approx 10^{12}$ therefore leaves about
four correct digits, whatever the operator looks like.

## Assumptions and requirements

**A licence must exist at run time.** An `.m` file is plain text, but running it
needs an installed MATLAB with a checked-out licence, and a toolbox function
needs that toolbox licensed too — `butter` requires Signal Processing Toolbox,
`lqr` requires Control System Toolbox. That is a reproducibility constraint, not
a matter of taste: a reviewer without the licence can read the analysis but
cannot re-run it.

**Dense and in memory by default.** An $m \times n$ double array needs $8mn$
contiguous bytes, so a $20000 \times 20000$ matrix is $3.2$ GB; `sparse` storage
is opt-in. Arrays have value semantics implemented by copy-on-write, so growing
one inside a loop reallocates repeatedly: preallocating with `zeros(n,1)` is the
difference between linear and quadratic work.

**Column-major layout is a performance assumption, not only a convention.**
Traversing a matrix down its columns is contiguous; across its rows is strided.

**Release matters.** Implicit expansion (broadcasting of compatible singleton
dimensions) arrived in R2016b, so `A + b` for mismatched-but-compatible sizes is
an error on older releases and a broadcast on newer ones.

## Uses and applicability

Reach for MATLAB when the problem is matrix-shaped and the value is in the
exploration: filter design, control system design and simulation (`tf`, `ss`,
`bode`, `step`, `lqr`, and Simulink for block-diagram modelling with generated C
for embedded targets), and hardware-in-the-loop work. Its position in control
engineering and signal processing rests on accumulated infrastructure —
textbooks, coursework, certification workflows and decades of in-house model
libraries — rather than on the language being better.

Do not reach for it when the deliverable is software other people run, when the
work must be reproducible by anyone who downloads it, or when the job is
general-purpose programming rather than numerics.

## Limitations and common mistakes

Confusing `*` with `.*` is the classic bug, silent for square matrices where
both are legal and different; the same trap holds for `/` against `./`.

Assuming that `\` on a rank-deficient system returns the minimum-norm solution is
a subtler one: it returns a basic solution instead, and code that compares it
against `pinv(A)*b` will disagree.

"Loops are slow" is folklore from the pre-JIT interpreter. The durable rule is
narrower — preallocate, and do not grow arrays element by element — and where
vectorising still pays is an empirical question about the release and the
operation, not a law.

Treating Octave as a drop-in is the reproducibility mistake. The core language
and much of the base library run unchanged, but toolbox functions, Simulink and
parts of the object and graphics systems do not, so "Octave can run it" is a
hope rather than a plan until it has been tried.

Finally, translating index arithmetic from a zero-based, row-major language such
as Python reliably produces off-by-one errors, and `reshape` differs outright
because MATLAB reads down columns. Output is also not bit-identical across
releases, platforms or thread counts, since multithreaded reductions
reassociate.

## Variants and alternatives

**GNU Octave** is a free software (GPL) implementation deliberately kept largely
compatible with the MATLAB language: it buys licence freedom and the ability to
run anywhere, and costs the toolboxes, Simulink and fidelity on the newest
language features. **Scilab** is another free environment, similar in spirit but
not source-compatible.

**Python with NumPy, SciPy and Matplotlib** is the dominant alternative, a
general-purpose language with a far wider non-numerical ecosystem, at the cost of
zero-based indexing, row-major defaults and an assembled rather than integrated
toolchain. **Julia** targets the same audience, keeps one-based indexing and
column-major layout, and compiles hand-written scalar loops — its manual keeps an
explicit list of differences from MATLAB for exactly this migration. **R** offers
the same interactive feel with statistics rather than matrices at the centre.

Within the MathWorks stack, **Simulink** adds block-diagram modelling, **MATLAB
Coder** and **Embedded Coder** generate C from a language subset, and **MATLAB
Compiler** with the redistributable MATLAB Runtime lets a compiled application
run without a per-user licence.

## History and attribution

Cleve Moler wrote the first MATLAB in Fortran in the late 1970s at the University
of New Mexico, to let students use **LINPACK** (linear systems) and **EISPACK**
(eigenvalue problems) — the Fortran libraries he had helped produce — without
writing Fortran themselves. It was not yet a programming language: a workspace of
matrices and a fixed command set, with no user-defined functions. Jack Little
and Steve Bangert rewrote it in C with a real language, functions and graphics,
and MathWorks was founded with Moler in 1984 to sell the result. LAPACK later
replaced LINPACK and EISPACK underneath.

That lineage explains the design: one-based indexing and column-major storage are
Fortran conventions, and the matrix is the primitive type because giving a
Fortran matrix library an interactive face was the whole original purpose.

## Sources

The **MATLAB documentation** is the authority for the language itself: array
semantics, linear indexing, what `mldivide` does for each shape and structure,
which toolbox owns which function, and the guidance on preallocation. **MIT 18.06** supplies the linear algebra the
operators stand for — elimination, LU, QR and least squares, which is what `\`
hides behind one character. **MIT 18.065** makes the case for treating
decompositions as the working instruments of applied work, and the **Julia
documentation** states that language's differences from MATLAB directly.

## Prerequisites and next connections

Read [Matrix Theory](./matrix-theory.md) first: rank, invertibility and
conditioning are not background to MATLAB but what its operators compute, and
`A\b` is unreadable without them.

From here, [Matrix Decompositions](./matrix-decompositions.md) explains the LU,
Cholesky and QR factorisations backslash selects between and the SVD behind
`pinv`, and [Ordinary Differential Equations](./ordinary-differential-equations.md)
covers the initial value problems `ode45` integrates — including the stiffness
that decides which solver you should be calling.
