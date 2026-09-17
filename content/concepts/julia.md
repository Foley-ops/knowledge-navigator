---
concept_id: concept.languages.julia
title: Julia
slug: /concepts/julia
kind: tool
tier: 1
review_state: generated-draft
summary: Julia is a dynamically typed language for technical computing in which every function call selects a method from the runtime types of all its arguments, and the compiler specialises each method on the argument types it is actually called with, so generic code compiles to machine code of the kind a static compiler emits.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: contrasts_with
    target: concept.languages.matlab
    note: Both target the same numerical-computing audience, but MATLAB reaches speed by making you phrase work as calls into precompiled array kernels, whereas Julia compiles your own loops after inferring their types.
  - type: contrasts_with
    target: concept.languages.lisp
    note: Julia's generic functions and macros descend directly from Common Lisp's CLOS and its macro system, but Julia drops s-expression syntax and ties dispatch to a compiler that specialises on concrete types.
  - type: contrasts_with
    target: concept.languages.typescript
    note: Both attach types to an otherwise dynamic language, but TypeScript's types are erased before execution and its overloads resolved statically, while Julia's types are runtime values that choose the method and drive code generation.
  - type: used_to_solve
    target: concept.analysis.ordinary_differential_equations
    note: Numerical integration of ODEs is Julia's flagship application area, and it is the setting where the claim that independently written packages compose is usually demonstrated.
sources:
  - source_id: source.julia.documentation
    title: The Julia Language documentation
    url: https://docs.julialang.org/en/v1/
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mitpress.sicp
    title: Structure and Interpretation of Computer Programs
    url: https://mitpress.mit.edu/9780262510875/structure-and-interpretation-of-computer-programs/
    source_kind: authoritative-secondary
    supports:
      - intuition
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - limitations-and-common-mistakes
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
  - label: Julia — A Fresh Approach to Numerical Computing (SIAM Review, 2017) and Bezanson's MIT doctoral thesis
    reason: The registry holds the language documentation but no paper, thesis or announcement post, so the dates, the authorship and the stated design motivation in the history section rest on general knowledge rather than on a cited source.
    sections:
      - history-and-attribution
  - label: Empirical reports of cross-package composability in the Julia ecosystem, and the public critiques of it
    reason: No registry source documents either the composition successes the community cites or the counter-argument that silent wrong answers follow from unchecked interfaces; both are therefore marked in the text as claims rather than cited.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
  - label: Julia release notes for the caching of native code in package images
    reason: The manual documents precompilation but the registry has no release notes, so the claim that first-call latency improved substantially when package precompilation began caching native code is stated without a citation.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Julia** is a dynamically typed, general-purpose language built for numerical
and scientific computing, whose central abstraction is the _generic function_: a
name carrying many _methods_, where the method that runs is chosen from the
runtime types of all the positional arguments. That rule is **multiple
dispatch**. Types belong to values, not variables. The implementation compiles
each method to native code through LLVM the first time it is called with a
particular tuple of concrete argument types, so one source text serves every type
while each compiled instance is specialised to one combination.

## Why it matters

Julia was built against the two-language workflow: prototype in a dynamic
language, find the inner loop a hundred times too slow, rewrite it in C behind a
wrapper. That split puts the interesting part of the code out of reach of the
users who most want to change it, and Julia's bet is that a type system designed
for inference plus specialising compilation makes the rewrite unnecessary.

The second consequence is extensibility. Because behaviour lives in methods on a
function rather than in a class, anyone can add a method to a function they do
not own, for a type its author never imagined, and generic code already written
against that function will use it. The community claims this produces unusual
composability across independent packages — an empirical observation about one
ecosystem, not a theorem.

## Intuition

Picture a function as a table of rows, each row a signature and a body, rather
than an operation glued to an object. `x.insert(y)` asks only what `x` is; Julia
asks about the whole argument tuple at once. SICP builds exactly this by hand in
its data-directed programming chapters — a table indexed by the types of several
operands — and contrasts it with message passing, which is single dispatch.
Julia's move is to put the table in the language and hand it to the compiler.

The analogy breaks twice: the table is not a dense matrix, since signatures are
types in a subtyping order and several rows can match one call, and the lookup is
usually not a lookup, because the compiler picks the row and emits a direct call.

## Concrete example

Forward-mode automatic differentiation in a dozen lines, using dispatch on both
operands:

```julia
struct Dual <: Number
    val::Float64
    der::Float64
end

Base.:+(x::Dual, y::Dual) = Dual(x.val + y.val, x.der + y.der)
Base.:*(x::Dual, y::Dual) = Dual(x.val * y.val, x.val * y.der + x.der * y.val)
Base.:+(x::Dual, y::Real) = Dual(x.val + y, x.der)
Base.:+(y::Real, x::Dual) = x + y

f(x) = x * x + x

f(3.0)             # 12.0
f(Dual(3.0, 1.0))  # Dual(12.0, 7.0)
```

`f` was written with no knowledge of `Dual`. On `Dual(3.0, 1.0)` it returns value
$12.0$ and derivative $7.0 = f'(3)$. The `+` methods are distinguished by the
types of _both_ arguments — `(Dual, Dual)`, `(Dual, Real)`, `(Real, Dual)` — with
no privileged receiver, and Julia compiles two native versions of `f`, one for
`Float64` and one for `Dual`.

## Formal treatment

A generic function $f$ has a method table $M(f) = \{(S_1, b_1), \ldots,
(S_m, b_m)\}$, each signature $S_i$ a tuple type, possibly parametric. For a call
$f(a_1, \ldots, a_n)$ put $T = \mathrm{Tuple}\{\mathrm{typeof}(a_1), \ldots,
\mathrm{typeof}(a_n)\}$. The applicable methods and the chosen one are

$$
A(f, T) = \{\, i : T <: S_i \,\}, \qquad m(f, T) = \min_{\preceq} A(f, T),
$$

where $\preceq$ is a specificity partial order refining subtyping: if
$S_i <: S_j$ then $S_i \preceq S_j$. An empty $A(f,T)$ raises a `MethodError`; a
non-empty one with no unique minimum is an ambiguity error. Only positional
arguments enter $T$ — keyword arguments do not dispatch, and neither does the
return type.

Abstract types are the hierarchy's internal nodes and have no fields; concrete
types are its leaves and cannot be subtyped. Tuple types are covariant in their
parameters — which is what makes the subtyping test above pick up methods with
abstract argument types — but Julia's other parametric types are invariant, so
`Vector{Float64} <: Vector{Real}` is false and the intended type is the
`UnionAll` written `Vector{<:Real}`.

Compilation is per $(f, T)$: inference is an abstract interpretation over the
type lattice starting from the concrete $T$. When every inferred type is
concrete, values live unboxed in registers and every internal $m(f, T)$ is known
at compile time, so calls are emitted directly and often inlined — dispatch is
paid for once, not per call. Where inference yields an abstract type or a wide
union, values are boxed and the call becomes a cached runtime lookup. A function
is _type stable_ at $T$ when its inferred return type is concrete.

## Assumptions and requirements

Performance assumes type stability, concrete field types in structs, containers
with concrete element types, and no untyped non-constant globals in hot code.
None of this is enforced: nothing rejects `struct P; x::Real; end`, it simply
stores a pointer instead of a float, and the obligations are checked by tools
such as `@code_warntype` rather than by a type checker. Inference is itself a
heuristic that widens at recursion, at deep unions and where types depend on
values; when it widens, specialisation quietly degrades to dynamic behaviour.

Correct generic code assumes the argument type implements everything the code
calls, and no static obligation says so — no type class, no trait bound. A
missing method surfaces at run time as a `MethodError`, the good case; the bad
case is a fallback that exists and breaks an unwritten contract.

## Uses and applicability

Reach for Julia when the inner loop is yours: differential-equation solvers,
optimisation, custom likelihoods, PDE and particle codes, agent simulations —
work that cannot be phrased as a handful of array operations, where
array-language vectorisation stops helping. Reach for it when one algorithm must
run over many number types: `Float32`, `BigFloat`, dual numbers, intervals,
quantities with units, GPU arrays.

Do not, when process startup dominates, as in short-lived command-line tools or
per-request serverless functions; when deployment demands a small static binary;
or when the program is mostly calling an existing library, the glue is not the
bottleneck, and the mature ecosystem for that task is elsewhere.

## Limitations and common mistakes

_"Julia is fast because it has a JIT."_ No: other languages have JITs and do not
get this code. Speed comes from specialising on concrete types that inference
pins down, and a type-unstable function is slow with the same JIT.

_Time to first plot._ The first call to a method with new argument types pays
inference and code generation, so loading a large plotting or modelling stack has
meant a noticeable wait — a structural cost of the design, not an oversight. It
improved substantially once package precompilation began caching native code
rather than only lowered IR, and is further managed with precompile workloads and
prebuilt system images, but a C binary still starts faster.

_Dispatch is not overloading._ C++ and Java overload resolution uses the
**static** types at the call site, which is why those languages need the visitor
pattern to simulate dispatch on two arguments. Nor is it single dispatch:
Python's `a + b` consults `type(a).__add__` then `type(b).__radd__`, an ordered
two-step protocol, and `functools.singledispatch` dispatches on the first
argument only. Julia's rule is symmetric over all positional arguments.

_Type piracy._ Defining a method where both the function and every argument type
belong to other packages changes behaviour for code that never opted in.

_The composability claim._ Generic solvers really do accept types they were never
written for. But no interface is checked, so composition can also fail silently —
a fallback narrowing to `Float64`, an assumption about mutability — and public
critiques have argued this yields wrong answers rather than errors. Composition
is a hypothesis to test, not a guarantee.

## Variants and alternatives

Inside the language, `PackageCompiler` builds system images that remove most
first-call latency at the cost of a large artefact, static compilation of small
binaries is experimental, and the Holy trait pattern recovers something like
interfaces by dispatching on type-level tags computed from a type.

Other languages dispatch on several arguments: CLOS generic functions in Common
Lisp, Dylan, and R's S4 generics, whose methods carry multi-argument signatures.
Julia is unusual in making dispatch the only way to define behaviour and wiring
it to the compiler.

As environments: Python with NumPy and C extensions has the larger ecosystem and
pays at the boundary; Numba and Cython compile a subset of Python, buying speed
without the open extensibility; MATLAB offers mature toolboxes under a commercial
licence; Rust and Haskell check the interfaces Julia leaves implicit, at the
price of resolving dispatch before the program runs.

## History and attribution

Julia was started around 2009 at MIT by Jeff Bezanson, Stefan Karpinski, Viral B.
Shah and Alan Edelman, and announced in February 2012 in a post titled "Why We
Created Julia" whose complaint was the two-language pattern in scientific
computing. Version 1.0, the first release with a stability promise, came in
August 2018. Multiple dispatch is not their invention: it reaches Julia from the
Common Lisp Object System of the 1980s and from Dylan. The contribution is making
it the sole dispatch mechanism and pairing it with inference and specialising
compilation, so multiply-dispatched generic code becomes monomorphic machine
code. The standard written accounts — Bezanson's doctoral thesis and the 2017
SIAM Review paper — are not in the registry, so the dates above are uncited.

## Sources

The Julia manual is the authority for the dispatch rule, the type system,
specialisation, the performance obligations and the noted differences from other
languages; everything technical here can be checked there. SICP is cited for the
intuition, because its data-directed programming chapters build dispatch on
several operand types by hand and weigh it against message passing. The Python
documentation is the reference for the single-dispatch contrast — the reflected
arithmetic protocol and `functools.singledispatch` — and the MATLAB
documentation for the competing environment.

## Prerequisites and next connections

Nothing here is a strict prerequisite, though multiple dispatch is easiest to see
as the difference between a dynamic language and a statically overloaded one. The
companion pages on Lisp, MATLAB and TypeScript sit closest: the ancestry of
generic functions, the array-language style Julia argues against, and overloads
resolved before the program runs.

Next, [Ordinary Differential Equations](./ordinary-differential-equations.md) is
the domain where Julia's solver stack and its composability claim are most
visible, and [Matrix Decompositions](./matrix-decompositions.md) covers the
kernels Julia, like every technical computing environment, hands to LAPACK.
