---
concept_id: concept.reinforcement_learning.rlhf
title: RLHF
slug: /concepts/rlhf
aliases:
  - reinforcement learning from human feedback
kind: method
tier: 1
review_state: generated-draft
summary: 'The standard post-training recipe for objectives nobody can write down as a loss: fit a reward model to pairwise human preference judgements, then optimise the policy against that reward while a KL penalty holds it near the model it started from.'
categories:
  - Artificial Intelligence/Reinforcement Learning
primary_category: Artificial Intelligence/Reinforcement Learning
relationships:
  - type: requires
    target: concept.reinforcement_learning.ppo
    note: The optimisation stage is a PPO run against the learned reward, so the clipped surrogate and its on-policy sampling loop are what actually executes when RLHF is trained.
  - type: requires
    target: concept.machine_learning.logistic_regression
    note: The Bradley-Terry reward-model loss is binary logistic regression on the difference of two scores, and reading it as anything else hides where the identifiability limits come from.
  - type: contrasts_with
    target: concept.reinforcement_learning.rlaif
    note: RLAIF keeps the whole pipeline and swaps only the source of the comparison labels, so the pair isolates what the human annotator is contributing.
  - type: contrasts_with
    target: concept.reinforcement_learning.inverse_reinforcement_learning
    note: Both recover a reward function from human data, but IRL infers it from demonstrations assumed near-optimal, while RLHF fits it to explicit rankings of the model's own samples.
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
    checked_on: 2026-09-18
  - source_id: source.schulman2017.ppo
    title: Proximal Policy Optimization Algorithms
    url: https://arxiv.org/abs/1707.06347
    source_kind: preprint
    supports:
      - formal-treatment
    checked_on: 2026-09-18
  - source_id: source.bai2022.constitutional_ai
    title: 'Constitutional AI: Harmlessness from AI Feedback'
    url: https://arxiv.org/abs/2212.08073
    source_kind: preprint
    supports:
      - limitations-and-common-mistakes
      - variants-and-alternatives
    checked_on: 2026-09-18
  - source_id: source.sutton_barto.reinforcement_learning
    title: 'Sutton and Barto, Reinforcement Learning: An Introduction (2nd edition)'
    url: http://incompleteideas.net/book/the-book-2nd.html
    source_kind: authoritative-secondary
    supports:
      - formal-treatment
      - intuition
    checked_on: 2026-09-18
unresolved_references:
  - label: Christiano et al. (2017), deep reinforcement learning from human preferences, and the earlier language-model preference work (Ziegler et al. 2019, Stiennon et al. 2020)
    reason: The registry has no entry for any of them, so the attribution of the modern preference-based RL pipeline and the first over-optimisation curves rests on nothing cited here.
    sections:
      - history-and-attribution
      - limitations-and-common-mistakes
  - label: Direct Preference Optimization (Rafailov et al., 2023)
    reason: The DPO derivation and loss given here are reproduced from the original paper, which is not in the registry; nothing cited supports the claim that it matches PPO-based RLHF in published comparisons.
    sections:
      - formal-treatment
      - variants-and-alternatives
  - label: Quantitative studies of reward-model over-optimisation and length bias
    reason: The scaling-law work relating KL budget to true-reward decline, and the measurements attributing much of a preference win-rate gain to response length, are empirical findings no registry source reports.
    sections:
      - limitations-and-common-mistakes
claims: []
---

## Definition

**RLHF** is a three-stage procedure for optimising a generative policy against a
criterion that exists only in people's judgements. First, supervised fine-tuning
on demonstrations produces a policy $\pi^{\mathrm{SFT}}$, which is frozen and
kept as a reference $\pi_{\mathrm{ref}}$. Second, annotators compare pairs of
completions for the same prompt and a **reward model** $r_\phi(x, y)$ is fitted
to those comparisons under the Bradley-Terry likelihood. Third, the policy
$\pi_\theta$ is optimised to maximise $r_\phi$ minus a penalty on its
Kullback-Leibler divergence from $\pi_{\mathrm{ref}}$. Only the second and third
stages are specific to RLHF; the first is ordinary
[Supervised Learning](./supervised-learning.md).

## Why it matters

"Be helpful, do not fabricate citations, refuse this but not that" has no loss
function and no cheap automatic metric: likelihood of human text rewards fluency,
not usefulness, and a bigger model trained the same way is a better next-token
predictor without being a better assistant. What people can do reliably is
compare: shown two answers, a rater picks one, even when they could not have
written either.

RLHF converts that comparison ability into gradient signal. The result Ouyang et
al. report is the reason the recipe spread: labelers preferred outputs from a
1.3B-parameter model trained this way over outputs from the 175B GPT-3, on the
same prompt distribution. A hundredfold parameter gap was
overturned by changing the objective, not the scale. "Chat model" versus "base
model" now mostly names the presence or absence of this stage.

## Intuition

Think of the reward model as a learned critic that has watched a few hundred
thousand side-by-side judgements and can now score a new answer in one forward
pass — cheap where a human is slow. The policy then plays against that critic.

The critic is a fitted function with a finite training distribution, and the
policy is a powerful optimiser searching for its maximum. Wherever the critic is
wrong in the policy's favour, the policy will find it — the ordinary
reward-specification failure of reinforcement learning, Sutton and Barto's point
that an agent optimises the reward you wrote rather than the one you meant, now
with a reward whose errors are reachable by search.

The KL penalty is the containment: stay where the critic was trained, the only
region where its scores mean anything. The trust-region analogy breaks in one
place — a trust region limits how far each update moves, whereas this term is
part of the objective and limits where the final policy ends up relative to a
fixed reference.

## Concrete example

The reward model is trained by logistic regression on score differences. Given
three comparisons where the annotator chose $y_w$ over $y_l$, and a reward model
producing the scores below, the loss is one line:

```python
import torch
import torch.nn.functional as F

# reward-model scores for the chosen and rejected completions of three prompts
r_w = torch.tensor([1.2, 0.4, -0.5])
r_l = torch.tensor([0.3, 0.9, -0.7])

loss = -F.logsigmoid(r_w - r_l).mean()
print(loss.item())  # 0.6378
```

The margins are $0.9$, $-0.5$ and $0.2$: the first comparison is predicted with
probability $\sigma(0.9) = 0.711$, contributing $0.341$ nats, the second wrongly
at $\sigma(-0.5) = 0.378$, contributing $0.974$. Ouyang et al. collect $K$
completions per prompt ($K$ between 4 and 9), rank them once, and train on all
$\binom{K}{2}$ pairs inside a single batch, dividing the loss by $\binom{K}{2}$:
pairs from one prompt are dependent, so spreading them across batches overfits.

Now the KL side. With $\beta = 0.02$ and a sampled completion that has drifted to
$\log\big(\pi_\theta(y \mid x)/\pi_{\mathrm{ref}}(y \mid x)\big) = 25$ nats, the
penalty is $0.5$ reward units — comparable to the $0.9$ gap separating a good
answer from a bad one above. That exchange rate is why $\beta$ is tuned rather
than derived.

## Formal treatment

Let $x$ be a prompt, $y$ a completion, and $\mathcal{D} = \{(x, y_w, y_l)\}$ the
comparison dataset with $y_w$ preferred. Bradley-Terry posits a latent scalar
quality and a logistic comparison noise model:

$$
P(y_w \succ y_l \mid x) \;=\; \frac{\exp r_\phi(x, y_w)}{\exp r_\phi(x, y_w) + \exp r_\phi(x, y_l)} \;=\; \sigma\big(r_\phi(x, y_w) - r_\phi(x, y_l)\big),
$$

with $\sigma(z) = 1/(1 + e^{-z})$. The reward model is the maximum-likelihood
fit, which is a binary cross-entropy on the margin:

$$
\mathcal{L}(\phi) \;=\; -\,\mathbb{E}_{(x, y_w, y_l) \sim \mathcal{D}}\Big[\log \sigma\big(r_\phi(x, y_w) - r_\phi(x, y_l)\big)\Big].
$$

Only differences at a fixed $x$ appear, so $r_\phi$ is identifiable only up to an
arbitrary additive function of $x$: scores are not comparable across prompts
unless a normalisation is imposed by hand.

The policy objective is

$$
\max_\theta \; \mathbb{E}_{x \sim \mathcal{D},\, y \sim \pi_\theta(\cdot \mid x)}\big[r_\phi(x, y)\big] \;-\; \beta\, \mathbb{D}_{\mathrm{KL}}\big(\pi_\theta(\cdot \mid x) \,\|\, \pi_{\mathrm{ref}}(\cdot \mid x)\big),
$$

implemented by handing PPO the per-sample reward $r_\phi(x, y) - \beta \log
\big(\pi_\theta(y \mid x)/\pi_{\mathrm{ref}}(y \mid x)\big)$, whose expectation is
the objective above. The environment is a contextual bandit dressed as an MDP:
transitions are deterministic concatenation of a token, and reward arrives only
at the end of the sequence.

The KL-regularised problem has a closed-form optimum,

$$
\pi^\star(y \mid x) \;=\; \frac{1}{Z(x)}\, \pi_{\mathrm{ref}}(y \mid x)\, \exp\!\big(r_\phi(x, y)/\beta\big),
$$

an exponential tilt of the reference. Inverting it gives $r_\phi(x, y) = \beta
\log\big(\pi^\star(y \mid x)/\pi_{\mathrm{ref}}(y \mid x)\big) + \beta \log
Z(x)$, and substituting into the Bradley-Terry loss cancels the intractable
$Z(x)$, which appears in both terms of the difference. What is left is DPO: the
same logistic loss with $\beta$ times a log-ratio in place of each reward,
optimised directly in $\theta$ with no reward model and no sampling.

## Assumptions and requirements

Bradley-Terry assumes each completion has a scalar quality and that preferences
are transitive and independent of what else was on offer. Annotation violates all
three: raters disagree, a single rater is intransitive, and a completion is
judged relative to its partner. Ouyang et al. report labeler-labeler agreement in
the low seventies of percent, which sets the scale of the ceiling on reward-model
accuracy; the surplus is noise a large model will fit.

The reward model is valid only on the distribution it was trained on — samples
from $\pi_{\mathrm{ref}}$ and its neighbourhood — and the policy moves during
training, so that assumption decays as optimisation proceeds, which is why
pipelines re-collect comparisons against the current policy rather than training
once.

Raters must also be able to judge the outputs. Where verifying an answer is as
hard as producing it — long proofs, subtly buggy code, claims requiring research
— the signal measures apparent quality and the policy optimises appearance.

Whose preferences is a question of fact. The InstructGPT labels come from roughly
forty contractors following written instructions from the researchers; the reward
model encodes that document as executed by that pool. It is not a population
average, and calling it "human preference" unqualified overstates what was
measured.

## Uses and applicability

Reach for RLHF when the objective is real but unwritable, comparisons are much
cheaper than demonstrations, and you already have a competent supervised policy
to refine. It is how instruction following, format compliance, refusal behaviour
and tone are installed in deployed language models, and it transfers to any
generative setting with the same shape.

Do not reach for it when the objective is checkable: if a unit test or an answer
key decides correctness, use that signal directly, since it is free, unhackable
in the reward-model sense, and inherits no annotator noise. Nor should it be used
to install knowledge the base model lacks. RLHF reweights behaviour already in
the reference policy's support, which the exponential tilt makes precise — any
$y$ with $\pi_{\mathrm{ref}}(y \mid x) = 0$ has $\pi^\star(y \mid x) = 0$ for
every finite reward.

## Limitations and common mistakes

**Over-optimisation is the defining failure.** Push the policy further against a
fixed reward model and measured reward keeps rising while true quality, judged by
fresh human evaluation, peaks and then declines: the policy has found the reward
model's errors, which are not noise that averages out but a fixed surface the
optimiser climbs. Length is the canonical case — reward models reliably prefer
longer answers, and any win rate not controlled for length should be read
sceptically.

**The reward model is not a metric.** Since $r_\phi$ is identifiable only up to a
per-prompt shift, comparing scores across prompts or reporting a mean reward as a
quality number means little. It ranks within a prompt.

**KL is not a safety guarantee.** A small average divergence permits large changes
on rare inputs, and the practical estimator is a single-sample log-ratio with
high variance that is not itself non-negative.

Three documented side effects: an alignment tax, where the tuned model regresses
on public NLP benchmarks (Ouyang et al. mitigate it by mixing pretraining
gradients into the PPO updates); evasiveness, where optimising a harmlessness
preference yields a model that refuses and moralises rather than engaging, which
Bai et al. built Constitutional AI partly to fix; and entropy loss, since the
tilt concentrates mass on whatever the reward model scores highly.

## Variants and alternatives

**DPO** uses the loss derived above and skips the reward model entirely, training
on fixed pairs with two forward passes per example. It buys simplicity and no
sampling loop; it costs the ability to score fresh on-policy samples, to reuse
the reward model for filtering or best-of-$n$, and to iterate online. Its
gradient can also push down the likelihood of the chosen response as long as the
rejected one falls faster, which has no analogue in the PPO pipeline.

**Best-of-$n$ sampling** uses the reward model at inference and skips RL
altogether — trivial to implement, more expensive per query, and it incurs its
own KL cost growing with $n$. **RLAIF and Constitutional AI** replace human
comparison labels with labels from a model following written principles, making
the signal cheap and its criteria inspectable. **Verifiable rewards** replace the
learned reward with a programmatic checker where one exists, removing
model-error hacking at the cost of restricting the domain. Further out sit
reward-model ensembles that penalise disagreement as a proxy for
off-distribution inputs, and value-function-free policy gradient variants that
normalise rewards within a group of samples from the same prompt. Which is best
is not settled.

## History and attribution

The comparison model is old: Bradley and Terry gave the logistic
paired-comparison likelihood in 1952, with Thurstone's probit version of the same
idea a quarter-century earlier. Learning a reward function from human comparisons and
optimising a deep policy against it was demonstrated on Atari and simulated
robotics in 2017 by Christiano and collaborators, working on reward specification
for behaviours nobody could code. The pipeline moved to language models over
2019-2020 through work on stylistic control and summarisation; Ouyang et al.
(2022) assembled the now-standard three-stage form, Bai et al. (2022) published
the helpful-and-harmless variant and then the AI-feedback replacement for the
labels, and DPO followed in 2023. The citations for the 2017 and 2019-2020 steps
are not in the registry and are flagged as unresolved.

## Sources

Ouyang et al. is the reference implementation: it states the Bradley-Terry loss
and the KL-penalised objective in the form used here, documents the annotator
pool and agreement rates, and reports both the headline preference result and the
benchmark regressions. Schulman et al. defines the optimiser the third stage
runs. Bai et al. is the source for the evasiveness failure of preference-trained
harmlessness models and for the AI-feedback alternative. Sutton and Barto
supplies the inherited framing — policy gradients, the bandit special case, and
the problem of an agent optimising the reward it was given.

## Prerequisites and next connections

Read [Policy Gradients](./policy-gradients.md) first — the third stage is one —
with [REINFORCE](./reinforce.md) for the estimator in its simplest form.
[Logistic Regression](./logistic-regression.md) is the reward-model loss in
disguise, and [Markov Decision Processes](./markov-decision-processes.md) gives
the state-action language, though the degenerate bandit structure here leaves
most of that machinery unused. [Transformers](./transformers.md) helps: policy,
reference and reward model are usually one architecture with different heads.

From here, go to the clipped algorithm that runs the optimisation, the
AI-feedback variant that isolates what the human annotator contributes, and
inverse reinforcement learning, which shares the goal of recovering a reward from
human behaviour but starts from demonstrations rather than comparisons.
