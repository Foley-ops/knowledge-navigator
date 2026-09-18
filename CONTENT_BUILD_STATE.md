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

**Batch 22 of 28.** 10 of 10 pages in it are still to write.

Write these files next:

- `content/concepts/graph-convolutional-networks.md` — Graph Convolutional Networks (concept.deep_learning.graph_convolutional_networks)
- `content/concepts/graph-attention-networks.md` — Graph Attention Networks (concept.deep_learning.graph_attention_networks)
- `content/concepts/equivariance.md` — Equivariance (concept.deep_learning.equivariance)
- `content/concepts/geometric-deep-learning.md` — Geometric Deep Learning (concept.deep_learning.geometric_deep_learning)
- `content/concepts/spherical-cnns.md` — Spherical CNNs (concept.deep_learning.spherical_cnns)
- `content/concepts/capsule-networks.md` — Capsule Networks (concept.deep_learning.capsule_networks)
- `content/concepts/kolmogorov-arnold-networks.md` — Kolmogorov-Arnold Networks (concept.deep_learning.kolmogorov_arnold_networks)
- `content/concepts/quaternion-neural-networks.md` — Quaternion Neural Networks (concept.deep_learning.quaternion_neural_networks)
- `content/concepts/clifford-neural-networks.md` — Clifford Neural Networks (concept.deep_learning.clifford_neural_networks)
- `content/concepts/spiking-neural-networks.md` — Spiking Neural Networks (concept.deep_learning.spiking_neural_networks)

Then: `node scripts/check-page.mjs <files>`, `npm run validate`, `npm run compile`,
`npx vitest run`, and commit the batch.

## Running totals

| Total | Count |
| --- | --- |
| Candidates in the atlas | 291 |
| Candidates covered by a page | 221 |
| Markdown pages in the corpus | 221 |
| Tier 1 pages | 221 |
| Tier 2 pages | 0 |
| Tier 3 identities | 0 |
| Planned pages written | 210 of 280 |

### By area

| Area | Written | Planned | Done |
| --- | --- | --- | --- |
| Artificial Intelligence | 78 | 148 | 53% |
| Mathematics | 85 | 85 | 100% |
| Programming | 47 | 47 | 100% |

### By category

| Category | Written | Planned | State |
| --- | --- | --- | --- |
| Artificial Intelligence/Classical Machine Learning | 26 | 26 | complete |
| Artificial Intelligence/Deep Learning — Architectures | 31 | 42 |  |
| Artificial Intelligence/Deep Learning — Training | 12 | 12 | complete |
| Artificial Intelligence/Domains | 0 | 7 |  |
| Artificial Intelligence/Domains/Computer Vision | 0 | 4 |  |
| Artificial Intelligence/Domains/Natural Language Processing | 0 | 5 |  |
| Artificial Intelligence/Learning Paradigms | 9 | 9 | complete |
| Artificial Intelligence/Other Traditions & Frontiers | 0 | 11 |  |
| Artificial Intelligence/Reinforcement Learning | 0 | 19 |  |
| Artificial Intelligence/Symbolic AI | 0 | 5 |  |
| Artificial Intelligence/Symbolic AI/Planning | 0 | 3 |  |
| Artificial Intelligence/Symbolic AI/Search | 0 | 5 |  |
| Mathematics/Algebra | 14 | 14 | complete |
| Mathematics/Analysis | 18 | 18 | complete |
| Mathematics/Foundations | 4 | 4 | complete |
| Mathematics/Foundations/Formal Verification | 2 | 2 | complete |
| Mathematics/Foundations/Logic & Proof | 3 | 3 | complete |
| Mathematics/Geometry & Topology | 15 | 15 | complete |
| Mathematics/Linear & Multilinear Algebra | 6 | 6 | complete |
| Mathematics/Mathematical Physics | 2 | 2 | complete |
| Mathematics/Number Theory | 3 | 3 | complete |
| Mathematics/Optimization | 7 | 7 | complete |
| Mathematics/Probability & Statistics | 9 | 9 | complete |
| Mathematics/Theory of Computation | 2 | 2 | complete |
| Programming/Data Structures & Algorithms | 5 | 5 | complete |
| Programming/Languages | 15 | 15 | complete |
| Programming/Languages/Paradigms | 4 | 4 | complete |
| Programming/ML Engineering | 7 | 7 | complete |
| Programming/Software Practice | 9 | 9 | complete |
| Programming/Systems | 7 | 7 | complete |

## Completed pages

210 of the planned 280, in the order they were written.

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
| Tensor Decomposition | `concept.linear_algebra.tensor_decomposition` | tier 1 | covered |
| Probability Theory | `concept.probability.probability_theory` | tier 1 | covered |
| Stochastic Processes | `concept.probability.stochastic_processes` | tier 1 | covered |
| Martingales | `concept.probability.martingales` | tier 1 | covered |
| Concentration Inequalities | `concept.probability.concentration_inequalities` | tier 1 | covered |
| Frequentist Inference | `concept.probability.frequentist_inference` | tier 1 | covered |
| Bayesian Inference | `concept.probability.bayesian_inference` | tier 1 | covered |
| High-Dimensional Statistics | `concept.probability.high_dimensional_statistics` | tier 1 | covered |
| Random Matrix Theory | `concept.probability.random_matrix_theory` | tier 1 | covered |
| Probability and Computing | `concept.probability.probability_and_computing` | tier 1 | covered |
| Group Theory | `concept.algebra.group_theory` | tier 1 | covered |
| Ring Theory | `concept.algebra.ring_theory` | tier 1 | covered |
| Field Theory | `concept.algebra.field_theory` | tier 1 | covered |
| Order Theory | `concept.algebra.order_theory` | tier 1 | covered |
| Lattice Theory | `concept.algebra.lattice_theory` | tier 1 | covered |
| Galois Theory | `concept.algebra.galois_theory` | tier 1 | covered |
| Representation Theory | `concept.algebra.representation_theory` | tier 1 | covered |
| Lie Algebras | `concept.algebra.lie_algebras` | tier 1 | covered |
| Homological Algebra | `concept.algebra.homological_algebra` | tier 1 | covered |
| Complex Numbers | `concept.algebra.complex_numbers` | tier 1 | covered |
| Quaternions | `concept.algebra.quaternions` | tier 1 | covered |
| Octonions | `concept.algebra.octonions` | tier 1 | covered |
| Clifford Algebra | `concept.algebra.clifford_algebra` | tier 1 | covered |
| Geometric Algebra | `concept.algebra.geometric_algebra` | tier 1 | covered |
| Euclidean Geometry | `concept.geometry.euclidean_geometry` | tier 1 | covered |
| Non-Euclidean Geometry | `concept.geometry.non_euclidean_geometry` | tier 1 | covered |
| Spherical Geometry | `concept.geometry.spherical_geometry` | tier 1 | covered |
| Hyperbolic Geometry | `concept.geometry.hyperbolic_geometry` | tier 1 | covered |
| Convex Geometry | `concept.geometry.convex_geometry` | tier 1 | covered |
| Point-Set Topology | `concept.geometry.point_set_topology` | tier 1 | covered |
| Algebraic Topology | `concept.geometry.algebraic_topology` | tier 1 | covered |
| Manifolds | `concept.geometry.manifolds` | tier 1 | covered |
| Differential Geometry | `concept.geometry.differential_geometry` | tier 1 | covered |
| Differential Topology | `concept.geometry.differential_topology` | tier 1 | covered |
| Curvature | `concept.geometry.curvature` | tier 1 | covered |
| Lie Groups | `concept.geometry.lie_groups` | tier 1 | covered |
| Algebraic Geometry | `concept.geometry.algebraic_geometry` | tier 1 | covered |
| Fractal Geometry | `concept.geometry.fractal_geometry` | tier 1 | covered |
| Renormalization | `concept.geometry.renormalization` | tier 1 | covered |
| Elementary Number Theory | `concept.number_theory.elementary_number_theory` | tier 1 | covered |
| Analytic Number Theory | `concept.number_theory.analytic_number_theory` | tier 1 | covered |
| Algebraic Number Theory | `concept.number_theory.algebraic_number_theory` | tier 1 | covered |
| Automata | `concept.computation.automata` | tier 1 | covered |
| Computational Complexity | `concept.computation.computational_complexity` | tier 1 | covered |
| Convex Optimization | `concept.optimization.convex_optimization` | tier 1 | covered |
| Nonconvex Optimization | `concept.optimization.nonconvex_optimization` | tier 1 | covered |
| Stochastic Optimization | `concept.optimization.stochastic_optimization` | tier 1 | covered |
| Combinatorial Optimization | `concept.optimization.combinatorial_optimization` | tier 1 | covered |
| Integer Programming | `concept.optimization.integer_programming` | tier 1 | covered |
| Variational Methods | `concept.optimization.variational_methods` | tier 1 | covered |
| Optimal Transport | `concept.optimization.optimal_transport` | tier 1 | covered |
| Hamiltonian Mechanics | `concept.physics.hamiltonian_mechanics` | tier 1 | covered |
| Statistical Mechanics | `concept.physics.statistical_mechanics` | tier 1 | covered |
| Lean | `concept.formal_verification.lean` | tier 1 | covered |
| Coq | `concept.formal_verification.coq` | tier 1 | covered |
| Complexity Analysis | `concept.algorithms.complexity_analysis` | tier 1 | covered |
| Core Data Structures | `concept.algorithms.core_data_structures` | tier 1 | covered |
| Sorting | `concept.algorithms.sorting` | tier 1 | covered |
| Searching | `concept.algorithms.searching` | tier 1 | covered |
| Graph Algorithms | `concept.algorithms.graph_algorithms` | tier 1 | covered |
| Imperative Programming | `concept.paradigms.imperative_programming` | tier 1 | covered |
| Object-Oriented Programming | `concept.paradigms.object_oriented_programming` | tier 1 | covered |
| Functional Programming | `concept.paradigms.functional_programming` | tier 1 | covered |
| Array Programming | `concept.paradigms.array_programming` | tier 1 | covered |
| Python | `concept.languages.python` | tier 1 | covered |
| C | `concept.languages.c_language` | tier 1 | covered |
| C++ | `concept.languages.cpp` | tier 1 | covered |
| Rust | `concept.languages.rust` | tier 1 | covered |
| Go | `concept.languages.go` | tier 1 | covered |
| JavaScript | `concept.languages.javascript` | tier 1 | covered |
| TypeScript | `concept.languages.typescript` | tier 1 | covered |
| Haskell | `concept.languages.haskell` | tier 1 | covered |
| Lisp | `concept.languages.lisp` | tier 1 | covered |
| Julia | `concept.languages.julia` | tier 1 | covered |
| R | `concept.languages.r_language` | tier 1 | covered |
| MATLAB | `concept.languages.matlab` | tier 1 | covered |
| Assembly | `concept.languages.assembly` | tier 1 | covered |
| CUDA | `concept.languages.cuda` | tier 1 | covered |
| GPU Kernels | `concept.languages.gpu_kernels` | tier 1 | covered |
| Operating Systems | `concept.systems.operating_systems` | tier 1 | covered |
| Networking | `concept.systems.networking` | tier 1 | covered |
| Parallel Computing | `concept.systems.parallel_computing` | tier 1 | covered |
| Distributed Systems | `concept.systems.distributed_systems` | tier 1 | covered |
| High-Performance Computing | `concept.systems.high_performance_computing` | tier 1 | covered |
| Relational Databases | `concept.systems.relational_databases` | tier 1 | covered |
| Graph Databases | `concept.systems.graph_databases` | tier 1 | covered |
| Version Control | `concept.software.version_control` | tier 1 | covered |
| Testing | `concept.software.testing` | tier 1 | covered |
| Design Patterns | `concept.software.design_patterns` | tier 1 | covered |
| APIs | `concept.software.apis` | tier 1 | covered |
| Protocols | `concept.software.protocols` | tier 1 | covered |
| Continuous Integration | `concept.software.continuous_integration` | tier 1 | covered |
| Continuous Delivery | `concept.software.continuous_delivery` | tier 1 | covered |
| Containers | `concept.software.containers` | tier 1 | covered |
| Model Context Protocol | `concept.software.model_context_protocol` | tier 1 | covered |
| PyTorch | `concept.ml_engineering.pytorch` | tier 1 | covered |
| JAX | `concept.ml_engineering.jax` | tier 1 | covered |
| Training Infrastructure | `concept.ml_engineering.training_infrastructure` | tier 1 | covered |
| Experiment Tracking | `concept.ml_engineering.experiment_tracking` | tier 1 | covered |
| Deployment | `concept.ml_engineering.deployment` | tier 1 | covered |
| Edge Inference | `concept.ml_engineering.edge_inference` | tier 1 | covered |
| Ollama | `concept.ml_engineering.ollama` | tier 1 | covered |
| Supervised Learning | `concept.learning.supervised_learning` | tier 1 | covered |
| Unsupervised Learning | `concept.learning.unsupervised_learning` | tier 1 | covered |
| Self-Supervised Learning | `concept.learning.self_supervised_learning` | tier 1 | covered |
| Transfer Learning | `concept.learning.transfer_learning` | tier 1 | covered |
| Contrastive Learning | `concept.learning.contrastive_learning` | tier 1 | covered |
| Meta-Learning | `concept.learning.meta_learning` | tier 1 | covered |
| Curriculum Learning | `concept.learning.curriculum_learning` | tier 1 | covered |
| Continual Learning | `concept.learning.continual_learning` | tier 1 | covered |
| Federated Learning | `concept.learning.federated_learning` | tier 1 | covered |
| Linear Regression | `concept.machine_learning.linear_regression` | tier 1 | covered |
| Logistic Regression | `concept.machine_learning.logistic_regression` | tier 1 | covered |
| Generalized Linear Models | `concept.machine_learning.generalized_linear_models` | tier 1 | covered |
| Generalization | `concept.machine_learning.generalization` | tier 1 | covered |
| Bias-Variance | `concept.machine_learning.bias_variance` | tier 1 | covered |
| VC Dimension | `concept.machine_learning.vc_dimension` | tier 1 | covered |
| PAC Learning | `concept.machine_learning.pac_learning` | tier 1 | covered |
| Decision Trees | `concept.machine_learning.decision_trees` | tier 1 | covered |
| Random Forests | `concept.machine_learning.random_forests` | tier 1 | covered |
| Gradient Boosting | `concept.machine_learning.gradient_boosting` | tier 1 | covered |
| k-Nearest Neighbors | `concept.machine_learning.k_nearest_neighbors` | tier 1 | covered |
| Naive Bayes | `concept.machine_learning.naive_bayes` | tier 1 | covered |
| Support Vector Machines | `concept.machine_learning.support_vector_machines` | tier 1 | covered |
| Kernel Methods | `concept.machine_learning.kernel_methods` | tier 1 | covered |
| Gaussian Processes | `concept.machine_learning.gaussian_processes` | tier 1 | covered |
| Principal Component Analysis | `concept.machine_learning.principal_component_analysis` | tier 1 | covered |
| Independent Component Analysis | `concept.machine_learning.independent_component_analysis` | tier 1 | covered |
| k-Means | `concept.machine_learning.k_means` | tier 1 | covered |
| Hierarchical Clustering | `concept.machine_learning.hierarchical_clustering` | tier 1 | covered |
| DBSCAN | `concept.machine_learning.dbscan` | tier 1 | covered |
| Spectral Clustering | `concept.machine_learning.spectral_clustering` | tier 1 | covered |
| t-SNE | `concept.machine_learning.t_sne` | tier 1 | covered |
| UMAP | `concept.machine_learning.umap` | tier 1 | covered |
| Hidden Markov Models | `concept.machine_learning.hidden_markov_models` | tier 1 | covered |
| Bayesian Networks | `concept.machine_learning.bayesian_networks` | tier 1 | covered |
| Conditional Random Fields | `concept.machine_learning.conditional_random_fields` | tier 1 | covered |
| Backpropagation | `concept.deep_learning.backpropagation` | tier 1 | covered |
| Stochastic Gradient Descent | `concept.deep_learning.stochastic_gradient_descent` | tier 1 | covered |
| Adam | `concept.deep_learning.adam` | tier 1 | covered |
| Learning-Rate Schedules | `concept.deep_learning.learning_rate_schedules` | tier 1 | covered |
| Loss Functions | `concept.deep_learning.loss_functions` | tier 1 | covered |
| Initialization | `concept.deep_learning.initialization` | tier 1 | covered |
| Regularization | `concept.deep_learning.regularization` | tier 1 | covered |
| Batch Normalization | `concept.deep_learning.batch_normalization` | tier 1 | covered |
| Layer Normalization | `concept.deep_learning.layer_normalization` | tier 1 | covered |
| Distillation | `concept.deep_learning.distillation` | tier 1 | covered |
| Pruning | `concept.deep_learning.pruning` | tier 1 | covered |
| Quantization | `concept.deep_learning.quantization` | tier 1 | covered |
| Perceptron | `concept.deep_learning.perceptron` | tier 1 | covered |
| Multilayer Perceptrons | `concept.deep_learning.multilayer_perceptrons` | tier 1 | covered |
| Convolutional Networks | `concept.deep_learning.convolutional_networks` | tier 1 | covered |
| Recurrent Neural Networks | `concept.deep_learning.recurrent_neural_networks` | tier 1 | covered |
| LSTM | `concept.deep_learning.lstm` | tier 1 | covered |
| GRU | `concept.deep_learning.gru` | tier 1 | covered |
| Attention | `concept.deep_learning.attention` | tier 1 | covered |
| Positional Encoding | `concept.deep_learning.positional_encoding` | tier 1 | covered |
| Transformers | `concept.deep_learning.transformers` | tier 1 | covered |
| Vision Transformer | `concept.deep_learning.vision_transformer` | tier 1 | covered |
| ConvNeXt | `concept.deep_learning.convnext` | tier 1 | covered |
| Autoencoders | `concept.deep_learning.autoencoders` | tier 1 | covered |
| Variational Autoencoders | `concept.deep_learning.variational_autoencoders` | tier 1 | covered |
| Generative Adversarial Networks | `concept.deep_learning.generative_adversarial_networks` | tier 1 | covered |
| Normalizing Flows | `concept.deep_learning.normalizing_flows` | tier 1 | covered |
| Diffusion Models | `concept.deep_learning.diffusion_models` | tier 1 | covered |
| Flow Matching | `concept.deep_learning.flow_matching` | tier 1 | covered |
| Energy-Based Models | `concept.deep_learning.energy_based_models` | tier 1 | covered |
| Boltzmann Machines | `concept.deep_learning.boltzmann_machines` | tier 1 | covered |
| Hopfield Networks | `concept.deep_learning.hopfield_networks` | tier 1 | covered |
| Radial Basis Function Networks | `concept.deep_learning.radial_basis_function_networks` | tier 1 | covered |
| Self-Organizing Maps | `concept.deep_learning.self_organizing_maps` | tier 1 | covered |
| Mixture of Experts | `concept.deep_learning.mixture_of_experts` | tier 1 | covered |
| State Space Models | `concept.deep_learning.state_space_models` | tier 1 | covered |
| S4 | `concept.deep_learning.s4` | tier 1 | covered |
| Mamba | `concept.deep_learning.mamba` | tier 1 | covered |
| RWKV | `concept.deep_learning.rwkv` | tier 1 | covered |
| xLSTM | `concept.deep_learning.xlstm` | tier 1 | covered |
| Neural ODEs | `concept.deep_learning.neural_odes` | tier 1 | covered |
| Message Passing | `concept.deep_learning.message_passing` | tier 1 | covered |
| Graph Neural Networks | `concept.deep_learning.graph_neural_networks` | tier 1 | covered |

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

### Batch 4 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Tensor Decomposition | `concept.linear_algebra.tensor_decomposition` | Mathematics/Linear & Multilinear Algebra |
| x | Probability Theory | `concept.probability.probability_theory` | Mathematics/Probability & Statistics |
| x | Stochastic Processes | `concept.probability.stochastic_processes` | Mathematics/Probability & Statistics |
| x | Martingales | `concept.probability.martingales` | Mathematics/Probability & Statistics |
| x | Concentration Inequalities | `concept.probability.concentration_inequalities` | Mathematics/Probability & Statistics |
| x | Frequentist Inference | `concept.probability.frequentist_inference` | Mathematics/Probability & Statistics |
| x | Bayesian Inference | `concept.probability.bayesian_inference` | Mathematics/Probability & Statistics |
| x | High-Dimensional Statistics | `concept.probability.high_dimensional_statistics` | Mathematics/Probability & Statistics |
| x | Random Matrix Theory | `concept.probability.random_matrix_theory` | Mathematics/Probability & Statistics |
| x | Probability and Computing | `concept.probability.probability_and_computing` | Mathematics/Probability & Statistics |

### Batch 5 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Group Theory | `concept.algebra.group_theory` | Mathematics/Algebra |
| x | Ring Theory | `concept.algebra.ring_theory` | Mathematics/Algebra |
| x | Field Theory | `concept.algebra.field_theory` | Mathematics/Algebra |
| x | Order Theory | `concept.algebra.order_theory` | Mathematics/Algebra |
| x | Lattice Theory | `concept.algebra.lattice_theory` | Mathematics/Algebra |
| x | Galois Theory | `concept.algebra.galois_theory` | Mathematics/Algebra |
| x | Representation Theory | `concept.algebra.representation_theory` | Mathematics/Algebra |
| x | Lie Algebras | `concept.algebra.lie_algebras` | Mathematics/Algebra |
| x | Homological Algebra | `concept.algebra.homological_algebra` | Mathematics/Algebra |
| x | Complex Numbers | `concept.algebra.complex_numbers` | Mathematics/Algebra |

### Batch 6 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Quaternions | `concept.algebra.quaternions` | Mathematics/Algebra |
| x | Octonions | `concept.algebra.octonions` | Mathematics/Algebra |
| x | Clifford Algebra | `concept.algebra.clifford_algebra` | Mathematics/Algebra |
| x | Geometric Algebra | `concept.algebra.geometric_algebra` | Mathematics/Algebra |
| x | Euclidean Geometry | `concept.geometry.euclidean_geometry` | Mathematics/Geometry & Topology |
| x | Non-Euclidean Geometry | `concept.geometry.non_euclidean_geometry` | Mathematics/Geometry & Topology |
| x | Spherical Geometry | `concept.geometry.spherical_geometry` | Mathematics/Geometry & Topology |
| x | Hyperbolic Geometry | `concept.geometry.hyperbolic_geometry` | Mathematics/Geometry & Topology |
| x | Convex Geometry | `concept.geometry.convex_geometry` | Mathematics/Geometry & Topology |
| x | Point-Set Topology | `concept.geometry.point_set_topology` | Mathematics/Geometry & Topology |

### Batch 7 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Algebraic Topology | `concept.geometry.algebraic_topology` | Mathematics/Geometry & Topology |
| x | Manifolds | `concept.geometry.manifolds` | Mathematics/Geometry & Topology |
| x | Differential Geometry | `concept.geometry.differential_geometry` | Mathematics/Geometry & Topology |
| x | Differential Topology | `concept.geometry.differential_topology` | Mathematics/Geometry & Topology |
| x | Curvature | `concept.geometry.curvature` | Mathematics/Geometry & Topology |
| x | Lie Groups | `concept.geometry.lie_groups` | Mathematics/Geometry & Topology |
| x | Algebraic Geometry | `concept.geometry.algebraic_geometry` | Mathematics/Geometry & Topology |
| x | Fractal Geometry | `concept.geometry.fractal_geometry` | Mathematics/Geometry & Topology |
| x | Renormalization | `concept.geometry.renormalization` | Mathematics/Geometry & Topology |
| x | Elementary Number Theory | `concept.number_theory.elementary_number_theory` | Mathematics/Number Theory |

### Batch 8 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Analytic Number Theory | `concept.number_theory.analytic_number_theory` | Mathematics/Number Theory |
| x | Algebraic Number Theory | `concept.number_theory.algebraic_number_theory` | Mathematics/Number Theory |
| x | Automata | `concept.computation.automata` | Mathematics/Theory of Computation |
| x | Computational Complexity | `concept.computation.computational_complexity` | Mathematics/Theory of Computation |
| x | Convex Optimization | `concept.optimization.convex_optimization` | Mathematics/Optimization |
| x | Nonconvex Optimization | `concept.optimization.nonconvex_optimization` | Mathematics/Optimization |
| x | Stochastic Optimization | `concept.optimization.stochastic_optimization` | Mathematics/Optimization |
| x | Combinatorial Optimization | `concept.optimization.combinatorial_optimization` | Mathematics/Optimization |
| x | Integer Programming | `concept.optimization.integer_programming` | Mathematics/Optimization |
| x | Variational Methods | `concept.optimization.variational_methods` | Mathematics/Optimization |

### Batch 9 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Optimal Transport | `concept.optimization.optimal_transport` | Mathematics/Optimization |
| x | Hamiltonian Mechanics | `concept.physics.hamiltonian_mechanics` | Mathematics/Mathematical Physics |
| x | Statistical Mechanics | `concept.physics.statistical_mechanics` | Mathematics/Mathematical Physics |
| x | Lean | `concept.formal_verification.lean` | Mathematics/Foundations/Formal Verification |
| x | Coq | `concept.formal_verification.coq` | Mathematics/Foundations/Formal Verification |
| x | Complexity Analysis | `concept.algorithms.complexity_analysis` | Programming/Data Structures & Algorithms |
| x | Core Data Structures | `concept.algorithms.core_data_structures` | Programming/Data Structures & Algorithms |
| x | Sorting | `concept.algorithms.sorting` | Programming/Data Structures & Algorithms |
| x | Searching | `concept.algorithms.searching` | Programming/Data Structures & Algorithms |
| x | Graph Algorithms | `concept.algorithms.graph_algorithms` | Programming/Data Structures & Algorithms |

### Batch 10 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Imperative Programming | `concept.paradigms.imperative_programming` | Programming/Languages/Paradigms |
| x | Object-Oriented Programming | `concept.paradigms.object_oriented_programming` | Programming/Languages/Paradigms |
| x | Functional Programming | `concept.paradigms.functional_programming` | Programming/Languages/Paradigms |
| x | Array Programming | `concept.paradigms.array_programming` | Programming/Languages/Paradigms |
| x | Python | `concept.languages.python` | Programming/Languages |
| x | C | `concept.languages.c_language` | Programming/Languages |
| x | C++ | `concept.languages.cpp` | Programming/Languages |
| x | Rust | `concept.languages.rust` | Programming/Languages |
| x | Go | `concept.languages.go` | Programming/Languages |
| x | JavaScript | `concept.languages.javascript` | Programming/Languages |

### Batch 11 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | TypeScript | `concept.languages.typescript` | Programming/Languages |
| x | Haskell | `concept.languages.haskell` | Programming/Languages |
| x | Lisp | `concept.languages.lisp` | Programming/Languages |
| x | Julia | `concept.languages.julia` | Programming/Languages |
| x | R | `concept.languages.r_language` | Programming/Languages |
| x | MATLAB | `concept.languages.matlab` | Programming/Languages |
| x | Assembly | `concept.languages.assembly` | Programming/Languages |
| x | CUDA | `concept.languages.cuda` | Programming/Languages |
| x | GPU Kernels | `concept.languages.gpu_kernels` | Programming/Languages |
| x | Operating Systems | `concept.systems.operating_systems` | Programming/Systems |

### Batch 12 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Networking | `concept.systems.networking` | Programming/Systems |
| x | Parallel Computing | `concept.systems.parallel_computing` | Programming/Systems |
| x | Distributed Systems | `concept.systems.distributed_systems` | Programming/Systems |
| x | High-Performance Computing | `concept.systems.high_performance_computing` | Programming/Systems |
| x | Relational Databases | `concept.systems.relational_databases` | Programming/Systems |
| x | Graph Databases | `concept.systems.graph_databases` | Programming/Systems |
| x | Version Control | `concept.software.version_control` | Programming/Software Practice |
| x | Testing | `concept.software.testing` | Programming/Software Practice |
| x | Design Patterns | `concept.software.design_patterns` | Programming/Software Practice |
| x | APIs | `concept.software.apis` | Programming/Software Practice |

### Batch 13 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Protocols | `concept.software.protocols` | Programming/Software Practice |
| x | Continuous Integration | `concept.software.continuous_integration` | Programming/Software Practice |
| x | Continuous Delivery | `concept.software.continuous_delivery` | Programming/Software Practice |
| x | Containers | `concept.software.containers` | Programming/Software Practice |
| x | Model Context Protocol | `concept.software.model_context_protocol` | Programming/Software Practice |
| x | PyTorch | `concept.ml_engineering.pytorch` | Programming/ML Engineering |
| x | JAX | `concept.ml_engineering.jax` | Programming/ML Engineering |
| x | Training Infrastructure | `concept.ml_engineering.training_infrastructure` | Programming/ML Engineering |
| x | Experiment Tracking | `concept.ml_engineering.experiment_tracking` | Programming/ML Engineering |
| x | Deployment | `concept.ml_engineering.deployment` | Programming/ML Engineering |

### Batch 14 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Edge Inference | `concept.ml_engineering.edge_inference` | Programming/ML Engineering |
| x | Ollama | `concept.ml_engineering.ollama` | Programming/ML Engineering |
| x | Supervised Learning | `concept.learning.supervised_learning` | Artificial Intelligence/Learning Paradigms |
| x | Unsupervised Learning | `concept.learning.unsupervised_learning` | Artificial Intelligence/Learning Paradigms |
| x | Self-Supervised Learning | `concept.learning.self_supervised_learning` | Artificial Intelligence/Learning Paradigms |
| x | Transfer Learning | `concept.learning.transfer_learning` | Artificial Intelligence/Learning Paradigms |
| x | Contrastive Learning | `concept.learning.contrastive_learning` | Artificial Intelligence/Learning Paradigms |
| x | Meta-Learning | `concept.learning.meta_learning` | Artificial Intelligence/Learning Paradigms |
| x | Curriculum Learning | `concept.learning.curriculum_learning` | Artificial Intelligence/Learning Paradigms |
| x | Continual Learning | `concept.learning.continual_learning` | Artificial Intelligence/Learning Paradigms |

### Batch 15 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Federated Learning | `concept.learning.federated_learning` | Artificial Intelligence/Learning Paradigms |
| x | Linear Regression | `concept.machine_learning.linear_regression` | Artificial Intelligence/Classical Machine Learning |
| x | Logistic Regression | `concept.machine_learning.logistic_regression` | Artificial Intelligence/Classical Machine Learning |
| x | Generalized Linear Models | `concept.machine_learning.generalized_linear_models` | Artificial Intelligence/Classical Machine Learning |
| x | Generalization | `concept.machine_learning.generalization` | Artificial Intelligence/Classical Machine Learning |
| x | Bias-Variance | `concept.machine_learning.bias_variance` | Artificial Intelligence/Classical Machine Learning |
| x | VC Dimension | `concept.machine_learning.vc_dimension` | Artificial Intelligence/Classical Machine Learning |
| x | PAC Learning | `concept.machine_learning.pac_learning` | Artificial Intelligence/Classical Machine Learning |
| x | Decision Trees | `concept.machine_learning.decision_trees` | Artificial Intelligence/Classical Machine Learning |
| x | Random Forests | `concept.machine_learning.random_forests` | Artificial Intelligence/Classical Machine Learning |

### Batch 16 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Gradient Boosting | `concept.machine_learning.gradient_boosting` | Artificial Intelligence/Classical Machine Learning |
| x | k-Nearest Neighbors | `concept.machine_learning.k_nearest_neighbors` | Artificial Intelligence/Classical Machine Learning |
| x | Naive Bayes | `concept.machine_learning.naive_bayes` | Artificial Intelligence/Classical Machine Learning |
| x | Support Vector Machines | `concept.machine_learning.support_vector_machines` | Artificial Intelligence/Classical Machine Learning |
| x | Kernel Methods | `concept.machine_learning.kernel_methods` | Artificial Intelligence/Classical Machine Learning |
| x | Gaussian Processes | `concept.machine_learning.gaussian_processes` | Artificial Intelligence/Classical Machine Learning |
| x | Principal Component Analysis | `concept.machine_learning.principal_component_analysis` | Artificial Intelligence/Classical Machine Learning |
| x | Independent Component Analysis | `concept.machine_learning.independent_component_analysis` | Artificial Intelligence/Classical Machine Learning |
| x | k-Means | `concept.machine_learning.k_means` | Artificial Intelligence/Classical Machine Learning |
| x | Hierarchical Clustering | `concept.machine_learning.hierarchical_clustering` | Artificial Intelligence/Classical Machine Learning |

### Batch 17 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | DBSCAN | `concept.machine_learning.dbscan` | Artificial Intelligence/Classical Machine Learning |
| x | Spectral Clustering | `concept.machine_learning.spectral_clustering` | Artificial Intelligence/Classical Machine Learning |
| x | t-SNE | `concept.machine_learning.t_sne` | Artificial Intelligence/Classical Machine Learning |
| x | UMAP | `concept.machine_learning.umap` | Artificial Intelligence/Classical Machine Learning |
| x | Hidden Markov Models | `concept.machine_learning.hidden_markov_models` | Artificial Intelligence/Classical Machine Learning |
| x | Bayesian Networks | `concept.machine_learning.bayesian_networks` | Artificial Intelligence/Classical Machine Learning |
| x | Conditional Random Fields | `concept.machine_learning.conditional_random_fields` | Artificial Intelligence/Classical Machine Learning |
| x | Backpropagation | `concept.deep_learning.backpropagation` | Artificial Intelligence/Deep Learning — Training |
| x | Stochastic Gradient Descent | `concept.deep_learning.stochastic_gradient_descent` | Artificial Intelligence/Deep Learning — Training |
| x | Adam | `concept.deep_learning.adam` | Artificial Intelligence/Deep Learning — Training |

### Batch 18 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Learning-Rate Schedules | `concept.deep_learning.learning_rate_schedules` | Artificial Intelligence/Deep Learning — Training |
| x | Loss Functions | `concept.deep_learning.loss_functions` | Artificial Intelligence/Deep Learning — Training |
| x | Initialization | `concept.deep_learning.initialization` | Artificial Intelligence/Deep Learning — Training |
| x | Regularization | `concept.deep_learning.regularization` | Artificial Intelligence/Deep Learning — Training |
| x | Batch Normalization | `concept.deep_learning.batch_normalization` | Artificial Intelligence/Deep Learning — Training |
| x | Layer Normalization | `concept.deep_learning.layer_normalization` | Artificial Intelligence/Deep Learning — Training |
| x | Distillation | `concept.deep_learning.distillation` | Artificial Intelligence/Deep Learning — Training |
| x | Pruning | `concept.deep_learning.pruning` | Artificial Intelligence/Deep Learning — Training |
| x | Quantization | `concept.deep_learning.quantization` | Artificial Intelligence/Deep Learning — Training |
| x | Perceptron | `concept.deep_learning.perceptron` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 19 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Multilayer Perceptrons | `concept.deep_learning.multilayer_perceptrons` | Artificial Intelligence/Deep Learning — Architectures |
| x | Convolutional Networks | `concept.deep_learning.convolutional_networks` | Artificial Intelligence/Deep Learning — Architectures |
| x | Recurrent Neural Networks | `concept.deep_learning.recurrent_neural_networks` | Artificial Intelligence/Deep Learning — Architectures |
| x | LSTM | `concept.deep_learning.lstm` | Artificial Intelligence/Deep Learning — Architectures |
| x | GRU | `concept.deep_learning.gru` | Artificial Intelligence/Deep Learning — Architectures |
| x | Attention | `concept.deep_learning.attention` | Artificial Intelligence/Deep Learning — Architectures |
| x | Positional Encoding | `concept.deep_learning.positional_encoding` | Artificial Intelligence/Deep Learning — Architectures |
| x | Transformers | `concept.deep_learning.transformers` | Artificial Intelligence/Deep Learning — Architectures |
| x | Vision Transformer | `concept.deep_learning.vision_transformer` | Artificial Intelligence/Deep Learning — Architectures |
| x | ConvNeXt | `concept.deep_learning.convnext` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 20 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Autoencoders | `concept.deep_learning.autoencoders` | Artificial Intelligence/Deep Learning — Architectures |
| x | Variational Autoencoders | `concept.deep_learning.variational_autoencoders` | Artificial Intelligence/Deep Learning — Architectures |
| x | Generative Adversarial Networks | `concept.deep_learning.generative_adversarial_networks` | Artificial Intelligence/Deep Learning — Architectures |
| x | Normalizing Flows | `concept.deep_learning.normalizing_flows` | Artificial Intelligence/Deep Learning — Architectures |
| x | Diffusion Models | `concept.deep_learning.diffusion_models` | Artificial Intelligence/Deep Learning — Architectures |
| x | Flow Matching | `concept.deep_learning.flow_matching` | Artificial Intelligence/Deep Learning — Architectures |
| x | Energy-Based Models | `concept.deep_learning.energy_based_models` | Artificial Intelligence/Deep Learning — Architectures |
| x | Boltzmann Machines | `concept.deep_learning.boltzmann_machines` | Artificial Intelligence/Deep Learning — Architectures |
| x | Hopfield Networks | `concept.deep_learning.hopfield_networks` | Artificial Intelligence/Deep Learning — Architectures |
| x | Radial Basis Function Networks | `concept.deep_learning.radial_basis_function_networks` | Artificial Intelligence/Deep Learning — Architectures |

### Batch 21 — complete

| Done | Title | Concept id | Category |
| --- | --- | --- | --- |
| x | Self-Organizing Maps | `concept.deep_learning.self_organizing_maps` | Artificial Intelligence/Deep Learning — Architectures |
| x | Mixture of Experts | `concept.deep_learning.mixture_of_experts` | Artificial Intelligence/Deep Learning — Architectures |
| x | State Space Models | `concept.deep_learning.state_space_models` | Artificial Intelligence/Deep Learning — Architectures |
| x | S4 | `concept.deep_learning.s4` | Artificial Intelligence/Deep Learning — Architectures |
| x | Mamba | `concept.deep_learning.mamba` | Artificial Intelligence/Deep Learning — Architectures |
| x | RWKV | `concept.deep_learning.rwkv` | Artificial Intelligence/Deep Learning — Architectures |
| x | xLSTM | `concept.deep_learning.xlstm` | Artificial Intelligence/Deep Learning — Architectures |
| x | Neural ODEs | `concept.deep_learning.neural_odes` | Artificial Intelligence/Deep Learning — Architectures |
| x | Message Passing | `concept.deep_learning.message_passing` | Artificial Intelligence/Deep Learning — Architectures |
| x | Graph Neural Networks | `concept.deep_learning.graph_neural_networks` | Artificial Intelligence/Deep Learning — Architectures |

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

## Next action

**Write Batch 20 of 28**, the ten pages named under *Resume point* above. Nothing is
uncommitted: the working tree is clean and Batch 19 is committed at `b80953b`.

A fresh agent needs four things that are not obvious from the repository:

1. **Node 22 is required and is not the default on this machine.** Put
   `/Users/nick/.nvm/versions/node/v22.14.0/bin` first on `PATH` or every script fails on
   the version check.

2. **The agent workflow scripts do not survive the session.** The writing, verifying and
   correcting pipeline ran from scripts in the session scratchpad under `/private/tmp`,
   which is session-only and is now gone. What survives in the repository is everything
   needed to rebuild it: `scripts/content-order.mjs` (the frozen order and batch numbers),
   `scripts/batch-context.mjs` (the allowed relationship targets and linkable files),
   `scripts/check-page.mjs` (the per-page gate), `scripts/content-batch.mjs` (cover,
   validate, compile, regenerate state), and `AGENT_CONTENT_CONTRACT.md` (what a page must
   be). The per-batch loop is: write ten pages, have an independent agent read each one
   adversarially for false claims, apply the corrections, then
   `node scripts/content-batch.mjs <n>`, then `npm run check`, then commit.

3. **A page passing `scripts/check-page.mjs` is not evidence that it was verified.** This
   caught the build three times — batches 4, 8/9 and 18 — where a session limit killed the
   agents after they had written their files. Reconcile an interrupted batch against what
   the verifiers actually returned, not against what is on disk. Batch 18's pages passed the
   checker and still had eleven faults in them, including an arithmetic error.

4. **`npm run check` is the gate, not `npx vitest run`.** The test run skips formatting,
   lint, types and the Docusaurus build, and all four have failed at some point in this
   build.

Two pieces of work are deliberately deferred and are not blockers: the unresolved-reference
backlog (a consolidated registry expansion and resolution sweep, described under *Failed
checks*), and the eight atlas categories that hold no candidate, which are to be filled by
giving genuinely related pages a second category rather than by inventing candidates.

The judgment calls behind this build are recorded under *Decisions* below; read them before
changing how pages are written.


## Failed checks

Every check that fails during a batch is recorded here with what it was, what
caused it, and what fixed it.

### Batch 17 — two relationships used the category name instead of the permanent id

The first `content-batch.mjs 17` validation rejected the Array Programming
relationship targets in `backpropagation.md` and `adam.md`. Both used
`concept.languages.array_programming`, inferred from the broad Languages atlas
category, while the existing page's permanent address is
`concept.paradigms.array_programming`. Corrected both targets to the existing id;
no new page or alias was created.

### Batch 17 — graph edge ordering disagreed at an id-prefix boundary

The full gate's graph test rejected the exported edge order after the new
`concept.deep_learning.backpropagation` page made
`concept.deep_learning.backpropagation_through_convolution` an id-prefix
neighbor. SQLite ordered relationship columns separately, putting the shorter
source first, while the graph contract orders the final
`source|type|target` identifiers, where `_` sorts before `|`. The exporter now
sorts the completed edge ids explicitly with the repository's locale-independent
comparator. The existing semantic-order test was kept unchanged.

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

### Batches 10 and 11 — the backlog is now the thing to watch

One hundred and ten of 280 pages written, and the unresolved-reference backlog
has grown to 136 entries across 60 pages, never more than five on any one page.
Sampled and counted rather than assumed: they are specific, named gaps — a
dedicated analytic number theory text, a functional analysis treatment of
separation in non-locally-convex spaces, accelerator hardware specifications —
and not manufactured filler. All are non-blocking and validation is clean.

This is the citation rule behaving correctly at scale: 221 sources cannot cover
everything 121 pages legitimately touch, and the alternative to declaring a gap
is stretching a citation until it does not hold. But the number is now large
enough to deserve one consolidated pass rather than a detour per batch. **Queued
for after the pages are written: a second registry expansion aimed at the
recurring gaps, then a backlog-resolution sweep across the whole corpus.** The
first such pass took batch 6 from 22 entries to 15 while raising citation counts,
so the mechanism is known to work.

### Batches 8 and 9 — the session limit again, and what survived it

Both batches were launched concurrently and both hit the hourly limit. Twenty of
twenty agents reported failure in batch 9 and ten of fourteen in batch 8 — yet
all twenty pages were on disk and nineteen passed `check-page.mjs`. The agents
had written their files and died before reporting. The twentieth carried a stray
`reason_note_placeholder_removed` key from an agent killed mid-edit.

The pages were kept and only the missing checking was redone: twenty verifiers
rather than twenty writers plus twenty verifiers. Fifty-three faults came back,
all corrected. This is the second time the same shape has appeared, and the rule
now has a name in this file: **a page passing the per-page checker is not
evidence that it was verified.** Reconcile an interrupted run against what the
verifiers returned, never against what is on disk.

Three other things came out of it:

- `stochastic-optimization.md` claimed "stochastic gradient descent" as an alias.
  SGD is its own atlas candidate awaiting its own page, so the alias would have
  blocked it. This is exactly the collision the writing brief warns about, and
  the corpus validator caught it.
- The graph export's leak test scanned the whole of `graph.json` for the
  substring `proposal`, which a relationship note about Metropolis proposals in
  Hamiltonian Monte Carlo tripped. Credentials are still searched for everywhere;
  the private store names are now searched for in keys, ids and types, which is
  where a real leak would show, rather than in published prose.
- Six test files removing a temporary git repository raced with git's own file
  handles and failed with `ENOTEMPTY` on a different test each run. Cleanup now
  retries. This was a pre-existing flake that a loaded machine made frequent, and
  it reads as a real failure somewhere new every time.

### Batch 7 — the registry expansion, and what it did and did not fix

Before writing this batch the registry was extended by forty-two sources across
topology, differential geometry, Lie theory, algebraic geometry, convex analysis,
number theory, history of mathematics and fractals. Every URL was fetched by the
agent proposing it and fetched again by an independent auditor, which corrected
several `kind` values and dropped two entries already present.

The batch 6 pages were then revisited against the larger registry. Their backlog
fell from 22 entries to 15, and their citation counts rose — convex geometry from
two sources to eight, point-set topology from three to eight — as gap
declarations were replaced by real citations. The entries that remain were left
deliberately: MacTutor documents Clifford and Lipschitz but has no page for
Hestenes; nLab states Krein-Milman but says nothing about why the closure cannot
be dropped. Agents were told that resolving two of four and leaving two standing
is a good outcome, and that is what they did.

Batch 7 then declared 22 new entries of its own, so the corpus total is 37. These
were read rather than assumed: general relativity, information geometry, CAT(k)
comparison geometry, Hilbert's tenth problem and Diffie-Hellman are genuinely
uncovered. Some history entries are probably citable to MacTutor and are worth a
second resolution pass; that is queued rather than done, and the entries are
honest in the meantime.

**Standing gap for the registry:** a spin-geometry monograph, a functional
analysis text, a geometric-algebra-for-computation reference, a relativistic
quantum mechanics text, an information geometry source and a metric geometry
text would close most of what remains.

### Batch 6 — the source registry does not cover geometry

The backlog went from one entry to twenty-two in a single batch. Inspected rather
than assumed to be noise: every entry names a specific gap, and the gaps are
real. The registry was assembled for machine learning, computer science and
analysis, and holds no geometry or topology text, no history-of-mathematics
source, no convex analysis monograph, and no edition of the Elements. So the
pages on Euclidean, non-Euclidean, spherical, hyperbolic and convex geometry,
point-set topology, Clifford and geometric algebra, octonions and quaternions
correctly report that parts of what they say rest on nothing the registry can
support.

This is the citation rule working — the alternative was ten pages quietly
stretching MIT 18.100A and a linear algebra text to cover spin geometry and
Tarski's decision procedure — but it leaves a real task behind: **the registry
needs a geometry, topology, convex analysis and history expansion, with each
source checked by a person before it is added.** Until then these pages carry
honest gap declarations, all non-blocking, and validation passes.

Nothing about this is a defect in the corpus or the application. It is recorded
here because twenty-two backlog items look alarming in the coverage report and a
later reader deserves to know they were read one by one.

### Batch 5 — the first honest backlog entry

Homological algebra discusses persistent homology, which no page in this corpus
covers and no registry source supports. Rather than stretch a citation to reach
it, the page declared an `unresolved_references` entry naming exactly what is
uncited and in which sections. That is what the field is for, and it is the
behaviour the citation rule should produce, so the entry stays and the writing
brief now asks for it explicitly instead of demanding the list stay empty.

One test asserted the backlog was empty — true of the seed corpus and not a
property worth defending. It now checks that the prose and the JSON agree at any
backlog size, that every group the JSON reports is named in the prose, and that
`--blocking` is a filter over the same backlog rather than a different one.

### Batch 4 — the writing run hit the session limit mid-batch

Five of the batch's agents died to a session limit: one writer, two verifiers and
two correction agents. All ten pages were on disk and passing `check-page.mjs`,
which is exactly the state that hides a problem — two pages carried verified
faults whose correction never ran, and three had never been read by a verifier at
all. The pages were kept and the missing work was redone rather than the batch
rewritten: the recorded faults were applied, and the three unchecked pages were
verified (one clean, two corrected).

The lesson recorded for later batches: a page passing the per-page checker is not
evidence that it was verified. The batch is finished when every page has been
both checked and read, and an interrupted run has to be reconciled against what
the verifiers actually returned, not against what is on disk.

### Batch 4 — the repository gate had not been run

`npm run check` — formatting, lint, types, validation, deterministic compile,
tests and the site build — was failing at stage three on
`docs/source-registry.json`, which had been written with `JSON.stringify` in
batch 1 and never passed through Prettier. Batches 1 to 3 were being gated on
`npx vitest run` alone, which does not cover formatting, lint, types or the
Docusaurus build. Fixed, and `npm run check` is now the per-batch gate in place
of the test run.

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
