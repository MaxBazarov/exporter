@import "constants.js"
@import "exporter/exporter.js"
@import "lib/uidialog.js"
@import "lib/uipanel.js"
@import "lib/timeout.js"
@import "lib/utils.js"


const Settings = require('sketch/settings')   
const UI = require('sketch/ui')  

let exportInfo = {
  timeout : undefined,
  panel: undefined
}

function finishPanel() {
  //if( exportInfo.panel!=undefined ) exportInfo.panel.finish()
  if( exportInfo.timeout!=undefined ) {
    exportInfo.timeout.cancel() // fibers takes care of keeping coscript around
    exportInfo.timeout = undefined
  }
  log("finishPanel: done")
}

function exportHTML(currentPath,doc,exportOptions,context){  
  let panel = new UIPanel()
  exportInfo.panel = panel
  panel.addLabel("Exporting...")
  panel.addButton("cancel","Stop",finishPanel)
  panel.show() 
  
  new Exporter(currentPath, doc, doc.currentPage(), exportOptions, context);
   // export HTML
  log("RUN")
  coscript.setShouldKeepAround(true)

  exportInfo.timeout = coscript.scheduleWithInterval_jsFunction(1,function() {

    // Exporting...
    exporter.exportArtboards();
    log("exportHTML: exported")

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
    log("exportHTML: opened HTML")
    

    // close all
    //panel.finish()
    log("exportHTML: closed panel")
    coscript.setShouldKeepAround(false)
    log("exportHTML: setShouldKeepAround: false")
  })

  exportInfo.panel.finish()
  //clearTimeout()
  //log("exportHTML: done")
  
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
        dialog.views['path'].setStringValue(newPath)
      }
      return
    })
    dialog.addCheckbox("open","Open generated HTML in browser", !dontOpen)


    while(true){
      if(!dialog.run()) return
      currentPath = dialog.views['path'].stringValue()+""
      if(currentPath=="") continue
      break
    }

    dialog.finish()

    Settings.setDocumentSettingForKey(doc,SettingKeys.DOC_EXPORTING_URL,currentPath)     
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER, dialog.views['open'].state() != 1)    
  }
  
 
  log("START")
  exportHTML(currentPath,doc,exportOptions,context)
  log("END")  
 
};
