---
concept_id: concept.languages.rust
title: Rust
slug: /concepts/rust
kind: tool
tier: 1
review_state: generated-draft
summary: Rust is a compiled systems language whose type system tracks who owns each value and how long references to it may live, so the compiler rejects use-after-free and data races before the program ever runs — with no garbage collector, and with the ownership and aliasing discipline checked entirely at compile time rather than by a run-time barrier or lock.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: specializes
    target: concept.paradigms.imperative_programming
    note: Rust is an imperative language of statements, mutation and explicit control flow; what distinguishes it is a type system that decides which mutations the compiler will accept.
  - type: contrasts_with
    target: concept.languages.cpp
    note: Both compile to native code with deterministic destruction and no garbage collector, but C++ leaves the aliasing discipline to convention and tooling while Rust makes violating it a compile error.
  - type: contrasts_with
    target: concept.languages.c_language
    note: C offers the same manual control with no static ownership or lifetime checking, so the exact programs Rust rejects at compile time are ordinary, compilable C that fails at run time or not at all.
  - type: contrasts_with
    target: concept.languages.go
    note: Go reaches memory safety through a garbage collector and run-time bounds checks, paying at run time for what Rust pays for in compile-time proof obligations and rejected programs; data races are not ruled out in Go, and its race detector is an opt-in dynamic tool for testing rather than part of the guarantee.
sources:
  - source_id: source.rust.book
    title: The Rust Programming Language
    url: https://doc.rust-lang.org/book/
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.go.documentation
    title: The Go Programming Language documentation
    url: https://go.dev/doc/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: RustBelt semantic soundness proof
    reason: The claim that a realistic subset of Rust has a machine-checked soundness proof, and that this is what licenses library `unsafe` code, rests on the RustBelt line of work, which no source in the registry covers.
    sections:
      - formal-treatment
  - label: Rust in the machine-learning tooling stack
    reason: No registry source documents the specific Rust projects underneath the Python data and ML stack (tokenizers, safetensors, Polars, the Astral tools), so the applicability claims there are uncited.
    sections:
      - uses-and-applicability
  - label: Origins and release history of Rust
    reason: The dates, the Mozilla sponsorship, the browser-engine motivation and the pre-1.0 removals are not covered by the language documentation cited here; a project history or retrospective is missing from the registry.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Rust** is a statically typed, ahead-of-time compiled programming language in
which every value has exactly one owning binding, every reference carries a
compile-time _lifetime_ bounding how long it may be used, and the compiler's
_borrow checker_ rejects any program that could observe a value through a
reference after the value is gone or mutate it while another reference exists.
There is no garbage collector: a value is destroyed at a point the compiler can
name, when its owner goes out of scope.

Two rules do most of the work. **Ownership**: assigning or passing a non-`Copy`
value _moves_ it, and the old binding becomes unusable. **Borrowing**: at any
program point a value may have either any number of shared references `&T` or
exactly one mutable reference `&mut T`, never both.

## Why it matters

The bugs Rust removes are not exotic. Use-after-free, double free, buffer
overrun, iterator invalidation and data races are the failures that dominate
memory-corruption security advisories in large C and C++ codebases, and they
share a shape: two parts of a program disagree about who may touch a piece of
memory and when. Testing finds them poorly because they are timing-dependent and
often produce no visible symptom on the path you ran.

Before Rust, the practical choice was between a runtime that manages memory for
you — a garbage collector, with its pauses and footprint — and manual management
with the whole class of errors left in. Rust's contribution is that the
aliasing discipline good C programmers already follow in their heads was made
into a type discipline a compiler can check, so the guarantee holds without a
runtime.

## Intuition

Think of a mutable reference as an exclusive key. Handing out the key means you
no longer have it; you get it back when the borrower is done. You may instead
photocopy a read-only card and hand out as many as you like — but then nobody,
including you, may write. The compiler tracks who holds which piece of paper.

The analogy breaks in two places worth knowing. First, this is a _static_
discipline: nothing is tracked at run time, and the keys do not exist in the
compiled binary. Second, the checker is sound but incomplete — it rejects some
programs that would in fact have been fine, because it reasons about the
control-flow graph rather than about what actually happens.

## Concrete example

The borrow checker rejects this:

```rust
fn main() {
    let mut names = vec![String::from("ada")];
    let first = &names[0];              // shared borrow of `names` begins
    names.push(String::from("grace"));  // needs `&mut names` — error E0502
    println!("{first}");                // shared borrow still live here
}
```

`rustc` reports `cannot borrow 'names' as mutable because it is also borrowed as
immutable`. This is not pedantry. `Vec::push` may exceed the vector's capacity,
allocate a larger buffer, move the elements and free the old one — at which
point `first` points into freed memory. The equivalent C++ with
`std::vector` and a reference compiles, usually appears to work, and is
undefined behaviour.

Two fixes. Copy out what you need, so nothing is borrowed across the mutation:

```rust
let first = names[0].clone();
names.push(String::from("grace"));
println!("{first}");
```

Or simply finish with the borrow first — since non-lexical lifetimes, a borrow
ends at its last use, not at the end of the enclosing block:

```rust
let first = &names[0];
println!("{first}");                // borrow ends here
names.push(String::from("grace"));  // accepted
```

## Formal treatment

Write $S_p(v)$ and $M_p(v)$ for the sets of shared and mutable references to a
value $v$ that are live at program point $p$. The borrow rule is

$$
\forall p,\ \forall v:\quad
\bigl(\lvert M_p(v)\rvert = 1 \wedge \lvert S_p(v)\rvert = 0\bigr)
\ \vee\ \lvert M_p(v)\rvert = 0 ,
$$

together with the requirement that no reference in $S_p(v) \cup M_p(v)$ is live
at a point where $v$ has been moved or dropped. _Live_ here means "used again
later on some path", which is why reordering the `println!` above was enough.

Lifetimes are ordinary generic parameters. In

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

`'a` is instantiated at each call site with a region no longer than both
arguments' own regions; the annotation constrains which programs typecheck and
changes nothing about when anything is freed. Most signatures need no
annotation, because elision rules supply the common cases.

Thread safety is expressed through two marker traits. `T: Send` means a value of
type `T` may be moved to another thread; `T: Sync` means `&T` may be shared
across threads, equivalently `&T: Send`. Both are derived automatically for
types built from `Send`/`Sync` parts, and the thread-spawning APIs require them.
Data-race freedom then follows from the borrow rule: a `&mut T` is unique, and a
`&T` permits no writes except through types like `Mutex<T>` that are `Sync`
precisely because they synchronise internally.

`unsafe` does not disable the borrow checker. It unlocks five operations —
dereferencing a raw pointer, calling an `unsafe` function, accessing or mutating
a `static mut`, implementing an `unsafe` trait, and reading union fields — and
moves the proof obligation to the author. The soundness argument for the whole
language is therefore modular: safe code is checked mechanically, and the
`unsafe` blocks inside the standard library and low-level crates are claimed to
uphold the same invariants. Formal work on a realistic subset of the language has
given this a machine-checked footing; that work is not covered by the sources
cited here.

## Assumptions and requirements

The guarantee is conditional, and the conditions are worth stating plainly. It
assumes the `unsafe` code your program transitively depends on is correct — the
standard library, allocators, FFI wrappers, and any crate that reaches for raw
pointers. One wrong `unsafe` block can make ordinary safe code unsound, which is
why the ecosystem maintains security advisories against libraries, not just
against applications. It assumes the compiler and its LLVM backend are correct.
And it assumes you stay inside the language: data crossing an FFI boundary
carries none of these properties.

The borrow rule also assumes your data has a shape it can express. Ownership is
naturally a tree. Cyclic and graph-shaped data — doubly linked lists, parent
pointers, observer registries — do not fit, and must be expressed with
reference counting plus run-time borrow checks (`Rc<RefCell<T>>`), with arena
allocation and integer indices, or with `unsafe`.

## Uses and applicability

Reach for Rust where a memory-safety bug is expensive and a garbage collector is
not acceptable: operating-system components and drivers, browser engines,
embedded firmware, cryptographic code, network proxies and databases, and
WebAssembly targets. It has been adopted for exactly these in production, and
Rust support was merged into the Linux kernel.

In machine learning, Rust is mostly the layer _underneath_ Python rather than a
modelling language: fast tokenizers, tensor-serialisation formats, dataframe
engines, and a new generation of Python packaging and linting tools are written
in Rust with Python bindings, because they are CPU-bound, called in a loop, and
awkward to write safely in C. The numerical core of training — CUDA kernels,
BLAS, the autodiff frameworks — remains C++ with a Python surface, and Rust
inference libraries exist but are not where the ecosystem's weight is.

Do not reach for it for exploratory numerical work, short scripts, or anything
where the library you need exists only in Python or R. Compile times and the
cost of learning the borrow rules are real, and they are paid up front.

## Limitations and common mistakes

Safe Rust does **not** prevent memory leaks. Leaking is memory-safe by
definition, `std::mem::forget` is a safe function, and a cycle of `Rc` handles
leaks by construction. It does not prevent deadlock: two threads each waiting on
the other's `Mutex` is a well-typed program. It does not prevent panics,
out-of-memory aborts, or any logic error whatsoever — a correctly borrowed
value can still hold the wrong number.

Integer overflow is defined rather than undefined, but its behaviour is a
compilation setting: panic in debug builds, two's-complement wraparound in
release builds by default. That is a convention of the toolchain, not a theorem.

Three misconceptions arrive regularly. That the borrow checker never rejects a
correct program — it does, by design, and the honest response is to change the
data structure rather than to conclude the checker is broken. That `unsafe`
means "bad code" — it means "code carrying a proof obligation the compiler
cannot discharge", and a program with zero `unsafe` still runs on a standard
library full of it. And that `Rc<RefCell<T>>` restores flexibility for free: it
moves the aliasing check from compile time to run time, where a violated borrow
is a panic instead of an error message.

## Variants and alternatives

Within Rust, _editions_ (2015, 2018, 2021, 2024) let a crate opt into breaking
syntax changes while linking against crates on other editions, so the language
evolves without splitting the ecosystem. `no_std` drops the standard library for
embedded targets. `async`/`await` is a language feature with the executor left
to libraries, and brings its own difficulty around pinning and self-reference.

The nearest alternative is modern C++, which reaches many of the same places
through RAII, smart pointers and move semantics, but checks none of it: the
discipline is convention, backed by sanitizers and static analysis that find
violations on paths you actually execute. Garbage-collected languages — Go,
Java, C# — buy memory safety outright and pay in pauses, footprint and a
runtime; Go's race detector is dynamic and reports only races it observes. Swift
sits between, using automatic reference counting rather than static ownership.
Rust's ownership ideas descend from region- and linear-type research, Cyclone (a
safe dialect of C) being the most direct ancestor. Where memory safety is not
enough, proof assistants and Rust-specific verifiers prove functional
correctness instead — a stronger guarantee for far more effort.

## History and attribution

Rust began as Graydon Hoare's personal project in the mid-2000s and was taken up
and sponsored by Mozilla, whose motivation was concrete: write a browser engine
that could exploit multiple cores without the memory-corruption bugs that
dominated Firefox's security advisories. The early language looked quite
different — it had a garbage collector, a typestate system and green threads,
all removed before the 1.0 release in 2015 in favour of ownership and borrowing
as the single organising idea. Servo was the driving application, and parts of it
shipped inside Firefox. Stewardship moved from Mozilla to the independent Rust
Foundation. The precise dates are not covered by the sources cited here.

## Sources

**The Rust Programming Language** — the official book, and the reference for
ownership, borrowing, lifetimes, traits, `Send`/`Sync`, `unsafe`, and the
worked errors quoted above. **Operating Systems: Three Easy Pieces** — what a
data race, a dangling pointer and a leak actually are at the level of the
process and its address space, which is the problem Rust's rules address.
**cppreference.com** — the C++ facilities (RAII, smart pointers, move semantics,
iterator invalidation) that are the main alternative approach. **The Go
Programming Language documentation** — the garbage-collected, dynamically
race-detected point of comparison.

## Prerequisites and next connections

You need to have written a program in which memory management was visible —
allocation, deallocation, a pointer that outlived what it pointed at. Without
that, ownership reads as arbitrary ceremony.
[Core Data Structures](./core-data-structures.md) is the sharpest place to feel
it: linked lists, trees and graphs are precisely where a single-owner discipline
starts to bite, and where the Rust answers (indices into an arena, reference
counting, `unsafe`) diverge from the textbook pseudocode.

What this opens up is the general idea of a type system that proves something
about run-time behaviour. Rust proves a narrow property — memory and thread
safety — mechanically and cheaply. [Lean](./lean.md) and [Coq](./coq.md) take
the same idea much further, proving arbitrary propositions about programs and
mathematics at a cost in human effort that Rust deliberately refuses to pay. The
comparison is the most useful one to carry: what a type system buys is always
some property, for some price, and the interesting question is which trade each
language chose.
