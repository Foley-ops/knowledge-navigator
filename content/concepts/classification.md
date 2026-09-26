---
concept_id: concept.vision.classification
title: Classification
slug: /concepts/classification
aliases:
  - Image classification
kind: problem
tier: 1
review_state: generated-draft
summary: The task of assigning one whole image exactly one label from a fixed, known set of classes, whose modern default implementation is a convolutional backbone that pools pixels into a whole-image feature, a linear head over the classes, and cross-entropy training.
categories:
  - Artificial Intelligence/Domains/Computer Vision
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Domains/Computer Vision
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_networks
    note: The standard classification pipeline this page describes puts a convolutional network between the pixels and the class scores, so the convolutional backbone must be understood before the task's default implementation makes sense.
  - type: requires
    target: concept.deep_learning.loss_functions
    note: Training minimizes the cross-entropy between the head's class distribution and the true label, so the loss and its gradient have to be meaningful before the training recipe on this page makes sense.
  - type: useful_when
    target: concept.learning.transfer_learning
    note: When the target dataset is much smaller than ImageNet, fine-tuning a pretrained backbone is the standard way to run this task at all, so the transfer-learning page is the workaround this page leans on for small data.
  - type: contrasts_with
    target: concept.deep_learning.lenet
    note: LeNet solved this same task in the 1990s regime — small, clean digit images, a shallow stack, weight-decay-only capacity control — whereas this page describes the large-data regime in which learned features supersede hand-crafted ones; the contrast is scale and era, not task.
  - type: contrasts_with
    target: concept.deep_learning.vision_transformer
    note: A vision transformer solves this same whole-image task without convolutions — self-attention over image patches instead of local filtering — making it the principal non-convolutional alternative to this page's pipeline.
  - type: useful_when
    target: concept.deep_learning.regularization
    note: On small target datasets the over-parameterized backbones this task uses overfit, so regularization (weight decay, dropout) is the standard tool the recipes cited here employ.
  - type: generalizes
    target: concept.machine_learning.logistic_regression
    note: The linear head trained with cross-entropy over C classes is the multiclass extension of the binary logistic head; setting C to 2 specializes the construction to logistic regression.
sources:
  - source_id: source.zhang2023.d2l
    title: Dive into Deep Learning
    url: https://d2l.ai
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
    checked_on: 2026-09-24
  - source_id: source.lecun1998.gradient_based_learning
    title: Gradient-Based Learning Applied to Document Recognition
    url: https://ieeexplore.ieee.org/document/726791
    source_kind: primary-research
    supports:
      - history-and-attribution
    checked_on: 2026-09-24
  - source_id: source.simonyan2015.very_deep_convolutional_networks
    title: Very Deep Convolutional Networks for Large-Scale Image Recognition
    url: https://arxiv.org/abs/1409.1556
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-24
  - source_id: source.he2016.deep_residual_learning
    title: Deep Residual Learning for Image Recognition
    url: https://arxiv.org/abs/1512.03385
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-24
unresolved_references:
  - label: Image augmentation
    reason: The variants section names image augmentation as part of AlexNet's training loop (flipping and color changes, per d2l) and as the survey d2l points to (Buslaev et al.), but no page in the corpus explains the technique, so it is written as plain text here.
    sections:
      - variants-and-alternatives
    blocking: false
    proposed_kind: method
    proposed_categories:
      - Artificial Intelligence/Computer Vision
claims:
  - claim_id: claim.classification.handcrafted_pipeline
    section: why-it-matters
    statement: 'Before 2012, a typical computer vision pipeline for this task was: obtain the dataset, preprocess it with hand-crafted features, run it through hand-engineered extractors such as SIFT, SURF or bags of visual words, and fit a stock classifier (usually a linear model or kernel method) on top; for practitioners inside such pipelines the learning algorithm was often considered an afterthought.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §8.1, the four-step classical pipeline and the "afterthought" paragraph
        note: The pipeline steps and the quote about features, geometry and engineering driving progress.
  - claim_id: claim.classification.learned_features_win
    section: why-it-matters
    statement: AlexNet showed, for the first time, that the features obtained by learning can transcend manually-designed features, breaking the previous paradigm in computer vision.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §8.1.2, opening paragraph on AlexNet
  - claim_id: claim.classification.imagenet_scale
    section: why-it-matters
    statement: ImageNet was released in 2009 with about one million examples, 1000 each from 1000 distinct object categories, an order of magnitude beyond prior datasets, and at a resolution (224 by 224 pixels) far above the 32 by 32 thumbnails of the comparable TinyImages set.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §8.1.1, Missing Ingredient: Data'
  - claim_id: claim.classification.alexnet_design
    section: concrete-example
    statement: AlexNet is an eight-layer network — five convolutional layers, two fully connected hidden layers, one fully connected output layer — that used ReLU instead of sigmoid, controlled the fully connected layers with dropout, and won the ImageNet Large Scale Visual Recognition Challenge 2012 by a large margin.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §8.1.2, Architecture, Activation Functions and Capacity Control and Preprocessing
  - claim_id: claim.classification.alexnet_fc_overhead
    section: limitations-and-common-mistakes
    statement: "d2l identifies AlexNet's last two fully connected layers (matrices of size 6400×4096 and 4096×4096) as the architecture's Achilles heel for efficiency, with a nontrivial memory and computation cost, and names this one of the reasons AlexNet was surpassed by more effective architectures."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §8.1.4, discussion
  - claim_id: claim.classification.finetune_recipe
    section: concrete-example
    statement: "Fine-tuning, as d2l defines it, has four steps: pretrain a source model on a source dataset; create a target model copying the source design and parameters except the output layer; add an output layer with as many outputs as the target dataset's categories, randomly initialized; then train on the target dataset, the output layer learned from scratch while the remaining parameters are fine-tuned, generally with a smaller learning rate than the output layer's."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.2.1, steps, and §14.2.3 summary
  - claim_id: claim.classification.hotdog_comparison
    section: concrete-example
    statement: In d2l's hot-dog example, a ResNet-18 pretrained on ImageNet whose ImageNet head (512 to 1000) is replaced by a randomly initialized two-class head reaches test accuracy 0.940 after 5 epochs, versus 0.850 for the same architecture trained from scratch, which d2l attributes to the more effective initial parameters.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.2.2, Fine-Tuning the Model, and the from-scratch comparison
  - claim_id: claim.classification.small_data_risk
    section: assumptions-and-requirements
    statement: A complicated model suitable for ImageNet may overfit on a target dataset much smaller than ImageNet (d2l's chair example is less than one-tenth of ImageNet's size), which is the motivation d2l gives for transferring knowledge learned from a larger source dataset.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.2, opening paragraphs
  - claim_id: claim.classification.feature_hierarchy
    section: intuition
    statement: d2l describes AlexNet's learned hierarchy as lowest-layer filters resembling traditional ones, with higher layers possibly representing larger structures such as eyes, noses or blades of grass, and still higher layers possibly representing whole objects such as people, airplanes, dogs or frisbees.
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §8.1.1, representation learning, and Fig. 8.1.1
---

## Definition

Image classification takes a single image and assigns it exactly one label from a fixed
set of $C$ classes known in advance — "airplane, car, or dog" rather than "a dog,
standing, left of centre". The class set is closed: whatever the image contains, the
answer must be one of the $C$ pre-declared labels, and the output concerns the whole
image rather than any region of it.

The modern default implementation of the task is a three-part pipeline. A
convolutional backbone (a [convolutional network](./convolutional-networks.md))
consumes the raw pixels and builds a fixed-length, whole-image feature vector; a
spatial pooling step collapses whatever spatial extent survives; a linear head maps
that vector to $C$ scores, one per class. The model is trained by minimising the
cross-entropy between the head's class distribution and the true label, which is why
the task sits on top of the machinery the [loss function](./loss-functions.md) page
describes.

## Why it matters

Before 2012 this task belonged to hand-built pipelines. Per d2l §8.1, a typical
computer vision system obtained a dataset, preprocessed it, ran it through
hand-engineered feature extractors — SIFT, SURF, bags of visual words — and then
"dump the resulting representations into your favourite classifier, likely a linear
model or kernel method". For researchers inside those pipelines the "learning
algorithm was often considered an afterthought"; progress came from cleverer
features and geometry rather than from the learner, and neural networks on this task
were "often surpassed by other machine learning methods".

Two missing ingredients arrived together and changed that, per d2l §8.1.1. Data:
ImageNet's 2009 release brought on the order of a million images across 1000
categories, over an order of magnitude beyond prior datasets. Hardware: GPUs with
throughputs CPUs could not match made deep, many-parameter networks trainable at all.
AlexNet, trained on two such GPUs, won the 2012 ImageNet challenge "by a large
margin" and showed "for the first time, that the features obtained by learning can
transcend manually-designed features, breaking the previous paradigm in computer
vision". From that point on, image classification became the shared yardstick on
which backbones are reported, and the pipeline shape above — learned features,
pooled, linear head, cross-entropy — became the default.

## Intuition

The backbone works like a funnel of features. In d2l's account of AlexNet, the
learned filters in the lowest layer "resembled some traditional filters" —
edge- and texture-style detectors (Fig. 8.1.1). Higher layers, in the book's words,
"might build upon these representations to represent larger structures, like eyes,
noses, blades of grass, and so on", and still higher layers "might represent whole
objects like people, airplanes, dogs, or frisbees". The final hidden state is "a
compact representation of the image that summarizes its contents such that data
belonging to different categories can be easily separated" — one vector per image, in
a space where $C$ linear units can pull the classes apart.

Keep the hierarchy (small motifs, then parts, then whole objects, then one label)
and drop the idea that intermediate units are interpretable detectors in a
human-reverse-engineered sense: the book itself hedges ("might build upon", "might
represent"), and a trained network's units are typically no cleaner than that.

## Concrete example

Two concrete traces from d2l.

First, the shape flow of AlexNet on a 224×224 input (d2l §8.1.2 layer summary): the
first $11 \times 11$ stride-4 convolution gives 96 planes at 54×54; a $3 \times 3$
max pool halves this to 26×26; a second convolution (256 channels) and pool bring it
to 12×12; three $3 \times 3$ convolutions (384, 384, 256 channels) hold that 12×12; a
final pool drops to 5×5 with 256 channels; flattening yields a 6400-dimensional
vector; two 4096-wide fully connected layers follow, and the head emits 10 class
scores for the book's ten-class example.

Second, the fine-tuning worked example (d2l §14.2.2), which is the one this page
builds on. The target task is binary: hot dog present or not. The dataset holds 1400
hot-dog images and 1400 other-food images, with 1000 of each class for training and
the rest for testing. The source model is ResNet-18 pretrained on ImageNet: its head
is `Linear(512 → 1000)` over a 512-dimensional global-average-pooled feature. To make
the target model, that head is replaced by `Linear(512 → 2)` and randomly
initialised; everything else is copied from the source. The backbone is fine-tuned at
a small base learning rate ($5 \times 10^{-5}$ in the book) while the new head is
trained at ten times that rate. After 5 epochs, d2l reports test accuracy 0.940 for
the fine-tuned model against 0.850 for an identical model trained from scratch at a
learning rate of $5 \times 10^{-4}$:

```python
import torch
from torch import nn

net = torchvision.models.resnet18(pretrained=True)  # head: 512 -> 1000 (ImageNet)
net.fc = nn.Linear(net.fc.in_features, 2)            # target head: 2 classes
nn.init.xavier_uniform_(net.fc.weight)

backbone = [p for n, p in net.named_parameters() if not n.startswith("fc.")]
opt = torch.optim.SGD(
    [{"params": backbone}, {"params": net.fc.parameters(), "lr": 5e-4}],
    lr=5e-5, weight_decay=1e-3)
loss = nn.CrossEntropyLoss()
# one step: images of shape (batch, 3, 224, 224), labels in {0, 1}
# opt.zero_grad(); loss(net(imgs), labels).backward(); opt.step()
```

## Formal treatment

Let $x \in \mathbb{R}^{3 \times H \times W}$ be an image. A backbone $f_\theta$
(convolutional layers, pooling, nonlinearities; parameters $\theta$) maps it to a
feature $z \in \mathbb{R}^{d}$ — for example $H = W = 224$ and $d = 512$ for
ResNet-18 after its final average pooling. A linear head $W \in \mathbb{R}^{C \times d}$,
$b \in \mathbb{R}^{C}$ produces one score per class, $y = Wz + b$. Under the standard
formulation a softmax turns scores into a class distribution, $p_c =
\operatorname{softmax}(y)_c$, and training minimises the mean negative log-likelihood
of the true class, i.e. cross-entropy:

$$
\mathcal{L}(\theta, W, b; x, y^{*}) = -\log \frac{\exp(y_{y^{*}})}{\sum_{c=1}^{C} \exp(y_{c})},
$$

which d2l's fine-tuning code uses directly as `nn.CrossEntropyLoss`. Training
minimises the average loss over the dataset by gradient descent (SGD in the worked
example), with $C = 2$ there and $C = 1000$ for the ImageNet source task. Note the
pipeline identity: everything before the head is one representation, and the head is
a $C$-way linear classifier. Change the backbone and $z$ changes; change $C$ and only
the head changes — which is exactly what fine-tuning exploits.

## Assumptions and requirements

- The label set is fixed and known in advance. There are $C$ classes, and every
  image's answer is one of them. The pipeline has no notion of "out of
  vocabulary", so an image whose true content falls outside the vocabulary is
  outside the task.
- A whole-image verdict. If the answer also has to say _where_ something is, this
  is the wrong task (object detection or segmentation; the corpus has no page for
  either).
- Data, or a strong prior. d2l §8.1.1 states that deep models "require large
  amounts of data in order to enter the regime where they significantly outperform
  traditional methods", and §14.2 warns that complicated ImageNet-suitable models
  "may lead to overfitting" on a chair dataset under a tenth of ImageNet's size.
  This is the requirement most easily missed: ImageNet-scale labels, a pretrained
  backbone, or acceptance that the model is not identifiable from what you have.
- An input convention. The backbone expects a fixed geometry — 224×224 RGB input
  with per-channel standardisation in the examples above — so images of arbitrary
  resolution must be cropped and rescaled. d2l is explicit that upsampling 28×28
  images to 224×224 is "generally not a smart practice, as it simply increases the
  computational complexity without adding information" (d2l §8.1.3).

## Uses and applicability

Reach for classification when the deliverable is one closed-vocabulary verdict per
whole image: cataloguing products, triaging photos into a fixed set of outcomes,
filtering a photo library. It is also the route when the _side product_ is the point
— the final hidden state that "summarizes its contents" (d2l §8.1.1) is exactly the
compact representation a retrieval or downstream model wants.

Do not reach for it when the label set keeps growing (you need open-set or
retrieval-style matching instead), when the objects of interest occupy small
portions of very different scenes (a whole-image softmax may be arguing about the
background), or when the dataset is small and you are starting from scratch — in
that last case the right move, per d2l §14.2, is not a different objective but a
pretrained backbone plus fine-tuning.

## Limitations and common mistakes

- **Confusing the task with one backbone.** d2l's own discussion names AlexNet's
  "Achilles heel when it comes to efficiency": the last two fully connected layers
  (matrices of $6400 \times 4096$ and $4096 \times 4096$), "a nontrivial outlay" in
  memory and computation, "one of the reasons why AlexNet has been surpassed by
  much more effective architectures" (d2l §8.1.4). The task outlives any backbone;
  its cost and capacity trade-offs do not.
- **Misreading the small-data result.** The hot-dog numbers (fine-tuned test
  accuracy 0.940 versus 0.850 from scratch) are a same-epoch comparison in one
  d2l example, explained by "its initial parameter values are more effective" —
  not a statement that fine-tuning cannot be beaten by longer training.
- **Fine-tuning everything at one rate.** The d2l recipe is asymmetric: a small rate
  for the copied parameters, ten times larger for the randomly initialised head. A
  single large rate across the network discards the prior the transfer was meant
  to supply.
- **Treating upscaling as information.** Resizing low-resolution images to the
  model's expected input "simply increases the computational complexity without
  adding information" (d2l §8.1.3); it is not a substitute for the right input
  distribution.
- **Skipping capacity control.** AlexNet's recipe controls its fully connected part
  with dropout, the fine-tuning recipe uses weight decay, and d2l flags overfitting
  as the standing risk on a small target dataset (the chair example, d2l §14.2). A
  large unregularized backbone on small data is the failure mode, not an edge case.

## Variants and alternatives

Backbone choice is the main axis, and d2l tells its history through three
milestones with primary references on this page: LeNet, the early convolutional
classifier for digit images (see [LeNet](./lenet.md)); the VGG family (Simonyan and
Zisserman; see [VGG](./vgg.md)); and ResNet (He et al.; see [ResNet](./resnet.md)).
AlexNet sits between LeNet and these later backbones in d2l's narrative (§8.1), as
the model credited with breaking the hand-designed-feature paradigm; d2l does not
hold a separate AlexNet entry, so the attribution here goes through d2l only.

The non-convolutional alternative is the [vision transformer](./vision-transformer.md):
the same whole-image task, but patches plus self-attention in place of local
filtering.

The training-side variants: fine-tuning a pretrained backbone when the target
dataset is small (d2l §14.2's standard route, elaborated on
[transfer learning](./transfer-learning.md)); image augmentation to enlarge the
effective training set (d2l records flipping and color changes in AlexNet's
training loop and points to Buslaev et al. for a deep review; the corpus has no page
for image augmentation yet); and capacity control via [regularization](./regularization.md)
such as dropout and weight decay. On the head side, the multiclass softmax head is
the natural extension of the binary [logistic regression](./logistic-regression.md)
head — set $C = 2$ in the formal treatment and you have the same linear-plus-
cross-entropy construction.

## History and attribution

The lineage d2l reconstructs: convolutional networks applied to this task go back
to LeNet (LeCun et al., cited in d2l as 1995; the journal paper of record is the
1998 "Gradient-Based Learning Applied to Document Recognition"). Between the 1990s
and 2012, per d2l §8.1, neural networks on this task were "often surpassed by other
machine learning methods", and progress was driven by hand-engineered features.
ImageNet (Deng et al., 2009, per d2l) supplied the scale — about a million images,
1000 categories — and GPU training made deep models feasible; Krizhevsky's and
Sutskever's 2012 AlexNet (Krizhevsky et al., 2012, as cited in d2l) won the 2012
ImageNet challenge by a large margin and established learned features as the
paradigm. The backbones that followed — VGG (Simonyan and Zisserman) and ResNet
(He et al.) — kept pushing the same pipeline deeper, and d2l's fine-tuning account
(§14.2) reuses an ImageNet-pretrained ResNet as the standard source model for
smaller target datasets.

## Sources

**Dive into Deep Learning** is the evidentiary backbone of this page: the pre-2012
hand-engineered pipeline (d2l §8.1), the data- and hardware-driven account including
ImageNet's scale (d2l §8.1.1), AlexNet's design, its 2012 win and its cost
discussion (d2l §8.1.2–8.1.4), the four fine-tuning steps (d2l §14.2.1), and the
hot-dog worked example with the numbers quoted above (d2l §14.2.2). The three paper
references exist for attribution as named on this page: LeCun et al. for the early
convolutional classifier, Simonyan and Zisserman for VGG, and He et al. for ResNet.
No number on this page rests on those papers directly — every quantitative claim is
taken from d2l's account.

## Prerequisites and next connections

Read [convolutional networks](./convolutional-networks.md) and
[loss functions](./loss-functions.md) first — the pipeline on this page is assembled
from exactly those two, and [LeNet](./lenet.md) is its concrete ancestor.

From here, [transfer learning](./transfer-learning.md) explains the fine-tuning step
this page leans on for small datasets; [VGG](./vgg.md) and [ResNet](./resnet.md)
are the two milestone backbones whose pages this one cites;
[regularization](./regularization.md) is the standard tool for the small-data
overfitting risk; and the [vision transformer](./vision-transformer.md) is the
non-convolutional alternative that solves this very task without a single
convolution. With $C = 2$, the [logistic regression](./logistic-regression.md) page
is the head in isolation.
