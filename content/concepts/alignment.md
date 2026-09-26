---
concept_id: concept.ai_frontiers.alignment
title: Alignment
slug: /concepts/alignment
aliases:
  - AI alignment
  - value alignment
kind: problem
tier: 1
review_state: generated-draft
summary: Alignment is the problem of making an AI system pursue what its designers and users actually intend rather than a proxy for it; for today's language models it is mostly addressed by learning from human or AI preference judgements, which improves behaviour without guaranteeing it.
categories:
  - Artificial Intelligence/Other Traditions & Frontiers
primary_category: Artificial Intelligence/Other Traditions & Frontiers
relationships:
  - type: contributes_to
    target: concept.ai_frontiers.ai_safety
    note: A system whose goals match what its operators intend avoids the whole class of accidents that come from optimising a misspecified objective, which makes alignment a central part of safety.
  - type: requires
    target: concept.reinforcement_learning.rlhf
    note: A widely used practical alignment method for language models fits a reward model to human preference comparisons and optimises the model against it, so understanding current alignment practice means understanding that pipeline.
  - type: contrasts_with
    target: concept.reinforcement_learning.inverse_reinforcement_learning
    note: Inverse reinforcement learning infers an objective from demonstrations of good behaviour, while language-model alignment usually learns one from comparisons between outputs, which people can judge even when they could not produce the better output themselves.
sources:
  - source_id: source.ouyang2022.instructgpt
    title: Training language models to follow instructions with human feedback
    url: https://arxiv.org/abs/2203.02155
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - concrete-example
      - formal-treatment
      - assumptions-and-requirements
      - uses-and-applicability
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.bai2022.constitutional_ai
    title: 'Constitutional AI: Harmlessness from AI Feedback'
    url: https://arxiv.org/abs/2212.08073
    source_kind: preprint
    supports:
      - intuition
      - formal-treatment
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-25
  - source_id: source.amodei2016.concrete_problems
    title: Concrete Problems in AI Safety
    url: https://arxiv.org/abs/1606.06565
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - assumptions-and-requirements
    checked_on: 2026-09-25
unresolved_references:
  - label: Wider alignment literature (reward model overoptimisation, direct preference optimisation, deceptive alignment and scalable oversight proposals)
    reason: Measurements of how optimising against a learned reward eventually lowers true quality, preference-optimisation methods without an explicit reward model, and theoretical concerns about misaligned goals in more capable systems are described from sources not in the registry.
    sections:
      - limitations-and-common-mistakes
      - variants-and-alternatives
claims: []
---

## Definition

**Alignment** is the problem of making an AI system try to do what its designers
and users intend. A system is misaligned when it competently pursues something
else — a proxy objective, a literal reading of an instruction, or a goal picked
up in training that happens to agree with the intended one on the training data.
Ouyang and colleagues give a working definition for language models: an aligned
model is **helpful**, following the user's intent; **honest**, not fabricating or
misleading; and **harmless**, not causing physical, psychological or social harm.

## Why it matters

A language model pretrained to predict the next token of internet text is not
trying to be helpful; it is continuing documents. Asked a question, it may
answer, or continue with more questions, or make up a plausible reference.
Ouyang and colleagues call this a misalignment between the training objective and
the objective of following instructions safely. More generally, whenever an
objective is a proxy, a stronger optimiser exploits the gap more; alignment is
the attempt to close it rather than patch its symptoms, and it grows in
importance as systems become more capable and autonomous.

## Intuition

It is hard to write down what a good answer is, but easy to say which of two
answers is better. Current alignment methods exploit that asymmetry. People
compare model outputs; a **reward model** learns to predict their judgements; the
language model is then trained to produce outputs the reward model scores highly.
The model is steered by a learned stand-in for human judgement, not by a
hand-written rule.

Constitutional AI replaces most of the human judges with the model itself. Bai
and colleagues give the model a short list of principles — a **constitution** —
and have it critique and revise its own responses and choose between pairs of
responses according to those principles. The humans' role moves from labelling
thousands of comparisons to writing down the principles.

## Concrete example

A reward model gives response A a score of $r_A = 2.0$ and response B a score of
$r_B = 1.0$. Under the **Bradley–Terry** model it predicts that a person prefers A
with probability

$$
\sigma(r_A - r_B) = \frac{1}{1 + e^{-(2.0 - 1.0)}} \approx 0.731 .
$$

If the labeller did prefer A, the training loss on this comparison is
$-\log 0.731 \approx 0.313$; had they preferred B, it would be
$-\log(1 - 0.731) \approx 1.313$, and the gradient would push $r_B$ up and $r_A$
down. Only the difference of scores matters, so the reward model's scores are
fixed only up to a constant shift, with no absolute zero.

## Formal treatment

The InstructGPT pipeline has three stages. First, **supervised fine-tuning** on
demonstrations written by labellers. Second, a **reward model** $r_\phi(x, y)$
is trained on comparisons, minimising

$$
-\,\mathbb{E}_{(x, y_w, y_l)}\bigl[\log \sigma\bigl(r_\phi(x, y_w) - r_\phi(x, y_l)\bigr)\bigr],
$$

where $y_w$ is the preferred response to prompt $x$. Third, the policy $\pi$ is
optimised with PPO to maximise

$$
\mathbb{E}_{x,\; y \sim \pi(\cdot \mid x)}\Bigl[r_\phi(x, y) - \beta \log \frac{\pi(y \mid x)}{\pi_{\text{SFT}}(y \mid x)}\Bigr],
$$

where the penalty keeps the policy near the fine-tuned model so it cannot drift
into outputs the reward model scores wrongly. Constitutional AI keeps the same
shape but trains the preference model on comparisons labelled by a model
following the constitution — reinforcement learning from AI feedback.

## Assumptions and requirements

- **Judgements that track intent.** Preference data encode what the labellers
  and instructions reward; Ouyang and colleagues stress that the model is aligned
  to them, not to everyone who will use it.
- **A reward model that generalises.** The policy is optimised against the
  reward model on outputs the labellers never saw.
- **A capable base model.** Fine-tuning elicits and shapes abilities the
  pretrained model already has.
- **Proxies can be gamed.** The same caution that applies to hand-written
  rewards applies to learned ones.

## Uses and applicability

Preference-based alignment is how instruction-following assistants are produced
from pretrained language models, and is used to reduce harmful, toxic or
evasive outputs. Ouyang and colleagues found that labellers preferred outputs
from a 1.3-billion-parameter InstructGPT model to those of the 175-billion
GPT-3, so that on labellers' judgements the alignment training outweighed a more
than hundredfold difference in size. Constitutional methods are used where human
labelling is expensive, or where the principles should be explicit and
auditable.

## Limitations and common mistakes

**Aligned to whom.** The target is the preferences of particular labellers,
researchers and written principles, which are not universal values.

**Reward hacking.** Optimising hard against a learned reward model can find
outputs it scores highly that people would not; the KL penalty limits this but
does not remove it.

**Surface compliance.** Training changes behaviour on the kinds of prompts
trained on; it does not show that the model's underlying goals have changed, and
Ouyang and colleagues report that their models still make simple mistakes and
can follow harmful instructions.

**Harmlessness versus helpfulness.** Bai and colleagues note the tension: a
model trained only to avoid harm becomes evasive, refusing reasonable requests.

## Variants and alternatives

- **Reinforcement learning from human feedback** is the three-stage pipeline
  above.
- **Constitutional AI and AI feedback** replace most human labels with a model's
  judgements guided by explicit principles.
- **Direct preference optimisation** fits the policy to comparisons without a
  separate reward model or reinforcement learning step.
- **Scalable oversight proposals** — debate, recursive reward modelling — aim to
  let humans supervise systems on tasks too hard for them to judge directly.
- **Inverse reinforcement learning** infers objectives from demonstrations.

## History and attribution

The worry that a machine may pursue a stated purpose instead of an intended one
is old, and Amodei and colleagues' 2016 paper set out its machine-learning form.
Learning rewards from human comparisons was developed for reinforcement learning
agents in 2017 and applied to fine-tuning language models, including for
summarisation, in 2019 and 2020. Ouyang and colleagues' InstructGPT (2022)
applied it to general instruction following, and Bai and colleagues'
Constitutional AI (2022) trained harmlessness from self-critique and AI feedback
guided by a written constitution.

## Sources

Ouyang and colleagues supply the helpful, honest and harmless definition, the
three-stage pipeline, the reward-model and KL-penalised objectives, the
preference results, and the caveats about whose preferences are learned. Bai and
colleagues supply constitutional training, self-critique, AI feedback and the
helpfulness–harmlessness tension. Amodei and colleagues supply the framing of
misspecified objectives.

## Prerequisites and next connections

Read [RLHF](./rlhf.md) for the preference-learning pipeline, and
[AI Safety](./ai-safety.md) for the broader set of problems alignment belongs
to.

From here, [RLAIF](./rlaif.md) covers learning from AI feedback in detail,
[Inverse Reinforcement Learning](./inverse-reinforcement-learning.md) is the
older route to learning objectives, and
[Mechanistic Interpretability](./mechanistic-interpretability.md) is one way to
check whether alignment training changed what a model is doing internally.
