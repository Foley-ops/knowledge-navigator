---
concept_id: concept.languages.lisp
title: Lisp
slug: /concepts/lisp
kind: concept
tier: 1
review_state: generated-draft
summary: A family of languages — Common Lisp, Scheme, Clojure and Emacs Lisp among them — whose programs are written as the same nested-list data structure the evaluator consumes, which makes a macro an ordinary program that rewrites syntax trees rather than text.
categories:
  - Programming/Languages
primary_category: Programming/Languages
relationships:
  - type: requires
    target: concept.algorithms.core_data_structures
    note: A Lisp program is a binary tree of cons cells, so the reader cannot see why code-as-data is cheap without already knowing linked lists and trees.
  - type: contrasts_with
    target: concept.languages.haskell
    note: Both bet on functions over statements, but Haskell buys guarantees from a static type system and a fixed grammar while Lisp buys extensibility from a dynamic, almost syntax-free representation.
  - type: contributes_to
    target: concept.languages.julia
    note: Julia keeps Lisp's expansion-time macros over parsed expression objects while abandoning s-expression surface syntax, and its own parser was written in a Scheme dialect.
  - type: contributes_to
    target: concept.foundations.computability_theory
    note: McCarthy's eval was a recursive definition of a universal function over symbolic expressions, and implementing it turned a computability argument into a working interpreter.
sources:
  - source_id: source.mitpress.sicp
    title: Structure and Interpretation of Computer Programs
    url: https://mitpress.mit.edu/9780262510875/structure-and-interpretation-of-computer-programs/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - uses-and-applicability
    checked_on: 2026-09-17
  - source_id: source.russell_norvig.aima
    title: 'Russell and Norvig, Artificial Intelligence: A Modern Approach'
    url: https://aima.cs.berkeley.edu/
    source_kind: authoritative-secondary
    supports:
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.cppreference
    title: cppreference.com — C and C++ reference
    url: https://en.cppreference.com/w/
    source_kind: reference-documentation
    supports:
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.julia.documentation
    title: The Julia Language documentation
    url: https://docs.julialang.org/en/v1/
    source_kind: reference-documentation
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: McCarthy 1960, Recursive Functions of Symbolic Expressions and Their Computation by Machine, Part I, and the LISP 1.5 Programmer's Manual
    reason: The registry has no primary source for Lisp's origin, so the dates, the S-expression versus M-expression story, the first automatic garbage collector and Steve Russell's hand-compilation of eval are stated here from general knowledge and should be checked against the original papers before this page leaves generated-draft.
    sections:
      - history-and-attribution
  - label: The dialect standards — ANSI Common Lisp, the Revised Reports on Scheme, the Clojure reference and the GNU Emacs Lisp Reference Manual
    reason: No registry source documents any Lisp dialect, so every claim about defmacro versus syntax-rules, hygiene and gensym, guaranteed tail calls, Clojure's persistent collections and Emacs Lisp's binding rules is uncited.
    sections:
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Lisp** is a family of programming languages whose source text is a literal
notation for a data structure. That structure is the **s-expression**: either an
atom (a symbol, number or string) or a parenthesised sequence of s-expressions.
A function call is written `(f a b)`; so is a conditional, a binding and a macro
use. The reader turns text into cons cells and symbols, the evaluator walks those
cells, and a running program can build and rewrite them with ordinary list
functions. This is **homoiconicity**: there is no separate abstract syntax tree,
because the list already is one.

## Why it matters

Most languages give you two ways to build abstraction — name a value, name a
procedure — and stop there. Lisp adds a third: name a _syntactic form_. Because
program text is data, a macro is a function from s-expressions to s-expressions,
run by the compiler before evaluation and written in the full language. A control
construct the designers never anticipated — a pattern-matching form, a
resource-scoping block, an embedded query language — becomes a library rather
than a request to a standards committee. That is SICP's metalinguistic
abstraction. Lisp is also where automatic garbage collection, the interactive
read-eval-print loop and first-class functions were first shipped together.

## Intuition

In a language with a conventional grammar, the compiler holds the parse tree and
you do not. You can generate source text — fragile, since you are writing a
string and hoping it parses into what you meant — or wait for the next language
version. In Lisp the parse tree is a value, and it is a list.

A macro is often described as a compiler plugin, and that is mostly right. The
analogy breaks on cost — a plugin is an event, a macro is five lines in the file
that uses it — and on timing: macros run at expansion time, so they see forms,
never values, and cannot branch on what a variable will hold at run time.

## Concrete example

Code as data, in Common Lisp:

```lisp
(let ((form '(+ 1 2)))
  (list (first form) (length form) (eval form)))
;; => (+ 3 3)
```

The quote stops evaluation, so `form` is a three-element list whose first element
is the symbol `+`; asking its length is as ordinary as for any other list.

A macro puts that to work. Common Lisp already supplies `unless`, which is the
point — it is definable in user code with no compiler support:

```lisp
(defmacro my-unless (test &body body)
  `(if ,test nil (progn ,@body)))

(macroexpand-1 '(my-unless (> x 3) (print x) (incf x)))
;; => (IF (> X 3) NIL (PROGN (PRINT X) (INCF X))), T
```

The backquote builds a list template, `,test` drops one form into it, and `,@body`
splices a list of forms in. The result is a list, which the compiler then
compiles. Nothing here is text: `body` was a list of two parsed forms throughout.

## Formal treatment

The surface grammar is one line. Writing $a$ for an atom and $e$ for an
expression,

$$
e \;::=\; a \;\mid\; (e_1\ e_2\ \cdots\ e_n),
$$

and underneath, every list is right-nested pairs terminated by the empty list, so
$(a\ b\ c)$ is $(a\ .\ (b\ .\ (c\ .\ \texttt{nil})))$.

Evaluation is the mutually recursive pair $\mathrm{eval}$ and $\mathrm{apply}$
that SICP develops as the metacircular evaluator. Let $\rho$ be an environment
mapping symbols to values. The rule that makes macros structural is that the head
of a combination is checked _before_ the arguments are evaluated:

$$
\mathrm{eval}\big((f\ e_1 \cdots e_n),\ \rho\big) =
\begin{cases}
\mathrm{eval}\big(m(e_1,\dots,e_n),\ \rho\big) & \text{$f$ names a macro $m$,}\\[4pt]
\mathrm{apply}\big(\mathrm{eval}(f,\rho),\ \mathrm{eval}(e_1,\rho),\dots,\mathrm{eval}(e_n,\rho)\big) & \text{otherwise.}
\end{cases}
$$

So a macro is a function $m : S^n \to S$ on the set $S$ of s-expressions, applied
to _unevaluated_ argument forms, and expansion iterates until the head is no
longer a macro name. Special forms such as `if`, `quote` and `lambda` are where
it stops — the cases $\mathrm{eval}$ handles itself. SICP makes the same point
without the word "macro", defining `cond` and `let` as _derived expressions_ that
rewrite into `if` and `lambda`.

## Assumptions and requirements

The macro story depends on the reader mapping text onto exactly the data type the
evaluator consumes. Reader macros that run arbitrary code at read time,
uninterned symbols and circular structure all weaken that read-print
correspondence, and weaken macros with it.

Expansion must terminate: a recursive macro whose expansion does not shrink will
loop forever at compile time rather than at run time.

Naming is the real hazard, and the dialects differ. An unhygienic `defmacro` that
introduces a temporary binding captures a caller's variable of the same name
unless the author generates a fresh symbol with `gensym`. Scheme's `syntax-rules`
and `syntax-case` are hygienic by construction — introduced bindings cannot
capture, free references resolve where the macro was written — which removes the
hazard and costs a separate pattern language. Clojure's syntax quote namespaces
symbols automatically and gives `x#` as auto-gensym.

Homoiconicity itself assumes s-expression surface syntax: bolt an infix grammar
onto a Lisp and what a macro receives is no longer what you wrote.

## Uses and applicability

Reach for a Lisp when the problem is symbolic or when the program needs to grow a
language: computer algebra and term rewriting, compilers and interpreters,
theorem provers, rule engines, and query or configuration embedded as a
sub-language. Emacs Lisp is the extreme case of the last — an editor whose whole
behaviour is a Lisp image you redefine while it runs.

Do not reach for it because macros are available. Most code is better as
functions; macros pay off only when you must control evaluation order, bind
names, or consume a form's structure. Ecosystem depth is a real constraint too —
numerical, machine-learning and web libraries are thinner than in Python or Java.

## Limitations and common mistakes

**Lisp macros are not C preprocessor macros.** The C preprocessor, documented on
cppreference, runs before parsing and substitutes token sequences; it does not
know what an expression is, cannot see scope, and cannot compute. Hence
`#define SQR(x) ((x) * (x))`, defensive about parentheses and still evaluating
its argument twice — `SQR(i++)` expands to `((i++) * (i++))`. A Lisp macro takes
parsed structure and returns it, so the parenthesis problem does not exist.
Argument duplication does: splice a form in twice and it runs twice, which you
fix by binding it once to a generated symbol.

**Variable capture bites unhygienic macros.** A swap macro that binds `tmp`
breaks when a caller writes `(my-swap x tmp)`. `gensym` is the Common Lisp fix;
Scheme's hygiene removes the class of bug.

**"Lisp" is not one language.** ANSI Common Lisp code does not run in Scheme or
Clojure; they differ on namespaces, guaranteed tail calls, macro hygiene, the
object system and the standard library.

**Nor is Lisp slow, or a synonym for functional programming.** Mature Common Lisp
implementations compile to native code and honour type declarations, so the
residual costs are dynamic dispatch and garbage collection, not interpretation;
and Common Lisp itself is cheerfully imperative, with assignment and a full
object system.

The parentheses are the complaint newcomers arrive with and the least important;
the real cost of a syntax with so little redundancy is that a misplaced paren
often yields a different valid program rather than a parse error.

## Variants and alternatives

**Common Lisp** is the large, ANSI-standardised dialect, with generic functions
and multiple dispatch, a condition system with restarts, and unhygienic
`defmacro`. **Scheme** is the minimalist one — small standard, guaranteed proper
tail calls, first-class continuations, hygienic macros. **Racket** grew out of
Scheme into a language for making languages, where a file declares which language
it is written in. **Clojure** targets the JVM, defaults to immutable persistent
collections, and adds literal syntax for vectors, maps and sets, so it is a Lisp
whose data is not only lists. **Emacs Lisp** is the extension language of one
program, with a long history of dynamic binding.

Outside the family, the alternatives give syntactic extension without
s-expressions and pay in machinery. Julia's documentation describes
metaprogramming in explicitly Lisp-derived terms — quoted code becomes `Expr`
objects that macros transform — while keeping infix syntax. Rust offers
`macro_rules!` and procedural macros over token streams, and Template Haskell
works over abstract syntax trees instead, with type information fetched from the
compiler by reification rather than carried by the tree, and typed quotation a
separate, more restricted form. None is as cheap to write.

## History and attribution

John McCarthy designed Lisp at MIT between 1958 and 1960, while working on the
Advice Taker — a program meant to represent knowledge as sentences and draw
conclusions from them. Reasoning of that kind needed a way to compute over
symbolic expressions. Russell and Norvig's history of AI credits McCarthy with
the language and records that it became the dominant AI programming language for
decades; MACSYMA, SHRDLU, the 1980s expert systems and the Lisp machines built to
run them sit downstream.

Two accidents matter. McCarthy intended a conventional surface syntax —
M-expressions — with s-expressions merely as the data representation; programmers
wrote s-expressions directly, M-expressions never arrived, and the defining
property of the family is a side effect. And `eval` was published as a
mathematical definition, a universal function showing the language could describe
its own evaluation; Steve Russell hand-compiled it, producing the first Lisp
interpreter. The read-eval-print driver loop it established ran in batch off
punched cards on the IBM 704 and 709, and only became the interactive top level
once Lisp reached time-sharing and the PDP-1 in the early 1960s. Garbage
collection arrived in the same system, because a language built on cons cells
has no other option.

The family then diverged: MacLisp and Interlisp, Scheme from Gerald Sussman and
Guy Steele in 1975, Common Lisp in the 1980s with an ANSI standard in 1994, and
Clojure from Rich Hickey in 2007.

## Sources

**Structure and Interpretation of Computer Programs** is the best account of what
the representation buys — quotation and symbolic data, the metacircular
evaluator, derived expressions, and the garbage collector in the register-machine
chapter; it teaches Scheme and does not cover `defmacro`, so the macro mechanics
here go beyond it. **Artificial Intelligence: A Modern Approach** places Lisp in
the history of AI. **cppreference** documents the preprocessor Lisp macros are
most often confused with, and **The Julia Language documentation** an explicitly
Lisp-descended macro system without s-expressions.

## Prerequisites and next connections

Read [Core Data Structures](./core-data-structures.md) first. Cons cells, linked
lists and trees are not background here, they are the object of study: an
s-expression is a binary tree, and every macro is a tree transformation written
with list operations.

From here, [Computability Theory](./computability-theory.md) is the natural next
step, because McCarthy's `eval` is a universal function in the sense that subject
makes precise. [Automata](./automata.md) covers the parsing machinery Lisp does
without, and [Coq](./coq.md) and [Lean](./lean.md) show what happens when the
terms being transformed carry types that constrain the transformation.
