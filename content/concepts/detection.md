---
concept_id: concept.vision.detection
title: Object Detection
slug: /concepts/detection
aliases:
  - Object detection
kind: problem
tier: 1
review_state: generated-draft
summary: A computer-vision task that recognises and localises every object of interest in an image, producing one entry per object with a label, a position, and a score, extending image classification with geometry.
categories:
  - Artificial Intelligence/Domains/Computer Vision
  - Artificial Intelligence/Deep Learning — Architectures
primary_category: Artificial Intelligence/Domains/Computer Vision
relationships:
  - type: requires
    target: concept.deep_learning.convolutional_networks
    note: The region-based detectors on this page are built on a convolutional network used as a shared feature backbone, and the page is unreadable without knowing what one computes.
  - type: requires
    target: concept.deep_learning.pooling
    note: The region-of-interest (RoI) pooling layer in Fast R-CNN generalizes ordinary pooling by specifying the output shape directly rather than the pooling window, padding, and stride, so the simpler layer has to come first.
  - type: requires
    target: concept.deep_learning.loss_functions
    note: Fast R-CNN and Faster R-CNN are trained by end-to-end losses over the class and box offset predictions, and the R-CNN's SVM and linear-regression heads are loss-supervised as well; the page describes what the losses act on but does not define what a loss function is.
  - type: useful_when
    target: concept.learning.transfer_learning
    note: The R-CNN line takes a pretrained CNN, truncates it before the output layer, and feeds it per-region or whole-image features, which is the standard transfer-learning pattern the chapter describes and the page relies on.
  - type: useful_when
    target: concept.deep_learning.resnet
    note: A ResNet backbone is a common feature extractor the chapter does not name on this page but is the standard choice in practice wherever a CNN backbone is needed for object detection.
  - type: generalizes
    target: concept.vision.classification
    note: Classification recognises a single major object in an image; detection extends the same recognition to multiple objects and adds their positions, which is exactly the generalization d2l §14.3 draws.
  - type: prerequisite_of
    target: concept.vision.segmentation
    note: Mask R-CNN extends a two-stage detector with a per-region mask head, which is where detection hands off to instance segmentation.
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
  - source_id: source.ren2015.faster_rcnn
    title: 'Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks'
    url: https://arxiv.org/abs/1506.01497
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
      - assumptions-and-requirements
      - history-and-attribution
    checked_on: 2026-09-24
unresolved_references:
  - label: Selective search
    reason: d2l §14.8.1–14.8.2 describe the region-proposal stage of R-CNN and Fast R-CNN as selective search (Uijlings et al., 2013), and the page cannot explain that stage without naming the technique.
    sections:
      - variants-and-alternatives
      - history-and-attribution
    blocking: false
    proposed_kind: method
    proposed_categories:
      - Artificial Intelligence/Domains/Computer Vision
  - label: Softmax regression
    reason: d2l §14.8.2 step 4 says the Fast R-CNN class head uses softmax regression; the page names the head and the mechanism but does not define it.
    sections:
      - formal-treatment
    blocking: false
    proposed_kind: method
    proposed_categories:
      - Artificial Intelligence/Classical Machine Learning
claims:
  - claim_id: claim.detection.task_def
    section: definition
    statement: 'Object detection is the computer-vision task of recognizing all the objects of interest in an image and reporting their positions, generally as a rectangular bounding box per object, which extends image classification by adding localization.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.3 and the §14.3.2 summary: classification assumes a single major object, detection adds positions of multiple objects.'
  - claim_id: claim.detection.box_repr
    section: definition
    statement: 'A bounding box has a corner representation — the (x, y) coordinates of its upper-left and lower-right corners — and a center-width-height representation — the center coordinates plus width and height — and the two are invertible.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.3.1, the box_corner_to_center and box_center_to_corner functions.'
  - claim_id: claim.detection.anchor_formula
    section: formal-treatment
    statement: 'With n scales and m aspect ratios, each pixel center yields n + m − 1 anchor boxes, and the whole image yields w·h·(n + m − 1) anchors, where w and h are the image width and height in the coordinate frame used.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.4.1, Eq. 14.4.1 and the multibox_prior function.'
  - claim_id: claim.detection.iou
    section: formal-treatment
    statement: 'The IoU of two boxes is the Jaccard index of their pixel sets — the intersection area divided by the union area — and ranges from 0 (disjoint) to 1 (identical).'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.4.2, Eq. 14.4.2, Fig. 14.4.1, and the box_iou function.'
  - claim_id: claim.detection.label_assignment
    section: formal-treatment
    statement: 'Anchor boxes are assigned to ground-truth boxes by iteratively taking the largest IoU pair, assigning the ground-truth box to the anchor box, discarding the matching row and column of the IoU matrix, and repeating until all ground-truth boxes are assigned; any unassigned anchor with IoU above the threshold is labelled against its best-matching ground truth.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.4.3, the four-step greedy algorithm and Fig. 14.4.2, with the assign_anchor_to_bbox function.'
  - claim_id: claim.detection.offset_encoding
    section: formal-treatment
    statement: 'The offset label for an anchor is ( ((xb−xa)/wa − μx)/σx, ((yb−ya)/ha − μy)/σy, (log(wb/wa) − μw)/σw, (log(hb/ha) − μh)/σh ), with defaults μx = μy = μw = μh = 0, σx = σy = 0.1 and σw = σh = 0.2, so the network regresses a small normalised offset rather than absolute box coordinates.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.4.3, Eq. 14.4.3 and the offset_boxes function.'
  - claim_id: claim.detection.nms
    section: formal-treatment
    statement: 'Non-maximum suppression repeatedly takes the highest-confidence remaining predicted box and drops every other predicted box whose IoU with it exceeds the threshold ε, until no two surviving boxes exceed the threshold with each other.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.4.4, the four-step NMS description and the nms function.'
  - claim_id: claim.detection.rcnn_bottleneck
    section: variants-and-alternatives
    statement: "R-CNN's four steps run selective search, then per-region CNN forward passes, then per-class SVMs and a linear-regression box head; thousands of region proposals force thousands of CNN forward propagations, which the chapter names as the reason it is slow."
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.8.1, Fig. 14.8.1, the four-step R-CNN description, and the sentence attributing the cost to thousands of independent forward propagations.'
  - claim_id: claim.detection.roi_pool
    section: variants-and-alternatives
    statement: 'Fast R-CNN runs the CNN once on the whole image, marks each of n region proposals as a region of interest on the CNN output, and uses a RoI pooling layer that divides each region into an h2 × w2 grid of subwindows taking the max of each to produce a fixed-shape n × c × h2 × w2 tensor for every proposal regardless of its original shape.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.8.2, steps 1–4, Fig. 14.8.2, Fig. 14.8.3, and the worked 4 × 4 → 2 × 2 RoI pooling example with the two regions of interest X[:, :, 0:3, 0:3] and X[:, :, 1:4, 0:4].'
  - claim_id: claim.detection.rpn
    section: variants-and-alternatives
    statement: 'Faster R-CNN replaces selective search with a region proposal network that predicts, for each anchor on the CNN feature map, a binary object-or-background call and a box offset, and keeps the resulting boxes through NMS as the region proposals; the RPN is jointly trained with the rest of the model so its region-proposal objective is part of the end-to-end loss.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.8.3, the four-step RPN description, the note on joint end-to-end training, and Fig. 14.8.4.'
  - claim_id: claim.detection.mask_rcnn
    section: variants-and-alternatives
    statement: 'Mask R-CNN is Faster R-CNN with the RoI pooling layer replaced by a RoI alignment layer using bilinear interpolation, plus an additional fully convolutional network head that predicts per-pixel object positions from the same feature maps.'
    status: supported
    evidence:
      - source_id: source.zhang2023.d2l
        locator: 'd2l §14.8.4, the RoI alignment description and the additional fully-convolutional mask head, Fig. 14.8.5.'
---

## Definition

Object detection is a computer-vision task that recognises every object of interest in an image and reports its position (d2l §14.3). Its output is a list of predictions, one per detected object, each carrying a class label, a spatial location, and a confidence score. The standard spatial encoding is a **bounding box**: a rectangle in image coordinates either in "corner" form (upper-left $x_1, y_1$, lower-right $x_2, y_2$) or in "center-width-height" form (center $x_c, y_c$ and size $w, h$); the two parameterizations are invertible (d2l §14.3.1).

Image classification is one object, one label. Detection is _many_ objects, each with a _where_ in addition to a _what_. The "where" is what separates the two tasks, and the rest of the page — anchors, IoU, offsets, NMS, and the region-based detectors — exists to make "where" something a differentiable network can learn.

## Why it matters

A classifier is blind to geometry: a rotated, scaled, partially occluded, or crowded object is fine so long as the class is the same. That blindness is acceptable when the answer is a single label, and it is useless when the answer is a set of positioned objects. Autonomous vehicles, manipulation robots, and surveillance systems all need "what _and where_" rather than "what" (d2l §14.3). Detection turns vision into a planning signal; classification only gives you a caption.

## Intuition

Anchors make "where" learnable. Instead of letting the network draw a box from nothing, pre-place a fixed set of boxes — **anchor boxes** — at known centers across the image and let the network predict only the _offset_ from each anchor to the true box (d2l §14.4). The residual is small and normalised, which is what makes the regression well-conditioned.

IoU is the yardstick. It is the Jaccard index of the two boxes treated as pixel sets — the intersection area over the union area. It is 0 for disjoint boxes and 1 for identical boxes, and the rest of the pipeline reuses it three times: to decide which anchor matches which ground-truth box, to decide how much the anchor should move, and to decide which predictions to keep after NMS (d2l §14.4.2).

The picture breaks in one predictable place: two distinct objects of the same class that heavily overlap each other will suppress each other under NMS, and one of them disappears from the output. NMS is a de-duplication pass, not a separation pass, and dense, touching instances of the same class defeat it.

## Concrete example

Take the two worked boxes from the chapter:

- Dog: $[60,\ 45,\ 378,\ 516]$
- Cat: $[400,\ 112,\ 655,\ 493]$

In center-width-height form the dog is $[219,\ 280.5,\ 318,\ 471]$ and the cat is $[527.5,\ 302.5,\ 255,\ 381]$; converting back recovers the corner form exactly (d2l §14.3.1).

For a $40\times 40$ anchor with aspect ratio 1, the width is $40\cdot 1\cdot\sqrt{1} = 40$ and the height is $40\cdot 1/\sqrt{1} = 40$, so the anchor is a $40\times 40$ square centered on the pixel (d2l §14.4.1).

For IoU, let $A = [0, 0, 10, 10]$ and $B = [5, 5, 15, 15]$. The intersection is $[5, 5, 10, 10]$ with area $25$; the union is $[0, 0, 15, 15]$ with area $225$. The IoU is $25 / 225 = 0.111\ldots$. Two boxes that only share a corner touch at a single point with intersection area $0$, so IoU is $0$ exactly.

For RoI pooling, the chapter's example takes a $4\times 4$ feature map $X = \texttt{torch.arange(16)}$ as the only channel and two regions of interest with image-space boxes $[0, 0, 20, 20]$ and $[10, 10, 30, 30]$ (d2l §14.8.2). With `spatial_scale = 0.1` those map to $X[:, :, 0:3, 0:3]$ and $X[:, :, 1:4, 0:4]$, and a $2\times 2$ RoI-pooling step returns

```
region 1: [[5, 6],        region 2: [[ 9, 11],
         [9, 10]]                 [13, 15]]
```

where each of the four subwindows takes its maximum element — elements 0, 1, 4, 5 give 5; 2 and 6 give 6; 8 and 9 give 9; and the lone subwindow containing element 10 stays 10 (d2l §14.8.2, Fig. 14.8.3).

Now NMS. Let a detector return three predictions on the same image, and sort by confidence descending: $b_1 = [0, 0, 10, 10]$ (0.9), $b_2 = [5, 5, 15, 15]$ (0.8), $b_3 = [12, 12, 20, 20]$ (0.6), with `iou_threshold = 0.5`.

- Round 1: basis $b_1$, keep. $\text{IoU}(b_1, b_2) = 25/45 = 0.556 > 0.5$, so suppress $b_2$. $\text{IoU}(b_1, b_3) = (8\cdot 8)/(10\cdot 10) = 0.64 > 0.5$, so suppress $b_3$. Remaining: $\{b_1\}$.
- Round 2: only $b_1$ remains.

One prediction survives. Now lower the threshold to `iou_threshold = 0.6`: `IoU(b1, b2) = 0.556 < 0.6`, so keep $b_2$; `IoU(b1, b3) = 0.64 > 0.6`, so still suppress $b_3$. In round 2, $b_2$ and $b_3$ are disjoint, IoU 0, and $b_3$ is now kept. Output $\{b_1, b_3\}$. Two objects of the same class survive because the threshold is looser — and if two _distinct_ objects of the same class genuinely overlap by more than `iou_threshold`, one of them has already been dropped. This is the standard tension.

```python
import torch

def box_iou(boxes1, boxes2):
    a1 = (boxes1[:, 2] - boxes1[:, 0]) * (boxes1[:, 3] - boxes1[:, 1])
    a2 = (boxes2[:, 2] - boxes2[:, 0]) * (boxes2[:, 3] - boxes2[:, 1])
    inter_ul = torch.max(boxes1[:, None, :2], boxes2[:, None, :2])
    inter_lr = torch.min(boxes1[:, None, 2:], boxes2[:, None, 2:])
    inter = (inter_lr - inter_ul).clamp(min=0)
    inter_area = inter[:, :, 0] * inter[:, :, 1]
    union = a1[:, None] + a2[None, :] - inter_area
    return inter_area / union

def nms(boxes, scores, thresh=0.5):
    order = scores.argsort(descending=True)
    keep = []
    while order.numel() > 0:
        i = order[0]
        keep.append(int(i))
        if order.numel() == 1:
            break
        ious = box_iou(boxes[i], boxes[order[1:]]).squeeze(-1)
        order = order[1:][ious <= thresh]
    return keep

b = torch.tensor([[0., 0., 10., 10.],
                  [5., 5., 15., 15.],
                  [12., 12., 20., 20.]])
s = torch.tensor([0.9, 0.8, 0.6])
print(nms(b, s, thresh=0.5))   # [0]      the two lower boxes are inside b1
print(nms(b, s, thresh=0.6))   # [0, 2]   b2 drops out, b3 survives
```

## Formal treatment

For boxes $A$ and $B$ in corner form, the IoU is

$$
\operatorname{IoU}(A, B) \;=\; \frac{\operatorname{area}(A \cap B)}{\operatorname{area}(A \cup B)} ,
$$

with $A\cap B$ and $A\cup B$ taken coordinate-wise; this is the Jaccard index of two finite pixel sets (d2l §14.4.2, Eq. 14.4.2).

Anchor generation (d2l §14.4.1). For an image of height $h$ and width $w$ with $n$ scales $s_1, \dots, s_n \in (0,1]$ and $m$ aspect ratios $r_1, \dots, r_m > 0$, an anchor with scale $s_j$ and ratio $r_k$ has width $wh\, s_j\sqrt{r_k}/w$ and height $wh\, s_j/\sqrt{r_k}\cdot(1/w)$ — the chapter expresses this as $wh\,s_j\sqrt{r_k}/w$ and $wh\,s_j/\sqrt{r_k}/w$ under the convention that $h = w$ is the image's pixel height and width — and the number of anchors per pixel is $n + m - 1$ under the "combinations containing $s_1$ or $r_1$" rule of Eq. 14.4.1.

Labeling (d2l §14.4.3). Given $n_a$ anchor boxes $A_1, \dots, A_{n_a}$ and $n_b$ ground-truth boxes $B_1, \dots, B_{n_b}$ with $n_a \ge n_b$, build the matrix $X \in \mathbb{R}^{n_a\times n_b}$ with $x_{ij} = \operatorname{IoU}(A_i, B_j)$. Greedily assign the largest remaining $x_{ij}$ to that pair and remove row $i$ and column $j$; when the $n_b$ ground-truth boxes are all matched, any remaining anchor with $\max_j x_{ij} \ge \varepsilon$ inherits the label of its best-matching ground truth.

Offset encoding. For an anchor $A$ with center $(x_a, y_a)$ and size $(w_a, h_a)$ and its labelled ground truth $B$ with center $(x_b, y_b)$ and size $(w_b, h_b)$, the stored target is the normalised offset

$$
\left( \frac{\frac{x_b - x_a}{w_a} - \mu_x}{\sigma_x},\;
       \frac{\frac{y_b - y_a}{h_a} - \mu_y}{\sigma_y},\;
       \frac{\log \frac{w_b}{w_a} - \mu_w}{\sigma_w},\;
       \frac{\log \frac{h_b}{h_a} - \mu_h}{\sigma_h} \right),
$$

with defaults $\mu_x = \mu_y = \mu_w = \mu_h = 0$, $\sigma_x = \sigma_y = 0.1$, $\sigma_w = \sigma_h = 0.2$ (d2l §14.4.3, Eq. 14.4.3). At prediction time the predicted offsets are inverted to recover the box (d2l §14.4.4, `offset_inverse`).

NMS. For a predicted box $B$, let $p$ be the largest predicted class likelihood and call $p$ the **confidence** of $B$ (d2l §14.4.4). Sort all non-background predictions by confidence descending into a list $L$. Repeatedly: pop the top box $B_k$, remove it from $L$, and delete every other remaining box whose IoU with $B_k$ exceeds the threshold $\varepsilon$. When $L$ is empty, the output is the kept boxes, and every surviving pair has IoU below $\varepsilon$ with each other.

## Assumptions and requirements

Detection is a _localised_ task. If you only need a single label per image, classification is cheaper and simpler. If you need per-pixel boundaries rather than rectangles, segmentation is the right frame; a box cannot represent the outline of a thin or elongated object, though Mask R-CNN recovers the outline as a head on top of detection (d2l §14.8.4). The task also presupposes a feature backbone: R-CNN and its descendants all sit on a CNN, and the R-CNN line specifically takes a _pretrained_ CNN and truncates it before the output layer (d2l §14.8.1, step 2), which is the standard transfer-learning pattern the page leans on. A ResNet is a common backbone choice in practice (this specific choice is not made in the chapter's account).

## Uses and applicability

Reach for detection when the answer is a _set_ of positioned, labelled objects: self-driving (vehicles, pedestrians, roads, obstacles), robotics, and security (d2l §14.3). Skip it when the image has one dominant object and the label is the whole answer — classification is enough. Skip it when you need per-pixel boundaries — segmentation is the better frame, and Mask R-CNN is the detection model that adds that boundary head (d2l §14.8.4). Reach for one of the region-based detectors below when you need a well-structured two-stage detector that can be trained end-to-end; reach for a single-shot detector (named on this corpus as SSD, §14.7) when you want to skip the two stages, for which this chapter does not provide specifics.

## Limitations and common mistakes

IoU is a geometric similarity, not a probability. Treating a high IoU as "high confidence of correct class" confuses the two quantities that d2l tracks separately: the confidence is the largest predicted class likelihood over the class head, and IoU is used only for matching and de-duplication (d2l §14.4.4).

Setting the NMS threshold too low drops real, close objects; setting it too high lets duplicate boxes through. Neither choice is free, and dense or touching instances of the same class are exactly the regime where the wrong choice shows up in the output.

RoI pooling rounds subwindow boundaries up to integer positions and takes the max, which quantises the alignment between the region and the feature map. RoI alignment, introduced by Mask R-CNN, fixes this by using bilinear interpolation instead of the round-then-max of the pooling version (d2l §14.8.4); the two look similar and are not the same layer.

The two-stage R-CNN line trades speed for structure: R-CNN's bottleneck is per-region forward passes (d2l §14.8.1), and even Fast R-CNN keeps a separate, non-learnable region-proposal stage from selective search (d2l §14.8.2); Faster R-CNN removes that last external stage by learning the proposals end-to-end (d2l §14.8.3). Each change is about _where the compute goes_, not about what is ultimately computed.

## Variants and alternatives

The region-based lineage the chapter walks:

- **R-CNN** (d2l §14.8.1): 2000 or so region proposals from selective search (Uijlings et al., 2013), a per-region CNN forward pass for each with a pretrained backbone truncated before the output layer, a per-class SVM head, and a linear-regression box head. The chapter's cost objection is that thousands of proposals means thousands of forward passes.
- **Fast R-CNN** (d2l §14.8.2): the CNN runs once on the whole image, the proposals become regions of interest on the CNN output, and a **RoI pooling** layer divides each region into an $h_2 \times w_2$ grid of subwindows (max over each) to yield a fixed-shape $n \times c \times h_2 \times w_2$ tensor; classification is a softmax head and box refinement is a small regression.
- **Faster R-CNN** (d2l §14.8.3): selective search is replaced by a _region proposal network_ — one $3\times3$ conv on the feature map, anchors at each pixel, per-anchor binary (object or not) and box-offset heads, kept through NMS as the proposals — and the RPN is jointly trained with the rest of the model, which the chapter calls end-to-end training.
- **Mask R-CNN** (d2l §14.8.4): Faster R-CNN with RoI pooling replaced by RoI alignment (bilinear interpolation preserves spatial alignment) and an added fully-convolutional head that predicts per-pixel masks from the same feature maps.

The R-CNN → Fast → Faster → Mask progression is about moving each stage of the pipeline _into_ the network: the region-proposal stage, first an external algorithm (R-CNN, Fast R-CNN) then a learned sub-network (Faster R-CNN), and the mask head last (Mask R-CNN). SSD, named in d2l at §14.7 and outside the excerpt, collapses the two stages into a single forward pass and is a genuinely different design choice; the chapter text here does not carry the specifics to support anything further about it, and this page makes no such claims.

## History and attribution

Per the chapter's account, the region-based CNN family is one of the pioneering lines of applying deep learning to object detection (d2l §14.8). The lineage is R-CNN, then Fast R-CNN, then Faster R-CNN, then Mask R-CNN; the chapter attributes the faster R-CNN to Ren et al. (2015) and the mask R-CNN to He et al. (2017) — see He et al.'s "Deep Residual Learning for Image Recognition" (the He et al. 2015 line whose residual backbone is the standard CNN for the R-CNN family) and "Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks" for the two papers the page cites. The specific attributions in this section are the ones printed in d2l §14.8.3 and §14.8.4; they have not been independently verified against the cited papers' text, and the papers here are named for attribution rather than as the basis of any quantitative claim on this page.

## Sources

- **Dive into Deep Learning** (Zhang, Lipton, Li, Smola) — https://d2l.ai — `source.zhang2023.d2l` — `authoritative-secondary`. The evidentiary backbone: task definition and the corner/centre parameterization (§14.3, §14.3.1), the anchor generation and the $n+m-1$ count (§14.4.1, Eq. 14.4.1), the IoU definition and its range (§14.4.2, Eq. 14.4.2), the greedy label-assignment algorithm and Fig. 14.4.2, and the offset target Eq. 14.4.3 (§14.4.3), the NMS rule and the nms function (§14.4.4), and the R-CNN → Fast → Faster → Mask lineage with the RoI pooling worked example (§14.8.1–14.8.4, Figs. 14.8.1–14.8.5). All quantitative claims on this page are taken from this source.
- **Deep Residual Learning for Image Recognition** (He et al.) — https://arxiv.org/abs/1512.03385 — `source.he2016.deep_residual_learning` — `preprint`. Cited on this page for the residual-block backbone the region-based detectors use, which the chapter's account refers to generically as a pretrained CNN.
- **Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks** (Ren et al.) — https://arxiv.org/abs/1506.01497 — `source.ren2015.faster_rcnn` — `preprint`. Cited for the region proposal network the chapter describes in §14.8.3.

Nothing on this page cites a figure or a result directly from He et al. 2016 or Ren et al. 2015; both are named for attribution, and every quantitative claim is d2l's.

## Prerequisites and next connections

Read [convolutional networks](./convolutional-networks.md) first — the R-CNN family sits on one, and its features are what the per-region and per-anchor heads consume. Read [pooling](./pooling.md) before the Fast R-CNN section, because RoI pooling generalizes exactly that layer: instead of specifying the window, padding, and stride, you specify the _output shape_ and the layer works backwards to a grid of subwindows for each region. Read [loss functions](./loss-functions.md) before the training side, because the class head, the box-offset head, and the RPN's binary head are all supervised by losses this page names but does not define here. Read [transfer learning](./transfer-learning.md) before R-CNN's "truncated, pretrained CNN" step, which is the standard pattern that pattern exists to describe. [ResNet](./resnet.md) is a common backbone choice; it is a useful-when on this page rather than a requires, because the chapter names a pretrained CNN generically.

From here, [classification](./classification.md) is the task detection generalizes, and segmentation — the per-pixel-boundary task Mask R-CNN bridges to — is the natural next page and is currently named in plain text on this corpus.
