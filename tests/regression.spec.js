import {test} from '@playwright/test';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
for(const [file,label] of [['studio-test','26 operator workflows + real standalone offline'],['studio-extra-test','8 category / machine / quota workflows'],['edge','7 recovery / quota / cross-tab safeguards'],['clean-ui-test','14 clean home layouts + existing data'],['studio-audit','133 responsive / theme / language / editor states']]){
  test(label,async({},testInfo)=>{
    const result=await exec(process.execPath,[`tests/regression/${file}.cjs`],{cwd:process.cwd(),maxBuffer:10*1024*1024,timeout:170000});
    console.log(result.stdout);
    if(result.stderr)console.error(result.stderr);
    await testInfo.attach('assertions',{body:result.stdout,contentType:'text/plain'});
  });
}
