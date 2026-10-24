import {readFile,writeFile,mkdir} from 'node:fs/promises';
const pkg=JSON.parse(await readFile('package.json','utf8'));
const versionCode=Number(process.env.ANDROID_VERSION_CODE||(100000+Number(process.env.GITHUB_RUN_NUMBER||0)));
if(!Number.isSafeInteger(versionCode)||versionCode<1||versionCode>2100000000)throw Error('Invalid ANDROID_VERSION_CODE');
if(!/^\d+\.\d+\.\d+$/.test(pkg.version))throw Error('Use a numeric major.minor.patch version.');
await mkdir('android/app',{recursive:true});
await writeFile('android/app/version.properties',`# Generated from package.json. CI run numbers preserve APK upgrade ordering.\nversionName=${pkg.version}\nversionCode=${versionCode}\n`);
console.log(`Android ${pkg.version} · versionCode ${versionCode}`);
