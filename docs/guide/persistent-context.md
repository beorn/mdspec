# Persistent Context

Within a test file, shell state persists across code blocks. Environment variables, the working directory, and bash functions defined in one block are available in all subsequent blocks.

## How It Works

After each command, mdspec saves the shell state (environment variables, current directory, function definitions) to temp files. The next command loads this state before executing.

````markdown
```console
$ export GREETING="Hello"
```

```console
$ echo "$GREETING, world!"
Hello, world!
```

```console
$ cd /tmp
```

```console
$ pwd
/tmp
```
````

## Bash Functions

Define reusable functions that persist across blocks:

````markdown
```console
$ greet() {
>   echo "Hello, $1!"
> }
```

```console
$ greet "mdspec"
Hello, mdspec!
```
````

Continuation lines start with `>`.

## Resetting Context

Use the `reset` flag on a code fence to clear all accumulated state:

````markdown
```console reset
$ echo "${GREETING:-unset}"
unset
```
````

After a reset, environment variables, working directory, and functions start fresh.

`reset` returns the shell to the spec file's original temporary directory.

## Lifecycle Fences

Use raw shell lifecycle fences when a spec needs shared setup or explicit
teardown. `reset` commonly belongs on `beforeAll` so setup starts from fresh
shell state:

````markdown
```beforeAll reset
export FIXTURE_DIR="$(mktemp -d)"
cd "$FIXTURE_DIR"
printf 'ready\n' > status.txt
```

```afterAll
rm -rf "$FIXTURE_DIR"
```

```console
$ cat status.txt
ready
```
````

Lifecycle fences contain raw shell, not console-style `$` commands.
`beforeAll` runs once before any test block, `beforeEach` runs before each
block, and the matching `afterEach` and `afterAll` fences are guaranteed even
when setup or a test fails. They are declarations and do not count as
executable test blocks. State changed by a lifecycle fence is saved for the
next command just like state changed by a normal block.

The older shell-function form (`$ beforeAll() { ... }` in a `console` fence)
remains supported for compatibility. Prefer lifecycle fences in new specs.

Use the two mechanisms for different jobs:

- `beforeAll` and `afterAll` define the lifetime of fixtures, processes, and
  other resources.
- `reset` deliberately discards accumulated shell context before one block.

Keep cleanup in `afterAll` when it affects anything outside shell context.
Resetting variables does not stop a process or remove a temporary directory.

## Helper Files

Create files in the test temp directory using `file=` in the fence info string. These are written before any tests run and are available to all blocks.

````markdown
```bash file=helpers.sh
greet() {
  echo "Hello, $1!"
}

export API_URL="http://localhost:3000"
```

```console
$ source helpers.sh
$ greet "mdspec"
Hello, mdspec!
```
````

Any language fence can use `file=`:

````markdown
```json file=config.json
{
  "timeout": 5000,
  "retries": 3
}
```

```console
$ cat config.json
{
  "timeout": 5000,
  "retries": 3
}
```
````

Files are created relative to the temp directory (`$PWD`). Use them for shared bash functions, configuration files, mock data, or test fixtures.

## Temp Directory

Each test file runs in its own fresh temp directory. The environment variable `$ROOT` points to the original project root, so tests can reference source files:

````markdown
```console
$ cat "$ROOT/package.json" | head -1
{
```
````
