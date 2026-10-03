# Declared block timeout

A 45-second command budget must also reach the test framework. This command
exceeds its default 30 seconds without changing the runner configuration.

```console timeout=45000
$ sleep 31; echo completed
completed
```

## Sequential command budgets

```console timeout=1000
$ sleep 0.6; echo first
first
$ sleep 0.6; echo second
second
```
