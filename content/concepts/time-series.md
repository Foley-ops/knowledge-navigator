---
concept_id: concept.applications.time_series
title: Time Series
slug: /concepts/time-series
kind: concept
tier: 1
review_state: generated-draft
summary: A time series is a sequence of observations ordered in time, and analysing one means modelling how each value depends on the ones before it — the dependence that ordinary statistics assumes away is here the whole subject.
categories:
  - Artificial Intelligence/Domains
primary_category: Artificial Intelligence/Domains
relationships:
  - type: requires
    target: concept.probability.stochastic_processes
    note: An observed time series is treated as one realisation of a stochastic process, so stationarity, autocorrelation and the models built on them are all properties of that process.
  - type: contrasts_with
    target: concept.learning.supervised_learning
    note: Supervised learning usually assumes examples are independent and identically distributed, while a time series is defined by the dependence between neighbouring observations, which changes how models are fitted and, above all, how they are evaluated.
sources:
  - source_id: source.hyndman.forecasting_principles_practice
    title: 'Forecasting: Principles and Practice (3rd ed)'
    url: https://otexts.com/fpp3/
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
    checked_on: 2026-09-25
  - source_id: source.durrett.probability_theory
    title: 'Rick Durrett, Probability: Theory and Examples'
    url: https://services.math.duke.edu/~rtd/PTE/pte.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
    checked_on: 2026-09-25
unresolved_references:
  - label: History of time series analysis (Yule, Box and Jenkins)
    reason: The attribution of autoregressive models to Yule and of the ARIMA modelling methodology to Box and Jenkins is stated from the wider literature; no registry source documents that history.
    sections:
      - history-and-attribution
claims: []
---

## Definition

A **time series** is a sequence of observations of some quantity recorded in
time order, usually at regular intervals: daily sales, hourly temperature,
monthly unemployment, a sensor sampled every millisecond. What distinguishes it
from an ordinary dataset is that the order carries information — each value is
related to the values before it — and time series analysis is the study of that
dependence: describing it, modelling it, and using it to explain or predict.

## Why it matters

Much of the data that organisations and sciences care about arrives as time
series: demand, prices, traffic, energy load, physiological signals, climate.
Treating such data as a bag of independent points throws away its most useful
structure and, worse, produces misleading results — trends that look like
relationships, and model evaluations that quietly peek at the future. Getting the
dependence right is the precondition for forecasting, anomaly detection and
estimating the effect of an intervention over time.

## Intuition

Most series can be read as a few superposed patterns. A **trend** is long-run
movement up or down. **Seasonality** is a pattern that repeats with a fixed
period — the weekly shape of retail sales, the yearly shape of heating demand.
**Cycles** are rises and falls without a fixed period, such as business cycles.
What remains after these is the irregular **remainder**. Separating a series
into these parts, called decomposition, is usually the first thing to do with
one.

The second idea is memory. If today's value is high, tomorrow's is likely to be
high too; the strength of that relation at each time lag is the series'
**autocorrelation**, and a series with none is **white noise** — nothing in its
past linearly predicts its future.

## Concrete example

Take the steadily rising series $y = (2, 4, 6, 8, 10)$, with mean $6$ and
deviations $(-4, -2, 0, 2, 4)$. The lag-one autocorrelation is

$$
r_1 = \frac{(-2)(-4) + (0)(-2) + (2)(0) + (4)(2)}{16 + 4 + 0 + 4 + 16}
= \frac{16}{40} = 0.4 .
$$

The positive value comes entirely from the trend: neighbouring values are
similar because the whole series is climbing. Take first differences,
$y_t - y_{t-1} = (2, 2, 2, 2)$, and the trend is gone — the differenced series is
constant. Differencing to remove trend before looking for other structure is one
of the most common steps in practice, and this is why.

## Formal treatment

A time series $y_1, \dots, y_T$ is modelled as one realisation of a stochastic
process $\{Y_t\}$. The process is **weakly stationary** if its mean is constant
and its covariances depend only on the lag between two times:

$$
\mathbb{E}[Y_t] = \mu, \qquad \operatorname{Cov}(Y_t, Y_{t+k}) = \gamma(k)
\quad \text{for all } t .
$$

The sample autocorrelation at lag $k$ estimates $\gamma(k)/\gamma(0)$:

$$
r_k = \frac{\sum_{t=k+1}^{T} (y_t - \bar y)(y_{t-k} - \bar y)}
{\sum_{t=1}^{T} (y_t - \bar y)^2}.
$$

For white noise the $r_k$ should be near zero, and roughly 95% of them fall
within $\pm 1.96/\sqrt{T}$. An **autoregressive** model of order $p$ writes each
value as a linear combination of the previous $p$ plus noise; a **moving
average** model of order $q$ writes it in terms of past noise terms; combining
them with differencing gives the ARIMA family.

## Assumptions and requirements

- **Regular spacing** for the standard tools. Irregularly sampled series need
  methods that account for the gaps.
- **Stationarity**, for ARMA models and for autocorrelation to be meaningful as a
  single number per lag. Trending or seasonal series must first be differenced or
  decomposed; a non-stationary series's sample autocorrelation mostly reflects
  the trend, as the example shows.
- **Enough history** to see the patterns: estimating a yearly seasonal pattern
  needs several years.
- **A stable process.** Models learned from the past assume the mechanism
  generating the data continues; structural breaks invalidate them.

## Uses and applicability

Time series methods are the tool for forecasting demand, load and prices; for
monitoring systems and detecting anomalies against expected behaviour; for
decomposing a signal into trend and seasonal parts to report underlying change;
and for measuring the effect of interventions over time. When observations
genuinely have no order, or order is irrelevant to the question, ordinary
statistical and machine learning methods are simpler.

## Limitations and common mistakes

**Spurious correlation between trends.** Two unrelated series that both trend
upward correlate strongly; regressing one on the other finds a relationship that
is not there. Differencing or modelling the trend first avoids it.

**Shuffling before splitting.** Random train-test splits let a model train on the
future and test on the past, producing optimistic scores. Evaluation must respect
time order.

**Ignoring seasonality.** A model that misses a weekly or yearly pattern will
attribute it to noise or to whatever regressor happens to coincide with it.

**Treating autocorrelation as causation.** Past values predicting future ones says
nothing about why.

## Variants and alternatives

- **Exponential smoothing** models weight past observations with exponentially
  decaying weights and extend naturally to trend and seasonality.
- **State space models** describe an unobserved state evolving over time and the
  observations it produces; hidden Markov models are the discrete-state case.
- **Spectral analysis** describes a stationary series by how its variance is
  distributed across frequencies, the Fourier view of the same dependence.
- **Machine learning and neural models** — gradient-boosted trees on lagged
  features, recurrent networks, transformers — trade interpretability for
  flexibility, and are most useful with many related series.

## History and attribution

Autoregressive models go back to Yule's work in the 1920s, and Box and Jenkins's
1970 book established the ARIMA methodology of identification, estimation and
diagnostic checking that dominated the field for decades. Exponential smoothing
arose from operational forecasting practice in the 1950s.

## Sources

_Forecasting: Principles and Practice_ covers decomposition, autocorrelation and
its white-noise bounds, stationarity and differencing, ARIMA and exponential
smoothing, and the evaluation pitfalls. Durrett's probability text treats
strictly stationary sequences as mathematical objects; the weak-stationarity and
autocovariance definitions follow the forecasting text.

## Prerequisites and next connections

Read [Stochastic Processes](./stochastic-processes.md) for the processes a series
is drawn from, and [Supervised Learning](./supervised-learning.md) for the
independence assumption time series violate.

From here, [Forecasting](./forecasting.md) is the main thing time series are
analysed for, [Fourier Analysis](./fourier-analysis.md) gives the frequency-domain
view, and [State Space Models](./state-space-models.md) shows how state-space
ideas became a neural sequence layer.
