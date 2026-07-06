# CLAUDE.md

## Working rules

- **Always use the `ponytail` skill.** Write the leanest code that works: reuse
  what's in the repo, prefer stdlib/native/existing deps over new ones, one line
  over fifty. No speculative abstractions, no scaffolding "for later". Fix bugs at
  the root cause, not the symptom.
- **Be token-efficient.** Short answers, code first. Read only what the change
  touches. No essays, no feature tours, no restating what the diff already shows.
- **Use the `ui-ux-pro-max` skill for every frontend task** — creating, improving,
  or modifying any UI in the app (pages, components, styles, layout, color,
  typography, responsive behavior). Run its design-system / domain search before
  writing UI code and follow its accessibility and interaction rules.
- **Follow best practices** for React, TanStack Router, and Firebase as already
  used in this codebase. Match the surrounding code's conventions and patterns.
