---
concept_id: concept.languages.go
title: Go
slug: /concepts/go
aliases:
  - golang
kind: tool
tier: 1
review_state: generated-draft
summary: A small statically typed, garbage-collected language from Google in which concurrency is expressed with goroutines and channels rather than threads and locks, and interfaces are satisfied structurally rather than by declaration.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: specializes
    target: concept.paradigms.imperative_programming
    note: Go is an ordinary statement-and-assignment imperative language with a specific, opinionated restriction of the paradigm — no inheritance, no exceptions, and concurrency as a first-class statement.
  - type: contrasts_with
    target: concept.languages.rust
    note: Both were designed to replace C++ for systems work, but Go buys memory safety with a garbage collector and a runtime while Rust buys it at compile time with ownership, and only Rust's type system rules out data races.
  - type: contrasts_with
    target: concept.languages.c_language
    note: Go keeps C's syntax family, value semantics and static compilation to a native binary, and drops manual memory management, the preprocessor, undefined behaviour on out-of-range access, and C's separate-compilation model.
  - type: contrasts_with
    target: concept.paradigms.object_oriented_programming
    note: Go has methods and interfaces but no classes, no inheritance and no subtype declarations, so polymorphism is structural and composition through embedding replaces the class hierarchy.
sources:
  - source_id: source.go.documentation
    title: The Go Programming Language documentation
    url: https://go.dev/doc/
    source_kind: reference-documentation
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.ostep.operating_systems
    title: 'Operating Systems: Three Easy Pieces'
    url: https://pages.cs.wisc.edu/~remzi/OSTEP/
    source_kind: authoritative-secondary
    supports:
      - intuition
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.rust.book
    title: The Rust Programming Language
    url: https://doc.rust-lang.org/book/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.typescript.handbook
    title: The TypeScript Handbook
    url: https://www.typescriptlang.org/docs/handbook/intro.html
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Hoare, Communicating Sequential Processes (1978)
    reason: The page attributes Go's channel-and-select design to CSP. The Go FAQ states that lineage, but the registry has no entry for Hoare's original paper, so the primary source for CSP itself is uncited.
    sections:
      - history-and-attribution
  - label: The Go runtime scheduler design (the G-M-P model and work stealing)
    reason: The claim that goroutines are multiplexed onto OS threads is in the Go FAQ, but the internal structure of the scheduler lives in runtime design documents and source comments that the registry does not list.
    sections:
      - formal-treatment
      - intuition
claims: []
---

## Definition

**Go** is a compiled, statically typed, garbage-collected language with a
runtime that schedules the program's own lightweight threads. It is
deliberately small: 25 keywords, no classes, no inheritance, no exceptions, no
operator overloading, and, until 2022, no generics. Three features carry its
identity — **goroutines**, functions launched with the `go` statement and
multiplexed onto operating-system threads by the runtime scheduler;
**channels**, typed queues that both pass values between goroutines and
synchronise them; and **interfaces**, which a type satisfies by having the right
methods, with no declaration of intent anywhere.

## Why it matters

Go attacks an engineering problem, not a language-research one: large server
programs that had become slow to build and hard to read. Compilation is fast,
there is no header-file system to expand, and the output is a single statically
linked binary — which is why much of the current infrastructure layer (Docker,
Kubernetes, etcd, Terraform, Prometheus) is written in it.

The deeper bet is concurrency. A server written as ten thousand blocking threads
reads naturally and runs ruinously; written as callbacks it reads badly.
Goroutines keep the blocking style at kilobytes per task instead of a
megabyte-scale thread stack, so "one goroutine per connection" is a real design.

## Intuition

A goroutine is a thread whose scheduler lives inside your process. The operating
system sees only a handful of threads — roughly one per core; the Go runtime
parks and resumes goroutines on top of them whenever one blocks on a channel, a
lock or a network read. Switching is a few register saves in user space, and a
stack starts tiny and grows by copying, so the arithmetic that makes OS threads
expensive stops applying.

A channel is a conveyor belt with a handoff discipline: unbuffered, the sender
waits until a receiver is there and the two meet; with capacity $C$, the sender
may run $C$ items ahead. The documentation's slogan is "do not communicate by
sharing memory; instead, share memory by communicating". The analogy breaks
where the language stops enforcing it: nothing stops you sending a pointer and
then writing through your own copy.

## Concrete example

A worker pool: three goroutines square numbers off one channel and write results
to another.

```go
package main

import (
	"fmt"
	"sync"
)

func worker(jobs <-chan int, out chan<- int, wg *sync.WaitGroup) {
	defer wg.Done()
	for n := range jobs { // ends when jobs is closed and drained
		out <- n * n
	}
}

func main() {
	jobs := make(chan int, 8)
	out := make(chan int, 8)
	var wg sync.WaitGroup

	for i := 0; i < 3; i++ {
		wg.Add(1)
		go worker(jobs, out, &wg)
	}
	for n := 1; n <= 5; n++ {
		jobs <- n
	}
	close(jobs)                           // tells every worker to stop
	go func() { wg.Wait(); close(out) }() // close out once no one will send

	sum := 0
	for v := range out {
		sum += v
	}
	fmt.Println(sum) // 55
}
```

It prints $1 + 4 + 9 + 16 + 25 = 55$, though the order the squares arrive in is
undetermined. The direction types are load-bearing: `<-chan int` is
receive-only, so the compiler rejects a worker that closes its input. The extra
goroutine exists because closing `out` is safe only once every sender has
finished — and only the `WaitGroup` knows when that is.

## Formal treatment

The `go` statement evaluates the function and its arguments in the calling
goroutine, then runs the call in a new one; the caller does not wait and gets no
handle back. `GOMAXPROCS` bounds how many goroutines may execute Go code
simultaneously, defaulting to the number of usable CPUs.

Channel semantics are fixed by the Go memory model's happens-before relation
$\prec$. For a channel of capacity $C$, with $s_k$ the $k$-th send and $r_k$ the
$k$-th receive:

$$
s_k \;\prec\; \text{completion of } r_k,
\qquad
r_k \;\prec\; \text{completion of } s_{k+C}.
$$

With $C = 0$ the second rule reads $r_k \prec$ completion of $s_k$: a receive on
an unbuffered channel happens before the matching send completes — the
rendezvous. Closing a channel happens before a receive that returns the zero
value because of the close; sending on a closed channel panics, as does closing
it twice, and a `nil` channel blocks forever.

`select` waits until one of its cases can proceed and executes exactly that one,
choosing uniformly at pseudo-random among ready cases so that none starves; a
`default` case makes the statement non-blocking.

Interface satisfaction is a subset test on method sets: $T$ implements $I$ when
the method set of $T$ contains every method of $I$ with a matching signature.
The method set of `*T` holds methods declared with receiver `T` or `*T`, that of
`T` only those with receiver `T`. Type parameters, added in Go 1.18, constrain
by interfaces read as type sets — `func Map[T, U any](xs []T, f func(T) U) []U`
is legal — and methods may not take type parameters of their own.

## Assumptions and requirements

Go assumes you can afford a runtime. Every binary links the collector and the
scheduler, so the language is a poor fit where a GC is unacceptable: hard
real-time deadlines, interrupt handlers, kernels. Typical pauses from the
concurrent, non-generational, non-moving collector are well under a
millisecond — an engineering result about the current implementation, not a
bound the language guarantees.

The channel discipline assumes you actually transfer ownership: the
happens-before edges cover the value sent and everything the sender wrote
beforehand, and nothing about memory the sender keeps touching. Cancellation is
yours to plumb, since a goroutine cannot be killed from outside. And the tooling
assumes execution: the race detector (`go test -race`) reports races on
interleavings that actually occurred, so a clean run is evidence, not proof.

## Uses and applicability

Reach for Go when the work is concurrent network I/O — HTTP and RPC services,
proxies, schedulers, control planes — when you want one dependency-free binary
to deploy, or when a large team needs code a new member can read on the first
day; that `gofmt` has no options is part of the same bargain. Reach elsewhere
for heavy numerical work (no operator overloading, no SIMD in the language),
when the type system is meant to carry the design, or when a GC pause would be a
correctness failure.

## Limitations and common mistakes

**Channels do not prevent data races.** Go has no ownership system: two
goroutines may hold pointers to the same struct and write it concurrently. The
memory model does not define the outcome, but it does constrain it: an
implementation may report the race and halt, and otherwise a read of a
word-sized or smaller location must observe some value actually written there,
with no acausal or out-of-thin-air results — the meaning of a racy program is
not simply anything at all, as it is in C. Races on multi-word values
(interfaces, slices, maps) can still corrupt program state, and are caught, if
you are lucky, by the race detector or by the runtime's check for concurrent map
writes. Channels give you a discipline and the happens-before edges to make it
sound; they do not enforce it.

**A nil pointer in an interface is not a nil interface.** An interface value is
a (type, value) pair, so returning a nil `*MyError` as an `error` yields a
non-nil `error` and `if err != nil` fires on a success path — the most common
bug in code that defines its own error type.

**Goroutines leak.** A send with no receiver, or a receive on a channel nobody
closes, blocks forever and holds its stack. The runtime's "all goroutines are
asleep — deadlock!" panic fires only when _every_ goroutine is blocked, so a
server with a live listener never sees it and simply grows.

On error handling both sides are fair. Errors are ordinary values, and
`if err != nil { return ..., err }` really is a large share of I/O-heavy code:
noisy, and easy to write without adding context. Against that, every failure
edge is visible at the call site with no invisible unwinding, and
`fmt.Errorf("...: %w", err)` with `errors.Is` and `errors.As` (Go 1.13)
recovered most of what exception chaining offered. A `try` builtin was proposed
in 2019 and declined, and no syntax change has been adopted since: a live
disagreement, not a settled question.

One trap is fixed: capturing the loop variable in a goroutine shared one
variable across iterations until Go 1.22 scoped it per iteration.

## Variants and alternatives

Inside Go, channels are not the only tool: `sync.Mutex` and `sync/atomic` are
idiomatic for simple shared state and usually faster than routing it through a
channel, and the documentation says to use whichever is clearer. TinyGo is an
alternative implementation for microcontrollers and WebAssembly, with a much
smaller runtime and a language subset.

Elsewhere, Rust rejects the same C++ complexity with no GC, and its ownership
and `Send`/`Sync` rules make data-race freedom a compile-time property rather
than a convention, at a steeper learning curve. Java's virtual threads (final in
Java 21) give an M:N model close to goroutines. C# and JavaScript use
`async`/`await`, which makes suspension visible in every function's type and
splits libraries into coloured and uncoloured halves; Go's uniform blocking
calls are the direct alternative. Structural interfaces are not unique either:
TypeScript's type system is structural throughout, trading declared intent for
flexibility the same way.

## History and attribution

Go began at Google in September 2007, sketched by Robert Griesemer, Rob Pike and
Ken Thompson out of frustration with build times, dependency sprawl and C++
complexity at Google's scale. It was announced and open-sourced in November
2009; Go 1 shipped in March 2012 with a compatibility promise that has largely
held.

The concurrency design descends from Hoare's Communicating Sequential Processes
and, more directly, from the earlier Bell Labs languages Newsqueak, Alef and
Limbo, so channels and `select` arrived with three decades of prior use behind
them. Modules arrived as an experimental alternative to `GOPATH` in Go 1.11
(2018) and became the default build mode in Go 1.16 (2021); type parameters
landed in Go 1.18 (2022), designed by Ian Lance Taylor and Robert Griesemer
after a decade in which several generics proposals were rejected as not worth
their complexity.

## Sources

The Go documentation hub is the authority for everything language-specific here:
the specification for `go`, `select` and interface satisfaction, the memory
model for the happens-before rules, Effective Go for idiom, the FAQ for design
rationale and history, the release notes for the 1.18 and 1.22 changes.
_Operating Systems: Three Easy Pieces_ supplies the background it assumes: what
a thread costs and what a data race is. _The Rust Programming Language_ and _The
TypeScript Handbook_ are cited only for the alternatives they represent.

## Prerequisites and next connections

No page here is required first: anyone who has written imperative code can
follow this one. Knowing what an operating-system thread costs makes the
case for goroutines land, and [Core Data Structures](./core-data-structures.md)
covers the queues and hash maps Go exposes as channels, slices and maps. From
here, the useful comparisons are the other languages in this category: C for
what Go kept and dropped, Rust for the other answer to memory safety, Python for
the contrast with a runtime that does not multiplex real parallelism. Whether a
worker pool helps at all is a question for
[Complexity Analysis](./complexity-analysis.md).
