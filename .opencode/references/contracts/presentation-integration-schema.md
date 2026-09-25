# Presentation Integration Contract v1

Use this contract whenever generated/authored art, runtime text, controls, HUD, menus, maps, or character composites share a player-facing surface.

## Engine Basis

Godot recommends a base design resolution plus `canvas_items`/`expand` for modern mobile targets, with `Control` anchors and/or containers for changing aspect ratios:

- https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html
- https://docs.godotengine.org/en/stable/classes/class_control.html
- https://docs.godotengine.org/en/stable/classes/class_container.html

`TextureRect` stretch modes define whether an image preserves aspect, covers, or tiles. Dedicated scalable frames use `NinePatchRect`; arbitrary illustration crops are not panel components:

- https://docs.godotengine.org/en/stable/classes/class_texturerect.html
- https://docs.godotengine.org/en/stable/classes/class_ninepatchrect.html

## Component Contract

Every production component records:

- stable component and asset IDs;
- `source_kind`: dedicated component, sprite sheet, tileable, full frame, procedural, or sourced;
- allowed `render_mode`: uniform, native, sprite-frame, nine-slice, tile, cover, or procedural;
- source dimensions and target runtime size/range;
- anchor/pivot and safe padding;
- protected content rectangle for runtime text and child controls;
- nine-slice margins, crop-safe area, tile seam evidence, or source frame size when applicable;
- exact state IDs, runtime references, target viewports, and current composite evidence.

Do not place text by eye over ornament. Text and child controls must stay inside the component's protected content rectangle at the longest supported copy and text scale.

## Runtime Layout Evidence

Every capture in `production/reviews/visual-quality-contract.json` binds a layout report:

```json
{
  "viewport_id": "portrait-1080x1920",
  "path": "production/evidence/states/home--portrait-1080x1920.png",
  "sha256": "...",
  "layout_report": "production/evidence/layout/home--portrait-1080x1920.json",
  "layout_sha256": "..."
}
```

Generate reports with `references/godot/cgm_layout_audit.gd` or a project-owned compatible runtime auditor. The report uses `schema_version: 1`, `generated_by: cgm-layout-audit`, and is hash-bound to the same screenshot and current style lock.

Tag player-facing `Control` nodes with stable metadata:

- `cgm_id`
- `cgm_role`
- `cgm_safe_zone`
- `cgm_contrast_ratio` for runtime text
- `cgm_render_mode` and `cgm_source_kind` for texture components
- `cgm_container_content_rect` when text belongs inside illustrated ornament
- `cgm_allow_overlap_with` only for intentional, documented overlays

## Blocking Checks

The player-ready gate independently validates:

- bounds and title/action-safe regions;
- text size, declared contrast, wrapping, clipping, and content-rect containment;
- button/input target size and accessible names;
- text/button/progress collisions;
- image source size, render mode, aspect preservation, nine-slice and cover contracts;
- semantic metadata coverage;
- visible default-magenta chroma-key spill in the final runtime screenshot;
- report, screenshot, state, viewport, style, command artifact, and SHA-256 bindings.

A prose review or a JSON field that merely says `PASS` cannot override these computed blockers.

## Composition Rules

- Build hierarchy and responsive geometry with anchors and containers before adding ornament.
- Prefer one authored component family with role-specific variants over one ornate frame reused everywhere.
- Keep navigation, resource rails, and primary actions inside safe regions and aligned to one spacing grid.
- Treat generated atlases as source material. Extract and QA each runtime component; never render the whole pack behind manually positioned text/icons.
- Use engine-rendered text. Enable wrapping for variable copy and validate longest locale/text-scale cases.
- Check every required state at every required viewport. A 1080×1920 capture resized from another aspect does not prove responsive behavior.
- Any visible key-color fringe, clipped label, undersized action, stretched fixed-shape art, or unexplained overlap is a blocker/high finding.
