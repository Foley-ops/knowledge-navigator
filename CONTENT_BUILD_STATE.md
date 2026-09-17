# Content Build State

Resume point for the content build: turning every atlas candidate into a real concept page.

**Build authority:** the task brief, [`content/atlas.yaml`](./content/atlas.yaml) for the
candidates, [`AGENT_CONTENT_CONTRACT.md`](./AGENT_CONTENT_CONTRACT.md) for what a page must be,
and [`scripts/content-order.mjs`](./scripts/content-order.mjs) for the frozen order. Sources may
be cited only from [`docs/source-registry.json`](./docs/source-registry.json).

**Everything above the hand-written marker is generated** by
`node scripts/content-state.mjs` from the atlas, the content directory and the build order. It
is never edited by hand, so it cannot describe a corpus that does not exist.

## Resume point

**Batch 4 of 28.** 10 of 10 pages in it are still to write.

Write these files next:

- `content/concepts/tensor-decomposition.md` — Tensor Decomposition (concept.linear_algebra.tensor_decomposition)
- `content/concepts/probability-theory.md` — Probability Theory (concept.probability.probability_theory)
- `content/concepts/stochastic-processes.md` — Stochastic Processes (concept.probability.stochastic_processes)
- `content/concepts/martingales.md` — Martingales (concept.probability.martingales)
- `content/concepts/concentration-inequalities.md` — Concentration Inequalities (concept.probability.concentration_inequalities)
- `content/concepts/frequentist-inference.md` — Frequentist Inference (concept.probability.frequentist_inference)
- `content/concepts/bayesian-inference.md` — Bayesian Inference (concept.probability.bayesian_inference)
- `content/concepts/high-dimensional-statistics.md` — High-Dimensional Statistics (concept.probability.high_dimensional_statistics)
- `content/concepts/random-matrix-theory.md` — Random Matrix Theory (concept.probability.random_matrix_theory)
- `content/concepts/probability-and-computing.md` — Probability and Computing (concept.probability.probability_and_computing)

Then: `node scripts/check-page.mjs <files>`, `npm run validate`, `npm run compile`,
`npx vitest run`, and commit the batch.

## Running totals

| Total | Count |
| --- | --- |
| Candidates in the atlas | 291 |
| Candidates covered by a page | 41 |
| Markdown pages in the corpus | 41 |
| Tier 1 pages | 41 |
| Tier 2 pages | 0 |
| Tier 3 identities | 0 |
| Planned pages written | 30 of 280 |

### By area

| Area | Written | Planned | Done |
| --- | --- | --- | --- |
| Artificial Intelligence | 0 | 148 | 0% |
| Mathematics | 30 | 85 | 35% |
| Programming | 0 | 47 | 0% |

### By category

| Category | Written | Planned | State |
| --- | --- | --- | --- |
| Artificial Intelligence/Classical Machine Learning | 0 | 26 |  |
| Artificial Intelligence/Deep Learning — Architectures | 0 | 42 |  |
| Artificial Intelligence/Deep Learning — Training | 0 | 12 |  |
| Artificial Intelligence/Domains | 0 | 7 |  |
| Artificial Intelligence/Domains/Computer Vision | 0 | 4 |  |
| Artificial Intelligence/Domains/Natural Language Processing | 0 | 5 |  |
| Artificial Intelligence/Learning Paradigms | 0 | 9 |  |
| Artificial Intelligence/Other Traditions & Frontiers | 0 | 11 |  |
| Artificial Intelligence/Reinforcement Learning | 0 | 19 |  |
| Artificial Intelligence/Symbolic AI | 0 | 5 |  |
| Artificial Intelligence/Symbolic AI/Planning | 0 | 3 |  |
| Artificial Intelligence/Symbolic AI/Search | 0 | 5 |  |
| Mathematics/Algebra | 0 | 14 |  |
| Mathematics/Analysis | 18 | 18 | complete |
| Mathematics/Foundations | 4 | 4 | complete |
| Mathematics/Foundations/Formal Verification | 0 | 2 |  |
| Mathematics/Foundations/Logic & Proof | 3 | 3 | complete |
| Mathematics/Geometry & Topology | 0 | 15 |  |
| Mathematics/Linear & Multilinear Algebra | 5 | 6 |  |
| Mathematics/Mathematical Physics | 0 | 2 |  |
| Mathematics/Number Theory | 0 | 3 |  |
| Mathematics/Optimization | 0 | 7 |  |
| Mathematics/Probability & Statistics | 0 | 9 |  |
| Mathematics/Theory of Computation | 0 | 2 |  |
| Programming/Data Structures & Algorithms | 0 | 5 |  |
| Programming/Languages | 0 | 15 |  |
| Programming/Languages/Paradigms | 0 | 4 |  |
| Programming/ML Engineering | 0 | 7 |  |
| Programming/Software Practice | 0 | 9 |  |
| Programming/Systems | 0 | 7 |  |

## Completed pages

30 of the planned 280, in the order they were written.

| Title | Concept id | Tier | Atlas |
| --- | --- | --- | --- |
| Set Theory | `concept.foundations.set_theory` | tier 1 | covered |
| Category Theory | `concept.foundations.category_theory` | tier 1 | covered |
| Model Theory | `concept.foundations.model_theory` | tier 1 | covered |
| Computability Theory | `concept.foundations.computability_theory` | tier 1 | covered |
| Propositional Logic | `concept.logic.propositional_logic` | tier 1 | covered |
| First-Order Logic | `concept.logic.first_order_logic` | tier 1 | covered |
| Proof Theory | `concept.logic.proof_theory` | tier 1 | covered |
| Single-Variable Calculus | `concept.analysis.single_variable_calculus` | tier 1 | covered |
| Real Analysis | `concept.analysis.real_analysis` | tier 1 | covered |
| Multivariable Calculus | `concept.analysis.multivariable_calculus` | tier 1 | covered |
| Vector Calculus | `concept.analysis.vector_calculus` | tier 1 | covered |
| Ordinary Differential Equations | `concept.analysis.ordinary_differential_equations` | tier 1 | covered |
| Partial Differential Equations | `concept.analysis.partial_differential_equations` | tier 1 | covered |
| Measure Theory | `concept.analysis.measure_theory` | tier 1 | covered |
| Complex Analysis | `concept.analysis.complex_analysis` | tier 1 | covered |
| Fourier Analysis | `concept.analysis.fourier_analysis` | tier 1 | covered |
| Harmonic Analysis | `concept.analysis.harmonic_analysis` | tier 1 | covered |
| Wavelets | `concept.analysis.wavelets` | tier 1 | covered |
| Functional Analysis | `concept.analysis.functional_analysis` | tier 1 | covered |
| Hilbert Spaces | `concept.analysis.hilbert_spaces` | tier 1 | covered |
| Banach Spaces | `concept.analysis.banach_spaces` | tier 1 | covered |
| Operators | `concept.analysis.operators` | tier 1 | covered |
| Calculus of Variations | `concept.analysis.calculus_of_variations` | tier 1 | covered |
| Dynamical Systems | `concept.analysis.dynamical_systems` | tier 1 | covered |
| Chaos | `concept.analysis.chaos` | tier 1 | covered |
| Vector Spaces | `concept.linear_algebra.vector_spaces` | tier 1 | covered |
| Matrix Theory | `concept.linear_algebra.matrix_theory` | tier 1 | covered |
| Matrix Decompositions | `concept.linear_algebra.matrix_decompositions` | tier 1 | covered |
| Spectral Theory | `concept.linear_algebra.spectral_theory` | tier 1 | covered |
| Tensors | `concept.linear_algebra.tensors` | tier 1 | covered |

## The ordered candidate list

All 280 candidates without a page at the start of this build, in the order
they are written: the mathematics a concept rests on before the concept, the programming
foundations before the engineering, the machine learning before the architectures that assume
it. Batches are ten pages each.

### Batch 1 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Set Theory | `concept.foundations.set_theory` | Mathematics/Foundations |
| x | Category Theory | `concept.foundations.category_theory` | Mathematics/Foundations |
| x | Model Theory | `concept.foundations.model_theory` | Mathematics/Foundations |
| x | Computability Theory | `concept.foundations.computability_theory` | Mathematics/Foundations |
| x | Propositional Logic | `concept.logic.propositional_logic` | Mathematics/Foundations/Logic & Proof |
| x | First-Order Logic | `concept.logic.first_order_logic` | Mathematics/Foundations/Logic & Proof |
| x | Proof Theory | `concept.logic.proof_theory` | Mathematics/Foundations/Logic & Proof |
| x | Single-Variable Calculus | `concept.analysis.single_variable_calculus` | Mathematics/Analysis |
| x | Real Analysis | `concept.analysis.real_analysis` | Mathematics/Analysis |
| x | Multivariable Calculus | `concept.analysis.multivariable_calculus` | Mathematics/Analysis |

### Batch 2 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Vector Calculus | `concept.analysis.vector_calculus` | Mathematics/Analysis |
| x | Ordinary Differential Equations | `concept.analysis.ordinary_differential_equations` | Mathematics/Analysis |
| x | Partial Differential Equations | `concept.analysis.partial_differential_equations` | Mathematics/Analysis |
| x | Measure Theory | `concept.analysis.measure_theory` | Mathematics/Analysis |
| x | Complex Analysis | `concept.analysis.complex_analysis` | Mathematics/Analysis |
| x | Fourier Analysis | `concept.analysis.fourier_analysis` | Mathematics/Analysis |
| x | Harmonic Analysis | `concept.analysis.harmonic_analysis` | Mathematics/Analysis |
| x | Wavelets | `concept.analysis.wavelets` | Mathematics/Analysis |
| x | Functional Analysis | `concept.analysis.functional_analysis` | Mathematics/Analysis |
| x | Hilbert Spaces | `concept.analysis.hilbert_spaces` | Mathematics/Analysis |

### Batch 3 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Banach Spaces | `concept.analysis.banach_spaces` | Mathematics/Analysis |
| x | Operators | `concept.analysis.operators` | Mathematics/Analysis |
| x | Calculus of Variations | `concept.analysis.calculus_of_variations` | Mathematics/Analysis |
| x | Dynamical Systems | `concept.analysis.dynamical_systems` | Mathematics/Analysis |
| x | Chaos | `concept.analysis.chaos` | Mathematics/Analysis |
| x | Vector Spaces | `concept.linear_algebra.vector_spaces` | Mathematics/Linear & Multilinear Algebra |
| x | Matrix Theory | `concept.linear_algebra.matrix_theory` | Mathematics/Linear & Multilinear Algebra |
| x | Matrix Decompositions | `concept.linear_algebra.matrix_decompositions` | Mathematics/Linear & Multilinear Algebra |
| x | Spectral Theory | `concept.linear_algebra.spectral_theory` | Mathematics/Linear & Multilinear Algebra |
| x | Tensors | `concept.linear_algebra.tensors` | Mathematics/Linear & Multilinear Algebra |

### Batch 4

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Tensor Decomposition | `concept.linear_algebra.tensor_decomposition` | Mathematics/Linear & Multilinear Algebra |
|   | Probability Theory | `concept.probability.probability_theory` | Mathematics/Probability & Statistics |
|   | Stochastic Processes | `concept.probability.stochastic_processes` | Mathematics/Probability & Statistics |
|   | Martingales | `concept.probability.martingales` | Mathematics/Probability & Statistics |
|   | Concentration Inequalities | `concept.probability.concentration_inequalities` | Mathematics/Probability & Statistics |
|   | Frequentist Inference | `concept.probability.frequentist_inference` | Mathematics/Probability & Statistics |
|   | Bayesian Inference | `concept.probability.bayesian_inference` | Mathematics/Probability & Statistics |
|   | High-Dimensional Statistics | `concept.probability.high_dimensional_statistics` | Mathematics/Probability & Statistics |
|   | Random Matrix Theory | `concept.probability.random_matrix_theory` | Mathematics/Probability & Statistics |
|   | Probability and Computing | `concept.probability.probability_and_computing` | Mathematics/Probability & Statistics |

### Batch 5

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Group Theory | `concept.algebra.group_theory` | Mathematics/Algebra |
|   | Ring Theory | `concept.algebra.ring_theory` | Mathematics/Algebra |
|   | Field Theory | `concept.algebra.field_theory` | Mathematics/Algebra |
|   | Order Theory | `concept.algebra.order_theory` | Mathematics/Algebra |
|   | Lattice Theory | `concept.algebra.lattice_theory` | Mathematics/Algebra |
|   | Galois Theory | `concept.algebra.galois_theory` | Mathematics/Algebra |
|   | Representation Theory | `concept.algebra.representation_theory` | Mathematics/Algebra |
|   | Lie Algebras | `concept.algebra.lie_algebras` | Mathematics/Algebra |
|   | Homological Algebra | `concept.algebra.homological_algebra` | Mathematics/Algebra |
|   | Complex Numbers | `concept.algebra.complex_numbers` | Mathematics/Algebra |

### Batch 6

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Quaternions | `concept.algebra.quaternions` | Mathematics/Algebra |
|   | Octonions | `concept.algebra.octonions` | Mathematics/Algebra |
|   | Clifford Algebra | `concept.algebra.clifford_algebra` | Mathematics/Algebra |
|   | Geometric Algebra | `concept.algebra.geometric_algebra` | Mathematics/Algebra |
|   | Euclidean Geometry | `concept.geometry.euclidean_geometry` | Mathematics/Geometry & Topology |
|   | Non-Euclidean Geometry | `concept.geometry.non_euclidean_geometry` | Mathematics/Geometry & Topology |
|   | Spherical Geometry | `concept.geometry.spherical_geometry` | Mathematics/Geometry & Topology |
|   | Hyperbolic Geometry | `concept.geometry.hyperbolic_geometry` | Mathematics/Geometry & Topology |
|   | Convex Geometry | `concept.geometry.convex_geometry` | Mathematics/Geometry & Topology |
|   | Point-Set Topology | `concept.geometry.point_set_topology` | Mathematics/Geometry & Topology |

### Batch 7

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Algebraic Topology | `concept.geometry.algebraic_topology` | Mathematics/Geometry & Topology |
|   | Manifolds | `concept.geometry.manifolds` | Mathematics/Geometry & Topology |
|   | Differential Geometry | `concept.geometry.differential_geometry` | Mathematics/Geometry & Topology |
|   | Differential Topology | `concept.geometry.differential_topology` | Mathematics/Geometry & Topology |
|   | Curvature | `concept.geometry.curvature` | Mathematics/Geometry & Topology |
|   | Lie Groups | `concept.geometry.lie_groups` | Mathematics/Geometry & Topology |
|   | Algebraic Geometry | `concept.geometry.algebraic_geometry` | Mathematics/Geometry & Topology |
|   | Fractal Geometry | `concept.geometry.fractal_geometry` | Mathematics/Geometry & Topology |
|   | Renormalization | `concept.geometry.renormalization` | Mathematics/Geometry & Topology |
|   | Elementary Number Theory | `concept.number_theory.elementary_number_theory` | Mathematics/Number Theory |

### Batch 8

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Analytic Number Theory | `concept.number_theory.analytic_number_theory` | Mathematics/Number Theory |
|   | Algebraic Number Theory | `concept.number_theory.algebraic_number_theory` | Mathematics/Number Theory |
|   | Automata | `concept.computation.automata` | Mathematics/Theory of Computation |
|   | Computational Complexity | `concept.computation.computational_complexity` | Mathematics/Theory of Computation |
|   | Convex Optimization | `concept.optimization.convex_optimization` | Mathematics/Optimization |
|   | Nonconvex Optimization | `concept.optimization.nonconvex_optimization` | Mathematics/Optimization |
|   | Stochastic Optimization | `concept.optimization.stochastic_optimization` | Mathematics/Optimization |
|   | Combinatorial Optimization | `concept.optimization.combinatorial_optimization` | Mathematics/Optimization |
|   | Integer Programming | `concept.optimization.integer_programming` | Mathematics/Optimization |
|   | Variational Methods | `concept.optimization.variational_methods` | Mathematics/Optimization |

### Batch 9

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Optimal Transport | `concept.optimization.optimal_transport` | Mathematics/Optimization |
|   | Hamiltonian Mechanics | `concept.physics.hamiltonian_mechanics` | Mathematics/Mathematical Physics |
|   | Statistical Mechanics | `concept.physics.statistical_mechanics` | Mathematics/Mathematical Physics |
|   | Lean | `concept.formal_verification.lean` | Mathematics/Foundations/Formal Verification |
|   | Coq | `concept.formal_verification.coq` | Mathematics/Foundations/Formal Verification |
|   | Complexity Analysis | `concept.algorithms.complexity_analysis` | Programming/Data Structures & Algorithms |
|   | Core Data Structures | `concept.algorithms.core_data_structures` | Programming/Data Structures & Algorithms |
|   | Sorting | `concept.algorithms.sorting` | Programming/Data Structures & Algorithms |
|   | Searching | `concept.algorithms.searching` | Programming/Data Structures & Algorithms |
|   | Graph Algorithms | `concept.algorithms.graph_algorithms` | Programming/Data Structures & Algorithms |

### Batch 10

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Imperative Programming | `concept.paradigms.imperative_programming` | Programming/Languages/Paradigms |
|   | Object-Oriented Programming | `concept.paradigms.object_oriented_programming` | Programming/Languages/Paradigms |
|   | Functional Programming | `concept.paradigms.functional_programming` | Programming/Languages/Paradigms |
|   | Array Programming | `concept.paradigms.array_programming` | Programming/Languages/Paradigms |
|   | Python | `concept.languages.python` | Programming/Languages |
|   | C | `concept.languages.c_language` | Programming/Languages |
|   | C++ | `concept.languages.cpp` | Programming/Languages |
|   | Rust | `concept.languages.rust` | Programming/Languages |
|   | Go | `concept.languages.go` | Programming/Languages |
|   | JavaScript | `concept.languages.javascript` | Programming/Languages |

### Batch 11

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | TypeScript | `concept.languages.typescript` | Programming/Languages |
|   | Haskell | `concept.languages.haskell` | Programming/Languages |
|   | Lisp | `concept.languages.lisp` | Programming/Languages |
|   | Julia | `concept.languages.julia` | Programming/Languages |
|   | R | `concept.languages.r_language` | Programming/Languages |
|   | MATLAB | `concept.languages.matlab` | Programming/Languages |
|   | Assembly | `concept.languages.assembly` | Programming/Languages |
|   | CUDA | `concept.languages.cuda` | Programming/Languages |
|   | GPU Kernels | `concept.languages.gpu_kernels` | Programming/Languages |
|   | Operating Systems | `concept.systems.operating_systems` | Programming/Systems |

### Batch 12

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Networking | `concept.systems.networking` | Programming/Systems |
|   | Parallel Computing | `concept.systems.parallel_computing` | Programming/Systems |
|   | Distributed Systems | `concept.systems.distributed_systems` | Programming/Systems |
|   | High-Performance Computing | `concept.systems.high_performance_computing` | Programming/Systems |
|   | Relational Databases | `concept.systems.relational_databases` | Programming/Systems |
|   | Graph Databases | `concept.systems.graph_databases` | Programming/Systems |
|   | Version Control | `concept.software.version_control` | Programming/Software Practice |
|   | Testing | `concept.software.testing` | Programming/Software Practice |
|   | Design Patterns | `concept.software.design_patterns` | Programming/Software Practice |
|   | APIs | `concept.software.apis` | Programming/Software Practice |

### Batch 13

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Protocols | `concept.software.protocols` | Programming/Software Practice |
|   | Continuous Integration | `concept.software.continuous_integration` | Programming/Software Practice |
|   | Continuous Delivery | `concept.software.continuous_delivery` | Programming/Software Practice |
|   | Containers | `concept.software.containers` | Programming/Software Practice |
|   | Model Context Protocol | `concept.software.model_context_protocol` | Programming/Software Practice |
|   | PyTorch | `concept.ml_engineering.pytorch` | Programming/ML Engineering |
|   | JAX | `concept.ml_engineering.jax` | Programming/ML Engineering |
|   | Training Infrastructure | `concept.ml_engineering.training_infrastructure` | Programming/ML Engineering |
|   | Experiment Tracking | `concept.ml_engineering.experiment_tracking` | Programming/ML Engineering |
|   | Deployment | `concept.ml_engineering.deployment` | Programming/ML Engineering |

### Batch 14

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Edge Inference | `concept.ml_engineering.edge_inference` | Programming/ML Engineering |
|   | Ollama | `concept.ml_engineering.ollama` | Programming/ML Engineering |
|   | Supervised Learning | `concept.learning.supervised_learning` | Artificial Intelligence/Learning Paradigms |
|   | Unsupervised Learning | `concept.learning.unsupervised_learning` | Artificial Intelligence/Learning Paradigms |
|   | Self-Supervised Learning | `concept.learning.self_supervised_learning` | Artificial Intelligence/Learning Paradigms |
|   | Transfer Learning | `concept.learning.transfer_learning` | Artificial Intelligence/Learning Paradigms |
|   | Contrastive Learning | `concept.learning.contrastive_learning` | Artificial Intelligence/Learning Paradigms |
|   | Meta-Learning | `concept.learning.meta_learning` | Artificial Intelligence/Learning Paradigms |
|   | Curriculum Learning | `concept.learning.curriculum_learning` | Artificial Intelligence/Learning Paradigms |
|   | Continual Learning | `concept.learning.continual_learning` | Artificial Intelligence/Learning Paradigms |

### Batch 15

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Federated Learning | `concept.learning.federated_learning` | Artificial Intelligence/Learning Paradigms |
|   | Linear Regression | `concept.machine_learning.linear_regression` | Artificial Intelligence/Classical Machine Learning |
|   | Logistic Regression | `concept.machine_learning.logistic_regression` | Artificial Intelligence/Classical Machine Learning |
|   | Generalized Linear Models | `concept.machine_learning.generalized_linear_models` | Artificial Intelligence/Classical Machine Learning |
|   | Generalization | `concept.machine_learning.generalization` | Artificial Intelligence/Classical Machine Learning |
|   | Bias-Variance | `concept.machine_learning.bias_variance` | Artificial Intelligence/Classical Machine Learning |
|   | VC Dimension | `concept.machine_learning.vc_dimension` | Artificial Intelligence/Classical Machine Learning |
|   | PAC Learning | `concept.machine_learning.pac_learning` | Artificial Intelligence/Classical Machine Learning |
|   | Decision Trees | `concept.machine_learning.decision_trees` | Artificial Intelligence/Classical Machine Learning |
|   | Random Forests | `concept.machine_learning.random_forests` | Artificial Intelligence/Classical Machine Learning |

### Batch 16

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Gradient Boosting | `concept.machine_learning.gradient_boosting` | Artificial Intelligence/Classical Machine Learning |
|   | k-Nearest Neighbors | `concept.machine_learning.k_nearest_neighbors` | Artificial Intelligence/Classical Machine Learning |
|   | Naive Bayes | `concept.machine_learning.naive_bayes` | Artificial Intelligence/Classical Machine Learning |
|   | Support Vector Machines | `concept.machine_learning.support_vector_machines` | Artificial Intelligence/Classical Machine Learning |
|   | Kernel Methods | `concept.machine_learning.kernel_methods` | Artificial Intelligence/Classical Machine Learning |
|   | Gaussian Processes | `concept.machine_learning.gaussian_processes` | Artificial Intelligence/Classical Machine Learning |
|   | Principal Component Analysis | `concept.machine_learning.principal_component_analysis` | Artificial Intelligence/Classical Machine Learning |
|   | Independent Component Analysis | `concept.machine_learning.independent_component_analysis` | Artificial Intelligence/Classical Machine Learning |
|   | k-Means | `concept.machine_learning.k_means` | Artificial Intelligence/Classical Machine Learning |
|   | Hierarchical Clustering | `concept.machine_learning.hierarchical_clustering` | Artificial Intelligence/Classical Machine Learning |

### Batch 17

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | DBSCAN | `concept.machine_learning.dbscan` | Artificial Intelligence/Classical Machine Learning |
|   | Spectral Clustering | `concept.machine_learning.spectral_clustering` | Artificial Intelligence/Classical Machine Learning |
|   | t-SNE | `concept.machine_learning.t_sne` | Artificial Intelligence/Classical Machine Learning |
|   | UMAP | `concept.machine_learning.umap` | Artificial Intelligence/Classical Machine Learning |
|   | Hidden Markov Models | `concept.machine_learning.hidden_markov_models` | Artificial Intelligence/Classical Machine Learning |
|   | Bayesian Networks | `concept.machine_learning.bayesian_networks` | Artificial Intelligence/Classical Machine Learning |
|   | Conditional Random Fields | `concept.machine_learning.conditional_random_fields` | Artificial Intelligence/Classical Machine Learning |
|   | Backpropagation | `concept.deep_learning.backpropagation` | Artificial Intelligence/Deep Learning — Training |
|   | Stochastic Gradient Descent | `concept.deep_learning.stochastic_gradient_descent` | Artificial Intelligence/Deep Learning — Training |
|   | Adam | `concept.deep_learning.adam` | Artificial Intelligence/Deep Learning — Training |

### Batch 18

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Learning-Rate Schedules | `concept.deep_learning.learning_rate_schedules` | Artificial Intelligence/Deep Learning — Training |
|   | Loss Functions | `concept.deep_learning.loss_functions` | Artificial Intelligence/Deep Learning — Training |
|   | Initialization | `concept.deep_learning.initialization` | Artificial Intelligence/Deep Learning — Training |
|   | Regularization | `concept.deep_learning.regularization` | Artificial Intelligence/Deep Learning — Training |
|   | Batch Normalization | `concept.deep_learning.batch_normalization` | Artificial Intelligence/Deep Learning — Training |
|   | Layer Normalization | `concept.deep_learning.layer_normalization` | Artificial Intelligence/Deep Learning — Training |
|   | Distillation | `concept.deep_learning.distillation` | Artificial Intelligence/Deep Learning — Training |
|   | Pruning | `concept.deep_learning.pruning` | Artificial Intelligence/Deep Learning — Training |
|   | Quantization | `concept.deep_learning.quantization` | Artificial Intelligence/Deep Learning — Training |
|   | Perceptron | `concept.deep_learning.perceptron` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 19

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Multilayer Perceptrons | `concept.deep_learning.multilayer_perceptrons` | Artificial Intelligence/Deep Learning — Architectures |
|   | Convolutional Networks | `concept.deep_learning.convolutional_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Recurrent Neural Networks | `concept.deep_learning.recurrent_neural_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | LSTM | `concept.deep_learning.lstm` | Artificial Intelligence/Deep Learning — Architectures |
|   | GRU | `concept.deep_learning.gru` | Artificial Intelligence/Deep Learning — Architectures |
|   | Attention | `concept.deep_learning.attention` | Artificial Intelligence/Deep Learning — Architectures |
|   | Positional Encoding | `concept.deep_learning.positional_encoding` | Artificial Intelligence/Deep Learning — Architectures |
|   | Transformers | `concept.deep_learning.transformers` | Artificial Intelligence/Deep Learning — Architectures |
|   | Vision Transformer | `concept.deep_learning.vision_transformer` | Artificial Intelligence/Deep Learning — Architectures |
|   | ConvNeXt | `concept.deep_learning.convnext` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 20

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Autoencoders | `concept.deep_learning.autoencoders` | Artificial Intelligence/Deep Learning — Architectures |
|   | Variational Autoencoders | `concept.deep_learning.variational_autoencoders` | Artificial Intelligence/Deep Learning — Architectures |
|   | Generative Adversarial Networks | `concept.deep_learning.generative_adversarial_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Normalizing Flows | `concept.deep_learning.normalizing_flows` | Artificial Intelligence/Deep Learning — Architectures |
|   | Diffusion Models | `concept.deep_learning.diffusion_models` | Artificial Intelligence/Deep Learning — Architectures |
|   | Flow Matching | `concept.deep_learning.flow_matching` | Artificial Intelligence/Deep Learning — Architectures |
|   | Energy-Based Models | `concept.deep_learning.energy_based_models` | Artificial Intelligence/Deep Learning — Architectures |
|   | Boltzmann Machines | `concept.deep_learning.boltzmann_machines` | Artificial Intelligence/Deep Learning — Architectures |
|   | Hopfield Networks | `concept.deep_learning.hopfield_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Radial Basis Function Networks | `concept.deep_learning.radial_basis_function_networks` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 21

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Self-Organizing Maps | `concept.deep_learning.self_organizing_maps` | Artificial Intelligence/Deep Learning — Architectures |
|   | Mixture of Experts | `concept.deep_learning.mixture_of_experts` | Artificial Intelligence/Deep Learning — Architectures |
|   | State Space Models | `concept.deep_learning.state_space_models` | Artificial Intelligence/Deep Learning — Architectures |
|   | S4 | `concept.deep_learning.s4` | Artificial Intelligence/Deep Learning — Architectures |
|   | Mamba | `concept.deep_learning.mamba` | Artificial Intelligence/Deep Learning — Architectures |
|   | RWKV | `concept.deep_learning.rwkv` | Artificial Intelligence/Deep Learning — Architectures |
|   | xLSTM | `concept.deep_learning.xlstm` | Artificial Intelligence/Deep Learning — Architectures |
|   | Neural ODEs | `concept.deep_learning.neural_odes` | Artificial Intelligence/Deep Learning — Architectures |
|   | Message Passing | `concept.deep_learning.message_passing` | Artificial Intelligence/Deep Learning — Architectures |
|   | Graph Neural Networks | `concept.deep_learning.graph_neural_networks` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 22

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Graph Convolutional Networks | `concept.deep_learning.graph_convolutional_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Graph Attention Networks | `concept.deep_learning.graph_attention_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Equivariance | `concept.deep_learning.equivariance` | Artificial Intelligence/Deep Learning — Architectures |
|   | Geometric Deep Learning | `concept.deep_learning.geometric_deep_learning` | Artificial Intelligence/Deep Learning — Architectures |
|   | Spherical CNNs | `concept.deep_learning.spherical_cnns` | Artificial Intelligence/Deep Learning — Architectures |
|   | Capsule Networks | `concept.deep_learning.capsule_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Kolmogorov-Arnold Networks | `concept.deep_learning.kolmogorov_arnold_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Quaternion Neural Networks | `concept.deep_learning.quaternion_neural_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Clifford Neural Networks | `concept.deep_learning.clifford_neural_networks` | Artificial Intelligence/Deep Learning — Architectures |
|   | Spiking Neural Networks | `concept.deep_learning.spiking_neural_networks` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 23

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Neuromorphic Computing | `concept.deep_learning.neuromorphic_computing` | Artificial Intelligence/Deep Learning — Architectures |
|   | Markov Decision Processes | `concept.reinforcement_learning.markov_decision_processes` | Artificial Intelligence/Reinforcement Learning |
|   | Dynamic Programming | `concept.reinforcement_learning.dynamic_programming` | Artificial Intelligence/Reinforcement Learning |
|   | Monte Carlo Methods | `concept.reinforcement_learning.monte_carlo_methods` | Artificial Intelligence/Reinforcement Learning |
|   | Temporal-Difference Learning | `concept.reinforcement_learning.temporal_difference_learning` | Artificial Intelligence/Reinforcement Learning |
|   | Q-Learning | `concept.reinforcement_learning.q_learning` | Artificial Intelligence/Reinforcement Learning |
|   | DQN | `concept.reinforcement_learning.dqn` | Artificial Intelligence/Reinforcement Learning |
|   | Policy Gradients | `concept.reinforcement_learning.policy_gradients` | Artificial Intelligence/Reinforcement Learning |
|   | REINFORCE | `concept.reinforcement_learning.reinforce` | Artificial Intelligence/Reinforcement Learning |
|   | Actor-Critic | `concept.reinforcement_learning.actor_critic` | Artificial Intelligence/Reinforcement Learning |

### Batch 24

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | PPO | `concept.reinforcement_learning.ppo` | Artificial Intelligence/Reinforcement Learning |
|   | SAC | `concept.reinforcement_learning.sac` | Artificial Intelligence/Reinforcement Learning |
|   | Model-Based Reinforcement Learning | `concept.reinforcement_learning.model_based_reinforcement_learning` | Artificial Intelligence/Reinforcement Learning |
|   | Multi-Armed Bandits | `concept.reinforcement_learning.multi_armed_bandits` | Artificial Intelligence/Reinforcement Learning |
|   | Imitation Learning | `concept.reinforcement_learning.imitation_learning` | Artificial Intelligence/Reinforcement Learning |
|   | Inverse Reinforcement Learning | `concept.reinforcement_learning.inverse_reinforcement_learning` | Artificial Intelligence/Reinforcement Learning |
|   | Offline Reinforcement Learning | `concept.reinforcement_learning.offline_reinforcement_learning` | Artificial Intelligence/Reinforcement Learning |
|   | Multi-Agent Reinforcement Learning | `concept.reinforcement_learning.multi_agent_reinforcement_learning` | Artificial Intelligence/Reinforcement Learning |
|   | RLHF | `concept.reinforcement_learning.rlhf` | Artificial Intelligence/Reinforcement Learning |
|   | RLAIF | `concept.reinforcement_learning.rlaif` | Artificial Intelligence/Reinforcement Learning |

### Batch 25

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Uninformed Search | `concept.search.uninformed_search` | Artificial Intelligence/Symbolic AI/Search |
|   | A* | `concept.search.a_star` | Artificial Intelligence/Symbolic AI/Search |
|   | Adversarial Search | `concept.search.adversarial_search` | Artificial Intelligence/Symbolic AI/Search |
|   | Minimax | `concept.search.minimax` | Artificial Intelligence/Symbolic AI/Search |
|   | Monte Carlo Tree Search | `concept.search.monte_carlo_tree_search` | Artificial Intelligence/Symbolic AI/Search |
|   | STRIPS | `concept.planning.strips` | Artificial Intelligence/Symbolic AI/Planning |
|   | PDDL | `concept.planning.pddl` | Artificial Intelligence/Symbolic AI/Planning |
|   | Hierarchical Planning | `concept.planning.hierarchical_planning` | Artificial Intelligence/Symbolic AI/Planning |
|   | Knowledge Representation | `concept.symbolic_ai.knowledge_representation` | Artificial Intelligence/Symbolic AI |
|   | Ontologies | `concept.symbolic_ai.ontologies` | Artificial Intelligence/Symbolic AI |

### Batch 26

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Logic Programming | `concept.symbolic_ai.logic_programming` | Artificial Intelligence/Symbolic AI |
|   | Constraint Satisfaction | `concept.symbolic_ai.constraint_satisfaction` | Artificial Intelligence/Symbolic AI |
|   | Expert Systems | `concept.symbolic_ai.expert_systems` | Artificial Intelligence/Symbolic AI |
|   | Classification | `concept.vision.classification` | Artificial Intelligence/Domains/Computer Vision |
|   | Detection | `concept.vision.detection` | Artificial Intelligence/Domains/Computer Vision |
|   | Segmentation | `concept.vision.segmentation` | Artificial Intelligence/Domains/Computer Vision |
|   | Visual Place Recognition | `concept.vision.visual_place_recognition` | Artificial Intelligence/Domains/Computer Vision |
|   | Tokenization | `concept.nlp.tokenization` | Artificial Intelligence/Domains/Natural Language Processing |
|   | Embeddings | `concept.nlp.embeddings` | Artificial Intelligence/Domains/Natural Language Processing |
|   | BERT | `concept.nlp.bert` | Artificial Intelligence/Domains/Natural Language Processing |

### Batch 27

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | GPT | `concept.nlp.gpt` | Artificial Intelligence/Domains/Natural Language Processing |
|   | Agents | `concept.nlp.agents` | Artificial Intelligence/Domains/Natural Language Processing |
|   | Time Series | `concept.applications.time_series` | Artificial Intelligence/Domains |
|   | Forecasting | `concept.applications.forecasting` | Artificial Intelligence/Domains |
|   | Speech | `concept.applications.speech` | Artificial Intelligence/Domains |
|   | Audio | `concept.applications.audio` | Artificial Intelligence/Domains |
|   | Control | `concept.applications.control` | Artificial Intelligence/Domains |
|   | Robotics | `concept.applications.robotics` | Artificial Intelligence/Domains |
|   | Recommender Systems | `concept.applications.recommender_systems` | Artificial Intelligence/Domains |
|   | Evolutionary Computation | `concept.ai_frontiers.evolutionary_computation` | Artificial Intelligence/Other Traditions & Frontiers |

### Batch 28

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
|   | Genetic Algorithms | `concept.ai_frontiers.genetic_algorithms` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Neuroevolution | `concept.ai_frontiers.neuroevolution` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Swarm Intelligence | `concept.ai_frontiers.swarm_intelligence` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Fuzzy Logic | `concept.ai_frontiers.fuzzy_logic` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Causal Inference | `concept.ai_frontiers.causal_inference` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Neuro-Symbolic AI | `concept.ai_frontiers.neuro_symbolic_ai` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Interpretability | `concept.ai_frontiers.interpretability` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Mechanistic Interpretability | `concept.ai_frontiers.mechanistic_interpretability` | Artificial Intelligence/Other Traditions & Frontiers |
|   | AI Safety | `concept.ai_frontiers.ai_safety` | Artificial Intelligence/Other Traditions & Frontiers |
|   | Alignment | `concept.ai_frontiers.alignment` | Artificial Intelligence/Other Traditions & Frontiers |

<!-- hand-written below this line -->

## Failed checks

Every check that fails during a batch is recorded here with what it was, what
caused it, and what fixed it.

### Batch 1 — the learning path put a concept before its own prerequisite

`apps/api/tests/evaluation.test.ts` asserted that the route to ResNet was ten
steps long. Batch 1 made it sixteen, which is expected; replacing the constant
with the invariant it stood for — no step appears before something it requires —
exposed a real bug rather than a stale number. The emitted route read
`… real_analysis, convolution, multivariable_calculus, single_variable_calculus …`,
placing three concepts ahead of a prerequisite they declare.

`buildLearningPath` sorted its steps by `depth`, which breadth-first discovery
assigns as the *shortest* chain from the target. Sorting by that descending is
not a topological order: a concept reached both near the target and deep below it
keeps the shallow number and is scheduled too late. The eleven seed pages
contained no such diamond, so the ordering looked correct until real analysis and
single-variable calculus grew one. Fixed in `packages/core/src/learning-paths.ts`
with Kahn's algorithm over the edges the search already collects, `depth` kept as
the tie-break so the order stays deterministic and foundational concepts still
come first among equals. Cycles, already reported as missing information, are
appended rather than dropped.

### Batch 3 — the corpus grew a prerequisite cycle

Spectral theory declared that operators come first; operators, that matrix
decompositions come first; matrix decompositions, that spectral theory comes
first. Every edge was defensible on its own page, and each page was individually
valid, so only a whole-corpus check could see it. The learning path survived —
it reports a cycle as missing information — but the order it then emitted put a
concept before something it requires, which is the one promise that page makes.

Broken in the content, not the tooling: matrix decompositions claimed to be a
prerequisite of operators on the strength of the finite-dimensional SVD being
the visible case of the compact-operator SVD. That is an illuminating parallel,
not something an operator theorist must read first, so the edge is now
`contributes_to`, which orders nothing.

`validateCorpus` now rejects prerequisite cycles outright, with
`packages/core/tests/prerequisite-cycles.test.ts` covering chains, diamonds,
both spellings of the edge, several disjoint cycles, and the fact that a
non-ordering relationship may loop freely. One existing test deliberately
compiled a cyclic corpus to exercise the path builder's defensive branch; it now
asserts both halves — that compiling such a corpus is refused, and that the path
builder still survives a cycle reaching it through an index compiled earlier.

### Batch 1 — twelve test files pinned the corpus at eleven concepts

Expected, and not a bug: assertions such as `expect(counts.concepts).toBe(11)`,
a path of exactly ten steps, and "convolution has no prerequisites" recorded the
seed moment rather than a property worth defending. Each was replaced with the
invariant behind it — a count checked against the corpus on disk or against a
second code path, a route checked for well-formedness and for equalling the set
the corpus declares, and "records no route" moved onto a fixture corpus where it
holds by construction instead of by accident. None was deleted, skipped or
loosened; several are now strictly stronger than the constant they replaced,
because a count derived from the corpus catches a miscount at any size.

## Decisions

- **The tier the task asks for.** Every new page is written to the same bar: a
  definition, why it matters, intuition, a concrete example, a technical
  treatment, uses, limitations, sources and connections. That is Tier 2 in this
  corpus — and `scripts/check-page.mjs` enforces it on every page, including a
  450-word floor for Tier 2 and 800 for Tier 1. The Tier 1 floor is set just
  under the shortest of the eleven pages version 1 wrote, so the bar is the
  corpus's own rather than one invented here.

  **Pages are written at Tier 1, not Tier 2.** Tier 1 is this same template plus
  assumptions, variants and history, in the order the validator already enforces,
  and the drafts were arriving long enough to carry them. Writing the full
  template once is better than writing 280 short pages and promoting them later,
  and it means the task's goal — Tier 1 in dependency order — is met as the
  corpus is built rather than after it. Batch 1 was written at Tier 2 and
  promoted; every batch after it is written at Tier 1 directly. `claims` stay
  empty, as the contract allows for a `generated-draft`.

- **Sources may be cited only from `docs/source-registry.json`.** The contract
  forbids inventing a citation or a URL, and the most likely way to break it
  across hundreds of pages is a plausible-looking arXiv id that belongs to a
  different paper. The registry holds 166 sources — textbooks with stable
  author-hosted pages, landmark papers, official documentation — and a page that
  needs something else says so rather than guessing. It also keeps one
  `source_id` describing one source, which the corpus validator enforces
  globally.

  The rule is now mechanical: `scripts/check-page.mjs` rejects a `source_id`
  absent from the registry, and a page whose title, URL or kind has drifted from
  the registry entry. The thirteen sources the eleven reviewed pages cited were
  added to the registry so the rule could apply to the whole corpus rather than
  only to new pages.

- **Concept ids follow the eleven pages version 1 wrote**, not the atlas
  category ids: `concept.deep_learning.resnet`, not
  `concept.deep_learning_architectures.resnet`. The map from category to id
  prefix is frozen in `scripts/content-order.mjs`. An id is an address, and
  inconsistent addresses are the thing ids exist to prevent.

- **Batch numbers never move.** `plan()` originally skipped candidates the atlas
  already recorded as covered, which re-derived the whole plan every time a batch
  landed: batch 3 became batch 2, and the state file reported nothing as done.
  The plan now enumerates all 280 candidates that had no page when this build
  began, so a batch keeps its number for the life of the build and the state file
  can say what was written.

- **The build order is a dependency order**, frozen in the same file: the
  mathematics a concept rests on is written before the concept, the programming
  foundations before the engineering, the machine learning before the
  architectures that assume it. A page may only declare a relationship to a
  concept that already exists or is in its own batch, so every batch lands with
  every target resolvable.

- **An atlas category holding a page is no longer counted empty.** Coverage
  asked only whether a category held a candidate label or a child category,
  which was indistinguishable from the right question while every concept was
  behind a covered candidate. Fixed in both places the number is produced, with
  `packages/core/tests/empty-categories.test.ts` holding them to each other.
  Two assertions in the atlas seed test were snapshots of the moment before any
  content existed — that exactly eleven candidates were covered, and that
  nothing in Programming was — and now assert what they were protecting.

- **Appendix A stays frozen.** No candidate is added, renamed or removed. The
  eight categories Appendix A names but files no candidate under are filled by
  giving genuinely related pages a second category, never by inventing a
  candidate to sit in them.
