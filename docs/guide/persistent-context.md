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
