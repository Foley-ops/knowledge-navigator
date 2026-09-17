// GENERATED FILE — do not edit by hand.
// Written by `navigator compile` from canonical content in content/concepts/.
//
// A concept appears once as a canonical `doc` entry under its primary
// category and as a `ref` entry under every other category it belongs to,
// so one page can be reached through several categories without becoming
// several pages. Tier 3 concepts are omitted from reader navigation.
import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  conceptsSidebar: [
    {
      type: 'category',
      label: "Artificial Intelligence",
      collapsed: false,
      items: [
        {
          type: 'category',
          label: "Computer Vision",
          collapsed: true,
          items: [
            { type: 'ref', id: "lenet", label: "LeNet" },
            { type: 'ref', id: "receptive-field", label: "Receptive Field" },
            { type: 'doc', id: "resnet", label: "ResNet" },
            { type: 'doc', id: "vgg", label: "VGG" },
          ],
        },
        {
          type: 'category',
          label: "Deep Learning — Architectures",
          collapsed: true,
          items: [
            { type: 'doc', id: "convolutional-layer", label: "Convolutional Layer" },
            { type: 'doc', id: "lenet", label: "LeNet" },
            { type: 'doc', id: "pooling", label: "Pooling" },
            { type: 'doc', id: "receptive-field", label: "Receptive Field" },
            { type: 'ref', id: "resnet", label: "ResNet" },
            { type: 'doc', id: "residual-connection", label: "Residual Connection" },
            { type: 'ref', id: "translation-equivariance", label: "Translation Equivariance" },
            { type: 'ref', id: "vgg", label: "VGG" },
          ],
        },
        {
          type: 'category',
          label: "Deep Learning — Training",
          collapsed: true,
          items: [
            { type: 'doc', id: "backpropagation-through-convolution", label: "Backpropagation Through Convolution" },
          ],
        },
      ],
    },
    {
      type: 'category',
      label: "Mathematics",
      collapsed: false,
      items: [
        {
          type: 'category',
          label: "Analysis",
          collapsed: true,
          items: [
            { type: 'doc', id: "complex-analysis", label: "Complex Analysis" },
            { type: 'doc', id: "convolution", label: "Convolution" },
            { type: 'doc', id: "cross-correlation", label: "Cross-Correlation" },
            { type: 'doc', id: "fourier-analysis", label: "Fourier Analysis" },
            { type: 'doc', id: "functional-analysis", label: "Functional Analysis" },
            { type: 'doc', id: "harmonic-analysis", label: "Harmonic Analysis" },
            { type: 'doc', id: "hilbert-spaces", label: "Hilbert Spaces" },
            { type: 'doc', id: "measure-theory", label: "Measure Theory" },
            { type: 'doc', id: "multivariable-calculus", label: "Multivariable Calculus" },
            { type: 'doc', id: "ordinary-differential-equations", label: "Ordinary Differential Equations" },
            { type: 'doc', id: "partial-differential-equations", label: "Partial Differential Equations" },
            { type: 'doc', id: "real-analysis", label: "Real Analysis" },
            { type: 'doc', id: "single-variable-calculus", label: "Single-Variable Calculus" },
            { type: 'doc', id: "translation-equivariance", label: "Translation Equivariance" },
            { type: 'doc', id: "vector-calculus", label: "Vector Calculus" },
            { type: 'doc', id: "wavelets", label: "Wavelets" },
          ],
        },
        {
          type: 'category',
          label: "Foundations",
          collapsed: true,
          items: [
            {
              type: 'category',
              label: "Logic & Proof",
              collapsed: true,
              items: [
                { type: 'doc', id: "first-order-logic", label: "First-Order Logic" },
                { type: 'doc', id: "proof-theory", label: "Proof Theory" },
                { type: 'doc', id: "propositional-logic", label: "Propositional Logic" },
              ],
            },
            { type: 'doc', id: "category-theory", label: "Category Theory" },
            { type: 'doc', id: "computability-theory", label: "Computability Theory" },
            { type: 'doc', id: "model-theory", label: "Model Theory" },
            { type: 'doc', id: "set-theory", label: "Set Theory" },
          ],
        },
      ],
    },
  ],
};

export default sidebars;
