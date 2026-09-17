---
concept_id: concept.paradigms.object_oriented_programming
title: Object-Oriented Programming
slug: /concepts/object-oriented-programming
aliases:
  - OOP
kind: concept
tier: 1
review_state: generated-draft
summary: A way of structuring programs around objects that own state and expose operations over it, where the receiver of a call selects the code that runs.
categories:
  - Programming/Languages/Paradigms
primary_category: Programming/Languages/Paradigms
relationships:
  - type: specializes
    target: concept.paradigms.imperative_programming
    note: Mainstream object-oriented code is imperative code with a discipline imposed on it — mutable state is partitioned into objects and procedures acquire a privileged receiver argument.
  - type: contrasts_with
    target: concept.paradigms.functional_programming
    note: 'Both answer the question of where state and behaviour live, and they answer it oppositely: objects bind them together and mutate in place, while functional code separates them and prefers values that do not change.'
  - type: contributes_to
    target: concept.languages.cpp
    note: C++ began as an attempt to carry Simula's class and virtual-function machinery into a language with C's performance, so this paradigm is a direct input to that language's design.
  - type: contrasts_with
    target: concept.languages.rust
    note: Rust deliberately provides dynamic dispatch and substitutability through traits while omitting implementation inheritance entirely, which isolates which parts of the paradigm are load-bearing.
sources:
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.mitpress.sicp
    title: Structure and Interpretation of Computer Programs
    url: https://mitpress.mit.edu/9780262510875/structure-and-interpretation-of-computer-programs/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - intuition
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.fowler.refactoring_catalog
    title: Martin Fowler — Refactoring and design catalogue
    url: https://martinfowler.com/
    source_kind: authoritative-secondary
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Liskov's substitution formulation and the Liskov–Wing theory of behavioural subtyping
    reason: The registry carries no source for Liskov's 1987 keynote on data abstraction and hierarchy or for the 1994 Liskov and Wing paper that gives the pre/postcondition and history constraints, so the precise statement of the principle and its constraint rules are written here from general knowledge and should be checked against those papers before this page leaves generated-draft.
    sections:
      - formal-treatment
      - assumptions-and-requirements
  - label: Alan Kay on message passing, and the Simula and Smalltalk record
    reason: No registered source covers the history of the paradigm — not Dahl and Nygaard on Simula 67, not Kay's account of the early history of Smalltalk, and not his later remarks that he did not have C++ in mind — so the attributions and the characterisation of his conception are uncited here.
    sections:
      - definition
      - history-and-attribution
      - limitations-and-common-mistakes
  - label: The origin of "favour composition over inheritance" and of the fragile base class problem
    reason: The maxim comes from the 1994 design-patterns literature and the fragile base class problem from the module-systems literature, neither of which is in the registry; Fowler's catalogue supports the refactoring that carries out the move but not its attribution.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Object-oriented programming** structures a program around _objects_: values
that own state and expose a fixed set of operations over it, where the operation
a call runs is selected at run time from the receiver's own type rather than
decided at the call site. Four mechanisms are named together — encapsulation
(state reachable only through the object's operations), inheritance (a class
defined as a modification of another), subtype polymorphism (a subtype value
accepted wherever the supertype is expected) and dynamic dispatch (the receiver
chooses the implementation) — but which of them are essential is exactly what is
disputed. On one common reading the last two carry most of the weight, since
languages that dispatch and substitute with no inheritance at all are still
object-oriented; Alan Kay's own conception instead centres message passing and
state locally retained and protected. No definition settling the question has
ever been agreed.

## Why it matters

The concrete thing the paradigm buys is that a conditional over kinds becomes a
lookup nobody maintains. Otherwise code handling several sorts of thing grows a
`switch` at every site that touches them, and each new sort means finding all of
those sites. With dispatch, a new device driver or image codec is a new class and
the call sites do not change. The second thing is that an invariant gets a home:
if a tree must stay balanced, the object owning the pointers is the one place
that rule can be enforced.

Both benefits point one way. Adding a kind is cheap, adding an operation is
expensive, since every existing class must then implement it. That asymmetry is
the expression problem, and it is why paradigms honestly disagree.

## Intuition

The picture to carry is mechanical. An object is a record of fields plus a
pointer to a table of functions, each receiving the record as an extra first
argument; a call indexes the table and passes the receiver. SICP builds the same
thing from procedures: something that closes over local state and dispatches on
the symbol it is sent is already an object, and message passing names exactly
that.

The closure analogy breaks at inheritance. When a method defined in a base class
calls another method on itself, that inner call goes through the same run-time
lookup, so a subclass can change the behaviour of code it never touched. This is
_open recursion_, which plain closures lack; it is what makes hook methods work,
and why a base class can break its subclasses by changing which of its own
methods it calls.

## Concrete example

```python
class Account:
    def __init__(self, balance=0):
        self._balance = balance          # convention, not enforcement

    def withdraw(self, amount):
        if amount > self.available():    # resolved against the runtime class
            raise ValueError("insufficient funds")
        self._balance -= amount
        return self._balance

    def available(self):
        return self._balance


class Overdraft(Account):
    def __init__(self, balance=0, limit=500):
        super().__init__(balance)
        self._limit = limit

    def available(self):
        return self._balance + self._limit


for account in (Account(100), Overdraft(100)):
    try:
        print(type(account).__name__, account.withdraw(300))
    except ValueError as error:
        print(type(account).__name__, error)
```

This prints `Account insufficient funds`, then `Overdraft -200`. `withdraw` is
written once, is never overridden, and behaves differently for the two objects
because `self.available()` is looked up on the receiver's class at the moment of
the call: open recursion in four lines. The encapsulation is weaker than it looks
— `_balance` is a convention Python does not enforce, and the double-underscore
form is merely mangled to `_Account__balance`.

## Formal treatment

Write $o : T$ for an object $o$ of type $T$, and $S <: T$ for "$S$ is a subtype of
$T$", meaning a value of $S$ may be used wherever a $T$ is expected. A call
$o.m(\bar{a})$ resolves $m$ against the run-time type of $o$ and invokes it with
the receiver bound to $o$.

The mechanism is concrete. In C++ a class with virtual functions gives each
object a hidden pointer to a per-class table of function addresses, so a virtual
call through a pointer or reference is one indirect call — constant time, not a
search — while non-virtual calls are resolved at compile time. Python instead
resolves attribute names along the method resolution order of the receiver's
class, a linearisation of the inheritance graph.

The Liskov substitution principle states the obligation that types do not
capture: if $\phi(x)$ is a property provable about objects $x$ of type $T$, then
$\phi(y)$ must hold for objects $y$ of type $S$ whenever $S <: T$. Made checkable
per method, with $\mathrm{pre}$ and $\mathrm{post}$ the pre- and postconditions,

$$
\mathrm{pre}_T(m) \Rightarrow \mathrm{pre}_S(m),
\qquad
\mathrm{post}_S(m) \Rightarrow \mathrm{post}_T(m) ,
$$

so an override may weaken a precondition but never strengthen it, and strengthen
a postcondition but never weaken it; supertype invariants must be preserved, and
history constraints forbid state changes the supertype's specification rules out.
Hence a mutable `Square` is no subtype of a mutable `Rectangle`: if `setWidth(w)`
promises the height unchanged, a square that adjusts its height breaks the
postcondition. Geometry is not the problem; mutation is.

## Assumptions and requirements

Dynamic dispatch requires the run-time type to survive to the call. In C++ the
method must be virtual and the call must go through a pointer or reference;
assigning a derived object to a base-typed variable copies only the base
subobject, so the wrong method runs and nothing is diagnosed.

Encapsulation requires enforcement or discipline — C++ access control is a
compile-time rule about names, not a guarantee about memory, and Python has none
at all — and substitution requires a specification, since the type checker
verifies that signatures conform and nothing verifies that behaviour does.
Inheritance additionally assumes the base class's self-calls are part of its
published contract: change which of its own methods a base calls internally and
subclasses that overrode them break without being edited.

## Uses and applicability

Reach for objects when the set of implementations behind one interface is open
and expected to grow — drivers, codecs, widgets, plugins, storage engines behind
one query interface — and when a mutable invariant needs somewhere to live.

Do not reach for it when the kinds are fixed and the operations keep arriving: a
compiler's syntax tree has perhaps twenty node kinds and dozens of passes, and
sum types with pattern matching put each pass in one file rather than scattering
it across twenty classes. Be careful, too, when memory layout is the performance
story, since an array of objects is laid out for the object rather than the loop
and a virtual call blocks inlining — a real but empirical cost that matters in
inner loops and rarely elsewhere.

## Limitations and common mistakes

The most common error is believing the paradigm means classes and inheritance.
Alan Kay, who coined "object-oriented", centred his conception on message
passing, on state locally retained and protected, and on extreme late binding —
objects as small independent computers exchanging messages — and later said
plainly that he did not have C++ in mind. The disagreement about what the term
denotes is genuine, not pedantry.

The second is inheritance used for reuse: subclassing to borrow methods asserts a
subtype relation the code does not honour, and that assertion is what breaks
later. "Favour composition over inheritance" is widely held and defensible advice
rather than a law — inheritance is right where substitutability genuinely holds
and the base was designed with hooks — and Fowler's catalogue carries the
mechanical escape, replacing inheritance with delegation.

Smaller ones: a getter and setter per field is not encapsulation, only public
state with more typing; classes holding data while the logic sits in a service
layer are Fowler's anaemic domain model, object-oriented in syntax and procedural
in fact; mutable objects used as dictionary keys break once mutated.

The serious criticisms hold. That the paradigm improves maintainability rests on
accumulated experience, not controlled evidence; large graphs of mutable objects
are hostile to concurrency; dynamic dispatch defeats static analysis. The
alternatives pay the expression problem from the other side, so the trade is real
and unsettled.

## Variants and alternatives

Class-based systems (C++, Java, Python) contrast with prototype-based ones, where
an object delegates to another object and classes are syntax over that
arrangement, as in JavaScript. Actor systems such as Erlang take Kay's reading
seriously: objects are concurrent processes with mailboxes and no shared state.
Multiple dispatch, in CLOS and Julia, selects the method from the run-time types
of all arguments, dissolving the awkwardness of binary operations that single
dispatch handles with the Visitor pattern.

Interface-only polymorphism drops implementation inheritance and keeps the rest:
Go's interfaces are satisfied structurally, with reuse through embedding, and
Rust's traits give static and dynamic dispatch with no hierarchy at all, buying
freedom from the fragile base class and paying in reuse ergonomics. The genuinely
different approaches are functional programming with algebraic data types and
pattern matching, which flips the expression problem; abstract data types in a
module system, which hide a representation with no dispatch; and data-oriented
design, which separates data from behaviour and lays it out for the machine.

## History and attribution

The machinery is Simula's. Simula 67, from Ole-Johan Dahl and Kristen Nygaard at
the Norwegian Computing Center, introduced classes, objects, subclasses and
virtual procedures, in order to write discrete-event simulations. Alan Kay coined
the phrase "object-oriented" in the late 1960s and led the Smalltalk work at
Xerox PARC through the 1970s, arriving from a different direction: cells,
messages and late binding rather than class hierarchies. Bjarne Stroustrup began
"C with Classes" at Bell Labs around 1979, wanting Simula's organisational power
at C's running cost, and it became C++. Barbara Liskov worked on data abstraction
and CLU in the 1970s; the substitution principle takes its name from her
formulation in a 1987 keynote, later developed with Jeannette Wing into a theory
of behavioural subtyping.

## Sources

The C and C++ reference is where to check what dynamic dispatch requires: virtual
functions, access control, and when a call is resolved at run time. The Python
documentation gives the other model — attribute lookup along a method resolution
order, and the explicit statement that its privacy is a convention. SICP is the
best account of the objects-as-closures picture and of dispatch tables built by
hand. Fowler's catalogue supplies the refactorings and the vocabulary behind the
mistakes section.

## Prerequisites and next connections

Read this once you can write and read imperative code: objects add dispatch and
encapsulation on top of mutable state and procedure calls. No mathematics is
needed.

It opens two directions. One is language-specific: the ideas look different in
C++, where dispatch is a table and its cost visible, in Python, where everything
is dynamic and nothing enforced, and in Rust and Go, which keep the polymorphism
and drop the hierarchy. The other is comparative — functional programming answers
the same question the other way round, and the expression problem, not taste, is
what separates them. For a worked case of an object owning an invariant, see
[Core Data Structures](./core-data-structures.md).
