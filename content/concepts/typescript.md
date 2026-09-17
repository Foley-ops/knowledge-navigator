---
concept_id: concept.languages.typescript
title: TypeScript
slug: /concepts/typescript
kind: tool
tier: 1
review_state: generated-draft
summary: TypeScript adds a structural static type layer to JavaScript that the compiler checks and then erases, buying editor tooling and refactoring safety at the price of a type system that is knowingly unsound and enforces nothing at runtime.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: contrasts_with
    target: concept.languages.haskell
    note: Haskell's type system is nominal at the data declaration, inferred globally and designed for soundness, whereas TypeScript's is structural, locally inferred and deliberately unsound in order to describe JavaScript that already exists.
  - type: contrasts_with
    target: concept.languages.julia
    note: Julia keeps types at runtime and uses them to dispatch and specialise code, so its types have computational content; TypeScript's are deleted before the program runs and can change nothing about its behaviour.
  - type: contrasts_with
    target: concept.formal_verification.lean
    note: Lean's dependent types are checked by a kernel whose soundness is the point and whose terms are proofs, while TypeScript's types are a best-effort description with documented escape hatches and no metatheorem behind them.
sources:
  - source_id: source.typescript.handbook
    title: The TypeScript Handbook
    url: https://www.typescriptlang.org/docs/handbook/intro.html
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mdn.javascript
    title: MDN Web Docs — JavaScript
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript
    source_kind: reference-documentation
    supports:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: TypeScript's project history and its published design goals, including the explicit non-goal of a sound type system
    reason: The registry has no source covering the project's 2012 announcement, its designers, or the design-goals document in which unsoundness is recorded as a deliberate trade-off; the handbook documents the resulting behaviour but not the dates or the rationale.
    sections:
      - limitations-and-common-mistakes
      - history-and-attribution
  - label: Formal treatments of a core TypeScript calculus, and the gradual typing literature that names this design space
    reason: No programming-language-theory source is registered, so the claims that a core fragment has been formalised in the research literature and that gradual typing is a separate academic lineage rest on no citation here.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**TypeScript** is JavaScript extended with a static type layer that a compiler
checks and then deletes. Its syntax is JavaScript's plus type annotations,
interfaces, type aliases and generics; `tsc` checks a program against those
annotations and emits JavaScript in which every one of them is gone. Two
properties define the type system. It is **structural**: whether a value of type
$S$ may be used where $T$ is expected depends on the members $S$ has, never on
the name it was declared under — with narrow exceptions noted below. And it is
**erased**: the emitted program
contains no representation of any type, so nothing the checker concluded is
available to, or enforced by, the runtime.

## Why it matters

A JavaScript codebase of any size has an interface problem. What does this
function return when the argument is missing? Which of these twelve call sites
break if the field is renamed? JavaScript answers neither without running the
program, and running it exercises one path. TypeScript answers both statically,
and the same checker drives the editor: completion, go-to-definition and
rename-symbol are the type checker's answers, not a text search.

The second payoff is narrower and more valuable than it looks. With
`strictNullChecks`, `null` and `undefined` stop being members of every type, so
a large class of `TypeError: cannot read property of undefined` moves from
runtime to compile time — the biggest safety change the language has made.

## Intuition

Carry two pictures. First: the checker is a linter with a very good memory —
it reads the shapes you wrote, follows them across modules, complains where they
do not line up, and throws them away. Second, correcting the first: it is a real
type system, with parametric polymorphism, local inference and a type-level
sublanguage expressive enough to compute.

Structural typing is duck typing decided in advance — "if it has the members I
need, it will do", the rule JavaScript applies at the property access, applied
instead by the compiler over the whole program. The analogy breaks where it
matters: a runtime duck test fails loudly when the duck is a rabbit, while
TypeScript's verdict was reached earlier, on assumptions that may have been
wrong, and is never rechecked.

## Concrete example

A discriminated union, narrowed by its tag, plus structural assignability:

```ts
type Shape = { kind: 'circle'; radius: number } | { kind: 'rect'; width: number; height: number };

function area(s: Shape): number {
  switch (s.kind) {
    case 'circle':
      return Math.PI * s.radius ** 2; // s is the circle member here
    case 'rect':
      return s.width * s.height;
  }
}

area({ kind: 'circle', radius: 2 }); // 12.566370614359172

function draw(p: { x: number; y: number }) {
  /* ... */
}
class Point3 {
  constructor(
    public x: number,
    public y: number,
    public z: number,
  ) {}
}
draw(new Point3(1, 2, 3)); // accepted: Point3's shape covers the parameter's
```

`Point3` declares no interface and knows nothing about `draw`. Compiled, `area`
is a plain function switching on a string field; no type survives.

Now the hole, which is not a bug report but documented behaviour:

```ts
class Animal {}
class Dog extends Animal {
  bark() {}
}
class Cat extends Animal {
  meow() {}
}

const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs; // accepted: arrays are covariant
animals.push(new Cat()); // accepted
dogs[1].bark(); // compiles; at runtime: bark is not a function
```

Every line type-checks under `strict`. The program throws.

## Formal treatment

Write $S \lesssim T$ for assignability: a value of type $S$ may be used where
$T$ is expected. For object types, $S \lesssim T$ holds when every required
member $m : T_m$ of $T$ has a member $m : S_m$ in $S$ with $S_m \lesssim T_m$;
optional members of $T$ need no counterpart.

$$
\{\,a : A,\; b : B\,\} \;\lesssim\; \{\,a : A'\,\}
\quad\text{iff}\quad A \lesssim A' .
$$

Member types are compared covariantly even for mutable properties, which is the
unsoundness the array example exhibits, `Array<T>` being an object type with
`T`-valued members. `unknown` is the top type and `never` the bottom; `any` is
assignable in both directions, with one exception — $T \lesssim$ `any` for every
$T$, and `any` $\lesssim T$ for every $T$ other than `never` — so the relation is
not even transitive, `string` $\lesssim$ `any` $\lesssim$ `number` while
`string` $\not\lesssim$ `number`, and soundness cannot survive that.

For functions, return types are covariant and, under `strictFunctionTypes`,
parameter types contravariant: $(x : A) \Rightarrow R \lesssim
(x : B) \Rightarrow R'$ requires $B \lesssim A$ and $R \lesssim R'$. That flag
exempts members written with **method syntax**, whose parameters stay
**bivariant** — $A \lesssim B$ _or_ $B \lesssim A$ suffices. The exemption is
deliberate: the standard library's own signatures do not type-check
contravariantly.

Generics are constrained parametric polymorphism, `f<T extends C>(x: T)`, with
inference at the call site. Conditional types `T extends U ? X : Y` distribute
over a naked union parameter and bind with `infer`; with recursive and mapped
types the type-level fragment is Turing complete, which is why the checker
imposes an instantiation-depth limit and why elaborate types dominate compile
time. There is no soundness theorem for the language as implemented: the
reference is the compiler.

Erasure is the semantic contract. Let $\mathcal{E}$ map a program $P$ to its
emitted JavaScript; the meaning of $P$ _is_ the meaning of $\mathcal{E}(P)$.
A few constructs break pure erasure by emitting code — `enum`, namespaces with
values, parameter properties, legacy decorators — hence the "erasable syntax
only" modes for runtimes that strip types rather than compile them.

## Assumptions and requirements

The guarantees people attribute to TypeScript hold only under conditions that
are easy to lose.

- **The strict flags are on.** Without `strictNullChecks` every type silently
  admits `null`; without `noImplicitAny` unannotated parameters are `any` and
  checking stops there. And `noUncheckedIndexedAccess` is _not_ part of
  `strict`, so `xs[i]` is typed `T` even when the index is out of range.
- **Declarations are honest.** `.d.ts` files and `declare` statements assert
  shapes the compiler cannot verify; a wrong one is believed absolutely.
- **The boundary is validated.** Anything entering from outside — `JSON.parse`,
  `fetch`, storage, user input — arrives shapeless, and annotating it asserts a
  shape rather than checking one.
- **The checked code is the shipped code.** Bundlers and modern runtimes strip
  TypeScript syntax without type-checking it, so a build can succeed where the
  checker would fail; only `tsc --noEmit` in CI makes checking part of the
  pipeline.

## Uses and applicability

Reach for TypeScript when a JavaScript codebase outlives one person's working
memory: several contributors, modules with real interfaces between them, or a
public API others will call. Library authors gain twice over, since shipped
declaration files document the API in a form consumers' editors can use.

It pays less in a one-file script, and in code whose whole job is dynamic — deep
manipulation of unknown JSON, heavy metaprogramming — where types become an
exercise in restating what the program does. And if you need a runtime
guarantee, TypeScript is the wrong instrument at any size.

## Limitations and common mistakes

The first mistake is believing a clean build means no `TypeError`. It does not,
for documented reasons: `any` disables checking and spreads through the values
it touches; `as` and `!` are assertions with no runtime effect; mutable
properties and arrays are covariant; method parameters are bivariant; and a
declaration file may simply lie.

The second is treating `as` as a cast. `JSON.parse(text) as User` validates
nothing whatsoever — it renames the compiler's belief. Where `as` is applied to
an object _literal_, `satisfies` is usually what was wanted: it checks the value
against the type without asserting it. At the `JSON.parse` or `fetch` boundary
it is no better than `as` — the value is already `any`, so the check passes
vacuously and the type stays `any` — and only a runtime validator closes that
hole.

The third is expecting nominal typing. Two unrelated classes with the same shape
are interchangeable, and `type UserId = string` accepts any string. The
workarounds are branding — intersecting with a unique-symbol field — and the
nominal corners the language does have: classes with `private` or `protected`
members are compatible only with classes from the same declaration, and two enum
types are mutually incompatible even when their members coincide.

The fourth is misreading excess property checks. An object _literal_ with an
extra field is rejected; the same object assigned through a variable is
accepted. That is a check on fresh literals, not the structural rule changing
its mind.

Finally: the unsoundness was a choice. A sound system that rejected the idioms
of the JavaScript already written would have been correct and unused.

## Variants and alternatives

**Flow**, from Meta, is the close contemporary: the same gradual, erased
approach, different inference, a far smaller ecosystem today. **JSDoc
annotations with `checkJs`** run the same checker over plain JavaScript, buying
checking without a build step at the cost of clumsier syntax. **Python's type
hints** are the other mainstream instance of the bargain — annotations the
runtime does not enforce, checked by external tools — differing in that Python's
survive as objects at runtime while TypeScript's are gone.

The genuinely different approach is a sound language compiling to JavaScript,
such as Elm, ReScript or PureScript: real guarantees, paid for in interop
friction and ecosystem size. Orthogonally, schema libraries that define a
validator and derive the static type from it close the boundary hole without
leaving TypeScript.

## History and attribution

TypeScript was developed at Microsoft and announced publicly in October 2012,
designed under Anders Hejlsberg, previously the designer of Turbo Pascal, Delphi
and C#. The problem was concrete: Microsoft teams were writing very large
JavaScript applications and could not navigate or refactor them. It was open
source from the first release, and the compiler is written in TypeScript.

It was not alone: Google's Closure Compiler had type-checked annotated
JavaScript for years, Dart proposed replacing the language outright, and Flow
arrived shortly after with a similar bargain. Mixing static and dynamic typing
has an academic lineage under the name _gradual typing_, though TypeScript is
not a gradual type system in the technical sense — it inserts no runtime casts
and assigns no blame when an assumption proves false. Adoption inflected around
2015 when Angular adopted it; version 2.0 in 2016 added `strictNullChecks`; and
in 2025 Microsoft announced a native port of the compiler.

## Sources

The **TypeScript Handbook** is the reference for what the language does:
structural assignability, generics, discriminated unions and narrowing, the
strict-mode flags, and the type-compatibility rules including the bivariance
exemption for methods. **MDN Web Docs — JavaScript** covers the substrate: what
the emitted program means, and why a dynamically typed runtime cannot enforce a
type the compiler erased. **The Python Language Reference** is cited only for
the comparison in the alternatives section.

## Prerequisites and next connections

Read this with working JavaScript knowledge. TypeScript is a layer over
semantics it does not change, and a reader unsure what `this` or a prototype
does will misattribute the confusion to the type system.

Two directions open from here. [Lean](./lean.md) shows what a type system looks
like when soundness is the point and a type can express a proof — the opposite
end of TypeScript's trade-off. [Computability Theory](./computability-theory.md)
explains why a Turing-complete type-level language leaves type checking with no
general termination guarantee, which the compiler answers with a depth limit
rather than a theorem.
