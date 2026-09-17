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

comments --flagged-only         # only show comments the heuristics flag as verbose/noisy
comments --json                 # machine-readable output
```

Each comment is shown with its line number and a preview. Comments the heuristics
consider verbose or filler (long, multi-line paragraphs, "this function does X" narration,
TODO/NOTE labels, etc.) are marked with ⚑ and a reason, but every new comment is listed
by default so nothing gets missed — including quick reminders like `// TODO` that
shouldn't survive to the PR.

## Supported languages

C-style (`//`, `/* */`): JS/TS, Java, C/C++, C#, Go, Rust, Swift, Kotlin, PHP, Scala, Dart
Hash-style (`#`): Python, Ruby, Shell, YAML, TOML, Perl, R
Also: HTML/XML/Vue/Svelte (`<!-- -->`), CSS/SCSS/Less, SQL, Lua

## Known limitations

Comment detection uses a lightweight character-level scanner, not a real parser, so
edge cases like JS regex literals (`/.../`) or Rust lifetimes (`'a`) can occasionally
confuse it. It's built for quickly reviewing what changed, not as a linter.
