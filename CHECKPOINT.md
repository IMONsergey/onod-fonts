# ONOD server deployment, 2026-11-04

User requested publishing ONOD at https://onod.imon.world on imon-workstation. Canonical source is IMONsergey/onod-fonts main at 9274072, per repository README. Draft UX branch is not merged or substituted. Existing Figma source archive is retained unchanged.

Added ONOD_BASE_PATH to support root-domain deployment while preserving GitHub Pages defaults. Server release gate: npm run check:server. Full server release gate passed in job 20261104T070110-dad9dfb64d. Default GitHub Pages build, bundle validation and preview route/asset smoke also passed in job 20261104T070807-8e6a8c8e28. Production browser verification is recorded in the server deployment checkpoint.
