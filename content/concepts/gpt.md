---
concept_id: concept.nlp.gpt
title: GPT
slug: /concepts/gpt
aliases:
  - Generative Pre-trained Transformer
kind: implementation
tier: 1
review_state: generated-draft
summary: GPT names OpenAI's family of decoder-only transformer language models, trained to predict the next token of text and then used to generate text one token at a time — the design behind most of today's large language models.
categories:
  - Artificial Intelligence/Domains/Natural Language Processing
primary_category: Artificial Intelligence/Domains/Natural Language Processing
relationships:
  - type: requires
    target: concept.deep_learning.transformers
    note: A GPT model is a stack of transformer decoder blocks with causal self-attention, so its architecture is read directly off the transformer.
  - type: requires
    target: concept.nlp.tokenization
    note: The model reads and writes tokens rather than characters or words, so its inputs, outputs, context length and several of its odd failures are all defined in tokens.
  - type: contrasts_with
    target: concept.nlp.bert
    note: BERT is an encoder trained to fill in masked tokens using context on both sides, while GPT is a decoder trained to predict the next token from the left context only, which is what lets it generate.
  - type: contributes_to
    target: concept.nlp.agents
    note: Language-model agents use a GPT-style model as the component that decides what to do next, so the agent inherits both its abilities and its failure modes.
sources:
  - source_id: source.brown2020.gpt3
    title: Language Models are Few-Shot Learners
    url: https://arxiv.org/abs/2005.14165
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - formal-treatment
    checked_on: 2026-09-25
  - source_id: source.ouyang2022.instructgpt
    title: Training language models to follow instructions with human feedback
    url: https://arxiv.org/abs/2203.02155
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.openai2023.gpt4
    title: GPT-4 Technical Report
    url: https://arxiv.org/abs/2303.08774
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: The first two GPT papers, and nucleus sampling
    reason: The 2018 and 2019 papers introducing GPT and GPT-2, and the paper introducing nucleus (top-p) sampling, are described from the wider literature; none is in the source registry.
    sections:
      - history-and-attribution
      - variants-and-alternatives
claims: []
---

## Definition

**GPT** — generative pre-trained transformer — is the family of language models
OpenAI introduced from 2018, and by extension the design most large language
models now share: a **decoder-only transformer** trained on a large corpus of
text to predict each next token from the tokens before it, then used to
**generate** by predicting a token, appending it, and repeating. Pre-training on
raw text is the "pre-trained"; the output is new text, hence "generative".

## Why it matters

Next-token prediction turned out to need almost everything. To predict well
across a broad corpus, a model has to track grammar, facts, the thread of an
argument, the conventions of code, and the intent of the person writing. GPT-3
showed that a large enough model trained this way could do tasks it was never
fine-tuned for, from a description and a few examples in its prompt — so-called
in-context learning — and that made a single pre-trained model a general-purpose
tool. Chat assistants, coding assistants and language-model agents are built on
this design.

## Intuition

The model is an extremely well-informed autocomplete. Given the text so far, it
produces a probability for every possible next token; choosing one and feeding
it back produces the next, and so on. Everything it "knows" is whatever makes
those predictions good.

The autocomplete picture is honest about the mechanism and misleading about the
behaviour. A system that only predicts next tokens can still follow instructions,
write working programs and reason through problems step by step, because doing
those things well is what the most probable continuation of a well-posed prompt
requires. What it does not have is a separate store of facts it can check: when
the probable continuation and the true one differ, it produces the probable one.

## Concrete example

After _"The cat sat on the"_, suppose the model gives three candidates
probabilities $0.5$, $0.3$ and $0.2$ for _mat_, _floor_ and _roof_. Greedy
decoding always picks _mat_. Sampling picks each in proportion to its
probability. A **temperature** $T$ reshapes the distribution to one proportional
to $p^{1/T}$:

```text
T = 0.5   mat 0.658   floor 0.237   roof 0.105    sharper, more predictable
T = 1.0   mat 0.500   floor 0.300   roof 0.200    the model's own distribution
T = 2.0   mat 0.415   floor 0.322   roof 0.263    flatter, more varied
```

Low temperature makes output repetitive and safe; high temperature makes it
varied and more error-prone. The model is the same in all three rows — only the
decoding choice changes.

## Formal treatment

A text is a token sequence $x_1, \dots, x_n$. The model factorises its
probability left to right and is trained to minimise the negative log-likelihood
of the training corpus:

$$
p_\theta(x_{1:n}) = \prod_{t=1}^{n} p_\theta(x_t \mid x_{<t}),
\qquad
\mathcal{L}(\theta) = -\sum_{t=1}^{n} \log p_\theta(x_t \mid x_{<t}).
$$

Each conditional comes from a stack of transformer blocks whose self-attention
is **causally masked**: position $t$ may attend only to positions $\le t$, so the
prediction it makes for $x_{t+1}$ cannot see the token it is predicting. Masking is what lets
one forward pass over a training sequence produce all $n$ predictions in
parallel. At generation time the logits $z$ for the next token become
probabilities through a softmax, $p_i \propto e^{z_i / T}$, from which the next
token is chosen.

## Assumptions and requirements

- **A fixed context window.** The model conditions only on the tokens that fit in
  its context; anything earlier is invisible unless it is fed back in.
- **Tokenisation fixed at training.** Behaviour is defined over the tokenizer's
  vocabulary, which is why spelling, counting characters and arithmetic on long
  numbers can go wrong in ways that look strange to a reader.
- **Scale for the headline behaviours.** In-context learning and instruction
  following were observed to strengthen with model size, data and compute; they
  are empirical findings about models at scale, not guarantees of the method.
- **Training data defines competence.** What the corpus did not contain, or
  contained wrongly, the model cannot reliably reproduce.

## Uses and applicability

Use a GPT-style model for open-ended text and code generation, summarisation,
translation, drafting, question answering over supplied documents, and as the
reasoning component of an agent. It is the right tool when the output is
language and approximate correctness can be checked. It is the wrong tool when
you need guaranteed facts, exact arithmetic or deterministic behaviour without
verification around it.

## Limitations and common mistakes

**Fluency is not accuracy.** The model can produce confident, well-formed text
that is false — often called hallucination. The GPT-4 report states that the
model still makes such errors and advises care in high-stakes use.

**The size of a model is not its capability.** OpenAI's instruction-following
work found that labellers preferred a much smaller model tuned with human
feedback over a far larger base model, so post-training can matter as much as
parameter count.

**Treating the prompt as a program.** Small changes in wording can change
outputs; prompting is empirical, and behaviour that works on one model version
may not transfer.

**Assuming disclosed details.** The GPT-4 report withholds the architecture,
model size and training method, so claims about its internals are speculation.

## Variants and alternatives

- **Instruction tuning and reinforcement learning from human feedback** turn a
  base model that continues text into one that follows requests.
- **Decoding strategies** — greedy, beam search, top-$k$ and nucleus sampling —
  trade predictability against diversity.
- **Encoder models** such as BERT suit understanding tasks where the whole input
  is visible; encoder-decoder models suit translation and summarisation.
- **Open-weight models** such as LLaMA apply the same decoder-only design with
  published weights.

## History and attribution

OpenAI introduced GPT in 2018, pre-training a transformer decoder on unlabelled
text and fine-tuning it for tasks, and followed it with GPT-2 in 2019. Brown and
colleagues described GPT-3 in 2020: a 175-billion-parameter model whose
few-shot, in-context performance was the paper's central finding. Ouyang and
colleagues described InstructGPT in 2022, applying human-feedback fine-tuning,
and OpenAI published the GPT-4 technical report in 2023. The architecture rests
on the transformer of Vaswani and colleagues, 2017.

## Sources

Brown et al. establish in-context learning and the 175-billion-parameter scale.
Vaswani et al. give the transformer, including the masked self-attention a
decoder uses. Ouyang et al. describe instruction tuning with human feedback and
the smaller-model preference result. The GPT-4 technical report is the source for
its stated limitations and for what it chose not to disclose.

## Prerequisites and next connections

Read [Transformers](./transformers.md) and [Attention](./attention.md) for the
architecture, and [Tokenization](./tokenization.md) for what the model actually
reads.

From here, [BERT](./bert.md) is the encoder-side counterpart,
[RLHF](./rlhf.md) is how base models become assistants, and
[Agents](./agents.md) is what happens when the model's outputs become actions.
