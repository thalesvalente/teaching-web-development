/** Auditoria instrumental da bancada Aula 05 em celular: sem chamada Google e sem escrita. */
import {test,expect} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import {join} from 'node:path';

const sizes=[
  {width:320,height:640,name:'320x640'},
  {width:360,height:740,name:'360x740'},
  {width:390,height:844,name:'390x844'},
  {width:430,height:932,name:'430x932'}
];
const metrics=()=>{
  const rect=el=>{
    if(!el)return null;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
      scrollH:el.scrollHeight,clientH:el.clientHeight,overflow:s.overflowY,display:s.display};
  };
  const $=s=>document.querySelector(s);
  return {
    innerHeight,innerWidth,documentHeight:document.documentElement.scrollHeight,
    docWidth:document.documentElement.scrollWidth,
    header:rect($('.app-header')),
    mission:rect($('.mission-panel')),
    directions:rect($('.mission-copy')),
    footer:rect($('.mission-footer')),
    workspace:rect($('.workspace')),
    code:rect($('#code')),
    toolbar:rect($('.workspace-toolbar')),
    tabs:rect($('.file-tabs')),
    iframe:rect($('#preview')),
    status:rect($('#compiler-status')),
    headerTools:rect($('.header-tools')),
    previewTab:rect($('#view-preview')),
    controls:['#guide-locate','#run','#guide-check','#guide-prev','#guide-next','#mission-select','#view-code','#view-preview']
      .map(selector=>({selector,box:rect($(selector))}))
  };
};
test('MOBILE-AUDIT: medir MISSÃO, CÓDIGO, RESULTADO e prévias sem dados reais',async({page})=>{
  test.setTimeout(120000);
  mkdirSync('test-artifacts',{recursive:true});
  for(const {width,height,name} of sizes){
    await page.setViewportSize({width,height});
    await page.goto('/index.html');
    await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
    const before=await page.evaluate(metrics);
    console.log('MOBILE_AUDIT_AFTER_MISSION '+JSON.stringify({name,...before}));
    await page.screenshot({path:join('test-artifacts','mobile-new-'+name+'-mission.png')});
    await page.locator('#mobile-tab-code').click();
    const code=await page.evaluate(metrics);
    console.log('MOBILE_AUDIT_AFTER_CODE '+JSON.stringify({name,...code}));
    await page.screenshot({path:join('test-artifacts','mobile-new-'+name+'-code.png')});
    await page.locator('#mobile-tab-preview').click();
    const after=await page.evaluate(metrics);
    const frame=page.frameLocator('#preview');
    const preview=await frame.locator('body').evaluate(body=>{
      const panels=[...body.querySelectorAll('.display')].map(el=>{
        const r=el.getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),
          w:Math.round(r.width),h:Math.round(r.height),display:getComputedStyle(el).display};
      });
      return {viewport:{w:innerWidth,h:innerHeight},scrollH:document.documentElement.scrollHeight,
        scrollW:document.documentElement.scrollWidth,panels};
    });
    console.log('MOBILE_AUDIT_AFTER_PREVIEW '+JSON.stringify({name,...after,preview}));
    await page.screenshot({path:join('test-artifacts','mobile-new-'+name+'-preview-web.png')});
    await frame.locator('#preview-device-mobile').click();
    await page.screenshot({path:join('test-artifacts','mobile-new-'+name+'-preview-mobile.png')});
  }
});


test('MOBILE-AUDIT-OLD-DRAFT: medir editor normal e ampliado com rascunho antigo',async({page})=>{
  for(const {width,height,name} of [sizes[0],sizes[2]]){
    await page.setViewportSize({width,height});
    await page.addInitScript(()=>{
      localStorage.setItem('ifma-web-aula05-lab-v2',JSON.stringify({
        code:'// Exemplo de código antigo.\nexport const MINIMO_CARACTERES = 9;'
      }));
    });
    await page.goto('/index.html');
    await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
    await page.locator('#mobile-tab-code').click();
    await expect(page.locator('#migration-note')).toHaveCount(0);
    await expect(page.locator('#legacy-export')).not.toBeVisible();
    const normal=await page.locator('#code').evaluate(el=>Math.round(el.getBoundingClientRect().height));
    const layout=await page.locator('.toolbar-buttons').evaluate(el=>({
      buttons:[...el.querySelectorAll('button:visible')].length,
      height:Math.round(el.getBoundingClientRect().height)
    }));
    await page.screenshot({path:join('test-artifacts','mobile-ux02-'+name+'-editor.png')});
    await page.locator('#mobile-editor-focus').click();
    const expanded=await page.locator('#code').evaluate(el=>Math.round(el.getBoundingClientRect().height));
    await page.screenshot({path:join('test-artifacts','mobile-ux02-'+name+'-editor-expanded.png')});
    expect(normal).toBeGreaterThanOrEqual(300);
    expect(expanded).toBeGreaterThan(normal+30);
    console.log('MOBILE_EDITOR_V2_METRICS '+JSON.stringify({name,normal,expanded,toolbar:layout}));
  }
});
