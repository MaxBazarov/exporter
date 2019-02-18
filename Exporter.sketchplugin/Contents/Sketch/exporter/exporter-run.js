@import "constants.js"
@import "exporter/exporter.js"
@import "lib/uidialog.js"
@import "lib/uipanel.js"
@import "lib/utils.js"


const Settings = require('sketch/settings')   
const UI = require('sketch/ui')  

let exportInfo = {
  timeout : undefined,
  panel: undefined
}

function closePanel() {
  if( exportInfo.panel!=undefined ){
    exportInfo.panel.finish()
    exportInfo.panel = undefined
  }
  if( exportInfo.timeout!=undefined ) {
    exportInfo.timeout.cancel() // fibers takes care of keeping coscript around
    exportInfo.timeout = undefined
  }
  coscript.setShouldKeepAround(false)  
}

function panelSwitchFinished(){
  exportInfo.panel.addButton("cancel","  Ok   ",function(){
      closePanel()
    })
}

function exportHTML(currentPath,doc,exportOptions,context){  
  let panel = new UIPanel("Exporting to HTML")
  exportInfo.panel = panel 
  panel.addLabel("","Please wait...") 
  panel.show() 
  
  new Exporter(currentPath, doc, doc.currentPage(), exportOptions, context);
   // export HTML  
  coscript.setShouldKeepAround(true)

  exportInfo.timeout = coscript.scheduleWithInterval_jsFunction(1,function() {

    // Exporting...
    let exportedOk = exporter.exportArtboards()
    if(exportedOk){
        // open HTML in browser 
        const dontOpenBrowser = Settings.settingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER)==1
        if(!dontOpenBrowser){
            const openPath = currentPath+"/"+exporter.docName+"/"
            const fullPath  = "" + openPath + (openPath.endsWith('/')?'':'/')+'index.html'
            NSWorkspace.sharedWorkspace().openFile(fullPath);            
            //log('open: '+fullPath)
            /*const openResult = Utils.runCommand('/usr/bin/open', [openPath,openPath+'/index.html'])
            
            if(openResult.result){
            }else{
                UI.alert('Can not open HTML in browser', openResult.output)
            }*/
        } 
    }     

    // 
    //panelSwitchFinished()
    closePanel()

    // show final message
    if(exporter.errors.length>0){
      UI.alert('Export failed with errors',exporter.errors.join("\n\n"))
    }else{
      UI.message('HTML exported.')
    }
  })
    
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
  let currentPath = Settings.settingForKey(SettingKeys.PLUGIN_EXPORTING_URL)
  if(currentPath==null){
    // check legacy settings
    currentPath = Settings.documentSettingForKey(doc,SettingKeys.DOC_EXPORTING_URL)
    if(currentPath==null)    
        currentPath = ''
  }


  if(!isCmdExportToHTML){
    const dialog = new UIDialog("Export to HTML",NSMakeRect(0, 0, 500, 130),"Export")

    dialog.addPathInput("path","Destination Folder","Select Folder",currentPath,'e.g. ~/HTML',450)   
    dialog.addCheckbox("open","Open generated HTML in browser", !dontOpen)


    while(true){
        const result = dialog.run()        
        if(!result) return

        currentPath = dialog.views['path'].stringValue()+""
        if(currentPath=="") continue
        break
    }

    dialog.finish()

    Settings.setSettingForKey(SettingKeys.PLUGIN_EXPORTING_URL,currentPath)     
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER, dialog.views['open'].state() != 1)    
  }
  
 
  exportHTML(currentPath,doc,exportOptions,context)
 
};
