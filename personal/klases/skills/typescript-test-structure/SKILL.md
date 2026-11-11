---
name: typescript-test-structure
description: Lay out TypeScript unit and integration tests as typed, table-driven arrange-act-assert, the way Go table tests read. Use when writing tests in a TypeScript project, restructuring existing tests for readability, or reviewing how a test file is laid out.
---

# TypeScript test structure

A reader of a test file sees three things without scrolling through setup: a **table** of what is
covered, one arrange-act-assert **shape** per test, and an **expected** value per case.

## Steps

1. **Settle the conventions.** For each item in [references/conventions.md](references/conventions.md),
   look for a documented convention: the project's agent instructions (`AGENTS.md`, `CLAUDE.md`),
   contributing guides, testing docs, repo skills, and lint and formatter config.
   - Documented: follow it.
   - Not documented: list every such item and ask the user, once, how to settle them:
     1. **point to a convention**: a doc, a file, or a rule they keep elsewhere;
     2. **derive the house pattern**: count how the existing tests do it, show the counts and two
        example files per item, and follow the dominant pattern once the user confirms;
     3. **use this skill's defaults**, from references/conventions.md.

   Done when every item has a source: documented, pointed to, derived and confirmed, or default.
2. **Settle the scope.**
   - Writing tests: the behaviour under test.
   - Restructuring on a branch: the tests the branch adds or changes, from `git diff <base>...HEAD`.
     The base is the branch below in a stacked PR, otherwise the remote's default branch
     (`git symbolic-ref refs/remotes/origin/HEAD`). Older tests, and files owned by other PRs in a
     stack, stay as they are.
   - Reviewing: the files named.

   Done when you can list every test in scope by file and name.
3. **Pick a layout per group of cases** from the table below, and read its example in `examples/`
   before writing it. Done when every test in scope has a layout, and each standalone test has a
   one-line reason.
4. **Write or restructure** under the rules below. Restructuring changes structure only: the code
   under test, the test-data factories' defaults, and the strength of every assertion stay.
5. **Verify.** Run the touched tests green, then make each table go **red** once: break one row's
   expected value, then break the subject (include a mutant that adds a field to the result) and
   watch the right tests fail. Run the project's lint and type check on the touched files. Done
   when every table has been seen red and everything is green again.
6. **Report**: per file, the layouts used, the standalone tests and why, any assertion you could
   not keep, the verify results, and where each convention came from (step 1).

## Choosing a layout

| The cases differ in... | Layout | Example |
|---|---|---|
| Input data only | **Value table** | `01-value-table.test.ts` |
| The kind of outcome (a value, nothing, an error) | **One table per outcome** | `02-outcome-tables.test.ts` |
| Inputs, but the test makes several `expect`s on one call | **Hidden table**, turned into rows | `03-hidden-table.test.ts` |
| What exists before the call | **Scenario table** | `04-scenario-table.integration.ts` |
| Fixtures without a result, the full result, or setup a row cannot state | **Unaligned rows** and **standalone tests** | `05-unaligned-scenarios.integration.ts` |

Start from a value table, fall back to a scenario table, and keep a test standalone when it cannot
share the call or the check. A table earns its place at three or more rows, or when more are
clearly coming.

The examples run against an invented subject in `examples/subject/`: `npm install && npm test` in
`examples/`.

## Rules

### Tables

- **Rows are typed objects** run by `it.each([...])` with a `'$name'` title. Row interfaces and
  type aliases sit at the top of the file.
- **A table sits next to the `it.each` that runs it**, named after what it tests
  (`lineTotalCases`). A single-table file may keep it at the top.
- **Rows read as data**: literal values, or calls to declarative builders (`saved({ total: 900 })`,
  a test-data factory). Values known only at run time, such as generated ids and fixture entities,
  are filled in by the body.
- **Names are full sentences**, so existing test names survive a restructure.
- **The formatter lays out rows.**

### Arrange, act, assert

- Three blocks separated by blank lines; the project's spacing lint decides any more.
- **One call to the subject, one `expect`.** Building the expected value inside the `expect` is
  fine.
- A helper for the call earns its place when a table shares it.

### Expected values

- **Rows hold only the fields the case is about**; a curried helper adds what every row repeats
  (fixture ids) and returns a typed value.
- **Partial checks use `toMatchObject` with typed expected values**: it matches nested partials and
  keeps array lengths exact.
- **One standalone test pins the full result** with an exact `toEqual`; partial checks let an extra
  field through.
- **Unordered results are sorted in the act helper**, by the key the rows line up with.
- **`expected` lines up with `given`**; `null` marks a fixture absent from the result.

### Setup and fixtures

- **Curried setup**: a row calls a builder with what to save, and the body hands it the fixture
  entity later (`saved(order)(orderId)`).
- **Setup runs in the order the row gives**: `await` in a loop whenever order can affect the
  result.
- **Fixture ids are sorted after parallel creation**, or created one after another, when rows line
  up with fixtures by index.
- **Helpers fail loudly**: the setup helper throws when a row asks for more fixtures than exist,
  and a helper reaching into a result asserts its length first.
- **A case about save order across entities stays standalone**, unless the row states that order.
- Setup helpers compose the project's test-data factories; cleanup stays in `afterEach`/`afterAll`.

## Guardrails

- Keep every assertion's strength; a case that would lose part of what it proves stays standalone.
- Conditionals and computation live in the body or a helper, never in a row.
- A failure case goes in a failure table, never as a flag in a success table.
