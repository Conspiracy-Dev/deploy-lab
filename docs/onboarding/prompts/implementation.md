# Implement an approved change

```text
Implement only the approved plan at <link or pasted plan>. Keep the public
contract <unchanged/explicitly allowed change>. Work in <paths>. Do not add
dependencies, client-only rendering, external scripts, or adjacent refactors.
Run <focused checks>; if UI changes, collect browser evidence. Stop and report
the first contradiction to the plan or contract.
```

Avoid: “Refactor this area while you are there.” It removes the diff boundary
and turns a reviewable task into open-ended work.
