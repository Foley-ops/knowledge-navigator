---
concept_id: concept.software.design_patterns
title: Design Patterns
slug: /concepts/design-patterns
aliases:
  - Gang of Four patterns
  - GoF patterns
kind: concept
tier: 1
review_state: generated-draft
summary: A catalogue of named solutions to recurring object-oriented design problems, valuable mostly for the shared vocabulary it gave programmers and criticised for encoding workarounds to missing language features.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: requires
    target: concept.paradigms.object_oriented_programming
    note: Every pattern in the canonical catalogue is stated in terms of classes, interfaces, inheritance and dynamic dispatch, so a reader who does not already have those mechanisms cannot read a pattern's structure at all.
  - type: contrasts_with
    target: concept.paradigms.functional_programming
    note: A substantial share of the catalogue dissolves when functions are values — Strategy becomes a function argument, Command a closure, Template Method a higher-order function — which makes the two a genuine comparison rather than a layering.
  - type: contributes_to
    target: concept.software.apis
    note: Pattern names became the working vocabulary for describing the shape of a library's surface, so adapter, facade, factory and observer appear in interface documentation as design terms rather than as implementation details.
  - type: contributes_to
    target: concept.software.testing
    note: The patterns that separate constructing a collaborator from using it are what let a test substitute a fake for the real thing, which is why the catalogue and automated unit testing spread through the same codebases.
sources:
  - source_id: source.fowler.refactoring_catalog
    title: Martin Fowler — Refactoring and design catalogue
    url: https://martinfowler.com/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
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
    checked_on: 2026-09-17
unresolved_references:
  - label: 'Gamma, Helm, Johnson and Vlissides, Design Patterns: Elements of Reusable Object-Oriented Software (1994)'
    reason: The book that defines the catalogue, its thirteen-field template and its twenty-three patterns is not in the source registry, so this page's account of the book's own structure rests on no cited source.
    sections:
      - definition
      - formal-treatment
      - history-and-attribution
  - label: Christopher Alexander's pattern language for architecture
    reason: The architectural origin of the pattern form — what a pattern language was generative of and who it was meant to empower — has no registry source, and the distinction matters to this page's history section.
    sections:
      - intuition
      - history-and-attribution
  - label: Controlled experiments on whether design patterns improve maintainability
    reason: No registry source covers the small empirical literature, so the page reports only that the evidence exists and is mixed rather than citing a result.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**Design patterns** are named, written-down solutions to design problems that
recur across object-oriented programs. Each is documented to a fixed template:
the problem, when it applies, the arrangement of classes and objects that
resolves it, and — the part most often skipped — the consequences of choosing
it. The canonical set is the twenty-three patterns published in 1994 by Erich
Gamma, Richard Helm, Ralph Johnson and John Vlissides, the "Gang of Four", in
five creational, seven structural and eleven behavioural groups. A pattern is
not code or a library but a shape code takes, described above the source and
below the architecture.

## Why it matters

The durable contribution is vocabulary. Before the catalogue, saying that a
subsystem should notify unknown listeners when its state changes took a
paragraph and a whiteboard; after it, one word, _observer_. That compression is
what survived; whether the class structures the book drew are good designs is a
separate and far more contested question.

The second contribution is that the book taught a generation to talk about
_consequences_: its template forces every pattern to list what it costs — extra
indirection, more classes, harder debugging — a discipline most design advice
lacks.

## Intuition

A pattern is what you notice on the third time. A spreadsheet recalculates when
a cell changes, a UI redraws when a model changes, a cache invalidates when a
record changes — the same arrangement wearing three sets of nouns. The catalogue
is the list of shapes other people already noticed, with names attached.

The analogy to architecture, where the idea came from, breaks in a specific
place. An architectural pattern language was meant to _generate_ whole buildings
by composition: patterns at the scale of a region link down to patterns at the
scale of a window seat, and following the links produces a coherent place. The
software catalogue is not a language in that sense — its patterns do not compose
into a program, and nothing says when you have enough of them. Using an index of
solutions as though it were generative does most of the damage done in its name.

## Concrete example

Strategy is the pattern to show: the clearest instance of the form and the
sharpest illustration of the criticism. Its intent is to make a family of
algorithms interchangeable at runtime. Written the book's way, in Python:

```python
class Discount:
    def apply(self, total: float) -> float:
        raise NotImplementedError

class NoDiscount(Discount):
    def apply(self, total: float) -> float:
        return total

class PercentOff(Discount):
    def __init__(self, pct: float) -> None:
        self.pct = pct
    def apply(self, total: float) -> float:
        return total * (1 - self.pct / 100)

def checkout(total: float, discount: Discount) -> float:
    return discount.apply(total)

print(checkout(80.0, PercentOff(25)))   # 60.0
print(checkout(80.0, NoDiscount()))     # 80.0
```

Three classes and an abstract base for one idea: the caller supplies the rule.
Where functions are values, the same program is

```python
def checkout(total: float, discount) -> float:
    return discount(total)

print(checkout(80.0, lambda t: t * 0.75))  # 60.0
print(checkout(80.0, lambda t: t))         # 80.0
```

The pattern has not been improved; it has vanished into the calling convention.
Python's own library does this everywhere — `sorted(["bb", "a", "ccc"],
key=len)` returns `['a', 'bb', 'ccc']`, and `key` is a strategy with the
ceremony removed.

## Formal treatment

Strip the class diagrams and most of the catalogue rests on one mechanism:
single dynamic dispatch. A call $o.m(x)$ selects its implementation by the
runtime type of $o$ alone — in C++, a lookup in the object's virtual table.
Writing $\mathrm{Impl}(T, m)$ for the body type $T$ supplies for message $m$,
dispatch computes $\mathrm{Impl}(\mathrm{typeof}(o), m)$, and every pattern that
"varies behaviour" arranges for $\mathrm{typeof}(o)$ to be what varies.

Strategy in these terms is a type-level encoding of a function. A family of
algorithms $\{a_1, \dots, a_n\}$ all of type $A \colon X \to Y$ becomes an
abstract class with one method, so an object of that type is an inhabitant of
$X \to Y$ carrying a vtable pointer. Where the language has first-class
functions the encoding is redundant, because $X \to Y$ is already a type; where
it does not, the encoding is the only way to write the type down. Command is the
same trick for a nullary application, Template Method takes the function as a
subclass-supplied hole, and Visitor simulates double dispatch
$\mathrm{Impl}(\mathrm{typeof}(o), \mathrm{typeof}(x), m)$ through two single
dispatches.

Above the individual patterns the book states two principles: program to an
interface rather than an implementation, and favour object composition over
class inheritance. Both say where variation should live, and both are more
useful than any pattern beneath them.

## Assumptions and requirements

The catalogue assumes subtype polymorphism, dynamic dispatch on a single
receiver, and class-based inheritance. Swap single dispatch for multiple
dispatch and Visitor stops being necessary; add first-class functions and
Strategy, Command and Template Method collapse; add a macro system and the
boilerplate becomes writable in the language itself.

Two further assumptions bite in practice. First, that the axis of variation is
real: a pattern buys flexibility along exactly one axis and pays in indirection,
so if the variation never arrives you bought nothing. Second, that the reader
shares the vocabulary, which makes the benefit social rather than technical.

## Uses and applicability

Use the names freely: in review, in commit messages, in interface documentation,
a pattern name is a precise and cheap way to say what code is doing.

Use the structures when the duplication has already appeared, when the variation
point is one you have observed rather than anticipated, and when the language
does not give you the shape for free. Frameworks are the natural home, since a
framework must be extended by code its authors have not seen: Template Method,
Observer and Abstract Factory earn their indirection there in a way they rarely
do inside one application.

## Limitations and common mistakes

The most damaging mistake is pattern-hunting: treating the catalogue as a
checklist and looking for places to apply it. This inverts the logic. Patterns
are observations about code that already exists, and starting from the solution
produces the layers of factories-of-factories that gave the subject its
reputation. Every speculative indirection is a place a reader must stop and
follow a call.

The second is mistaking language deficiency for design wisdom. Peter Norvig
observed that a majority of the twenty-three patterns are invisible or much
simpler in a dynamic language with first-class functions and multiple dispatch;
Paul Graham put it more bluntly, that a visible pattern is a sign the language is
missing an abstraction. Both are right about a real subset of the catalogue: the
count of patterns in a codebase measures the language at least as much as the
design.

Third, naming classes after patterns: `OrderProcessingStrategyFactoryImpl`
describes the mechanism, not the business.

Fourth, Singleton — a global variable with a lazy constructor, which hides
dependencies from the signatures that should declare them, makes tests share
state, and needs care to be thread-safe. Gamma has said in retrospect that he
would drop it from the catalogue.

Finally, the evidence: that patterns improve maintainability is a widely held
belief, not a measured law. The controlled experiments are few and mixed,
sometimes favouring the simpler solution.

## Variants and alternatives

Later catalogues extended the form: Fowler's enterprise application patterns,
Buschmann and colleagues' architecture patterns for system-scale structures such
as Layers and Pipes and Filters, Hohpe and Woolf's integration patterns for
message-based systems. The genre also inverted into _anti-patterns_ — recurring
bad solutions with names attached, useful for the same reason and abused the
same way.

The genuinely different alternatives are three. Refactoring catalogues describe
the _transformation_ rather than the destination, which suits the way designs
actually arrive. Language features replace patterns outright: closures, algebraic
data types with pattern matching, traits, generics and macros each retire a
pattern or two, and Lisp's higher-order procedures and data-directed dispatch
anticipated the argument by decades. The third is restraint — waiting for the
third instance before abstracting, frequently the correct design and the one
with no diagram.

## History and attribution

The idea came from architecture. Christopher Alexander's pattern language, from
the late 1970s, set out hundreds of patterns running from the scale of a region
down to the placement of a window, each linked to the larger patterns it helps
complete and the smaller ones that complete it. The point was generative and
partly political: a shared grammar so that the people who would live and work in
a building could help design it rather than leave it to professionals. Reuse was
not the goal; coherent, habitable wholes were.

Kent Beck and Ward Cunningham brought the method into software in the late
1980s, applying it to Smalltalk interface design and reporting it at OOPSLA. The
Hillside Group and the PLoP workshops formed around the idea in the early 1990s,
and the Gang of Four book followed in 1994.

Alexander addressed the software patterns community at OOPSLA in 1996.
Surprised by the adoption, he pressed the question the catalogue had quietly
dropped: whether these patterns generate a coherent whole, and what they are
_for_ in the sense that a good building is for the people in it.

## Sources

Martin Fowler's site is the best overview of the tradition from inside it: his
own pattern catalogue, his writing on how patterns are authored and abused, and
his refactoring catalogue, the main alternative way of packaging the same
knowledge. _Structure and Interpretation of Computer Programs_ is cited for
higher-order procedures and data-directed dispatch, the primitive several
patterns encode. cppreference documents the C++ dispatch machinery the
structures are written in, and the Python documentation the constructs in the
worked example.

## Prerequisites and next connections

Read [Object-Oriented Programming](./object-oriented-programming.md) first: the
patterns are unreadable without classes, interfaces, inheritance and dynamic
dispatch, because those are the only nouns they use.

Afterwards, [Functional Programming](./functional-programming.md) is the
counterweight — what a third of the catalogue looks like when functions are
ordinary values — and [Lisp](./lisp.md) has the macro systems that abolish
boilerplate rather than document it. [C++](./cpp.md), the language the catalogue
was written in, explains why several of the patterns exist at all.
