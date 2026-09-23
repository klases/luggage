# Luggage

Shared skills and agents for Claude Code and pi. In Discworld, the Luggage follows its owner anywhere
and always holds what they need. It is friendly to its owners, and to anyone who writes a decent `SKILL.md`.

- `common/`: reviewed, for everyone.
- `personal/<handle>/`: each contributor's own.

## Install

### Claude Code

```sh
claude plugin marketplace add klases/luggage     # or the path to your clone
claude plugin install common@luggage
claude plugin install <handle>@luggage           # optional: someone's personal space
```

Skills show up as `/common:<skill>` and `/<handle>:<skill>`. Third-party marketplaces don't
auto-update by default. Turn it on under `/plugin` → Marketplaces, or run
`claude plugin marketplace update luggage`.

### pi

From your clone:

```sh
pi install ./common
pi install ./personal/<handle>                   # optional
```

Updates come from `git pull`.

## Contributing

Read `AGENTS.md`, then open the clone in Claude Code or pi and use the repo skills:

- `luggage-new-personal-space` sets up your space.
- `luggage-new-personal-skill` adds or imports a skill.
- `luggage-promote` moves a skill into `common/`.
- `luggage-remove` takes a skill out.
