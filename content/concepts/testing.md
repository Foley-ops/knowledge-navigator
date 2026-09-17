---
concept_id: concept.software.testing
title: Testing
slug: /concepts/testing
aliases:
  - software testing
kind: concept
tier: 1
review_state: generated-draft
summary: Running a program on chosen inputs and checking the observed behaviour against an expected one, which can demonstrate that a defect exists but never that none remains.
categories:
  - Programming/Software Practice
primary_category: Programming/Software Practice
relationships:
  - type: contributes_to
    target: concept.software.version_control
    note: Continuous integration works by running the suite against every commit, so tests are the gate that makes frequent merging into shared history safe.
  - type: contrasts_with
    target: concept.formal_verification.coq
    note: A machine-checked proof establishes a property for every input in the domain, where a suite establishes it only for the finitely many inputs it actually ran.
  - type: unreliable_when
    target: concept.systems.distributed_systems
    note: Tests need a reproducible run, and thread interleavings, clocks and network timing make the same test pass and fail on the same code.
  - type: useful_when
    target: concept.software.apis
    note: A test binds to whatever surface it calls, so testing pays off where a component exposes a stable interface rather than where the test must reach into internals.
sources:
  - source_id: source.fowler.refactoring_catalog
    title: Martin Fowler — Refactoring and design catalogue
    url: https://martinfowler.com/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.rust.book
    title: The Rust Programming Language
    url: https://doc.rust-lang.org/book/
    source_kind: reference-documentation
    supports:
      - definition
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.coq.documentation
    title: The Coq Proof Assistant documentation
    url: https://coq.inria.fr/documentation
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: 'Dijkstra, Notes on Structured Programming (c. 1970) — "Program testing can be used to show the presence of bugs, but never to show their absence"'
    reason: The registry has no Dijkstra entry, so the wording, the date and the venue of the remark are reported from a widely reproduced text rather than checked against a cited source.
    sections:
      - why-it-matters
      - limitations-and-common-mistakes
      - history-and-attribution
  - label: 'Claessen and Hughes, QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs (2000)'
    reason: The registry has no source on property-based testing, so the attribution of generators, properties and shrinking to QuickCheck is uncited here.
    sections:
      - variants-and-alternatives
      - history-and-attribution
  - label: 'The pytest and Hypothesis documentation'
    reason: The example is written in the conventions of pytest and Hypothesis, which are third-party packages the registry has no entries for, so its syntax and the described shrinking behaviour are uncited here.
    sections:
      - concrete-example
claims: []
---

## Definition

**Testing** is the practice of running a program on selected inputs and
comparing what it does against what it should do, reporting a disagreement as a
failure. An automated test is itself a program that _arranges_ some state,
_acts_ by invoking the code under test, and _asserts_ that the result matches
an expectation. The part deciding pass from fail is the **oracle**, and it is
the hard half: generating inputs is easy, knowing the right answer is not.

Tests are sorted by how much of the system each runs: a **unit** test exercises
one function with its collaborators replaced or absent, an **integration** test
runs several real components together such as the code plus an actual database,
and an **end-to-end** test drives the assembled system through its outermost
interface. Speed and fault localisation both degrade as scope grows, and teams
divide the continuum differently.

## Why it matters

A suite makes change cheap. Without one, the blast radius of every edit must be
reasoned about by hand, so the rational response is to stop editing — which is
how codebases ossify. With one, a refactoring is answered in seconds by
execution rather than by confidence, which is the mechanism underneath
continuous integration. The second payoff is the regression net: a bug found
once is encoded as a test and cannot return silently.

Dijkstra's remark bounds the claim exactly — testing can show the presence of
bugs, never their absence. That is not an argument against testing, since cheap
detection of presence is worth a great deal, but against reading green as a
certificate.

## Intuition

Picture the input domain as a large region containing a subset on which the
program misbehaves. A test is one probe; a suite is a scatter of probes, and
the skill is aiming them at boundaries, at each branch, at the cases that broke
before. The **test pyramid** — many unit tests, fewer integration tests, a few
end-to-end — is the usual shape, because cost and flakiness rise with scope
while diagnostic precision falls.

Where the picture breaks: probes are not independent draws and defects are not
uniformly scattered, but cluster where the programmer thought least. Covering
the domain in any measure-theoretic sense is hopeless, since one 64-bit
argument already gives $2^{64}$ inputs, so a test's value comes from the
reasoning that chose it rather than from the count.

## Concrete example

```python
# ledger.py
def running_balance(amounts):
    """Cumulative sums: one output entry per input entry."""
    total = 0
    out = []
    for a in amounts:
        total += a
        out.append(total)
    return out
```

```python
# test_ledger.py — runnable with pytest
from ledger import running_balance

def test_known_case():
    assert running_balance([10, -3, 5]) == [10, 7, 12]

def test_empty_input():
    assert running_balance([]) == []

def test_last_entry_is_the_total():
    amounts = [4, -9, 2, 7]
    assert running_balance(amounts)[-1] == sum(amounts)
```

Now the point about coverage. Run `test_known_case` alone: every statement
executes and both branches of the loop are taken, since the body runs and the
loop exits. Statement and branch coverage are both 100% after that one test —
while the empty input is unchecked, the length invariant is unchecked, and
deleting the `assert` keyword would not move the numbers.

A property-based test replaces the hand-picked input with a generator:

```python
from hypothesis import given, strategies as st
from ledger import running_balance

@given(st.lists(st.integers()))
def test_balance_properties(amounts):
    result = running_balance(amounts)
    assert len(result) == len(amounts)
    assert result == [] or result[-1] == sum(amounts)
```

On failure the library shrinks the counterexample toward a minimal failing
input — for properties like these, usually an empty or one-element list —
rather than reporting the larger list it happened to generate first.

## Formal treatment

Let $P$ be a program with input domain $D$, and $\mathrm{check} : D \times O
\to \{\text{true}, \text{false}\}$ the oracle deciding whether output $P(d)$ is
acceptable. A suite is a finite $T \subseteq D$, and running it establishes

$$
\forall d \in T : \mathrm{check}\bigl(d, P(d)\bigr)
$$

and nothing about $D \setminus T$. With $|D|$ usually astronomical or infinite,
a pass carries no implication about untried inputs: the exact content of
Dijkstra's remark, escaped only for very small $D$.

A **coverage criterion** $C$ fixes a finite set $E$ of structural elements of
$P$ — statements, branches, condition combinations, paths — and reports

$$
\mathrm{cov}_C(T) \;=\; \frac{\bigl|\{e \in E : \exists\, d \in T
\text{ whose execution reaches } e\}\bigr|}{|E|}.
$$

That definition mentions the execution trace and not $\mathrm{check}$: deleting
every assertion leaves it unchanged. **Coverage measures what was executed, not
what was checked.** It is sound as a negative signal, since an uncovered line is
certainly untested, and unsound as a positive one. Branch coverage subsumes
statement coverage, and path coverage subsumes branch coverage.

**Mutation testing** closes that gap: mutate $P$ syntactically and report the
fraction of mutants _killed_, meaning some $d \in T$ makes the suite fail.
Killing usually requires an assertion to fire — a mutant can also be killed by
an exception, a crash or a timeout — so unlike coverage the score depends
largely on the oracle.

## Assumptions and requirements

**An oracle must exist and be cheaper than recomputation.** If deciding
correctness means reimplementing the function, the test has bought nothing.
Where none exists — solvers, renderers, learned models — practice falls back to
metamorphic relations, differential testing against a reference implementation,
or golden files that pin behaviour without arguing it is right.

**Runs must be reproducible.** Clocks, unseeded randomness, network state,
uncontrolled concurrency and order dependence between tests all break this;
runtimes that run tests in parallel by default, Rust's `cargo test` among them,
surface shared-state assumptions immediately.

**Seams must exist**, since substituting a collaborator requires an injectable
dependency: testability is a design constraint satisfied while the code is
written. And **the suite must stay fast**, because people abandon a suite that
takes an hour — an observation about people, not a theorem, but it decides
whether any of this applies.

## Uses and applicability

Reach for tests when behaviour is specifiable and the code will change again.
The best return comes from pure functions with awkward edges, parsers and
serialisers (round-trip properties are nearly free), and anything touching
money, dates, time zones or encodings. Every fixed bug deserves a test that
fails before the fix and passes after; that rule accumulates more value than
any coverage policy.

Tests fit poorly where the specification is still being discovered, where the
artefact is a one-off script, and where the property of interest is aesthetic.
For critical concurrent protocols they sample interleavings they cannot
enumerate, and model checking is the better tool.

## Limitations and common mistakes

**Coverage as a target.** Mandate 90% and you get tests that execute code
without asserting on it, since that is the cheapest way to satisfy the metric.
The number then certifies nothing while looking like assurance.

**Flaky tests are worse than missing ones.** A test failing on one run in
thirty for reasons unrelated to the change teaches everyone to re-run and to
read red as noise. Once that habit forms the real failures are ignored too, so
the cost is not one bad test but the credibility of the whole suite. Fix it or
delete it the day it appears.

**Over-mocking.** Replace every collaborator with a double and the suite
verifies that your code calls the doubles you wrote: it passes while the real
integration is broken, and it breaks on every refactoring because it asserts on
interactions rather than outcomes — as does any suite testing implementation
rather than behaviour. And **green does not mean correct**: it means these
checks passed, on these inputs, this time.

## Variants and alternatives

**Example-based** tests name the input; **property-based** tests name an
invariant and let a generator search, in the QuickCheck lineage that Hypothesis
(Python) and proptest (Rust) continue. **Fuzzing** is the same idea with the
weakest property, "does not crash"; coverage-guided fuzzers use coverage as a
_search signal_, the one role in which the metric genuinely earns its keep.

**Test doubles** come in a taxonomy Fowler popularised: dummies, stubs, spies,
fakes and mocks. A fake is a working lightweight implementation such as an
in-memory repository; a mock asserts about the calls it receives, so preferring
fakes keeps tests pointed at outcomes. **Snapshot tests** are cheap and weak as
oracles: when the diff is long, people approve it unread.

The genuinely different approaches are complements rather than rivals: static
types exclude classes of error before any test runs, model checkers explore a
model exhaustively, and machine-checked proof in Coq or Lean gives the
universal statement testing cannot, at a much higher cost. **Test-driven
development** writes the test first as a design pressure; whether it reduces
defect rates is contested in the empirical literature, so treat it as a
preference rather than a demonstrated result.

## History and attribution

The discipline separated from ad-hoc debugging in the late 1960s and 1970s,
when software outgrew the ability to reason about it by hand.
Dijkstra's formulation of the limit dates to roughly 1970 and he restated it in
his 1972 Turing Award lecture.

Automated developer testing became default practice through the **xUnit**
family: Kent Beck's SUnit for Smalltalk in the 1990s, ported with Erich Gamma
to JUnit for Java, whose descendants now ship in most toolchains — Python's
`unittest`, Rust's `#[test]`. Fowler, Beck and others documented the
surrounding practice: continuous integration, self-testing code, the test
double vocabulary, and the case against reading coverage as quality.
Property-based testing arrived with QuickCheck for Haskell in 2000. Several of
these ideas have independent origins, and attribution is cleaner for the tools
than for the practices.

## Sources

Martin Fowler's site is the best available reference for the practice: the test
pyramid, test doubles, coverage as a diagnostic rather than a target,
non-deterministic tests, and the history of xUnit and continuous integration.
The Python documentation covers the standard library's own testing tools —
`unittest`, `doctest` and `unittest.mock` — which are the alternatives to the
third-party pytest and Hypothesis shown in the example. The Rust book's chapter on automated
tests states the unit/integration split and isolation under parallel execution,
and the Coq documentation stands here for the alternative it names.

## Prerequisites and next connections

You need working fluency in some language before tests mean anything — the
example here is [Python](./python.md) — and enough of
[Imperative Programming](./imperative-programming.md) to see why mutable state
makes isolation hard.

From here, [Computability Theory](./computability-theory.md) explains why no
tool can decide correctness in general: non-trivial semantic properties of
programs are undecidable, which is why practice samples rather than decides.
[Coq](./coq.md) and [Lean](./lean.md) show the other end of that trade, and
[Functional Programming](./functional-programming.md) is worth reading because
pure functions are the easiest things in software to test.
