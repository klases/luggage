# Review contract

Start with the requested outcome, trusted requirements at the applicable revision and the immutable comparison. Read raw artifacts before the builder's verdict when possible. Open questions about intent belong with the owner. Identify the requirement or observable contract that supports each defect claim.

For each finding give a stable ID, the smallest relevant location, the reachable trigger or initial state, the causal trace, the consequence and the change or check that would address it. Include cross-file locations where an unchanged caller or guard establishes the result. Mark whether the issue was introduced, newly exposed or already reachable.

Severity describes impact under stated prerequisites. Use **critical** for an established catastrophic or broad compromise, **high** for material unauthorized access, data loss or similarly serious failure, **medium** for a meaningful ordinary-workflow or required build/check failure, and **low** for bounded minor defects. Explain actual reachability and limiting conditions; these labels are not a calibrated risk score. A privileged policy refresh or unknown external consumer must stay explicit rather than being presented as a present ordinary-user exploit. Confidence describes how well the claim is supported and where uncertainty remains. Identify the evidence as static, observed or mixed. Give exact observations and their scope when available. Use assumptions explicitly and seek the strongest counterevidence before retaining a finding. Static evidence can establish a defect, and an executed command does not by itself make a finding serious.

Mark a retained finding **blocks-merge** when, on a reachable path, it violates a SHALL or SHALL NOT requirement, breaks a required build, synth, deploy or check, or causes data loss or unauthorized access. The flag is separate from severity: a required-build failure stays medium and still blocks. A finding that would block only depending on one owner's answer is an owner question, not a blocker.

## Maintainability suggestions

A maintainability suggestion is a candidate of kind `maintainability`, with IDs `M1`, `M2`, … (defects use `F1`, `F2`, …). It has a priority instead of a severity and never blocks merge or produces request-changes:

- **should**: the cost recurs for every reader or blocks a focused test of the changed behavior.
- **consider**: a real but local cost, such as one misleading name or one buried branch.
- **nit**: a small improvement that is still worth the author's time.

Suggestions use the same evidence, confidence and dispositions as defects. A suggestion that turns out to hide a reachable fault becomes a defect with its own severity.

## Evidence

- Seek disconfirming evidence: other callers, guards, intended behavior and existing tests. A style preference or speculative concern is not a confirmed defect.
- Reject or overrule a candidate only with evidence from the pinned code that defeats its trigger or consequence. Precedent elsewhere in the codebase decides origin (pre-existing or mixed), not whether to report. The PR description and the author's stated intent are claims, not counterevidence. When rejecting because "the code handles this", confirm the handling is correct.
- A claim about library, framework or runtime behavior counts as evidence only when you read the source or authoritative documentation for the version in use. Otherwise mark it unresolved with the fact that would decide it. Recall is not evidence.

## Dispositions

Keep each candidate ID and its disposition through every pass and the synthesis:

- **Retain** with evidence, severity (or priority for a suggestion), confidence and whether it blocks merge.
- **Duplicate** with a direct retained parent and a reason the two share a cause.
- **Reject** with the evidence that defeats the claim.
- **Unresolved** with the missing fact or check that would decide it.

A challenger failing to refute a claim does not confirm it; an unsupported rejection does not resolve it.

Use zero findings when warranted. Record the files and aspects covered, intentional exclusions, and blocked or unfinished work. Missing policy or evidence can limit the verdict. If the inputs drift, mark affected results stale and rebind any follow-up to a new comparison.
