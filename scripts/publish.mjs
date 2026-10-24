import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const {GITHUB_TOKEN:token,GITHUB_REPOSITORY:repo,GITHUB_SHA:sha,GITHUB_RUN_NUMBER:run,APP_VERSION:version}=process.env;
if(!token||!repo||!sha||!run||!version)throw Error('Release metadata is missing. Run from the publishing workflow.');
const api='https://api.github.com/repos/'+repo;
const headers={Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'EmbroideryGuide-release'};
async function request(method,path,body){
  const response=await fetch(api+path,{method,headers:{...headers,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  if(!response.ok)throw Error(`GitHub ${method} ${path}: ${response.status} ${await response.text()}`);
  return response.status===204?null:response.json();
}
const files=['EmbroideryGuide.apk','EmbroideryGuide.html','EmbroideryGuide-website.zip'];
const checksums=[];
for(const name of files){const data=await readFile('artifacts/'+name);if(!data.length)throw Error('Empty artifact: '+name);checksums.push(createHash('sha256').update(data).digest('hex')+'  '+name)}
await writeFile('artifacts/SHA256SUMS.txt',checksums.join('\n')+'\n');files.push('SHA256SUMS.txt');
const tag=`v${version}-build.${run}`;
const payload={tag_name:tag,target_commitish:sha,name:`EmbroideryGuide ${version} · build ${run}`,draft:false,prerelease:false,make_latest:'true',body:`## One source, web + Android\n\n- Signed Android APK (Android 7.0 and later). Enable installation from your browser / file manager if Android asks.\n- Complete standalone HTML: no server or installation needed.\n- Portable website ZIP with its offline worker and manifest.\n- The same UI, data model and three storage keys in all builds.\n- JSON export / import moves your workspace between installations. Automatic cloud sync is intentionally absent.\n\nWebsite: https://${repo.split('/')[0]}.github.io/${repo.split('/')[1]}/\n\nBuild checks include operator flows, quota / corrupt-data recovery, 133 responsive states, true offline reload, repository-subpath PWA behavior, native adapter contracts, Android compilation, lint and APK signature verification. Android-specific photo/share/print dialogs should also be checked on the target phone.\n\nCommit: ${sha}\n\nVerify downloaded files with SHA256SUMS.txt.`};
let release;const existing=await fetch(api+'/releases/tags/'+encodeURIComponent(tag),{headers});
if(existing.status===404)release=await request('POST','/releases',payload);
else if(existing.ok){const old=await existing.json();release=await request('PATCH','/releases/'+old.id,payload)}
else throw Error('Could not look up release: '+existing.status);
const existingAssets=await request('GET',`/releases/${release.id}/assets`);
for(const name of files){
  const old=existingAssets.find(asset=>asset.name===name);if(old)await request('DELETE','/releases/assets/'+old.id);
  const upload=release.upload_url.replace('{?name,label}','')+'?name='+encodeURIComponent(name);
  const response=await fetch(upload,{method:'POST',headers:{...headers,'Content-Type':'application/octet-stream'},body:await readFile('artifacts/'+name)});
  if(!response.ok)throw Error('Asset upload failed: '+name+' '+response.status+' '+await response.text());
  console.log('Published '+name);
}
console.log('Release ready: '+release.html_url);
