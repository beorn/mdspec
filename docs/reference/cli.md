# CLI Reference

## Usage

```bash
mdspec [options] <patterns...>
```

`patterns` can be file paths or glob patterns (e.g., `tests/**/*.spec.md`).

## Options

| Flag            | Description                                             | Default              |
| --------------- | ------------------------------------------------------- | -------------------- |
| `-u, --update`  | Update snapshots (replace expected output with actual)  | `false`              |
| `--hide-body`   | Hide markdown body text in output                       | `false`              |
| `--no-trunc`    | Disable truncation of long lines                        | truncate at 70 chars |
| `--dots`        | Dots reporter -- dots for passing, details for failures | `false`              |
| `--tap`         | TAP reporter -- output Test Anything Protocol format    | `false`              |
| `-V, --version` | Show version number                                     |                      |
| `-h, --help`    | Show help                                               |                      |

## Examples

```bash
# Single file
mdspec tests/example.spec.md

# Multiple files with glob
mdspec tests/**/*.spec.md

# Update snapshots
mdspec --update tests/**/*.spec.md

# Minimal output
mdspec --dots tests/**/*.spec.md

# CI-friendly TAP output
mdspec --tap tests/**/*.spec.md
```

## Reporters

### Default (markdown)

Prints results as formatted markdown with headings from the test document, pass/fail indicators, and colored diffs for failures.

### Dots (`--dots`)

Prints a `.` for each passing test, with full details only on failure. Compact output for large test suites.

### TAP (`--tap`)

Outputs [Test Anything Protocol](https://testanything.org/) format for integration with TAP consumers.

## Debug Namespaces

Enable with the `DEBUG` environment variable using the [debug](https://www.npmjs.com/package/debug) package:

```bash
DEBUG='mdspec:*' mdspec tests/example.spec.md       # All debug output
DEBUG='mdspec:runner' mdspec tests/example.spec.md   # Test execution only
DEBUG='mdspec:files' mdspec tests/example.spec.md    # File creation only
DEBUG='mdspec:session' mdspec tests/example.spec.md  # Session state only
```

| Namespace        | What it shows                                  |
| ---------------- | ---------------------------------------------- |
| `mdspec:runner`  | Test file discovery, parsing, and execution    |
| `mdspec:files`   | Helper file creation from `file=` blocks       |
| `mdspec:session` | Session state management (env, cwd, functions) |

## Exit Codes

| Code | Meaning                  |
| ---- | ------------------------ |
| `0`  | All tests passed         |
| `1`  | One or more tests failed |
| `2`  | No test files found      |
