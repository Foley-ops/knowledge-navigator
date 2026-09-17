---
concept_id: concept.paradigms.functional_programming
title: Functional Programming
slug: /concepts/functional-programming
kind: concept
tier: 1
review_state: generated-draft
summary: A way of programming in which computation is the evaluation of expressions rather than the execution of state changes, so functions are ordinary values and a call can be replaced by its result without changing what the program means.
categories:
  - Programming/Languages/Paradigms
primary_category: Programming/Languages/Paradigms
relationships:
  - type: contrasts_with
    target: concept.paradigms.imperative_programming
    note: The two paradigms compute the same class of functions but disagree about what a program denotes — a sequence of changes to a store, or the value of an expression — and that disagreement is exactly what referential transparency turns on.
  - type: contrasts_with
    target: concept.paradigms.object_oriented_programming
    note: Object orientation gives data an identity that persists while its contents mutate behind methods, whereas functional programming keeps data transparent and immutable and puts the behaviour in functions over it.
  - type: refined_by
    target: concept.foundations.category_theory
    note: Moggi's categorical semantics of effects supplied monads as the structure for sequencing input, output and state inside a pure language, which is how Haskell came to organise effects the way it does.
  - type: contributes_to
    target: concept.languages.rust
    note: Rust's enums, exhaustive pattern matching, iterator combinators and immutable-by-default bindings come from the ML branch of functional programming, reused in a language that keeps mutation under an ownership discipline.
sources:
  - source_id: source.mitpress.sicp
    title: Structure and Interpretation of Computer Programs
    url: https://mitpress.mit.edu/9780262510875/structure-and-interpretation-of-computer-programs/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.haskell.report
    title: The Haskell 2010 Language Report
    url: https://www.haskell.org/onlinereport/haskell2010/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.jax.documentation
    title: JAX documentation
    url: https://jax.readthedocs.io/en/latest/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.plato.computability
    title: 'Stanford Encyclopedia of Philosophy: Computability and Complexity'
    url: https://plato.stanford.edu/entries/computability/
    source_kind: authoritative-secondary
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Church-Rosser confluence theorem for the lambda calculus
    reason: The claim that reduction order cannot change a normal form is the theorem that makes equational reasoning sound, and no source in the registry states or proves it; the corpus mentions the lambda calculus only as one of the equivalent models of computation.
    sections:
      - formal-treatment
  - label: Asymptotic separations between pure and impure functional programs
    reason: Known results in the programming-language literature separate strict purely functional programs from imperative ones on particular problems, and no registry source covers them, so the page states the practical cost of persistent data structures and flags the general question as open rather than citing something that does not say it.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Functional programming** builds programs out of expressions whose value does
not depend on when they are evaluated. Functions are first-class values;
**higher-order functions** take or produce them; data is **immutable**, so an
update yields a new value instead of overwriting an old one; **recursion** and
combinators replace the mutable loop counter; and structured data is described
by **algebraic data types** — sums of alternatives, each a product of fields —
taken apart by pattern matching. What
ties these together is **referential transparency**: an expression may be
replaced by its value anywhere it occurs and the program still means the same
thing. SICP puts it bluntly — programming without assignment is what the term
names.

## Why it matters

Referential transparency lets you reason about a program as you would about
algebra. If `f x` is `3` here it is `3` everywhere, so refactoring is
substitution, a test needs no fixture, a compiler may cache or reorder the call,
and two calls may run on different cores without a lock. None of that holds when
`f x` depends on what ran before.

This is not hypothetical tidiness. JAX transforms only pure functions: `jit`
traces a function once per input signature and bakes whatever it saw into a
compiled graph, so a print statement or a mutated global fires during tracing
and is absent from the compiled graph — and fires again whenever JAX re-traces,
which it does for argument shapes, dtypes or static values it has not compiled
before.
Persistent structures make an undo stack or a snapshot nearly free: the old
version was never destroyed.

## Intuition

The working picture is a spreadsheet: a cell holds a formula over other cells,
there is no statement order, recomputing gives the same answer, and changing an
input propagates. It breaks in two places: a spreadsheet has no functions as
values and no real recursion, and a functional program still has to read files
and print things — purity says _where_ effects may live, not that there are
none.

The second picture is mechanical: evaluation is rewriting. Replace an
application by its body with the arguments substituted in, until nothing is left
to replace. That substitution model stays valid exactly as long as nothing
assigns.

## Concrete example

An interpreter is where the style earns its keep:

```haskell
data Expr = Lit Int | Add Expr Expr | Mul Expr Expr

eval :: Expr -> Int
eval (Lit n)   = n
eval (Add a b) = eval a + eval b
eval (Mul a b) = eval a * eval b

double :: Expr -> Expr
double e = Mul (Lit 2) e

main :: IO ()
main = print (eval (double (Add (Lit 3) (Lit 4))))   -- 14
```

`Expr` is a sum of three alternatives, `eval` has one equation each and the
compiler warns if a case is missing, and `double` builds a new tree rather than
editing one. In Python, without that discipline:

```python
total = 0

def add(x):
    global total
    total += x
    return total

print(add(1) + add(1))        # 3
y = add(1)
print(y + y)                  # 6
```

Naming a repeated call — the most ordinary refactor there is — changed the
answer.

## Formal treatment

The model is the untyped lambda calculus. Terms are

$$
M ::= x \;\mid\; \lambda x.\,M \;\mid\; M\,N ,
$$

a variable, an abstraction (a one-argument function) and an application. The
single computation rule is beta reduction,

$$
(\lambda x.\,M)\,N \;\longrightarrow_\beta\; M[x := N] ,
$$

where $M[x := N]$ is capture-avoiding substitution: bound variables in $M$ are
renamed so free variables of $N$ are not captured, and terms equal up to such
renaming are identified. Reduction is confluent — the Church-Rosser property —
so a term with a normal form has only one, whatever order you reduce in. That is
the licence for equational reasoning: the answer belongs to the term, not to the
evaluator.

Typing buys guarantees: every well-typed term of the simply typed lambda
calculus normalises, which costs Turing completeness, and practical languages
restore it with recursive definitions. Hindley-Milner typing infers a most
general type without annotations; algebraic data types are sums of products, so
`Expr` is
$\mathbb{Z} + (\mathrm{Expr} \times \mathrm{Expr}) + (\mathrm{Expr} \times \mathrm{Expr})$.

Effects re-enter through a type constructor with `return :: a -> m a` and
`>>= :: m a -> (a -> m b) -> m b` obeying the three monad laws the Haskell
Report states: `return x >>= f` is `f x`, `m >>= return` is `m`, and `>>=` is
associative. A value of type `IO Int` _describes_ an effect; running it is the
runtime's job, which is how `main` prints while `eval` stays substitutable.

## Assumptions and requirements

All of this assumes purity holds. Haskell's type checker enforces it — a
function of type `Expr -> Int` cannot read a file — and everywhere else it is a
discipline. One call that reads the clock or mutates its argument silently
invalidates substitution across every expression depending on it.

Confluence assumes the pure calculus, and effects break it. Non-termination does
not — Church-Rosser holds for the whole untyped calculus, divergent terms
included — but it does make evaluation order observable, because a strategy that
fails to normalise may diverge on a term that has a normal form: under Haskell's
non-strict semantics
`const 1 undefined` is `1`, where a language evaluating arguments first would
fail — laziness is a semantic choice, not an optimisation. Immutability assumes
structural sharing and a garbage collector: sharing untouched subtrees is cheap,
copying an array on every write is not.

## Uses and applicability

Compilers, interpreters and symbolic manipulation are the natural home: the data is trees, the operations are case analyses over them, and nothing
needs an identity that survives change. Concurrency and distribution are the
second home, because immutable values cannot be raced on. Pipelines written as
map, filter and reduce are functional whether or not anyone says so, which is
what lets a framework redistribute the work. Machine-learning code keeps a pure
core for a specific reason: JAX's `grad`, `jit` and `vmap` are transformations
of functions and require pure ones. Proof assistants go furthest — in
[Coq](./coq.md) and [Lean](./lean.md) a program and a proof are the same
term.

Reach for something else when the domain really is mutable state with identity —
a device register, a buffer pool, a physics world updated in place.

## Limitations and common mistakes

The commonest error is believing a functional program has no side effects. It
has them; Haskell's contribution was to make them visible in types, not to
abolish them. The second is treating purity as binary. It is a spectrum: Haskell
enforces it, OCaml, Scala and Clojure permit mutation while defaulting away from
it, and most functional code in industry is written in languages that enforce
nothing. The test is whether equational reasoning survives in the code in front
of you, not what the language is called.

The third is mistaking syntax for substance: a `map` whose callback appends to a
captured array is imperative code wearing a lambda. The fourth is recursion
depth — Scheme guarantees proper tail calls, so a tail-recursive loop runs in
constant space, while CPython eliminates none and raises `RecursionError` near a
thousand frames.

A persistent map or array typically gives $O(\log n)$ access where a mutable one
gives $O(1)$, and immutability costs allocation and collection.
Whether purity imposes an unavoidable asymptotic penalty in general is not
settled. Finally, monads are learnable from the Haskell Report's laws; the
category theory is the origin of the vocabulary, not a prerequisite, as
[Category Theory](./category-theory.md) says of itself.

## Variants and alternatives

The **Lisp** family — Scheme, Common Lisp, Clojure — is dynamically typed and
impure, buying macros and interactive development. The **ML** family — Standard
ML, OCaml, F# — is strict and statically typed with escape hatches for mutation,
buying inference and predictable evaluation. **Haskell** is pure and non-strict,
buying enforced separation of effects at the cost of harder space reasoning.
**Dependently typed** languages — Agda, Idris, Lean, Coq — let types state
specifications, usually demanding totality: decidable checking in exchange for
Turing completeness.

The real competitors are other paradigms. Imperative and object-oriented
programming keep mutable state and pay in reasoning about aliasing. Logic
programming computes with relations rather than functions, and array programming
avoids explicit loops by operating on whole arrays. Rust keeps mutation and
makes the type system prove no two live references alias it mutably.

## History and attribution

The theory came first. Alonzo Church introduced the lambda calculus in the 1930s
as a foundation for logic, and it became one of the equivalent formalisations of
effective computability alongside Turing machines and the general recursive
functions — the coincidence the Church-Turing thesis records. Programming caught
up through John McCarthy's **Lisp**, designed at MIT around 1958-60 for symbolic
computation; it borrowed `lambda` from Church, though early Lisp's dynamic
scoping meant its lambdas did not behave like Church's until the funarg problem
was understood. Peter Landin joined the strands in the 1960s with ISWIM and the
SECD machine, and John Backus's 1977 Turing Award lecture, _Can Programming Be
Liberated from the von Neumann Style?_, argued the case publicly.

Static typing arrived through **ML**, built by Robin Milner's group in the 1970s
as the metalanguage of the LCF theorem prover, where inference and polymorphism
existed to keep proofs sound. **Haskell** began at a 1987 meeting in Portland,
convened because a dozen incompatible non-strict pure languages already existed;
that committee produced the Haskell 1.x reports and Haskell 98, which it
declared its final revision, and Haskell 2010 is the first revision to come out
of the later Haskell Prime process. Monadic effects came later,
from Eugenio Moggi by way of Philip Wadler.

## Sources

SICP is the source for the substitution model, higher-order procedures and the
cost of assignment. The Haskell 2010 Language Report is the precise reference
for algebraic data types, type classes, the monad laws and typed effects, and
its preface documents Haskell's committee origins. The JAX documentation shows
purity enforced in production numerical code, and the Stanford Encyclopedia
entry on computability covers the lambda calculus as a model of computation.

## Prerequisites and next connections

[Computability Theory](./computability-theory.md) supplies the lambda calculus
and the Church-Turing thesis the formal treatment leans on, and is best read
alongside this page rather than before it; little else is needed beyond reading
a function definition.

Next, [Proof Theory](./proof-theory.md) explains the Curry-Howard correspondence
between types and propositions, which [Coq](./coq.md) and [Lean](./lean.md) take
all the way.
[Category Theory](./category-theory.md) is where the functor and monad
vocabulary comes from, and [Core Data Structures](./core-data-structures.md) is
where to price persistent structures against their mutable counterparts.
