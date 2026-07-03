# Dependency policy

**Standing rule for this repository.** All dependencies are kept at their **latest
stable version** — this is a requirement for security patches, not just features. It
applies to every kind of dependency:

- **npm packages** — `package.json` / `package-lock.json` (`marked`, `sanitize-html`).
- **GitHub Actions** — the `uses:` pins in `.github/workflows/*.yml`.
- **The Node runtime** — the `node-version:` in the workflow and `engines.node` in
  `package.json`.

## The one exception: a newer version that breaks us

We may hold a dependency at an older version **only** when a newer version *explicitly
breaks* one of our features and there is no reasonable way around it. When that happens,
it **must** be recorded in the [Held-back dependencies](#held-back-dependencies) table
below, including:

- the version we are pinned to, and **the exact newer version that broke** us,
- **what** it broke (the feature, the symptom, and ideally a link to the upstream issue),
- so that when a version *newer than the broken one* is released, we can **re-test** and
  un-pin if the breakage is gone.

A hold-back with no table entry is a bug. If it isn't written down, we will forget why the
pin exists and either break something by bumping it blindly, or leave a stale pin forever.

## Held-back dependencies

**None.** As of 2026-07-03 every dependency is at its latest stable release. When a pin
becomes necessary, add a row:

| Dependency | Pinned at | Latest available | Broke at version | What breaks | Re-test when |
|------------|-----------|------------------|------------------|-------------|--------------|
| _example_ `foo` | `1.4.2` | `2.1.0` | `2.0.0` | Feature X throws `TypeError` — upstream #123 | a release `> 2.1.0` ships |

When re-testing succeeds, delete the row and bump to latest in the same change.

## How to check (do this on a cadence, and whenever you touch a manifest)

```bash
# npm packages — Current vs Latest
npm outdated

# GitHub Actions — latest release tag + its commit SHA (to re-pin)
for a in actions/checkout actions/setup-node actions/configure-pages \
         actions/upload-pages-artifact actions/deploy-pages; do
  t=$(gh api "repos/$a/releases/latest" --jq .tag_name)
  sha=$(gh api "repos/$a/git/ref/tags/$t" --jq .object.sha)
  echo "$a  $t  $sha"
done

# Node — compare the workflow's node-version against current LTS
node --version   # https://nodejs.org/en/about/previous-releases for the LTS schedule
```

## Rules when bumping

- **Pin Actions by full commit SHA**, with the human-readable version in a trailing
  comment (e.g. `uses: actions/checkout@9c091bb… # v7.0.0`). SHA = supply-chain safety;
  the comment = readability. Update both together.
- **Bump the code with the dependency, in the same change.** If a major bump changes an
  API we call, fix the call site now — don't leave a "works because it compiles" pin.
- **Verify before pushing.** Run `./local-CI.sh` (reproduces the CI build). For a major
  npm bump, also confirm the API we actually use still behaves (e.g. `marked.parse(md,
  { gfm: true })` still returns the expected HTML string).
- **npm floor vs. exact:** `package.json` uses caret ranges (`^18.0.5`); the exact
  resolved version lives in `package-lock.json`, which CI installs with `npm ci`. Bump the
  caret when crossing a major so the intent is visible in the manifest.
