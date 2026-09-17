---
concept_id: concept.languages.c_language
title: C
slug: /concepts/c-language
aliases:
  - ANSI C
  - K&R C
kind: tool
tier: 1
review_state: generated-draft
summary: A small statically typed systems language in which the programmer allocates memory and controls object layout by hand, and whose calling convention became the interface almost every other language uses to reach native code.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: specializes
    target: concept.paradigms.imperative_programming
    note: C narrows the imperative model to the machine — statements sequenced over a mutable store that is literally addressable memory, with no facility borrowed from any other paradigm.
  - type: contrasts_with
    target: concept.languages.cpp
    note: C++ grew out of C and shares its declaration syntax and memory model, but it is not a superset — code legal in one is routinely illegal or differently meaning in the other.
  - type: contrasts_with
    target: concept.languages.rust
    note: Rust occupies the same niche of no garbage collector and full layout control, but moves the memory discipline C leaves to the programmer into a compile-time check.
  - type: contributes_to
    target: concept.languages.python
    note: The reference Python implementation is written in C, and its C API and ctypes module are how Python programs reach native libraries at all.
sources:
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - definition
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
      - intuition
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.rust.book
    title: The Rust Programming Language
    url: https://doc.rust-lang.org/book/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: ISO/IEC 9899 (the C standard)
    reason: The normative text is what actually defines the abstract machine and the behaviour categories; the registry has only cppreference, a community secondary reference, so clause-level claims here rest on that rather than on the standard itself.
    sections:
      - definition
      - formal-treatment
      - assumptions-and-requirements
  - label: The Development of the C Language (Dennis Ritchie)
    reason: No registry source documents C's origin at Bell Labs, its descent from B and BCPL, or the role of the Kernighan and Ritchie book as a de facto specification.
    sections:
      - history-and-attribution
---

## Definition

**C** is a small, statically typed, imperative programming language standardised
as ISO/IEC 9899 and defined in terms of an _abstract machine_: a conforming
implementation must reproduce that machine's observable behaviour and is
otherwise free. Objects have an explicit type, size, alignment and storage
duration; heap memory is requested and released explicitly; pointers are ordinary
values that can be formed, compared, offset and dereferenced.

What C omits is as characteristic: no garbage collector, no bounds checking, no
exceptions, no generics, no destructors, no runtime beyond a startup stub.

## Why it matters

C is the substrate. The Linux, Windows and BSD kernels are C, as is the C library
every process on them links against, as are CPython, SQLite and OpenSSL. An
operating systems course teaches in C because address spaces, stacks and
allocators are things C lets you name directly.

The second reason is the ABI. Unix was written in C, so the platform's calling
convention and struct layout were defined so that C could express them, and any
function whose interface is describable in C is callable from anything — Python's
`ctypes`, Rust's `extern "C"`, Go's cgo, Java's JNI and Julia's `ccall` all
converge on it. Strictly they bind to the platform ABI, not to C; C is just the
language whose declarations describe it.

## Intuition

The picture to carry is a flat array of bytes with names attached: a variable is
a _place_, `&x` is that place's address, a pointer is a value you can do
arithmetic on, and a type says how wide an object is and how to read its bits.

Where that picture breaks is the important part. The standard describes an
abstract machine, not your CPU, and the compiler need only preserve _observable_
behaviour: under optimisation a loop may vanish, a redundant null check may
vanish, a signed counter may be assumed never to wrap. C is not portable
assembly. Assembly has nothing like C's undefined behaviour as a tool of
optimisation: a chip may leave a few flag results or encodings unspecified, but
no translation step reasons backwards from those to delete code you wrote,
whereas C has a large class of constructs on which the standard imposes nothing
at all — and a compiler that exploits them.

## Concrete example

```c
#include <stdio.h>
#include <stdlib.h>

static int sum(const int *values, size_t n) {  /* an array arrives as a pointer */
    int total = 0;
    for (size_t i = 0; i < n; i++) total += values[i];
    return total;
}

int main(void) {
    int fixed[4] = {1, 2, 3, 4};
    printf("%zu %zu\n", sizeof fixed, sizeof &fixed[0]);  /* 16 8 on a 64-bit host */
    printf("%d\n", sum(fixed, 4));                        /* 10 */

    int *heap = malloc(4 * sizeof *heap);
    if (heap == NULL) return 1;
    for (size_t i = 0; i < 4; i++) heap[i] = (int)(i + 1);
    printf("%d\n", sum(heap, 4));                         /* 10 */

    free(heap);
    return 0;
}
```

`sizeof fixed` is 16 because `fixed` really is an array of four four-byte
objects, while `sizeof &fixed[0]` is a pointer's size — and inside `sum`,
`sizeof values` is a pointer's size too, because the array _decayed_:
`sum(fixed, 4)` passed `&fixed[0]` and the length was lost, which is why `n` is a
separate argument. Stack and heap arrays are then consumed through the same
pointer type. `malloc` can fail, and `free` is the programmer's job: omit it and
the block leaks, call it twice and the program is undefined.

## Formal treatment

The standard sorts program behaviour into categories, and the distinctions are
where most misunderstanding lives. **Implementation-defined** behaviour is chosen
by the implementation, which must document the choice: the width of `int`,
whether plain `char` is signed. **Unspecified** behaviour is chosen from a
permitted set with no obligation to document it, such as the order in which
function arguments are evaluated. **Undefined** behaviour is different in kind:
the standard imposes _no requirements whatsoever_.

Undefined behaviour is therefore not a diagnostic. It is a precondition the
optimiser is entitled to assume holds, and that assumption propagates both
forwards and backwards through the program. Two cases account for most of the
surprises. Signed integer overflow is undefined, so a compiler may conclude that
`a + 1 > a` is always true, that `if (a + 100 < a)` is dead code, and that
`for (int i = 0; i <= n; i++)` never wraps — deleting the overflow check you
wrote to guard against exactly this. The _strict aliasing_ rule says an object's
stored value may be read only through an lvalue of a compatible type (character
types excepted), so writing through a `float *` and reading through an `int *` is
undefined and the compiler may keep a stale value in a register; the supported
way to reinterpret bytes is `memcpy`, or a union, which C permits and C++ does
not.

Pointer arithmetic is defined only within a single object and one position past
its end; forming a pointer outside that range is undefined even if you never
dereference it. Array-to-pointer conversion turns an expression of type "array of
`T`" into a pointer to its first element, except as the operand of `sizeof`,
`_Alignof` or unary `&`. Because indexing is _defined_ as that addition,

$$
a[i] \;\equiv\; *(a + i) \;\equiv\; *(i + a) \;\equiv\; i[a],
$$

so `3["abcd"]` is legal C — a fact about the language definition, not a compiler
quirk.

## Assumptions and requirements

C's guarantees are weaker than the platform you test on. `sizeof(char)` is 1 by
definition, but a byte need not be 8 bits; `int` is only guaranteed 16 bits;
plain `char` may be signed or unsigned; structs may carry padding, so `memcmp` is
the wrong way to compare them. C23 mandates two's complement representation for
signed integers — but representation and arithmetic are separate questions, and
signed overflow remains undefined there too.

A _hosted_ implementation supplies `main` and the full library; a _freestanding_
one, used in kernels and on microcontrollers, supplies far less, and code
assuming a hosted environment will not build. C acquired a memory model for
threads only in C11; before that, multithreading rested on platform guarantees
such as POSIX threads.

## Uses and applicability

Reach for C when the code must know where the bytes are: a kernel, a driver, an
allocator, a language runtime, firmware on a microcontroller. Reach for it when
you need an interface every other language can call — which is why numerical and
cryptographic libraries expose a C surface even when their internals are not C —
and when the only toolchain for your target is a C compiler.

Do not reach for C because it is "fast": optimising compilers for C++, Rust and
Fortran generate comparable code, and on application logic the gap is usually
smaller than the cost of the memory-safety bugs. Avoid it for generic containers,
and for parsing untrusted input in a process that matters.

## Limitations and common mistakes

The costly misconception is the one above: that C is a thin notation for machine
instructions, so undefined behaviour means "whatever the hardware does". On x86 a
signed addition wraps — but the compiler never emitted the addition, having
reasoned the overflowing path unreachable and deleted the branch guarding it. The
same reasoning removes a null check placed _after_ a dereference, since the
dereference already proved the pointer non-null.

Below that sit the classical memory errors: reading past a buffer, using a
pointer after `free`, freeing twice, never freeing. The library helps less than
it looks — `gets` was removed in C11 because it cannot be used safely, and
`strncpy` does not always terminate its result.

Type-level traps recur. A signed/unsigned comparison converts the signed operand,
so `-1 < 1u` is false; integer promotions widen small types to `int` before
arithmetic; and `extern char buf[];` in one file against `char *buf;` in another
is undefined, because an array and a pointer are different objects that share a
syntax. The mitigations — `-Wall -Wextra`, UndefinedBehaviorSanitizer,
AddressSanitizer, Valgrind — work well in practice but are testing tools: they
find undefined behaviour on the paths you exercise and do not prove its absence.

## Variants and alternatives

The standard revisions are the first axis. K&R C is the pre-standard language of
the 1978 book; ANSI C89, adopted as ISO C90, added prototypes and the standard
library; C99 added `//` comments, `inline`, `restrict`, `<stdint.h>` and
variable-length arrays; C11 added threads, atomics and `_Generic` and made
variable-length arrays optional; C17 was a defect-fix release; C23 added
`nullptr`, `constexpr`, `typeof` and real `bool` keywords. Dialects matter too:
GNU C — statement expressions, `__attribute__`, computed `goto` — is what the
Linux kernel is written in, not ISO C, and MISRA C is a restricted subset for
safety-critical work.

Among competing languages, C++ buys destructors, templates and containers at the
cost of a far larger language; Rust buys compile-time memory and data-race safety
through ownership and borrowing, at the cost of a learning curve and a checker
that sometimes rejects correct programs; Zig offers explicit allocators and
compile-time execution but is pre-1.0. CompCert answers differently: a C compiler
whose optimisations are proved correct.

## History and attribution

Dennis Ritchie developed C at Bell Labs in the early 1970s out of Ken Thompson's
B, itself a descendant of Martin Richards's BCPL. The concrete problem was B
itself: its single word-oriented type fitted the byte-addressed PDP-11 badly, and
it lacked the character, floating-point and structure types needed to write the
Unix kernel and file system in a higher-level language — which is what C added.
Portability to other hardware became a goal only later, with the Interdata 8/32
port of 1977-78. Kernighan and Ritchie's _The C Programming Language_ (1978) was
the de facto specification for a decade before the ANSI committee produced C89 in
1989, adopted internationally as C90. A committee has governed the language since, which is why its revisions
are conservative.

## Sources

cppreference is the practical reference for the language itself: the behaviour
categories, strict aliasing, array-to-pointer conversion, and which feature
arrived in which revision. _Operating Systems: Three Easy Pieces_ shows C's
systems role rather than asserting it, and its memory-API material is a catalogue
of the allocation and pointer errors above. The Python documentation's C API and
`ctypes` chapters are the evidence for the foreign-function claim; the Rust book
states what ownership buys over manual allocation, and what it costs.

## Prerequisites and next connections

You need little before C: the imperative style, and what a stack, a heap and an
address are. What C makes possible is implementation —
[Core Data Structures](./core-data-structures.md) reads differently once you have
written a linked list whose nodes you must free yourself.

From here the next steps are the languages that answered C's problems
differently, and the tooling that tries to make C trustworthy: [Coq](./coq.md) is
the proof assistant in which CompCert's correctness is machine-checked.
