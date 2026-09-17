---
concept_id: concept.languages.r_language
title: R
slug: /concepts/r-language
aliases:
  - GNU R
kind: tool
tier: 1
review_state: generated-draft
summary: R is a language and runtime for statistical computing in which the vector rather than the scalar is the primitive datum, tabular data frames and model formulas are built into the base library, and CRAN hosts more than twenty thousand contributed packages behind an automated check suite, new statistical methodology commonly being published alongside a companion package.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: used_to_solve
    target: concept.probability.frequentist_inference
    note: The standard frequentist apparatus — t-tests, linear and generalised linear models, contrasts, confidence intervals, p-values — is in R's base library under consistent names, so a textbook procedure is usually one call rather than an implementation project.
  - type: contrasts_with
    target: concept.languages.matlab
    note: Both are interactive array languages with one-based indexing, but R's primitive is a named heterogeneous table of statistical variables while MATLAB's is a dense numeric matrix, and the two ecosystems reflect that split.
  - type: contrasts_with
    target: concept.languages.julia
    note: Julia was designed to keep the interactive array-oriented feel of R while compiling to native code, so it directly targets the performance ceiling R hits whenever a computation cannot be vectorised.
sources:
  - source_id: source.cran.manuals
    title: The Comprehensive R Archive Network — manuals
    url: https://cran.r-project.org/manuals.html
    source_kind: reference-documentation
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.julia.documentation
    title: The Julia Language documentation
    url: https://docs.julialang.org/en/v1/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mathworks.matlab
    title: MATLAB documentation
    url: https://www.mathworks.com/help/matlab/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Richard A. Becker, "A Brief History of S"
    reason: The CRAN manuals name Rick Becker, John Chambers and Allan Wilks as the developers of S but carry no dates and no account of who did what when, so the 1976 origin, the first implementation team and Wilks's arrival in 1984 rest on Becker's history of the project, which is not in the registry.
    sections:
      - history-and-attribution
  - label: R6 and S7 object systems
    reason: The two newest R object systems ship as contributed packages rather than in R itself, so the core manuals on CRAN — the only R source in the registry — do not document them; the claims about them here rest on no cited source.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**R** is an interpreted, dynamically typed language and runtime for statistical
computing and graphics, and a free implementation of the S language designed at
Bell Laboratories. Its organising commitment is that there is no scalar type:
the literal `1` is a double vector of length one, and arithmetic, comparison and
most library functions are defined elementwise over whole vectors. On the atomic
vectors — logical, integer, double, complex, character, raw — R builds the list,
the **data frame** (a list of equal-length columns: a table whose rows are
observations and whose columns are variables of possibly different types), and
the **formula**, an unevaluated language object written `y ~ x` that modelling
functions interpret rather than compute. Indexing is one-based; subscripts may
be positive, negative (drop), logical or character.

## Why it matters

The argument for R is not language design; it is that the vocabulary of
statistics is already in the base library under stable names. Fitting a linear
model with a categorical predictor means choosing a contrast coding, building a
design matrix and handling missing observations — in R, `lm(y ~ group + x,
data = d)` and `summary(fit)`, because factors carry their contrast scheme and
model frames handle `NA` by a documented policy.

Above that sits CRAN: more than twenty thousand contributed packages behind a
mandatory check suite, plus Bioconductor for genomics. New statistical
methodology is routinely published with a companion package, so mixed-effects
models, survival analysis and multiple-testing correction exist as maintained
implementations rather than as pseudocode in a paper.

## Intuition

Carry the picture of a calculator whose keys act on columns of a table rather
than on numbers. `x > 3` does not answer a question about a number; it returns a
logical vector as long as `x`, which you hand back to `[` to select rows. The
loop lives in compiled code.

The analogy breaks twice. R columns are values, not cells with identity:
arguments are passed by value with copy-on-modify, so a function that changes
its argument in the ordinary way leaves the caller's data frame untouched —
`<<-`, an explicitly passed environment and reference-semantics packages such as
data.table are the deliberate exceptions. And R stretches a short operand to
meet a long one rather than complain that the shapes disagree.

## Concrete example

```r
x <- c(2, 4, 6, 8)   # a double vector of length 4
x[1]                 #> 2            -- one-based
x[0]                 #> numeric(0)   -- not an error, an empty vector
x[-1]                #> 4 6 8        -- negative means "drop", not "from the end"
x + c(10, 20)        #> 12 24 16 28  -- recycled, silently
c(1, 2, 3) + c(1, 2) #> 2 4 4, with a warning: length is not a multiple

d <- data.frame(dose = c(1, 1, 2, 2, 3, 3),
                resp = c(2.1, 2.4, 3.9, 4.2, 6.0, 5.7))
fit <- lm(resp ~ dose, data = d)
coef(fit)
#> (Intercept)        dose
#>        0.45        1.80
class(fit)           #> "lm"
```

Check the fit by hand: with $\bar{x} = 2$ and $\bar{y} = 4.05$ the sums of
squares are $S_{xx} = 4$ and $S_{xy} = 7.2$, giving slope $1.8$ and intercept
$0.45$. And `fit` is an ordinary list whose `class` attribute is the string
`"lm"` — that string is the whole mechanism by which `print` and `summary` know
what to do with it.

## Formal treatment

**Recycling.** For a binary operator $\odot$ applied to vectors $x$ of length
$m \ge 1$ and $y$ of length $n \ge 1$, the result $z$ has length $\max(m, n)$ and

$$
z_i \;=\; x_{((i-1) \bmod m) + 1} \;\odot\; y_{((i-1) \bmod n) + 1},
\qquad i = 1, \dots, \max(m, n).
$$

A warning is issued only when $\max(m,n) \bmod \min(m,n) \neq 0$: an exact
multiple recycles silently.

**Coercion.** Mixed atomic types in one vector are coerced upward along
logical $\to$ integer $\to$ double $\to$ complex $\to$ character, so `c(1, TRUE)`
is `c(1, 1)` and `c(1, "a")` is `c("1", "a")`.

**S3 dispatch.** A generic such as `summary` calls `UseMethod("summary")`, which
walks `class(x)` in order, calls the first `summary.<class>` it finds, and falls
back to `summary.default`. There is no declaration and no check: a class is an
attribute anyone can set.

**Formulas.** `y ~ a + b` is a call to the operator `~`, captured unevaluated
with the environment it was written in, which modelling functions rewrite into a
model frame and then a model matrix. Inside a formula the arithmetic operators
are reinterpreted: `:` is an interaction, `a*b` expands to `a + b + a:b`, `-1`
drops the intercept, and `I()` restores ordinary arithmetic, so `I(x^2)` is a
squared predictor while `x^2` means `x` crossed with itself. A factor with $k$
levels expands into $k-1$ columns under the default treatment contrasts.

## Assumptions and requirements

R assumes the analysis fits in memory: a data frame is held entirely in RAM, and
because modification is copy-on-write the peak footprint of a transformation can
be a multiple of the object's size.

It assumes the computation vectorises. Elementwise transforms and linear algebra
run in compiled C or BLAS/LAPACK, but a genuinely sequential recursion — a
Markov chain, an optimiser's inner loop — runs at interpreter speed, which is
where packages drop to C++ through Rcpp.

It assumes rectangular data with observations in rows, and explicit handling of
missingness: `NA` propagates through arithmetic and comparison, so `NA == NA` is
`NA`, tests need `is.na()` and summaries need `na.rm = TRUE`. Literals are
doubles unless suffixed `L`, and integer overflow returns `NA` with a warning
rather than wrapping.

## Uses and applicability

Reach for R when the analysis is the deliverable: exploratory work on tabular
data, a published methodology you need implemented correctly, a publication
figure, or a reproducible report weaving prose, code and output together —
above all for classical statistics done properly, such as survey weighting,
mixed models or survival curves.

Avoid it for production services, latency-sensitive systems or large engineering
codebases, where the tooling for packaging and long-lived application code is
thin. Deep learning belongs in Python despite R bindings, and data much larger
than memory needs an out-of-core engine underneath.

## Limitations and common mistakes

Recycling is the first trap. Adding a length-2 vector to a length-100 column
gives an alternating pattern with no warning, because 100 is a multiple of 2;
the warning fires only for non-multiples, so the plausible mismatches are
exactly the silent ones.

Indexing is the second. `x[0]` is not the first element and not an error — it is
an empty vector, which propagates quietly. `x[-1]` drops the first element
rather than taking the last, and positive and negative subscripts cannot be
mixed. Related is dropping: `m[, 1]` returns a vector, not a one-column matrix,
unless you pass `drop = FALSE`; `d[1]` is a one-column data frame while `d[[1]]`
is the column itself.

The object systems are the third, and a real source of confusion rather than a
matter of taste. **S3** dispatches on a class attribute anyone can assign, with
no validity checking. **S4** adds formal classes, typed slots, validity
functions and multiple dispatch, at the cost of much more ceremony. **R5**
reference classes are mutable, breaking the copy-on-modify expectation the rest
of the language trains into you. **R6** and **S7** are contributed packages
offering lighter reference semantics and a newer attempt to unify S3 and S4.
All five are live at once, so the object a package hands you may not behave like
the one you learned on.

Factors catch everyone once: `as.numeric(f)` returns internal level codes, not
the numbers the labels show; the labelled values come from
`as.numeric(as.character(f))`. The default changed underneath this too —
`data.frame()` made character columns factors before R 4.0.0 and does not after
— so older advice disagrees with a current session.

Finally, "R is slow" misleads: scalar loops are slow and growing a vector in a
loop reallocates repeatedly, but vectorised R spends its time in the same
compiled linear algebra everything else uses.

## Variants and alternatives

Within R there are competing dialects. **Base R** uses `[`, `$` and `apply`. The
**tidyverse** replaces them with verbs, a pipe and non-standard evaluation of
bare column names, which reads well and complicates programmatic use.
**data.table** keeps the bracket but adds reference semantics and in-place
update for speed on large tables. Mixing the three costs maintenance.

R Core's interpreter is effectively the only implementation in production use:
Renjin, FastR and pqR were all built and none displaced it, and the usual answer
to a slow script is Rcpp rather than another runtime.

Outside R, Python with pandas and statsmodels wins on general engineering and
loses on breadth of classical methodology. Julia keeps one-based indexing and an
interactive array style but compiles through LLVM and organises its libraries
around multiple dispatch, buying speed on the loops R cannot vectorise at the
cost of a smaller statistical library. MATLAB shares the array model but is
matrix-first, commercial, and strongest in engineering.

## History and attribution

R was begun by Ross Ihaka and Robert Gentleman at the University of Auckland in
the early 1990s; they wanted a language for teaching statistics that behaved
like S but that they controlled, and the name puns on S as well as on their
shared initial. The sources went out under the GPL during the 1990s, a
distributed R Core Team took over, and version 1.0.0 shipped on 29 February 2000.

S began at Bell Laboratories in 1976, out of a series of meetings between John
Chambers, Rick Becker, Doug Dunn and Paul Tukey, as an interactive alternative
to writing Fortran for each new analysis; the first implementation was by
Becker, Chambers and Dunn, and a manual describing Version 1.0 followed in
January 1977. Allan Wilks joined in 1984 and became a full partner, co-authoring
with Becker and Chambers the 1988 revision of the language that R's own manuals
name and that R was built to follow. R copies S's surface syntax deliberately
but drew its semantics from Scheme: it has lexical scoping and closures where S
did not, which is why R functions capture their defining environment.

## Sources

The CRAN manuals page collects the R Core documents: _An Introduction to R_ for
the vector, data frame and modelling material, and for R's standing as an
implementation of the S language developed at Bell Laboratories; the _R Language
Definition_ for recycling, coercion, attributes and dispatch; and _Writing R
Extensions_ for package and method structure. Julia's and MATLAB's documentation
are cited only for the comparisons in the variants section.

## Prerequisites and next connections

Nothing in R requires a prior page, but the design only makes sense against the
statistics it was built to serve. Read
[Frequentist Inference](./frequentist-inference.md) for what `lm`, `glm` and the
`t.test` family compute, and [Bayesian Inference](./bayesian-inference.md) for
the alternative that R's Stan and JAGS interfaces serve.

[Core Data Structures](./core-data-structures.md) is the useful contrast: R's
vector-and-list substrate deliberately narrows the usual menu, which explains
where its idioms strain.
[High-Dimensional Statistics](./high-dimensional-statistics.md) covers the
regime where the classical procedures in R's base library stop being valid,
whatever the software reports. The MATLAB and Julia pages are the natural next
stops.
