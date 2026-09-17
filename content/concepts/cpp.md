---
concept_id: concept.languages.cpp
title: C++
slug: /concepts/cpp
aliases:
  - zero-overhead abstraction
kind: implementation
tier: 1
review_state: generated-draft
summary: A compiled, statically typed language that layers classes, templates and deterministic resource management onto C's machine model under a rule that abstraction must cost nothing at run time — and that inherits C's undefined behaviour in the bargain.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: requires
    target: concept.languages.c_language
    note: C++ began as an extension of C and still inherits its declaration syntax, pointer arithmetic, integer promotions and undefined behaviour, so the inherited half of the language is unreadable without C first.
  - type: implements
    target: concept.paradigms.object_oriented_programming
    note: Classes, single and multiple inheritance, and virtual dispatch through a per-class function-pointer table are C++'s concrete realisation of dynamic polymorphism.
  - type: contrasts_with
    target: concept.languages.rust
    note: Rust targets the same niche — systems code without a garbage collector — but makes ownership a checked property of the type system instead of a convention enforced by the programmer.
  - type: contrasts_with
    target: concept.languages.python
    note: The two are routinely paired rather than compared, with C++ doing the numerical work underneath and Python driving it, because each is strong exactly where the other is weak.
sources:
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.isocpp.standard
    title: Standard C++ Foundation
    url: https://isocpp.org/
    source_kind: reference-documentation
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.rust.book
    title: The Rust Programming Language
    url: https://doc.rust-lang.org/book/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.nvidia.cuda_programming_guide
    title: CUDA C++ Programming Guide
    url: https://docs.nvidia.com/cuda/cuda-c-programming-guide/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
unresolved_references:
  - label: ISO/IEC 14882 and Stroustrup's design rationale
    reason: The normative standard text and Stroustrup's account of why each feature was accepted are not in the registry; the page relies on cppreference's non-normative summaries and isocpp.org's public history material instead.
    sections:
      - formal-treatment
      - history-and-attribution
claims: []
---

## Definition

**C++** is a statically typed, separately compiled, general-purpose programming
language whose semantics are specified in terms of an abstract machine, and
which layers user-defined types, compile-time generic programming and exception
handling on top of C's memory and object model. It is deliberately not one
paradigm: a single translation unit can hold C-style procedural code, a class
hierarchy with virtual dispatch, a template metaprogram evaluated before the
program runs, and a value-semantic pipeline of algorithms over containers.

The organising commitment is the **zero-overhead principle**: you do not pay for
what you do not use, and what you do use you could not hand-code any better.
That rule explains most of the design and most of the difficulty. Features that
cannot be made free are usually rejected, and checks that would cost cycles are
usually off by default.

## Why it matters

C++ is what you reach for when you need both abstraction and control of the
machine. It is the implementation language of game engines, browsers, databases,
LLVM, low-latency trading systems, and the tensor kernels underneath the major
deep-learning frameworks.

The reason is specific: with no garbage collector there is no collection pause,
and destruction happens at a point in the program you can name. You can write a
lock-free queue against raw atomics and, three lines later, a
`std::vector<std::string>` that allocates, grows and frees itself — in the same
language, with no foreign-function boundary between the two.

## Intuition

Carry two pictures.

The first is **ownership as scope**. A C++ object's death is a point in the
source text rather than a decision some collector makes later. If the object
holds a file, a lock, a socket or a block of memory, releasing it in the
destructor means the release happens on every exit path — a `return`, a `break`,
a thrown exception. This is RAII, and it is the whole answer to "how does C++
manage resources without a garbage collector".

The second is **templates as compile-time duck typing**. A template is not a
generic function that works on any type at run time; it is a pattern the
compiler stamps out once per type you use, type-checking the result each time.
The analogy to C macros breaks in three places: templates are parsed and partly
checked _before_ substitution — under two-phase lookup, non-dependent constructs
are diagnosed at definition time — and then type-checked again per
instantiation, where a macro is untyped token substitution never checked as a
pattern at all; they take part in overload resolution; and each instantiation is
a separate function in the binary, so code size grows with the number of types
you instantiate.

## Concrete example

```cpp
#include <algorithm>
#include <concepts>
#include <iostream>
#include <memory>
#include <string>
#include <utility>
#include <vector>

// Compile-time polymorphism, constrained by a concept: one definition,
// instantiated separately for every T the caller actually uses.
template <std::integral T>
T sum(const std::vector<T>& xs) {
    T total{};
    for (T x : xs) total += x;
    return total;
}

// RAII: the destructor runs at scope exit on every path out, including
// when an exception unwinds the stack.
struct Handle {
    std::string name;
    explicit Handle(std::string n) : name(std::move(n)) {
        std::cout << "acquire " << name << '\n';
    }
    ~Handle() { std::cout << "release " << name << '\n'; }
};

int main() {
    std::vector<int> xs{3, 1, 4, 1, 5};
    std::sort(xs.begin(), xs.end());
    std::cout << sum(xs) << '\n';                 // 14

    auto owner = std::make_unique<Handle>("db");  // acquire db
    auto taken = std::move(owner);                // ownership moves; no copy
    std::cout << (owner ? "owner holds\n" : "owner is empty\n");
}                                                 // release db
```

Compiled with `c++ -std=c++20 -Wall -Wextra`, this prints `14`, `acquire db`,
`owner is empty`, `release db`. Note four things. `sum` is constrained, so
passing a `std::vector<std::string>` fails at the call site with a message about
`std::integral` rather than deep inside the loop. The `Handle` is never
explicitly deleted. `std::move(owner)` moves nothing — it casts, and
`unique_ptr`'s move constructor does the work, leaving `owner` null. And
`release db` is emitted when `taken` dies at the closing brace.

## Formal treatment

The standard defines behaviour as that of an abstract machine and requires a
conforming implementation only to reproduce the _observable_ behaviour —
volatile accesses, I/O and termination. Everything else may be reordered, folded
or deleted. This is the **as-if rule**.

Within a scope, destruction is the exact reverse of construction:

$$
\text{constructed } o_1, o_2, \dots, o_n
\;\Longrightarrow\;
\text{destroyed } o_n, \dots, o_2, o_1 .
$$

RAII is that guarantee plus one convention: the constructor establishes the
invariant "this object owns the resource", and the destructor releases it. Stack
unwinding runs the same destructors in the same order, which is what makes the
**basic guarantee** — no leaks, invariants intact — achievable without cleanup
code.

Every expression has a value category: _lvalue_, _xvalue_ or _prvalue_. `T&&`
binds to rvalues, so overload resolution can pick a move constructor when the
source is about to die. `std::move(x)` is `static_cast<T&&>(x)`; it does nothing
at run time, and its only effect is to change which overload wins. A moved-from
standard-library object is _valid but unspecified_.

Templates are instantiated on use, the substituted body type-checked per
instantiation; substitution failure during overload resolution is not an error
(SFINAE), which is how much of the compile-time machinery is built. Concepts
(C++20) are named predicates on template arguments checked at the interface, so
the diagnostic points at the caller rather than the template's internals.

Undefined behaviour is stronger than it sounds: the standard imposes _no
requirements at all_ on a program that executes it, and compilers optimise on
the assumption that it never happens. A data race is undefined behaviour for the
whole program, not just the racing object — which is why sharing mutable state
between threads requires actual synchronisation, a mutex or atomics with an
explicit memory order, and never a bare `int`.

## Assumptions and requirements

Deterministic destruction assumes destructors actually run. They do not when you
leak through a raw `new`, when `std::exit` or `std::abort` ends the program,
when `longjmp` skips frames, or when two `std::shared_ptr`s point at each other,
since reference counting cannot collect a cycle. Objects with static storage
duration in different translation units are destroyed in an order the standard
does not fix. Exception safety additionally assumes destructors do not throw:
one that throws during unwinding calls `std::terminate`, which is why
destructors are implicitly `noexcept` since C++11.

Zero overhead is an aspiration about the language's design, not a theorem about
any compiler: it holds when the optimizer inlines, and table-driven exception
handling costs binary size even on paths that never throw. Templates assume the
definition is visible where it is instantiated, which is why so much of the
ecosystem is header-only and why build times are what they are.

## Uses and applicability

Reach for C++ when you need predictable latency, direct control of memory
layout, or source-level interoperation with existing C and C++ — engines,
kernels, codecs, embedded systems, numerical libraries. CUDA device code is
written in a C++ dialect, so GPU work lands here whether or not you chose the
language.

Do not reach for it for glue, scripts, most web services, or anything where the
dominant cost is developer time rather than machine time. A team without a
sanitizer-and-review culture will produce memory bugs faster than features.

## Limitations and common mistakes

Undefined behaviour is the big one, and the usual misconception is that it means
"something platform-specific happens". It does not. Signed overflow,
out-of-bounds access, use-after-free, null dereference and strict-aliasing
violations license the compiler to assume the code is unreachable — which is how
a null check after a dereference gets deleted, and why a bug can appear only at
`-O2`.

Smaller traps, all common: `std::move` moves nothing, and moved-from objects are
not empty, only unspecified. `push_back` may reallocate and invalidate every
iterator, pointer and reference into the vector. `shared_ptr` is not a garbage
collector — it leaks cycles, and its atomic refcount costs real time in hot
code. Writing any destructor suppresses the implicit move operations, silently
turning moves back into copies, which is what the rule of zero exists to avoid.
And C++ is not a superset of C: valid C programs exist that C++ rejects.

Template diagnostics deserve their reputation: before concepts, a type failing
an unwritten requirement produced errors from deep inside the library, naming
instantiations the user never wrote. Concepts help substantially where libraries
have adopted them, which is not everywhere.

## Variants and alternatives

The language is versioned by ISO revision: C++98 and C++03, then C++11 — the
watershed that brought move semantics, `auto`, lambdas, smart pointers and a
threading memory model — followed by C++14, C++17, C++20 (concepts, ranges,
modules, coroutines) and C++23. Dialects matter in practice: much game, embedded
and browser code builds with exceptions and RTTI disabled, and CUDA extends C++
with its own launch and address-space syntax, while SYCL expresses the same
single-source model in standard C++ with no language extensions.

The nearest alternatives trade differently. C keeps the machine model and gives
up RAII, templates and destructors. Rust keeps the no-garbage-collector position
and moves ownership into the type system, buying memory safety in safe code at
the cost of a borrow checker you must satisfy and far less existing code.
Garbage-collected languages give up deterministic destruction to remove the
whole category of bug. Whether C++ can retrofit comparable safety through
committee "profiles" and library hardening is contested and not settled.

## History and attribution

Bjarne Stroustrup began "C with Classes" at Bell Labs in 1979. His doctoral work
at Cambridge had involved simulating distributed systems, where he found
Simula's classes excellent for structure and far too slow, while BCPL was fast
and offered no structure at all; C with Classes was an attempt at Simula's
organisation for C's price. The language was renamed C++ in 1983.

Templates and exceptions arrived across the late 1980s and early 1990s. The
Standard Template Library — Alexander Stepanov's generic-programming design of
iterators, containers and algorithms — was adopted into the draft standard in
1994 and shaped the standard library that followed. The first ISO standard,
ISO/IEC 14882, appeared in 1998, and the committee has shipped on a fixed
three-year schedule since C++11.

## Sources

**cppreference** is the working reference for the language rules and the
standard library, and the right place to check value categories, lifetime and
the signatures used above. **isocpp.org**, the Standard C++ Foundation, carries
the public standardisation material, the history pages, and the C++ Core
Guidelines, where the community's view of the common mistakes is written down.
**The Rust Programming Language** is cited only for the alternative: what
checking ownership at compile time buys and costs. The **CUDA C++ Programming
Guide** documents the GPU dialect.

## Prerequisites and next connections

Read C first. C++'s declarations, pointers, integer conversions and undefined
behaviour are inherited wholesale, and the parts of C++ that feel arbitrary are
usually the parts that are C.

The standard library is the natural next step, best read alongside
[Core Data Structures](./core-data-structures.md): `std::map` and
`std::unordered_map` are a balanced search tree and a hash table with complexity
guarantees written into the standard. [Sorting](./sorting.md) explains what
`std::sort` does, and [Complexity Analysis](./complexity-analysis.md) is the
language those guarantees are stated in. Rust is the most instructive page to
read against this one.
