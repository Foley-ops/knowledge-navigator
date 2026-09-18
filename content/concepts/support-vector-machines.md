---
concept_id: concept.machine_learning.support_vector_machines
title: Support Vector Machines
slug: /concepts/support-vector-machines
aliases: []
kind: algorithm
tier: 1
review_state: generated-draft
summary: A support vector machine chooses a separating hyperplane with maximum margin, using hinge loss and regularization for nonseparable data and kernels for nonlinear boundaries.
categories:
  - Artificial Intelligence/Classical Machine Learning
primary_category: Artificial Intelligence/Classical Machine Learning
relationships:
  - type: requires
    target: concept.optimization.convex_optimization
    note: Training the standard primal or dual SVM is a convex quadratic optimization problem.
  - type: contributes_to
    target: concept.machine_learning.generalization
    note: Margin control provides a capacity measure connecting geometric separation to generalization bounds.
  - type: contrasts_with
    target: concept.machine_learning.logistic_regression
    note: Both learn linear score functions, but SVM uses margin-based hinge loss while logistic regression uses probabilistic log loss.
  - type: contributes_to
    target: concept.machine_learning.kernel_methods
    note: Kernelized SVMs are a canonical use of positive-semidefinite kernels and the representer form.
sources:
  - source_id: source.cortes1995.support_vector_networks
    title: Support-Vector Networks
    url: https://link.springer.com/article/10.1007/BF00994018
    source_kind: primary-research
    supports:
      - definition
      - why-it-matters
      - intuition
      - formal-treatment
      - assumptions-and-requirements
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.shalev_shwartz.understanding_machine_learning
    title: 'Shalev-Shwartz and Ben-David, Understanding Machine Learning: From Theory to Algorithms'
    url: https://www.cs.huji.ac.il/~shais/UnderstandingMachineLearning/
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
unresolved_references: []
claims: []
---

## Definition

A **support vector machine** (SVM) is a supervised classifier that learns a
score $f(x)=w^Tx+b$ and predicts its sign. In the separable case it chooses,
among all hyperplanes classifying the training data correctly, the one with the
largest geometric margin. Only training points touching or violating the margin
determine the solution; these are the **support vectors**.

For overlapping classes, a soft-margin SVM permits violations and balances them
against the size of $w$. Replacing inner products by a kernel allows the same
optimization to produce nonlinear boundaries without explicitly constructing
the associated feature coordinates.

## Why it matters

The SVM joins geometry, [convex optimization](./convex-optimization.md), and
statistical capacity control in one algorithm. Maximizing margin is equivalent
to minimizing a norm under separation constraints, and the soft-margin problem
has a unique global optimum in its weight vector. This made high-dimensional
classification with sparse features and nonlinear kernels practical without
searching a nonconvex objective.

The method also distinguishes a decision score from a probability. It can give
a reliable separating boundary when the data do not justify a calibrated
probabilistic model, provided margin-based validation matches the application.

## Intuition

Many lines can separate two groups of points. The SVM chooses the line with the
widest empty corridor between the groups, reasoning that small perturbations are
least likely to cross a wide corridor. Points far beyond its walls do not affect
where the corridor sits; points on or inside the walls do.

The corridor picture breaks after a nonlinear kernel: the maximum-margin
hyperplane lives in a feature space that may be very high- or infinite-
dimensional, and its boundary back in input space can curve. It also does not
make the signed score a probability.

## Concrete example

Consider one-dimensional observations $x=(-2,-1,1,2)$ with labels
$y=(-1,-1,+1,+1)$. A separating score has form $f(x)=wx+b$. Symmetry gives
$b=0$. The canonical hard-margin constraints require $y_i(wx_i)\ge1$. The
closest points $-1$ and $1$ imply $w\ge1$, so minimizing $\tfrac12w^2$ gives
$w=1$.

The decision boundary is $x=0$. The functional margins are $(2,1,1,2)$; only
$x=-1$ and $x=1$ meet the constraint with equality, so they are support vectors.
The geometric margin from the boundary to either supporting point is
$1/\lVert w\rVert=1$, and the full corridor width is $2$.

If the positive point at $x=1$ were relabeled negative, no threshold could
separate all observations. The soft-margin formulation would pay hinge loss for
a violation rather than declare the problem infeasible.

## Formal treatment

For labels $y_i\in\{-1,+1\}$, the hard-margin primal is

$$
\min_{w,b}\frac12\lVert w\rVert^2
\quad\text{subject to}\quad y_i(w^Tx_i+b)\ge1\ \forall i.
$$

The soft-margin objective can be written

$$
\min_{w,b}\frac{\lambda}{2}\lVert w\rVert^2+
\frac1n\sum_{i=1}^n\max(0,1-y_i(w^Tx_i+b)).
$$

The second term is hinge loss. In a common constrained parameterization, slack
variables $\xi_i\ge0$ and penalty $C\sum_i\xi_i$ replace the average hinge term;
larger $C$ penalizes violations more strongly and corresponds inversely, up to
scaling conventions, to regularization strength.

The dual depends on data only through inner products:

$$
\max_{\alpha}\sum_i\alpha_i-\frac12\sum_{i,j}
\alpha_i\alpha_jy_iy_jK(x_i,x_j),
$$

subject to $0\le\alpha_i\le C$ and $\sum_i\alpha_i y_i=0$. Prediction is
$\operatorname{sign}(\sum_i\alpha_i y_iK(x_i,x)+b)$; terms with
$\alpha_i=0$ vanish, leaving the support vectors.

## Assumptions and requirements

Features must be represented so inner products or distances are meaningful;
standardization is usually necessary because a large-scale coordinate can
dominate both. A kernel must be symmetric positive semidefinite for the standard
convex interpretation. The regularization parameter and kernel parameters must
be selected on validation data inside any preprocessing pipeline.

The training distribution should resemble deployment, and labels should encode
a boundary that margin loss is suited to learn. Class imbalance may require
class-weighted penalties. Multiclass prediction is not intrinsic to the binary
formulation and needs a decomposition or a direct multiclass variant.

## Uses and applicability

Linear SVMs are strong choices for high-dimensional sparse classification, such
as document features, where the number of features can exceed the number of
examples. Kernel SVMs suit moderate datasets with a defensible similarity
function and nonlinear boundary.

Avoid a nonlinear SVM when training-set size makes the kernel matrix prohibitive
or low-latency prediction cannot afford many support-vector evaluations. Use a
probabilistic model when calibrated probabilities are a first-class output, or
a tree ensemble when heterogeneous tabular interactions dominate.

## Limitations and common mistakes

Kernel training can require quadratic memory and superlinear time, and
prediction cost grows with the number of support vectors. Scores are margins,
not probabilities. Results can be sensitive to feature scaling, $C$, and kernel
bandwidth; a flexible radial kernel with poorly validated parameters can nearly
memorize the training set.

Common mistakes are reversing the meaning of $C$ across alternative objective
scalings, scaling before data splitting, evaluating accuracy alone on an
imbalanced task, and calling every training point a support vector. A point is a
support vector only when its dual coefficient is nonzero for the fitted model.

## Variants and alternatives

Linear SVM solvers avoid forming a kernel matrix. Kernel SVMs use radial,
polynomial, or domain-specific kernels. Support vector regression replaces the
classification margin with an $\varepsilon$-insensitive tube. One-class SVMs
estimate a support region. Logistic regression provides probabilistic log loss;
nearest neighbors supplies a local nonparametric alternative.

## History and attribution

Cortes and Vapnik's registered paper _Support-Vector Networks_ presents the
soft-margin support-vector approach for nonseparable data and nonlinear decision
surfaces. The broader theoretical lineage is not reconstructed beyond what that
paper and the registered learning-theory text support.

## Sources

- _Support-Vector Networks_ supports the maximum-margin classifier, soft-margin
  extension, kernels, and paper-level attribution.
- _Understanding Machine Learning_ supports the hinge-loss objective, convex
  analysis, capacity perspective, and practical regularization interpretation.

## Prerequisites and next connections

Read [Convex Optimization](./convex-optimization.md) for primal and dual
problems, then [Generalization](./generalization.md) for the role of capacity and
validation. Continue to [Kernel Methods](./kernel-methods.md) for the feature-
space construction. Compare [Logistic Regression](./logistic-regression.md) when
probabilities rather than margins are required.
