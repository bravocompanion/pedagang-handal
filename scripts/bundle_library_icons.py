"""Bundle 8 locally downloaded original Oyen images into HTML and Expo.
Requires Pillow: python -m pip install pillow
"""
from pathlib import Path
from io import BytesIO
import base64, json, re, subprocess, sys

try:
    from PIL import Image
except ImportError:
    raise SystemExit("Pillow is required: python -m pip install pillow")

ROOT = Path(__file__).resolve().parents[1]
HTML = ROOT / "preview/index.html"
FOLDER = ROOT / "assets/icons/original"
SLOTS = ["welcome","tutorial","warning","success","error","thinking","offline","celebrate"]
encoded = {}
for slot in SLOTS:
    path = next((FOLDER / (slot + ext) for ext in (".png",".webp",".jpg",".jpeg")
                 if (FOLDER / (slot + ext)).is_file()), None)
    if path is None:
        continue
    if path.stat().st_size > 10_000_000:
        raise SystemExit(f"{path} is too large; resize before bundling")
    with Image.open(path) as source:
        image = source.convert("RGBA")
        image.thumbnail((512,512), Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA", (512,512), (0,0,0,0))
        canvas.alpha_composite(image, ((512-image.width)//2, (512-image.height)//2))
        output = BytesIO()
        canvas.save(output, format="WEBP", quality=84, method=6)
    encoded[slot] = "data:image/webp;base64," + base64.b64encode(output.getvalue()).decode("ascii")

text = HTML.read_text(encoding="utf-8")
pattern = r"const OYEN_PREBUNDLED=\{.*?\}; // Filled by scripts/bundle_library_icons.py when PNGs are available"
replacement = "const OYEN_PREBUNDLED=" + json.dumps(encoded,separators=(",",":")) + "; // Filled by scripts/bundle_library_icons.py when PNGs are available"
new_text, found = re.subn(pattern, lambda match: replacement, text, count=1)
if found != 1:
    raise SystemExit("OYEN_PREBUNDLED marker missing from preview/index.html")
HTML.write_text(new_text, encoding="utf-8")

# Expo needs inline markup with the external config script retained for the bridge.
embedded = new_text.replace(
    '<script src="./config.js"></script>',
    '<script src="./config.js"></script>'
)
target = ROOT / "mobile/src/appHtml.ts"
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(
    "/* Generated from preview/index.html for native Expo WebView. */\n"
    + "export const APP_HTML: string = "
    + json.dumps(embedded,ensure_ascii=False)
    + ";\n", encoding="utf-8"
)
print(f"Embedded {len(encoded)}/8 Oyen original icons, WebP-compressed.")
if len(encoded) < 8:
    print("Missing:", ", ".join(slot for slot in SLOTS if slot not in encoded))
