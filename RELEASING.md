# Releasing AMB Grid

AMB Grid releases use an annotated Git tag as the release trigger.

1. Update the version in `package.json` and `package-lock.json`.
2. Complete the release checks, commit the version change, and push the commit.
3. Create an annotated `vX.Y.Z` tag on that verified commit.
4. Push the single tag to the remote repository.
5. The Release workflow verifies that the tag matches the package version,
   checks the npm and legacy distributions, creates the GitHub Release for the
   existing tag, and attaches the generated standalone legacy ZIP.
6. npm distribution remains a separate manual process until an explicit npm
   publishing workflow is configured.

The workflow never creates or moves a tag. A version mismatch stops the release
before any GitHub Release is created.
