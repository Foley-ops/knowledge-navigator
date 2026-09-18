---
concept_id: concept.learning.unsupervised_learning
title: Unsupervised Learning
slug: /concepts/unsupervised-learning
kind: concept
tier: 1
review_state: generated-draft
summary: Learning from inputs alone — clustering, dimensionality reduction, density estimation and generative modelling — where no label defines success, so the choice of objective decides what counts as structure.
categories:
  - Artificial Intelligence/Learning Paradigms
primary_category: Artificial Intelligence/Learning Paradigms
relationships:
  - type: contrasts_with
    target: concept.learning.supervised_learning
    note: Supervised learning is handed a loss by its labels; unsupervised learning has to choose one, which is the whole difference in how results are judged.
  - type: requires
    target: concept.probability.probability_theory
    note: The density-estimation and mixture-model half of the field is stated entirely in terms of distributions, likelihood and marginalisation, and cannot be read without them.
  - type: refined_by
    target: concept.learning.self_supervised_learning
    note: Self-supervised methods manufacture a prediction target from the input itself, turning a chosen unsupervised objective into a well-posed supervised one.
  - type: contributes_to
    target: concept.learning.transfer_learning
    note: Representations fitted without labels are the usual starting point that transfer learning then adapts to a labelled downstream task.
sources:
  - source_id: source.hastie.elements_of_statistical_learning
    title: Hastie, Tibshirani and Friedman, The Elements of Statistical Learning
    url: https://hastie.su.domains/ElemStatLearn/
    source_kind: authoritative-secondary
    supports:
      - definition
      - why-it-matters
      - formal-treatment
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
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.lloyd1982.least_squares_quantization
    title: Least squares quantization in PCM
    url: https://ieeexplore.ieee.org/document/1056489
    source_kind: primary-research
    supports:
      - formal-treatment
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.ester1996.dbscan
    title: A Density-Based Algorithm for Discovering Clusters in Large Spatial Databases with Noise
    url: https://cdn.aaai.org/KDD/1996/KDD96-037.pdf
    source_kind: primary-research
    supports:
      - concrete-example
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
unresolved_references:
  - label: Kleinberg's impossibility theorem for clustering
    reason: The page states that no clustering function can simultaneously satisfy scale-invariance, richness and consistency. No source in the registry covers clustering axiomatics, so the result is named without a citation.
    sections:
      - limitations-and-common-mistakes
  - label: Faithfulness of t-SNE and UMAP embeddings to global geometry
    reason: The registry lists both the t-SNE and the UMAP paper, but this page's four citations are spent elsewhere, so the specific warning that distances between clusters and apparent cluster sizes in such a plot are not faithful is uncited here.
    sections:
      - limitations-and-common-mistakes
  - label: Reframing of unsupervised representation learning as self-supervised
    reason: The claim that most of what was called unsupervised pretraining is now filed under self-supervised learning is an observation about how the field's vocabulary moved, and no cited source documents that shift.
    sections:
      - variants-and-alternatives
      - history-and-attribution
claims: []
---

## Definition

**Unsupervised learning** is the setting in which a learner receives inputs
$x_1, \dots, x_n$ and nothing else — no target values, no reward — and must
return a description of their structure: a partition, a low-dimensional
coordinate system, a probability density, or a procedure for generating new
samples. What makes it a distinct setting is not that no human is involved but
that **no loss function comes with the data**. In supervised learning the labels
define what "correct" means; here the practitioner defines it, by picking an
objective, a distance and a model family before seeing any answer.

Four families do most of the work: **clustering** (partition the points),
**dimensionality reduction** (re-coordinate them in fewer numbers),
**density estimation** (fit $p(x)$), and **generative modelling** (sample from
it). They overlap: a mixture model is a density that induces a clustering, and
an autoencoder is a reduction that induces a generator.

## Why it matters

Labels are expensive and inputs are nearly free. A hospital has millions of
unlabelled images and a few thousand annotated ones; a telescope survey has no
labels at all because nobody knows the categories yet. Unsupervised methods let
you work anyway, and three of their outputs are useful in their own right rather
than as a substitute for supervision.

A fitted density assigns a likelihood to a new point, which is what anomaly
detection and lossless compression both need. A clustering of single-cell
expression data is how cell types get proposed in the first place — the taxonomy
is the finding, not a step toward one. And a representation fitted on unlabelled
data gives a downstream model a better starting point than random initialisation
when labelled examples are scarce.

## Intuition

Supervised learning is marking against an answer key. Unsupervised learning is
being handed a drawer of kitchen implements and told to tidy it. By function,
by material, by size, by how often you use them — each arrangement is defensible,
and nothing in the drawer adjudicates. "Tidy" is the part you supply.

The analogy breaks in one place worth knowing. Density estimation does have an
honest external score: held-out log-likelihood is computed on data the model
never saw, so once you have chosen the criterion, you can be wrong about the fit
in a way the data detects. Clustering has no such fallback. There is no held-out
partition to compare against, which is why clustering evaluation is genuinely
hard and why the literature on cluster validity never converged.

## Concrete example

Six points on a line: $0, 1, 2, 10, 11, 30$.

$k$-means minimises within-cluster squared error. With $k = 2$ the optimum is
$\{0,1,2,10,11\}$ and $\{30\}$: the first cluster has mean $4.8$ and error
$23.04 + 14.44 + 7.84 + 27.04 + 38.44 = 110.8$, the second has error $0$. Every
other split is worse — $\{0,1,2\}$ against $\{10,11,30\}$ costs $2 + 254 = 256$.
So the "obvious" grouping loses, because one far point contributes more squared
error than merging two tight groups does.

With $k = 3$ the optimum is $\{0,1,2\}$, $\{10,11\}$, $\{30\}$, total error
$2 + 0.5 + 0 = 2.5$ — the answer a person would have given.

Now run DBSCAN with $\varepsilon = 2$ and minPts $= 2$. The $\varepsilon$-ball of
$0$, $1$ and $2$ contains all three, so each is a core point; $10$ and $11$ are
core points of each other; $30$ has only itself, is reachable from nothing, and
is labelled **noise**. The output is $\{0,1,2\}$, $\{10,11\}$, and one point in
no cluster at all.

Three different answers from six unchanging numbers. Nothing in the data chose
between them: $k$-means was told how many clusters, DBSCAN was told a density
scale, and the outlier is a cluster, a noise point, or an ordinary member
depending on which you asked.

## Formal treatment

Let $x_1, \dots, x_n \in \mathcal{X}$ be drawn i.i.d. from an unknown $p$. There
is no $y$, hence no risk $\mathbb{E}[\ell(h(x), y)]$ to estimate. The learner
instead fixes an objective $L$ over hypotheses and returns
$\hat{h} = \arg\min_h L(h; x_{1:n})$.

**Density estimation.** Choose a family $\{q_\theta\}$ and maximise the average
log-likelihood, which is equivalent to minimising a Kullback–Leibler divergence
from the empirical distribution $\hat{p}_n$:

$$
\hat\theta = \arg\max_\theta \frac{1}{n}\sum_{i=1}^{n} \log q_\theta(x_i)
= \arg\min_\theta \operatorname{KL}(\hat{p}_n \,\|\, q_\theta).
$$

**Quantisation.** For an assignment $C : \{1..n\} \to \{1..k\}$ with centroids
$\mu_1, \dots, \mu_k$, minimise the within-cluster scatter

$$
W(C) = \sum_{j=1}^{k} \sum_{i : C(i) = j} \lVert x_i - \mu_j \rVert_2^2 .
$$

Lloyd's algorithm alternates assigning each $x_i$ to its nearest centroid and
setting each $\mu_j$ to the mean of its members. Each step is non-increasing in
$W$, so it converges, but only to a local minimum: minimising $W$ exactly is
NP-hard for general $k$ and dimension, which is why restarts matter.

**Reduction.** Seek $f : \mathcal{X} \to \mathbb{R}^d$ and
$g : \mathbb{R}^d \to \mathcal{X}$ minimising
$\sum_i \lVert x_i - g(f(x_i)) \rVert^2$. Restricted to linear maps this is PCA,
solved in closed form by the top $d$ eigenvectors of the sample covariance, and
optimal among rank-$d$ approximations in the Frobenius norm.

These are connected. For a Gaussian mixture
$p(x) = \sum_j \pi_j \mathcal{N}(x; \mu_j, \Sigma_j)$, EM alternates computing
responsibilities $\gamma_{ij} = P(z_i = j \mid x_i)$ with re-estimating
$(\pi, \mu, \Sigma)$, and increases the likelihood monotonically to a stationary
point. Fix $\Sigma_j = \sigma^2 I$ and let $\sigma \to 0$: the responsibilities
harden to $0/1$ and EM becomes exactly Lloyd's algorithm. $k$-means is the
zero-variance limit of a Gaussian mixture.

## Assumptions and requirements

The points are assumed i.i.d. from a fixed distribution. Drop that — pool two
years of data collected with different instruments — and the leading "cluster"
is often the batch effect.

Each objective smuggles in a shape. Squared-error clustering assumes clusters
are roughly isotropic, comparably sized and linearly separable from each other;
it will split one elongated cluster rather than leave it whole. It also assumes
the Euclidean metric is meaningful, so the result depends on feature scaling:
multiply one coordinate by ten and the partition can change. DBSCAN assumes
instead that clusters are density-connected regions separated by sparser space,
which frees it from convex shapes and from fixing $k$, at the price of assuming
a single density scale — it handles clusters of very different density poorly.
Embedding methods assume the data lie near a low-dimensional manifold.

Likelihood-based methods carry their own hypotheses. Mixture models are
identifiable only up to permutation of the components, so "cluster 3" means
nothing across runs. Worse, the Gaussian mixture likelihood is unbounded: send
one component's variance to zero on a single point and the likelihood diverges,
so the global maximum is a degenerate solution and the useful answer is a good
local one. Nonparametric density estimation needs a sample size growing
exponentially in the dimension to achieve a fixed accuracy, which is why kernel
density estimation is a tool for a handful of dimensions, not a thousand.

## Uses and applicability

Reach for unsupervised methods when labels do not exist yet, when you are
exploring rather than predicting, when you need a likelihood for outlier
scoring, or when abundant unlabelled data can pretrain a representation for a
task with few labels.

Do not reach for them when you have a specific downstream metric and any labels
at all. A few hundred labelled examples with a supervised or semi-supervised
model will usually beat clustering used as a proxy for the classes you actually
want, because the clustering is optimising something else. And do not hand
cluster identities downstream as though they were a validated taxonomy — they
are a hypothesis produced by your choice of objective.

## Limitations and common mistakes

The first mistake is reading "unsupervised" as "assumption-free". The features,
the preprocessing, the distance, the model family and $k$ are all supervision
arriving earlier and less visibly.

The second is circular evaluation. Silhouette score and within-cluster scatter
measure how well the partition fits the shape the algorithm already assumed, so
choosing $k$ by silhouette and then reporting silhouette as validation proves
nothing. Kleinberg's impossibility theorem makes the difficulty formal: no
clustering function can satisfy scale-invariance, richness and consistency at
once, so there is no neutral criterion to appeal to.

The third is that $k$-means always returns $k$ clusters. Run it on uniform noise
and you get clean-looking groups; the algorithm has no way to report that there
was no structure. Test against a null before believing a partition.

The fourth concerns visualisation. A t-SNE or UMAP plot optimises preservation
of local neighbourhoods, so distance between blobs, blob size and blob density
are not faithful to the input geometry, and the picture changes substantially
with perplexity or neighbour count. Apparent clusters in such a plot are a
hypothesis, not evidence.

## Variants and alternatives

For clustering: $k$-means for speed and spherical structure; Gaussian mixtures
with EM for soft assignments and per-cluster covariance; hierarchical linkage
methods, which return a whole tree and defer the choice of $k$ to where you cut
it; DBSCAN and HDBSCAN for arbitrary shapes plus an explicit noise label;
spectral clustering, which cuts a similarity graph via eigenvectors of its
Laplacian and handles non-convex clusters at a higher computational cost.

For reduction: PCA (linear, closed-form, preserves global variance), kernel PCA
and autoencoders (nonlinear, no closed form), t-SNE and UMAP (visualisation,
local structure only).

For density and generation: kernel density estimation in low dimensions,
mixture models, normalising flows and autoregressive models where exact
likelihood matters, and diffusion models or GANs where sample quality matters
more than a tractable likelihood.

The genuine competitors are other supervision regimes: semi-supervised learning
where a few labels anchor the structure, weak supervision where noisy rules
substitute for labels, and above all self-supervised learning, which invents a
prediction target from the input — mask part of it, or contrast two views — and
so recovers a well-posed objective and a clear way to evaluate. Most of what was
called unsupervised pretraining is now filed under that name.

## History and attribution

The ideas have several independent origins, which is why no one person owns the
term. Principal component analysis goes back to Pearson in 1901 and Hotelling in
the 1930s, as a technique in statistics rather than in learning. Lloyd's
least-squares quantisation algorithm was developed at Bell Labs for pulse-code
modulation — compressing a signal, not discovering categories — and published in
1982; MacQueen's 1967 paper gave the procedure the name $k$-means. Hierarchical
clustering was developed in numerical taxonomy in the 1960s by biologists trying
to classify organisms. EM was given its general formulation by Dempster, Laird
and Rubin in 1977. DBSCAN came out of spatial databases in 1996, motivated
explicitly by the need to find clusters of arbitrary shape without being told
how many there were. The deep-learning revival of unsupervised pretraining in
the mid-2000s was later largely displaced by supervised training at scale, and
then returned in self-supervised form.

## Sources

**The Elements of Statistical Learning**, chapter 14, is the best single
treatment of the setting: it is explicit that there is no direct measure of
success here, and it covers $k$-means, hierarchical clustering, PCA and their
relatives with the practical caveats attached. **Probabilistic Machine
Learning** is the reference for the likelihood-based half — mixture models, EM,
latent-variable models and generative modelling — including the identifiability
and degeneracy problems. **Least squares quantization in PCM** is the original
statement of the iterative algorithm now called $k$-means. **A Density-Based
Algorithm for Discovering Clusters** defines core points, density-reachability
and the noise label used in the worked example.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first: densities, likelihood
and marginalising over a latent variable are the vocabulary of everything beyond
clustering. [Matrix Decompositions](./matrix-decompositions.md) supplies the
eigen- and singular-value machinery behind PCA and spectral methods.

From here, [Bayesian Inference](./bayesian-inference.md) shows what a fitted
density is for once you have one, [Nonconvex Optimization](./nonconvex-optimization.md)
explains why EM and Lloyd's algorithm reach local optima and what restarts buy,
[Spectral Theory](./spectral-theory.md) underpins spectral clustering, and
[High-Dimensional Statistics](./high-dimensional-statistics.md) explains why
distance-based structure degrades as dimension grows. The neighbouring pages on
supervised, self-supervised and transfer learning complete the picture of how
these paradigms are combined in practice.
