---
concept_id: concept.deep_learning.initialization
title: Initialization
slug: /concepts/initialization
aliases:
  - parameter initialization
kind: method
tier: 1
review_state: generated-draft
summary: Initialization chooses a model's parameter values before training, setting the starting symmetry, activation scale, and gradient scale that the optimizer inherits.
categories:
  - Artificial Intelligence/Deep Learning — Training
primary_category: Artificial Intelligence/Deep Learning — Training
relationships:
  - type: contributes_to
    target: concept.deep_learning.backpropagation
    note: Initial weight scales influence the products of local derivatives carried backward through a deep network.
  - type: useful_when
    target: concept.optimization.nonconvex_optimization
    note: Different starting points can lead a nonconvex training run through different regions and optimization trajectories.
  - type: assumes
    target: concept.probability.probability_theory
    note: Variance-preserving initializers are defined through distributions, independence approximations, means, and variances.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
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
    checked_on: 2026-09-17
  - source_id: source.he2015.delving_deep_into_rectifiers
    title: 'Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification'
    url: https://arxiv.org/abs/1502.01852
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: Glorot and Bengio primary initialization paper
    reason: The registry's textbook discusses fan-in/fan-out variance scaling, but the primary paper commonly associated with that rule is not registered, so its priority is not asserted here.
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Initialization** assigns values to trainable parameters before the first
optimization update. For a linear unit with inputs $x_j$ and weights $w_j$,

$$
z=\sum_{j=1}^{n}w_jx_j+b,
$$

an initializer specifies distributions or constants for $w_j$ and $b$. Modern
rules usually choose zero-centered random weights with variance tied to fan-in,
fan-out, and the activation function. Randomness breaks symmetry between units;
variance scaling tries to prevent signals from systematically shrinking or
growing as they pass through many layers.

Initialization is the state from which learning starts, not a substitute for
learning. It includes newly trained layers and any deliberately loaded pretrained
parameters, although transfer from a trained model carries much more information
than a random initializer.

## Why it matters

If every hidden unit in a layer starts with identical weights, those units
receive identical gradients and remain copies. If weights are too small,
activations and gradients can fade with depth; if too large, activations can
saturate or explode. The optimizer then sees a badly scaled problem before it
has had any opportunity to correct it.

A suitable scale makes the first forward and backward passes numerically useful.
That can determine whether a deep model begins learning at all. It does not
guarantee a good final solution: data, architecture, objective, optimizer, and
random seed still matter. Initialization should be evaluated by early activation
and gradient statistics as well as final validation performance.

## Intuition

Each layer passes a signal to the next. If it preserves only half the signal's
variance, ten layers leave roughly one thousandth. If it doubles variance, ten
layers amplify it about a thousandfold. A variance-scaled initializer balances
the expected gain near one.

The analogy is a chain of audio amplifiers: each stage should neither mute nor
clip an ordinary input. It breaks because neural activations are nonlinear,
weights become dependent on data during training, and finite widths do not obey
the independence assumptions exactly. Preserving variance at initialization is
a useful local calculation, not a theorem of successful optimization.

## Concrete example

Let a unit receive $n=100$ independent inputs with mean zero and variance one,
and let independent weights have mean zero and variance $\sigma_w^2$. Ignoring
the bias,

$$
\operatorname{Var}(z)=100\sigma_w^2.
$$

If $\sigma_w^2=0.01$, then $\operatorname{Var}(z)=1$. For a symmetric pre-
activation followed by ReLU, roughly half the values are zeroed, so a rough
second-moment calculation loses a factor near two. Choosing
$\sigma_w^2=2/100=0.02$ compensates, giving pre-activation variance $2$ and a
post-ReLU second moment near $1$.

With $\sigma_w^2=1$, the first pre-activation variance would be $100$. Repeating
that scale is clearly unstable. With $\sigma_w^2=10^{-6}$, the variance would be
$10^{-4}$ and the signal would be nearly erased before depth compounds the
problem.

## Formal treatment

Assume $w_j$ and $x_j$ are independent, centered, identically distributed, and
cross terms vanish. Then

$$
\operatorname{Var}(z)=n_{\mathrm{in}}
\operatorname{Var}(w)\operatorname{Var}(x).
$$

For a rectifier whose negative branch has slope $a$, the He paper derives a
scale based on

$$
\operatorname{Var}(w)=
\frac{2}{(1+a^2)n_{\mathrm{in}}}.
$$

For ReLU, $a=0$ and this becomes $2/n_{\mathrm{in}}$. Samples can be Gaussian
with that variance or drawn from a bounded distribution chosen to match it.

Rules that balance forward and backward variance may use both fan-in and fan-
out. Biases are often zero because random weights already break unit symmetry;
some gated or residual architectures use deliberately nonzero or zero final
parameters for architectural reasons. Those choices are architecture-specific
and should not be generalized without evidence.

## Assumptions and requirements

Variance derivations assume approximately independent inputs and weights,
centered distributions, similar coordinate variances, and a known activation.
Convolutions use receptive-field size times input channels as fan-in, not merely
the number of input channels. Shared weights and residual additions change the
simple fully connected calculation.

The random-number generator, seed, data type, and distributed sharding policy
must be controlled for reproducibility. Mixed precision needs values that do not
underflow or overflow. Loading a checkpoint requires exact parameter shapes and
semantics; silently reinitializing a missing layer creates a different model.
Pretrained and newly initialized components may need different learning rates.

## Uses and applicability

Use rectifier-aware variance scaling for deep networks dominated by ReLU or
parametric rectifiers. Use a rule matched to approximately linear or symmetric
activations when that is the derivation being relied on. Inspect a small batch's
layerwise activation means, variances, saturation fractions, and gradient norms
before spending a full training run.

Random initialization is inappropriate when exact symmetry is required by the
model, when a known solution supplies a better starting state, or when a
pretrained representation is the actual experimental condition. In transfer
learning, initialization from a source model should be reported as such rather
than grouped with a random seed.

## Limitations and common mistakes

No initializer makes an arbitrarily deep computation well conditioned in
general. Repeated Jacobian products, saturation, residual scaling,
normalization, and the loss all matter. Special cases do better: orthogonal
initialization with controlled singular values can preserve conditioning much
deeper than a generic variance-scaled rule in the architectures where it
applies. A variance calculation matches a moment, not the full distribution,
and heavy-tailed activations can behave badly despite the right variance.

Common mistakes include setting all weights to zero, confusing standard
deviation with variance, using fan-out where a library expects fan-in, ignoring
the negative slope of a parametric rectifier, applying the same rule to the last
prediction layer, and comparing seeds after choosing the best one on test data.
Another error is assuming equal initialization seeds reproduce a run across
different devices or parallel execution orders.

## Variants and alternatives

Fan-in scaling prioritizes forward activations; fan-out scaling emphasizes
backward gradients; compromise rules use both. Orthogonal initialization starts
from a matrix with controlled singular values when shapes permit. Sparse and
constant initializations are useful in particular architectures but require
their own reasoning. Pretraining replaces distributional ignorance with learned
structure and changes the experiment fundamentally.

Batch normalization can reduce sensitivity to initial scale in some networks,
but it does not remove the need for finite, symmetry-breaking parameters.
Residual connections change signal propagation and may motivate scaling a
branch differently. The registry lacks the primary source commonly associated
with the fan-in/fan-out compromise, so this page records that historical gap.

## History and attribution

The registered deep-learning text surveys early neural-network initialization
practice and variance-scaling arguments. He, Zhang, Ren, and Sun derived and
tested an initialization tailored to rectifier nonlinearities in their 2015
paper. That paper supports attribution of the rectifier-aware rule. The registry
does not contain enough primary material to assign priority for random symmetry
breaking or the earlier fan-in/fan-out rule, so no such claim is made.

## Sources

- Goodfellow, Bengio, and Courville support symmetry breaking, signal and
  gradient scaling, fan-in/fan-out reasoning, and practical qualifications.
- He, Zhang, Ren, and Sun support the rectifier-specific variance derivation,
  its parametric-slope form, and the 2015 attribution.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) for variance and independence,
[Matrix Theory](./matrix-theory.md) for linear maps, and
[Backpropagation](./backpropagation.md) for gradient transport. Continue to
batch normalization and layer normalization for methods that control activation
statistics during, rather than only before, training.
