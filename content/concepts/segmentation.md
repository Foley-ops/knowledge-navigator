---
concept_id: concept.vision.segmentation
title: Segmentation
slug: /concepts/segmentation
aliases:
  - semantic segmentation
  - dense prediction
  - pixel-level segmentation
kind: problem
tier: 1
review_state: generated-draft
summary: The image task that assigns every pixel of an image its own label from a shared closed vocabulary — dense prediction whose output is one-to-one with the input in space, and whose standard implementation (a fully convolutional network) upsamples a low-resolution feature map back to input resolution.
categories:
  - Artificial Intelligence/Domains/Computer Vision
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Domains/Computer Vision
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_layer
    note: Transposed convolution is defined only relative to the convolutional layer (its kernel, stride, padding, and channels), and d2l §14.10.3's matrix-transpose reading depends on the same convolution, so this page is unreadable without that layer.
  - type: requires
    target: concept.deep_learning.convolutional_networks
    note: A fully convolutional network is a convolutional network with a transposed-convolution tail, and the FCN on this page is built on a ResNet-18 backbone, so the convolutional-network page must come first.
  - type: contrasts_with
    target: concept.deep_learning.pooling
    note: Regular convolutional and pooling layers downsample spatial dimensions, while transposed convolution upsamples them; the two are opposite-direction spatial operators that the FCN needs in sequence.
  - type: useful_when
    target: concept.learning.transfer_learning
    note: The FCN on this page takes a ResNet-18 pretrained on ImageNet and drops its head — the exact standard pattern the transfer-learning page describes — so that page explains why the choice works at all.
  - type: useful_when
    target: concept.deep_learning.resnet
    note: d2l uses the ResNet-18 model pretrained on ImageNet as the FCN's feature backbone, making ResNet the concrete backbone this page leans on.
  - type: requires
    target: concept.deep_learning.loss_functions
    note: Training minimises the per-pixel cross-entropy between each output pixel's class distribution and its label, so the loss and its reduction have to be meaningful before the training recipe on this page makes sense.
  - type: generalizes
    target: concept.vision.classification
    note: Classification assigns one closed-vocabulary label per image; segmentation generalises that one verdict to one per pixel, which is the extension the chapter draws.
  - type: contrasts_with
    target: concept.vision.detection
    note: Detection reports a rectangle per object; segmentation reports a label per pixel, so the region is represented exactly rather than approximated by a box.
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
  - source_id: source.he2016.deep_residual_learning
    title: Deep Residual Learning for Image Recognition
    url: https://arxiv.org/abs/1512.03385
    source_kind: preprint
    supports:
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-24
unresolved_references:
  - label: U-Net
    reason: U-Net is named in variants-and-alternatives and prerequisites-and-next-connections as the encoder-decoder design the medical-imaging side of the task points to, but no page in the corpus explains the architecture and d2l does not develop it here, so it is written as plain text.
    sections:
      - variants-and-alternatives
    blocking: false
    proposed_kind: method
    proposed_categories:
      - Artificial Intelligence/Domains/Computer Vision
  - label: Mask R-CNN
    reason: d2l names the "mask R-CNN" at §14.8.5 (a Faster R-CNN variant that adds a pixel-level fully convolutional network); this page names it as the detection-side bridge to instance segmentation but does not describe it, and no page in the corpus covers it.
    sections:
      - variants-and-alternatives
      - uses-and-applicability
    blocking: false
    proposed_kind: method
    proposed_categories:
      - Artificial Intelligence/Domains/Computer Vision
  - label: Panoptic segmentation
    reason: d2l distinguishes semantic, image, and instance segmentation at §14.9.1 but does not name or develop panoptic segmentation; this page mentions it only as plain text in the variants list, not as a fact supported by the chapter.
    sections:
      - variants-and-alternatives
    blocking: false
    proposed_kind: method
    proposed_categories:
      - Artificial Intelligence/Domains/Computer Vision
claims:
  - claim_id: claim.segmentation.semantic_def
    section: definition
    statement: "Semantic segmentation recognises and understands what is in an image at the pixel level by dividing the image into regions belonging to different semantic classes; its labelling and prediction of semantic regions are in pixel level, and the labelled borders of the dog, cat and background are obviously more fine-grained than in object detection."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.9 opening, and Fig. 14.9.1
  - claim_id: claim.segmentation.three_variants
    section: variants-and-alternatives
    statement: "There are three tasks in the computer-vision literature around segmentation: image segmentation divides an image into several constituent regions using only the correlation between pixels (no label information at training time, and the resulting regions are not guaranteed to carry the desired semantics at prediction time); instance segmentation, also called simultaneous detection and segmentation, recognises the pixel-level regions of each object instance and must distinguish not only semantics but individual instances; and semantic segmentation, as defined above."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.9.1, Image Segmentation and Instance Segmentation, and the Fig. 14.9.1 dog-splitting example (mouth-and-eyes region versus the rest of the body)
  - claim_id: claim.segmentation.voc_dataset
    section: concrete-example
    statement: "The Pascal VOC2012 dataset is one of the most important semantic-segmentation datasets; its input images are stored in JPEGImages and its per-example labels in SegmentationClass as PNG images of the same size as the input, with a label colour per semantic class (white for borders, black for background); the training list is 1114 examples and the validation list 1078."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.9.2 and the reading block of d2l §14.11.3 (\"read 1114 examples\" and \"read 1078 examples\")
  - claim_id: claim.segmentation.tconv_broadcast
    section: formal-treatment
    statement: "For a n_h × n_w input and a k_h × k_w kernel at stride 1 with no padding, transposed convolution produces intermediate (n_h + k_h − 1) × (n_w + k_w − 1) zero-initialised tensors, one per input element; the position of the input element dictates where the kernel's k_h × k_w tensor is added into the intermediate tensor; all intermediates are summed to form the output. In contrast to regular convolution, which reduces input elements via the kernel, transposed convolution broadcasts input elements via the kernel, thereby producing a larger-than-input output."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.10.4, Summary, and §14.10.1, Basic Operation
  - claim_id: claim.segmentation.tconv_shape
    section: concrete-example
    statement: "For stride s, padding s/2 (assuming s/2 is an integer), and kernel height and width of 2s, a transposed convolution layer increases the height and width of the input by a factor of s."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.11.1, The Model, and the derivation (320−64+16×2+32)/32 = 10 and (480−64+16×2+32)/32 = 15
  - claim_id: claim.segmentation.tconv_matrix
    section: formal-treatment
    statement: "When a convolution is written as a matrix multiplication y = Wx, its backpropagation is y' = W^T · (·) by the chain rule; a transposed-convolution layer therefore exchanges the forward and backward functions of a convolutional layer, so its forward is multiplication by W^T and its backward by W."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.10.3, Connection to Matrix Transposition, and §14.10.4, Summary
  - claim_id: claim.segmentation.bilinear
    section: concrete-example
    statement: "Bilinear upsampling, as used to initialise a transposed-convolution layer in a fully convolutional network, computes each output pixel at coordinate (x, y) by mapping (x, y) to a real-valued coordinate (x', y') on the input image according to the ratio of the input size to the output size, taking the four closest input pixels, and weighting them by their relative distance to (x', y'). A stride-2, padding-1, kernel-4 transposed convolution initialised this way doubles the height and width of an image."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.11.2, Initializing Transposed Convolutional Layers, and the catdog example (torch.Size([561, 728, 3]) in and torch.Size([1122, 1456, 3]) out)
  - claim_id: claim.segmentation.fcn_model
    section: concrete-example
    statement: "The fully convolutional network used on Pascal VOC2012 is a ResNet-18 pretrained on ImageNet, with its final global-average-pooling and fully-connected layers removed: the remaining layers reduce the 320 × 480 input to a 512 × 10 × 15 feature map; a 1 × 1 convolution maps those 512 channels to 21 (one per semantic class); and a transposed convolution with kernel 64, padding 16, stride 32 restores the height and width to the input's 320 × 480, so each output pixel is one-to-one with the input pixel at the same spatial position."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.11.1, The Model (net = nn.Sequential(*list(pretrained_net.children())[:-2]), final_conv, and transpose_conv)
  - claim_id: claim.segmentation.fcn_training
    section: concrete-example
    statement: "The FCN is trained for 5 epochs with SGD at learning rate 0.001 and weight decay 1e-3, using a per-pixel cross-entropy loss with reduction='none' averaged over the spatial dimensions; d2l reports the last epoch at loss 0.449, train accuracy 0.861, and test accuracy 0.852."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.11.4, Training, and the d2l.train_ch13 call
  - claim_id: claim.segmentation.fcn_attr
    section: variants-and-alternatives
    statement: "The fully convolutional network (FCN) is attributed by the chapter to Long et al., 2015, and the transposed convolution used by it is also called fractionally-strided convolution, attributed to Dumoulin and Visin, 2016."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.11, opening paragraph (Long et al., 2015), and §14.10, opening paragraph (Dumoulin and Visin, 2016)
  - claim_id: claim.segmentation.fcn_backbone
    section: variants-and-alternatives
    statement: "The FCN on this page uses a ResNet-18 model pretrained on the ImageNet dataset as its feature backbone, retaining all pretrained layers except the final global-average-pooling layer and the fully-connected layer (d2l §14.11.1); the underlying ResNet-18 work is the He et al. 2016 design, per the extra-source entry."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: d2l §14.11.1, The Model — "we use a ResNet-18 model pretrained on the ImageNet dataset to extract image features"
      - source_id: source.he2016.deep_residual_learning
        locator: "naming/authorship per the extra source entry; the chapter itself names the architecture but not the author."
---

## Definition

Image segmentation is the task of assigning each pixel of an image a class label from a shared closed vocabulary, so the output is a **per-pixel map** whose shape matches the input image exactly. d2l frames it that way at §14.9: semantic segmentation "recognizes and understands what are in images in pixel level", and its "labeling and prediction of semantic regions are in pixel level". The chapter contrasts that with object detection, which only puts a rectangle on each object, and with classification, which puts one label on the whole image; the label in a segmentation output is the fine-grain one, and Fig. 14.9.1 of the dog-and-cat example makes the contrast visible: the segmentation label shows the exact boundary of the dog, the cat, and the background, rather than two boxes.

In the vocabulary of the deep-learning literature this is a form of **dense prediction**: one verdict per spatial unit. The rest of the page exists to make that dense verdict trainable — namely, to explain why a backbone that compresses the image into a small feature map has to be undone spatially (upsampling), and to give one concrete architecture — the fully convolutional network (FCN) — that does it.

## Why it matters

Classification is one label per image; detection is a rectangle per object. Both answers are coarse in *spatial* terms. If the answer has to name which pixels belong to which semantic class — for a surgical robot that needs an organ boundary, for an autonomous vehicle that needs the drivable-road mask, for a medical-image triage system that needs the tumour outline — boxes and whole-image verdicts stop carrying the information you need. d2l's own §14.9.4 exercises name exactly these two: "autonomous vehicles and medical image diagnostics".

The task is dense not because the data is dense in some abstract sense, but because the decision is. A pixel-level answer has to say *which pixel, which class*, and it has to do so for every pixel at once. That is a different question from "what is this image about?".

## Intuition

The backbone is a funnel. Convolutional layers and pooling layers compress the spatial extent of the input to build rich features, and in a classifier that is the whole point — you want a compact, per-image feature vector. But in a segmentation task that compression is in the way: the decision must be made at a *specific* position, and the pixel that a feature in a 10 × 15 map corresponds to is not the same pixel as the one in the original 320 × 480 image.

The trick is to let the network do two opposite spatial operations in sequence. The backbone compresses, and a second set of layers (the upsampler) stretches back out to the input's shape. Once the output is the same size as the input and has one channel per class, the last step — take the argmax over channels at each pixel — is trivial, and the network's per-pixel output is the segmentation.

That is the intuition that makes the FCN readable: same backbone as a classifier, plus a tail that *undoes* the down-sampling. The rest of the machinery is the question of what that tail should be, and d2l's answer is a **transposed convolution**.

## Concrete example

Worked numbers from d2l §14.11.

- **Input shape.** The chapter's FCN example starts from an image of 320 × 480 and 3 channels: `X = torch.rand(size=(1, 3, 320, 480))`.
- **After the backbone.** ResNet-18 (with its last two layers removed) reduces the height and width by a factor of 32: `net(X).shape` is `torch.Size([1, 512, 10, 15])` — 10 × 15 because 320/32 = 10 and 480/32 = 15 (d2l §14.11.1).
- **Class head.** A $1 \times 1$ convolution maps the 512 channels to 21 (the number of classes in Pascal VOC2012): `nn.Conv2d(512, 21, kernel_size=1)`.
- **Spatial restoration.** A transposed convolution with kernel 64, padding 16, stride 32 restores the height and width to 320 × 480: `nn.ConvTranspose2d(21, 21, kernel_size=64, padding=16, stride=32)`.
- **Training.** `optimizer = torch.optim.SGD(net.parameters(), lr=0.001, weight_decay=1e-3)` trained for 5 epochs; d2l reports the last recorded epoch as `loss 0.449, train acc 0.861, test acc 0.852` (d2l §14.11.4).
- **Loss.** `F.cross_entropy(inputs, targets, reduction='none').mean(1).mean(1)` — the mean over the two spatial dimensions, then over the batch (d2l §14.11.4).
- **Bilinear upsampling of a real image.** A stride-2, kernel-4 transposed convolution initialised with the `bilinear_kernel` doubles a 561 × 728 × 3 image to 1122 × 1456 × 3 (d2l §14.11.2, catdog example).

A small transposed-convolution arithmetic check, for the §14.10.1 worked 2 × 2 example (input `X = [[0,1],[2,3]]`, kernel `K = [[0,1],[2,3]]`, stride 1, no padding):

```python
import torch
from torch import nn

X = torch.tensor([[0.0, 1.0], [2.0, 3.0]]).reshape(1, 1, 2, 2)
K = torch.tensor([[0.0, 1.0], [2.0, 3.0]]).reshape(1, 1, 2, 2)

layer = nn.ConvTranspose2d(1, 1, kernel_size=2, bias=False)
layer.weight.data = K
print(layer(X))
# tensor([[[[ 0.,  0.,  1.],
#           [ 0.,  4.,  6.],
#           [ 4., 12.,  9.]]]])
```

Every input element is "broadcast" through the kernel into the zero-initialised intermediate, and the intermediates are summed (d2l §14.10.1). A $2 \times 2$ input becomes a $3 \times 3$ output: $2 + 2 - 1 = 3$.

## Formal treatment

**Dense prediction.** Let $x \in \mathbb{R}^{3 \times H \times W}$ be an image with $C$ classes. A segmentation network $f$ produces $y \in \mathbb{R}^{C \times H \times W}$ (one class-channel per pixel), and the predicted class at each pixel is $\hat{c}_{i,j} = \arg\max_c y_{c, i, j}$ (d2l §14.9, §14.11).

**Transposed convolution.** (d2l §14.10, §14.10.1) For a $n_h \times n_w$ input and a $k_h \times k_w$ kernel at stride 1 with no padding, transposed convolution produces $(n_h + k_h - 1) \times (n_w + k_w - 1)$ output. Concretely: zero-initialise a tensor $Y \in \mathbb{R}^{(n_h+k_h-1) \times (n_w+k_w-1)}$, then for each input element $X[i, j]$, add $X[i, j] \cdot K$ to $Y[i : i+k_h, j : j+k_w]$. In contrast to regular convolution, which *reduces* input elements via the kernel, transposed convolution *broadcasts* input elements via the kernel.

**Upsampling rule.** (d2l §14.11.1) For a transposed convolution with stride $s$, padding $s/2$ (where $s/2$ is an integer), and kernel of size $2s \times 2s$, the output height and width are $s$ times the input's. For stride 2, kernel 2, padding 0 the output is $2 \times 2$ the input; for stride 32, kernel 64, padding 16 the output is $32 \times 32$ the input.

**Matrix-transpose reading.** (d2l §14.10.3) A convolutional layer with weight matrix $W$ has forward $y = W x$ and backward $x \mapsto W^\top y$ by the chain rule. A transposed-convolution layer exchanges the two: its forward is $y = W^\top x$ and its backward is $x \mapsto W y$. The two are not arbitrary duals; one is the other's gradient.

**FCN as a whole.** (d2l §14.11.1) Given a backbone $f_\theta$ that maps a $3 \times H \times W$ input to a $C_x \times H'/ \times W'$ feature, the FCN is

$$
g(x) = \operatorname{TransposeConv}(U \cdot f_\theta(x))
$$

where $U \in \mathbb{R}^{C \times C_x}$ is the $1 \times 1$ convolution's channel-mixing weight ($C$ the class count) and $U' \in \mathbb{R}^{C \times C}$ is the transposed convolution's channel-preserving weight. The $1 \times 1$ convolution changes channels; the transposed convolution changes shape. The net effect is $g : \mathbb{R}^{3 \times H \times W} \mapsto \mathbb{R}^{C \times H \times W}$.

**Bilinear upsampling as a weight choice.** (d2l §14.11.2) A transposed-convolution layer with the weight tensor constructed by the `bilinear_kernel` function (d2l §14.11.2) reduces to the standard fixed bilinear-interpolation upsampler; using it to initialise the tail is a specific choice, not a requirement.

## Assumptions and requirements

- **A backbone that compresses spatially.** The FCN depends on a feature extractor with the property that, for the input you use, the final feature map's height and width are $s$ times smaller than the input's, for a known stride $s$ (d2l: $s = 32$ for ResNet-18). If the backbone does not have that property, the upsampling rule of §14.11.1 doesn't apply.
- **Per-pixel labels.** The dataset on this page is Pascal VOC2012, whose label is a per-example PNG of the same size as the input, with one colour per class (d2l §14.9.2). Training requires that labelling; a dataset without per-pixel labels cannot train this head.
- **Input resolution compatible with the upsampler.** For the transposed-convolution tail to restore the input's height and width exactly, the input's height and width must be multiples of the stride. d2l's concrete choice is a fixed $320 \times 480$ crop ("both the height and width are divisible by 32") for training (d2l §14.11.3); at prediction time, test images that are not multiples of 32 are handled by cropping regions, running the network on each, and averaging overlapping regions before the argmax (d2l §14.11.5).
- **A loss defined on dense predictions.** The training loss on this page is the per-pixel cross-entropy with `reduction='none'`, averaged over the two spatial dimensions (d2l §14.11.4). The task presumes a loss that can be evaluated on a $C \times H \times W$ prediction; a task with a different output shape (e.g. detection boxes) is a different task.

## Uses and applicability

Reach for segmentation when the answer is a **mask**: a per-pixel classification of every location in the image. d2l lists the two standard applications — "autonomous vehicles" (which roads are drivable, where the pedestrians are) and "medical image diagnostics" (which regions are the tissue of interest) — as its two examples (§14.9.4).

Do not reach for it when a box is the answer: detection is cheaper to evaluate and the standard task when the geometry of the boundary is not important. Do not reach for it when the label set is not shared across the image: instance segmentation (below) is the right task when you need to tell two objects of the same class apart.

## Limitations and common mistakes

- **Confusing the three "segmentations".** d2l explicitly distinguishes three: *image segmentation* (region partition with no labels at training time and no semantic guarantee; e.g. it might split a dog into a "mouth-and-eyes" region and a "rest of body" region), *instance segmentation* (pixel-level per-instance masks, with detection), and *semantic segmentation* (pixel-level per-class masks). They are not interchangeable.
- **Mismapping resolution at inference.** A stride-32 transposed convolution only restores the input's height and width when they are multiples of 32. d2l's remedy is the multiple-crop-and-average strategy at §14.11.5, and a naive "just resize" does not recover the lost spatial correspondence.
- **Treating transposed convolution as the inverse of convolution.** It is not. It is the *weight-transpose*, per the d2l §14.10.3 reading, and its forward pass is the gradient of the standard convolution's forward pass, not its functional inverse. The two operations agree on shape rules only in a restricted family (kernel $s$ × $s$, padding $s/2$, stride 1, or the $2s$ / $s/2$ / $s$ family).
- **Forgetting that the upsampler has to be initialised.** d2l points out that in the FCN, the $1 \times 1$ convolution is Xavier-initialised and the transposed convolution is bilinear-initialised (§14.11.2). A random large-magnitude initialisation of the transposed layers is a real risk in practice.
- **Using the wrong dataset for the task.** Pascal VOC2012 is the canonical reference for *semantic* segmentation (d2l §14.9.2). If you want to distinguish individual instances, you need a per-instance labelling regime (e.g. the COCO mask annotations); the same weights will not transfer.

## Variants and alternatives

- **Image segmentation.** No labels at training time; the method is allowed to use only the correlation between pixels. The regions it produces are not guaranteed to have the semantics you want.
- **Instance segmentation** (a.k.a. "simultaneous detection and segmentation"). Pixel-level masks for each instance of an object, with individual-instance identity. d2l names it at §14.9.1. The detection page in this corpus names the **mask R-CNN** (d2l §14.8.5) as the concrete architecture that adds a pixel-level fully convolutional network to the Faster R-CNN design — the natural bridge to instance segmentation. Author and year are not in the chapter and are not cited here.
- **Panoptic segmentation** (named for orientation only). The combination of segmenting the "stuff" (semantic background) and "things" (instances) in one task. d2l does not develop this as a named task.
- **Fully convolutional networks** (Long et al., 2015). The specific construction in which a convolutional backbone's features are channel-reduced and then upsolved back to input resolution via transposed convolutions, is the architecture used as the worked example on this page.
- **U-Net**. Named only as plain text here — d2l's §14.9.4 medical-imaging exercise points to this kind of task but the chapter does not develop the architecture; no page in the corpus covers it.
- **Choice of upsampler.** Transposed convolution (learnable) and bilinear interpolation (fixed) are the two standard choices on this page; a transposed convolution initialised with the bilinear kernel (d2l §14.11.2) is a hybrid — learnable shape, fixed initialisation.
- **Backbone.** d2l uses ResNet-18 pretrained on ImageNet (d2l §14.11.1). Any backbone that ends at a known, uniform spatial down-sampling factor in $H$ and $W$ will do, and a vision-transformer backbone is the non-convolutional variant, provided it also ends at a uniform spatial resolution.

## History and attribution

The page's evidentiary backbone is d2l's Chapter 14 on computer vision (§14.8.5 summary carries over from the R-CNN section into §14.9, and §14.10, §14.11 cover the specific machinery). The attribution trail d2l gives:

- **Transposed convolution** in its modern form is credited to Dumoulin and Visin (2016) by d2l §14.10, as "fractionally-strided convolution". The underlying operation — the chain-rule relation between convolution and its transposed form — is older; d2l names this attribution at §14.10.3.
- **The fully convolutional network** is attributed to Long et al. (2015) by d2l §14.11. The construction is the standard FCN in that paper.
- **The ResNet backbone** used by the FCN is the He et al. 2016 design (see Sources), and its use as an ImageNet-pretrained starting point is d2l §14.11.1's `pretrained_net = torchvision.models.resnet18(pretrained=True)`.
- The **Pascal VOC2012** dataset is the standard reference dataset for this task, per d2l §14.9.2.
- The instance-segmentation side (for contrast) is attributed by the d2l §14.8.5 summary to the "mask R-CNN", described as adding a fully convolutional network on top of Faster R-CNN. The paper's author and year are not in the chapter and are not cited here.

No quantitative or algorithmic claim on this page rests on the papers directly; every fact is quoted from d2l's account.

## Sources

- **Dive into Deep Learning** (Zhang, Lipton, Li, Smola) — https://d2l.ai — `source.zhang2023.d2l` — `authoritative-secondary`. The evidentiary backbone of this page: the task definitions for semantic, image and instance segmentation (§14.9, §14.9.1), the Pascal VOC2012 labelling convention (§14.9.2), the transposed-convolution arithmetic, the padding/stride rules, and the matrix-transpose reading (§14.10.1, §14.10.2, §14.10.3, §14.10.4), and the FCN's model, bilinear initialisation, dataset split, training loop, and prediction strategy (§14.11.1, §14.11.2, §14.11.3, §14.11.4, §14.11.5).
- **Deep Residual Learning for Image Recognition** (He et al.) — https://arxiv.org/abs/1512.03385 — `source.he2016.deep_residual_learning` — `preprint`. Cited on this page **only for the ResNet-18 backbone** that d2l uses as the FCN's feature extractor (`pretrained_net = torchvision.models.resnet18(pretrained=True)`, d2l §14.11.1). The d2l chapter names the architecture but not this author/year pair; the attribution is supplied by the Extra source entry, not by the chapter.

## Prerequisites and next connections

Read [convolutional networks](./convolutional-networks.md) first — the FCN is a convolutional network with a transposed-convolution tail, and the page is unreadable without knowing what a [convolutional layer](./convolutional-layer.md) does. Read [pooling](./pooling.md) before the upsampling side, because transposed convolution is its opposite-direction sibling in the chapter's account: both change spatial dimensions, and only one of them grows them.

Read [loss functions](./loss-functions.md) before the training recipe, because the per-pixel cross-entropy with `reduction='none'` at d2l §14.11.4 is a loss-function construction, not something this page defines.

[Transfer learning](./transfer-learning.md) is the pattern d2l §14.11.1 relies on for the ResNet-18 starting point: a pretrained backbone is the standard input, and the fine-tuning recipe is the standard training. [ResNet](./resnet.md) is the concrete backbone this page relies on in the FCN on the page.

[Mask R-CNN](./detection.md) (d2l §14.8.5; author and year not in the chapter, not cited here) is the concrete architecture on the detection side that adds a per-pixel fully convolutional network to Faster R-CNN — the natural bridge from the detection task in this corpus to instance segmentation. **U-Net** (named only as plain text here; the chapter does not develop the architecture and the corpus has no page for it) is the encoder-decoder design the medical-imaging side of the task points to.

From detection in this corpus, [classification](./classification.md) is the task that segmentation generalises, and [detection](./detection.md) is the task whose per-object box segmentation replaces. The d2l lineage (R-CNN, Fast R-CNN, Faster R-CNN, Mask R-CNN) is the one this corpus already traces on the detection side.
