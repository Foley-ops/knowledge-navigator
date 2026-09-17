---
concept_id: concept.languages.python
title: Python
slug: /concepts/python
kind: tool
tier: 1
review_state: generated-draft
summary: A dynamically typed, garbage-collected, multi-paradigm language whose place in machine learning rests not on the speed of its interpreter but on how comfortably it drives compiled numerical libraries written in C, C++, Fortran and CUDA.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: implements
    target: concept.paradigms.imperative_programming
    note: Python's default mode is a sequence of statements mutating bindings and objects in place, with explicit control flow and no restriction on side effects.
  - type: implements
    target: concept.paradigms.object_oriented_programming
    note: Every value is an object with a class, attribute lookup runs through the descriptor protocol and a C3-linearised method resolution order, and operators are dispatched to special methods on the receiver.
  - type: contrasts_with
    target: concept.languages.c_language
    note: The two sit on opposite sides of the same programs — Python trades C's static types, manual memory management and ahead-of-time compilation for run-time flexibility, and then calls into C for the arithmetic it cannot afford to do itself.
  - type: contributes_to
    target: concept.paradigms.array_programming
    note: NumPy made Python the most common host language for whole-array operations, so most array-programming code written today is written in Python syntax even though the arithmetic happens in compiled kernels.
sources:
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.pytorch.documentation
    title: PyTorch documentation
    url: https://pytorch.org/docs/stable/index.html
    source_kind: reference-documentation
    supports:
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.julia.documentation
    title: The Julia Language documentation
    url: https://docs.julialang.org/en/v1/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Measured evidence for Python's share of machine learning and scientific computing work
    reason: The registry has no usage survey or download-statistics source, so the claim that Python dominates this work is argued from the composition of the tooling rather than from a citable measurement.
    sections:
      - why-it-matters
claims: []
---

## Definition

**Python** is a general-purpose programming language with dynamic typing, automatic
memory management, and first-class support for imperative, object-oriented and
functional styles. Types belong to values, not to names: a name is an untyped binding
that may refer to an integer now and a function later, and every operation is resolved
against the object it is handed at the moment it runs. The behaviour people mean by
"Python" is usually that of **CPython**, the reference implementation, which compiles
source to bytecode and runs it on a stack-based virtual machine.

## Why it matters

Python is slow at arithmetic it performs itself. An interpreted scalar loop costs
something like one to two orders of magnitude more than the equivalent C loop — a
rule of thumb that varies enormously with the workload, not a law. Python's position
in numerical computing comes not from closing that gap but from making it irrelevant.
NumPy, SciPy, scikit-learn, PyTorch and JAX are thin Python surfaces over kernels
compiled from C, C++, Fortran and CUDA. The Python program decides _what_ to compute;
compiled code computes it, in units large enough that per-call interpreter overhead
vanishes into the noise.

So "Python is slow" is an imprecise complaint: what matters is the fraction of
wall-clock time spent inside the interpreter, and in a well-written training loop it
is small.

## Intuition

A numerical Python program is a script for a stage crew: it says "multiply these two
$4096 \times 4096$ matrices" and something else does the work, and it can afford to be
slow because its instructions are coarse. The analogy fails the moment the work gets
fine-grained — a Python loop over a million floats makes the interpreter the stage
crew, and it is a poor one.

For the type system, the picture is that Python asks an object what it can do rather
than what it is. A function that calls `len(x)` and iterates over `x` works on lists,
tuples, strings, dicts and anything else implementing `__len__` and `__iter__`.
That is **duck typing**: compatibility is a matter of supported operations, discovered
at the moment of use, not of declared ancestry.

## Concrete example

Annotations and duck typing in one function (run under CPython 3.14):

```python
from typing import Iterable

def total(xs: Iterable[float]) -> float:
    return sum(xs)

total([1.5, 2.5])      # 4.0
total({1, 2, 3})       # 6  — a set is iterable, so this works
total.__annotations__  # {'xs': typing.Iterable[float], 'return': <class 'float'>}
total("ab")            # TypeError: unsupported operand type(s) for +: 'int' and 'str'
```

The set works because `sum` needs iteration and addition, not a list. The call returns
the integer `6` despite the `-> float` annotation and nothing objects: annotations are
recorded, not checked. The failure on `"ab"` comes from `sum` attempting `0 + 'a'` at
the point of the operation, not from the annotation — which a static checker would
have used to reject the call outright.

## Formal treatment

CPython compiles each module to a code object and evaluates its bytecode. Names resolve
through local, enclosing, global and builtin scopes in that order; attribute access
walks the type's C3-linearised method resolution order through the descriptor protocol.
Operators are syntax for special-method calls: `a + b` attempts `type(a).__add__`, then
the reflected `type(b).__radd__`.

The **global interpreter lock** (GIL) is a mutex a thread must hold to execute
bytecode. Its invariant: within one interpreter, at most one operating-system thread
executes Python bytecode at a time. What follows is narrower than usually assumed.

It does _not_ prevent concurrency: the lock is released around blocking I/O, so
threaded socket, file and `sleep` work overlaps normally. It does not prevent
parallelism inside extensions — NumPy, BLAS and compression libraries release the GIL
around long compute, so several threads can run real arithmetic at once — nor
multi-core use through `multiprocessing`, and since CPython 3.12 each subinterpreter
can hold its own GIL. It does _not_ make code thread-safe. On a binding the threads
share — a global, an attribute, a container element — `counter += 1` compiles to a
load, a binary operation and a store,

```text
LOAD_GLOBAL counter; LOAD_SMALL_INT 1; BINARY_OP 13 (+=); STORE_GLOBAL counter
```

and the interpreter may switch threads between bytecodes, so two increments can read
the same value and one update is lost. The sharing is what creates the race: the same
statement on a function-local compiles to `LOAD_FAST`/`STORE_FAST` and is safe,
because each call has its own frame. The default switch interval is 5 ms, readable
via `sys.getswitchinterval()`. Ordinary locking is still your job.

What it does prevent is pure-Python CPU-bound code scaling across cores with threads.
That constraint is now optional rather than intrinsic: PEP 703 specified a
free-threaded CPython, an experimental `--disable-gil` build shipped in 3.13, and in
3.14 that build became officially supported while remaining non-default
(`sys._is_gil_enabled()` reports which you are on). Free-threaded builds need
extensions rebuilt and marked compatible, and carry a single-threaded overhead that
has narrowed across releases without disappearing.

## Assumptions and requirements

The performance argument assumes work per Python-level call is large and the data
already lives in a compiled representation. A NumPy array of a million floats is one
object holding a contiguous buffer; a Python list of a million floats is a million
boxed objects, and crossing that boundary element by element costs more than the
arithmetic it saves.

Prompt destruction is a CPython detail, not a language guarantee. CPython reference-
counts and frees an object the moment its count hits zero, with a generational
collector for cycles; PyPy does not, so code relying on a file closing when a local
goes out of scope depends on an implementation — which is what `with` exists to avoid.

Extension modules assume a stable binary interface: a wheel built for one CPython
version generally will not load into another unless it was built against the limited
API and stable ABI, and the free-threaded build is a separate target again.

## Uses and applicability

Reach for Python when the expensive work belongs to somebody else's compiled code and
the valuable part is deciding what to run: machine learning research, data analysis,
scientific computing, automation, glue between systems, and prototyping where
iteration speed dominates. PyTorch is the canonical shape of this — Python defines the
model and the loop, and every tensor operation dispatches to a compiled kernel.

Do not reach for it when latency is hard-bounded, when memory per object is tight,
when the numerical work is genuinely sequential and element-wise, or when deployment
is somewhere an interpreter and its wheels cannot go.

## Limitations and common mistakes

The most consequential misunderstanding is that annotations do something at run time.
They are metadata; enforcement comes from an external checker such as mypy or pyright,
or from libraries like pydantic that choose to read annotations and validate. Gradual
typing in Python is a discipline, not a guarantee.

Two opposite errors about the GIL are both common: that it makes concurrent code safe,
and that it makes threads useless. Neither is true, for the reasons above.

Mutable default arguments bite everyone once: `def f(xs=[])` evaluates the list at
function definition, so it is shared across calls. And identity comparison appears to
work on small integers and short strings because they are interned, then quietly stops
working on larger values — compare with `==`.

The broadest mistake is micro-optimising interpreted code. Rewriting a hot Python loop
more cleverly buys a small constant; moving it into a vectorised call, Cython or a
compiled extension buys the order of magnitude.

## Variants and alternatives

CPython is one implementation among several. **PyPy** uses a tracing JIT and is
markedly faster on pure-Python workloads, at the cost of weaker C-extension
compatibility. **GraalPy** targets GraalVM, **Jython** and **IronPython** the JVM and
.NET, and **MicroPython** and **CircuitPython** microcontrollers with a reduced
standard library. Within CPython, the adaptive specialising interpreter added in 3.11
and the experimental copy-and-patch JIT added in 3.13 attack interpretation cost
directly.

Accelerators are a different axis: **Cython** compiles annotated Python to C, **Numba**
JIT-compiles a numeric subset, **Nuitka** and **mypyc** compile ahead of time. Among
competing languages **Julia** is the most direct answer to Python's weakness —
JIT-compiled with multiple dispatch, designed so library and user code can be the same
language at the same speed, bought with a smaller ecosystem and compile latency on
first call. C++ and Rust occupy the layer beneath Python rather than replacing it.

## History and attribution

Guido van Rossum began Python at CWI in Amsterdam in December 1989. He wanted a
scripting language with the better properties of ABC, a teaching language he had
worked on there, for administration work around the Amoeba distributed operating
system; the first public release came in 1991. He led the project as "benevolent
dictator for life" until he stepped down in July 2018; after a vote on competing
governance proposals, the first elected steering council took over in February 2019. Python 3, released in 2008, deliberately broke compatibility
with Python 2, and the migration took more than a decade — Python 2 support ended in 2020. Annotation syntax arrived in 3.0 with no semantics attached; the `typing`
vocabulary that gave it meaning followed in 3.5.

## Sources

The Python language reference and standard library documentation is the authority for
the data model, the execution model, the free-threading build, the alternate
implementations, the statement that annotations are not enforced, and the project's
own account of its origins. The PyTorch documentation shows the Python-as-front-end
arrangement in its most heavily used form. The Julia documentation is cited only for
the alternative it represents: the design that refuses the two-language split.

## Prerequisites and next connections

No page is a strict prerequisite; anyone who has written code can follow this one. It
helps to have met the imperative and object-oriented paradigms, since Python is a
plain instance of both, and array programming, the style in which fast Python is
written.

From here, [Complexity Analysis](./complexity-analysis.md) is the companion for
reasoning about where interpreter constant factors matter and where they do not, and
[Core Data Structures](./core-data-structures.md) explains what Python's built-in
list, dict and set cost. [Tensors](./tensors.md) describes the objects the numerical
libraries pass around — what a Python program here spends most of its time arranging.
