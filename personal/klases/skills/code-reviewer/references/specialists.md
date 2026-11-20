# Selective specialists

Pick aspects by affected behavior and user intent. A compact review can cover multiple aspects in one pass. When an independent pass is useful and the host permits it, give each specialist a bounded assignment, pinned inputs, trusted policy, allowed tools and a concrete question.

| Aspect | Investigation |
|---|---|
| Behavioral tests | Identify what incorrect behavior could pass and where existing checks assert the contract. |
| Errors and recovery | Follow failures through catches, fallbacks, exhausted retries and cleanup. Check whether best-effort behavior matches the contract and remains diagnosable. |
| Types and state | Find a reachable invalid state or an invariant that the new API shifts onto callers. Consider transition rules and compatibility. |
| Docs and comments | Check factual statements and examples against actual behavior, including untouched documentation made stale by the change. |
| Simplicity | Identify avoidable complexity with a concrete maintenance or correctness consequence. Explain the behavior a simplification must preserve. |
| Security | Trace the authority boundary and the strongest applicable guard. Use [security](security.md). |

Return explored paths, candidates, disconfirming evidence and uncovered questions. The coordinator reconciles the candidates using the [review contract](review-contract.md). A challenger gets a bounded claim or verification hypothesis, tests its prerequisites against pinned evidence and may leave it unresolved. Record absence of an independent pass when relevant. Keep all passes within the parent authorization and invocation budget.
