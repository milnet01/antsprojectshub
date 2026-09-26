# Review loop log — docs/DEPENDENCY_POLICY.md

Rows for [`docs/DEPENDENCY_POLICY.md`](../DEPENDENCY_POLICY.md), one per `review-contract`
loop, oldest first.

| Loop | Date | Lanes | Q1 | Q2 | Q3 | Q4 | Verified / fixed / dismissed | Outcome |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-09-26 | 2, every lane held every question; both arrived holding the three CLAUDE.md files, the memory index and commit subjects f6ea7ea and 04035d2 | 1 | 1 | 2 | — | 4 / 4 / 0 | Gate armed by f6ea7ea (whole-file rewrite). Q1: the re-pin command read `git/ref/tags`, which gives a tag object's SHA for an annotated tag — now `commits/<tag>`; all five actions' tags are lightweight today, so latent. Q2: "current LTS" here against "latest stable" in CLAUDE.md, with Node Current v26 and LTS v24 — the file now states LTS as this repo's reading and CLAUDE.md § Dependencies says so; the check command now prints the pinned major. Q3 (both from lane questions settled by one check each): CLAUDE.md's `Node >= 20` quote and the `runs-on: ubuntu-latest` runner image added to where versions live. Two open questions resolved clean: PySide6 has no version string anywhere, and `check-dependencies` reads the ledger by judgement, so the `_example_` row is not parsed as a hold. |
