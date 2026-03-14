# Pattern Matching

mdspec provides rich pattern matching for asserting against dynamic output.

## Ellipsis Wildcards

Both `[...]` and `...` work as universal wildcards.

### Multi-line (matches zero or more lines)

When alone on a line, an ellipsis matches any number of lines:

````markdown
```console
$ ls -1
[...]
README.md
[...]
```

```console
$ echo -e "Start\nMiddle\nEnd"
Start
...
End
```
````

### Inline (matches text within a line)

When mixed with other text, an ellipsis matches any characters on that line:

````markdown
```console
$ echo "User: $USER, Time: $(date +%s)"
User: ..., Time: ...
```

```console
$ echo "Prefix: some-random-id-12345 Suffix"
Prefix: [...] Suffix
```
````

Multiple wildcards on a single line work:

````markdown
```console
$ echo "A: value1 B: value2 C: value3"
A: [...] B: ... C: [...]
```
````

### Inside brackets

Use `[[...]]` for JSON arrays or bracketed content:

````markdown
```console
$ echo '["item1", "item2", "item3"]'
[[...]]
```
````

### Indented

Ellipsis respects surrounding indentation:

````markdown
```console
$ cat structure.json
{
  [...]
  "key": "value"
}
```
````

## Regular Expressions

Wrap a pattern in `/` delimiters for regex matching against a whole line:

````markdown
```console
$ date +"%Y-%m-%d"
/\d{4}-\d{2}-\d{2}/
```
````

## Named Captures

Capture dynamic values and reuse them later.

### Wildcard capture

<!-- prettier-ignore -->
<code v-pre>{{name:*}}</code>

Captures any substring and stores it as `name`:

````markdown
```console
$ echo "id: abc-123"
id: {{myId:*}}
```
````

### Regex capture

<!-- prettier-ignore -->
<code v-pre>{{name:/pattern/}}</code>

Captures using a regex pattern:

````markdown
```console
$ echo "UUID: $(uuidgen)"
UUID: {{uuid:/[0-9A-F-]{36}/}}
```
````

### Reusing captures

Reference a previously captured value with <code v-pre>{{name}}</code> for an exact match:

````markdown
```console
$ echo "UUID: $(uuidgen)"
UUID: {{uuid:/[0-9A-F-]{36}/}}
```

```console
$ echo "Saved as: {{uuid}}"
Saved as: {{uuid}}
```
````

This is useful for testing commands that produce IDs, timestamps, or other values that later commands reference.

## Pattern Summary

<div v-pre>

| Pattern                          | Meaning                  |
| -------------------------------- | ------------------------ |
| `[...]` or `...` (alone on line) | Match zero or more lines |
| `[...]` or `...` (inline)        | Match any characters     |
| `/regex/`                        | Whole-line regex match   |
| `{{name:*}}`                     | Named wildcard capture   |
| `{{name:/regex/}}`               | Named regex capture      |
| `{{name}}`                       | Reuse captured value     |

</div>
