# Turn a vague request into a plan

Use this for requests with an unclear outcome or architectural impact.

```text
Before editing, turn this request into a small DeployLab plan.
Request: <request>
Known constraints: <contracts, routes, performance or delivery limits>
Return only: Goal, Non-goals, Constraints, Ownership seam, Plan,
Verification, Risk and stop condition. Apply YAGNI and ask only questions that
change the decision. Do not implement until I approve the plan.
```

Avoid: “Make the site modern and fast using the latest tools.” It gives no
route, user outcome, performance budget, acceptance condition, or authority to
add dependencies.
