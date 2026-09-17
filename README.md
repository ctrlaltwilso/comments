# comments

Lists comments added in your changes so you can review them before opening a PR.

## Install

```
bun link
```

This makes the `comments` command available globally (from any git repo).

## Usage

```
comments                        # new comments in uncommitted changes (staged + unstaged) vs HEAD
comments --staged               # new comments staged for commit only
comments --base main            # new comments in your working tree vs another branch/commit
comments --base main --staged   # new comments staged for commit vs another branch/commit

comments frontend/ backend/api/          # restrict to specific files/directories
comments frontend/ backend/ --save-paths # remember those paths as the default for future runs

comments --flagged-only         # only show comments the heuristics flag as verbose/noisy
comments --json                 # machine-readable output
```

Each comment is shown with its line number, a code-context preview, and a
preview of the next line of code. Comments the heuristics consider verbose or
filler (long, multi-line paragraphs, "this function does X" narration,
TODO/NOTE labels, etc.) are marked with ⚑ and a reason, but every new comment
is listed by default so nothing gets missed — including quick reminders like
`// TODO` that shouldn't survive to the PR.

### Restricting to paths you actually own

If you only work in part of the repo, pass the paths you care about once with
`--save-paths` and they're saved to `.commentsrc.json` in the repo root — after
that, plain `comments` (no arguments) uses them automatically. Pass paths
explicitly on any run to override the saved defaults for that run.

### Reviewing interactively

```
comments --interactive     # or -i
```

Walks through each new comment one at a time with surrounding code context and
lets you decide:

- `k` keep it (default — just press Enter)
- `d` delete it from the file
- `e` open it in `$EDITOR` at that line, so you can reword it
- `s` skip the rest of this file
- `q` quit

This edits the real files on disk, so it only works against the working tree
(don't combine it with `--staged`; the default mode already includes staged
changes).

## Supported languages

C-style (`//`, `/* */`): JS/TS, Java, C/C++, C#, Go, Rust, Swift, Kotlin, PHP, Scala, Dart
Hash-style (`#`): Python, Ruby, Shell, YAML, TOML, Perl, R
Also: HTML/XML/Vue/Svelte (`<!-- -->`), CSS/SCSS/Less, SQL, Lua

## Known limitations

Comment detection uses a lightweight character-level scanner, not a real parser, so
edge cases like JS regex literals (`/.../`) or Rust lifetimes (`'a`) can occasionally
confuse it. It's built for quickly reviewing what changed, not as a linter.
