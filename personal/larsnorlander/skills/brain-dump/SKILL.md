---
name: brain-dump
description: Reflect each chunk of the user's thinking back, holding analysis and action until the user says they are done, so both hold one aligned model. Use when the user invokes /brain-dump, says "brain dump", "let me think out loud", or announces they will explain something in chunks or batches and say when finished.
---

# Brain dump

The user is thinking out loud. Each message is a chunk of a picture that is not
finished yet, so treating one as a complete request produces a long answer, a
pile of questions, or a long-running action that the next chunk overtakes. This
mode replaces that with one job: reflect each chunk back until the user has the
whole picture out and the two of you hold the same model.

The mode lasts until the user finishes or switches away (see Leaving). Every
turn in between follows the rules below, whatever the chunk looks like.

Optimize for the user's thinking and steering. Two priorities, in order:
accuracy, then concise structure. Nothing else.

## Entering

Acknowledge in a few lines: you will distill each chunk back, hold your own
views, and wait for the user to say they are done. Then wait for the first
chunk. Done when the user has seen how you will behave and can correct it.

## Each chunk

Reply with a **distillation**: the chunk restated in the user's own terms, at
the length the chunk needs. A long chunk gets a longer distillation; a short one
stays a sentence. It contains only what the user said. Analysis, options,
questions and suggestions wait.

End with a one-word prompt to continue.

Contradictions and changes of mind are normal in a dump. Handle them by weight:

- **Breaks an earlier premise**: say so in one sentence right away, then distill
  the chunk as stated. The user decides which version stands.
- **Anything smaller**: hold it. Held items surface at a recap, at a conflict
  check, or at the end.

When a chunk gives you a doubt or disagreement of your own, add a **flag**: one
line naming the doubt with its reason, argument held. A flag is judgement only.
If confirming it would take a tool, state the doubt and let the user decide
whether to look. Flags are early drift signals; they are cheaper than unwinding
drift later.

## Requests inside the dump

The user may ask for things mid-dump. Each is answered short and bounded, and
then the dump continues.

- **Recap**: reflect the whole model as declared so far, structured, nothing
  beyond it. Held conflicts and flags go in a separate section after the model,
  never mixed into it. A recap is a drift check, not an ending.
- **Conflict check**: name each held item in a line. No elaboration.
- **What's missing?**: list the gaps you see in the model, one line each.
- **Explain what you meant**: expand the distillation that oversimplified.
- **A bounded task** (check a file, read a page): do just enough to understand
  what the user is pointing at, then distill what you learned. If the request is
  too vague to bound, ask one bounded question first.

When held items pile up, offer a recap in one line. The user decides.

## Leaving

- **Finished**: the user says they are done. Give a recap, with all held items
  in the separate section. Then offer two paths: resolve the held items, or start
  a normal conversation on the aligned model. If they choose to resolve, take
  the items one at a time, waiting on each.
- **Switching**: the user needs to pick something up or says "let's switch
  gears". Hold the new request. Give a recap first, then ask how to persist
  (below), and only then act on what they asked.

## Persisting

Offer, never assume. Options, listing only those that exist here:

- Project memory.
- A note in the current repo.
- A note in a location the user's own setup already names, such as a notes
  directory their instructions declare.

Write what the user picks, in the recap's shape.
