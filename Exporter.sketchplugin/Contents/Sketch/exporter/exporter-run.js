@import "constants.js"
@import "exporter/exporter.js"
@import "lib/uidialog.js";
@import "lib/utils.js"

const Settings = require('sketch/settings')   
const UI = require('sketch/ui')  

async function exportHTML(currentPath,doc,exportOptions,context){
  
   // export HTML
   new Exporter(currentPath, doc, doc.currentPage(), exportOptions, context);
   exporter.exportArtboards();
 
 
   // open HTML in browser
   const dontOpenBrowser = Settings.settingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER)==1
   if(!dontOpenBrowser){
     const openPath = currentPath+"/"+exporter.docName+"/"  
     const openResult = Utils.runCommand('/usr/bin/open', [openPath,openPath+'/index.html'])
     
     if(openResult.result){
     }else{
       UI.alert('Can not open HTML in browser', openResult.output)
     }
   }
}


function runExporter(context,exportOptions=null) {    
  UIDialog.setUp(context);

  const Dom = require('sketch/dom')
  const doc = context.document
  const Doc = Dom.fromNative(doc)
  const Settings = require('sketch/settings')   

  const isCmdExportToHTML = exportOptions!=null && exportOptions['cmd']=="exportHTML"
  const dontOpen = Settings.settingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER)==1

  // ask for output path
  let currentPath = Settings.documentSettingForKey(doc,SettingKeys.DOC_EXPORTING_URL)
  if(currentPath==null){
    currentPath = ""
  }

  if(!isCmdExportToHTML){
    const dialog = new UIDialog("Export to HTML",NSMakeRect(0, 0, 500, 130),"Export")

    dialog.addTextInput("path","Destination Folder",currentPath,'e.g. ~/HTML',450)  
    dialog.addButton("ss","Select Folder",function(){
      const newPath = Utils.askSavePath(currentPath)
      if (newPath != null) {
        dialog.inputs['path'].setStringValue(newPath)
      }
      return
    })
    dialog.addCheckbox("open","Open generated HTML in browser", !dontOpen)


    while(true){
      if(!dialog.run()) return
      currentPath = dialog.inputs['path'].stringValue()+""
      if(currentPath=="") continue
      break
    }

    dialog.finish()

    Settings.setDocumentSettingForKey(doc,SettingKeys.DOC_EXPORTING_URL,currentPath)     
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER, dialog.inputs['open'].state() != 1)    
  }
      
  exportHTML(currentPath,doc,exportOptions,context)
 
};
