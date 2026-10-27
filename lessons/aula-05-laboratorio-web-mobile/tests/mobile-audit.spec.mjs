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
test('MOBILE-AUDIT: medir a bancada em dimensões reais e guardar capturas',async({page})=>{
  mkdirSync('test-artifacts',{recursive:true});
  for(const {width,height,name} of sizes){
    await page.setViewportSize({width,height});
    await page.goto('/index.html');
    await expect(page.locator('#compiler-status')).toContainText('Executado',{timeout:30000});
    const before=await page.evaluate(metrics);
    console.log('MOBILE_AUDIT_MISSION '+JSON.stringify({name,...before}));
    await page.screenshot({path:join('test-artifacts','mobile-audit-'+name+'-mission.png')});
    await page.locator('#view-preview').click();
    const after=await page.evaluate(metrics);
    const frame=page.frameLocator('#preview');
    const preview=await frame.locator('body').evaluate(body=>{
      const boxes=[...body.querySelectorAll('.display')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}});
      return {viewport:{w:innerWidth,h:innerHeight},scrollH:document.documentElement.scrollHeight,
        scrollW:document.documentElement.scrollWidth,panels:boxes};
    });
    console.log('MOBILE_AUDIT_PREVIEW '+JSON.stringify({name,...after,preview}));
    await page.screenshot({path:join('test-artifacts','mobile-audit-'+name+'-preview.png')});
  }
});
