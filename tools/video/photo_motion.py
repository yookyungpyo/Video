"""Turn a still photo into a short motion clip — locally, with no API cost.

This is a *camera* simulator, not a subject animator. It does not generate
limbs, gait, or cloth motion; it moves a virtual camera over a still frame so
a standing/walking subject reads as being followed by a handheld shot.

The motion model layers three signals:

1. ``dolly``  — an eased zoom from ``zoom_start`` to ``zoom_end``. This is the
   "camera approaching the subject" component, and it does most of the work of
   selling forward movement.
2. ``gait``   — the operator's own footfalls. A carried camera rises and falls
   once per step, so the vertical term is a plain cosine at
   ``steps_per_second``; weight shifts side to side once per *gait cycle*
   (two steps), so the lateral term and its coupled roll run at half that.
   Both are deliberately small — on a still frame a strong periodic bounce
   reads as a glitch rather than as walking.
3. ``drift``  — band-limited noise on position, roll and scale. This is the
   layer that actually sells "handheld". Real camera motion is never a pure
   sine; without an aperiodic component the shot reads as a mechanical
   wobble no matter how the gait terms are tuned.

Noise is cubic-interpolated from a seeded value table, so output stays
deterministic for a given ``seed``.

Everything runs through OpenCV + the bundled imageio-ffmpeg binary, so the tool
needs no API key, no GPU, and no system ffmpeg on PATH.
"""

from __future__ import annotations

import math
import time
import unicodedata
from pathlib import Path
from typing import Any, Optional

from tools.base_tool import (
    BaseTool,
    Determinism,
    ResourceProfile,
    ToolResult,
    ToolRuntime,
    ToolStability,
    ToolTier,
)

# Fonts that cover Latin, in preference order.
_LATIN_FONTS = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]

# Fonts that cover Hangul / CJK, in preference order.
_CJK_FONTS = [
    "/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc",
    "/usr/share/fonts/opentype/unifont/unifont.otf",
]


def _has_cjk(text: str) -> bool:
    """True if the string contains Hangul or other CJK codepoints."""
    for ch in text:
        if unicodedata.category(ch).startswith("L") and ord(ch) > 0x2E80:
            return True
    return False


def _pick_font(text: str, size: int):
    """Load the best available font that can render ``text``."""
    from PIL import ImageFont

    candidates = (_CJK_FONTS + _LATIN_FONTS) if _has_cjk(text) else _LATIN_FONTS
    for path in candidates:
        if Path(path).is_file():
            try:
                return ImageFont.truetype(path, size)
            except OSError:
                continue
    return ImageFont.load_default()


def _cover_crop(img, aspect: float):
    """Centre-crop ``img`` (H, W, 3) to the given width/height ratio."""
    h, w = img.shape[:2]
    if w / h > aspect:  # too wide -> trim sides
        new_w = int(round(h * aspect))
        x = (w - new_w) // 2
        return img[:, x:x + new_w]
    new_h = int(round(w / aspect))  # too tall -> trim top/bottom
    y = (h - new_h) // 2
    return img[y:y + new_h, :]


def _wrap(draw, text: str, font, max_width: int) -> list[str]:
    """Greedy word wrap; falls back to per-character for scripts without spaces."""
    lines: list[str] = []
    for paragraph in text.split("\n"):
        words = paragraph.split(" ")
        if len(words) == 1 and draw.textlength(paragraph, font=font) > max_width:
            words = list(paragraph)
            joiner = ""
        else:
            joiner = " "
        current = ""
        for word in words:
            trial = f"{current}{joiner}{word}" if current else word
            if current and draw.textlength(trial, font=font) > max_width:
                lines.append(current)
                current = word
            else:
                current = trial
        lines.append(current)
    return lines


class _Drift:
    """Deterministic band-limited noise, sampled as a function of time.

    Random values on a fixed lattice, cubic-interpolated between them and
    summed over a couple of octaves. The result wanders like a hand rather
    than oscillating like a sine, which is the whole point of using it over
    ``sin`` for the handheld layer.
    """

    _TABLE = 2048

    def __init__(self, seed: int, freq: float, octaves: int = 2) -> None:
        import random

        rng = random.Random(seed)
        self._values = [rng.uniform(-1.0, 1.0) for _ in range(self._TABLE)]
        self._freq = freq
        self._octaves = max(1, octaves)

    def _sample(self, x: float) -> float:
        """Catmull-Rom interpolation of the value table at position ``x``."""
        table = self._values
        n = len(table)
        i = int(math.floor(x))
        t = x - i
        p0, p1, p2, p3 = (table[(i + k) % n] for k in (-1, 0, 1, 2))
        return 0.5 * (
            2.0 * p1
            + (-p0 + p2) * t
            + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t * t
            + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t * t * t
        )

    def __call__(self, t: float) -> float:
        total = 0.0
        norm = 0.0
        amp = 1.0
        freq = self._freq
        for _ in range(self._octaves):
            total += amp * self._sample(t * freq)
            norm += amp
            amp *= 0.5
            freq *= 2.0
        return total / norm


class PhotoMotion(BaseTool):
    """Still image -> short vertical motion clip, rendered locally for free."""

    name = "photo_motion"
    version = "1.0.0"
    tier = ToolTier.CORE
    capability = "video_post"
    provider = "openmontage"
    stability = ToolStability.BETA
    determinism = Determinism.DETERMINISTIC
    runtime = ToolRuntime.LOCAL

    dependencies = [
        "python:cv2",
        "python:numpy",
        "python:PIL",
        "python:imageio",
        "python:imageio_ffmpeg",
    ]
    install_instructions = (
        "pip install opencv-python-headless numpy pillow imageio 'imageio[ffmpeg]' "
        "— all free, no API key, no GPU, and no system ffmpeg needed "
        "(the ffmpeg binary ships inside imageio-ffmpeg)."
    )

    capabilities = ["image_to_video", "ken_burns", "text_overlay"]

    best_for = [
        "turning one illustration or photo into a social-ready vertical clip",
        "quote / affirmation reels where the subject is already in frame",
        "free b-roll when no video-generation budget exists",
    ]
    not_good_for = [
        "real gait animation — arms, legs and cloth do not move",
        "changing the subject's pose or expression",
        "anything needing new content outside the source frame",
    ]

    supports = {
        "aspect_ratios": ["9:16", "1:1", "16:9", "4:5"],
        "max_duration_seconds": 60,
        "audio": False,
        "text_overlay": True,
        "cost_usd": 0.0,
    }

    resource_profile = ResourceProfile(
        cpu_cores=2, ram_mb=1024, vram_mb=0, disk_mb=200, network_required=False
    )

    input_schema = {
        "type": "object",
        "required": ["image_path", "output_path"],
        "properties": {
            "image_path": {"type": "string", "description": "Source still image."},
            "output_path": {"type": "string", "description": "Destination .mp4."},
            "duration": {"type": "number", "default": 8.0},
            "fps": {"type": "integer", "default": 30},
            "width": {"type": "integer", "default": 1080},
            "height": {"type": "integer", "default": 1920},
            "zoom_start": {"type": "number", "default": 1.02},
            "zoom_end": {
                "type": "number",
                "default": 1.09,
                "description": (
                    "Subject's zoom at the end. Kept gentle on purpose — a hard "
                    "push-in on a still only advertises that the pose is frozen."
                ),
            },
            "subject_mask": {
                "type": "string",
                "description": (
                    "Optional greyscale matte of the subject. Supplying one "
                    "switches on layered parallax; without it the render is flat."
                ),
            },
            "bg_depth": {
                "type": "number",
                "default": 0.45,
                "description": (
                    "Background's share of the dolly, 0-1. Lower reads as more "
                    "depth. Layered mode only."
                ),
            },
            "steps_per_second": {"type": "number", "default": 1.7},
            "bob_px": {"type": "number", "default": 5.0},
            "sway_px": {"type": "number", "default": 2.5},
            "handheld": {
                "type": "number",
                "default": 0.35,
                "description": "Master amount for the drift layer. 0 disables it.",
            },
            "drift_px": {"type": "number", "default": 8.0},
            "drift_roll_deg": {"type": "number", "default": 0.10},
            "drift_scale": {"type": "number", "default": 0.004},
            "drift_freq": {
                "type": "number",
                "default": 0.28,
                "description": "Base drift rate in Hz. Higher is jitterier.",
            },
            "seed": {"type": "integer", "default": 7},
            "text": {"type": "string", "default": ""},
            "text_position": {"enum": ["top", "center", "bottom"], "default": "top"},
            "text_size": {"type": "integer", "description": "Defaults to width/16."},
            "text_color": {"type": "string", "default": "#2b2118"},
            "text_stroke": {"type": "string", "default": ""},
            "text_fade_in": {"type": "number", "default": 0.8},
            "crf": {"type": "integer", "default": 18},
        },
    }

    output_schema = {
        "type": "object",
        "properties": {
            "output_path": {"type": "string"},
            "duration": {"type": "number"},
            "fps": {"type": "integer"},
            "resolution": {"type": "string"},
            "frames": {"type": "integer"},
        },
    }

    user_visible_verification = [
        "Open the mp4 — the subject should drift toward the camera, not jitter.",
        "Motion should read as a handheld follow; limbs stay static by design.",
    ]

    idempotency_key_fields = ["image_path", "duration", "fps", "text", "seed"]

    def estimate_cost(self, inputs: dict[str, Any]) -> float:
        return 0.0

    def estimate_runtime(self, inputs: dict[str, Any]) -> float:
        frames = float(inputs.get("duration", 8.0)) * int(inputs.get("fps", 30))
        return round(frames * 0.02, 1)

    # ---- motion model ----

    @staticmethod
    def _camera_at(
        t: float, cfg: dict[str, Any], drift: dict[str, "_Drift"]
    ) -> tuple[float, float, float, float]:
        """Return the camera's (dolly, dx, dy, roll_deg) at time ``t``.

        This is the whole rig moving. It applies identically to every layer —
        anything that should move *within* the scene belongs in ``_gait_at``.
        """
        progress = min(max(t / cfg["duration"], 0.0), 1.0)
        # Mostly smoothstep, but blended with a linear ramp so the push-in is
        # already moving in the first second instead of sitting still.
        smooth = progress * progress * (3.0 - 2.0 * progress)
        eased = 0.3 * progress + 0.7 * smooth
        dolly = cfg["zoom_start"] + (cfg["zoom_end"] - cfg["zoom_start"]) * eased

        hand = cfg["handheld"]
        dx = hand * cfg["drift_px"] * drift["x"](t)
        dy = hand * cfg["drift_px"] * drift["y"](t)
        roll = hand * cfg["drift_roll_deg"] * drift["roll"](t)
        dolly *= 1.0 + hand * cfg["drift_scale"] * drift["scale"](t)

        return dolly, dx, dy, roll

    @staticmethod
    def _gait_at(t: float, cfg: dict[str, Any]) -> tuple[float, float]:
        """Return the subject's own (dx, dy) footfall offset at time ``t``.

        Only meaningful in layered mode. A walking person rises and falls
        against a background that stays put; applying this to the whole frame
        instead — as a single-layer render must — shakes the world rather than
        the walker, which is what reads as fake.
        """
        step = 2.0 * math.pi * cfg["steps_per_second"] * t
        # Body rises and falls once per step. A plain cosine keeps that smooth;
        # a rectified sine would put a velocity cusp on every footfall.
        dy = -cfg["bob_px"] * math.cos(step)
        # Weight shifts once per gait cycle = once per two steps.
        dx = cfg["sway_px"] * math.sin(step * 0.5)
        return dx, dy

    # ---- text layer ----

    def _build_text_layer(self, size: tuple[int, int], inputs: dict[str, Any]):
        """Pre-render the caption once as an RGBA overlay."""
        import numpy as np
        from PIL import Image, ImageDraw

        text = str(inputs.get("text") or "").strip()
        if not text:
            return None

        width, height = size
        font_size = int(inputs.get("text_size") or max(24, width // 16))
        font = _pick_font(text, font_size)

        layer = Image.new("RGBA", size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(layer)

        margin = int(width * 0.08)
        lines = _wrap(draw, text, font, width - 2 * margin)
        line_h = int(font_size * 1.32)
        block_h = line_h * len(lines)

        position = inputs.get("text_position", "top")
        if position == "top":
            y = int(height * 0.07)
        elif position == "bottom":
            y = height - block_h - int(height * 0.12)
        else:
            y = (height - block_h) // 2

        fill = inputs.get("text_color", "#2b2118")
        stroke = inputs.get("text_stroke") or None
        stroke_w = max(1, font_size // 18) if stroke else 0

        for line in lines:
            w = draw.textlength(line, font=font)
            draw.text(
                ((width - w) / 2, y),
                line,
                font=font,
                fill=fill,
                stroke_width=stroke_w,
                stroke_fill=stroke,
            )
            y += line_h

        return np.asarray(layer).astype(np.float32)

    # ---- execution ----

    def execute(self, inputs: dict[str, Any]) -> ToolResult:
        started = time.time()
        try:
            self.check_dependencies()
        except Exception as exc:  # DependencyError
            return ToolResult(success=False, error=str(exc))

        import cv2
        import imageio.v2 as imageio
        import numpy as np

        src_path = Path(str(inputs["image_path"])).expanduser()
        if not src_path.is_file():
            return ToolResult(success=False, error=f"Image not found: {src_path}")

        out_path = Path(str(inputs["output_path"])).expanduser()
        out_path.parent.mkdir(parents=True, exist_ok=True)

        src = cv2.imread(str(src_path), cv2.IMREAD_COLOR)
        if src is None:
            return ToolResult(success=False, error=f"Unreadable image: {src_path}")

        out_w = int(inputs.get("width", 1080))
        out_h = int(inputs.get("height", 1920))
        fps = int(inputs.get("fps", 30))
        duration = float(inputs.get("duration", 8.0))
        n_frames = max(1, int(round(duration * fps)))

        cfg = {
            "duration": duration,
            "zoom_start": float(inputs.get("zoom_start", 1.02)),
            "zoom_end": float(inputs.get("zoom_end", 1.09)),
            "steps_per_second": float(inputs.get("steps_per_second", 1.7)),
            "bob_px": float(inputs.get("bob_px", 5.0)),
            "sway_px": float(inputs.get("sway_px", 2.5)),
            "handheld": float(inputs.get("handheld", 0.35)),
            "drift_px": float(inputs.get("drift_px", 8.0)),
            "drift_roll_deg": float(inputs.get("drift_roll_deg", 0.10)),
            "drift_scale": float(inputs.get("drift_scale", 0.004)),
        }

        # Independent noise channels; the offsets keep them uncorrelated so the
        # frame wanders rather than sliding along one diagonal.
        seed = int(inputs.get("seed", 7))
        drift_freq = float(inputs.get("drift_freq", 0.28))
        drift = {
            "x": _Drift(seed, drift_freq),
            "y": _Drift(seed + 101, drift_freq * 1.17),
            "roll": _Drift(seed + 202, drift_freq * 0.83),
            "scale": _Drift(seed + 303, drift_freq * 0.61),
        }

        base = _cover_crop(src, out_w / out_h)
        base_h, base_w = base.shape[:2]
        # Scale that maps the cropped source exactly onto the output frame.
        fit = out_w / base_w
        centre = (base_w / 2.0, base_h / 2.0)

        # --- optional depth separation ---
        # With a mask the render becomes two layers moving at different rates,
        # which is what gives a flat still any sense of depth. Without one,
        # every pixel scales together and the push-in reads as a zoom on a
        # photograph, because that is exactly what it is.
        mask_path = inputs.get("subject_mask")
        alpha = None
        bg_plate = None
        if mask_path:
            mask_file = Path(str(mask_path)).expanduser()
            if not mask_file.is_file():
                return ToolResult(success=False, error=f"Mask not found: {mask_file}")
            raw_mask = cv2.imread(str(mask_file), cv2.IMREAD_GRAYSCALE)
            if raw_mask is None:
                return ToolResult(success=False, error=f"Unreadable mask: {mask_file}")
            if raw_mask.shape[:2] != src.shape[:2]:
                raw_mask = cv2.resize(raw_mask, (src.shape[1], src.shape[0]))
            mask = _cover_crop(raw_mask, out_w / out_h)

            # Fill in what sits behind the subject. The layers separate by only
            # a few pixels, so this is ever visible as a thin rim — but without
            # it that rim smears a copy of the subject.
            solid = (mask > 127).astype("uint8") * 255
            hole = cv2.dilate(solid, np.ones((15, 15), np.uint8), iterations=1)
            bg_plate = cv2.inpaint(base, hole, 5, cv2.INPAINT_TELEA)

            alpha = (cv2.GaussianBlur(mask, (0, 0), 3.0).astype(np.float32) / 255.0)[
                :, :, None
            ]

        bg_depth = float(inputs.get("bg_depth", 0.45))

        # The camera can only pan as far as the zoom margin allows before the
        # frame edge runs out of picture and smears. The background takes only
        # bg_depth of the dolly, so it is the layer that runs out first — size
        # the floor off that, not off the subject's zoom.
        half_diagonal = math.hypot(out_w, out_h) / 2.0
        excursion = cfg["handheld"] * (
            cfg["drift_px"] + math.radians(cfg["drift_roll_deg"]) * half_diagonal
        )
        share = bg_depth if alpha is not None else 1.0
        floor = 1.0 + 2.0 * excursion / (min(out_w, out_h) * max(share, 1e-6))
        zoom_floor_applied = None
        if cfg["zoom_start"] < floor:
            zoom_floor_applied = round(floor, 4)
            span = cfg["zoom_end"] - cfg["zoom_start"]
            cfg["zoom_start"] = floor
            cfg["zoom_end"] = floor + span

        text_layer = self._build_text_layer((out_w, out_h), inputs)
        fade_in = float(inputs.get("text_fade_in", 0.8))

        writer = imageio.get_writer(
            str(out_path),
            fps=fps,
            codec="libx264",
            macro_block_size=None,
            pixelformat="yuv420p",
            ffmpeg_params=[
                "-crf", str(int(inputs.get("crf", 18))),
                "-preset", "medium",
            ],
        )
        try:
            for i in range(n_frames):
                t = i / fps
                dolly, cam_dx, cam_dy, roll = self._camera_at(t, cfg, drift)

                def warp(layer, scale: float, dx: float, dy: float):
                    matrix = cv2.getRotationMatrix2D(centre, roll, fit * scale)
                    matrix[0, 2] += out_w / 2.0 - centre[0] + dx
                    matrix[1, 2] += out_h / 2.0 - centre[1] + dy
                    return cv2.warpAffine(
                        layer,
                        matrix,
                        (out_w, out_h),
                        # Lanczos holds edge detail better than cubic, and the
                        # dolly means most frames are a mild upscale.
                        flags=cv2.INTER_LANCZOS4,
                        borderMode=cv2.BORDER_REPLICATE,
                    )

                if alpha is None:
                    frame = warp(base, dolly, cam_dx, cam_dy)
                else:
                    # Dollying in grows near things faster than far things.
                    # Damping the background's share of the zoom is what makes
                    # the subject read as standing in front of the street
                    # rather than printed on it.
                    bg_scale = 1.0 + (dolly - 1.0) * bg_depth
                    gait_dx, gait_dy = self._gait_at(t, cfg)

                    back = warp(bg_plate, bg_scale, cam_dx, cam_dy)
                    front = warp(base, dolly, cam_dx + gait_dx, cam_dy + gait_dy)
                    a = warp(alpha, dolly, cam_dx + gait_dx, cam_dy + gait_dy)
                    if a.ndim == 2:
                        a = a[:, :, None]
                    frame = back.astype(np.float32) * (1.0 - a) + front.astype(np.float32) * a

                rgb = cv2.cvtColor(frame.astype(np.uint8), cv2.COLOR_BGR2RGB).astype(np.float32)

                if text_layer is not None:
                    opacity = min(t / fade_in, 1.0) if fade_in > 0 else 1.0
                    alpha = (text_layer[:, :, 3:4] / 255.0) * opacity
                    rgb = rgb * (1.0 - alpha) + text_layer[:, :, :3] * alpha

                writer.append_data(np.clip(rgb, 0, 255).astype(np.uint8))
        finally:
            writer.close()

        return ToolResult(
            success=True,
            data={
                "output_path": str(out_path),
                "duration": round(n_frames / fps, 3),
                "fps": fps,
                "resolution": f"{out_w}x{out_h}",
                "frames": n_frames,
                "layered": alpha is not None,
                "zoom_floor_applied": zoom_floor_applied,
            },
            artifacts=[str(out_path)],
            cost_usd=0.0,
            duration_seconds=round(time.time() - started, 2),
        )
