---
concept_id: concept.physics.statistical_mechanics
title: Statistical Mechanics
slug: /concepts/statistical-mechanics
aliases:
  - statistical physics
  - equilibrium statistical mechanics
kind: concept
tier: 1
review_state: generated-draft
summary: The theory that predicts what a system of enormously many degrees of freedom does on average, by putting a probability distribution on its microscopic configurations and extracting everything measurable from one normalising sum.
categories:
  - Mathematics/Mathematical Physics
  - Mathematics/Information Theory
primary_category: Mathematics/Mathematical Physics
relationships:
  - type: requires
    target: concept.probability.probability_theory
    note: Every object here is a probability object — a distribution over configurations, an expectation, a variance, a large-deviation rate — and a reader without expectations and independence cannot follow the partition function at all.
  - type: assumes
    target: concept.physics.hamiltonian_mechanics
    note: The classical ensembles live on phase space and assume a Hamiltonian flow that conserves energy and preserves Liouville measure, which is what makes the uniform measure on an energy shell a stationary distribution in the first place.
  - type: contributes_to
    target: concept.geometry.renormalization
    note: The renormalization group, imported from quantum field theory and reshaped by Kadanoff and Wilson for critical phenomena, explains critical exponents in statistical-mechanical models, and its coarse-graining maps act on exactly the couplings that define a lattice Hamiltonian.
  - type: contributes_to
    target: concept.probability.bayesian_inference
    note: Variational Bayes is the mean-field approximation transplanted, with the evidence lower bound as minus a variational free energy and the gap it leaves as the same Gibbs inequality that bounds free energies in physics.
sources:
  - source_id: source.mackay.information_theory
    title: David MacKay, Information Theory, Inference, and Learning Algorithms
    url: https://www.inference.org.uk/mackay/itila/
    source_kind: authoritative-secondary
    supports:
      - definition
      - intuition
      - concrete-example
      - formal-treatment
      - uses-and-applicability
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.mit_ocw.statistical_physics_of_fields
    title: 'MIT 8.334 Statistical Mechanics II: Statistical Physics of Fields (Spring 2014)'
    url: https://ocw.mit.edu/courses/8-334-statistical-mechanics-ii-statistical-physics-of-fields-spring-2014/
    source_kind: lecture-or-course
    supports:
      - formal-treatment
      - concrete-example
      - assumptions-and-requirements
      - variants-and-alternatives
    checked_on: 2026-09-17
  - source_id: source.wilson1982.renormalization_group
    title: The Renormalization Group and Critical Phenomena (Nobel Lecture)
    url: https://www.nobelprize.org/prizes/physics/1982/wilson/lecture/
    source_kind: authoritative-secondary
    supports:
      - why-it-matters
      - history-and-attribution
    checked_on: 2026-09-17
  - source_id: source.hopfield1982.neural_networks
    title: Neural networks and physical systems with emergent collective computational abilities
    url: https://www.pnas.org/doi/10.1073/pnas.79.8.2554
    source_kind: primary-research
    supports:
      - uses-and-applicability
      - history-and-attribution
    checked_on: 2026-09-17
unresolved_references:
  - label: An introductory equilibrium statistical mechanics text (Kardar's Statistical Physics of Particles, Sethna, or Pathria)
    reason: The registry's only statistical mechanics source is the second-semester field-theory course, so the microcanonical, canonical and grand canonical ensembles, the thermodynamic limit and the ergodic hypothesis are stated here from standard textbook material that no cited source presents at that level.
    sections:
      - definition
      - formal-treatment
      - assumptions-and-requirements
  - label: E. T. Jaynes, Information Theory and Statistical Mechanics (1957)
    reason: The maximum-entropy derivation of the Boltzmann distribution, and the attribution of that view to Jaynes, are not covered by any registered source.
    sections:
      - formal-treatment
      - history-and-attribution
  - label: A treatment of the Bethe free energy as a variational problem (Yedidia, Freeman and Weiss on generalised belief propagation, or Wainwright and Jordan's graphical-models monograph)
    reason: MacKay covers the mean-field variational bound, but no registered source states that the Bethe free energy is exact on trees and is not a bound on the true free energy in general, which the variants section now asserts.
    sections:
      - variants-and-alternatives
  - label: The Gibbs-versus-Boltzmann entropy dispute for small and bounded-energy systems
    reason: The page reports that this is contested; no registered source discusses the surface-versus-volume entropy argument or negative absolute temperature.
    sections:
      - limitations-and-common-mistakes
---

## Definition

**Statistical mechanics** assigns a probability to every microscopic configuration of a
system and computes macroscopic quantities as expectations under that distribution. For a
system in equilibrium with a heat bath at temperature $T$, the assignment is the
**Boltzmann distribution**

$$
p(s) \;=\; \frac{e^{-\beta E(s)}}{Z}, \qquad Z(\beta) \;=\; \sum_{s} e^{-\beta E(s)},
\qquad \beta = \frac{1}{k_B T},
$$

where $s$ ranges over microstates, $E(s)$ is the energy of a microstate and $k_B$ is
Boltzmann's constant. The normaliser $Z$ is the **partition function**, and the subject's
central trick is that $Z$ is not a bookkeeping nuisance but the generating function of
everything measurable: differentiate $\ln Z$ and out come energies, heat capacities,
magnetisations and susceptibilities.

## Why it matters

A litre of gas has of order $10^{22}$ molecules. Nobody will ever integrate its equations of
motion, and nobody needs to: pressure, temperature and phase are properties of the
distribution, not of any trajectory. Statistical mechanics is the bridge that makes a
tractable macroscopic theory follow from an intractable microscopic one.

It also explains something stranger. Water boils, magnets demagnetise and binary alloys
order at sharp temperatures. Boiling at a fixed pressure is first order and has no critical
exponents, but near the continuous transitions — the Curie point, the alloy's ordering point,
the liquid–gas critical point where the boiling curve ends — wildly different materials share
the same critical exponents. Wilson's account of critical phenomena made that universality a
consequence of how fluctuations at many length scales feed into one another, rather than a
coincidence of chemistry.

## Intuition

Carry two pictures. The first is counting: entropy measures how many microscopic
arrangements are consistent with what you can see, so a macrostate realised in many ways is
the one you find. The second is competition: at fixed temperature a system minimises
$F = U - TS$, so low energy wins at low temperature and high entropy wins at high
temperature, and a phase transition is the point where the winner changes.

The analogy to "disorder" is the one that misleads. Entropy counts accessible states, and
ordering can increase it — hard spheres crystallise at high density because a lattice frees
up more local wiggle room than a jammed disordered packing. Count states, do not imagine
mess.

## Concrete example

Take four Ising spins $s_i = \pm 1$ on a square, each bonded to its two neighbours around
the ring, with energy $E(s) = -J \sum_{\langle ij \rangle} s_i s_j$ over the four bonds.
Enumerating all $2^4 = 16$ configurations: two are fully aligned with $E = -4J$, two are
"checkerboard" with $E = +4J$, and the remaining twelve have $E = 0$. So

$$
Z(\beta) \;=\; 2e^{4\beta J} + 12 + 2e^{-4\beta J} \;=\; 4\cosh(4\beta J) + 12 .
$$

At $k_B T = J$ (so $\beta J = 1$): $Z = 121.23$, the two aligned states together carry
probability $0.901$, the mean energy is $\langle E \rangle = -3.60\,J$, the free energy is
$F = -k_B T \ln Z = -4.80\,J$ and the entropy is $S/k_B = (\langle E \rangle - F)/k_B T =
1.196$. At $k_B T = 10J$ the same formulas give $Z = 16.32$, aligned probability $0.183$,
$\langle E \rangle = -0.40\,J$ and $S/k_B = 2.752$, within a whisker of the maximum
$\ln 16 = 2.773$: the bath has washed the interaction out.

```python
from math import cosh, sinh, log
J = 1.0
for beta in (0.1, 1.0):
    Z = 4 * cosh(4 * beta * J) + 12
    E = -16 * J * sinh(4 * beta * J) / Z        # <E> = -dlnZ/dbeta
    F = -log(Z) / beta
    print(beta, round(Z, 2), round(E, 3), round(F, 3), round((E - F) * beta, 3))
```

Nothing here is singular, and nothing can be: $Z$ is a finite sum of exponentials, strictly
positive and analytic in $\beta$. Sharpness requires the infinite lattice.

## Formal treatment

Fix a state space $\mathcal{S}$ and an energy $E : \mathcal{S} \to \mathbb{R}$. The three
standard **ensembles** are the microcanonical (energy fixed, distribution uniform on the
energy shell), the canonical (temperature fixed by contact with a bath, distribution
Boltzmann) and the grand canonical (particle number also exchanged, weighting by
$e^{-\beta(E - \mu N)}$ with chemical potential $\mu$).

Two entropies appear. **Boltzmann entropy** counts: $S = k_B \ln \Omega$, with $\Omega$ the
number of microstates compatible with the macrostate. **Gibbs entropy** is the functional
$S[p] = -k_B \sum_s p(s) \ln p(s)$, which reduces to the first when $p$ is uniform on
$\Omega$ states and is formally the Shannon entropy in units of $k_B$.

The Boltzmann distribution is the maximum-entropy distribution at fixed mean energy.
Maximising $S[p]$ subject to $\sum_s p(s) = 1$ and $\sum_s p(s) E(s) = U$ with multipliers
$\lambda$ and $\beta$ gives stationarity condition $-\ln p(s) - 1 - \lambda - \beta E(s) = 0$,
hence $p(s) \propto e^{-\beta E(s)}$, with $\beta$ fixed implicitly by $U$. Temperature is
the Lagrange multiplier conjugate to energy; it is not an extra postulate.

The **Helmholtz free energy** $F = -k_B T \ln Z$ satisfies $F = U - TS$ and generates the
rest:

$$
\langle E \rangle = -\frac{\partial \ln Z}{\partial \beta}, \qquad
\operatorname{Var}(E) = \frac{\partial^2 \ln Z}{\partial \beta^2} = k_B T^2 C_V ,
$$

the second identity being a **fluctuation–response relation**: the variance of an observable
equals the derivative of its mean with respect to the conjugate field.

A **phase transition** is a non-analyticity of the free energy density
$f(\beta, h) = -\lim_{N \to \infty} (\beta N)^{-1} \ln Z_N(\beta, h)$ in the thermodynamic
limit. It is called first order if a first derivative jumps (latent heat, a jump in
magnetisation) and continuous if first derivatives are continuous while second derivatives
diverge, which is where the correlation length $\xi$ blows up and universality lives.

The **Ising model** adds a field, $E(s) = -J \sum_{\langle ij \rangle} s_i s_j - h \sum_i s_i$.
On the two-dimensional square lattice at $h = 0$ it orders at
$k_B T_c / J = 2/\ln(1 + \sqrt{2}) \approx 2.269$, with exact exponents $\beta = 1/8$ and
$\nu = 1$. The **mean-field** approximation replaces each neighbour by its average, giving
the self-consistency equation

$$
m = \tanh\!\big(\beta (z J m + h)\big)
$$

for coordination number $z$, and $k_B T_c^{\text{MF}} = zJ$. For the square lattice that is
$4J$ against the true $2.269J$; in one dimension it predicts a transition that does not
exist. Mean field is exact for the fully connected model and becomes accurate above four
dimensions, which is why its failures are systematic rather than random.

## Assumptions and requirements

**Equilibrium.** The distribution is stationary. A system relaxing, driven, or aging has no
temperature in this sense, and the formulas do not apply merely because the system is large.

**Ergodicity, or equal a priori probabilities.** The microcanonical postulate assumes
dynamics explore the energy shell. This is assumed, not generally proved, and it fails on
observable timescales for glasses and for magnets below $T_c$, where the system is confined
to one broken-symmetry sector.

**A thermodynamic limit that exists.** Extensivity requires short-range interactions and a
sensible large-$N$ scaling. Gravitating systems and long-range models break it; ensembles
then stop agreeing, and a microcanonical system can show negative specific heat that the
canonical ensemble cannot represent.

**A bath much larger than the system**, so its temperature is unchanged by the exchange,
and a **weak coupling**, so the total energy is the system's plus the bath's without an
interaction term.

Ensemble equivalence itself is a theorem with hypotheses, not a definition. It holds when the
microcanonical entropy is concave and fails when it is not — the long-range and gravitating
case above, where a coexistence-like region carries the negative specific heat no canonical
ensemble can represent. A first-order transition in a short-range system is the milder case:
the entropy stays concave, flat across the coexistence region, so the two ensembles still
agree on the thermodynamic potentials and part company only over fluctuations, the canonical
energy distribution being bimodal at the transition where the microcanonical one is sharp.

## Uses and applicability

In physics: phases and phase diagrams, heat capacities, magnetism, polymers, and — through
the correspondence between $d$-dimensional statistical field theory and quantum field theory
in imaginary time — a computational route into quantum problems.

In machine learning the connections are literal, not metaphorical.

The **softmax is a Boltzmann distribution**. With logits $z_i$, the softmax
$p_i = e^{z_i} / \sum_j e^{z_j}$ is exactly $p(s) = e^{-\beta E(s)}/Z$ with $E_i = -z_i$ and
$\beta = 1$; the "temperature" $\tau$ in $e^{z_i / \tau}$ is $1/\beta$, and
$\log \sum_j e^{z_j}$ is minus the free energy, whose gradient is the mean and whose Hessian
is the covariance of the one-hot indicator — the same fluctuation–response identity as above.

The **ELBO is a free energy**. Fix data $x$ and define $E(z) = -\log p(x, z)$. Then
$Z = \int e^{-E(z)}\,dz = p(x)$ and $F = -\log p(x)$. For any $q$, the variational free
energy $F[q] = \mathbb{E}_q[E(z)] - H[q]$ equals $-\text{ELBO}$, and
$F[q] - F = \mathrm{KL}(q \,\|\, p(z \mid x)) \ge 0$. Maximising the ELBO is minimising a
variational free energy, and the bound's slack is the Gibbs inequality.

**Boltzmann machines** are Ising models with learned couplings:
$p(s) \propto \exp(\sum_{ij} w_{ij} s_i s_j + \sum_i b_i s_i)$. The gradient of the
log-likelihood in $w_{ij}$ is $\langle s_i s_j \rangle_{\text{data}} -
\langle s_i s_j \rangle_{\text{model}}$ — the positive and negative phases — which is the
fluctuation–response relation again, and the reason training needs sampling. Hopfield's
energy-function networks are the deterministic zero-temperature ancestor.

Reach for the machinery when you have a normalised exponential family, an intractable
normaliser, or a large system whose aggregate behaviour you want. Do not reach for it when
the object of interest is an individual trajectory, or when the system is small enough to
enumerate — as the four-spin example shows, enumeration is exact and the asymptotic language
of phases is then simply wrong.

## Limitations and common mistakes

**Finite systems have no phase transitions.** A finite $Z$ is analytic, so the sharp kink is
a limit, and simulations show rounded crossovers whose width shrinks with system size.
Reporting a "transition" at one lattice size without a finite-size scaling analysis is the
standard error.

**Mean field is not a mild approximation near criticality.** It gets $T_c$ wrong by tens of
percent, gets the exponents wrong below four dimensions ($\beta = 1/2$ instead of $1/8$ in
two dimensions), and invents transitions in one dimension.

**Sampling gets harder exactly where the physics is interesting.** Near $T_c$ the
correlation time of local-update Monte Carlo diverges with $\xi$, so the estimator whose
error bars look fine may be exploring one basin.

**The ML analogies are exact only as stated.** The softmax temperature is a knob, not a
thermodynamic temperature; a network has no heat bath, no conserved energy and no
equilibrium, and calling a loss a "free energy" says nothing unless you name the energy and
the reference measure. Results imported from spin-glass theory — capacity calculations,
loss-landscape claims — hold for the tractable model that was analysed, and their transfer
to trained networks is an empirical conjecture.

**Which entropy is the right one is genuinely contested** for small or bounded-energy
systems: the surface entropy $k_B \ln \omega(E)$ and the volume entropy $k_B \ln \Omega(\le E)$
disagree there, and with them the legitimacy of negative absolute temperature. For large
systems with unbounded energy the question does not arise.

## Variants and alternatives

The three ensembles are the standard variants, equivalent in the thermodynamic limit and not
before. **Quantum statistical mechanics** replaces the sum with a trace,
$Z = \operatorname{Tr} e^{-\beta \hat{H}}$, and indistinguishability yields Bose–Einstein and
Fermi–Dirac statistics rather than Boltzmann's. **Non-equilibrium statistical mechanics**
drops stationarity and works with master equations, linear response and fluctuation theorems.

For computing with a model there is a menu: exact solutions (transfer matrix in one
dimension, Onsager's in two), systematic expansions (high- and low-temperature series),
variational approximations (mean field, which the Gibbs–Bogoliubov inequality makes a genuine
one-sided bound on the free energy, and the Bethe approximation, exact on trees and usually
more accurate but not a bound in general), Monte Carlo (asymptotically exact, slow near criticality), and the
renormalization group (the only one that explains universality instead of computing around
it). **Large deviation theory** is the same content in probabilists' language, with the free
energy as a scaled cumulant generating function and entropy as a rate function.

## History and attribution

Maxwell's velocity distribution in the 1860s and Boltzmann's kinetic theory in the 1870s
established that thermodynamic quantities are statistical, against real opposition to the
atomic hypothesis; $S = k \log W$ is Boltzmann's. J. W. Gibbs named the subject and gave the
ensemble formulation in his 1902 book, and it is Gibbs's framework, not Boltzmann's, that
modern treatments use. Ernst Ising solved the one-dimensional chain in his 1925 thesis,
under Wilhelm Lenz, and found no transition — which was taken for years as evidence the model
was useless, until Onsager's exact solution of the two-dimensional model in 1944 showed
otherwise. Wilson's renormalization group in the early 1970s explained the critical
exponents that had by then been measured and could not be derived, work for which he received
the 1982 Nobel Prize. The maximum-entropy reading of the Boltzmann distribution is E. T.
Jaynes's, from 1957. The path into machine learning runs through Hopfield's 1982 energy-based
associative memory, which imported the spin-glass energy function wholesale, and the
Boltzmann machine of Ackley, Hinton and Sejnowski in the mid-1980s.

## Sources

MacKay's book is the best single bridge for this audience: it does the Ising model, Monte
Carlo, variational free energy and Boltzmann machines in one notation, with information
theory as the connecting language. The MIT 8.334 course is the field-theoretic treatment —
Landau–Ginzburg, scaling, critical phenomena — and is where the Ising model is taken
seriously as mathematics. Wilson's Nobel lecture is short, readable and the primary account
of why universality needed a new idea. Hopfield's paper is the point where the energy
function crossed into neural networks.

## Prerequisites and next connections

Read [Probability Theory](./probability-theory.md) first; expectations, variance and
independence are the whole vocabulary here. Hamiltonian mechanics supplies the classical
setting — phase space, conserved energy, Liouville's theorem — and is worth having for the
continuous ensembles, though the lattice models on this page need only counting.

Next, [Renormalization](./renormalization.md) is the direct sequel and carries out on the
Ising chain exactly the coarse-graining this page motivates.
[Bayesian Inference](./bayesian-inference.md) is where the free energy reappears as the
ELBO, [Probability and Computing](./probability-and-computing.md) covers the Markov chain
Monte Carlo that makes intractable partition functions samplable, and
[Concentration Inequalities](./concentration-inequalities.md) is the probabilist's version of
why macroscopic quantities have no visible fluctuations.
