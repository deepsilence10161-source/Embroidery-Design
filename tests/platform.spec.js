import {test,expect} from '@playwright/test';
const go=async(page,route)=>{await page.evaluate(route=>location.hash=route,route)};
async function mockNative(page,{cancel=false}={}){
  await page.addInitScript(({cancel})=>{
    window.nativeCalls=[];
    window.EmbroideryNative={isNative:true,
      async exportFile(file){window.nativeCalls.push({...file,type:'export',mime:file.type});if(cancel){const e=Error('Sharing cancelled');e.code='CANCELLED';throw e}return true},
      async selectPhoto(source){window.nativeCalls.push({type:'photo',source});const canvas=document.createElement('canvas');canvas.width=24;canvas.height=24;const c=canvas.getContext('2d');c.fillStyle='#a87af0';c.fillRect(0,0,24,24);return {dataUrl:canvas.toDataURL('image/png'),format:'png'}},
      async print(sheet){window.nativeCalls.push({type:'print',...sheet})},
      async exit(){window.nativeCalls.push({type:'exit'})}
    };
  },{cancel});
}
test('hosted install has a real worker and reloads completely offline',async({page,context})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await expect(page.locator('.design-card')).toHaveCount(3);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}))});
  expect(await page.locator('#app-manifest').getAttribute('href')).toContain('manifest.webmanifest');
  await go(page,'/settings');await expect(page.getByText('Open once online, then this website works offline.')).toBeVisible();
  await page.locator('[data-action="install"]').click();await expect(page.locator('.modal')).toContainText('includes its offline worker');await page.locator('[data-modal="close"]').last().click();
  await context.setOffline(true);await page.reload();await expect(page.locator('#settings-title')).toBeVisible();
  await go(page,'/designs');await expect(page.locator('.design-card')).toHaveCount(3);
  expect(errors).toEqual([]);
});
test('repository subpath keeps manifest, scope and offline navigation inside the repo',async({page,context})=>{
  await page.goto('http://127.0.0.1:4174/Embroidery-Design/');
  await expect(page.locator('.design-card')).toHaveCount(3);
  const info=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));const manifestURL=document.querySelector('#app-manifest').href;return {scope:r.scope,manifestURL,manifest:await(await fetch(manifestURL)).json()}});
  expect(info.scope).toBe('http://127.0.0.1:4174/Embroidery-Design/');expect(info.manifestURL).toContain('/Embroidery-Design/manifest.webmanifest');expect(info.manifest.start_url).toBe('./');
  await context.setOffline(true);await page.goto('http://127.0.0.1:4174/Embroidery-Design/EmbroideryGuide.html#/colors');await expect(page.locator('#color-search')).toBeVisible();
});
test('native backup and design sharing use files, not broken blob downloads',async({page})=>{
  await mockNative(page);let downloads=0;page.on('download',()=>downloads++);
  await page.goto('/#/settings');await expect(page.getByText('Android · offline ready')).toBeVisible();
  await expect(page.locator('[data-action="install"]')).toHaveCount(0);
  await page.locator('[data-action="export-all"]').click();
  await expect.poll(()=>page.evaluate(()=>window.nativeCalls.filter(x=>x.type==='export').length)).toBe(1);
  const file=await page.evaluate(()=>window.nativeCalls[0]);const backup=JSON.parse(file.content);expect(backup.format).toBe('EmbroideryGuide');expect(backup.designs).toHaveLength(3);expect(backup.appVersion).toBe('1.4.0');expect(downloads).toBe(0);
  const id=backup.designs[0].id;await go(page,'/design/'+id);await expect(page.locator('#detail-name')).toBeVisible();await page.locator('[data-action="share-design"]').click();
  await expect.poll(()=>page.evaluate(()=>window.nativeCalls.filter(x=>x.type==='export').length)).toBe(2);
  expect(JSON.parse((await page.evaluate(()=>window.nativeCalls[1])).content).designs).toHaveLength(1);
});
test('cancelling native export leaves the backup timestamp and workspace intact',async({page})=>{
  await mockNative(page,{cancel:true});await page.goto('/#/settings');await expect(page.locator('#settings-title')).toBeVisible();
  const before=await page.evaluate(()=>({...localStorage}));await page.locator('[data-action="export-all"]').click();await expect(page.locator('#toasts')).toContainText('Export cancelled');
  expect(await page.evaluate(()=>({...localStorage}))).toEqual(before);
});
test('native print submits an embedded A4 document; photo picker updates the same editor',async({page})=>{
  await mockNative(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/');await page.locator('.design-card [data-route]').first().click();await expect(page.locator('#detail-name')).toBeVisible();
  await page.locator('[data-action="print-design"]').click();await expect.poll(()=>page.evaluate(()=>window.nativeCalls.filter(x=>x.type==='print').length)).toBe(1);
  const print=await page.evaluate(()=>window.nativeCalls.find(x=>x.type==='print'));expect(print.html).toContain('@page');expect(print.html).toContain('print-root');expect(print.html).toContain('data:image/');
  await go(page,'/new');await page.locator('[data-action="upload-photo"]').click();await expect(page.locator('#photo-drop img')).toBeVisible();expect(await page.evaluate(()=>window.nativeCalls.find(x=>x.type==='photo').source)).toBe('photos');
  await page.locator('[data-action="camera-photo"]').click();await expect.poll(()=>page.evaluate(()=>window.nativeCalls.filter(x=>x.type==='photo').length)).toBe(2);expect(await page.evaluate(()=>window.nativeCalls.filter(x=>x.type==='photo')[1].source)).toBe('camera');expect(errors).toEqual([]);
});
test('Android hardware Back closes overlays, protects drafts, navigates and double-press exits',async({page})=>{
  await mockNative(page);await page.goto('/#/new');await page.fill('#design-name','Unsaved floor setup');
  const back=()=>page.evaluate(()=>document.dispatchEvent(new Event('embroidery-native-back')));
  await back();await expect(page.locator('.modal')).toContainText('unsaved');await back();await expect(page.locator('.modal')).toHaveCount(0);await expect(page.locator('#design-name')).toHaveValue('Unsaved floor setup');
  await back();await page.locator('[data-modal="confirm"]').click();await expect(page.locator('.design-card')).toHaveCount(3);
  await go(page,'/settings');await expect(page.locator('#settings-title')).toBeVisible();await back();await expect(page.locator('.design-card')).toHaveCount(3);
  await back();await expect(page.locator('#toasts')).toContainText('back');await back();await expect.poll(()=>page.evaluate(()=>window.nativeCalls.filter(x=>x.type==='exit').length)).toBe(1);
});
