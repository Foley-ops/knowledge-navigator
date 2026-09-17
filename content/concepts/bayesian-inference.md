---
concept_id: concept.probability.bayesian_inference
title: Bayesian Inference
slug: /concepts/bayesian-inference
aliases:
  - inverse probability
  - Bayesian statistics
kind: method
tier: 1
review_state: generated-draft
summary: A method of statistical inference that treats the unknown as a random variable and reports its conditional distribution given the data, so that estimates, intervals and predictions are all summaries of one posterior.
categories:
  - Mathematics/Probability & Statistics
primary_category: Mathematics/Probability & Statistics
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: The posterior is a conditional distribution, so conditional probability, densities and expectation must be in hand before the update rule means anything.
  - type: contrasts_with
    target: concept.probability.frequentist_inference
    note: Both answer questions about an unknown parameter, but one puts a distribution on the parameter and the other on the procedure's behaviour under repeated sampling.
  - type: contributes_to
    target: concept.probability.probability_and_computing
    note: Posterior expectations are integrals nobody can do in closed form, and the demand for them is what drove Markov chain Monte Carlo into general use.
sources:
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.probabilistic_systems
    title: MIT 6.041 Probabilistic Systems Analysis and Applied Probability (Fall 2010)
    url: https://ocw.mit.edu/courses/6-041-probabilistic-systems-analysis-and-applied-probability-fall-2010/
    source_kind: lecture-or-course
    supports:
      - definition
      - formal-treatment
      - limitations-and-common-mistakes
    checked_on: 2026-09-17
  - source_id: source.rasmussen.gaussian_processes
    title: Rasmussen and Williams, Gaussian Processes for Machine Learning
    url: https://gaussianprocess.org/gpml/
    source_kind: authoritative-secondary
    supports:
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references: []
claims: []
---

## Definition

**Bayesian inference** makes the unknown quantity $\theta$ and the data $y$ jointly
distributed, so that learning from data is nothing but conditioning: fix the $y$ you
saw and read off the conditional law of $\theta$. Given a **prior** $p(\theta)$ and a
**likelihood** $p(y \mid \theta)$,

$$
p(\theta \mid y) \;=\; \frac{p(y \mid \theta)\, p(\theta)}{p(y)},
\qquad
p(y) \;=\; \int p(y \mid \theta)\, p(\theta) \, d\theta .
$$

The left-hand side is the **posterior**; the normalising constant $p(y)$ is the
**marginal likelihood** (or evidence). Point estimates, intervals, predictions and
model comparisons are then summaries of that one object rather than separate
procedures.

## Why it matters

The framework buys one thing hard to get otherwise: uncertainty that
propagates. A posterior over parameters pushes forward into a **posterior predictive**
over future data, and from there into an expected loss for each action, with no step
where uncertainty must be re-derived or quietly dropped. Nuisance parameters are
integrated out rather than plugged in, prior information enters as a distribution
instead of an informal caveat, and the update is sequential: today's posterior is
tomorrow's prior. The price is concrete: a prior you must write down, and an integral
that is usually intractable.

## Intuition

Hold a mass of belief spread over parameter space. The likelihood, read as a function
of $\theta$ with $y$ fixed, re-weights it pointwise: values that made the observed data
probable are multiplied up, the rest down, and renormalising gives the posterior. Data
is a filter, not a replacement. In conjugate models the prior is a stack of imaginary
observations and updating is arithmetic on counts: a Beta$(\alpha, \beta)$ prior behaves
exactly like $\alpha - 1$ prior successes and $\beta - 1$ prior failures.

Where the analogy misleads: the posterior is not how confident you feel. It is a
deduction inside a model, and if the likelihood is wrong it concentrates, sharply and
confidently, on the wrong answer. Bayes gives coherence, not correctness.

## Concrete example

A coin of unknown bias $\theta$ with prior $\theta \sim \mathrm{Beta}(2,2)$ — symmetric
about $0.5$, worth one imaginary head and one imaginary tail. Observe $y = 13$ heads in
$n = 20$ tosses. Beta is conjugate to the binomial likelihood, so the posterior is
$\mathrm{Beta}(2 + 13,\; 2 + 7) = \mathrm{Beta}(15, 9)$, giving:

- mean $15/24 = 0.625$, standard deviation $0.0968$;
- mode, the MAP estimate, $(15-1)/(15+9-2) = 14/22 \approx 0.636$, against a maximum
  likelihood estimate of $13/20 = 0.65$;
- 95% equal-tailed credible interval $[0.427,\; 0.803]$, and
  $\Pr(\theta > 0.5 \mid y) = 0.895$;
- posterior predictive $\Pr(\text{next toss is a head}) = 0.625$; over five tosses,
  $\Pr(3 \text{ heads}) = 0.311$ and $\Pr(5 \text{ heads}) = 0.118$.

Now compare models, not parameter values. The marginal likelihood of the "unknown bias
with a Beta$(2,2)$ prior" model is $\binom{20}{13} B(15,9)/B(2,2) = 0.0632$; the fixed
fair-coin model gives $\binom{20}{13} 2^{-20} = 0.0739$. The Bayes factor is $1.17$ **in
favour of the fair coin**, though the posterior puts 89% of its mass above $0.5$. Under
a flat $\mathrm{Beta}(1,1)$ prior the posterior hardly moves (mean $0.636$) while the
marginal likelihood falls to $0.0476$ and the factor rises to $1.55$: a high posterior
probability is not evidence for a model, and the evidence is far more prior-sensitive
than the posterior.

## Formal treatment

Let $\theta \in \Theta$ carry prior density $p(\theta)$ with respect to a dominating
measure and let the data have density $p(y \mid \theta)$; Bayes' rule holds whenever
$0 < p(y) < \infty$. For conditionally independent observations
$p(\theta \mid y_{1:n}) \propto p(\theta) \prod_{i=1}^{n} p(y_i \mid \theta)$, so order
does not matter and sequential updating is consistent. Prediction marginalises the
parameter away:

$$
p(\tilde{y} \mid y) \;=\; \int p(\tilde{y} \mid \theta)\, p(\theta \mid y)\, d\theta .
$$

Point estimates come from decision theory: the Bayes action minimises
$\mathbb{E}[L(\theta, a) \mid y]$, so squared error gives the posterior mean, absolute
error the median, and a vanishing-width indicator loss the **MAP** estimate
$\hat{\theta}_{\mathrm{MAP}} = \arg\max_\theta p(\theta \mid y)$ — one summary among
several, identical to maximum likelihood penalised by $-\log p(\theta)$.

Bernstein–von Mises connects the schools: for a fixed-dimensional, identifiable,
correctly specified, smooth model with $\theta_0$ interior to $\Theta$ and the prior
positive and continuous there, the posterior converges in total variation to
$\mathcal{N}(\hat{\theta}_n,\, I(\theta_0)^{-1}/n)$ ($I$ the Fisher information), so
credible sets acquire asymptotically correct frequentist coverage. Every hypothesis does
work; it fails in nonparametric and high-dimensional settings.

Computation splits in two. **MCMC** simulates a Markov chain whose stationary
distribution is the posterior, so ergodic averages converge to posterior expectations:
asymptotically exact, with a finite-run error to be diagnosed, not bounded.
**Variational inference** minimises $\mathrm{KL}(q \,\|\, p(\cdot \mid y))$ over a
tractable family, equivalently maximising the evidence lower bound: fast and scalable,
biased by a gap it cannot report.

## Assumptions and requirements

The prior must be a genuine probability distribution, or — if improper, like a flat
prior on the line — must still yield a proper posterior, checked case by case. Improper
posteriors do not announce themselves: a sampler runs happily and produces drifting
nonsense.

Bayes conditions on the model class, so the likelihood must be adequate. Under
misspecification the posterior concentrates on the family member closest in
Kullback–Leibler divergence to the truth, with a spread reflecting variability inside
that wrong family, not the distance to reality, so credible intervals lose calibration.
The coin example further assumes exchangeable tosses with constant bias.

The prior must also put mass where the truth is: zero prior density means zero posterior
density, for every dataset, forever. Identifiability matters likewise: along directions
the likelihood cannot distinguish, the posterior equals the prior however large $n$
grows, so "the prior washes out with enough data" is a theorem with hypotheses, not a
law.

## Uses and applicability

Reach for it when uncertainty must reach a decision intact, when data are scarce
relative to the number of parameters and real prior information exists, or when related
groups should pool information. Gaussian process regression is the clean case:
posterior and marginal likelihood both in closed form, the latter choosing kernel
hyperparameters.

It is a poor trade when data are abundant and the deliverable is a point prediction; when
no prior can be defended and the answer turns on which was picked; or when inference must
run inside a latency budget no sampler can meet.

## Limitations and common mistakes

**A credible interval is not a confidence interval.** The interval $[0.427, 0.803]$
above satisfies $\Pr(\theta \in I \mid y) = 0.95$: probability over $\theta$, data held
fixed, inside the model. The 95% Wald confidence interval $[0.441, 0.859]$ says instead
that the procedure producing it covers the fixed unknown $\theta$ in 95% of repeated
samples; no probability attaches to the interval in front of you. Neither is a defective
version of the other, and in regular problems Bernstein–von Mises makes them nearly
coincide — which is why the distinction gets forgotten.

**"Non-informative" priors are not assumption-free.** Flatness is not invariant under
reparameterisation — uniform on $\theta$ is not uniform on the log-odds — so the
parameterisation encodes a belief. Jeffreys' rule restores invariance by
construction but is often improper and is not recommended verbatim in multiparameter
problems; a flat prior on a scale parameter is strongly informative about what depends
on it.

**MAP is not "the Bayesian answer".** A mode moves when a Jacobian is applied, so MAP is
not reparameterisation-invariant, and in high dimensions it can sit where the posterior
carries negligible mass. Optimising to the mode and then reporting Bayesian uncertainty
is a contradiction.

**Marginal likelihoods are fragile**: Bayes factors are undefined under improper priors
and can move by orders of magnitude with a prior width that hardly touches the
posterior, the Jeffreys–Lindley effect. **Approximations are not the posterior**:
unconverged MCMC that found one mode reports a confident wrong answer, and reverse-KL
variational inference underestimates posterior variance and drops modes — neither
failure showing up in the output.

## Variants and alternatives

Within the framework: **conjugate analysis** for closed-form updates; **empirical
Bayes**, which sets hyperparameters by maximising the marginal likelihood — cheap, but
double-uses the data and understates uncertainty; **hierarchical Bayes**, which puts a
prior on those hyperparameters instead; **objective** versus openly **subjective**
priors. For computation: the **Laplace approximation** and **expectation propagation** for
smooth unimodal posteriors, the **MCMC** family, **sequential Monte Carlo**,
**variational inference**, and **approximate Bayesian computation** where the likelihood
can be simulated but not evaluated.

Genuinely different approaches: frequentist procedures, which need no prior; penalised
maximum likelihood, which keeps the regularisation and drops the distribution; the
bootstrap; and conformal prediction, which gives distribution-free coverage for
predictions while saying nothing about parameters.

## History and attribution

Thomas Bayes' essay on the problem was published posthumously in 1763 by Richard Price.
Pierre-Simon Laplace reached the same rule independently in the 1770s and developed it
much further under the name _inverse probability_, applying it in astronomy and
demography; through the nineteenth century the method was Laplace's in practice, and
"Bayesian" is a twentieth-century coinage. The revival came from several
directions at once: de Finetti on exchangeability and subjective probability (1930s),
Jeffreys' _Theory of Probability_ (1939), Cox (1946), Savage's decision-theoretic
foundations (1954). The practical turn was computational: Metropolis
and co-authors (1953) and Hastings (1970) supplied the algorithm, and Gelfand and Smith
(1990) showed Gibbs sampling made routine Bayesian computation feasible.

## Sources

MacKay is best for the conceptual core: inference as probability, the bent-coin example,
Occam's razor through the marginal likelihood, a first look at Monte Carlo and
variational free energy. Murphy is the reference for the machinery — conjugate models
with worked beta-binomial numbers, uninformative priors and their problems, the MAP
caveats, approximate inference. MIT 6.041 gives the careful elementary version of
Bayesian and classical interval estimation; Rasmussen and Williams the applied case
study, with marginal likelihood used for model selection.

## Prerequisites and next connections

Conditional probability, densities and expectation come first. For continuous parameter
spaces the posterior is a conditional distribution in the measure-theoretic sense, so
[Measure Theory](./measure-theory.md) makes the statements precise rather than merely
formal, and the marginalisations are the multiple integrals of
[Multivariable Calculus](./multivariable-calculus.md).

Next, read the frequentist account of interval estimation and testing for what
repeated-sampling guarantees promise. Markov chain theory then explains why MCMC works,
and high-dimensional statistics is where the asymptotic agreement between posterior and
sampling distribution breaks down.
