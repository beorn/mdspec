---
mdspec:
  timeout: 45000
---

# Bun registration order

## Write first

```console timeout=5000
$ printf first > order.txt; printf 'write first\n' >> "$MDSPEC_BUN_ORDER_FILE"; printf first
first
```

## Read second

```console
$ cat order.txt; printf 'read second\n' >> "$MDSPEC_BUN_ORDER_FILE"
first
```
