#!/usr/bin/env python3
"""Generate the Korean train window background series.

Renders the 4-frame continuous series defined in prompts.json through the
registry's image_selector, so whichever configured image provider is available
gets used (FAL_KEY / GOOGLE_API_KEY / OPENAI_API_KEY etc.).

Consistency strategy:
  1. Generate frame_01 with a fixed seed.
  2. If an edit-capable provider is available, produce frames 2-4 by editing
     frame_01 (only the window view changes). Otherwise fall back to fresh
     generations sharing the same seed + interior prompt block.

Usage:
    python assets/backgrounds/korean-train-window/generate.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(REPO_ROOT))

PROMPTS = json.loads((Path(__file__).parent / "prompts.json").read_text(encoding="utf-8"))
OUT_DIR = REPO_ROOT / "projects" / "korean-train-window-bg" / "assets" / "images"

EDIT_CAPABLE_HINTS = ("kontext", "nano_banana", "edit")


def frame_prompt(frame: dict) -> str:
    return f"{PROMPTS['interior_block']}, {frame['window_view']}"


def main() -> int:
    from tools.tool_registry import registry

    registry.discover()
    selector = registry.get("image_selector")
    if selector is None:
        print("image_selector not found in registry", file=sys.stderr)
        return 1

    available = [t for t in registry.get_by_capability("image_generation") if t.get_status().name == "AVAILABLE"]
    if not available:
        print(
            "No image provider configured. Set one of: FAL_KEY, GOOGLE_API_KEY, "
            "OPENAI_API_KEY (see registry install_instructions).",
            file=sys.stderr,
        )
        return 1
    print(f"Available providers: {[t.provider for t in available]}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    edit_capable = any(any(h in t.name for h in EDIT_CAPABLE_HINTS) for t in available)

    base_path: Path | None = None
    for i, frame in enumerate(PROMPTS["frames"]):
        out_path = OUT_DIR / f"{frame['id']}.png"
        inputs = {
            "prompt": frame_prompt(frame),
            "negative_prompt": PROMPTS["negative_prompt"],
            "seed": PROMPTS["seed"],
            "aspect_ratio": PROMPTS["aspect_ratio"],
            "output_path": str(out_path),
        }
        if i > 0 and edit_capable and base_path and base_path.exists():
            # Edit path: keep the interior pixel-identical, swap only the window.
            inputs["image_path"] = str(base_path)
            inputs["prompt"] = (
                "Keep the train interior, bench seat, pole, window frame, lighting and "
                f"color grade exactly the same. Change ONLY the view outside the window to: {frame['window_view']}"
            )

        print(f"[{frame['id']}] {frame['scene']} ...")
        result = selector.execute(inputs)
        if not result.success:
            print(f"  FAILED: {result.error}", file=sys.stderr)
            return 1
        print(f"  -> {out_path}")
        if i == 0:
            base_path = out_path

    print(f"\nDone. Series written to {OUT_DIR}")
    print("Optional next steps: outpaint to 9:16 for Reels, or animate each frame")
    print("with an image-to-video provider using prompts.json:video_motion_prompt.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
