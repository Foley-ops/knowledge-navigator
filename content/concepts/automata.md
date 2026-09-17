---
concept_id: concept.computation.automata
title: Automata
slug: /concepts/automata
aliases:
  - finite-state machine
kind: concept
tier: 1
review_state: generated-draft
summary: 'Automata theory grades computation by how much memory a machine may keep: a finite control alone recognises exactly the regular languages, adding a stack gives the context-free ones, and removing the bound altogether gives everything computable.'
categories:
  - Mathematics/Theory of Computation
primary_category: Mathematics/Theory of Computation
relationships:
  - type: contrasts_with
    target: concept.foundations.computability_theory
    note: Both ask which languages a machine model recognises, but bounding the memory makes emptiness and equivalence decidable, where an unbounded tape makes them undecidable.
  - type: contributes_to
    target: concept.computation.computational_complexity
    note: The machine-model-versus-language-class method, nondeterminism and the separation arguments all appear here first, with a structural bound on memory in place of a resource bound.
  - type: requires
    target: concept.foundations.set_theory
    note: A transition function, the power set used in the subset construction and the Myhill–Nerode equivalence classes are all stated in the language of sets, functions and relations.
  - type: contributes_to
    target: concept.logic.first_order_logic
    note: Regular languages coincide with the string properties definable in monadic second-order logic, which makes automata the decision procedure behind that logic's satisfiability.
sources:
  - source_id: source.mit_ocw.theory_of_computation
    title: MIT 18.404J Theory of Computation (Fall 2020)
    url: https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/
    source_kind: lecture-or-course
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.plato.computability
    title: 'Stanford Encyclopedia of Philosophy: Computability and Complexity'
    url: https://plato.stanford.edu/entries/computability/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.turing1936.computable_numbers
    title: On Computable Numbers, with an Application to the Entscheidungsproblem
    url: https://londmathsoc.onlinelibrary.wiley.com/doi/10.1112/plms/s2-42.1.230
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.python.documentation
    title: The Python Language Reference and Library
    url: https://docs.python.org/3/
    source_kind: reference-documentation
    supports:
      - concrete-example
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
unresolved_references:
  - label: The logic–automata correspondence (Büchi–Elgot–Trakhtenbrot for monadic second-order logic, Schützenberger and McNaughton–Papert for star-free languages and first-order logic)
    reason: No registry source covers descriptive complexity or the algebraic theory of automata; the equivalence of regular languages with MSO-definable string properties, and of star-free languages with aperiodic syntactic monoids, is stated here from general knowledge and should be checked against a formal-language reference before this page leaves generated-draft.
    sections:
      - formal-treatment
      - variants-and-alternatives
  - label: The automaton variants beyond the finite-word models (two-way, Mealy and Moore, weighted, Büchi–Rabin–Muller–parity, tree, timed and alternating automata)
    reason: The registry has no formal-language-theory reference, and MIT 18.404J stops at finite automata, pushdown automata and Turing machines, so the properties claimed for these variants — that two-way automata recognise exactly the regular languages, that alternation buys a further exponential saving in size, and that deterministic Büchi automata are strictly weaker than nondeterministic ones — are stated here from general knowledge and should be checked against an automata-theory reference before this page leaves generated-draft.
    sections:
      - assumptions-and-requirements
      - variants-and-alternatives
  - label: Automata-theoretic model checking and the PSPACE-completeness of NFA minimisation
    reason: The registry has no verification or formal-methods source and no automata-complexity paper, so the claims about Büchi automata in linear-temporal-logic model checking and about the hardness of minimising an NFA are uncited.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
claims: []
---

## Definition

An **automaton** is an abstract machine given by a finite set of control states,
an input alphabet, and a rule that moves it from state to state as input symbols
arrive; **automata theory** studies which sets of strings such machines can
recognise once their memory is restricted in a specified way. The base case is
the deterministic finite automaton, whose only memory is its current state. Give
the machine a stack and it becomes a pushdown automaton; give it an unbounded
read-write tape and it becomes a Turing machine. Each memory discipline pins
down a class of languages exactly, and that correspondence — not the machines
themselves — is the content of the subject.

## Why it matters

Automata theory is where computation first acquires a provable limit, and the
proof is elementary enough to check by hand: no finite automaton recognises
$\{0^n 1^n : n \ge 0\}$, and no ingenuity in choosing the states changes that.
Compare the undecidability results of
[Computability Theory](./computability-theory.md), which need a diagonal
argument and deliver a much stronger negative — here the barrier is visible with
counting alone.

It also marks out an engineering sweet spot. Regular languages are recognised in
constant space and one left-to-right pass; they are closed under union,
intersection, complement, concatenation and star; and emptiness, equivalence and
membership are all decidable. That combination is why lexical analysers, packet
filters, hardware controllers and `grep` are built on finite automata and not on
something more expressive. Finally, the vocabulary — machine model, language
class, nondeterminism, closure property, separation — is the vocabulary
complexity theory later reuses with time and space bounds where the structural
bound used to be.

## Intuition

Think of a reader with amnesia. It scans the input once, left to right, and the
only thing it carries forward is which of finitely many states it is in. With
$|Q|$ states it can make at most $|Q|$ distinctions among all the prefixes it
has ever seen. To recognise $0^n1^n$ it would have to distinguish $0^5$ from
$0^6$ from $0^7$ and so on without bound, because each requires a different
continuation to be accepted. Finitely many states cannot hold unboundedly many
distinctions. The Myhill–Nerode theorem turns that sentence into the exact
criterion.

A stack relaxes the restriction in one specific direction: unbounded memory, but
last-in-first-out access. That is enough to match nested brackets and enough for
$0^n1^n$, and not enough for $0^n1^n2^n$, because verifying the second count
pops away the record needed for the third.

The analogy that misleads is "states are memory". A DFA with $2^{64}$ states
does resemble a machine with 64 bits of RAM, but automata theory asks a limiting
question — fixed machine, arbitrarily long input — and against an unbounded
input any fixed amount of memory is the same as none.

## Concrete example

A DFA over $\Sigma = \{0,1\}$ accepting binary strings that denote a multiple of
three, most significant bit first. The states track the remainder so far, using
the fact that appending bit $b$ maps value $v$ to $2v + b$:

```text
  state | 0   1     meaning            start  accept
  ------+---------  -----------------  -----  ------
   r0   | r0  r1    value mod 3 == 0     *      yes
   r1   | r2  r0    value mod 3 == 1
   r2   | r1  r2    value mod 3 == 2
```

Running `110` (six): $r_0 \to r_1 \to r_0 \to r_0$, accept. Running `1011`
(eleven): $r_0 \to r_1 \to r_2 \to r_2 \to r_2$, reject. Three states decide
divisibility for inputs of any length, which is the whole appeal of the model.

Now the counterexample people meet daily. Python's `re` module supports
backreferences, and this pattern matches exactly the doubled strings $ww$:

```python
import re

doubled = re.compile(r"(\w+)\1")
print(bool(doubled.fullmatch("abcabc")))  # True
print(bool(doubled.fullmatch("abcabd")))  # False
```

The set $\{ww : w \in \Sigma^{+}\}$ over a two-letter alphabet is not regular,
and is not even context-free. A library called "regular expressions" is
therefore not, in general, deciding a regular language.

## Formal treatment

A **deterministic finite automaton** is a tuple $M = (Q, \Sigma, \delta, q_0,
F)$ with $Q$ a finite state set, $\Sigma$ a finite alphabet, $\delta : Q \times
\Sigma \to Q$, $q_0 \in Q$ the start state and $F \subseteq Q$ the accepting
states. Extend $\delta$ to strings by $\hat{\delta}(q, \varepsilon) = q$ and
$\hat{\delta}(q, wa) = \delta(\hat{\delta}(q,w), a)$, and set

$$
L(M) \;=\; \{\, w \in \Sigma^{*} \;:\; \hat{\delta}(q_0, w) \in F \,\}.
$$

A **nondeterministic finite automaton** replaces $\delta$ by $\delta : Q \times
(\Sigma \cup \{\varepsilon\}) \to \mathcal{P}(Q)$ and accepts $w$ if _some_ run
ends in $F$. The **subset construction** converts an NFA $N$ into the DFA
$(\mathcal{P}(Q), \Sigma, \delta', E(\{q_0\}), \{S : S \cap F \neq \emptyset\})$
with

$$
\delta'(S, a) \;=\; \bigcup_{q \in S} E\big(\delta(q,a)\big),
$$

where $E(\cdot)$ is the $\varepsilon$-closure. Hence NFAs and DFAs recognise the
same class, the **regular languages** — but the DFA may need $2^{n}$ states, and
that bound is tight: $L_k = \{w : |w| \ge k$ and the $k$-th symbol from the
right is $1\}$ has an NFA with $k+1$ states, while any DFA for it needs at least
$2^{k}$, since two distinct suffixes of length $k$ must leave the machine in
distinguishable states.

**Kleene's theorem** says a language is regular if and only if it is denoted by
a regular expression built from $\emptyset$, $\varepsilon$ and single symbols
using union, concatenation and star. The **pumping lemma** is the standard
necessary condition: if $L$ is regular there is a $p \ge 1$ such that every $w
\in L$ with $|w| \ge p$ splits as $w = xyz$ with $|y| \ge 1$, $|xy| \le p$ and
$xy^{i}z \in L$ for all $i \ge 0$. Applying it to $L = \{0^n1^n\}$: take $w =
0^p1^p$; the constraint $|xy| \le p$ forces $y = 0^k$ with $k \ge 1$; then
$xy^2z = 0^{p+k}1^{p}$ has unequal counts, so it is not in $L$, and $L$ is not
regular.

The exact characterisation is **Myhill–Nerode**: define $x \equiv_L y$ when for
every $z$, $xz \in L \iff yz \in L$. Then $L$ is regular precisely when
$\equiv_L$ has finitely many classes, and their number is the state count of the
unique minimal DFA.

A **pushdown automaton** adds a stack alphabet $\Gamma$ and a transition
relation $\delta : Q \times \Sigma_{\varepsilon} \times \Gamma_{\varepsilon} \to
\mathcal{P}(Q \times \Gamma_{\varepsilon})$. Nondeterministic PDAs recognise
exactly the context-free languages. This is the level at which nondeterminism
stops being free: deterministic PDAs recognise a strictly smaller class, and
$\{w w^{R}\}$ is context-free but not deterministic context-free. The
**Chomsky hierarchy** stacks the levels:

```text
  type 3  regular            finite automaton            0^n 1^n     separates 3 from 2
  type 2  context-free       pushdown automaton          0^n 1^n 2^n separates 2 from 1
  type 1  context-sensitive  linear bounded automaton
  type 0  recursively enum.  Turing machine
```

Every containment is strict, and each is a theorem, not a definition.

## Assumptions and requirements

The alphabet and the state set are finite, the input is read once and left to
right, and acceptance is defined on finite strings. Drop finiteness of the
alphabet and you need register automata; drop the finite-word assumption and
acceptance has to be redefined over infinite runs, where deterministic Büchi
automata are strictly weaker than nondeterministic ones — the neat DFA/NFA
equality is a fact about finite words, not a general principle.

The pumping lemma assumes only regularity, so it yields a contradiction only for
languages whose long strings can be forced; it says nothing when $L$ is finite,
since then $p$ may exceed every string in $L$. The subset construction assumes
nothing beyond finiteness, which is why it always works and sometimes explodes.
Giving a PDA a second stack removes the whole hierarchy at once: two stacks
simulate a Turing tape, and the model becomes universal.

## Uses and applicability

Reach for finite automata when the property is local and the input is a stream:
lexical analysis, where regular expressions for tokens are compiled into one
DFA; string search, where Knuth–Morris–Pratt is a DFA over the pattern; input
validation; protocol and controller state machines; and the automata-theoretic
approach to model checking, where the negation of a temporal specification is
turned into an automaton on infinite words, composed with the system, and the
product checked for emptiness — an empty product means the system satisfies the
specification.

Do not reach for them when the property requires unbounded matching or counting
— nested structure, balanced delimiters, agreement between separated parts. That
is a parser's job, and the right model is a pushdown automaton or a grammar.
Automata are also the wrong tool when the state space is naturally exponential
in a parameter you care about, unless you can keep the machine implicit and
explore it lazily.

## Limitations and common mistakes

The first mistake is reading "NFAs and DFAs are equivalent" as "the choice does
not matter". It is an equivalence of language classes and nothing more: the
subset construction can produce exponentially many states, and the fix in
practice is to build the DFA lazily during matching, materialising only the
subsets that the input actually visits.

The second is treating the pumping lemma as a characterisation. It is necessary,
not sufficient: non-regular languages exist that satisfy the pumping condition,
so passing it proves nothing. Myhill–Nerode is the two-way criterion. The proof
is also an adversary game with a fixed order — the lemma gives $p$, you choose
$w$, the adversary chooses the split, you choose $i$ — and choosing the split
yourself is the usual invalid step.

The third is assuming regex libraries implement regular languages. Backreferences
take Python's `re` and PCRE-family engines out of the class entirely, and
backtracking implementations of them can degrade catastrophically on adversarial
input. Lookaround assertions, by contrast, preserve regularity, since regular
languages are closed under intersection and complement. Engines such as RE2 and
Go's `regexp` drop backreferences precisely to keep automaton-based matching and
its linear-time guarantee.

Two smaller ones: nondeterminism is a mathematical device for defining
acceptance, not randomness and not parallel hardware; and minimisation is not
uniformly easy — the minimal DFA is unique and computable in $O(n \log n)$,
while minimising an NFA is intractable in general.

## Variants and alternatives

**Two-way finite automata**, which may move the head left, recognise exactly the
regular languages — more freedom, no more power. **Mealy** and **Moore
machines** add output and model sequential circuits. **Weighted automata**
replace acceptance with a value in a semiring. **Büchi, Rabin, Muller and parity
automata** run on infinite words for verification. **Tree automata** consume
terms rather than strings, **timed automata** add real-valued clocks, and
**alternating automata** combine existential and universal branching for a
further exponential saving in size.

The genuinely different approaches to the same class are declarative rather than
machine-based: regular expressions and regular grammars describe the language
instead of a recogniser; the algebraic route studies the finite syntactic monoid
of a language, which is what makes decidable statements like "star-free exactly
when the syntactic monoid is aperiodic" possible; and the logical route
identifies regular languages with the monadic second-order definable ones.

## History and attribution

The lineage begins with McCulloch and Pitts (1943), who modelled networks of
idealised neurons and unintentionally described finite-state devices. Kleene
(1956) proved the equivalence of those nerve nets with what he called regular
events, giving the theorem that carries his name. Rabin and Scott (1959)
introduced nondeterministic automata and the subset construction, work for which
they shared a Turing Award; Myhill and Nerode gave the minimal-state
characterisation in the late 1950s. Independently, Chomsky (1956) was working on
grammars for natural language and produced the hierarchy that lines those
grammars up with machine models. The pumping lemma is usually credited to
Bar-Hillel, Perles and Shamir (1961). At the top of the hierarchy sits Turing's
1936 machine, which predates all of it: the restricted models were defined
afterwards, by asking what happens when the tape is taken away.

## Sources

The MIT 18.404J course is the main support here and follows this material in
order — DFAs and NFAs, the subset construction, Kleene's theorem, the pumping
lemma, pushdown automata and the hierarchy — so it backs the definitions, the
worked non-regularity proof and the standard mistakes. The Stanford
Encyclopedia entry on computability and complexity is the reference for the
Turing-machine end of the picture and for why the Church–Turing thesis makes
that end the ceiling. Turing's 1936 paper is cited only for the machine itself.
The Python documentation is cited only for what it actually documents: that `re`
supports backreferences, which is the point of the second example.

## Prerequisites and next connections

Read [Set Theory](./set-theory.md) first, or at least be comfortable with
functions, relations, power sets and equivalence classes — every construction
above is stated in those terms. Nothing else is needed; automata theory is
deliberately self-contained and is usually the first theory course for that
reason.

Afterwards, [Computability Theory](./computability-theory.md) removes the memory
bound and shows what breaks: emptiness and equivalence, decidable for finite
automata, become undecidable. [First-Order Logic](./first-order-logic.md) is the
other direction to go, since the logical characterisations of regular languages
are what connect this subject to
[Model Theory](./model-theory.md) and to decision procedures used in practice.
