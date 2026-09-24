---
concept_id: concept.nlp.bert
title: BERT
slug: /concepts/bert
aliases:
  - Bidirectional Encoder Representations from Transformers
  - BERT model
kind: concept
tier: 1
review_state: generated-draft
summary: A pretrained deep transformer encoder in which every token is modeled from both its past and future context, trained with masked-token prediction and tuned downstream for understanding tasks.
categories:
  - Artificial Intelligence/Domains/Natural Language Processing
  - Artificial Intelligence/Deep Learning — Architectures
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Domains/Natural Language Processing
relationships:
  - type: requires
    target: concept.deep_learning.transformers
    note: BERT is a transformer encoder stack, so the block structure (self-attention plus a position-wise feedforward sublayer, wrapped in residual and normalization) has to be understood first.
  - type: requires
    target: concept.deep_learning.attention
    note: Every BERT layer computes self-attention over the whole context; the mask that removes the causal constraint in a GPT-style decoder is what makes BERT bidirectional.
  - type: requires
    target: concept.deep_learning.layer_normalization
    note: Each sublayer is normalized so that a deep stack trains stably; the training recipe also uses dropout and weight decay.
  - type: requires
    target: concept.deep_learning.multilayer_perceptrons
    note: The second sublayer in every block is a two-layer feedforward network applied independently at each position, and it holds most of each layer's parameters.
  - type: requires
    target: concept.nlp.embeddings
    note: BERT's input layer maps each WordPiece token to a learned embedding vector (summed with position and segment embeddings), and its contextual representations are defined in contrast to static word embeddings.
  - type: contrasts_with
    target: concept.deep_learning.recurrent_neural_networks
    note: Both model sequences, but BERT mixes all positions in parallel through attention and reads them in both directions, whereas a recurrent network carries a state forward step by step in one fixed order.
  - type: requires
    target: concept.nlp.tokenization
    note: BERT's inputs are WordPiece subword tokens, so the tokenization step that produces them has to be understood first.
sources:
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-23
  - source_id: source.vaswani2017.attention_is_all_you_need
    title: Attention Is All You Need
    url: https://arxiv.org/abs/1706.03762
    source_kind: preprint
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-23
  - source_id: source.ba2016.layer_normalization
    title: Layer Normalization
    url: https://arxiv.org/abs/1607.06450
    source_kind: preprint
    supports:
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-23
  - source_id: source.mikolov2013.word2vec
    title: Efficient Estimation of Word Representations in Vector Space
    url: https://arxiv.org/abs/1301.3781
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-23
unresolved_references: []
claims:
  - claim_id: claim.bert.bidirectional_encoder
    section: definition
    statement: BERT models a text with a deep transformer encoder whose self-attention is unconstrained in direction, so each token's representation conditions on both its past and future context, not only its past as in a left-to-right language model.
    status: supported
    evidence:
      - source_id: source.devlin2019.bert
        locator: Abstract; Section 3 (Input/Output Representations); Appendix (comparison with GPT)
        note: Bidirectional self-attention is contrasted with GPT's left-only constrained attention.
  - claim_id: claim.bert.two_pretraining_tasks
    section: formal-treatment
    statement: Pre-training is a pair of objectives, Masked Language Modeling on corrupted single sentences and Next Sentence Prediction on whether two sentences are adjacent in the corpus.
    status: supported
    evidence:
      - source_id: source.devlin2019.bert
        locator: "Section 3.1 (Pre-training BERT, Task 1 Masked LM and Task 2 NSP)"
  - claim_id: claim.bert.mlm_mechanism
    section: formal-treatment
    statement: In masked language modeling, 15% of WordPiece tokens are replaced at random and the model must predict them from the full surrounding context; the feed-forward nonlinearity is GELU rather than ReLU.
    status: supported
    evidence:
      - source_id: source.devlin2019.bert
        locator: Section 3.1 (uniform 15% masking after WordPiece tokenization); detailed pre-training setup (GELU in place of ReLU, following OpenAI GPT)
  - claim_id: claim.bert.context_length
    section: assumptions-and-requirements
    statement: Sequences are limited to 512 token positions; training uses a shorter length for 90% of steps and length 512 for the remaining 10% to learn the positional embeddings.
    status: supported
    evidence:
      - source_id: source.devlin2019.bert
        locator: Input/Output section (512-token sequences); training setup (512 to learn positional embeddings)
  - claim_id: claim.bert.corpus
    section: history-and-attribution
    statement: Pre-training uses BooksCorpus (800M words) together with English Wikipedia (2.5B words), about 3.3 billion words in total.
    status: supported
    evidence:
      - source_id: source.devlin2019.bert
        locator: Section 3.1 (pre-training corpus) and corpus-size details
  - claim_id: claim.bert.model_sizes
    section: concrete-example
    statement: BERT-base is L=12 layers, H=768 hidden size, A=12 attention heads, reported at 110M parameters; BERT-large is L=24, H=1024, A=16, reported at 340M parameters.
    status: supported
    evidence:
      - source_id: source.devlin2019.bert
        locator: "Model-size statement (BERT BASE Total Parameters 110M; BERT LARGE Total Parameters 340M)"
  - claim_id: claim.bert.sized_like_gpt
    section: variants-and-alternatives
    statement: BERT-base was chosen to match the parameter size of OpenAI GPT for a direct comparison, the decisive difference being bidirectional versus left-only attention.
    status: supported
    evidence:
      - source_id: source.devlin2019.bert
        locator: Model-size and GPT-comparison discussion
        note: States the intent to match GPT while using bidirectional self-attention.
  - claim_id: claim.bert.glue_sota
    section: limitations-and-common-mistakes
    statement: BERT is frequently described as setting state-of-the-art scores on several GLUE tasks; that comparison is time-bound to the paper's baselines and is recorded here as unverified rather than restated as a permanent property.
    status: unsupported
---

## Definition

**BERT** (Bidirectional Encoder Representations from Transformers) is a language
representation model built from a stack of
[transformer](./transformers.md) encoder blocks. A [transformer](./transformers.md)
block is normally run one of three ways, and BERT commits to the encoder
configuration: its
[attention](./attention.md) sublayer is unmasked, so every position attends to
every other position in both directions, and the model is never required to predict
a token from its left context only. The input is a sequence of WordPiece
word tokens via subword tokenization (WordPiece); the first position carries a special
classification marker `[CLS]`, and the final hidden state at that marker is taken
as the representation of the whole sequence.

The training objective is what separates BERT from a plain auto-regressive
language model. Rather than predict "what comes next," it corrupts the input and
asks the model to fill the gaps: a fixed fraction of tokens are masked and the
model must recover them from the context on _both_ sides. That is a denoising,
or "cloze"-style, objective, and it is what justifies the claim of
bidirectionality — a left-to-right model would be leaking the answer to itself.

## Why it matters

Before BERT, the dominant way to get a word's meaning was a static vector, one
lookup row per token, learned to co-occur in training corpora. The vector for
"bank" is the same in "a river bank" and "a savings bank"; the model resolves the
ambiguity only later, at task time, from context it has already thrown away. A
unidirectional
recurrent language model keeps one side of the context and is structurally barred
from using the other. BERT removes both limits at once: it is bidirectional, and
the same network supplies a _contextual_ vector that depends on the whole
surrounding sentence, including what follows the token.

The practical consequence is that one pre-trained encoder can be adapted, with
only a small task head on top, to a wide range of _understanding_ tasks —
classification, named-entity tagging, question answering — by replacing or
retaining the prediction head while keeping the trunk. That single-trunk,
many-heads pattern is now the default shape of a text understanding pipeline.

## Intuition

Picture a multiple-choice reading-comprehension test where the test has been
torn up and every blank must be inferred from the rest of the passage. BERT's
pre-training is exactly that game at scale: hide 15% of the tokens, in the middle,
and train the network that reconstructs them. Because no causal mask is applied,
the network is free to look left and right — it is doing cloze inference, not
prediction.

The picture breaks in one place worth stating plainly. Bidirectional attention
does not make the model "understand" the sentence; it makes the network a strong
bidirectional _denoiser_. The second pre-training objective — deciding whether two
sentences sit next to each other — was added to push the model to represent the
relationship between spans, a proxy for reasoning that later work treated as
optional. The intuition holds for the architecture and the masking; it overstates
what the auxiliary objective contributes.

## Concrete example

Take the base configuration, which the paper reports as L = 12 layers,
H = 768 hidden size, A = 12 heads, with a feed-forward width of 4H = 3072 and a
30,000-token WordPiece vocabulary. Where the parameters actually live:

```python
L, H, FF, V, MAX = 12, 768, 4 * 768, 30_000, 512

# one encoder layer
attn_w, attn_b = 4 * (H * H), 4 * H          # Q, K, V, O weights, then biases
ffn_w, ffn_b   = H * FF + FF * H, FF + H     # position-wise feed-forward
ln             = 2 * (2 * H)                  # two layer norms (gamma + beta)
per_layer      = attn_w + attn_b + ffn_w + ffn_b + ln

emb = V * H + MAX * H + 2 * H                 # token + positional + segment
total = L * per_layer + emb

print(per_layer, "per layer")    # 7 087 872
print(total, "total")            # 108 489 216
```

That computes to 108,489,216 parameters — about 108.5M — versus the 110M the
paper reports; the paper's figure is a rounded value and the small gap is the
task heads and the exact bias convention the table folds into a round number.
The same decomposition, with L = 24 and H = 1024, gives a model the paper reports
at 340M. The feed-forward sublayer is the bulk of each layer: with FF = 4H it
holds $2 \cdot H \cdot FF = 2 \cdot 768 \cdot 3072 \approx 4.7$M of the 7.09M
per-layer parameters. Two readings of the same numbers:

```python
# what the [CLS] readout is used for, and why the mask must be symmetric
seq   = "[CLS] The cat sat [MASK] mat [SEP]"
# masked token -> predict the word 'on'/'the' from BOTH neighbors
# a causal model could only see 'cat', 'sat'; this one sees the whole line
```

## Formal treatment

Let $x_1, \dots, x_n$ be the token (subword) indices, $n \le 512$, and let
$E \in \mathbb{R}^{512 \times H}$ be the learnable positional matrix. The
forward map is the unmasked transformer encoder

$$
h = \operatorname{Enc}\big( E_{\text{tok}}[x] + E_{\text{pos}} + E_{\text{seg}} \big),
$$

where $\operatorname{Enc}$ is $L$ blocks of self-attention and a position-wise
feed-forward network, each wrapped in a
[layer](./layer-normalization.md) normalization and a skip connection, and the
attention sublayer applies no causal mask $M$: every dot-product score
$\frac{QK^\top}{\sqrt{H/A}}$ is taken over the full row. Pre-training minimizes
the sum of two losses on the same trunk:

1. **Masked LM**: for a set $\mathcal{M}$ of about 15% of WordPiece positions,
   $\sum_{i \in \mathcal{M}} \ell\big(\hat{w}_i, w_i\big)$, where the input at
   those positions is a single `[MASK]` token and the gradient flows from both
   flanks.
2. **Next Sentence Prediction**: a binary readout on the final layer deciding
   whether a second span is the literal successor of the first in the corpus.

The nonlinearity in each feed-forward sublayer is GELU, not ReLU. Because no
position is masked from attending to another, the model's forward pass on a
context is a permutation-equivariant, fully connected function of the token
set — order information enters only through the positional matrix, so the 512
upper bound on $n$ is a hard requirement, not a soft one.

## Assumptions and requirements

The context must fit in 512 positions. Anything longer is truncated or
chunked before the encoder is ever reached, and long-document reasoning is
therefore something the wrapper around BERT must arrange, not something the
encoder does for you.

It assumes a large unlabeled corpus. Pre-training is a denoising objective that
needs on the order of billions of words of text — about 3.3 billion in the
original — and it is a training-time cost, not an inference-time one: the benefit
is that the downstream task still needs only a modest labeled set.

It assumes the task is one of _understanding_ with a clear input and an answer
read off the sequence, not one of open-ended generation. Because the trunk is
already conditioned on the future, the same encoder is the wrong tool for
producing fluent free text — the decoder-only family does that. Finally, like
every transformer stack, it assumes depth is trainable, which the skip
connections and the normalizations are for.

## Uses and applicability

Reach for BERT when the task is to classify, tag, extract, or answer over a fixed
input. The recipe is stable: pre-train the encoder once on unlabeled text, then
fine-tune the whole trunk plus a light head — a classifier on `[CLS]`, a
per-token tagger, or a span head for questions — on the labeled set. That makes
it the natural base for sentiment and topic classification, named entities,
part-of-speech, and extractive question answering, and for the encoder half of
an encoder–decoder generator.

Do not reach for it to generate text: the unmasked trunk gives every token the
whole sequence, so it cannot sample next tokens causally in the way a
decoder-only model can. And do not reach for it when you have only a very small
labeled set and no unlabeled corpus to pre-train on — the transfer benefit is
exactly the unlabeled data that was spent before; with none of it, you are back
at a small supervised model.

## Limitations and common mistakes

The classic name invites a misreading. "Encoder" in BERT does not mean the weak
end of a sequence-to-sequence pair; it means the unmasked, bidirectional
configuration, and it has no decoder at all. Equally, "bidirectional" is a claim
about the attention mask, not about the model having a causal and an
anti-causal half — it is the absence of a causal constraint, and that is why it
works on both flanks at once.

A second recurring mistake is treating it as a one-size-fits-all generator and
discovering at generation time that the trunk has no causal structure to sample
from. And a third is the size: the base already runs at about 110M parameters and
512 tokens of context, which is a real memory and latency budget, and the
"large" model is a further doubling of width and depth. The 512-token limit is
routinely discovered only at fine-tuning time, after the pre-training cost has
already been paid.

Finally, the state-of-the-art GLUE numbers associated with it are a
publication-window fact, not a permanent property: scores are compared against
baselines and models available at that time, and "SOTA" is relative to a moving
field. The architectural claim — a bidirectional denoising encoder transfers to
many understanding tasks — is what should be carried forward, not any particular
score.

## Variants and alternatives

The direct relatives are the other transformer configurations. A decoder-only
stack is the GPT family — causal masking, next-token prediction — and the encoder–
decoder stack, the original machine-translation design. BERT and GPT differ
chiefly in that one direction: bidirectional versus left-only context. The
original BERT-base was in fact sized to match GPT for an apples-to-apples
comparison, which is why the two are the cleanest pair to study against each
other.

Going back in time, the alternatives are static word embeddings and the
unidirectional recurrent encoders around ELMo. Static vectors give one row per
token and cannot shift with context; a bidirectional recurrent encoder is
closer to BERT in reading both directions but still carries a fixed-order state
and cannot be trained in parallel across positions. BERT trades the flexibility
of those for parallel depth and purely contextual vectors. Other pre-training
objectives — including self-supervised schemes that avoid an explicit auxiliary
task — keep the same bidirectional trunk and differ mainly in the corruption
objective, which is where the NSP head was eventually dropped in practice.

## History and attribution

BERT was introduced by Devlin et al. (2019) at Google. It is explicitly framed as
a successor to the recent contextual models ELMo (Peters et al., 2018) and
OpenAI GPT (Radford et al., 2018), and as a response to a named limitation:
those models are unidirectional, which restricts the architectures usable during
pre-training. The paper's two claims are that this unidirectionality is a real
constraint, and that a bidirectional masked-objective encoder built on the
transformer blocks removes it.

The blocks themselves are the transformer of Vaswani et al. (2017), and the
normalization per sublayer is the layer normalization of Ba et al. (2016). The
idea of learning word vectors to capture distributional context, which BERT
makes contextual, reaches back to static vector methods such as the word
embeddings of Mikolov et al. (2013); the lineage is the same objective —
predict context — applied to an architecture deep enough to be bidirectional.

## Sources

**BERT: Pre-training of Deep Bidirectional Transformers for Language
Understanding** (Devlin et al., 2019) is the defining reference and grounds this
page: the bidirectional-encoder definition, the two pre-training tasks (masked
LM and next-sentence prediction), the 15% masking and GELU details, the 512-token
context and the 90/10 short/long training schedule, the corpus sizes (BooksCorpus
plus English Wikipedia, about 3.3 billion words), the base/large parameter
figures, the sizing-to-match-GPT comparison, and the ELMo/GPT and
transformer/normalization lineages. **Attention Is All You Need** (Vaswani et al.,
2017) is the architecture being reused, and it grounds the encoder block
structure and the unmasked-attention configuration.
**Layer Normalization** (Ba et al., 2016) grounds the per-sublayer normalization
that a deep stack relies on. **Efficient Estimation of Word Representations in
Vector Space** (Mikolov et al., 2013) is cited for the static-embedding
alternative that contextual representation supersedes in the alternatives
section.

## Prerequisites and next connections

Read the [Transformers](./transformers.md) page first — BERT is an
unmasked encoder stack, and the block structure is its whole substance — together
with the [Attention](./attention.md) page for the sublayer that the mask
relaxes. The [Layer Normalization](./layer-normalization.md) and skip-connection
pages explain the wrappers that make a deep stack trainable, and
[Multilayer Perceptrons](./multilayer-perceptrons.md) the feed-forward sublayer
that holds most of a layer's parameters. [Recurrent Neural
Networks](./recurrent-neural-networks.md) is the nearest family it contrasts
against: same goal of carrying context, different order and parallelism.

From here, the natural next read is
[Self-Supervised Learning](./self-supervised-learning.md) for what an unlabeled
denoising objective buys, and
[Transfer Learning](./transfer-learning.md) for why a pre-trained trunk plus a
light head is enough on top.
