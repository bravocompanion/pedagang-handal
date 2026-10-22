"""Bundle genuine Oyen icon PNGs/WebP into preview and Expo. Optional: --zip path.
Examples:
  python scripts/bundle_library_icons.py --zip ~/Downloads/pack-oyen.zip
  python scripts/bundle_library_icons.py   # uses assets/icons/original/*.png
Original files must be supplied by the user; no placeholder is silently labelled original.
"""
from pathlib import Path
from io import BytesIO
from PIL import Image
import argparse, base64, json, re, subprocess, sys, zipfile

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'assets/icons/original'
SLOTS=['welcome','tutorial','warning','success','error','thinking','offline','celebrate']
parser=argparse.ArgumentParser()
parser.add_argument('--zip', dest='zipfile', type=Path, help='Original Oyen icon ZIP exported from chat')
parser.add_argument('--allow-partial',action='store_true',help='Allow less than eight originals (only for testing)')
args=parser.parse_args()

def slot_from_name(filename, fallback_index=None):
    name=Path(filename).name.lower()
    match=re.match(r'^(welcome|tutorial|warning|success|error|thinking|offline|celebrate)(?=[._-])',name)
    if match:return match.group(1)
    match=re.search(r'(?:image-gen-|oyen[-_]?|icon[-_]?)([1-8])(?:\D|$)',name)
    if match:return SLOTS[int(match.group(1))-1]
    return SLOTS[fallback_index] if fallback_index is not None and fallback_index<8 else None

def import_zip(path):
    if not path.is_file() or path.stat().st_size>100*1024*1024:
        raise SystemExit('ZIP tidak ditemukan atau melebihi 100MB')
    chosen={}; unnamed=[]; total=0
    with zipfile.ZipFile(path) as archive:
        for info in archive.infolist():
            if info.is_dir() or not re.search(r'\.(png|jpe?g|webp)$',info.filename,re.I):continue
            if info.flag_bits & 1:raise SystemExit('Encrypted ZIP not supported')
            if info.file_size>12*1024*1024:raise SystemExit('Individual icon exceeds 12MB')
            total+=info.file_size
            if total>80*1024*1024:raise SystemExit('ZIP uncompressed payload exceeds 80MB')
            b=archive.read(info)
            slot=slot_from_name(info.filename)
            if slot:chosen[slot]=b
            elif len(unnamed)<8:unnamed.append(b)
    for slot in SLOTS:
        if slot not in chosen and unnamed:chosen[slot]=unnamed.pop(0)
    if len(chosen)<8 and not args.allow_partial:
        raise SystemExit(f'ZIP hanya memiliki {len(chosen)}/8 gambar Oyen yang dapat dikenali; periksa nama file atau pakai --allow-partial untuk tes')
    for slot,b in chosen.items():
        # Pillow verifies the bytes are truly image files before writing to disk.
        with Image.open(BytesIO(b)) as img:
            img.verify()
        (FOLDER/(slot+'.png')).write_bytes(b)
    return len(chosen)

FOLDER.mkdir(parents=True,exist_ok=True)
if args.zipfile:
    print('Extracted',import_zip(args.zipfile),'originals from',args.zipfile)
encoded={}
for slot in SLOTS:
    path=next((FOLDER/(slot+ext) for ext in ('.png','.webp','.jpg','.jpeg') if (FOLDER/(slot+ext)).is_file()),None)
    if not path:continue
    if path.stat().st_size>12*1024*1024:raise SystemExit('Oversized icon: '+str(path))
    with Image.open(path) as original:
        image=original.convert('RGBA');image.thumbnail((448,448),Image.Resampling.LANCZOS)
        square=Image.new('RGBA',(448,448),(0,0,0,0))
        square.alpha_composite(image,((448-image.width)//2,(448-image.height)//2))
        buffer=BytesIO();square.save(buffer,format='WEBP',quality=82,method=6)
        encoded[slot]='data:image/webp;base64,'+base64.b64encode(buffer.getvalue()).decode('ascii')

if len(encoded)!=8 and not args.allow_partial:
    raise SystemExit(f'Found {len(encoded)}/8 icons. Nothing changed. Provide the 8 original PNGs/ZIP (or use --allow-partial for tests).')

html=ROOT/'preview/index.html'
source=html.read_text(encoding='utf-8')
pattern=r'const OYEN_PREBUNDLED=\{.*?\}; // Filled by scripts/bundle_library_icons.py when PNGs are available'
replacement='const OYEN_PREBUNDLED='+json.dumps(encoded,separators=(',',':'))+'; // Filled by scripts/bundle_library_icons.py when PNGs are available'
patched,count=re.subn(pattern,lambda m:replacement,source,count=1)
if count!=1:raise SystemExit('Marker OYEN_PREBUNDLED not found; no file altered')
html.write_text(patched,encoding='utf-8')

if 'welcome' in encoded:
    # Create native launcher using genuine Oyen art, not an unrelated placeholder.
    with Image.open(FOLDER/'welcome.png') as original:
        png=original.convert('RGBA')
        png.thumbnail((860,860),Image.Resampling.LANCZOS)
    canvas=Image.new('RGBA',(1024,1024),'#eef9f5')
    canvas.alpha_composite(png,((1024-png.width)//2,(1024-png.height)//2))
    canvas.convert('RGB').save(ROOT/'mobile/assets/icon.png',format='PNG',optimize=True)
    transparent=Image.new('RGBA',(1024,1024),(0,0,0,0))
    transparent.alpha_composite(png,((1024-png.width)//2,(1024-png.height)//2))
    transparent.save(ROOT/'mobile/assets/adaptive-icon.png',format='PNG',optimize=True)

subprocess.run([sys.executable,str(ROOT/'build_mobile_html.py')],cwd=ROOT,check=True)
print('Bundled',len(encoded),'/8 genuine Oyen icons into HTML, Expo, and launcher.')