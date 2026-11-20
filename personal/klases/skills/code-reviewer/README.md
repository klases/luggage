# Code reviewer

Review a change's purpose, implementation, impact and verification. Start with [SKILL.md](SKILL.md).

This replaces the former `vimes` skill. The old skill is removed rather than retained as an alias.

- **Interactive** — “Review my staged changes for behavior regressions and test gaps.”
- **Private PR report** — “Review this pinned PR and return a private report here. Focus on authorization and changed callers.”
- **Coding-agent handoff** — “Review this frozen patch against the task. Return defects and unresolved questions to the coordinator.”

Choose a compact pass, focused specialists or an independent challenge where the evidence warrants it and the host permits it. A bare invocation asks for missing scope and focus. See [workflow details](references/workflows.md).

To load explicitly in Claude Code, Codex or Hermes, point the host at this package's SKILL.md and let it read the references from the same artifact. In Claude Code, the intended native skill name after Klases plugin discovery is `/klases:code-reviewer`. The adjacent Claude agents add read/search-only investigation roles. See [host instructions and activation limits](references/hosts.md).

The [evaluation harness](evaluation/README.md) records inputs, invocation reservations and report coverage. No comparative evaluation or native activation result is established by the package.
