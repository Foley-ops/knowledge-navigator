#!/usr/bin/env node
/**
 * The frozen content build order.
 *
 * Every atlas candidate that has no page yet, in the order the pages are
 * written, grouped into batches of ten. The order is a dependency order: the
 * mathematics a concept rests on is written before the concept, the programming
 * foundations before the engineering, and the machine learning before the
 * architectures that assume it. Inside a neighbourhood the order is the one a
 * reader would take, not the alphabet.
 *
 * It is frozen here rather than computed so that a resumed build produces the
 * same batches: the atlas supplies the candidates, this file supplies the order,
 * and `--json` prints the result for the tools that consume it.
 *
 *   node scripts/content-order.mjs            a readable listing
 *   node scripts/content-order.mjs --json     the machine-readable plan
 *   node scripts/content-order.mjs --batch 3  one batch
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadAtlasFromText } from '../packages/core/dist/index.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const BATCH_SIZE = 10;

/**
 * The id prefix each category contributes to a concept id.
 *
 * The eleven pages version 1 wrote use the neighbourhood rather than the atlas
 * category id — `concept.deep_learning.resnet`, not
 * `concept.deep_learning_architectures.resnet` — and every page written since
 * follows them, because an id is an address and inconsistent addresses are the
 * thing ids exist to prevent.
 */
export const ID_PREFIX = {
  'Mathematics/Foundations': 'foundations',
  'Mathematics/Foundations/Logic & Proof': 'logic',
  'Mathematics/Foundations/Formal Verification': 'formal_verification',
  'Mathematics/Analysis': 'analysis',
  'Mathematics/Linear & Multilinear Algebra': 'linear_algebra',
  'Mathematics/Probability & Statistics': 'probability',
  'Mathematics/Algebra': 'algebra',
  'Mathematics/Geometry & Topology': 'geometry',
  'Mathematics/Number Theory': 'number_theory',
  'Mathematics/Theory of Computation': 'computation',
  'Mathematics/Optimization': 'optimization',
  'Mathematics/Mathematical Physics': 'physics',
  'Programming/Data Structures & Algorithms': 'algorithms',
  'Programming/Languages': 'languages',
  'Programming/Languages/Paradigms': 'paradigms',
  'Programming/Systems': 'systems',
  'Programming/Software Practice': 'software',
  'Programming/ML Engineering': 'ml_engineering',
  'Artificial Intelligence/Classical Machine Learning': 'machine_learning',
  'Artificial Intelligence/Learning Paradigms': 'learning',
  'Artificial Intelligence/Deep Learning — Training': 'deep_learning',
  'Artificial Intelligence/Deep Learning — Architectures': 'deep_learning',
  'Artificial Intelligence/Reinforcement Learning': 'reinforcement_learning',
  'Artificial Intelligence/Domains': 'applications',
  'Artificial Intelligence/Domains/Computer Vision': 'vision',
  'Artificial Intelligence/Domains/Natural Language Processing': 'nlp',
  'Artificial Intelligence/Symbolic AI': 'symbolic_ai',
  'Artificial Intelligence/Symbolic AI/Search': 'search',
  'Artificial Intelligence/Symbolic AI/Planning': 'planning',
  'Artificial Intelligence/Other Traditions & Frontiers': 'ai_frontiers',
};

/** Names an automatic slug would mangle, fixed by hand once. */
export const NAME_OVERRIDES = {
  'A*': ['a-star', 'a_star'],
  'C': ['c-language', 'c_language'],
  'C++': ['cpp', 'cpp'],
  'R': ['r-language', 'r_language'],
  'S4': ['s4', 's4'],
  'k-Means': ['k-means', 'k_means'],
  'k-Nearest Neighbors': ['k-nearest-neighbors', 'k_nearest_neighbors'],
  't-SNE': ['t-sne', 't_sne'],
  'Bias-Variance': ['bias-variance', 'bias_variance'],
  'Neuro-Symbolic AI': ['neuro-symbolic-ai', 'neuro_symbolic_ai'],
  'Self-Organizing Maps': ['self-organizing-maps', 'self_organizing_maps'],
  'Self-Supervised Learning': ['self-supervised-learning', 'self_supervised_learning'],
  'Model-Based Reinforcement Learning': [
    'model-based-reinforcement-learning',
    'model_based_reinforcement_learning',
  ],
  'Multi-Agent Reinforcement Learning': [
    'multi-agent-reinforcement-learning',
    'multi_agent_reinforcement_learning',
  ],
  'Multi-Armed Bandits': ['multi-armed-bandits', 'multi_armed_bandits'],
  'Temporal-Difference Learning': ['temporal-difference-learning', 'temporal_difference_learning'],
  'Learning-Rate Schedules': ['learning-rate-schedules', 'learning_rate_schedules'],
  'High-Dimensional Statistics': ['high-dimensional-statistics', 'high_dimensional_statistics'],
  'Non-Euclidean Geometry': ['non-euclidean-geometry', 'non_euclidean_geometry'],
  'Point-Set Topology': ['point-set-topology', 'point_set_topology'],
  'Kolmogorov-Arnold Networks': ['kolmogorov-arnold-networks', 'kolmogorov_arnold_networks'],
  'Actor-Critic': ['actor-critic', 'actor_critic'],
  'Energy-Based Models': ['energy-based-models', 'energy_based_models'],
  'Radial Basis Function Networks': [
    'radial-basis-function-networks',
    'radial_basis_function_networks',
  ],
};

/**
 * The order, neighbourhood by neighbourhood.
 *
 * Each entry is a category path and the titles under it in reading order. A
 * title that appears in no list would be a candidate nobody planned for, and
 * `plan()` refuses rather than filing it at the end.
 */
export const ORDER = [
  // ---- mathematical bedrock ----------------------------------------------
  [
    'Mathematics/Foundations',
    ['Set Theory', 'Category Theory', 'Model Theory', 'Computability Theory'],
  ],
  ['Mathematics/Foundations/Logic & Proof', ['Propositional Logic', 'First-Order Logic', 'Proof Theory']],
  [
    'Mathematics/Analysis',
    [
      'Single-Variable Calculus',
      'Real Analysis',
      'Multivariable Calculus',
      'Vector Calculus',
      'Ordinary Differential Equations',
      'Partial Differential Equations',
      'Measure Theory',
      'Complex Analysis',
      'Fourier Analysis',
      'Harmonic Analysis',
      'Wavelets',
      'Functional Analysis',
      'Hilbert Spaces',
      'Banach Spaces',
      'Operators',
      'Calculus of Variations',
      'Dynamical Systems',
      'Chaos',
    ],
  ],
  [
    'Mathematics/Linear & Multilinear Algebra',
    [
      'Vector Spaces',
      'Matrix Theory',
      'Matrix Decompositions',
      'Spectral Theory',
      'Tensors',
      'Tensor Decomposition',
    ],
  ],
  [
    'Mathematics/Probability & Statistics',
    [
      'Probability Theory',
      'Stochastic Processes',
      'Martingales',
      'Concentration Inequalities',
      'Frequentist Inference',
      'Bayesian Inference',
      'High-Dimensional Statistics',
      'Random Matrix Theory',
      'Probability and Computing',
    ],
  ],
  [
    'Mathematics/Algebra',
    [
      'Group Theory',
      'Ring Theory',
      'Field Theory',
      'Order Theory',
      'Lattice Theory',
      'Galois Theory',
      'Representation Theory',
      'Lie Algebras',
      'Homological Algebra',
      'Complex Numbers',
      'Quaternions',
      'Octonions',
      'Clifford Algebra',
      'Geometric Algebra',
    ],
  ],
  [
    'Mathematics/Geometry & Topology',
    [
      'Euclidean Geometry',
      'Non-Euclidean Geometry',
      'Spherical Geometry',
      'Hyperbolic Geometry',
      'Convex Geometry',
      'Point-Set Topology',
      'Algebraic Topology',
      'Manifolds',
      'Differential Geometry',
      'Differential Topology',
      'Curvature',
      'Lie Groups',
      'Algebraic Geometry',
      'Fractal Geometry',
      'Renormalization',
    ],
  ],
  [
    'Mathematics/Number Theory',
    ['Elementary Number Theory', 'Analytic Number Theory', 'Algebraic Number Theory'],
  ],
  ['Mathematics/Theory of Computation', ['Automata', 'Computational Complexity']],
  [
    'Mathematics/Optimization',
    [
      'Convex Optimization',
      'Nonconvex Optimization',
      'Stochastic Optimization',
      'Combinatorial Optimization',
      'Integer Programming',
      'Variational Methods',
      'Optimal Transport',
    ],
  ],
  ['Mathematics/Mathematical Physics', ['Hamiltonian Mechanics', 'Statistical Mechanics']],
  ['Mathematics/Foundations/Formal Verification', ['Lean', 'Coq']],

  // ---- programming bedrock -----------------------------------------------
  [
    'Programming/Data Structures & Algorithms',
    ['Complexity Analysis', 'Core Data Structures', 'Sorting', 'Searching', 'Graph Algorithms'],
  ],
  [
    'Programming/Languages/Paradigms',
    [
      'Imperative Programming',
      'Object-Oriented Programming',
      'Functional Programming',
      'Array Programming',
    ],
  ],
  [
    'Programming/Languages',
    [
      'Python',
      'C',
      'C++',
      'Rust',
      'Go',
      'JavaScript',
      'TypeScript',
      'Haskell',
      'Lisp',
      'Julia',
      'R',
      'MATLAB',
      'Assembly',
      'CUDA',
      'GPU Kernels',
    ],
  ],
  [
    'Programming/Systems',
    [
      'Operating Systems',
      'Networking',
      'Parallel Computing',
      'Distributed Systems',
      'High-Performance Computing',
      'Relational Databases',
      'Graph Databases',
    ],
  ],
  [
    'Programming/Software Practice',
    [
      'Version Control',
      'Testing',
      'Design Patterns',
      'APIs',
      'Protocols',
      'Continuous Integration',
      'Continuous Delivery',
      'Containers',
      'Model Context Protocol',
    ],
  ],
  [
    'Programming/ML Engineering',
    [
      'PyTorch',
      'JAX',
      'Training Infrastructure',
      'Experiment Tracking',
      'Deployment',
      'Edge Inference',
      'Ollama',
    ],
  ],

  // ---- classical machine learning ----------------------------------------
  [
    'Artificial Intelligence/Learning Paradigms',
    [
      'Supervised Learning',
      'Unsupervised Learning',
      'Self-Supervised Learning',
      'Transfer Learning',
      'Contrastive Learning',
      'Meta-Learning',
      'Curriculum Learning',
      'Continual Learning',
      'Federated Learning',
    ],
  ],
  [
    'Artificial Intelligence/Classical Machine Learning',
    [
      'Linear Regression',
      'Logistic Regression',
      'Generalized Linear Models',
      'Generalization',
      'Bias-Variance',
      'VC Dimension',
      'PAC Learning',
      'Decision Trees',
      'Random Forests',
      'Gradient Boosting',
      'k-Nearest Neighbors',
      'Naive Bayes',
      'Support Vector Machines',
      'Kernel Methods',
      'Gaussian Processes',
      'Principal Component Analysis',
      'Independent Component Analysis',
      'k-Means',
      'Hierarchical Clustering',
      'DBSCAN',
      'Spectral Clustering',
      't-SNE',
      'UMAP',
      'Hidden Markov Models',
      'Bayesian Networks',
      'Conditional Random Fields',
    ],
  ],

  // ---- deep learning ------------------------------------------------------
  [
    'Artificial Intelligence/Deep Learning — Training',
    [
      'Backpropagation',
      'Stochastic Gradient Descent',
      'Adam',
      'Learning-Rate Schedules',
      'Loss Functions',
      'Initialization',
      'Regularization',
      'Batch Normalization',
      'Layer Normalization',
      'Distillation',
      'Pruning',
      'Quantization',
    ],
  ],
  [
    'Artificial Intelligence/Deep Learning — Architectures',
    [
      'Perceptron',
      'Multilayer Perceptrons',
      'Convolutional Networks',
      'Recurrent Neural Networks',
      'LSTM',
      'GRU',
      'Attention',
      'Positional Encoding',
      'Transformers',
      'Vision Transformer',
      'ConvNeXt',
      'Autoencoders',
      'Variational Autoencoders',
      'Generative Adversarial Networks',
      'Normalizing Flows',
      'Diffusion Models',
      'Flow Matching',
      'Energy-Based Models',
      'Boltzmann Machines',
      'Hopfield Networks',
      'Radial Basis Function Networks',
      'Self-Organizing Maps',
      'Mixture of Experts',
      'State Space Models',
      'S4',
      'Mamba',
      'RWKV',
      'xLSTM',
      'Neural ODEs',
      'Message Passing',
      'Graph Neural Networks',
      'Graph Convolutional Networks',
      'Graph Attention Networks',
      'Equivariance',
      'Geometric Deep Learning',
      'Spherical CNNs',
      'Capsule Networks',
      'Kolmogorov-Arnold Networks',
      'Quaternion Neural Networks',
      'Clifford Neural Networks',
      'Spiking Neural Networks',
      'Neuromorphic Computing',
    ],
  ],

  // ---- reinforcement learning --------------------------------------------
  [
    'Artificial Intelligence/Reinforcement Learning',
    [
      'Markov Decision Processes',
      'Dynamic Programming',
      'Monte Carlo Methods',
      'Temporal-Difference Learning',
      'Q-Learning',
      'DQN',
      'Policy Gradients',
      'REINFORCE',
      'Actor-Critic',
      'PPO',
      'SAC',
      'Model-Based Reinforcement Learning',
      'Multi-Armed Bandits',
      'Imitation Learning',
      'Inverse Reinforcement Learning',
      'Offline Reinforcement Learning',
      'Multi-Agent Reinforcement Learning',
      'RLHF',
      'RLAIF',
    ],
  ],

  // ---- symbolic AI --------------------------------------------------------
  [
    'Artificial Intelligence/Symbolic AI/Search',
    ['Uninformed Search', 'A*', 'Adversarial Search', 'Minimax', 'Monte Carlo Tree Search'],
  ],
  ['Artificial Intelligence/Symbolic AI/Planning', ['STRIPS', 'PDDL', 'Hierarchical Planning']],
  [
    'Artificial Intelligence/Symbolic AI',
    [
      'Knowledge Representation',
      'Ontologies',
      'Logic Programming',
      'Constraint Satisfaction',
      'Expert Systems',
    ],
  ],

  // ---- domains ------------------------------------------------------------
  [
    'Artificial Intelligence/Domains/Computer Vision',
    ['Classification', 'Detection', 'Segmentation', 'Visual Place Recognition'],
  ],
  [
    'Artificial Intelligence/Domains/Natural Language Processing',
    ['Tokenization', 'Embeddings', 'BERT', 'GPT', 'Agents'],
  ],
  [
    'Artificial Intelligence/Domains',
    ['Time Series', 'Forecasting', 'Speech', 'Audio', 'Control', 'Robotics', 'Recommender Systems'],
  ],

  // ---- frontiers ----------------------------------------------------------
  [
    'Artificial Intelligence/Other Traditions & Frontiers',
    [
      'Evolutionary Computation',
      'Genetic Algorithms',
      'Neuroevolution',
      'Swarm Intelligence',
      'Fuzzy Logic',
      'Causal Inference',
      'Neuro-Symbolic AI',
      'Interpretability',
      'Mechanistic Interpretability',
      'AI Safety',
      'Alignment',
    ],
  ],
];

function kebab(title) {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** The slug tail and the id segment for a title. */
export function names(title) {
  const override = NAME_OVERRIDES[title];
  if (override !== undefined) return { slugTail: override[0], segment: override[1] };
  const slugTail = kebab(title);
  return { slugTail, segment: slugTail.replace(/-/g, '_') };
}

/** Every candidate that still has no page, in order, with its addresses. */
export function plan() {
  const atlasResult = loadAtlasFromText(readFileSync(`${ROOT}/content/atlas.yaml`, 'utf8'));
  const atlas = atlasResult.atlas;
  if (atlas === undefined) throw new Error('content/atlas.yaml did not parse');

  const byTitle = new Map();
  for (const candidate of atlas.document.candidates) {
    byTitle.set(candidate.title, candidate);
  }

  const items = [];
  const seen = new Set();
  for (const [categoryPath, titles] of ORDER) {
    const prefix = ID_PREFIX[categoryPath];
    if (prefix === undefined) throw new Error(`no id prefix for ${categoryPath}`);
    for (const title of titles) {
      const candidate = byTitle.get(title);
      if (candidate === undefined) throw new Error(`no atlas candidate titled ${title}`);
      if (seen.has(candidate.candidate_id)) throw new Error(`${title} is planned twice`);
      seen.add(candidate.candidate_id);
      if (candidate.status === 'covered') continue;

      const { slugTail, segment } = names(title);
      const categories = candidate.categories.map((id) => atlas.categories.get(id)?.path ?? id);
      items.push({
        candidateId: candidate.candidate_id,
        title,
        conceptId: `concept.${prefix}.${segment}`,
        slug: `/concepts/${slugTail}`,
        file: `content/concepts/${slugTail}.md`,
        primaryCategory: categories[0] ?? categoryPath,
        categories,
        area: (categories[0] ?? categoryPath).split('/')[0],
      });
    }
  }

  // Every uncovered candidate must be planned: a candidate nobody ordered would
  // silently never be written, which is the one failure this file prevents.
  for (const candidate of atlas.document.candidates) {
    if (candidate.status === 'covered') continue;
    if (!seen.has(candidate.candidate_id)) {
      throw new Error(`candidate ${candidate.candidate_id} (${candidate.title}) is in no batch`);
    }
  }

  const batches = [];
  for (let index = 0; index < items.length; index += BATCH_SIZE) {
    batches.push({
      number: batches.length + 1,
      items: items.slice(index, index + BATCH_SIZE),
    });
  }
  return { items, batches };
}

function main(argv) {
  const { items, batches } = plan();
  if (argv.includes('--json')) {
    process.stdout.write(`${JSON.stringify({ items, batches }, null, 2)}\n`);
    return 0;
  }
  const only = argv.indexOf('--batch');
  const chosen = only >= 0 ? [batches[Number(argv[only + 1]) - 1]] : batches;
  for (const batch of chosen) {
    if (batch === undefined) continue;
    console.log(`\nBatch ${String(batch.number)} of ${String(batches.length)}`);
    for (const item of batch.items) {
      console.log(`  ${item.conceptId.padEnd(52)} ${item.title}`);
      console.log(`  ${''.padEnd(52)} ${item.primaryCategory}`);
    }
  }
  console.log(`\n${String(items.length)} pages, ${String(batches.length)} batches`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = main(process.argv.slice(2));
}
