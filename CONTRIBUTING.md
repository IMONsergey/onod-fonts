# Contributing to ONOD Fonts

Thank you for helping improve the catalog and its interface. Keep contributions focused, reproducible, and easy to review.

## Proposing a font

Before opening a pull request:

1. Confirm that the typeface is not already present in the catalog.
2. Verify the official family and style names.
3. Record the foundry or designer and the original source.
4. Check the license and whether web use and redistribution are permitted.
5. Include all metadata required by the existing catalog schema.

Do not add font binaries unless their license explicitly permits redistribution in this repository.

## Product and interface changes

- follow the existing React and TypeScript structure;
- preserve keyboard access and readable focus states;
- keep font loading failures recoverable;
- avoid introducing packages when a small native implementation is sufficient;
- verify both the catalog view and individual font routes.

## Validation

Run the complete quality gate before opening a pull request:

```bash
npm install
npm run check
```

For visual changes, include a short description of the tested viewport sizes and attach before/after screenshots to the pull request.

## Pull requests

Keep each pull request limited to one clear outcome. Explain what changed, why it is needed, and how it was validated. If the work affects catalog data, mention the source and license evidence in the description.
