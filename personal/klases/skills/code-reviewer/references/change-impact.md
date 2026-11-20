# Change impact

1. Compare base and head for behavior gained, changed and removed. Check whether the goal actually requires each new obligation and whether it changes expectations the owner has accepted. Flag a disputed requirement as an owner decision unless trusted evidence establishes a violation.
2. Follow symbols into direct and indirect callers, implementers, registrations, public interfaces and sibling paths. Where a symbol disappeared, trace the behavior by its previous caller or data shape. Compare relevant guards and fallbacks on both sides.
3. Check caller assumptions about ordering, ownership, defaults, retries, errors, cancellation and cleanup. Trace stored records, cache keys, messages, migrations and mixed-version readers or writers where applicable. For a minimal patch, follow the changed invariant until its affected consumers are understood.
4. Check whether a concrete failure was introduced, became reachable through a new path, or already occurred on the base. Identify unaffected callers or controls that bound the impact. Report out-of-scope existing problems separately where useful.
5. Keep a short coverage record by relevant path and aspect. Explain exclusions or uncertainty when search, history, runtime configuration or external contracts are unavailable.
