# CLI Reference

## Usage

```bash
mdtest [options] <patterns...>
```

`patterns` can be file paths or glob patterns (e.g., `tests/**/*.test.md`).

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `-u, --update` | Update snapshots (replace expected output with actual) | `false` |
| `--hide-body` | Hide markdown body text in output | `false` |
| `--no-trunc` | Disable truncation of long lines | truncate at 70 chars |
| `--dots` | Dots reporter -- dots for passing, details for failures | `false` |
| `--tap` | TAP reporter -- output Test Anything Protocol format | `false` |
| `-V, --version` | Show version number | |
| `-h, --help` | Show help | |

## Examples

```bash
# Single file
mdtest tests/example.test.md

# Multiple files with glob
mdtest tests/**/*.test.md

# Update snapshots
mdtest --update tests/**/*.test.md

# Minimal output
mdtest --dots tests/**/*.test.md

# CI-friendly TAP output
mdtest --tap tests/**/*.test.md
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
DEBUG='mdtest:*' mdtest tests/example.test.md       # All debug output
DEBUG='mdtest:runner' mdtest tests/example.test.md   # Test execution only
DEBUG='mdtest:files' mdtest tests/example.test.md    # File creation only
DEBUG='mdtest:session' mdtest tests/example.test.md  # Session state only
```

| Namespace | What it shows |
|-----------|---------------|
| `mdtest:runner` | Test file discovery, parsing, and execution |
| `mdtest:files` | Helper file creation from `file=` blocks |
| `mdtest:session` | Session state management (env, cwd, functions) |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All tests passed |
| `1` | One or more tests failed |
| `2` | No test files found |
