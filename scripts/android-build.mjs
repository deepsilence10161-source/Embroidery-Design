import {spawnSync} from 'node:child_process';
const release=Boolean(process.env.EG_ANDROID_KEYSTORE_PATH);
console.log(release?'Building signed release APK.':'Building local debug APK. CI always requires stable release signing.');
const command=process.platform==='win32'?'gradlew.bat':'./gradlew';
const result=spawnSync(command,['--no-daemon',release?':app:assembleRelease':':app:assembleDebug'],{cwd:'android',stdio:'inherit',shell:process.platform==='win32'});
process.exit(result.status??1);
