# Releasing `@stopsopa/tabs` to npm

## How it works

1. `xx publish` (= `/bin/bash tag.sh [patch|minor|major]`) creates the next tag (`v1.0.1` -> `v1.0.2` / `v1.1.0` / `v2.0.0`) on the current commit and pushes it.
2. The pushed tag starts `.github/workflows/deploy.yaml`: job `test` (prettier, typecheck, tests, build), then job `npm`.
3. Job `npm` builds `dist/`, sets the version from the tag (`v1.2.3` -> `1.2.3`) and runs `npm publish --access public`.

`version` in `package.json` stays `0.0.0` - it is never used, the tag is the only source of the version.
Nothing has to be built or bumped by hand. Only `dist/` (+ `README.md`, `package.json`) lands in the package.

Authentication of job `npm`:

- secret `NPM_TOKEN` exists -> the token is used (needed only for the first release),
- no secret -> npm trusted publishing (OIDC), no secrets stored anywhere. This is the target setup.

## One time setup

### 1. npm account

1. Log in to https://www.npmjs.com as the user `stopsopa`. The scope `@stopsopa` is simply that username - nothing to create.
   (If the account has another name: create a free organization `stopsopa` - avatar -> "Add Organization".)
2. Enable 2FA: avatar -> Account -> Two-Factor Authentication.

### 2. First release - with a token

A trusted publisher is configured in the settings of a package, so the package has to exist first.

1. npmjs.com -> avatar -> Access Tokens -> Generate New Token (granular access token):
   - Expiration: the shortest available (it is needed for minutes),
   - Bypass two-factor authentication: **checked** (CI can't type a code),
   - Packages and scopes: **Read and write**, scope `@stopsopa` (the package doesn't exist yet, so it can't be picked by name),
   - Organizations: No access.
2. GitHub -> https://github.com/stopsopa/tabs/settings/secrets/actions -> New repository secret: name `NPM_TOKEN`, value: the token.
3. Commit and push everything to `master`, wait for the green pipeline.
4. `xx publish minor` (-> `v1.1.0`; the last tag is `v1.0.1`), confirm with Enter.
5. Watch https://github.com/stopsopa/tabs/actions - after job `npm`: https://www.npmjs.com/package/@stopsopa/tabs

### 3. Switch to trusted publishing (no tokens)

Do it right before a next release: a new trusted publisher **expires when nothing is published with it within 2 days**.

1. https://www.npmjs.com/package/@stopsopa/tabs -> Settings -> Trusted publishing -> GitHub Actions:
   - Organization or user: `stopsopa`
   - Repository: `tabs`
   - Workflow filename: `deploy.yaml` (only the filename; case-sensitive)
   - Environment name: leave empty
   - Allowed actions: enable `npm publish`
2. GitHub: delete the secret `NPM_TOKEN` (as long as it exists the workflow uses it instead of OIDC).
3. npmjs.com -> Access Tokens: delete the token.
4. Release: `xx publish patch`. Log of step "Publish" says `no secret NPM_TOKEN: publishing with trusted publishing (OIDC)`.
5. Optional hardening after it worked: package -> Settings -> Publishing access -> "Require two-factor authentication and disallow tokens" (trusted publishing still works).

npm doesn't validate the trusted publisher form when saving - a typo shows up only as a failed publish.
An existing entry can't be edited: delete it and create again.

## Every next release

```bash
xx publish          # or: xx publish patch | minor | major
```

Before that: everything committed and pushed, pipeline on `master` green.

## Things which break it

| what                                                               | result                                                                     |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| renaming `.github/workflows/deploy.yaml`, renaming/moving the repo | trusted publisher doesn't match -> publish fails; recreate it on npmjs.com |
| changing `repository.url` in `package.json`                        | has to match `https://github.com/stopsopa/tabs` exactly                    |
| pushing the same tag again / publishing existing version           | npm refuses: versions are immutable, release the next one                  |
| self-hosted runner                                                 | trusted publishing works only on GitHub-hosted runners                     |
| node < 22.14 or npm < 11.5.1 in job `npm`                          | no OIDC support (the job uses node 24)                                     |
| repository made private                                            | no provenance (it is generated automatically only for public repos)        |

## Failed release

Job `npm` failed after the tag was pushed: fix the cause, then either re-run the failed job in GitHub Actions
(the tag still points to the same commit), or - when the fix needs a new commit - release the next version.
Removing a pushed tag: `git push origin :refs/tags/v1.2.3 && git tag -d v1.2.3` (only when nothing was published under it).

## Local check without publishing

```bash
npm ci
npm run typecheck && npm test && /bin/bash build.sh
npm pack --dry-run     # list of files which would be published
```
