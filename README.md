# usage-line

A Claude Code mod that shows three bars above the message box:

![Three bars above the Claude Code message box: Context 21%, Session 86% resetting in 37m, Weekly 11% resetting in 2d 6h.](docs/preview.svg)

- **Context:** how full the session's context window is, in tokens.
- **Session:** how much of the 5-hour limit is used, and when it resets.
- **Weekly:** how much of the weekly limit is used, and when it resets.

A bar turns amber from 70% and red from 90%. The terminal shows the same figures as text.

## Settings

**Show usage in the terminal** (`showInTerminal`, off by default) can be turned on in `/config` to show the figures as text in the terminal. The desktop app shows the bars either way.

## Install

Type this at the Claude Code prompt:

```
/plugin install usage-line --marketplace thomthom/claude-usage-line
```

Answer `y` to add the marketplace, then pick a scope. New sessions show the rings.

## Update

```
claude plugin update usage-line
```

## Develop

```
claude plugin validate .
claude plugin test .
```
