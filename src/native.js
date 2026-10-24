import {Capacitor,registerPlugin} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Filesystem,Directory,Encoding} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
import {Camera,CameraResultType,CameraSource} from '@capacitor/camera';
const SystemPrint=registerPlugin('EmbroideryPrint');
const SystemBars=registerPlugin('SystemBars');
if(Capacitor.isNativePlatform()){
  globalThis.EmbroideryNative={
    isNative:true,
    async exportFile({name,content}){
      const safe=String(name).replace(/[^a-zA-Z0-9._-]/g,'_').slice(0,180);
      const path='exports/'+safe;
      const result=await Filesystem.writeFile({path,data:content,directory:Directory.Cache,encoding:Encoding.UTF8,recursive:true});
      try{await Share.share({title:'EmbroideryGuide backup',files:[result.uri],dialogTitle:'Save or share your JSON backup'});return true}
      catch(error){if(/cancel/i.test(error.message||'')){const cancelled=Error('Sharing cancelled');cancelled.code='CANCELLED';throw cancelled}throw error}
    },
    async selectPhoto(source){
      return Camera.getPhoto({source:source==='camera'?CameraSource.Camera:CameraSource.Photos,resultType:CameraResultType.DataUrl,quality:82,width:1400,height:1400,correctOrientation:true,allowEditing:false,saveToGallery:false});
    },
    print(options){return SystemPrint.print(options)},
    exit(){return App.exitApp()}
  };
  const syncBars=()=>SystemBars.setStyle({style:document.documentElement.dataset.theme==='light'?'LIGHT':'DARK'}).catch(()=>{});
  new MutationObserver(syncBars).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  syncBars();
  App.addListener('backButton',()=>document.dispatchEvent(new Event('embroidery-native-back')));
  App.addListener('appStateChange',({isActive})=>{if(!isActive)document.dispatchEvent(new Event('embroidery-native-pause'))});
}
