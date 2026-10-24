import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'tests',
  timeout:180000,
  expect:{timeout:10000},
  fullyParallel:true,
  workers:process.env.CI?2:2,
  retries:process.env.CI?1:0,
  reporter:[['list'],['html',{open:'never'}]],
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:390,height:844},acceptDownloads:true,trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:[
    {command:'node scripts/serve.mjs',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI,timeout:30000},
    {command:'node scripts/serve.mjs',env:{PORT:'4175',WEB_ROOT:'.'},url:'http://127.0.0.1:4175/EmbroideryGuide.html',reuseExistingServer:!process.env.CI,timeout:30000},
    {command:'node scripts/serve.mjs',env:{PORT:'4174',MOUNT_PATH:'/Embroidery-Design'},url:'http://127.0.0.1:4174/Embroidery-Design/',reuseExistingServer:!process.env.CI,timeout:30000}
  ]
});
