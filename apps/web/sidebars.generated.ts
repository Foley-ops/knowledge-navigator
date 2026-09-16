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
            { type: 'doc', id: "convolution", label: "Convolution" },
            { type: 'doc', id: "cross-correlation", label: "Cross-Correlation" },
            { type: 'doc', id: "translation-equivariance", label: "Translation Equivariance" },
          ],
        },
      ],
    },
  ],
};

export default sidebars;
