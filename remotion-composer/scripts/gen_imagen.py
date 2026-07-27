#!/usr/bin/env python3
"""Generate Imagen illustrations from the Gemini API into public/<dir>/.
Reads the API key from env GEMINI_API_KEY. Usage:
  GEMINI_API_KEY=... python3 scripts/gen_imagen.py <public_subdir> <shots_json>
where shots_json maps {name: object_clause}. A shared marker-sketch BASE prompt is
prepended. Writes <name>.jpg (4:3) into remotion-composer/public/<public_subdir>/."""
import os, sys, json, time
from google import genai
from google.genai import types

KEY = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
if not KEY:
    sys.exit("no GEMINI_API_KEY in env")
subdir = sys.argv[1]
shots = json.loads(sys.argv[2])
BASE = ("Rough hand-drawn black ink marker sketch illustration, loose sketchy strokes, minimal, a few dynamic ORANGE "
        "accent lines, plain WHITE background, lots of empty white space, viral card-news doodle style. "
        "ABSOLUTELY NO text, NO letters, NO words, NO labels anywhere in the image. ")
MODELS = ["imagen-4.0-generate-001", "imagen-3.0-generate-002"]
client = genai.Client(api_key=KEY)
outdir = os.path.join(os.path.dirname(__file__), "..", "public", subdir)
os.makedirs(outdir, exist_ok=True)

def gen(name, clause):
    for model in MODELS:
        for attempt in range(3):
            try:
                r = client.models.generate_images(
                    model=model, prompt=BASE + clause,
                    config=types.GenerateImagesConfig(number_of_images=1, aspect_ratio="4:3"))
                imgs = getattr(r, "generated_images", None)
                if imgs:
                    open(os.path.join(outdir, name + ".jpg"), "wb").write(imgs[0].image.image_bytes)
                    print(name, "ok", model); return True
                print(name, "empty", model)
            except Exception as e:
                print(name, "err", model, str(e)[:140]); time.sleep(8)
    return False

ok = 0
for k, v in shots.items():
    if gen(k, v):
        ok += 1
    time.sleep(3)
print(f"DONE {ok}/{len(shots)}")
