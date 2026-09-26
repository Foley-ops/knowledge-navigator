---
concept_id: concept.applications.forecasting
title: Forecasting
slug: /concepts/forecasting
kind: problem
tier: 1
review_state: generated-draft
summary: Forecasting predicts future values of a quantity from its history and related information, and doing it well means stating the uncertainty honestly and proving a method beats simple benchmarks on data it has not seen.
categories:
  - Artificial Intelligence/Domains
primary_category: Artificial Intelligence/Domains
relationships:
  - type: requires
    target: concept.applications.time_series
    note: Almost every forecasting method models the trend, seasonality and autocorrelation of a time series, so those have to be understood before a forecast can be built or judged.
  - type: contributes_to
    target: concept.applications.control
    note: Model predictive control chooses actions by forecasting how a system will evolve under each candidate, so poor forecasts degrade the control it achieves.
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
unresolved_references:
  - label: Forecasting competitions and the history of forecast evaluation
    reason: The findings of the Makridakis forecasting competitions, and the history of exponential smoothing and of scaled error measures, are described from the wider forecasting literature; the registry holds only the Hyndman and Athanasopoulos textbook for this topic.
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Forecasting** is predicting the future values of a quantity — next week's
demand, tomorrow's electricity load, next quarter's revenue — from its history
and whatever related information is available. A forecast is a statement about
an uncertain future, so a complete forecast gives not just a single number, the
**point forecast**, but a **prediction interval** or a full distribution
describing how far the outcome might plausibly fall from it.

## Why it matters

Decisions made now depend on what happens later: how much stock to order, how
many staff to schedule, how much generating capacity to keep running. A forecast
turns history into an input to those decisions, and the uncertainty is what
decides how much safety margin to hold. An overconfident forecast is often worse
than a wide one, because it invites decisions with no room for error.

## Intuition

A forecasting method is a bet that some pattern in the past will continue. The
simplest bets are surprisingly strong: tomorrow will look like today (the
**naive** method), or like the same day last week (**seasonal naive**). More
elaborate methods earn their place only by beating those on data they were not
fitted to. Much of the discipline of forecasting is refusing to be impressed by a
method until it has done that.

How predictable something is depends on how well its drivers are understood, how
much relevant data exists, whether the future resembles the past, and whether the
forecast itself changes the outcome — a published forecast of a price can move
the price.

## Concrete example

Simple exponential smoothing keeps a level $\ell_t$ updated by
$\ell_t = \alpha y_t + (1-\alpha)\ell_{t-1}$ and forecasts the next value as the
current level. With $\alpha = 0.5$, the series $y = (10, 12, 11, 13)$ and the
level started at the first observation:

```text
t      1     2      3      4
y     10    12     11     13
level 10    11.0   11.0   12.0
```

The forecast for $t = 5$ is $12$; the naive forecast is $13$. Suppose the actual
value is $12$. To compare the two fairly, scale each error by the in-sample error
of the one-step naive method, $(|12-10| + |11-12| + |13-11|)/3 = 5/3$. That
ratio is the **mean absolute scaled error**: smoothing scores
$0 / (5/3) = 0$, naive scores $1 / (5/3) = 0.6$. Values below $1$ beat the
in-sample naive benchmark.

## Formal treatment

Given observations $y_1, \dots, y_T$, an $h$-step forecast is an estimate of
$y_{T+h}$ conditioned on the history, written $\hat y_{T+h \mid T}$. A
probabilistic forecast gives the whole conditional distribution; a prediction
interval is a range expected to contain the outcome with stated probability, and
for many models under normal errors it is
$\hat y_{T+h\mid T} \pm c\,\hat\sigma_h$ with $c = 1.96$ for 95%. The standard
deviation $\hat\sigma_h$ usually grows with the horizon $h$, because uncertainty
accumulates.

Accuracy is measured on data held out from fitting, with errors
$e_{T+h} = y_{T+h} - \hat y_{T+h\mid T}$. Common summaries are the mean absolute
error and root mean squared error, which are in the data's units; percentage
errors, which are scale-free but undefined when $y$ is zero; and scaled errors,
which divide by the in-sample error of a naive method.

## Assumptions and requirements

- **Evaluation that respects time.** Test data must come after training data.
  Rolling-origin evaluation — refit, forecast the next step, move the origin
  forward, repeat — uses the data far better than a single split.
- **Comparable history.** Methods assume the process that produced the past
  continues; a pandemic, a new competitor or a policy change breaks that.
- **Honest intervals.** Standard prediction intervals assume the model is correct
  and ignore uncertainty in its parameters and structure, so they tend to be too
  narrow.
- **The right error measure for the decision.** Absolute error is minimised by
  the median forecast, squared error by the mean; choosing a measure is choosing
  what kind of forecast you want.

## Uses and applicability

Forecasting is used for inventory and supply planning, staffing, energy and
utilities load, finance and budgeting, and capacity planning in computing. Use
the simplest method that beats the benchmarks, report intervals, and evaluate
with time-ordered backtests. When the quantity is driven by factors you can
measure and forecast themselves, a regression on those drivers can outperform a
model of the series alone.

## Limitations and common mistakes

**Skipping the benchmarks.** A complex model that cannot beat the naive or
seasonal naive forecast adds nothing but cost; many do not.

**Leaking the future.** Fitting on the full series, choosing features using later
data, or evaluating with a random split all produce accuracy that will not
survive deployment.

**Mean absolute percentage error on small values.** It explodes near zero and
penalises over- and under-forecasts asymmetrically.

**Point forecasts without uncertainty.** A single number hides how much the
decision should hedge.

## Variants and alternatives

- **Exponential smoothing** extends to trend and seasonality and has an
  equivalent state space formulation that yields prediction intervals.
- **ARIMA** models autocorrelation directly after differencing.
- **Dynamic regression** adds external predictors while modelling the errors as
  a time series.
- **Combinations** of several methods' forecasts are often more accurate than any
  single one, a result repeated across forecasting competitions.
- **Machine learning and neural methods** are most effective across many related
  series at once; how far general pre-trained forecasting models improve on the
  statistical methods is still being established.

## History and attribution

Exponential smoothing came out of operational practice in the 1950s, and the
Box–Jenkins ARIMA methodology followed in 1970. The Makridakis forecasting
competitions, beginning in the 1980s, repeatedly found that simple methods and
combinations competed well with sophisticated ones, a finding that shaped the
field's insistence on benchmarks. Hyndman and Athanasopoulos's textbook, freely
available online, is a standard modern account.

## Sources

_Forecasting: Principles and Practice_ is the source for this page's framing of
forecastability, the benchmark methods, simple exponential smoothing, prediction
intervals and their growth with horizon, the error measures including the scaled
error, rolling-origin evaluation, and the case for combining forecasts.

## Prerequisites and next connections

Read [Time Series](./time-series.md) for trend, seasonality and autocorrelation,
and [Frequentist Inference](./frequentist-inference.md) for what an interval
estimate claims.

From here, [Control](./control.md) uses forecasts to choose actions, and
[Bayesian Inference](./bayesian-inference.md) is a route to full predictive
distributions rather than intervals.
