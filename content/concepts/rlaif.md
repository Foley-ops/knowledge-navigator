---
concept_id: concept.reinforcement_learning.rlaif
title: RLAIF
slug: /concepts/rlaif
aliases:
  - reinforcement learning from AI feedback
kind: method
tier: 1
review_state: generated-draft
summary: A preference-learning recipe in which the comparison labels that train a reward model are produced by a language model reading written principles rather than by paid human annotators.
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: variant_of
    target: concept.reinforcement_learning.rlhf
    note: Every stage is inherited unchanged — pairwise comparisons, a fitted reward model, KL-regularised policy optimisation — and only the source of the comparison labels is swapped.
  - type: requires
    target: concept.reinforcement_learning.ppo
    note: The RL stage of the original recipe is PPO against the fitted preference model, so the clipped surrogate and its KL anchor have to be understood before this page's optimisation step makes sense.
  - type: contrasts_with
    target: concept.reinforcement_learning.inverse_reinforcement_learning
    note: Both recover a reward function rather than being handed one, but inverse RL infers it from demonstrated behaviour while RLAIF reads it off a model's stated judgements about pairs of outputs.
  - type: contrasts_with
    target: concept.deep_learning.distillation
    note: Both move competence from one model into another, but distillation matches a teacher's output distribution directly whereas RLAIF transfers only an ordering over samples the student itself generated.
sources:
  - source_id: source.bai2022.constitutional_ai
    title: 'Constitutional AI: Harmlessness from AI Feedback'
    url: https://arxiv.org/abs/2212.08073
    source_kind: preprint
    supports:
      - definition
      - why-it-matters
      - intuition
      - concrete-example
      - uses-and-applicability
      - limitations-and-common-mistakes
      - variants-and-alternatives
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.ouyang2022.instructgpt
    title: Training language models to follow instructions with human feedback
    url: https://arxiv.org/abs/2203.02155
    source_kind: preprint
    supports:
      - formal-treatment
      - assumptions-and-requirements
      - limitations-and-common-mistakes
      - history-and-attribution
    checked_on: 2026-09-18
  - source_id: source.schulman2017.ppo
    title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/abs/1707.06347
    source_kind: preprint
    supports:
      - formal-treatment
    checked_on: 2026-09-18
  - source_id: source.amodei2016.concrete_problems
    title: Concrete Problems in AI Safety
    url: https://arxiv.org/abs/1606.06565
    source_kind: preprint
    supports:
      - why-it-matters
      - limitations-and-common-mistakes
    checked_on: 2026-09-18
unresolved_references:
  - label: Lee et al. (2023), the paper that popularised the name RLAIF and compared AI against human feedback on summarisation and dialogue
    reason: The registry has no entry for it, so the claim that AI feedback has been reported competitive with human feedback outside harmlessness is stated here as an unverified report rather than as a result this page can point at.
    sections:
      - why-it-matters
      - variants-and-alternatives
  - label: The language-model preference work that preceded InstructGPT (Ziegler et al. 2019, Stiennon et al. 2020)
    reason: The registry has no entry for either, so the statement that reward models fitted to human comparisons and optimised with PPO reached language models before InstructGPT is recorded here without a citation to point at.
    sections:
      - history-and-attribution
  - label: The LLM-as-a-judge bias literature (position, verbosity and self-preference effects) and empirical work on degradation from repeated training on model-generated data
    reason: No registered source covers either, so the corresponding failure modes are named as open concerns rather than cited findings.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**RLAIF**, reinforcement learning from AI feedback, replaces the human annotator
in a preference-learning pipeline with a language model prompted by written
instructions. Sample two responses to a prompt, ask which is better, fit a reward
model to the labels, optimise the policy against it under a penalty for drifting
from a reference policy. Only the second step changes.

**Constitutional AI** is the instantiation introduced by Bai et al.: the
labelling prompt carries a principle sampled from a short written constitution,
and a preceding supervised stage has the model critique and revise its own
answers against those principles. It is RLAIF plus a document stating what the
labels mean.

## Why it matters

Collecting human comparisons is the slowest and least reproducible part of
preference fine-tuning: it costs money per comparison, goes stale as soon as the
policy changes, and in harmlessness work means paying people to read the worst
output a model can produce. Model labels cost only inference and can be
regenerated on the current policy's samples as often as you like — the practical
face of what the safety literature calls scalable oversight.

The objective also becomes legible. With human labels it lives implicitly in an
annotator pool; under Constitutional AI it is a short list of principles you can
read, version and argue with, then re-derive the dataset from.

Constitutional AI used AI labels for harmlessness and kept human labels for
helpfulness. Later work reports AI feedback competitive with human feedback on
broader tasks such as summarisation; no registry source covers that, so this page
treats it as unverified.

## Intuition

The picture is a style guide replacing a room of editors: the guide scales and
says the same thing every time; the editors carry judgement no document captures.
The analogy breaks at the reader — a human editor interprets a guide from outside
it, while here the interpreter is a model of the same kind as the one being
trained.

Sharper: RLAIF harvests the gap between judging and generating. Telling which of
two answers is more dangerous is easier than reliably producing the safer one,
and RLAIF turns that margin into generative behaviour. Where the gap is absent
there is nothing to harvest — which is why harmlessness and format compliance
work and frontier capability does not: a labeller cannot rank two proofs it
cannot check.

## Concrete example

The supervised stage runs a critique-and-revision loop over red-team prompts:

```text
Human: <red-team prompt>
Assistant: <initial response from a helpful-only model>

Critique request: Identify specific ways in which the assistant's last
response is harmful, unethical, or dangerous.
Critique: <model's critique>

Revision request: Rewrite the assistant response to remove the harmful
content, while still engaging with what was asked.
Revision: <model's revision>
```

The revision replaces the response, the loop may repeat under another principle,
and the final revisions become supervised fine-tuning data.

The RL stage labels preferences instead. Two responses from the fine-tuned model
go to a feedback model as a multiple-choice question with a principle inserted —
"choose the response that is less harmful". The normalised probabilities on the
answer tokens `(A)` and `(B)`, say $0.73$ and $0.27$, become a _soft_ label of
$0.73$ rather than a hard vote. Letting the feedback model reason first collapses
those probabilities towards $0$ and $1$; the paper clamps them into roughly the
$40$–$60\%$ band.

## Formal treatment

Write $x$ for a prompt from a distribution $\mathcal{D}$, $y$ for a response, and
$\pi_\theta(y \mid x)$ for the policy. Generation is a one-step decision — a
contextual bandit — with reward on the finished response, though the KL term
below is applied per token.

Let $c$ be a principle drawn from a constitution $C$ and $\ell_A, \ell_B$ the
feedback model's log-probabilities for the two options under the labelling prompt
built from $(x, y_1, y_2, c)$. The soft label is
$p = e^{\ell_A} / (e^{\ell_A} + e^{\ell_B})$. The reward model $r_\phi$ is fitted
under the Bradley–Terry assumption
$P(y_1 \succ y_2 \mid x) = \sigma(r_\phi(x,y_1) - r_\phi(x,y_2))$, with $\sigma$
the logistic function, by minimising

$$
\mathcal{L}(\phi) \;=\; -\,\mathbb{E}\Big[\, p \log \sigma(\Delta_\phi) + (1-p)\log\big(1 - \sigma(\Delta_\phi)\big) \Big],
\qquad \Delta_\phi = r_\phi(x,y_1) - r_\phi(x,y_2).
$$

Only differences of $r_\phi$ are identified — the reward is fixed up to an
additive function of $x$ — so scores compare within a prompt and not across
prompts. The policy then maximises

$$
J(\theta) \;=\; \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\theta}\big[r_\phi(x,y)\big] \;-\; \beta\, \mathrm{KL}\big(\pi_\theta(\cdot \mid x) \,\|\, \pi_{\mathrm{ref}}(\cdot \mid x)\big),
$$

with $\pi_{\mathrm{ref}}$ the supervised starting policy and $\beta > 0$ the
strength of the anchor, optimised by PPO's clipped surrogate. Nothing here knows
that $p$ came from a model rather than a person, which is why the case for the
swap has to be empirical.

## Assumptions and requirements

The load-bearing assumption is judgement competence: the feedback model must rank
responses on the target axis better than the policy already ranks them
implicitly. Drop it and RLAIF optimises noise, or a systematic error dressed as
signal. It also needs a labeller strong enough to apply a stated principle at all
— in practice a large pretrained model — and an axis writable in a sentence,
since that sentence is the entire specification. Axes such as taste do not
survive that compression.

Bradley–Terry assumes preferences are consistent enough to be explained by one
scalar per response; intransitive judgements violate it. Soft labels assume the
feedback model's probabilities are calibrated, which is what the clamping
concedes they are not. The KL term assumes a reference policy worth staying near,
and the prompts must elicit the behaviour being judged: harmlessness labels on
innocuous prompts teach nothing.

## Uses and applicability

Reach for AI feedback when the property is easy to state and check but tedious to
produce reliably: harmlessness, refusal style, format compliance, tone, and the
long tail of policy rules. It also fits when the specification will change, since
regenerating labels under a revised constitution costs inference rather than
rehiring annotators.

Do not reach for it when the labeller is not a competent judge — domain-specific
correctness, facts outside its knowledge, genuinely novel work — or when the
point is to discover what a population of people prefers. The division
Constitutional AI drew remains the honest default: AI feedback for harmlessness,
human feedback for helpfulness.

## Limitations and common mistakes

The first mistake is reading RLAIF as removing humans: humans wrote the
constitution, chose the labeller, wrote the red-team prompts and judged the
result. Judgement moves from per-example labels to the specification; that is not
absence.

The second is genuinely open: an AI labeller's biases become the training target.
Whatever the feedback model systematically favours — longer answers, familiar
phrasing, its own idiom — the policy learns to produce. Because labeller and
policy are usually the same kind of model, shared errors are invisible to the
loop: a judge cannot catch a mistake it would also make. Whether iterating
amplifies such error or merely preserves it is not settled.

Third is over-optimisation of the reward model — reward hacking in its usual
form. The policy finds regions where $r_\phi$ is wrong and exploits them, and
cheap labels make it easy to run RL long enough to get there. The KL penalty
limits this; nothing removes it.

Fourth is generalising the published comparisons. Constitutional AI's finding —
RL-CAI models rated less harmful at comparable helpfulness, and less evasive —
concerns particular models, one constitution and the authors' own crowdworker
ratings. It is evidence that AI feedback can work for harmlessness, not a law
that it matches human feedback.

## Variants and alternatives

**Constitutional AI** is the two-stage form: critique-and-revise supervised data,
then AI-labelled preferences for RL. **Chain-of-thought feedback** has the
labeller reason before answering, which improved labels in that work at the cost
of the clamping above. **Direct AI reward** drops the reward model and scores
each rollout with the labelling model: nothing fitted that can drift away from
the labeller, but a forward pass per sample, a noisier reward, and a labeller
that is still a fixed target the policy can learn to exploit.

**Rejection sampling with AI scoring** abandons RL — draw $n$ responses, keep the
best, fine-tune on the winners: stable, but it only imitates what the policy
already produces. **Direct preference optimisation** consumes the same
AI-labelled pairs through a loss on the policy itself, removing both reward model
and PPO at the cost of on-policy exploration.

**Verifiable reward** — unit tests, proof checkers, exact-match graders — is the
genuinely different approach: a programmatic check instead of judgement, which
removes the learned proxy's errors in the narrow set of domains where a checker
exists — though a checker looser than the intent behind it can still be gamed.

## History and attribution

The comparison-based pipeline RLAIF inherits was assembled in its now-standard
form by Ouyang et al. in 2022, whose InstructGPT work fitted a reward model to
human rankings and optimised against it with PPO under a KL penalty. It was not
the first application to language models — reward models fitted to human
comparisons and optimised with PPO under a KL anchor were already being used on
stylistic control and summarisation in 2019-2020, and preference-based
reinforcement learning is older still, with several independent origins — but
InstructGPT is the form RLAIF modifies.

RLAIF proper arrived with Bai et al., _Constitutional AI: Harmlessness from AI
Feedback_ (Anthropic, 2022), which named "RL from AI Feedback". Their problem was
concrete: harmlessness training on human labels was producing evasive assistants
that refused without explanation, and the red-teaming behind those labels was
expensive and unpleasant to collect.

The name later spread to model-generated preference labels generally, including
uses with no constitution. Training on a model's own outputs is an old idea
rooted in self-training; what dates to 2022 is using it to manufacture
_preference_ labels for an RL stage.

## Sources

_Constitutional AI_ is the primary source for the method: the critique-and-revision
prompts, the multiple-choice feedback format, the soft labels and their clamping,
the harmlessness-versus-helpfulness division of labour, and the comparisons
reported for it. _Training language models to follow instructions with human
feedback_ covers the pipeline RLAIF modifies — reward-model loss, KL-regularised
objective, annotator-side difficulties. The _PPO_ paper covers the clipped
surrogate, and _Concrete Problems in AI Safety_ covers scalable oversight and
reward hacking.

## Prerequisites and next connections

Understand the human-feedback pipeline first — supervised fine-tuning, a reward
model fitted to comparisons, then KL-regularised policy optimisation — because
RLAIF changes exactly one component of it. Underneath sit
[Policy Gradients](./policy-gradients.md), which supply the gradient estimator,
and [Markov Decision Processes](./markov-decision-processes.md), whose one-step
special case is the setting here; [Transformers](./transformers.md) is assumed
throughout, since policy, reward model and labeller are all transformers.

From here, read [Distillation](./distillation.md) against this page: comparing
what each transfers — a full output distribution versus an ordering over the
student's own samples — sharpens what RLAIF buys.
