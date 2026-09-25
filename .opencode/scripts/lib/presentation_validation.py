#!/usr/bin/env python3
"""Runtime UI/art integration validation for Codex Game Maker."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Optional

from cgm_validation import (
    is_within,
    issue,
    load_json,
    png_chroma_key_stats,
    resolve_project_path,
    sha256_file,
    status_ok,
)


REQUIRED_LAYOUT_CHECKS = {
    "bounds",
    "text_overflow",
    "text_contrast",
    "touch_targets",
    "safe_zones",
    "overlaps",
    "texture_distortion",
    "semantic_roles",
    "chroma_key_residue",
}
SEMANTIC_ROLES = {
    "text", "button", "input", "image", "panel", "navigation",
    "progress", "decoration", "world", "container",
}
TEXT_ROLES = {"text"}
INTERACTIVE_ROLES = {"button", "input", "navigation"}
ASPECT_PRESERVING_MODES = {"uniform", "native", "sprite-frame"}
VALID_RENDER_MODES = ASPECT_PRESERVING_MODES | {"nine-slice", "tile", "cover", "procedural"}


def _number(value: Any) -> Optional[float]:
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _pair(value: Any, *, positive: bool = False) -> Optional[tuple[float, float]]:
    if not isinstance(value, list) or len(value) != 2:
        return None
    left, right = _number(value[0]), _number(value[1])
    if left is None or right is None or (positive and (left <= 0 or right <= 0)):
        return None
    return left, right


def _rect(value: Any) -> Optional[tuple[float, float, float, float]]:
    if not isinstance(value, list) or len(value) != 4:
        return None
    numbers = tuple(_number(item) for item in value)
    if any(item is None for item in numbers):
        return None
    x, y, width, height = numbers
    if width <= 0 or height <= 0:
        return None
    return float(x), float(y), float(width), float(height)


def _contains(outer: tuple[float, float, float, float], inner: tuple[float, float, float, float], tolerance: float = 1.0) -> bool:
    ox, oy, ow, oh = outer
    ix, iy, iw, ih = inner
    return (
        ix >= ox - tolerance
        and iy >= oy - tolerance
        and ix + iw <= ox + ow + tolerance
        and iy + ih <= oy + oh + tolerance
    )


def _intersection_area(left: tuple[float, float, float, float], right: tuple[float, float, float, float]) -> float:
    lx, ly, lw, lh = left
    rx, ry, rw, rh = right
    width = min(lx + lw, rx + rw) - max(lx, rx)
    height = min(ly + lh, ry + rh) - max(ly, ry)
    return max(0.0, width) * max(0.0, height)


def _safe_rect(width: float, height: float, scale: float) -> tuple[float, float, float, float]:
    safe_width = width * scale
    safe_height = height * scale
    return ((width - safe_width) / 2.0, (height - safe_height) / 2.0, safe_width, safe_height)


def validate_presentation_policy(data: Any, viewports: dict[str, dict], blockers: list[dict], source: Any) -> dict:
    policy = data if isinstance(data, dict) else {}
    if not policy or not policy.get("required", True):
        blockers.append(issue("presentation.policy_missing", "Visual contract needs a required presentation_policy", source))
        return {}
    if policy.get("report_schema_version") != 1:
        blockers.append(issue("presentation.policy_schema", "presentation_policy.report_schema_version must be 1", source))
    maximum_chroma = _number(policy.get("maximum_chroma_key_ratio"))
    minimum_semantic = _number(policy.get("minimum_semantic_coverage"))
    if maximum_chroma is None or maximum_chroma < 0 or maximum_chroma > 0.01:
        blockers.append(issue("presentation.policy_chroma", "maximum_chroma_key_ratio must be between 0 and 0.01", source))
    if minimum_semantic is None or minimum_semantic < 0.8 or minimum_semantic > 1.0:
        blockers.append(issue("presentation.policy_semantics", "minimum_semantic_coverage must be between 0.8 and 1.0", source))
    for viewport_id, viewport in viewports.items():
        body = _number(viewport.get("minimum_body_font_px"))
        critical = _number(viewport.get("minimum_critical_font_px"))
        touch = _pair(viewport.get("minimum_touch_target_px"), positive=True)
        title_safe = _number(viewport.get("title_safe_scale"))
        action_safe = _number(viewport.get("action_safe_scale"))
        if body is None or body < 10 or critical is None or critical < body:
            blockers.append(issue("presentation.viewport_typography", f"Viewport {viewport_id} needs realistic body/critical font floors", source))
        if touch is None or touch[0] < 24 or touch[1] < 24:
            blockers.append(issue("presentation.viewport_touch", f"Viewport {viewport_id} needs a minimum touch target", source))
        if title_safe is None or not 0.8 <= title_safe <= 1.0 or action_safe is None or not 0.8 <= action_safe <= 1.0:
            blockers.append(issue("presentation.viewport_safe", f"Viewport {viewport_id} needs title/action safe scales between 0.8 and 1.0", source))
    return policy


def validate_layout_report(
    root: Path,
    raw_report_path: str,
    expected_report_hash: str,
    state_id: str,
    viewport_id: str,
    viewport: dict,
    capture_path: Path,
    raw_capture_path: str,
    style_version: str,
    style_digest: str,
    policy: dict,
    blockers: list[dict],
    evidence: list[dict],
) -> Optional[Path]:
    report_path = resolve_project_path(root, raw_report_path)
    if report_path is None or not is_within(root, report_path):
        blockers.append(issue("presentation.report_missing", f"Surface {state_id} needs a project-local layout report", report_path))
        return None
    report = load_json(report_path, blockers, "presentation.report")
    if report is None:
        return report_path
    if not expected_report_hash or sha256_file(report_path) != expected_report_hash:
        blockers.append(issue("presentation.report_hash", f"Layout report for {state_id}/{viewport_id} is missing its current SHA-256", report_path))
    if report.get("schema_version") != 1 or not status_ok(report.get("gate")):
        blockers.append(issue("presentation.report_status", f"Layout report for {state_id}/{viewport_id} must use schema 1 and PASS", report_path))
    if str(report.get("generated_by", "")).strip() != "cgm-layout-audit":
        blockers.append(issue("presentation.report_generator", "Layout evidence must be generated by cgm-layout-audit", report_path))
    if report.get("state_id") != state_id or report.get("viewport_id") != viewport_id:
        blockers.append(issue("presentation.report_binding", f"Layout report is not bound to {state_id}/{viewport_id}", report_path))

    expected_width = int(viewport.get("width", 0) or 0)
    expected_height = int(viewport.get("height", 0) or 0)
    report_viewport = report.get("viewport") if isinstance(report.get("viewport"), dict) else {}
    if (report_viewport.get("width"), report_viewport.get("height")) != (expected_width, expected_height):
        blockers.append(issue("presentation.report_viewport", f"Layout report dimensions do not match {viewport_id}", report_path))
    style = report.get("style_lock") if isinstance(report.get("style_lock"), dict) else {}
    if style.get("style_version") != style_version or style.get("sha256") != style_digest:
        blockers.append(issue("presentation.report_style", "Layout report is stale against the current style lock", report_path))
    capture = report.get("capture") if isinstance(report.get("capture"), dict) else {}
    if capture.get("path") != raw_capture_path or capture.get("sha256") != sha256_file(capture_path):
        blockers.append(issue("presentation.report_capture", "Layout report is not hash-bound to its runtime capture", report_path))

    checks = report.get("checks") if isinstance(report.get("checks"), dict) else {}
    for check_id in sorted(REQUIRED_LAYOUT_CHECKS):
        if str(checks.get(check_id, "")).strip().upper() != "PASS":
            blockers.append(issue("presentation.check_failed", f"Layout check {check_id} is not PASS for {state_id}/{viewport_id}", report_path))

    for finding in report.get("findings", []) if isinstance(report.get("findings"), list) else []:
        if not isinstance(finding, dict):
            blockers.append(issue("presentation.finding_invalid", "Layout findings must be objects", report_path))
            continue
        if str(finding.get("severity", "")).strip().lower() in {"blocker", "high"} and str(finding.get("status", "")).strip().lower() != "resolved":
            blockers.append(issue("presentation.finding_open", f"Open layout finding: {finding.get('message', finding.get('finding', 'unspecified'))}", report_path))

    elements = report.get("elements") if isinstance(report.get("elements"), list) else []
    if not elements:
        blockers.append(issue("presentation.elements_missing", "Layout report must contain runtime Control/image elements", report_path))
        return report_path
    element_ids: set[str] = set()
    semantic_count = 0
    interactive_or_text: list[tuple[str, str, tuple[float, float, float, float], set[str]]] = []
    title_safe = _safe_rect(expected_width, expected_height, float(viewport.get("title_safe_scale", 0.9)))
    action_safe = _safe_rect(expected_width, expected_height, float(viewport.get("action_safe_scale", 0.93)))
    viewport_rect = (0.0, 0.0, float(expected_width), float(expected_height))
    body_floor = float(viewport.get("minimum_body_font_px", 16))
    critical_floor = float(viewport.get("minimum_critical_font_px", 24))
    touch_floor = _pair(viewport.get("minimum_touch_target_px"), positive=True) or (44.0, 44.0)

    for raw_element in elements:
        if not isinstance(raw_element, dict):
            blockers.append(issue("presentation.element_invalid", "Layout elements must be objects", report_path))
            continue
        element_id = str(raw_element.get("id", "")).strip()
        role = str(raw_element.get("role", "")).strip().lower()
        rect = _rect(raw_element.get("rect"))
        if not element_id or element_id in element_ids or role not in SEMANTIC_ROLES or rect is None:
            blockers.append(issue("presentation.element_contract", f"Invalid or duplicate semantic element {element_id or '<unnamed>'}", report_path))
            continue
        element_ids.add(element_id)
        if bool(raw_element.get("semantic", False)):
            semantic_count += 1
        if raw_element.get("visible", True) and not raw_element.get("allow_outside_viewport", False) and not _contains(viewport_rect, rect):
            blockers.append(issue("presentation.out_of_bounds", f"Element {element_id} leaves the viewport", report_path, rect=list(rect)))

        safe_zone = str(raw_element.get("safe_zone", "none")).strip().lower()
        if safe_zone == "title" and not _contains(title_safe, rect):
            blockers.append(issue("presentation.title_safe", f"Element {element_id} leaves the title-safe region", report_path))
        elif safe_zone == "action" and not _contains(action_safe, rect):
            blockers.append(issue("presentation.action_safe", f"Element {element_id} leaves the action-safe region", report_path))
        elif safe_zone not in {"none", "title", "action"}:
            blockers.append(issue("presentation.safe_zone_invalid", f"Element {element_id} has an invalid safe_zone", report_path))

        if role in TEXT_ROLES:
            text = str(raw_element.get("text", "")).strip()
            font_size = _number(raw_element.get("font_size"))
            contrast = _number(raw_element.get("contrast_ratio"))
            critical = bool(raw_element.get("critical", False))
            floor = critical_floor if critical else body_floor
            if not text or font_size is None or font_size < floor:
                blockers.append(issue("presentation.text_size", f"Text {element_id} is empty or below the {floor:g}px floor", report_path))
            contrast_floor = 3.0 if font_size is not None and font_size >= critical_floor else 4.5
            if contrast is None or contrast < contrast_floor:
                blockers.append(issue("presentation.text_contrast", f"Text {element_id} contrast is below {contrast_floor}:1", report_path))
            if bool(raw_element.get("overflow", False)):
                blockers.append(issue("presentation.text_overflow", f"Text {element_id} is clipped or overflowing", report_path))
            wrap_mode = str(raw_element.get("wrap_mode", "off")).strip().lower()
            if len(text) > 36 and wrap_mode in {"", "off", "none"}:
                blockers.append(issue("presentation.text_wrap", f"Long text {element_id} does not wrap", report_path))
            content_rect = _rect(raw_element.get("container_content_rect"))
            if content_rect is not None and not _contains(content_rect, rect):
                blockers.append(issue("presentation.content_rect", f"Text {element_id} collides with its component ornament/content boundary", report_path))

        if role in INTERACTIVE_ROLES:
            if rect[2] < touch_floor[0] or rect[3] < touch_floor[1]:
                blockers.append(issue("presentation.touch_target", f"Interactive element {element_id} is smaller than {touch_floor[0]:g}×{touch_floor[1]:g}", report_path))
            if not str(raw_element.get("accessible_name", "")).strip():
                blockers.append(issue("presentation.accessible_name", f"Interactive element {element_id} has no accessible name", report_path))

        if role == "image":
            render_mode = str(raw_element.get("render_mode", "")).strip().lower()
            source_size = _pair(raw_element.get("source_size"), positive=True)
            if render_mode not in VALID_RENDER_MODES or (render_mode != "procedural" and source_size is None):
                blockers.append(issue("presentation.image_contract", f"Image {element_id} needs a valid render mode and source size", report_path))
            elif render_mode in ASPECT_PRESERVING_MODES and source_size:
                source_ratio = source_size[0] / source_size[1]
                rendered_ratio = rect[2] / rect[3]
                if abs(source_ratio - rendered_ratio) / source_ratio > 0.05:
                    blockers.append(issue("presentation.texture_distorted", f"Image {element_id} changes aspect ratio in {render_mode} mode", report_path))
            elif render_mode == "nine-slice":
                margins = raw_element.get("nine_slice_margins")
                if str(raw_element.get("source_kind", "")).strip().lower() != "dedicated-component" or not isinstance(margins, list) or len(margins) != 4 or not all((_number(item) or 0) > 0 for item in margins):
                    blockers.append(issue("presentation.nine_slice", f"Image {element_id} is not a verified dedicated nine-slice", report_path))
            elif render_mode == "cover" and _rect(raw_element.get("crop_safe_area")) is None:
                blockers.append(issue("presentation.cover_crop", f"Cover image {element_id} has no crop-safe area", report_path))

        if role in TEXT_ROLES | INTERACTIVE_ROLES | {"progress"}:
            allow = {str(item) for item in raw_element.get("allow_overlap_with", []) if str(item)} if isinstance(raw_element.get("allow_overlap_with"), list) else set()
            interactive_or_text.append((element_id, role, rect, allow))

    minimum_semantic = float(policy.get("minimum_semantic_coverage", 0.9))
    declared_count = int(report.get("control_count", len(elements)) or len(elements))
    semantic_coverage = semantic_count / max(1, declared_count)
    if semantic_coverage < minimum_semantic:
        blockers.append(issue("presentation.semantic_coverage", f"Only {semantic_coverage:.1%} of visible controls have semantic layout metadata", report_path))

    for index, (left_id, _left_role, left_rect, left_allow) in enumerate(interactive_or_text):
        for right_id, _right_role, right_rect, right_allow in interactive_or_text[index + 1:]:
            if right_id in left_allow or left_id in right_allow:
                continue
            if _intersection_area(left_rect, right_rect) > 4.0:
                blockers.append(issue("presentation.overlap", f"Interactive/text elements overlap: {left_id} and {right_id}", report_path))

    chroma = png_chroma_key_stats(capture_path)
    if not chroma.get("supported"):
        blockers.append(issue("presentation.capture_encoding", f"Cannot inspect chroma-key residue: {chroma.get('reason')}", capture_path))
    else:
        maximum_chroma = float(policy.get("maximum_chroma_key_ratio", 0.00002))
        if float(chroma.get("chroma_key_ratio", 0.0)) > maximum_chroma:
            blockers.append(issue(
                "presentation.chroma_key_residue",
                f"Runtime capture contains {chroma.get('chroma_key_pixels')} magenta key/spill pixels ({float(chroma.get('chroma_key_ratio', 0.0)):.4%})",
                capture_path,
            ))

    evidence.append({
        "code": "presentation.layout_report",
        "state_id": state_id,
        "viewport_id": viewport_id,
        "path": str(report_path),
        "elements": len(elements),
        "chroma_key_pixels": chroma.get("chroma_key_pixels"),
    })
    return report_path
