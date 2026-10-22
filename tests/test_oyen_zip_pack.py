from pathlib import Path
from io import BytesIO
import zipfile, threading, http.server, socketserver, tempfile
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
class Quiet(http.server.SimpleHTTPRequestHandler):
 def log_message(self,*args): pass

def pack():
 out=BytesIO()
 with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED) as z:
  for i in range(1,9):
   a=BytesIO()
   image=Image.new('RGBA',(170,170),(20*i,140,100,255));image.save(a,format='PNG')
   z.writestr(f'from-ChatGPT/image-gen-{i}(20261016).png',a.getvalue())
 return out.getvalue()

url='https://pedaganghandal.test/'
with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--no-proxy-server','--proxy-bypass-list=*'])
  for width in [320,393,768]:
   page=browser.new_page(viewport={'width':width,'height':880})
   errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
   page.set_content((ROOT/'preview/index.html').read_text(),wait_until='domcontentloaded')
   page.locator('[data-auth="demo"]').click()
   page.wait_for_selector('text=Kopi Susu Gula Aren')
   page.locator('button[data-tab="settings"]:visible').first.click()
   assert '0/8' in page.locator('.icon-gallery').inner_text()
   page.locator('#oyen-import').set_input_files({'name':'pack-original-oyen.zip','mimeType':'application/zip','buffer':pack()})
   page.wait_for_function("document.querySelector('.icon-gallery')?.innerText.includes('8/8')",timeout=15000)
   assert page.locator('.oyen-original').count()>16
   assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'overflow {width}'
   assert '8/8' in page.locator('.icon-gallery').inner_text(),'Icons not applied'
   # Verify user-facing icons remain available for main tabs.
   page.locator('button[data-tab="professional"]:visible').first.click()
   assert page.locator('.oyen-original').count()>0
   assert not errors,errors
   print('PASS browser ZIP import, active icons, HPP Pro and no overflow:',width)
   page.close()
  browser.close()
