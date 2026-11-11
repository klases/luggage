# Conventions to settle

Settle every item before writing (step 1 of the skill). For each one: where a documented
convention usually lives, how to count the undocumented house pattern, and this skill's default.

Search the test files only: `rg -g '*.test.ts' -g '*.spec.ts' -g '*.integration.ts' -c '<pattern>'`,
summed across files. Add the project's own test suffixes if it uses others.

| Item | Where it is documented | Counting the house pattern | Default |
|---|---|---|---|
| Result and expectation names | agent instructions, testing docs | `const result =`, `const expected =`, `const got =`, `const want =`, `const actual =` | `result`, `expected` |
| Table form | testing docs, repo skills | `it.each(` with `[` vs `` it.each` ``; object rows vs array rows | `it.each([...])` with object rows |
| Table name and place | testing docs | names ending in `Cases`; tables inside vs above `describe` | `<subject>Cases`, next to its `it.each` |
| Test titles | testing docs | `'$name'` vs printf `%s` titles | `'$name'` with full sentence names |
| Where test files live | agent instructions, test runner config (`testMatch`, `include`) | files under `__tests__/` vs beside the source | `__tests__/`, `*.test.ts` for unit, `*.integration.ts` for integration |
| Object types | lint config, agent instructions | `interface X {` vs `type X = {` | `interface` for object shapes, `type` for unions, functions and mapped types |
| Array types | lint config (`array-type`) | `Array<` vs `[]` in type positions | `Array<T>` |
| Partial matching | testing docs | `toMatchObject(` vs `expect.objectContaining(` | `toMatchObject` with typed expected values |
| Spacing and line width | formatter and lint config | read the config, not the code | the formatter's output, blank lines between arrange, act and assert |
| Test-data factories | test-data modules, testing docs | files named `test-data`, `factories`, `fixtures`; functions named `create*` | reuse what exists; add a `create<Entity>(properties)` factory beside them |
| Test runner | `package.json` scripts and config | `jest`, `vitest` in dependencies | the one installed |

## Asking the user

When items are undocumented, ask once, listing every undocumented item with the three choices from
step 1. When the user picks "derive the house pattern", show for each item the counts and two
example file paths, then wait for their confirmation before following it. A count close to even is
no pattern: present it as a tie and let the user choose.

## Recording the outcome

The report (step 6) names the source of each convention. When a convention was derived or
defaulted, suggest where the project could document it, so the next run finds it in step 1.
