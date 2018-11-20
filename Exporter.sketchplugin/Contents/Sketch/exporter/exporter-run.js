@import "constants.js"
@import "exporter/exporter.js"
@import "lib/utils.js"


function runExporter(context,exportOptions=null) {  

  const Dom = require('sketch/dom')
  const doc = context.document
  const Doc = Dom.fromNative(doc)
  const Settings = require('sketch/settings') 
  let UI = require('sketch/ui')
  const isCmdExportToHTML = exportOptions!=null && exportOptions['cmd']=="exportHTML"


  
  // ask for output path
  let currentPath = Settings.documentSettingForKey(doc,SettingKeys.DOC_EXPORTING_URL)
  if(currentPath==null){
    currentPath = ""
  }
  //log("context:"+context)
  //log("currentPath:"+currentPath)
  if(!isCmdExportToHTML || ""==currentPath){
    const newPath = Utils.askSavePath(currentPath)
    if (newPath == null) {
      return
    }
    Settings.setDocumentSettingForKey(doc,SettingKeys.DOC_EXPORTING_URL,newPath) 
    currentPath = newPath
  }

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

};
