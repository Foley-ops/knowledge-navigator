---
concept_id: concept.applications.speech
title: Speech
slug: /concepts/speech
aliases:
  - speech processing
kind: concept
tier: 1
review_state: generated-draft
summary: Speech processing turns spoken language into text and text into speech, and its recognition half moved from hidden Markov models combining separate acoustic, pronunciation and language models to neural systems trained end to end.
categories:
  - Artificial Intelligence/Domains
primary_category: Artificial Intelligence/Domains
relationships:
  - type: requires
    target: concept.applications.audio
    note: Speech systems consume audio through the same sampled waveforms and spectrogram features as any audio model, so their front end is audio processing.
  - type: requires
    target: concept.probability.stochastic_processes
    note: Classical recognisers model speech as a hidden Markov process — an unobserved sequence of states emitting observed acoustic frames — so the Markov property and its algorithms come first.
sources:
  - source_id: source.rabiner1989.hidden_markov_models
    title: A Tutorial on Hidden Markov Models and Selected Applications in Speech Recognition
    url: https://ieeexplore.ieee.org/document/18626
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-25
unresolved_references:
  - label: Neural speech recognition and synthesis (CTC, attention encoder-decoders, self-supervised and large weakly supervised models)
    reason: Connectionist temporal classification, attention-based and transducer recognisers, self-supervised speech representations, large weakly supervised recognisers and neural text-to-speech are described from the wider literature; the registry holds only Rabiner's hidden Markov model tutorial for this topic.
    sections:
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Speech processing** is the family of tasks that connect spoken language and
text. Its central problem is **automatic speech recognition** (ASR): mapping an
audio recording to the words spoken. Alongside it sit **speech synthesis**, or
text-to-speech, which goes the other way; **speaker recognition**, which
identifies or verifies who is speaking; and tasks such as spoken language
understanding and speech translation that go beyond transcription.

## Why it matters

Speech is a natural human interface and a widely available one —
it needs no literacy, no keyboard and no free hands. Recognition makes spoken
content searchable and accessible through captions and transcripts; synthesis
gives voices to screen readers and assistants. And speech recognition was where
many ideas later central to machine learning were first developed at scale,
including hidden Markov models in practice and sequence training without aligned
labels.

## Intuition

Recognition is decoding a message sent through a noisy channel. A speaker has a
sequence of words in mind; it passes through pronunciation, the vocal tract,
the room and the microphone, arriving as sound. The recogniser asks which word
sequence most plausibly produced that sound — which depends both on how well the
words explain the acoustics and on how likely those words are to be said at all.
"Recognise speech" and "wreck a nice beach" sound alike; the second factor
decides between them.

The difficulty is that speech has no clean boundaries. Words run together, the
same phoneme sounds different in different contexts and voices, and the audio
contains far more frames than the text has characters, with no given alignment
between them.

## Concrete example

Recognition quality is measured by **word error rate**, the number of word
substitutions, deletions and insertions needed to turn the reference into the
recogniser's output, divided by the number of words in the reference:

```text
reference:  the  cat  sat  on  the  mat      (6 words)
hypothesis: the  bat  sat  on       mat
            ok   SUB  ok   ok  DEL  ok
```

One substitution and one deletion give a word error rate of
$2/6 \approx 33.3\%$. Had the recogniser only dropped the second "the", it would
be $1/6 \approx 16.7\%$. Because insertions count too, the rate can exceed
$100\%$ — a recogniser that outputs many spurious words can score worse than one
that outputs nothing.

## Formal treatment

Given acoustic observations $X = (x_1, \dots, x_T)$, recognition seeks the word
sequence

$$
\hat W = \arg\max_W P(W \mid X) = \arg\max_W P(X \mid W)\, P(W),
$$

by Bayes' rule, dropping $P(X)$, which does not depend on $W$. The **acoustic
model** supplies $P(X \mid W)$ and the **language model** supplies $P(W)$.

Classical systems realise the acoustic model with **hidden Markov models**:
hidden states with transition probabilities $a_{ij}$, each emitting an
observation with probability $b_j(x_t)$. Rabiner's tutorial organises their use
around three problems. **Evaluation** computes the probability of an observation
sequence with the forward recursion

$$
\alpha_t(j) = \Bigl[\sum_i \alpha_{t-1}(i)\, a_{ij}\Bigr] b_j(x_t).
$$

**Decoding** finds the most likely state sequence with the Viterbi algorithm,
which replaces the sum by a maximum. **Learning** fits the parameters with the
Baum–Welch algorithm, an instance of expectation–maximisation.

## Assumptions and requirements

- **The Markov assumption.** The next hidden state depends only on the current
  one, and each frame depends only on its state. Real speech has longer-range
  dependencies, which the classical models approximate.
- **Matched conditions.** Recognisers trained on clean, read speech degrade on
  noise, far-field microphones, accents and spontaneous speech not seen in
  training.
- **Enough transcribed speech,** or methods that learn from untranscribed audio,
  for each language and domain.
- **A normalisation convention.** Word error rate depends on how casing,
  punctuation and number formats are handled; two systems' rates are comparable
  only under the same normalisation.

## Uses and applicability

Speech recognition is used for captioning and transcription, voice assistants and
command interfaces, call-centre analytics, dictation, and as the front end of
spoken translation. Synthesis serves accessibility, assistants and dubbing.
Speaker recognition supports authentication, though it is vulnerable to recorded
and synthesised voices.

## Limitations and common mistakes

**Word error rate is not meaning.** Dropping "not" costs one word and reverses a
sentence; a transcript with low error can still be wrong where it matters.

**Unequal accuracy across speakers.** Error rates can differ substantially by
accent, dialect and age, so a single average hides who the system fails.

**Benchmark conditions are not deployment conditions.** Results on clean
benchmark sets overstate accuracy on real-world audio.

**Treating recognised text as certain.** Downstream systems that act on a
transcript should allow for recognition errors.

## Variants and alternatives

- **Hybrid systems** keep the hidden Markov structure but replace the emission
  model with a neural network.
- **Connectionist temporal classification** trains a network to output
  transcripts directly by summing over all alignments between frames and
  characters.
- **Attention-based encoder–decoder and transducer models** predict text from
  audio end to end, folding the acoustic and language models together.
- **Self-supervised pretraining** learns speech representations from untranscribed
  audio, and **large weakly supervised models** train on very large amounts of
  loosely transcribed audio for robustness across conditions.

## History and attribution

Statistical speech recognition was developed through the 1970s and 1980s, notably
at IBM and Carnegie Mellon, and Rabiner's 1989 tutorial became the standard
account of hidden Markov models and their use in recognition. Neural networks
replaced the Gaussian emission models around 2012, and end-to-end neural
recognisers became dominant over the following decade.

## Sources

Rabiner's tutorial is the source for the noisy-channel decomposition, hidden
Markov models, the three basic problems with the forward, Viterbi and Baum–Welch
algorithms, and the modelling assumptions of classical recognition. The neural
methods that followed are recorded as uncited.

## Prerequisites and next connections

Read [Audio](./audio.md) for the signal and its spectrogram, and
[Stochastic Processes](./stochastic-processes.md) for Markov chains.

From here, [Recurrent Neural Networks](./recurrent-neural-networks.md) and
[Transformers](./transformers.md) are the architectures of modern recognisers,
and [Tokenization](./tokenization.md) is how their text outputs are represented.
