# Releasing AMB Grid

AMB Grid releases use an annotated Git tag as the release trigger.

Before creating a new release tag, update the corresponding section in
`CHANGELOG.md`.

## Before the tag

The candidate commit must have green CI, including unit tests, TypeScript type
tests, the library build, the general build, and the Playwright E2E suite.

Run the distribution checks before tagging as well:

- `npm run package:smoke`
- `npm run legacy:package:check`
- `npm run legacy:smoke`

CI and release jobs use Node 22.

1. Update the version in `package.json` and `package-lock.json`.
2. Complete the release checks, commit the version change, and push the commit.
3. Create an annotated `vX.Y.Z` tag on that verified commit.
4. Push the single tag to the remote repository.
5. The Release workflow repeats the relevant distribution checks before it
   creates the GitHub Release for the existing tag and attaches the generated
   standalone legacy ZIP.
6. npm distribution remains a separate manual process until an explicit npm
   publishing workflow is configured.

The workflow never creates or moves a tag. A version mismatch stops the release
before any GitHub Release is created.

## After the tag

The GitHub Release workflow verifies that the annotated tag matches the package
version and repeats the relevant distribution checks before creating the GitHub
Release. npm publishing remains a separate manual action.
