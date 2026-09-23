---
name: luggage-check-personal
description: Check a skill folder for ties to one person or one machine (who wrote it, how their computer is set up, what they keep private, examples lifted from their work) and propose neutral wording. Opt-in; no other step requires it. Use when someone asks to "check a skill for personal ties", "is this tied to me", "make this skill portable", "scrub <x>", or before importing or promoting a skill.
---

# Check a skill for personal ties

A skill in luggage should work for anyone who installs it. This check reads one skill folder
against the principles below and reports every line that doesn't meet them. It's opt-in.

Nothing is changed until the user approves the proposal in step 4.

## The test

> Would this line mean the same thing, and still be true, for a stranger on a fresh machine?

Every principle is that question asked from a different side. Judge each line by the principle,
not by whether it matches a pattern you have seen before.

## Principles

1. **Written for a stranger.** Anything that only makes sense if you know the author is a tie:
   who they are, their team or employer, their other projects, how the skill came to be.
2. **Assumes nothing about the machine.** A location, an installed setup, an account or a
   configuration that exists because of how the author set up their computer is a tie. Picture a
   fresh install that has only what the skill says it needs.
3. **Self-contained.** The skill relies on its own folder, the thing it works on, and what it
   declares it needs. Reaching past that, to the author's other skills, instruction files or
   notes, is a tie. Where it needs the user's context, it uses what the harness already provides
   or asks for it, instead of naming where that context lives.
4. **Examples are invented, not lifted.** Names, numbers, paths and anecdotes taken from the
   author's real work leak context even when they are harmless.
5. **Nothing private.** No secrets, personal data, or internal names of organisations, customers
   or systems.
6. **A dependency is not a tie.** A generally available tool that the skill uses on purpose is a
   dependency, and so is a feature that only one agent harness provides. List them separately;
   the user decides whether to keep each.
7. **Generalize, don't delete.** A fix keeps the behaviour and replaces the specific thing with
   its role: a person's name becomes "the user", one machine's command becomes "the project's
   documented command". Remove a line only when it exists purely for the author.

## Steps

1. **Pick the target**: a path to a skill folder, or the name of a skill in this repo. Done when
   the folder exists and holds a `SKILL.md`. Say whether it's inside this clone: a folder outside
   it is reported on, never edited.
2. **Learn what's specific here.** Before reading the skill, gather from the environment what
   would identify this author and this machine: their identity in version control and in any
   logged-in accounts, the user name and host name, the home directory, and the places they keep
   their work. Search every file in the folder for them. This is a first pass that finds the
   obvious; an empty search proves nothing.
3. **Read every line of every file**, scripts and references included, against the principles.
   For each finding, note `file:line`, the principle it breaks, why, and a replacement
   (principle 7), or "remove" with the reason. Put dependencies (principle 6) in a list of their
   own. When you can't tell whether something is a tie or a dependency, make it a question for
   the user instead of guessing.
4. **Report, propose, then wait.** Show:
   - findings grouped by principle, each with `file:line`, the quoted text and the proposed change
   - dependencies, for the user to keep or drop
   - open questions
   - what was checked: the files read, and each principle that turned up nothing

   For a secret, give its `file:line` and kind, never its value. For the step 2 search, name the
   kinds of terms searched, not their values. Done when the user has said
   which changes to make. For a target outside this clone, stop here and give the list to apply
   at the source or after import.
5. **Apply** exactly the approved changes.
6. **Re-check and report.** Search the edited files again for what step 2 found, and read the
   changed lines against the principles. `scripts/validate.sh` exits 0. Report the files changed,
   then propose a commit under the rules in `AGENTS.md`. Commit only on the user's yes, and push
   only when they ask.
