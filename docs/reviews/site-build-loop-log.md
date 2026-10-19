# Review loop log — .claude/rules/site-build.md

Rows for [`.claude/rules/site-build.md`](../../.claude/rules/site-build.md), one per
`review-contract` loop, oldest first. Kept here because the rules file loads by itself into
sessions, so a log inside it would be paid for on every turn.

| Loop | Date | Lanes | Q1 | Q2 | Q3 | Q4 | Verified / fixed / dismissed | Outcome |
|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-19 | 2 (neutral-lane), every lane held every question; both arrived holding only the global CLAUDE.md, no project files and no git snapshot | 0 | 0 | 2 | — | 2 / 2 / 0 | Gate armed by the Demo videos bullet edit (caption into a closed `<details>`, committed as baseline 3d2a0b8). Both lanes found both findings. Q3: the bullet did not say where the fold-out sits, so a conformer could drop the `<figcaption>` or wrap it in `<details>` (invalid) and cut the text alternative off its video — now "inside the figure's `<figcaption>`". Q3: on a page with several videos, identical `<summary>` labels were allowed — now the summary names which video. Four open questions resolved clean: the code's optional poster (all 16 videos have one), the figure's accessible name, stale comments in `build.mjs` and `style.css` (code, changed with `renderVideo()`), and reuse of `.reveal` styling (local detail). |
