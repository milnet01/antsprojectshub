# Dependencies — this repository

The policy is the global dependency standard,
`~/.claude/standards/dependencies.md`, read in place: every dependency at its latest
stable release, a hold only where a specific newer version breaks something, and every
hold written down. This file holds only what that standard leaves to each project —
where the versions live (§7), how often to check (§5), and the hold ledger (§3).

## Where the versions live

- **npm packages** — `package.json` (caret ranges) and `package-lock.json` (the exact
  versions `npm ci` installs).
- **GitHub Actions** — the `uses:` pins in `.github/workflows/deploy.yml`, each a full
  commit SHA with the version in a trailing comment.
- **The Node runtime** — `CI_NODE_MAJOR` in `local-CI.sh` (the workflow reads it from
  there), `engines.node` in `package.json`, and the `Node >= 20` that `CLAUDE.md` § Build
  & preview quotes from it. Node tracks the newest **LTS** major: that is how this repo
  reads the standard's "latest stable" for Node, because a Current major is short-lived
  and an odd-numbered one never becomes LTS.
- **The runner image** — `runs-on: ubuntu-latest` in both jobs of `deploy.yml`, a label
  GitHub moves forward itself.

## When to check

Monthly, and whenever `package.json` or a workflow is edited for any other reason. The
site has no releases, so the standard's default of "every release cycle" never fires.

```bash
# npm packages — Current vs Latest
npm outdated

# GitHub Actions — latest release tag + its commit SHA (to re-pin)
for a in actions/checkout actions/setup-node actions/configure-pages \
         actions/upload-pages-artifact actions/deploy-pages; do
  t=$(gh api "repos/$a/releases/latest" --jq .tag_name)
  sha=$(gh api "repos/$a/commits/$t" --jq .sha)
  echo "$a  $t  $sha"
done

# Node — the pinned major, then the newest LTS release
./local-CI.sh --print-node-major
curl -s https://nodejs.org/dist/index.json | jq -r '[.[] | select(.lts)][0].version'
```

## Held-back dependencies

**None.** When a hold becomes necessary, add a row with every column the standard's §3
asks for. When a retest succeeds, delete the row and bump in the same change.

| What | Held at | Broke at | What breaks | What would release it | Decided / last retested |
|------|---------|----------|-------------|-----------------------|-------------------------|
| _example_ `foo` | `1.4.2` | `2.0.0` | Feature X throws `TypeError` — upstream #123 | a release `> 2.0.0` that passes `./local-CI.sh` | 2026-01-01 / 2026-01-01 |

## Bumping here

- **Update an Action's SHA and its version comment together.**
- **Bump the caret in `package.json` when crossing a major**, so the intent shows in the
  manifest and not only in the lockfile.
- **Run `./local-CI.sh` before pushing.** For a major bump of `marked` or
  `sanitize-html`, also confirm the calls this site makes still behave: `marked.parse(md,
  { gfm: true })` returns the expected HTML, and `sanitizeOptions` in `build.mjs` still
  strips what it should.

Review history: [`docs/reviews/dependency_policy-loop-log.md`](reviews/dependency_policy-loop-log.md).
