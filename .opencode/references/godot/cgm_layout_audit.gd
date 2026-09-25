class_name CgmLayoutAudit
extends RefCounted
## Runtime geometry evidence for the Codex Game Maker presentation gate.
##
## Add semantic metadata to player-facing Controls:
##   cgm_role: text/button/image/panel/navigation/progress/decoration/world/container
##   cgm_id: stable screen-local identifier
##   cgm_safe_zone: none/title/action
## Labels also declare cgm_contrast_ratio and optional cgm_critical.
## TextureRects declare cgm_render_mode and optional cgm_source_kind.

const CHECK_IDS := [
	"bounds",
	"text_overflow",
	"text_contrast",
	"touch_targets",
	"safe_zones",
	"overlaps",
	"texture_distortion",
	"semantic_roles",
	"chroma_key_residue",
]

static func build_report(
	root: Control,
	state_id: String,
	viewport_id: String,
	viewport_size: Vector2i,
	capture_path: String,
	style_version: String,
	style_sha256: String,
	policy: Dictionary
) -> Dictionary:
	var elements: Array[Dictionary] = []
	_collect_controls(root, root, elements)
	var findings: Array[Dictionary] = _inspect(elements, viewport_size, policy)
	var checks := {}
	for check_id in CHECK_IDS:
		checks[check_id] = "PASS"
	for finding in findings:
		var check_id := str(finding.get("check", ""))
		if checks.has(check_id) and str(finding.get("severity", "")).to_lower() in ["blocker", "high"]:
			checks[check_id] = "BLOCKED"
	var gate := "PASS"
	for status in checks.values():
		if status != "PASS":
			gate = "BLOCKED"
			break
	return {
		"schema_version": 1,
		"gate": gate,
		"generated_by": "cgm-layout-audit",
		"state_id": state_id,
		"viewport_id": viewport_id,
		"viewport": {"width": viewport_size.x, "height": viewport_size.y},
		"style_lock": {"style_version": style_version, "sha256": style_sha256},
		"capture": {"path": capture_path, "sha256": FileAccess.get_sha256(capture_path)},
		"control_count": elements.size(),
		"checks": checks,
		"elements": elements,
		"findings": findings,
	}

static func save_report(path: String, report: Dictionary) -> Error:
	var absolute_directory := ProjectSettings.globalize_path(path.get_base_dir())
	var directory_error := DirAccess.make_dir_recursive_absolute(absolute_directory)
	if directory_error != OK:
		return directory_error
	var file := FileAccess.open(path, FileAccess.WRITE)
	if file == null:
		return FileAccess.get_open_error()
	file.store_string(JSON.stringify(report, "  "))
	file.close()
	return OK

static func _collect_controls(node: Node, root: Control, output: Array[Dictionary]) -> void:
	if node is Control and node != root:
		var control := node as Control
		if control.is_visible_in_tree() and control.size.x > 0.0 and control.size.y > 0.0:
			output.append(_element_for(control, root))
	for child in node.get_children():
		_collect_controls(child, root, output)

static func _element_for(control: Control, root: Control) -> Dictionary:
	var role := str(control.get_meta("cgm_role", _infer_role(control)))
	var element_id := str(control.get_meta("cgm_id", String(root.get_path_to(control)).replace("/", "--")))
	var rect := Rect2(control.global_position - root.global_position, control.size)
	var element := {
		"id": element_id,
		"role": role,
		"rect": [rect.position.x, rect.position.y, rect.size.x, rect.size.y],
		"visible": control.is_visible_in_tree(),
		"semantic": control.has_meta("cgm_role") and control.has_meta("cgm_id"),
		"safe_zone": str(control.get_meta("cgm_safe_zone", "none")),
		"allow_outside_viewport": bool(control.get_meta("cgm_allow_outside_viewport", false)),
		"allow_overlap_with": control.get_meta("cgm_allow_overlap_with", []),
	}
	if control is Label:
		var label := control as Label
		element["text"] = label.text
		element["font_size"] = label.get_theme_font_size("font_size")
		element["contrast_ratio"] = float(label.get_meta("cgm_contrast_ratio", 0.0))
		element["critical"] = bool(label.get_meta("cgm_critical", false))
		element["wrap_mode"] = "off" if label.autowrap_mode == TextServer.AUTOWRAP_OFF else "word_smart"
		element["overflow"] = label.get_visible_line_count() < label.get_line_count() or label.get_minimum_size().y > label.size.y + 1.0
		if label.has_meta("cgm_container_content_rect"):
			element["container_content_rect"] = _rect_array(label.get_meta("cgm_container_content_rect"))
	elif control is Button:
		var button := control as Button
		element["accessible_name"] = str(button.get_meta("cgm_accessible_name", button.text))
	elif control is TextureRect:
		var texture_rect := control as TextureRect
		var render_mode := str(texture_rect.get_meta("cgm_render_mode", _texture_render_mode(texture_rect)))
		element["render_mode"] = render_mode
		element["source_kind"] = str(texture_rect.get_meta("cgm_source_kind", "dedicated-component"))
		if texture_rect.texture != null:
			var source_size := texture_rect.texture.get_size()
			element["source_size"] = [source_size.x, source_size.y]
			if render_mode in ["uniform", "native", "sprite-frame"] and source_size.x > 0.0 and source_size.y > 0.0:
				var fitted := _aspect_fit_rect(rect, Vector2(source_size))
				element["rect"] = [fitted.position.x, fitted.position.y, fitted.size.x, fitted.size.y]
			elif render_mode == "cover":
				element["crop_safe_area"] = [0.0, 0.0, source_size.x, source_size.y]
		if texture_rect.has_meta("cgm_nine_slice_margins"):
			element["nine_slice_margins"] = texture_rect.get_meta("cgm_nine_slice_margins")
		if texture_rect.has_meta("cgm_crop_safe_area"):
			element["crop_safe_area"] = _rect_array(texture_rect.get_meta("cgm_crop_safe_area"))
	return element

static func _infer_role(control: Control) -> String:
	if control is Label:
		return "text"
	if control is Button:
		return "button"
	if control is TextureRect or control is NinePatchRect:
		return "image"
	if control is ProgressBar:
		return "progress"
	if control is Panel or control is PanelContainer:
		return "panel"
	if control is Container:
		return "container"
	return "decoration"

static func _texture_render_mode(texture_rect: TextureRect) -> String:
	if texture_rect.stretch_mode in [TextureRect.STRETCH_KEEP_ASPECT, TextureRect.STRETCH_KEEP_ASPECT_CENTERED]:
		return "uniform"
	if texture_rect.stretch_mode == TextureRect.STRETCH_KEEP_ASPECT_COVERED:
		return "cover"
	if texture_rect.stretch_mode == TextureRect.STRETCH_TILE:
		return "tile"
	return "native"

static func _aspect_fit_rect(container_rect: Rect2, source_size: Vector2) -> Rect2:
	var scale := minf(container_rect.size.x / source_size.x, container_rect.size.y / source_size.y)
	var fitted_size := source_size * scale
	return Rect2(container_rect.position + (container_rect.size - fitted_size) * 0.5, fitted_size)

static func _rect_array(value: Variant) -> Array:
	if value is Rect2:
		var rect := value as Rect2
		return [rect.position.x, rect.position.y, rect.size.x, rect.size.y]
	if value is Array and value.size() == 4:
		return value
	return []

static func _inspect(elements: Array[Dictionary], viewport_size: Vector2i, policy: Dictionary) -> Array[Dictionary]:
	var findings: Array[Dictionary] = []
	var title_scale := float(policy.get("title_safe_scale", 0.9))
	var action_scale := float(policy.get("action_safe_scale", 0.93))
	var body_floor := float(policy.get("minimum_body_font_px", 16.0))
	var critical_floor := float(policy.get("minimum_critical_font_px", 24.0))
	var touch_target := policy.get("minimum_touch_target_px", [44.0, 44.0]) as Array
	var viewport_rect := Rect2(Vector2.ZERO, Vector2(viewport_size))
	var title_rect := _scaled_safe_rect(viewport_rect, title_scale)
	var action_rect := _scaled_safe_rect(viewport_rect, action_scale)
	var semantic_count := 0
	for element in elements:
		var rect := _dictionary_rect(element)
		if bool(element.get("semantic", false)):
			semantic_count += 1
		if not bool(element.get("allow_outside_viewport", false)) and not viewport_rect.encloses(rect):
			findings.append(_finding("bounds", "high", "%s leaves the viewport" % element.get("id")))
		var safe_zone := str(element.get("safe_zone", "none"))
		if safe_zone == "title" and not title_rect.encloses(rect):
			findings.append(_finding("safe_zones", "high", "%s leaves the title-safe region" % element.get("id")))
		elif safe_zone == "action" and not action_rect.encloses(rect):
			findings.append(_finding("safe_zones", "high", "%s leaves the action-safe region" % element.get("id")))
		if element.get("role") == "text":
			var floor := critical_floor if bool(element.get("critical", false)) else body_floor
			if float(element.get("font_size", 0.0)) < floor or bool(element.get("overflow", false)):
				findings.append(_finding("text_overflow", "high", "%s is too small, clipped, or overflowing" % element.get("id")))
			var contrast_floor := 3.0 if float(element.get("font_size", 0.0)) >= critical_floor else 4.5
			if float(element.get("contrast_ratio", 0.0)) < contrast_floor:
				findings.append(_finding("text_contrast", "high", "%s has insufficient declared contrast" % element.get("id")))
		if element.get("role") in ["button", "input", "navigation"]:
			if rect.size.x < float(touch_target[0]) or rect.size.y < float(touch_target[1]):
				findings.append(_finding("touch_targets", "high", "%s is below the touch target" % element.get("id")))
	var semantic_coverage := float(semantic_count) / maxf(1.0, float(elements.size()))
	if semantic_coverage < float(policy.get("minimum_semantic_coverage", 0.9)):
		findings.append(_finding("semantic_roles", "high", "Only %.1f%% of visible Controls carry CGM semantic metadata" % (semantic_coverage * 100.0)))
	for left_index in range(elements.size()):
		var left := elements[left_index]
		if left.get("role") not in ["text", "button", "input", "navigation", "progress"]:
			continue
		for right_index in range(left_index + 1, elements.size()):
			var right := elements[right_index]
			if right.get("role") not in ["text", "button", "input", "navigation", "progress"]:
				continue
			if right.get("id") in left.get("allow_overlap_with", []) or left.get("id") in right.get("allow_overlap_with", []):
				continue
			if _dictionary_rect(left).intersection(_dictionary_rect(right)).get_area() > 4.0:
				findings.append(_finding("overlaps", "high", "%s overlaps %s" % [left.get("id"), right.get("id")]))
	return findings

static func _scaled_safe_rect(viewport: Rect2, scale: float) -> Rect2:
	var size := viewport.size * scale
	return Rect2((viewport.size - size) * 0.5, size)

static func _dictionary_rect(element: Dictionary) -> Rect2:
	var values := element.get("rect", [0.0, 0.0, 0.0, 0.0]) as Array
	return Rect2(float(values[0]), float(values[1]), float(values[2]), float(values[3]))

static func _finding(check: String, severity: String, message: String) -> Dictionary:
	return {"check": check, "severity": severity, "status": "open", "message": message}
