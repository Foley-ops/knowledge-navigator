---
concept_id: concept.nlp.embeddings
title: Embeddings
slug: /concepts/embeddings
aliases:
  - Word embeddings
  - Distributed vector representations
kind: concept
tier: 1
review_state: generated-draft
summary: Learnable real-valued vectors assigned to discrete tokens, trained self-supervised so that geometric closeness reflects semantic closeness, and used as a compact input representation for downstream language tasks.
categories:
  - Artificial Intelligence/Domains/Natural Language Processing
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Domains/Natural Language Processing
relationships:
  - type: requires
    target: concept.learning.self_supervised_learning
    note: word2vec and GloVe are trained self-supervised — skip-gram and CBOW predict surrounding words from the unlabeled corpus itself, and GloVe fits precomputed global co-occurrence counts rather than labeled data.
  - type: requires
    target: concept.deep_learning.stochastic_gradient_descent
    note: Every model family on this page (skip-gram, CBOW, GloVe, negative-sampling variants) is trained by stochastic gradient descent over (sub)sequence minibatches, and the negative-sampling formulation changes the per-step gradient cost from vocabulary-sized to |noise words|.
  - type: requires
    target: concept.machine_learning.logistic_regression
    note: negative sampling rewrites the skip-gram conditional probability as a sequence of sigmoid (logistic) classifications — true versus noise word pairs — so the loss is a sum of per-pair logistic terms.
  - type: requires
    target: concept.deep_learning.loss_functions
    note: The skip-gram and CBOW objectives are cross-entropy losses over the dictionary, negative sampling turns the objective into a logistic-loss sum, and GloVe replaces cross-entropy with a weighted squared log-bilinear loss.
  - type: contrasts_with
    target: concept.machine_learning.principal_component_analysis
    note: Both produce a low-dimensional linear structure from high-dimensional word data, but static vector methods here are trained to predict or fit co-occurrence rather than to explain variance in a factorized matrix.
  - type: prerequisite_of
    target: concept.nlp.bert
    note: the chapter frames word embeddings as the static baseline that contextual models refine — the same token keeps the same vector regardless of context, so contextual models are later refinements built on the same geometric idea.
  - type: useful_when
    target: concept.nlp.bert
    note: a trained contextual model supersedes a static vector for context-dependent meaning, so a static embedding is useful precisely when the token's meaning is context-invariant (lexicons, retrieval, analogy probes) or when a contextual model is too expensive.
  - type: unreliable_when
    target: concept.nlp.bert
    note: a static vector for "bank" is the same in "river bank" and "savings bank"; when a task needs context-dependent meaning, a static embedding is the wrong tool and a contextual model is.
  - type: prerequisite_of
    target: concept.deep_learning.transformers
    note: Transformer-based language models (including BERT) take token embeddings plus positional information as input, so a working notion of token embedding is prerequisite to reading those pages.
  - type: contrasts_with
    target: concept.deep_learning.recurrent_neural_networks
    note: Both aim to represent a sequence's meaning, but RNNs carry a running state and process positions in a fixed order, whereas the embedding schemes here are lookup tables over a (precomputed) vocabulary and are order-agnostic by construction.
  - type: requires
    target: concept.nlp.tokenization
    note: Embeddings map tokens to vectors, so what counts as a token (characters, words, subwords) comes first.
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
  - source_id: source.mikolov2013.word2vec
    title: Efficient Estimation of Word Representations in Vector Space
    url: https://arxiv.org/abs/1301.3781
    source_kind: preprint
    supports:
      - definition
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-23
  - source_id: source.devlin2019.bert
    title: 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding'
    url: https://arxiv.org/abs/1810.04805
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-23
unresolved_references: []
claims:
  - claim_id: claim.embeddings.onehot_similarity
    section: definition
    statement: Sparse one-hot word vectors cannot express similarity between different words — any two distinct one-hot vectors have cosine similarity 0 — which is the motivation for learnable dense vectors.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.1.1, Eq. 15.1.1 (cosine similarity) and the surrounding text; §15.1 (Word Embedding, word2vec)
  - claim_id: claim.embeddings.skipgram_mle
    section: formal-treatment
    statement: 'The skip-gram model models the joint conditional probability of its context words given a center word — for the worked example, P("the","man","his","son" | "loves") with context window 2 — and, under conditional independence, this factorizes into a product of per-context-word probabilities; training is maximum-likelihood estimation of that product, equivalently minimizing the summed log-loss.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.1.3, Eqs. 15.1.2–15.1.5 and 15.1.6–15.1.8
  - claim_id: claim.embeddings.cbow_mle
    section: formal-treatment
    statement: "The continuous bag-of-words model inverts skip-gram's direction: it models P(center word | its surrounding context words), averages the context-word vectors, and is trained by the same maximum-likelihood procedure; it typically uses the context-word vector as the word representation."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.1.4, Eqs. 15.1.9–15.1.15
  - claim_id: claim.embeddings.neg_sampling
    section: variants-and-alternatives
    statement: Negative sampling rewrites the skip-gram objective as a binary logistic classification of (center, context) pairs — the true context word as a positive example and K noise words drawn from a predefined distribution as negative examples — so the per-step gradient cost is linear in K instead of in the vocabulary size.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.2.1, Eqs. 15.2.1–15.2.6, and the discussion that gradient cost is linear in K
  - claim_id: claim.embeddings.hierarchical_softmax
    section: variants-and-alternatives
    statement: Hierarchical softmax organizes the vocabulary into a binary tree, each leaf being one word, and replaces the dictionary-wide softmax with a path of per-node binary decisions, yielding O(log |V|) cost per training step for a word's path length.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.2.2 (including Fig. 15.2.1 and the O(log2|V|) discussion)
  - claim_id: claim.embeddings.glove_loss
    section: formal-treatment
    statement: 'GloVe fits a weighted squared log-bilinear objective over the symmetric global co-occurrence counts x_ij: sum_{i,j} h(x_ij) (u_j^T v_i + b_i + c_j - log x_ij)^2, where h is an increasing weight function that caps large counts (hence zero-count pairs drop out of the loss), and the center-word and context-word vectors are mathematically equivalent and are averaged together as the output vector.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.5.2, Eq. 15.5.4 and the following discussion (symmetry, averaging of the two vectors, the suggested h(x) = (x/c)^alpha)
  - claim_id: claim.embeddings.subword_sum
    section: formal-treatment
    statement: In fastText a word's skip-gram center vector is the sum of the vectors of its character n-gram subwords of length 3 to 6 plus the special full-word token, and the rest of the model is identical to skip-gram; this lets rare and even out-of-vocabulary words obtain representations from shared subword parameters.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.6.1, Eq. 15.6.1 and the surrounding text
  - claim_id: claim.embeddings.similarity_analogy
    section: uses-and-applicability
    statement: After training, embeddings are applied to word-similarity lookup (ranking dictionary words by cosine similarity to a query) and to word-analogies — for an analogy a:b::c:d, retrieve the word whose vector is nearest to vec(c) + vec(b) - vec(a).
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.4.3 and §15.7.2 (word similarity, get_similar_tokens / knn; word analogy, get_analogy)
  - claim_id: claim.embeddings.static_limitation
    section: limitations-and-common-mistakes
    statement: Static word embeddings assign one fixed vector to a token no matter what surrounds it — the vector for "bank" is the same in "river bank" and "savings bank" — so context-dependent meaning is outside what they can express; contextual models such as BERT are the refinement that addresses this limit.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15 (chapter introduction, the "bank" example)
      - source_id: source.devlin2019.bert
        locator: BERT's framing as a contextual successor to static embeddings (Abstract, Section 3, and Appendix's GPT comparison)
  - claim_id: claim.embeddings.bpe_usage
    section: variants-and-alternatives
    statement: Byte pair encoding iteratively merges the most frequent adjacent pair of symbols (never across word boundaries) from an initial single-character vocabulary into longer symbols, and its variants are the subword tokenization used by GPT-2 and RoBERTa.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §15.6.2 (BPE) and the note about GPT-2 and RoBERTa
---

## Definition

An **embedding** is a compact real-valued vector representation of a discrete symbol — a word, a subword, or any other token — learned from data, where geometrically close vectors are semantically related and far-apart ones are not. The canonical case for this page is _word_ embedding: a mapping from a vocabulary of $N$ distinct words to a vector space $\mathbb{R}^{d}$ with $d \ll N$, replacing the one-hot representation (an $N$-dimensional 0/1 vector) that cannot express similarity at all — the cosine similarity of any two distinct one-hot vectors is zero.

Word embeddings come from two training families. The first is _predictive_: skip-gram predicts the context of a center word, CBOW predicts the center word from its context, and both are self-supervised (their supervision is the unlabeled corpus itself). The second is _global_: GloVe fits the symmetric precomputed co-occurrence matrix of the whole corpus with a weighted log-bilinear objective. Both families are trained with a shared vocabulary of vectors, and the learned vectors are then _used_ as inputs to downstream models, not as the model itself.

The word "embedding" here is broader than a specific model: it names the idea of representing discrete symbols by points in a fixed-dimensional space so that a distance metric and linear operations over that space become meaningful tools. The models on this page — word2vec (skip-gram, CBOW), GloVe, fastText — are all _token_ embeddings over a word or subword vocabulary, and the distinction from the contextual token embeddings of BERT and the like is itself one of the most important contrasts in modern NLP: static vectors are the baseline that contextual models refine, not a rival method.

## Why it matters

The practical problem word embeddings solve is the _sparsity_ of one-hot inputs. A one-hot representation has $N$ dimensions but carries one bit of signal per example — the position of the single $1$ — so any similarity metric between two such vectors is degenerate: distinct words are perfectly orthogonal, and the model is forced to relearn from scratch that "ice" and "solid" are related or that "man" and "woman" stand in a sex relation. Embedding replaces that with a $d$-dimensional representation in which related tokens share structure, so downstream models inherit that structure from the start.

The training cost is what makes it usable at scale. The predictive methods (word2vec) are self-supervised — the labels are other tokens in the same unlabeled corpus — and the approximate-training tricks (negative sampling, hierarchical softmax) bring the per-step cost from vocabulary-sized down to a fixed small constant. GloVe takes the opposite route: it precomputes the entire global co-occurrence matrix and then fits a much smaller weighted regression to it; that is a single, deterministic training problem instead of a streaming one, which is what its name (Global Vectors) points at.

Once trained, the vectors are cheap to use: a single lookup plus a distance or arithmetic operation replaces a full model forward pass for tasks like semantic search, lexical clustering, and analogy probes. That cheapness and their geometric interpretability are exactly what make them the standard _input representation_ for downstream language models including BERT, which uses them as the per-token initialization layer before adding positional and segment information and running the transformer stack.

## Intuition

The picture to hold is that related words occupy nearby regions of a shared space, and that a single linear transformation can move between two semantic relations. Concretely: if the vectors for "man" and "woman" sit in a row (with the direction "sex" as the offset between them), then the vectors for "king" and "queen" should sit in a parallel row in the same direction. So "man → woman" is the geometric arrow that "king → queen" re-enacts, and the analogy-probe trick — take `vec("king") - vec("man") + vec("woman")` and look for the nearest vector — is just reading off that arrow. The chapter's worked examples of this sort (e.g. "man:woman :: son:daughter") are the most direct way to _see_ that the space is not just a bag of similarities but has some linear structure that reflects systematic semantic relations.

That linear structure is the part that is easy to overstate. The analogy probe works well for a handful of clean relation pairs (king/queen, man/woman, city/country); it is a _demonstration_ of the learned structure, not a general-purpose tool, and it depends on the probe relation having a consistent geometric signature across the pairs being compared. The chapter's "similar word" and "analogy" sections are the canonical way to verify that the vectors have learned something real: if the closest vector to "solid" is "ice" and the closest to "steam" is "gas", the geometry is doing semantic work; if the closest vector to most probes is some unrelated word, the geometry is not.

The second intuition is _why the two families agree on most of the space_. Skip-gram predicts context from center — a direction in the model space. CBOW predicts center from context — the transposed direction. GloVe fits a symmetric co-occurrence matrix — no direction, just a symmetric structure. All three are maximizing, in their own way, a similarity between "how often this pair of words co-occurs in a shared context window" and the geometric dot product of their vectors. When the corpus statistics are dominated by a small set of systematic co-occurrence patterns (which is what makes language predictable at all), all three methods learn a similar underlying geometry, and the differences — which direction of the pair is modeled, whether the pair is local or global, how the loss treats rare pairs — are visible mainly through the _shape of the loss surface_ they optimize.

## Concrete example

The chapter walks through a concrete skip-gram training example with the sentence "the man loves his son" and context window $m=2$. The center word is "loves"; the four context words are "the", "man", "his", "son"; and the conditional probability (under conditional independence) is $P(\text{the}, \text{man}, \text{his}, \text{son} \mid \text{loves}) = P(\text{the}\mid\text{loves})\,P(\text{man}\mid\text{loves})\,P(\text{his}\mid\text{loves})\,P(\text{son}\mid\text{loves})$, each factor being a softmax over the whole dictionary. A concrete numeric instantiation with a 5-word vocabulary (the vocabulary in the example) and hand-computed softmax scores is:

```python
import math

# vocabulary: the, man, loves, his, son
# arbitrary scores u_o^T v_c (center="loves", 1-indexed)
uT_v  = {"the": 1.0, "man": 0.0, "loves": -1.5, "his": 0.5, "son": -0.5}
Z     = sum(math.exp(s) for s in uT_v.values())     # 6.1967
p     = {w: math.exp(s) / Z for w, s in uT_v.items()}
for w in ("the", "man", "loves", "his", "son"):
    print(f"P({w:6s} | loves) = {p[w]:.4f}")

# joint probability under the conditional-independence assumption (Eq. 15.1.3)
joint = p["the"] * p["man"] * p["his"] * p["son"]
print(f"joint = {joint:.5f}")
```

This is the toy example the chapter uses to motivate skip-gram's training procedure and to show why the dictionary-size softmax is a bottleneck: with five words the normalizer is trivial, but at a real vocabulary of hundreds of thousands to millions, the same sum has to be evaluated at every context position of every training example.

A second concrete example is fastText's subword scheme applied to the word "where". With $n=3$, the subword set is the special token `<where>` plus the length-3 character n-grams (using the chapter's prefix and suffix markers) `<whe`, `her`, `ere>`:

```python
def fasttext_subwords(word: str, n: int = 3) -> list[str]:
    grams = [word[i:i+n] for i in range(len(word) - n + 1)]
    grams = ["<" + grams[0]] + grams[1:-1] + [grams[-1] + ">"]
    return ["<" + word + ">", *grams]

print(fasttext_subwords("where"))           # ['<where>', '<whe', 'her', 'ere>']
print(fasttext_subwords("tall"))            # ['<tall>', '<tal', 'all>']
```

A third concrete example is the BPE merge pass on the running chapter example `{'fast_': 4, 'faster_': 3, 'tall_': 5, 'taller_': 4}`. The first merge is `'ta'` (from `t a`), and after one merge pass the symbols are `ta tter all er_` with frequencies 5, 4, 5, 4. The vocabulary grows by one symbol per pass and the word tokens get shorter; the process halts when a target vocabulary size is reached.

```python
raw = {'fast_': 4, 'faster_': 3, 'tall_': 5, 'taller_': 4}
tokens = {f"{' '.join(t)}": f for t, f in raw.items()}

def max_pair(d):
    pairs = {}
    for tk in d:
        s = tk.split()
        for i in range(len(s) - 1):
            pairs[(s[i], s[i+1])] = pairs.get((s[i], s[i+1]), 0) + d[tk]
    return max(pairs, key=lambda k: pairs[k])

def merge(d, pair):
    out = {}
    for tk, f in d.items():
        if len(pair) == 2 and " ".join(pair) in tk:
            tk = tk.replace(" ".join(pair), "".join(pair), 1)
        out[tk] = f
    return out

for _ in range(3):
    p = max_pair(tokens); tokens = merge(tokens, p); print(p, tokens)
```

The output of the last pass shows `"ta"` and `"ta ller"` (i.e. `tall`), which is exactly the structure the chapter points to: BPE has learned to represent the shared root "tall" as a single symbol.

## Formal treatment

Let $x_1, \dots, x_T$ be a corpus of length $T$ over a vocabulary $V = \{1, \dots, N\}$ with $N$ distinct words, each with a center-word vector $v_i \in \mathbb{R}^d$ and a context-word vector $u_i \in \mathbb{R}^d$. (The two roles are reversed in CBOW; the model is identical modulo that swap.)

**Cosine similarity baseline.** For $x, y \in \mathbb{R}^d$, the cosine similarity $\frac{x^\top y}{\|x\| \|y\|} \in [-1, 1]$ (Eq. 15.1.1). For two distinct one-hot vectors $e_i, e_j$, $e_i^\top e_j = 0$ and $\|e_i\| = 1$, so the cosine similarity is exactly 0: one-hot vectors carry no similarity signal at all.

**Skip-gram (Mikolov et al., 2013).** Under conditional independence, for a context window of size $m$ the skip-gram objective is (Eq. 15.1.2–15.1.5)

$$
P(x_{t-j_1}, \dots, x_{t-j_k} \mid x_t) = \prod_{j \neq 0} \frac{\exp(u_{x_{t+j}}^\top v_{x_t})}{\sum_{i \in V} \exp(u_i^\top v_{x_t})}, \qquad P(w_o \mid w_c) = \frac{\exp(u_o^\top v_c)}{\sum_{i \in V} \exp(u_i^\top v_c)}
$$

and training minimizes the summed log-loss (Eq. 15.1.6). The per-pair log-probability is $u_o^\top v_c - \log \sum_{i \in V} \exp(u_i^\top v_c)$ (Eq. 15.1.7), and the gradient with respect to $v_c$ is $u_o - \sum_{j \in V} P(w_j \mid w_c)\, u_j$ (Eq. 15.1.8) — the full vocabulary appears in the gradient, which is why the model needs an approximate training method.

**CBOW.** Inverts the direction: $P(w_c \mid w_{o_1}, \dots, w_{o_{2m}})$ is a softmax over $u_i^\top \bar{v}_o$ where $\bar{v}_o = \frac{1}{2m}\sum_{o'} v_{o'}$ (Eqs. 15.1.9–15.1.11), and the log-loss is the same as skip-gram's with the roles of $u$ and $v$ swapped (Eqs. 15.1.13–15.1.15). The chapter notes that in CBOW the context-word vectors are the natural word representations, in skip-gram the center-word vectors are.

**Negative sampling (Eq. 15.2.1–15.2.6).** For a context window of $w_c$ and $K$ noise words sampled from a predefined distribution $P(w)$, replaces the dictionary-wide softmax with a logistic (sigmoid) loss per positive/negative pair:

$$
\mathcal{L} = -\log \sigma(u_o^\top v_c) - \sum_{k=1}^{K} \log \sigma(-u_{h_k}^\top v_c),
$$

where $\sigma(x) = \frac{1}{1+e^{-x}}$ is the sigmoid, the first term is the log-likelihood of the true context word and each negative term is the log-likelihood that the sampled noise word is _not_ in the window. The per-step gradient cost is linear in $K$ instead of in $|V|$, which is the whole point.

**Hierarchical softmax (Eq. 15.2.2 context; §15.2.2).** For a word $w_o$ with path of length $L(w_o)$ from root to leaf, replaces the dictionary softmax with a product of binary sigmoid decisions along that path; because the tree is binary, $L(w_o) = O(\log_2 |V|)$, so the per-step cost is logarithmic in the vocabulary.

**GloVe (Eq. 15.5.1–15.5.4).** $q_{ij} = \exp(u_j^\top v_i) / \sum_{k \in V} \exp(u_k^\top v_i)$ is the skip-gram conditional probability; the skip-gram loss over the whole corpus is $-\sum_{i,j} x_{ij} \log q_{ij}$ (Eq. 15.5.2) where $x_{ij}$ is the global co-occurrence count. GloVe replaces cross-entropy with a weighted squared log loss (Eq. 15.5.4):

$$
\sum_{i \in V}\sum_{j \in V} h(x_{ij}) \left( u_j^\top v_i + b_i + c_j - \log x_{ij} \right)^2,
$$

where $h(x) = (x/c)^\alpha$ for $x < c$ and $h(x) = 1$ otherwise (a suggested choice: $c = 100, \alpha = 0.75$). The weight function damps rare pairs and caps frequent ones; the zero-count pairs drop out of the sum. Because $x_{ij} = x_{ji}$, the center-word and context-word vectors of the same word are mathematically equivalent, and the chapter notes that in practice the two vectors are averaged together as the output.

**fastText (Eq. 15.6.1).** For a word $w$ with subword set $G_w$ (character $n$-grams of length 3 to 6 plus the special full-word token), the center-vector is $v_w = \sum_{g \in G_w} z_g$. The rest of the model is exactly the skip-gram model over the vocabulary of subwords — the vocabulary is larger (more parameters) and the per-word computation (summarizing its subword vectors) is more expensive, but the shared subword parameters are what enable rare- and out-of-vocabulary word representations.

## Assumptions and requirements

The models assume a stable _unlabeled_ corpus — the supervision is the corpus itself, so the corpus must be large enough that the co-occurrence statistics are dense enough to identify the geometry. word2vec assumes a fixed vocabulary; it can never recover a truly out-of-vocabulary token (fastText, by contrast, can, because it sums subword vectors and the subwords of a new word are still shared with the vocabulary of old words).

They assume a context window $m$ that is small enough to be sampled per step and large enough to carry a meaningful local co-occurrence signal; the chapter's examples use $m=2$ to keep the arithmetic tractable. The negative-sampling formulation assumes the noise-distribution $P(w)$ is well-behaved (it is not a parameter that the model tunes, and a bad distribution gives a bad loss). GloVe assumes precomputation of the full $N \times N$ co-occurrence matrix is tractable and symmetric in the corpus.

Training assumes a stochastic-gradient-descent schedule: the per-step cost is linear in the number of negative samples (negative sampling) or in the path length (hierarchical softmax) rather than in the vocabulary, and both are chosen to keep the per-step cost constant. The vocabulary size is chosen before training; the number of dimensions $d$ is chosen before training; both are hyperparameters, not estimated from the data.

BPE assumes an initial single-character vocabulary and a target symbol count; the merging is greedy by frequency and stops when the target is reached. The chapter's note that BPE never merges across word boundaries is itself an assumption: pairs crossing a word boundary are excluded from the frequency table.

## Uses and applicability

The chapter's "Applying word embeddings" and "Word similarity and analogy" sections are the canonical downstream uses:

1. **Semantic search / nearest neighbors.** Given a query word, rank all vocabulary words by cosine similarity and return the top-$k$. This works well when the vectors have been trained on a corpus where the query and the candidate words co-occur in a shared context.
2. **Word analogies.** Given a probe $a{:}b \mathrel{::} c$, find the word $d$ maximizing $\cos(v_d, v_c + v_b - v_a)$. This is the canonical demonstration of linear structure in the space.
3. **Input representation for downstream models.** The vectors (or their sums, or the fastText subword sum) are fed into a language model — a recurrent model, a transformer stack, a BERT-style encoder — as the per-token embedding layer, and the downstream model learns task-specific layers on top.
4. **Clustering and topic recovery.** A nearest-neighbor or k-means pass over the vector space yields a coarse semantic clustering of the vocabulary; this is a useful diagnostic, not a substitute for a proper topic model.

The static-versus-contextual distinction is the most important applicability constraint: a static word embedding is the right tool when the meaning is context-invariant (lexicons, retrieval, analogy probes, the input layer of a larger model), and the wrong tool when the meaning is context-dependent (the same "bank" in two different sentences). A contextual model such as BERT is the refinement that addresses the latter, and the two approaches are complementary rather than substitutes: a contextual model _uses_ a static embedding as its per-token initialization layer before adding positional and segment signals.

## Limitations and common mistakes

The most common mistake is reading the geometric arrows (the analogy probes) as a _general-purpose tool_ rather than a _demonstration_. The arrows work for a handful of clean relation pairs — "man:woman :: king:queen", "city:state :: Paris:France" — but they are not guaranteed to work for most probes, and a probe failure does not mean the model has failed; it means that the relation being probed has no consistent geometric signature in this particular trained space. The chapter's worked examples of this sort are exactly what to check first before trusting the vectors as a tool rather than as a representation.

A second recurring mistake is _treating a static word embedding as a substitute for a contextual embedding._ The chapter's "bank" example — the same vector for "river bank" and "savings bank" — is the canonical counterexample, and the BERT page on this corpus is the direct response to it. A static vector is the right tool when the token's meaning is context-invariant (lexicons, retrieval, analogy probes, input to a larger model) and the wrong tool when it is context-dependent (sentence-level tasks, the same token appearing in different syntactic roles). The two are not in competition: a contextual model uses a static vector as its per-token initialization, and the difference is the per-position, context-dependent layer on top.

A third mistake is confusing the _vocabulary size_ with the _number of dimensions_. The vocabulary $N$ is the number of distinct words in the corpus; the dimension $d$ is the length of the vector assigned to each word. Both are hyperparameters, both are chosen before training, and neither is estimated from the data. A large $N$ with a small $d$ is the norm (hundreds of thousands to millions of words, 50 to 300 dimensions); a large $d$ with a small $N$ is unusual and usually a sign that the vocabulary is too small to carry the intended information.

Finally, the analogy and similarity sections are _diagnostics_ of the learned geometry, not _objectives_. The chapter's "word analogy" and "word similarity" sections do not claim that the training objective is analogy completion; they use the fact that the learned vectors happen to have a linear structure that supports some analogy probes as evidence that the geometry is doing real semantic work. The training objective is the one described in the formal treatment (skip-gram, CBOW, GloVe, negative sampling, hierarchical softmax), and the analogy probes are _how you check that it worked_.

## Variants and alternatives

The chapter's "Approximate training" section is the cleanest statement of the main axis of variation. For the predictive family (word2vec), there are two approximate training methods:

- **Negative sampling** rewrites the skip-gram objective as a logistic (binary) classification per positive/negative pair; the cost is linear in the number of noise words $K$.
- **Hierarchical softmax** replaces the dictionary softmax with a binary-tree path of per-node binary decisions; the cost is logarithmic in the vocabulary.

These are the two standard approximations; the chapter presents them as alternatives, not as a hierarchy (neither is a special case of the other). Both are used in practice, and the choice is a matter of the noise-distribution $P(w)$ (negative sampling) or the tree structure (hierarchical softmax), plus the tolerance for per-step cost.

For the global family (GloVe), the main alternative to GloVe's weighted log loss is the unweighted cross-entropy objective (Eq. 15.5.2), which the chapter presents as the direct predecessor that GloVe improves on; the two differ in how they treat rare pairs (GloVe's weight function caps frequent pairs and damps rare ones, while cross-entropy treats all pairs by their raw count).

For the subword family, the two main schemes are:

- **fastText's character $n$-grams** (fixed lengths, typically 3 to 6) — the vocabulary is the set of all n-grams from all words, and a word's vector is the sum of its n-gram vectors.
- **BPE** (variable-length, iterative merges) — the vocabulary is built by greedily merging the most frequent adjacent pair of symbols, and the merges are chosen to grow the vocabulary toward a target size.

The chapter notes that BPE (and its variants) are the tokenization used by GPT-2 and RoBERTa, so BPE is the scheme that matters in practice for modern transformer models, and fastText's character n-grams are the scheme that matters for the fastText model itself. The two are not in competition either: a fastText model is a skip-gram over the n-gram vocabulary, and a BPE model is a transformer (or other architecture) over the BPE vocabulary, and the subword scheme is an input-level choice, not a model-level one.

## History and attribution

The word-embedding methods on this page are distributed across a short history of a few key papers:

- **word2vec (Mikolov et al., 2013)** — the skip-gram and CBOW models, the conditional-independence factorization, the softmax-over-the-dictionary training objective, and the use of the center-word vector (skip-gram) or the context-word vector (CBOW) as the word representation. The word2vec paper is the canonical reference for the predictive family.
- **GloVe (Pennington et al., 2014)** — the shift from a local, predictive objective to a global, co-occurrence-fitting objective; the weighted log-bilinear loss (Eq. 15.5.4); and the symmetric, averaged center/context vectors. The GloVe paper is the canonical reference for the global family.
- **fastText (Bojanowski et al., 2017)** — the character $n$-gram subword scheme, the fixed-length n-gram vocabulary (typically 3 to 6), and the per-word vector as the sum of the n-gram vectors (Eq. 15.6.1). The fastText paper is the canonical reference for the subword family.
- **BPE (Sennrich et al., 2015)** — the variable-length, iterative-merge subword scheme, used as the input tokenization by RoBERTa (Liu et al., 2019) and GPT-2 (Radford et al., 2019). The chapter's attribution of BPE to these three systems (GPT-2 and RoBERTa are named explicitly) is the direct line from BPE to the modern transformer stack.
- **BERT (Devlin et al., 2019)** — not an embedding method in the sense of this page, but the contextual successor to static word embeddings, and the reason the distinction between static and contextual vectors is one of the most important contrasts in modern NLP. BERT's token embeddings are the _input layer_ of the transformer stack, and the per-token, context-dependent vectors produced by the encoder are what the static methods cannot express.

The lineage is a short one, and the chapter's presentation of it — skip-gram and CBOW (2013), GloVe (2014), fastText (2017), BPE (2015), BERT (2019) — is the canonical order. Each step is a refinement of the previous one, and the last step (BERT) is the one that changes the object being embedded: a token-conditional representation rather than a token-level one.

## Sources

**Dive into Deep Learning** (Zhang et al., 2023) is the primary grounding for this page: the word2vec models (skip-gram and CBOW), the approximate-training section (negative sampling and hierarchical softmax), the GloVe model (the weighted log-bilinear loss, the symmetric co-occurrence view, the averaged center/context vectors), the fastText subword scheme, the BPE algorithm, and the word-similarity and word-analogy sections. The chapter's presentation is the source for every equation cited on this page (Eq. 15.1.1 through Eq. 15.6.1), and the section numbers (15.1.1 through 15.7.2) are used as-is for the locators in the claims array.

**Efficient Estimation of Word Representations in Vector Space** (Mikolov et al., 2013) is the original reference for the predictive family (skip-gram and CBOW) and is cited by the chapter at every point where the word2vec tool is named. It grounds the skip-gram and CBOW sections, the conditional-independence factorization, and the choice of which vector (center or context) to use as the word representation.

**BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding** (Devlin et al., 2019) is cited for the static-versus-contextual contrast that is the last and most important limitation on this page. Its framing — that a contextual model is the refinement that addresses the static vector's "bank" limitation — is what grounds the claim that a static embedding is the right tool for context-invariant tasks and the wrong tool for context-dependent ones.

## Prerequisites and next connections

Read the [Self-Supervised Learning](./self-supervised-learning.md) page first — the word2vec and GloVe methods are self-supervised (their supervision is the unlabeled corpus itself), and the "self-supervised" framing is what makes them usable at scale without a labeled dataset. Read the [Stochastic Gradient Descent](./stochastic-gradient-descent.md) page for the optimizer that every family on this page uses, and the [Loss Functions](./loss-functions.md) page for the cross-entropy, logistic, and weighted-squared-log objectives that appear in the formal treatment. The [Logistic Regression](./logistic-regression.md) page is the right model to hold in mind for the negative-sampling formulation (it is, per-pair, a sigmoid classification).

Read [Principal Component Analysis](./principal-component-analysis.md) as the contrast: both methods find a low-dimensional structure in high-dimensional word data, but PCA explains variance while the methods on this page fit a predictive or co-occurrence objective. Read [Recurrent Neural Networks](./recurrent-neural-networks.md) for the order-carrying, fixed-order sequence model that the embedding schemes on this page are deliberately contrasted against, and the [Transformers](./transformers.md) page for the architecture that consumes the embeddings and the per-token vectors that this page produces.

From here, the natural next read is [BERT](./bert.md), which is the contextual successor to the static embeddings on this page and the direct response to the "bank" limitation. The two pages are complementary: this page covers the token-level vectors and the methods that produce them, and the BERT page covers the per-token, context-dependent vectors and the architecture that produces them.
