# Selective specialists

Pick aspects by affected behavior and user intent, not only changed filenames. A compact review can cover multiple aspects in one pass.

On a large or high-risk change, Behavioral tests and Security run by default. Opt out of one only when the change has no surface for it: no executable behavior for Behavioral tests, nothing in Security's trigger for Security. Record the opt-out and its reason in coverage. A pass's claim that the tests or guards already suffice is the specialist's question to check, not a reason to opt out. Then add up to two more aspects whose triggers appear in the change.

When an independent pass is useful and the host permits it, give each specialist a bounded assignment, pinned inputs, trusted policy, allowed tools and a concrete question.

| Aspect | Trigger | Investigation |
|---|---|---|
| Behavioral tests | Tests added, changed or missing for changed behavior; mocks or fixtures at a boundary. | Identify what incorrect behavior could pass and where existing checks assert the contract. |
| Errors and recovery | A catch, fallback, retry, timeout, external call, queue or transaction boundary. | Follow failures through catches, fallbacks, exhausted retries and cleanup. Check whether best-effort behavior matches the contract and remains diagnosable. |
| Types and state | A new or changed type, schema, contract, state machine or persisted shape. | Find a reachable invalid state or an invariant that the new API shifts onto callers. Consider transition rules and compatibility. |
| Docs and comments | Changed docs, comments or API descriptions, or behavior that existing docs describe. | Check factual statements and examples against actual behavior, including untouched documentation made stale by the change. |
| Simplicity | A new abstraction, duplication or indirection. | Identify avoidable complexity with a concrete maintenance or correctness consequence. Explain the behavior a simplification must preserve. |
| Security | A trust boundary, authorization, sensitive data (including what is logged), secrets, dependency or execution authority. | Trace the authority boundary and the strongest applicable guard. Use [security](security.md). |

Return explored paths, candidates, disconfirming evidence and uncovered questions. The coordinator reconciles the candidates using the [review contract](review-contract.md). A challenger gets a bounded claim or verification hypothesis, tests its prerequisites against pinned evidence and may leave it unresolved. Record absence of an independent pass when relevant. Keep all passes within the parent authorization and invocation budget.
