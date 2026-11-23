# Investigation

Every investigating pass reads this before reviewing: the main reviewer, each specialist and a single compact pass. Judge what you find with the [review contract](review-contract.md).

A fresh reviewer gets the required outcome and raw evidence before the builder's persuasive conclusions. Fresh context reduces anchoring; it does not establish independent correctness.

Address each responsibility below (task, implementation, verification and maintainability), or explain concrete inapplicability.

## Task

Does the change do what was promised?

1. Build the obligation list. Take every requirement from the trusted spec (for an OpenSpec change: proposal, design decisions, spec delta and tasks) and every acceptance criterion in the issue or PR description. Acceptance criteria in a PR description are the author's statement of intent: compare them with the code, and with the spec where both exist.
2. For each obligation, record where the change meets it, where it is missing or contradicted, or which stacked PR or later task owns it. A gap between a stated obligation and the code is a finding. A missing or ambiguous obligation is an owner question.
3. List the decisions the spec still leaves open and the tasks marked done that the change does not carry out. Report the ones this change was meant to close.
4. Find misread requirements, contradictions, unstated assumptions and implementation-invented obligations. Distinguish owner questions from demonstrated violations. Do not redesign the product or remove requirements unilaterally.

## Implementation

Trace changed behavior through definitions, callers, state and error paths. Seek reachable counterexamples. The diff starts the investigation, it does not bound it.

1. Compare base and head for behavior gained, changed and removed. Check whether the goal requires each new obligation and whether it changes expectations the owner accepted; a disputed requirement is an owner decision unless trusted evidence establishes a violation.
2. Follow symbols into direct and indirect callers, implementers, registrations, public interfaces and sibling paths. Where a symbol disappeared, trace the behavior by its previous caller or data shape. Compare guards and fallbacks on both sides.
3. When the design, spec or code names one path for a behavior (a copy, refund, cancel, export or consumer), search for every path that produces or consumes the same records. List each one in the coverage record as opened or excluded.
4. Check caller assumptions about ordering, ownership, defaults, retries, errors, cancellation and cleanup. Trace stored records, cache keys, messages, migrations and mixed-version readers or writers where applicable. For a minimal patch, follow the changed invariant until its affected consumers are understood.
5. Decide whether each failure was introduced, became reachable through a new path, or already occurred on the base, and which unaffected callers or controls bound the impact.
6. Keep a coverage record of the paths and aspects you opened. Name exclusions, and uncertainty where search, history, runtime configuration or external contracts are unavailable.

## Verification

For each material claim, identify the observable result and the source of its expected value.

1. Check whether the assertion follows the contract or repeats implementation logic.
2. Before saying a test catches a fault, check that it can fail for it. Follow mocks and fixtures to see whether they bypass the boundary that matters, and check the runner's environment: time zone, environment files and defaults that mirror production. Name the fault that would still pass.
3. Name the smallest missing negative, inverse, boundary, state-transition or property check, and whether unchanged tests already cover it.
4. Keep tests inspected, tests run and fault sensitivity measured as distinct evidence. Use [test evidence](test-evidence.md) when you report an observed run, retain a test-gap defect or run a mutation.

## Maintainability

Will the next developer understand, change and test this code without strain? Judge the changed lines and existing code the change makes harder to follow; pre-existing issues the change does not touch are out of scope.

1. **Readability.** Find names, control flow and data shapes that mislead or hide intent: a name that says less than or something other than what the code does, nesting that buries the main path, a magic value, a comment that restates code while the reason goes unstated.
2. **Cognitive load.** Count what a reader must hold at once to follow one behavior: flags and modes threaded through layers, state spread across files, implicit ordering, conditionals over a type that a map or enum entry would express, an abstraction used once.
3. **Testability.** Find what blocks a focused test of the changed behavior: a hidden clock, environment or global; logic tangled with I/O; a dependency created inside instead of passed in; a test that must mock past the boundary it claims to check. Name the seam that would make the behavior testable.

Each suggestion names the reader's cost in concrete terms ("to know whether `refund` emails, follow 3 flags through 2 files"), the location, and a concrete rewrite that preserves behavior. A preference without a nameable cost is not a suggestion. Rate it with a priority from the [review contract](review-contract.md#maintainability-suggestions); report at most five, highest reader cost first, and count the rest in coverage.
