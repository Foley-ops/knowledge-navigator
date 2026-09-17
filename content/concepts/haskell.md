---
concept_id: concept.languages.haskell
title: Haskell
slug: /concepts/haskell
kind: tool
tier: 1
review_state: generated-draft
summary: A purely functional, non-strict, statically typed language, standardised in 1990 and again in 2010, in which effects are values of type IO a and overloading is resolved by type classes rather than by subtyping.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: approximates
    target: concept.foundations.category_theory
    note: The Functor, Applicative and Monad classes are the Kleisli-triple axioms written as a programming interface, but the correspondence is approximate because bottom and seq break the equations the underlying category would need.
  - type: contrasts_with
    target: concept.languages.lisp
    note: Both descend from the lambda calculus, but Lisp is dynamically typed, strict and macro-driven, where Haskell fixes types before it runs, evaluates only on demand and has no macro layer in the standard.
  - type: contrasts_with
    target: concept.algorithms.complexity_analysis
    note: Standard cost models assume an expression is evaluated where it is written, whereas under call-by-need the time and especially the space a Haskell program uses depend on demand and sharing rather than on the shape of the source.
  - type: contrasts_with
    target: concept.languages.typescript
    note: Both infer types, but TypeScript's structural types are erased before a dynamically typed runtime, while Haskell's nominal type classes survive to direct dispatch and can even be selected by a function's return type.
sources:
  - source_id: source.haskell.report
    title: The Haskell 2010 Language Report
    url: https://www.haskell.org/onlinereport/haskell2010/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mitpress.sicp
    title: Structure and Interpretation of Computer Programs
    url: https://mitpress.mit.edu/9780262510875/structure-and-interpretation-of-computer-programs/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.nlab.category_theory
    title: 'nLab: category theory'
    url: https://ncatlab.org/nlab/show/category+theory
    source_kind: reference-documentation
    supports:
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.rust.book
    title: The Rust Programming Language
    url: https://doc.rust-lang.org/book/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Space leaks and the operational cost of call-by-need
    reason: No registry source covers thunk accumulation, strictness analysis, heap profiling or amortised analysis under lazy evaluation; the Report fixes the semantics but says nothing about the memory behaviour of an implementation.
    sections:
      - limitations-and-common-mistakes
      - uses-and-applicability
  - label: Monads as notions of computation (Moggi, Wadler)
    reason: The registry has no source for the semantics-of-effects line that put monads into Haskell, so the claim that the Monad class descends from that work is attributed here without a citation that covers it.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Haskell** is a programming language defined by four commitments its standard,
the Haskell 2010 Language Report, states together. It is _purely functional_: a
function of type `a -> b` is a mathematical function of its argument, and
evaluating it cannot write a file, mutate a variable or read a clock. It is
_non-strict_: an expression is evaluated only when some other computation demands
its value, so a definition may denote an infinite structure. It is _statically
typed with inference_: every expression has a type fixed before the program runs,
and the compiler reconstructs it without annotations in the common case. And it
uses _type classes_ for overloading: a constraint like `Num a` names a set of
operations a type must supply, and the compiler picks the implementation from the
type.

Effects are not absent; they are reified. A value of type `IO a` describes an
effect that yields an `a` when the runtime performs it. Evaluating such a value
does nothing, and only what is reachable from `main` is ever performed.

## Why it matters

Purity makes equational reasoning valid: if `x = f y`, every occurrence of `f y`
may be replaced by `x` and the program still means the same thing. That licence
is what lets the compiler inline, fuse and reorder aggressively, and what lets a
reader refactor without auditing a call graph for hidden writes. It also makes a
signature honest about reach — a function whose result type is not in `IO` cannot
touch the outside world, because the language gives it no way to.

The second payoff is transferable ideas. Type classes were designed here and
became Rust's traits, Scala's implicits and Swift's protocols; `do` notation is
an ancestor of `async`/`await` sugar. Haskell ships in compilers and financial
infrastructure, but its larger effect has been as the place such constructs were
worked out under a type system strict enough to expose when they fail to compose.

## Intuition

Picture the heap, not the source. An unevaluated expression is a heap object
called a **thunk**: a code pointer plus its captured free variables. Demanding a
thunk forces it to _weak head normal form_ — far enough to see the outermost
constructor — and overwrites it with the result, so the work happens at most
once. That is call-by-need: call-by-name plus sharing. SICP builds exactly this
machinery in Scheme, where `delay` and `force` with memoisation turn an
applicative-order evaluator into a normal-order one; Haskell's move is to make it
the default rather than an opt-in.

The working analogy is a spreadsheet that recalculates only the cells you look
at, and it breaks where the bugs live: a spreadsheet cell holds a value, while a
thunk holds an unevaluated expression that can _grow_ as the program runs,
retaining everything it references. `IO a` is likewise a recipe rather than the
cooking — an analogy that also breaks, since a recipe can be read and an `IO`
action can only be composed and finally run.

## Concrete example

```haskell
module Main where

import Data.List (foldl')

-- Ad hoc polymorphism: one name, one implementation per type.
class Shape a where
  area :: a -> Double
  name :: a -> String
  name _ = "shape"            -- a default, used when an instance omits it

data Circle = Circle Double
data Rect   = Rect Double Double

instance Shape Circle where
  area (Circle r) = pi * r * r
  name _ = "circle"

instance Shape Rect where
  area (Rect w h) = w * h     -- no name: the default applies

totalArea :: Shape a => [a] -> Double
totalArea = foldl' (\acc s -> acc + area s) 0

-- An infinite list. Laziness makes this a definition, not a loop.
fibs :: [Integer]
fibs = 0 : 1 : zipWith (+) fibs (tail fibs)

main :: IO ()
main = do
  print (totalArea [Circle 1, Circle 2])          -- 15.707963267948966
  print (take 8 fibs)                             -- [0,1,1,2,3,5,8,13]
  putStrLn (name (Rect 3 4) ++ ": " ++ show (area (Rect 3 4)))
```

`totalArea` is overloaded on any `Shape`, with the constraint in its type rather
than in a class hierarchy. `fibs` refers to its own tail, and because `zipWith`
produces elements only on demand, `take 8 fibs` terminates. The last line prints
`shape: 12.0`, since `Rect`'s instance inherited the default `name`.

## Formal treatment

Types follow Hindley–Milner with qualified types. A type scheme is

$$
\sigma \;::=\; \forall \bar{\alpha}.\; C \Rightarrow \tau ,
$$

where $\bar{\alpha}$ are the generalised variables, $\tau$ a monotype and $C$ a
set of class constraints such as $\{\mathtt{Shape}\ \alpha\}$. Inference collects
constraints during unification and, at a `let`, either discharges them against
instance declarations or generalises them into the scheme. For the rank-1 core
without polymorphic recursion, every typable expression has a **principal type**
— one scheme all its types are instances of — which is why signatures are
optional. Classes are compiled by _dictionary passing_, a constrained function
taking a hidden extra argument that holds the method table: the standard
implementation technique, not a requirement of the Report.

Non-strictness is stated semantically. Each type is a domain with a least element
$\bot$, the value of a diverging or erroring computation, and $f$ is strict when
$f\,\bot = \bot$. Haskell does not require functions to be strict, which is what
makes `take 8 fibs` well defined. The Prelude's
`seq :: a -> b -> b` satisfies $\mathtt{seq}\ \bot\ b = \bot$ and
$\mathtt{seq}\ a\ b = b$ for $a \neq \bot$; its presence is why $\eta$-equivalence
fails in Haskell, since `seq` can distinguish `undefined` from `\x -> undefined`.

A monad is the class

```haskell
class Applicative m => Monad m where
  (>>=)  :: m a -> (a -> m b) -> m b
  return :: a -> m a
```

subject to $\mathtt{return}\ a \mathbin{\gg\!=} k = k\ a$, $m \mathbin{\gg\!=}
\mathtt{return} = m$, and $(m \mathbin{\gg\!=} k) \mathbin{\gg\!=} h = m
\mathbin{\gg\!=} (\lambda x.\, k\,x \mathbin{\gg\!=} h)$. These are the Kleisli
triple axioms, with `>>=` as the Kleisli extension operator — $m
\mathbin{\gg\!=} k$ is $k^{*}(m)$, so composition in the Kleisli category is the
derived `(>=>) f g = \x -> f x >>= g` — and `return` as the unit $\eta$;
setting $\mathtt{join} = (\mathbin{\gg\!=} \mathtt{id})$ recovers the
multiplication $\mu : T^2 \Rightarrow T$ of the categorical presentation. The
correspondence is real at the level of the laws and approximate below it: the
supposed category of Haskell types and functions is a convenient fiction, since
$\bot$ and `seq` break the equations it would need.

Sequencing is then not mysticism but desugaring. `do { x <- m; rest }` is
`m >>= \x -> do { rest }`, so the order of effects is the order of the data
dependencies that `>>=` creates, in a language with no evaluation order to
appeal to.

## Assumptions and requirements

Complete inference is a property of the rank-1 system. Polymorphic recursion,
higher-rank types, GADTs and type families — all GHC extensions beyond Haskell
2010 — forfeit it, and code using them needs signatures the compiler cannot
reconstruct. Class dispatch assumes _coherence_: at most one instance per class
and type across the whole program. Haskell 2010 keeps resolution decidable by
restricting instance heads and forbidding overlap, and an orphan instance —
defined in neither the class's nor the type's module — is the standard way to
break that and get two behaviours for one type in a single build.

Laziness assumes purity: if evaluation could perform effects, their order would
be unpredictable, which is why lazy impure languages are rare rather than merely
unfashionable. Equational reasoning further assumes no `unsafePerformIO`, and
general recursion inhabits every type with $\bot$ — so Haskell's types, read as
propositions, form an inconsistent logic, unlike those of a total dependently
typed system.

## Uses and applicability

Reach for Haskell when the program transforms structured data and correctness
matters more than the last factor of two: compilers, type checkers, static
analysers, parsers, domain-specific languages, rule engines. GHC itself, the Agda
compiler, `pandoc`, ShellCheck and the Cardano ledger are written in it, and
Facebook's Sigma spam-fighting engine is the well-known industrial case. Avoid it
where latency or residency must be predictable to the millisecond or megabyte,
since garbage collection and laziness compound to make the memory profile hard to
reason about; where the work is numerical kernels close to the hardware; or where
the ecosystem is not there, as in most of machine learning.

## Limitations and common mistakes

A **space leak** is a program holding heap that the algorithm it implements does
not need, and lazy evaluation gives it two distinct shapes. The first is thunk
accumulation, and `foldl` is the canonical trap: `foldl (+) 0 [1..10000000]`
builds a chain of ten million nested additions before anything forces it, costing
linear heap and often a stack overflow when it finally collapses. `foldl'` forces
the accumulator at each step and runs in constant space. Two warnings follow.
GHC's strictness analyser can sometimes rescue `foldl` at `-O`, so the bug
appears and disappears with optimisation flags and with the accumulator's type —
which makes it worse, not better. And `foldl'` forces only to weak head normal
form, so an accumulator like `(a + x, n + 1)` is still a pair of growing thunks.
The second shape is retention: `sum xs / fromIntegral (length xs)` keeps the
entire list alive because the second traversal still needs its head.

Three misconceptions arrive with most readers. That laziness is an optimisation —
it buys asymptotic wins such as short-circuiting and infinite structures, and
costs an allocation and an indirection per thunk plus the predictability above.
That purity forbids mutation — `IORef` and `ST` provide genuine in-place update,
and `runST` hands back a pure interface using a rank-2 type to stop the state
thread escaping. That a type class is an interface implemented by objects — a
class constrains a _type_, dispatch happens at compile time, and it can be driven
by the return type, which is how `mempty` and `read` work and why no
single-dispatch object system can express them.

The Report's own famous trap is the monomorphism restriction: a binding with no
arguments and no signature, such as `f = \x y -> x + y`, does not have its
`Num a` constraint generalised, so `f` takes a single monomorphic type for the
whole module: if that module also contains `a = f (1 :: Int) 2`, then a later
`f 1.5 2.5` fails to compile. The apparently identical `f x y = x + y` is a
function binding, escapes the restriction, generalises to
`Num a => a -> a -> a`, and is fine.

## Variants and alternatives

GHC is the de facto implementation and a superset of the standard, so the
practical dialect is "GHC with a chosen set of extensions", which no document
standardises; Haskell 98 and Haskell 2010 are the settled versions of the
language proper. Among relatives, Standard ML and OCaml keep Hindley–Milner but
are strict and use modules where Haskell uses classes; PureScript is a strict
Haskell-like targeting JavaScript; Idris and Agda add dependent types and
totality; Clean is lazy but handles effects with uniqueness types instead of
monads. SICP's lazy evaluator is the same idea at minimum size.

For overloading, the alternatives are ML modules (explicit and coherent by
construction, more verbose), Rust traits (type classes with enforced coherence
and monomorphisation), multiple dispatch as in Julia (on every argument at run
time, more flexible, with no static guarantee a method exists), and ordinary
subtype polymorphism. For effects, the live competitor to monad transformer
stacks is algebraic effects and handlers, as in Koka and OCaml 5, which compose
without the layering; whether transformers, free monads or effect libraries are
the right default is not settled inside the Haskell community either.

## History and attribution

Haskell is named for the logician Haskell B. Curry and was designed by a
committee formed at the 1987 conference on Functional Programming Languages and
Computer Architecture in Portland, Oregon. The motivation was concrete: more than
a dozen non-strict functional languages were fragmenting a small community, and
the most widely taught of them, Miranda, was proprietary. Version 1.0 of the
Report appeared in 1990; Haskell 98 was the first stable target, with a revised
report in 2003 edited by Simon Peyton Jones, and Haskell 2010 followed, edited by
Simon Marlow.

Two ingredients came from outside. Hindley–Milner inference is due to Hindley, to
Milner in 1978 and to Damas and Milner in 1982. Type classes were introduced by
Philip Wadler and Stephen Blott in "How to make ad-hoc polymorphism less ad hoc"
in 1989, for exactly the problem the committee faced: overloading arithmetic and
equality without giving up principal types. Monadic I/O arrived in the mid-1990s,
replacing earlier stream- and continuation-based interfaces, and carried over
Eugenio Moggi's use of monads for the semantics of computation with Philip
Wadler's adaptation of it for programming.

## Sources

The Haskell 2010 Language Report is the definition: syntax, class and instance
rules, the monomorphism restriction, the Prelude and the library functions used
above, with a preface that is the primary account of the committee's formation.
SICP covers lazy evaluation from the other direction — its streams chapter and
its lazy evaluator build memoised thunks explicitly, which is the clearest way to
see what Haskell does by default. The nLab entry supplies the categorical
definitions the monad laws are compared against. The Rust Book is cited only for
traits, the closest living relative of type classes.

## Prerequisites and next connections

Nothing here needs mathematics beyond ordinary programming.
[Category Theory](./category-theory.md) explains where the words functor and
monad come from and is best read _after_ the type classes, since the laws stand
on their own; [Complexity Analysis](./complexity-analysis.md) is the assumption
laziness violates, because its cost model reads work off the source.

From here, [Proof Theory](./proof-theory.md) takes up the propositions-as-types
reading that Haskell gestures at and general recursion spoils, while
[Coq](./coq.md) and [Lean](./lean.md) show what happens when it is taken
seriously — Coq will even extract its programs to Haskell.
[Core Data Structures](./core-data-structures.md) is where to look when a lazy
program's asymptotics surprise you.
