---
concept_id: concept.applications.audio
title: Audio
slug: /concepts/audio
aliases:
  - audio signal processing
kind: concept
tier: 1
review_state: generated-draft
summary: Machine learning on audio starts from a sampled pressure waveform and usually works on a time-frequency picture of it — a spectrogram — whose construction decides what a model can and cannot hear.
categories:
  - Artificial Intelligence/Domains
primary_category: Artificial Intelligence/Domains
relationships:
  - type: requires
    target: concept.analysis.fourier_analysis
    note: The spectrogram that most audio models consume is a sequence of short-time Fourier transforms, so its frequency resolution, leakage and trade-offs are Fourier analysis applied frame by frame.
  - type: contrasts_with
    target: concept.analysis.wavelets
    note: A short-time Fourier transform analyses every frequency with the same window length, while a wavelet transform uses short windows for high frequencies and long ones for low, trading uniform resolution for multi-resolution analysis.
sources:
  - source_id: source.mit_ocw.signals_and_systems
    title: MIT 6.003 Signals and Systems (Fall 2011)
    url: https://ocw.mit.edu/courses/6-003-signals-and-systems-fall-2011/
    source_kind: lecture-or-course
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
    checked_on: 2026-09-25
unresolved_references:
  - label: Audio feature and model literature (short-time Fourier analysis, mel scale, MFCCs, WaveNet, spectrogram transformers)
    reason: The short-time Fourier transform, the mel scale's formula, mel-frequency cepstral coefficients, phase reconstruction from magnitude spectrograms, and the neural audio models named here come from the speech and audio literature; the registry holds only a signals-and-systems course for this topic.
    sections:
      - formal-treatment
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

In computing, **audio** is sound represented as a digital signal: air-pressure
variation captured by a microphone and **sampled** at regular intervals into a
sequence of numbers, the **waveform**. Machine learning on audio — recognising
sound events, separating sources, analysing music, generating sound — works
either directly on the waveform or, more often, on a **time-frequency
representation** that shows how the energy at each frequency changes over time.

## Why it matters

Sound carries information that no other sensor does: speech, alarms, machine
faults that are heard before they are seen, animal calls in ecological surveys,
music. Audio models power voice interfaces, hearing aids, noise suppression in
calls, content identification and accessibility tools. And because the raw
signal is so dense — tens of thousands of samples per second — the choice of
representation is among the most consequential design decisions.

## Intuition

A waveform is hard to read: a spoken vowel is a rapid wiggle whose shape says
little to the eye. Its structure lives in frequency. Chop the signal into short
overlapping frames, measure how much energy each frame has at each frequency,
and stack the results side by side: the **spectrogram**, an image with time
along one axis and frequency along the other. Vowels show as horizontal bands,
consonants as bursts, music as ladders of harmonics. Many audio models are in
effect image models reading this picture.

The picture has a built-in compromise. A long frame pins down frequency
precisely but smears when things happened; a short frame does the reverse. No
single window gives both, which is the time-frequency uncertainty the
representation cannot escape.

## Concrete example

A typical speech front end samples at $16$ kHz and uses $25$ ms frames with a
$10$ ms step:

```text
window  = 0.025 s x 16000 /s = 400 samples
hop     = 0.010 s x 16000 /s = 160 samples
frames in one second = 1 + floor((16000 - 400) / 160) = 98
```

A 400-sample window resolves frequency in steps of $16000/400 = 40$ Hz; padding
each frame to a 512-point FFT gives $257$ frequency bins spaced $31.25$ Hz apart.
One second of audio therefore becomes a $98 \times 257$ grid — the image a model
actually reads. Sampling at $16$ kHz captures frequencies up to $8$ kHz, enough
for intelligible speech, while music is usually sampled at $44.1$ kHz to reach
the top of human hearing.

## Formal treatment

A continuous signal band-limited to frequencies below $f_{\max}$ can be
reconstructed exactly from samples taken at a rate $f_s > 2 f_{\max}$; half the
sampling rate is the **Nyquist frequency**, and energy above it **aliases** onto
lower frequencies unless it is filtered out before sampling.

The **short-time Fourier transform** of a sampled signal $x[n]$ with window
$w[n]$ of length $N$ and hop $H$ is

$$
X[m, k] = \sum_{n=0}^{N-1} x[n + mH]\, w[n]\, e^{-2\pi i k n / N},
$$

for frame $m$ and frequency bin $k$. The spectrogram is $|X[m,k]|^2$, usually on
a log scale. The **mel scale** warps frequency toward perceived pitch, commonly
as $m = 2595 \log_{10}(1 + f/700)$, under which $1000$ Hz maps to about $1000$
mel and $4000$ Hz to about $2146$: resolution is spent where hearing is most
discriminating.

## Assumptions and requirements

- **Adequate sampling rate.** Anything above the Nyquist frequency is lost or,
  without an anti-aliasing filter, corrupts what remains.
- **Consistent preprocessing.** Sample rate, window, hop and scaling must match
  between training and use; a model trained on 16 kHz input degrades on 8 kHz
  telephone audio.
- **Short-term stationarity.** The STFT treats each frame as if its frequency
  content were steady for the frame's duration.
- **Level normalisation.** Loudness varies enormously between recordings, and
  models are sensitive to it unless inputs are normalised.

## Uses and applicability

Audio methods are used for speech recognition and synthesis, speaker
identification, sound-event detection in security and monitoring, predictive
maintenance from machine noise, music tagging, transcription and recommendation,
source separation and denoising, and bioacoustics. Spectrogram-based models are
the default starting point; raw-waveform models make sense when phase or very
fine timing matters.

## Limitations and common mistakes

**Discarding phase and expecting to invert.** A magnitude spectrogram throws
away phase, so turning one back into audio needs the phase estimated, which is
imperfect; generating audio through spectrograms needs a separate vocoder.

**Aliasing on downsampling.** Reducing the sample rate without low-pass
filtering first folds high frequencies into audible artefacts.

**Leakage between splits.** Clips cut from the same recording share microphone,
room and speaker; putting some in training and others in testing inflates
accuracy.

**Treating the spectrogram as an ordinary image.** Its axes are not
interchangeable — shifting along frequency changes a sound's pitch, and shifting
in time does not — so image-model priors transfer only partly.

## Variants and alternatives

- **Log-mel spectrograms and mel-frequency cepstral coefficients** are compact,
  perceptually motivated features; the coefficients were the standard for decades
  of speech recognition.
- **Wavelet and constant-Q transforms** give multi-resolution analysis, suited to
  music, whose pitches are spaced logarithmically.
- **Raw-waveform models** learn their own filterbank, as in WaveNet-style
  autoregressive generation.
- **Self-supervised and transformer audio models** learn general representations
  from unlabelled sound.

## History and attribution

Digital audio rests on the sampling theorem, associated with Nyquist, Shannon
and others working in the first half of the twentieth century, and on the fast
Fourier transform. The mel scale and cepstral features came from psychoacoustics
and speech research; deep learning moved the field from hand-designed features to
learned ones from the 2010s.

## Sources

MIT's signals and systems course covers sampling and aliasing, the Nyquist
criterion and the discrete Fourier transform, which are this page's foundations.
The short-time Fourier transform, the perceptual features and the neural models
are recorded as uncited.

## Prerequisites and next connections

Read [Fourier Analysis](./fourier-analysis.md) for the transform behind every
spectrogram, and [Wavelets](./wavelets.md) for the multi-resolution alternative.

From here, [Speech](./speech.md) builds spoken-language systems on these
representations, [Convolutional Networks](./convolutional-networks.md) are the
usual models for spectrograms, and [Time Series](./time-series.md) treats the
same kind of ordered data statistically.
