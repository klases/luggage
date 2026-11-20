# Review contract

Start with the requested outcome, trusted requirements at the applicable revision and the immutable comparison. Read raw artifacts before the builder's verdict when possible. Open questions about intent belong with the owner. Identify the requirement or observable contract that supports each defect claim.

For each finding give a stable ID, the smallest relevant location, the reachable trigger or initial state, the causal trace, the consequence and the change or check that would address it. Include cross-file locations where an unchanged caller or guard establishes the result. Mark whether the issue was introduced, newly exposed or already reachable.

Severity describes impact under stated prerequisites. Use **critical** for an established catastrophic or broad compromise, **high** for material unauthorized access, data loss or similarly serious failure, **medium** for a meaningful ordinary-workflow or required build/check failure, and **low** for bounded minor defects. Explain actual reachability and limiting conditions; these labels are not a calibrated risk score. A privileged policy refresh or unknown external consumer must stay explicit rather than being presented as a present ordinary-user exploit. Confidence describes how well the claim is supported and where uncertainty remains. Identify the evidence as static, observed or mixed. Give exact observations and their scope when available. Use assumptions explicitly and seek the strongest counterevidence before retaining a finding.

Keep each candidate ID and its disposition:

- **Retain** with evidence, severity and confidence.
- **Duplicate** with a direct retained parent and a reason the two share a cause.
- **Reject** with the evidence that defeats the claim.
- **Unresolved** with the missing fact or check that would decide it.

Use zero findings when warranted. Record the files and aspects covered, intentional exclusions, and blocked or unfinished work. Missing policy or evidence can limit the verdict. If the inputs drift, mark affected results stale and rebind any follow-up to a new comparison.
