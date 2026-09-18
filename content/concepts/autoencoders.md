---
concept_id: concept.deep_learning.autoencoders
title: Autoencoders
slug: /concepts/autoencoders
aliases:
  - autoassociative network
kind: method
tier: 1
review_state: generated-draft
summary: An encoder-decoder pair trained to reproduce its own input under a constraint that forbids plain copying, so that the intermediate code becomes a learned representation rather than a relabelling of the data.
categories:
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Deep Learning — Architectures
relationships:
  - type: requires
    target: concept.deep_learning.multilayer_perceptrons
    note: The encoder and decoder are ordinary feedforward networks trained by gradient descent, so a reader who cannot read an MLP cannot read an autoencoder.
  - type: generalizes
    target: concept.machine_learning.principal_component_analysis
    note: With linear maps and squared loss the optimal autoencoder attains exactly the rank-k PCA reconstruction error, and nonlinear encoders extend the same objective to curved low-dimensional structure.
  - type: prerequisite_of
    target: concept.deep_learning.variational_autoencoders
    note: The VAE is this architecture with a probabilistic encoder and a prior imposed on the code, so its construction is unreadable without the deterministic version first.
  - type: contributes_to
    target: concept.learning.self_supervised_learning
    note: Reconstructing a bottlenecked or corrupted input is one of the earliest label-free pretext objectives, and masked reconstruction descends directly from it.
sources:
  - source_id: source.goodfellow.deep_learning_book
    title: Ian Goodfellow, Yoshua Bengio and Aaron Courville, Deep Learning
    url: https://www.deeplearningbook.org/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.matrix_methods
    title: MIT 18.065 Matrix Methods in Data Analysis, Signal Processing, and Machine Learning (Spring 2018)
    url: https://ocw.mit.edu/courses/18-065-matrix-methods-in-data-analysis-signal-processing-and-machine-learning-spring-2018/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
    checked_on: 2026-09-17
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.kingma2014.auto_encoding_variational_bayes
    title: Auto-Encoding Variational Bayes
    url: https://arxiv.org/abs/1312.6114
    source_kind: preprint
    supports:
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Autoencoder primary literature (auto-association and PCA, denoising autoencoders)
    reason: The registry holds no autoencoder-specific primary paper, so the linear-autoencoder landscape result and the denoising construction are cited only through a secondary textbook that reports them.
    sections:
      - formal-treatment
      - variants-and-alternatives
      - history-and-attribution
  - label: Post-2016 autoencoder variants (vector-quantised codes, masked autoencoders, latent-space generative models)
    reason: Every autoencoder source in the registry predates this work, so the vector-quantised, masked and latent-diffusion claims rest on no cited source and are reported here as uncited.
    sections:
      - uses-and-applicability
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

An **autoencoder** is a pair of maps fitted jointly so that their composition
reproduces its own input: an encoder $f_\theta : \mathbb{R}^d \to \mathbb{R}^k$
producing a code $z = f_\theta(x)$, and a decoder
$g_\phi : \mathbb{R}^k \to \mathbb{R}^d$ producing a reconstruction
$\hat{x} = g_\phi(z)$, trained by minimising a reconstruction loss

$$
\mathcal{L}(\theta, \phi) \;=\; \mathbb{E}_{x \sim p_{\text{data}}}
\big[\, \ell\big(x,\; g_\phi(f_\theta(x))\big) \,\big].
$$

No labels appear anywhere: the target is the input. The useful object is not
$\hat{x}$ — a perfect copier is worth nothing — but $z$, and every design
decision is about preventing the pair from simply copying, classically by a
narrow code ($k < d$), a corruption applied before encoding, or a penalty on
the code itself.

## Why it matters

Autoencoders are the simplest way to ask a network "what in this data is worth
keeping?" without anyone saying what the answer should be. If the reconstruction
must pass through $k$ numbers, training exerts direct pressure to spend those
numbers on whatever varies and to drop whatever does not. That buys a nonlinear
replacement for PCA when the data lies near a curved rather than a flat
subspace, a compression stage that later models can work inside — what
latent-space image generators actually do — and a way to learn features when
labels are scarce and raw inputs are plentiful.

## Intuition

Picture a funnel. An image goes in the wide end, $k$ numbers come out of the
neck, and the image must be rebuilt from those numbers alone. Training becomes
a competition for neck space, won by the factors that explain the most
variation.

The analogy breaks in one important place. A funnel narrows in a fixed,
information-theoretic way; a neural bottleneck does not. Real numbers have
unbounded precision, so a flexible enough encoder can pack an index into a
single latent coordinate and a flexible enough decoder can look it up. The
bottleneck that matters is limited capacity, not literally a small $k$ — which
is why the regularised variants, which widen $k$ and constrain the code
instead, work at all.

## Concrete example

Take two-dimensional centred data with covariance

$$
\Sigma = \begin{bmatrix} 5 & 3 \\ 3 & 5 \end{bmatrix},
$$

whose eigenvalues are $8$ and $2$ with eigenvectors
$u_1 = (1,1)/\sqrt{2}$ and $u_2 = (1,-1)/\sqrt{2}$. Fit a linear autoencoder
with $k = 1$: encoder $W_e \in \mathbb{R}^{1\times 2}$, decoder
$W_d \in \mathbb{R}^{2 \times 1}$, squared loss. At the global optimum the
product is the projector onto the leading eigenvector,
$W_d W_e = u_1 u_1^{\top} = \tfrac{1}{2}\begin{bmatrix}1&1\\1&1\end{bmatrix}$,
and the residual error is $\lambda_2 = 2$ — exactly PCA's.

But the factors are not PCA's. Both of these achieve it:

```python
import numpy as np

Sigma = np.array([[5.0, 3.0], [3.0, 5.0]])

for We, Wd in [
    (np.array([[1.0, 1.0]]),     np.array([[0.5], [0.5]])),
    (np.array([[100.0, 100.0]]), np.array([[0.005], [0.005]])),
]:
    R = np.eye(2) - Wd @ We            # residual operator
    print(np.trace(R @ Sigma @ R.T))   # 2.0 in both cases
```

The second encoder emits codes one hundred times larger than the first, and
neither row of $W_e$ is the unit eigenvector $u_1$. The recovered object is the
one-dimensional _subspace_, not a direction, not a scale, and not an ordering.

## Formal treatment

Let the data be centred with covariance $\Sigma = \frac{1}{n} X^{\top} X$, and
take $f(x) = W_e x$, $g(z) = W_d z$ with squared loss. Writing
$M = W_d W_e$, which has rank at most $k$,

$$
\mathcal{L} = \tfrac{1}{n}\sum_{i=1}^{n} \lVert x_i - M x_i \rVert_2^2
            = \operatorname{tr}\!\big((I - M)\,\Sigma\,(I - M)^{\top}\big).
$$

By the Eckart–Young theorem the minimiser over rank-$k$ matrices is
$M^\star = U_k U_k^{\top}$, where $U_k$ holds the top $k$ eigenvectors of
$\Sigma$, and the optimal loss is $\sum_{j>k} \lambda_j$. This is PCA's
objective and PCA's value.

The factorisation is not unique. For any invertible $A \in GL_k(\mathbb{R})$,

$$
(W_d, W_e) \;\longmapsto\; (W_d A^{-1},\; A W_e)
$$

leaves $M$ and the loss unchanged. The learned code is therefore determined only
up to an arbitrary invertible linear transform of the principal components:
non-orthogonal, unordered, arbitrarily scaled, and meaningless coordinate by
coordinate. The projector $M^\star$ is unique precisely when
$\lambda_k > \lambda_{k+1}$.

The linear squared-error landscape is benign — every local minimum is global,
the rest of the critical points are saddles — and nothing of the sort is known
once $f$ and $g$ are networks.

For the **denoising** variant, corrupt with $\tilde{x} = x + \sigma\varepsilon$,
$\varepsilon \sim \mathcal{N}(0, I)$, and minimise
$\mathbb{E}\lVert x - r(\tilde{x})\rVert_2^2$ over an unconstrained
$r$. The minimiser is the conditional mean $r^\star(\tilde{x}) =
\mathbb{E}[x \mid \tilde{x}]$, and Tweedie's identity gives

$$
r^\star(\tilde{x}) - \tilde{x} \;=\; \sigma^2\, \nabla_{\tilde{x}} \log p_\sigma(\tilde{x}),
$$

where $p_\sigma$ is the data density convolved with the noise. A trained
denoiser is therefore an estimate of the score of the _smoothed_ density — the
link that diffusion models later build on.

## Assumptions and requirements

The PCA equivalence needs all of: linear $f$ and $g$, squared loss, centred data
(or bias terms), and an actual global optimum. Change the loss to $\ell_1$ or
cross-entropy and it fails; the eigen-gap is what makes even the subspace
unique.

The reconstruction loss encodes an assumption about observation noise. Squared
error is the Gaussian likelihood and returns the conditional mean, which is why
squared-error image reconstructions are blurry rather than merely inaccurate;
per-pixel cross-entropy assumes independent Bernoulli observations. A loss
chosen out of habit shows up directly in the reconstructions.

Learning anything requires low-dimensional structure to find: on isotropic
Gaussian data every $k$-dimensional projection is equally good.

The denoising score identity assumes Gaussian corruption, squared loss, and
enough capacity to approach the conditional mean; with masking noise or a
constrained $r$ it does not hold as stated.

## Uses and applicability

Reach for an autoencoder when you want a compact representation of unlabelled
data and you care about _reconstruction_ — compression, denoising, inpainting,
or a latent space that a second model will operate inside. The last is the
largest use today: latent diffusion generators run in the code space of a
trained autoencoder rather than in pixel space, which is what makes them
affordable, and discrete-code variants act as tokenisers for autoregressive
image and audio models.

Do not reach for one to _sample_ new data; that needs a model of the latent
distribution, which a plain autoencoder lacks. Do not use one where PCA
suffices, since PCA is deterministic, ordered and far easier to defend. For
two-dimensional visualisation, [t-SNE](./t-sne.md) and [UMAP](./umap.md)
usually give more legible maps than a two-unit bottleneck.

## Limitations and common mistakes

**A plain autoencoder is not a generative model.** Nothing in the objective
constrains the aggregate distribution of codes: it may be a thin curved sheet,
a set of disconnected islands, or a heavy-tailed cloud. Drawing
$z \sim \mathcal{N}(0, I)$ and decoding is unjustified and usually produces
nonsense, because most of code space was never visited in training. Becoming
generative means constraining the latent distribution, or fitting a density over
the codes afterwards — the whole content of the variational version.

**A linear autoencoder does not learn the principal components.** It learns the
principal subspace. Anyone reading a latent unit as "the first component" is
reading an arbitrary element of a $GL_k$ orbit.

**Lower reconstruction error does not mean a better representation.** The best
attainable error never rises as $k$ or capacity grows, so it cannot select
either, and a model that reconstructs perfectly by memorising indices has
learned nothing.

**Reconstruction error is a fragile anomaly score.** High-capacity autoencoders
often reconstruct out-of-distribution inputs well, since a smooth map fitted on
one dataset can generalise to another; the assumption that unfamiliar inputs
reconstruct badly is empirical, not guaranteed.

Two smaller ones: tied weights ($W_d = W_e^{\top}$) are a regularising
convention, not part of the definition and not the source of the PCA
connection; and U-Net-style skips around the bottleneck let information bypass
the code entirely, improving reconstructions while destroying the
representation.

## Variants and alternatives

**Undercomplete** autoencoders constrain $k < d$ and are the base case.
**Sparse** autoencoders allow $k > d$ and penalise the code instead, with
$\lambda\lVert z\rVert_1$ or a KL penalty pulling each unit's mean activation
towards a small target rate; the code is wide but few units fire at once, which
tends to give part-like features. **Denoising** autoencoders corrupt the input
and ask for the clean original, buying the score estimate above.
**Contractive** autoencoders penalise the Frobenius norm of the encoder
Jacobian, reaching the same insensitivity explicitly. **Masked** autoencoders
delete a large fraction of the input patches — now a standard form for images,
and the same idea as masked language modelling.

**Variational autoencoders** make the encoder a distribution and add a KL term
pulling the code distribution towards a prior, which is what turns the
architecture generative. **Vector-quantised** variants swap the continuous code
for a learned codebook lookup, giving discrete tokens.

Genuinely different approaches:
[PCA](./principal-component-analysis.md) and kernel PCA for the linear and
kernelised cases, [ICA](./independent-component-analysis.md) when you want
independent rather than merely decorrelated factors, and
[contrastive learning](./contrastive-learning.md), which abandons
reconstruction for an invariance objective. Which of reconstruction and
contrast transfers better is a benchmark-dependent empirical question that has
swung both ways, not a settled matter.

## History and attribution

The construction has several nearly independent origins in the mid-1980s
connectionist literature, where an "encoder problem" — $N$ inputs, a handful of
hidden units, $N$ outputs, target equal to input — was a standard demonstration
that [backpropagation](./backpropagation.md) could discover internal
representations. The equivalence between linear auto-association and the
singular value decomposition, and the absence of non-global local minima, were
established in the late 1980s by Bourlard and Kamp and by Baldi and Hornik;
Kramer framed the nonlinear case as nonlinear principal component analysis in 1991.

Interest revived in 2006, when Hinton and Salakhutdinov showed that deep
autoencoders initialised by layerwise unsupervised pretraining gave much better
low-dimensional codes than PCA — one of the results that opened the modern deep
learning period. Denoising autoencoders followed from Vincent and colleagues in
2008, contractive autoencoders from Rifai and colleagues in 2011, the
variational autoencoder from Kingma and Welling — and independently from
Rezende, Mohamed and Wierstra, who are usually credited alongside them — in
2013 and 2014, and the vector-quantised autoencoder from van den Oord and
colleagues in 2017.

## Sources

The _Deep Learning_ textbook devotes a chapter to autoencoders and is the single
best reference here: the undercomplete and regularised taxonomy, the denoising
and contractive constructions, the score connection, the memorisation failure
mode and the historical thread. _The Elements of Statistical Learning_ is the
reference for what principal components are and are not. MIT 18.065 covers the
SVD and the Eckart–Young theorem the linear result rests on. _Auto-Encoding
Variational Bayes_ is the primary source for the variational variant and for
what must be added before the architecture becomes generative.

## Prerequisites and next connections

Read [Multilayer Perceptrons](./multilayer-perceptrons.md) first, since the
encoder and decoder are ordinary feedforward networks, and
[Backpropagation](./backpropagation.md), which fits both halves.
[Principal Component Analysis](./principal-component-analysis.md) is the linear
case and the implicit benchmark; [Matrix Decompositions](./matrix-decompositions.md)
supplies the SVD behind it. [Loss Functions](./loss-functions.md) explains why
reconstructions come out blurry.

What this opens up: the variational autoencoder, which supplies the missing
latent prior; [Self-Supervised Learning](./self-supervised-learning.md), where
masked reconstruction is one of the leading pretext tasks;
[Contrastive Learning](./contrastive-learning.md) as the competing family; and
[Regularization](./regularization.md), whose vocabulary the sparse and
contractive variants borrow.
