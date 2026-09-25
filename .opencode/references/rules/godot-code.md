# Godot Code Rules

- Prefer Godot 4.6.2-compatible patterns for new blank projects.
- Keep gameplay values data-driven in resources/config files.
- Use signals or event buses for UI-to-gameplay communication; UI must not own game state.
- Keep scenes small and composable.
- Use typed GDScript where practical.
- Separate pure gameplay logic from node presentation enough to test it.
- For web export, avoid platform APIs that do not work in browsers without a fallback.
- Verify version-specific APIs against official Godot docs when uncertain.
- Build production UI with anchored `Control` nodes and containers; avoid unrelated absolute sibling coordinates for responsive screens.
- Use stable `cgm_id`/`cgm_role` metadata and the runtime layout auditor for player-facing Controls.
- Keep runtime text inside declared component content rects with wrapping, contrast and longest-copy evidence.
