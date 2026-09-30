# Bun registration order

## Write first

```console
$ printf first > order.txt; printf 'write first\n' >> "$MDSPEC_BUN_ORDER_FILE"; printf first
first
```

## Read second

```console
$ cat order.txt; printf 'read second\n' >> "$MDSPEC_BUN_ORDER_FILE"
first
```
