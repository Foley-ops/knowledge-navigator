---
concept_id: concept.nlp.tokenization
title: Tokenization
slug: /concepts/tokenization
aliases:
  - Text tokenization
  - Subword tokenization
  - Vocabulary construction
kind: method
tier: 1
review_state: generated-draft
summary: The step of splitting raw text into a sequence of discrete tokens and mapping each token to an integer index through a vocabulary, choosing a granularity between character, word, and subword units, with an unknown-token slot standing in for words the vocabulary never saw.
categories:
  - Artificial Intelligence/Domains/Natural Language Processing
primary_category: Artificial Intelligence/Domains/Natural Language Processing
relationships:
  - type: prerequisite_of
    target: concept.nlp.embeddings
    note: Embeddings are a lookup of one vector per vocabulary entry, so the embedding table is sized by, and defined on, the vocabulary tokenization produces.
  - type: prerequisite_of
    target: concept.nlp.bert
    note: BERT consumes WordPiece subword tokens as its input units; without a page of vocabulary and subword segmentation, its input representation is unreadable.
  - type: prerequisite_of
    target: concept.deep_learning.recurrent_neural_networks
    note: Sequence models take a list of token indices as input, with each time step one token, so tokenization defines what those steps are.
  - type: prerequisite_of
    target: concept.deep_learning.transformers
    note: Transformer layers operate over sequences of position vectors, and each position vector comes from the token at that position.
sources:
  - source_id: source.zhang2023.d2l
    title: Dive into Deep Learning
    url: https://d2l.ai
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-23
  - source_id: source.kudo2018.sentencepiece
    title: 'SentencePiece: A simple and language independent subword tokenizer and detokenizer'
    url: https://arxiv.org/abs/1808.06226
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-23
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-23
unresolved_references:
  - label: Language models
    reason: The Zipf's-law statistics and the OOV motivation on this page exist largely because language models must model a long tail of rare words; that is named in plain text without a page to link to.
    sections:
      - why-it-matters
      - variants-and-alternatives
    blocking: false
    proposed_kind: concept
    proposed_categories:
      - Artificial Intelligence/Domains/Natural Language Processing
claims:
  - claim_id: claim.nlp.tokenization.unit_choice
    section: definition
    statement: The chapter defines tokens as the indivisible units of text with one time step per token, and states that what exactly counts as a token is a design choice, with characters, words, and word pieces as the common choices.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §9.2.2 and §9.2.6 summary
  - claim_id: claim.nlp.tokenization.granularity_tradeoff
    section: intuition
    statement: "The sentence \"Baby needs a new pair of shoes\" tokenizes to 7 words over a vocabulary of tens or hundreds of thousands of entries, or to 30 characters over a vocabulary of at most 256 distinct ASCII characters."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §9.2.2
  - claim_id: claim.nlp.tokenization.unk_token
    section: formal-treatment
    statement: Rare vocabulary elements are dropped by a frequency cutoff, and any token encountered at training or test time that was unseen or dropped is represented by a reserved <unk> token.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §9.2.3 and the Vocab class implementation
  - claim_id: claim.nlp.tokenization.zipf
    section: why-it-matters
    statement: "Word frequency follows Zipf's law, the frequency n_i of the i-th most frequent word behaving as n_i is proportional to 1 / i^alpha (Equations 9.2.1 and 9.2.2), a power law that is roughly a straight line on a log-log plot after the first few words; the same holds for bigrams and trigrams with a smaller exponent."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §9.2.5, Eqs. 9.2.1-9.2.2, and the unigram/bigram/trigram plots
  - claim_id: claim.nlp.tokenization.rare_ngrams
    section: limitations-and-common-mistakes
    statement: Many n-grams occur very rarely, so counting-based language statistics overestimate the tail of infrequent words and make some methods unsuitable for language modeling.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §9.2.5
  - claim_id: claim.nlp.tokenization.bpe
    section: variants-and-alternatives
    statement: Byte pair encoding starts from a vocabulary of single characters plus special symbols and iteratively merges the most frequent pair of consecutive symbols within words, never across word boundaries, and uses the learned symbols to segment words; the chapter notes that BPE and its variants are used for input representations in GPT-2 and RoBERTa.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.6.2 and the BPE implementation
  - claim_id: claim.nlp.tokenization.fasttext
    section: variants-and-alternatives
    statement: fastText models inflected forms of the same word by character n-gram subwords of length 3 to 6, so that a word's vector is the sum of its subword vectors, and that shares structure across similarly shaped words, rare words, and even out-of-vocabulary words.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.6.1, Eq. 15.6.1, and the discussion of shared parameters
  - claim_id: claim.nlp.tokenization.morphology
    section: variants-and-alternatives
    statement: "The motivation for subword tokenization in the chapter is morphological: different inflected forms of the same word, and cross-language morphology such as the case-richness of Finnish, have no shared parameters under word-level tokenization."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.6 introduction and §15.6.1
  - claim_id: claim.nlp.tokenization.corpus_dependence
    section: limitations-and-common-mistakes
    statement: "The result of the tokenization is corpus-dependent: the same BPE procedure gives different subwords on different datasets, and the fastText vocabulary (and so the parameter count) grows with the corpus, so a vocabulary learned for one corpus may be a poor fit for another."
    status: conditional
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §9.2.2 (token is a design choice); §15.6.2 (BPE result depends on the dataset)
---

## Definition

**Tokenization** is the step of a preprocessing pipeline where raw text — loaded as
strings into memory — is split into a sequence of discrete **tokens**, and those
tokens are mapped to integer indices through a **vocabulary**. It is the boundary
between the symbol world (characters, words, subwords) and the numerical world
(model inputs) in natural language processing. A token is the atomic, indivisible
unit of text; what exactly counts as one token — a character, a word, a subword,
or some other unit — is a design choice, not a fixed fact.

In the pipeline described in *Dive into Deep Learning*, tokenization sits between
reading the dataset and feeding it to a model. The full pipeline is: (1) load the
raw text into memory as strings, (2) split the strings into tokens, (3) build a
vocabulary that associates each distinct token with a numerical index, and (4)
convert the text into a sequence of those indices. Steps 2 and 3 together are
tokenization in the sense used here; step 4 is the mechanical application of the
vocabulary. The output is a two-component object: a list of integers (the corpus,
in index form) and the vocabulary that defines what each integer means.

## Why it matters

Tokenization is what makes a neural language model possible. Models consume
sequences of numerical vectors; the token-id sequence is the bridge from the
unbounded variety of natural language to the finite, learnable parameter space of
the model. Without a vocabulary to map tokens to indices, every input would be a
new, unlearned row in an embedding table, and generalization across similar words
would be impossible.

The chapter's §9.2.5 gives the statistical reason a vocabulary must be small yet
rich. Word frequencies follow **Zipf's law**: the frequency $n_i$ of the $i$-th
most frequent word is proportional to $1/i^{\alpha}$ (Eq. 9.2.1), which is
equivalent to $\log n_i = -\alpha \log i + c$ (Eq. 9.2.2). On a log-log plot this
is a straight line after the first few words. The same law applies to bigrams and
trigrams, with a smaller exponent. The practical consequence is that a small
number of tokens (function words, common nouns) carries most of the training
signal, while a long tail of rare words and n-grams each appear once or a few
times. A counting-based model that treats every word or n-gram as an independent
parameter overestimates the tail and is unsuitable for language modeling; a
subword or context-based model can share structure across the tail, and that is
what tokenization must allow.

The granularity choice is also a capacity choice. A character-level vocabulary has
at most a few hundred entries and never sees an out-of-vocabulary token; a
word-level vocabulary may have tens or hundreds of thousands of entries and is
prone to OOV at test time; a subword vocabulary lands in between and carries
morphological structure in the subword boundaries.

## Intuition

Think of tokenization as choosing a **unit of identity**: what counts as "the
same thing" across different sentences. If the unit is a character, "cat" and
"cats" are just different strings of characters, and the model must learn on its
own that they are related. If the unit is a word, "cat" and "cats" are two
different vocabulary entries with two different vectors, and the model must learn
the relationship between those two vectors from co-occurrence. If the unit is a
subword (as in BPE), "cat" and "cats" may share the subword "cat" as a component,
and the relationship is partly built into the representation by construction.

The chapter's example in §9.2.2 captures the trade-off concretely. The sentence
"Baby needs a new pair of shoes" can be represented as 7 words, with a vocabulary
of tens or hundreds of thousands of entries, or as 30 characters, with a
vocabulary of at most 256 distinct ASCII characters. The word representation is
shorter and carries more meaning per token, but the vocabulary is much larger and
more likely to encounter an unknown word. The character representation is smaller
and more robust, but the sequence is longer and each token carries less linguistic
structure. A subword scheme aims to get the benefits of both: a vocabulary large
enough to encode morphological structure, but small enough that rare and
out-of-vocabulary words can still be segmented into known pieces.

The picture breaks down when the token unit does not respect the linguistic
structure of the language it is applied to. A BPE model trained on English word
boundaries will segment a Finnish noun differently from the way Finnish morphology
would decompose it, because BPE is a statistical compression, not a linguistic
analysis. The subword boundaries are useful, but they are not the same as word
boundaries or morpheme boundaries, and treating them as such is a common
conflation.

## Concrete example

The chapter's Time Machine corpus (H. G. Wells, *The Time Machine*, roughly
30,000 words) is a clean, small-scale worked example. After preprocessing —
stripping punctuation and lowercasing — the text is tokenized into
**characters**, giving a flat list of token strings. The vocabulary is built from
the distinct characters present, plus the reserved `<unk>` token. The resulting
pair — corpus of 173,428 token indices and a vocabulary of 28 entries — is the
complete input to downstream models: a list of small integers and a 28-entry
table mapping integers back to their token strings.

If instead the corpus were tokenized by **words** (splitting on whitespace), the
vocabulary would be the set of distinct words in the book. The chapter prints the
ten most frequent: "the" appears 2,261 times, "i" 1,267, "and" 1,245, "of"
1,155, "a" 816, "to" 695, "was" 552, "in" 541, "that" 443, "my" 440. The 10th
most frequent word is less than one fifth as common as the most frequent, which
is already a strong decay. The full frequency distribution, plotted on a log-log
scale, is roughly a straight line after the first few words — Zipf's law in
action.

A PyTorch snippet that mirrors the chapter's `Vocab` class:

```python
import collections
import torch

def make_vocab(tokens, min_freq=0, reserved=('<unk>',)):
    counter = collections.Counter(tokens)
    freqs = sorted(counter.items(), key=lambda x: x[1], reverse=True)
    idx_to_token = sorted(set(reserved) | {t for t, f in freqs if f >= min_freq})
    token_to_idx = {t: i for i, t in enumerate(idx_to_token)}
    unk = token_to_idx['<unk>']
    def encode(tokens):
        if isinstance(tokens, str):
            return token_to_idx.get(tokens, unk)
        return torch.tensor([encode(t) for t in tokens], dtype=torch.long)
    def decode(ids):
        if torch.is_tensor(ids) and ids.dim() > 1:
            return [idx_to_token[int(i)] for i in ids.flatten()]
        return [idx_to_token[int(i)] for i in ids]
    return encode, decode

encode, decode = make_vocab(list("the cat sat on the mat"))
ids = encode(list("the cat sat on the mat"))
print(ids)          # tensor of integer token indices
print(decode(ids))  # back to the original token strings
```

The round-trip property is worth noting: the mapping is reversible, and no
information is lost in the conversion from strings to indices, as long as the
vocabulary covers the tokens seen. This is not true in the same way for subword
tokenization, where the segmentation itself is learned and the reconstruction
from subwords back to characters is deterministic only if the subword vocabulary
is known.

## Formal treatment

Let $\Sigma$ be a finite alphabet (the set of possible token strings, whether
they are single characters, whole words, or subwords). A **tokenization** of a
corpus $\mathcal{D}$ is a procedure

$$
T: \Sigma^{*} \to V^{*}, \qquad V \subseteq \Sigma^{*},
$$

where $V$ is the vocabulary — a finite set of token strings — and each token in
the sequence is drawn from $V$. A **vocabulary mapping** is a bijection

$$
\iota: V \to \{0, 1, \dots, |V| - 1\},
$$

which the vocabulary class stores both ways: `token_to_idx` and `idx_to_token`.
The corpus is then represented as the index sequence
$\iota(T(x)) \in \{0, \dots, |V|-1\}^{*}$ for each text $x$.

The vocabulary is typically built with a **frequency cutoff**: a parameter
$\min\text{-freq}$ such that only tokens with observed frequency at least
$\min\text{-freq}$ in the training corpus enter $V$, and a reserved set of
special tokens (at minimum `<unk>`, and in practice sentence delimiters, padding
tokens, etc.) are always included. The chapter's `Vocab` class implements this
directly: it counts token frequencies with `collections.Counter`, sorts them,
drops those below `min_freq`, and prepends `<unk>` and any reserved tokens.

For **subword** tokenization, the vocabulary $V$ is not given but **learned** from
the corpus. In byte pair encoding (BPE), the initial vocabulary is the set of
single characters plus special symbols, and the algorithm iteratively **merges**
the most frequent pair of consecutive symbols (within words, never across word
boundaries) into a new symbol, adding it to the vocabulary, until a target
vocabulary size is reached. The merge sequence is corpus-specific: the same
algorithm on a different corpus produces a different set of subwords.

In **fastText**, the subwords are character $n$-grams of length 3 to 6 (plus the
full word as a special subword), and a word's representation is the sum of its
subword vectors, $\mathbf{v}_w = \sum_{g \in G_w} \mathbf{z}_g$ (Eq. 15.6.1).

The **unknown-token problem** is handled by the `<unk>` slot: any token not in
$V$ maps to $\iota(\langle\text{unk}\rangle)$, a single shared index. This is a
lossy compression — all unseen words collapse to one value — and it is precisely
the problem that subword methods try to mitigate.

## Assumptions and requirements

Tokenization as used in neural language models assumes that the vocabulary is
**fixed at training time** and known at inference time. The vocabulary is part of
the model artifact: it must be saved alongside the model weights and loaded
before inference. A model trained with one vocabulary cannot be meaningfully run
with a different one, because the embedding rows correspond to vocabulary
positions.

It assumes that the token boundary is a meaningful unit of linguistic or
statistical structure. For character-level tokenization this is true at the
lowest level (characters are the atomic units of the writing system), but the
model must learn all higher-level structure from co-occurrence. For word-level
tokenization the assumption is stronger: that whitespace (or some equivalent
delimiter) reliably marks word boundaries, which is not true in all languages
(e.g., Chinese, Japanese, and Thai do not use spaces between words). The chapter
does not address non-space-delimited scripts; this is a real limitation for
worldwide applicability.

It assumes that the training and test distributions share a similar vocabulary.
If the test corpus uses words, subwords, or morphological patterns that were
absent from the training corpus, those inputs map to `<unk>` or are segmented
into subwords that were never seen together during training, and the model's
behavior in that regime is untestable and unreliable.

## Uses and applicability

Reach for tokenization whenever a language model — recurrent, transformer, or
otherwise — must consume text. The specific scheme (character, word, BPE,
fastText) should be matched to the model's inductive biases and the language's
morphological complexity.

Character-level tokenization is appropriate when the vocabulary must be
extremely small and robust (e.g., low-resource languages, or tasks where
orthographic variation is itself the signal). Word-level tokenization is
appropriate when the language has clear word boundaries and the corpus is
large enough that the vocabulary covers the test distribution well. Subword
tokenization (BPE, SentencePiece, WordPiece) is the default for modern
pre-trained language models: it balances vocabulary size against OOV robustness,
and it carries morphological structure in the subword boundaries.

The tokenization scheme should be chosen **before** the model is trained, not
after. Changing the tokenization after training requires retraining from scratch,
because the embedding table dimensions and the vocabulary mapping both change.

## Limitations and common mistakes

The most common mistake is treating `<unk>` as a mild inconvenience. In
practice, if a significant fraction of test tokens map to `<unk>`, the model is
effectively blind to a portion of its input, and no amount of capacity in the
network compensates for the information loss that happened before the first
layer. The fix is not a bigger model but a better tokenization: subword methods
exist precisely to shrink the OOV rate without exploding the vocabulary.

Another mistake is assuming that subword boundaries are linguistically meaningful.
They are statistically frequent contiguous sequences, not morphemes. A BPE
vocabulary trained on English will not respect Finnish case morphology, and a
model that treats subwords as morphemes will build wrong priors on top of
arbitrary boundaries. The subword boundaries are a modeling choice, not a
linguistic fact.

A third mistake is mixing up the vocabulary size with the sequence length.
Tokenizing by characters makes the sequence longer and the vocabulary smaller;
tokenizing by words does the opposite. Both affect model cost: a longer sequence
increases the cost of recurrent processing (linear in sequence length) or
quadratic attention (quadratic in sequence length for transformers). The choice
of granularity is a cost-quality trade-off, not a free parameter.

## Variants and alternatives

**Character-level** tokenization: vocabulary is the alphabet (or a slightly
extended set including digits and common punctuation). Every string is in-vocabulary
by construction. Sequence length is proportional to text length in characters.
Used in early neural language models and in some low-resource settings.

**Word-level** tokenization: vocabulary is the set of distinct whitespace-delimited
strings (or their lemmatized forms). Sequence length is proportional to word
count. Vocabulary size is proportional to corpus size. Suffers from OOV at test
time.

**BPE (Byte Pair Encoding)**: learned subword segmentation via iterative merging
of the most frequent adjacent symbol pairs. Vocabulary size is a hyperparameter.
The chapter notes that BPE and its variants are used in GPT-2 (Radford et al.,
2019) and RoBERTa (Liu et al., 2019). SentencePiece (Kudo, 2018) and WordPiece
(Devlin et al., 2019, for BERT) are closely related subword tokenizers, but
their specific mechanisms are not detailed in the chapter text used here; they
are named for attribution only.

**fastText subwords**: fixed-length character $n$-grams (length 3 to 6) as the
subword units, with the word vector as the sum of subword vectors. The
vocabulary is the union of all subwords across all words; its size is not a
free parameter but a consequence of the corpus. The chapter notes that fastText's
vocabulary is larger than word-level, resulting in more parameters and higher
computational cost, but that rare and OOV words benefit from shared subword
structure.

The trade-off across these schemes is a single axis — **vocabulary size** — with
two consequences that move in opposite directions:
- Larger vocabulary → fewer OOV tokens, but larger embedding table and
  parameter count, and a greater chance that a given rare word is unseen.
- Smaller vocabulary → fewer parameters and more robust to unseen words (since
  more words are segmented into known pieces), but each token carries less
  linguistic information and the sequence is longer.

## History and attribution

Tokenization as a preprocessing step predates modern deep learning; the
bag-of-words representation and stop-word filtering (mentioned in §9.2.5) are
from the classical NLP era. The frequency statistics that motivate the
subword approach — Zipf's law and the power-law decay of n-gram frequencies —
were observed in that earlier period as well.

The subword methods that are now standard — BPE, fastText, SentencePiece,
WordPiece — are all from the 2015 to 2019 period, coinciding with the rise of
transformer-based pre-training. The chapter attributes BPE to Sennrich et al.
(2015), fastText to Bojanowski et al. (2017), and names GPT-2 and RoBERTa as
users of BPE-family tokenizers. BERT (Devlin et al., 2019) uses WordPiece, and
SentencePiece (Kudo, 2018) is the language-independent subword tokenizer
referenced in the source list for this page.

This page does not make claims about the internal mechanisms of BERT's WordPiece
or SentencePiece's unigram LM that are not supported by the chapter text used
here. The chapter text used here (d2l §9.2 and §15.6) covers BPE and fastText in
detail; the other methods are named for attribution.

## Sources

The primary source for this page is **Dive into Deep Learning** (Zhang, Lipton,
Li, Smola), specifically §9.2 (Converting Raw Text into Sequence Data) and §15.6
(Subword Embedding: fastText and Byte Pair Encoding). These sections provide the
definition of tokens, the character/word/subword spectrum, the vocabulary
construction with `<unk>` and frequency cutoff, the Zipf's-law statistics, the
BPE algorithm with its worked example, and the fastText subword sum formula.

The additional sources — **SentencePiece** (Kudo, 2018), **BERT** (Devlin et
al., 2019), and the BPE and fastText papers referenced in the chapter — are
cited for naming and attribution only. The chapter's own attribution of BPE to
Sennrich et al. (2015), fastText to Bojanowski et al. (2017), and the use of
BPE-family tokenizers in GPT-2 and RoBERTa is used directly; the additional
sources confirm the naming but no specific mechanism claims on this page are
drawn from them.

## Prerequisites and next connections

Read the [Embeddings](./embeddings.md) page next: the vocabulary and token
sequence produced by tokenization is exactly what the embedding table maps to
vectors, and the OOV problem discussed here is the input to the embedding
problem.

The [Recurrent Neural Networks](./recurrent-neural-networks.md) and
[Transformers](./transformers.md) pages both assume that their input is a
sequence of token indices; understanding where those indices come from — and
what happens when a token is out of vocabulary — is prerequisite to reading
their treatment of sequence modeling.

For the BERT-specific tokenization (WordPiece), see the
[BERT](./bert.md) page, which covers the model architecture; the specific
WordPiece mechanism is named there but its details are not the subject of this
page.

The statistics of language that this page draws on — Zipf's law, n-gram
frequency decay, stop words — are the foundation for the language modeling
literature that this corpus does not yet have a dedicated page for. The
concept of **language models** is referenced in plain text throughout this page
as the context in which tokenization choices matter; a dedicated page is
proposed as a gap (see `unresolved_references`).
