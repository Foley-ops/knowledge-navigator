---
concept_id: concept.languages.javascript
title: JavaScript
slug: /concepts/javascript
aliases:
  - ECMAScript
kind: tool
tier: 1
review_state: generated-draft
summary: The dynamically typed, prototype-based language standardised as ECMAScript, whose first-class functions and single-threaded event loop make it the default language of the browser and a common one on the server.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: implements
    target: concept.paradigms.object_oriented_programming
    note: JavaScript provides objects and inheritance by delegation along a prototype chain rather than by instantiating classes, and the `class` keyword is surface syntax over that same mechanism.
  - type: implements
    target: concept.paradigms.functional_programming
    note: Functions are ordinary values that close over their defining scope, so higher-order style is idiomatic, but the language enforces neither purity nor immutability.
  - type: implements
    target: concept.paradigms.imperative_programming
    note: The core of the language is statements that mutate bindings and objects in a defined order, and async/await exists precisely to keep asynchronous code looking imperative.
  - type: contrasts_with
    target: concept.languages.python
    note: Both are dynamically typed and garbage collected, but Python builds objects from classes and runs threads under a global lock, where JavaScript delegates to prototypes and runs one event loop with no shared mutable memory between workers.
sources:
  - source_id: source.mdn.javascript
    title: MDN Web Docs — JavaScript
    url: https://developer.mozilla.org/en-US/docs/Web/JavaScript
    source_kind: reference-documentation
    supports:
      - definition
      - intuition
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
      - why-it-matters
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.typescript.handbook
    title: The TypeScript Handbook
    url: https://www.typescriptlang.org/docs/handbook/intro.html
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.mitpress.sicp
    title: Structure and Interpretation of Computer Programs
    url: https://mitpress.mit.edu/9780262510875/structure-and-interpretation-of-computer-programs/
    source_kind: authoritative-secondary
    supports:
      - intuition
    checked_on: 2026-09-17
unresolved_references:
  - label: ECMA-262, the ECMAScript Language Specification, and the HTML Living Standard's event-loop section
    reason: The registry has no entry for either normative standard, so the precise wording of the abstract equality algorithm and of the task/microtask checkpoint is cited here only through MDN's reference documentation of them.
    sections:
      - formal-treatment
      - limitations-and-common-mistakes
claims: []
---

## Definition

**JavaScript** is a dynamically typed, garbage-collected language with first-class
functions, objects that inherit by delegation along a **prototype chain**, and a
concurrency model built on a single-threaded **event loop**. Its semantics are
standardised as **ECMAScript** (ECMA-262); "JavaScript" in practice means that
language plus whatever host objects the environment supplies — the DOM and
`fetch` in a browser, `fs` and streams in Node.js.

Values have types, variables do not. A binding can hold a number now and a
function later, and nothing is checked before execution: a mismatch either
coerces silently or throws when the offending operation is finally reached, so a
failure can surface far from the code that caused it.

## Why it matters

JavaScript is the only general-purpose language every web browser executes from
source, and the only one with direct access to the DOM, which makes it the
substrate for essentially all interactive user interfaces on the web, and — since
Node.js put the V8 engine on the server in 2009 — a mainstream choice for
back-end services and tooling as well.

Its technically interesting contribution is making event-driven concurrency the
default rather than an expert option. Operating-systems texts present
event-based concurrency as one design among several, chosen to avoid locks and
thread-stack overhead; JavaScript offers no alternative, so a generation of
I/O-bound network code is written with no mutexes and no data races on shared
memory — a real simplification bought with a real cost.

## Intuition

Three pictures carry most of the language.

**Objects are dictionaries with a fallback pointer.** Reading `o.x` looks in
`o`'s own properties; failing that, it follows `o`'s hidden link to another
object and looks there, and so on until the link is `null`. Inheritance is that
walk. There is no separate class metadata.

**Functions are values that remember where they were born.** A function closes
over the environment it was defined in, exactly as in the environment model of
evaluation that SICP develops for Scheme, which is why callbacks can carry state
without objects.

**The runtime is one worker with an in-tray.** The worker takes one job, runs it
to completion with no preemption, then takes the next. The analogy breaks in one
important place: there are _two_ in-trays with different rules, and that is what
async ordering actually depends on.

## Concrete example

```js
console.log('A'); // sync
setTimeout(() => console.log('B'), 0); // task (macrotask)
Promise.resolve().then(() => console.log('C')); // microtask
queueMicrotask(() => console.log('D')); // microtask
console.log('E'); // sync
// A E C D B
```

`B` is last despite a zero-millisecond delay: the whole script is one task, and
every queued microtask is drained before the next task starts. The same rule
explains `await`:

```js
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function main() {
  const t = Date.now();
  await sleep(50); // continuation resumes as a microtask
  console.log('resumed after', Date.now() - t, 'ms'); // about 50 or more
}
main();
console.log('runs before the await resumes');
```

And the prototype chain, shown without `class`:

```js
const animal = {
  speak() {
    return `${this.name} makes a sound`;
  },
};
const dog = Object.create(animal);
dog.name = 'Rex';
console.log(dog.speak()); // "Rex makes a sound"
console.log(Object.hasOwn(dog, 'speak')); // false — it came from animal
console.log(Object.getPrototypeOf(dog) === animal); // true
```

## Formal treatment

**Property lookup.** Every object has an internal slot `[[Prototype]]`, readable
with `Object.getPrototypeOf`. Getting property $p$ on object $o$ searches the
sequence $o, \pi(o), \pi^2(o), \dots$ where $\pi$ is the prototype link, and
returns the first own property named $p$; if the chain reaches `null` the result
is `undefined`, not an error. Assignment is not symmetric: `o.p = v` normally
creates an own property on $o$ and shadows the inherited one.

`new F(args)` creates an object whose `[[Prototype]]` is `F.prototype`, calls
`F` with `this` bound to it, and returns it unless `F` returns an object.
`class C extends B` sets `C.prototype`'s prototype to `B.prototype` and `C`'s
own prototype to `B`, so instance methods and static methods both inherit. Class
syntax is therefore not a different object model — but it is not pure sugar
either: class bodies are strict mode, a class constructor throws if called
without `new`, the binding is in a temporal dead zone before evaluation, and
private fields (`#x`) are a genuinely new mechanism with no prototype-based
equivalent.

**The event loop.** The runtime maintains one or more _task queues_ and a single
_microtask queue_. One turn is: take one task, run it to completion, then drain
the microtask queue to exhaustion — including microtasks enqueued during the
drain — then (in a browser) possibly render. Timer callbacks, I/O completions
and UI events are tasks; promise reactions, `queueMicrotask` and
`MutationObserver` callbacks are microtasks. Node.js adds a phase structure
(timers, poll, `setImmediate` checks, close callbacks) and a `process.nextTick`
queue drained ahead of promise reactions, but the task-then-drain rule is the
same.

**Numbers.** Every `number` is an IEEE-754 binary64 double, so integers are exact
only up to $2^{53}-1$ and `0.1 + 0.2 === 0.30000000000000004`. `BigInt`
(ES2020) provides arbitrary-precision integers, and does not mix with `number`
in arithmetic.

## Assumptions and requirements

The event loop assumes **no callback blocks**. Because a task runs to completion
without preemption, a synchronous 200 ms computation delays every pending timer,
every I/O callback and, in a browser, the next frame. Responsiveness is a
property of the code's discipline, not of the scheduler.

Parallelism requires giving up shared memory: Web Workers and Node's
`worker_threads` run separate event loops that communicate by structured-clone
message passing, with `SharedArrayBuffer` plus `Atomics` as the deliberate
exception.

Nothing assumes anything about types. Any object can be given any property at
any time, so guarantees a static type system would provide must come from tests,
from TypeScript, or from runtime validation at trust boundaries.

## Uses and applicability

Reach for JavaScript when the code must run in a browser — where its only
competitors compile to it or to WebAssembly — and for I/O-bound network
services, build tooling, and anything that shares code between client and
server.

Reach elsewhere for CPU-bound numerical work, for hard real-time or
memory-constrained systems, and for large codebases wanting types checked before
deployment — though that last case usually argues for TypeScript rather than for
leaving the ecosystem.

## Limitations and common mistakes

**`==` is the language's most widely criticised design decision.** It applies a
coercion algorithm before comparing, so `"" == 0`, `"1" == 1` and `[] == false` are all
true, while `null == 0` is false because `null` loosely equals only `undefined`.
These rules are fully specified and deterministic, not arbitrary — but they make
the result depend on operand types in ways nobody memorises, which is why style
guides mandate `===`. Related warts: `+` means
concatenation if either operand becomes a string, so `1 + "2" === "12"` while
`1 - "2" === -1`; `typeof null === "object"` is a preserved 1995 bug; and
`[10, 9, 1].sort()` returns `[1, 10, 9]` because the default comparator compares
string forms.

**"Single-threaded means slow" is wrong, and so is "async means parallel."**
Asynchrony here is interleaving, not simultaneity: two `await`ed fetches overlap
in the network, but your JavaScript never runs two functions at once.

**Blocking the loop is the characteristic production failure**, and it looks like
a mysterious latency spike rather than an error.

**Microtask starvation is real:** a microtask that schedules another microtask
forever will hang the page, because the drain has no budget, where an infinitely
self-rescheduling `setTimeout` will not.

`this` is determined by the call, not the definition — except in arrow
functions, which capture it lexically. That asymmetry confuses almost everyone
arriving from a class-based language.

## Variants and alternatives

**TypeScript** adds a structural static type system that erases at compile time;
it buys checkable interfaces and refactoring safety, and costs a build step and
types that describe rather than enforce runtime behaviour. **CoffeeScript** and **Dart** took
the compile-to-JS route earlier and never displaced it. **WebAssembly**
is the genuinely different alternative in the browser: a portable bytecode for
CPU-bound work, which cannot touch the DOM directly and so complements
JavaScript rather than replacing it. On the server the alternatives are ordinary
ones — Go, Python, Rust — chosen for concurrency model, typing or throughput.
Among runtimes, **Node.js**, **Deno** and **Bun** differ in module resolution,
permissions and bundled tooling, not in the language.

## History and attribution

Brendan Eich wrote the first version at Netscape in May 1995, under a mandate to
ship a scripting language for Navigator on a schedule measured in days; it was
called Mocha, then LiveScript, then renamed JavaScript for marketing reasons
unrelated to Java. Netscape submitted it to Ecma International, and ECMA-262
first edition appeared in 1997. An ambitious ES4 effort was abandoned in 2008;
ES5 (2009) consolidated, and ES2015 added classes, modules, promises,
`let`/`const` and arrow functions. Since then TC39 has published yearly editions
through a public staged proposal process.

## Sources

MDN Web Docs is the working reference for the language: property lookup and the
prototype chain, the event loop and microtask queue, equality and coercion, and
the historical notes above. Operating Systems: Three Easy Pieces
covers event-based concurrency as a design choice: why it avoids locks, and why
one blocking call ruins it. The TypeScript Handbook
documents the main typed variant and the runtime failures it exists to catch.
SICP is cited only for the environment model of closures that the intuition
section leans on.

## Prerequisites and next connections

Nothing here needs mathematics beyond arithmetic, but know what a hash map and a
dynamic array are before reading about objects and arrays, because that is what
they are: see [Core Data Structures](./core-data-structures.md). Judging whether
a callback will block the loop is a cost question, which makes
[Complexity Analysis](./complexity-analysis.md) the right companion.

From here the paradigm pages are the natural next step — JavaScript mixes
imperative, object-oriented and functional styles without committing to any —
and comparing it with Python, Go or Rust sharpens what the prototype model and
the event loop cost and buy.
