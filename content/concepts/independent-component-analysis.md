---
concept_id: concept.machine_learning.independent_component_analysis
title: Independent Component Analysis
slug: /concepts/independent-component-analysis
aliases: []
kind: method
tier: 1
review_state: generated-draft
summary: Independent component analysis models observed vectors as linear mixtures of statistically independent non-Gaussian sources and estimates an unmixing transform from higher-order distributional structure.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: ICA relies on statistical independence, likelihoods, entropy, and non-Gaussianity rather than covariance alone.
  - type: requires
    target: concept.machine_learning.principal_component_analysis
    note: Whitening by PCA commonly removes second-order dependence and reduces the remaining search to an orthogonal rotation.
  - type: contributes_to
    target: concept.learning.unsupervised_learning
    note: Sources are recovered from unlabeled multivariate observations under a latent linear mixing model.
  - type: contrasts_with
    target: concept.machine_learning.principal_component_analysis
    note: PCA identifies orthogonal maximum-variance directions, while ICA uses higher-order information to seek independent sources and has different ambiguities.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
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
    checked_on: 2026-09-17
  - source_id: source.murphy.probabilistic_machine_learning
    title: Kevin Murphy, Probabilistic Machine Learning
    url: https://probml.github.io/pml-book/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Primary historical sources for independent component analysis and blind source separation
    reason: The registered sources provide modern treatments but do not establish the field's historical priority, so this page avoids inventor and date claims.
    sections:
      - history-and-attribution
claims: []
---

## Definition

**Independent component analysis** (ICA) assumes an observed random vector
$x\in\mathbb R^d$ is a linear mixture $x=As$ of latent components
$s=(s_1,\ldots,s_d)^T$ that are mutually statistically independent and mostly
non-Gaussian. It estimates an unmixing matrix $W\approx A^{-1}$ so that
$\hat s=Wx$ has components as independent as the data and objective permit.

Unlike [principal component analysis](./principal-component-analysis.md), ICA
does not order components by variance or require the recovered directions to be
orthogonal in the original coordinates. It uses distributional information
beyond covariance.

## Why it matters

Different physical or behavioral sources can be recorded only through mixtures:
multiple microphones hear multiple speakers, scalp sensors combine neural and
artifact signals, and measured factors can combine latent drivers. ICA can
separate such mixtures without labeled examples or known mixing coefficients.

The method also demonstrates a fundamental identifiability lesson. Decorrelation
is insufficient to reveal sources; non-Gaussian higher-order structure can carry
the missing information. Conversely, when that structure is absent, no
algorithm can recover a unique rotation from the observations alone.

## Intuition

Two microphones record different weighted sums of two speakers. Search for a
rotation and rescaling whose outputs behave least like mixtures and most like
independent signals. Sums of independent variables tend to be more Gaussian than
their non-Gaussian sources, so directions with strong non-Gaussianity are useful
clues.

The story breaks with time delays, reverberation, nonlinear sensors, or sources
that are dependent. Those settings are not instantaneous square linear mixing;
standard ICA's objective may still return components, but its source-separation
interpretation is no longer licensed.

## Concrete example

Let two independent sources take the four paired values

$$
S=\begin{bmatrix}-1&1&-1&1\\-1&-1&1&1\end{bmatrix}
$$

and mix them with
$A=\begin{bmatrix}1&1\\1&-1\end{bmatrix}$. The observed columns are
$(-2,0),(0,2),(0,-2),(2,0)$. Their covariance using divisor four is $2I$.
Therefore PCA sees equal eigenvalues and cannot prefer any rotation: every
orthonormal basis has the same variance.

ICA can use the non-Gaussian, independent four-point structure. Since

$$
W=A^{-1}=\frac12\begin{bmatrix}1&1\\1&-1\end{bmatrix},
$$

applying $W$ to the observation $(-2,0)^T$ recovers $(-1,-1)^T$; applying it to
$(0,2)^T$ recovers $(1,-1)^T$. All four columns recover exactly. The example
also shows unavoidable scale ambiguity: multiplying one recovered source by
$c$ and dividing the corresponding mixing column by $c$ leaves $AS$ unchanged.

## Formal treatment

Assume centered observations $x=As$, with nonsingular square $A$ and joint
density $p_s(s)=\prod_jp_j(s_j)$. For candidate unmixing matrix $W$, change of
variables gives

$$
p_x(x)=|\det W|\prod_{j=1}^d p_j(w_j^Tx).
$$

Maximum-likelihood ICA maximizes over observations

$$
n\log|\det W|+\sum_{i=1}^n\sum_{j=1}^d
\log p_j(w_j^Tx_i).
$$

Alternative objectives minimize mutual information or maximize approximations
to non-Gaussianity; under suitable models these views are closely connected.
Whitening first transforms the sample covariance to identity. The remaining
square mixing transform is then orthogonal, reducing the number of free
parameters, but whitening alone does not identify its rotation.

Components are identifiable only up to permutation and nonzero scaling. At most
one source may be Gaussian: if two or more are Gaussian after whitening, their
joint distribution is invariant under rotations, so their individual directions
cannot be identified.

## Assumptions and requirements

Standard ICA assumes statistically independent sources, linear instantaneous
mixing, enough observations, and a full-rank mixing matrix. Classical square ICA
also assumes as many observed channels as sources. Centering and usually
whitening are required preprocessing steps, fitted only on training data when
the transform enters an evaluation pipeline.

The sources must contain non-Gaussian information, with no more than one
Gaussian component. Results depend on the contrast function and on whether its
source-density assumptions match sub-Gaussian or super-Gaussian signals.

## Uses and applicability

Use ICA for exploratory blind source separation when multiple channels contain
approximately instantaneous linear mixtures and independence is scientifically
plausible. It is useful for separating artifacts or finding latent signals whose
non-Gaussian distributions are more relevant than variance ordering.

Do not use it merely because a lower-dimensional representation is wanted. ICA
is not primarily a compression method and can be unstable without a credible
source model. PCA is simpler when reconstruction error is the goal.

## Limitations and common mistakes

Permutation, sign, and scale are not identifiable, so component order and
amplitude cannot be compared naively across fits. Near-Gaussian sources and
weakly distinct distributions make estimates unstable. Outliers can dominate
non-Gaussianity objectives, and local optimization can return different
solutions from different initializations.

Common mistakes include calling uncorrelated components independent, skipping
centering, interpreting every component as a real physical source, and comparing
estimated signals without resolving permutation and sign. A visually separated
output is not evidence that the assumed mixing model was true.

## Variants and alternatives

Fast fixed-point algorithms, maximum-likelihood methods, and information-
minimization methods use different optimization strategies and contrast
functions. Noisy and overcomplete ICA relax the square noiseless model.
Convolutive methods address delays and reverberation. PCA offers orthogonal
variance-based components; nonnegative matrix factorization uses positivity and
parts-based structure instead of independence.

## History and attribution

The registered textbooks support ICA's modern statistical formulation but are
not primary historical sources for blind source separation. This draft therefore
does not assert an inventor, first algorithm, or date; those claims remain an
explicit registry gap rather than an unverified narrative.

## Sources

- _The Elements of Statistical Learning_ supports the latent linear model,
  independence objective, identifiability conditions, and relationship to PCA.
- _Probabilistic Machine Learning_ supports the density, likelihood, whitening,
  and non-Gaussianity perspectives.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) for independence and densities,
then [Principal Component Analysis](./principal-component-analysis.md) for
centering, whitening, and the covariance-only baseline.
[Unsupervised Learning](./unsupervised-learning.md) supplies the broader latent-
representation setting; [Matrix Decompositions](./matrix-decompositions.md)
supplies the linear algebra used in preprocessing and unmixing.
