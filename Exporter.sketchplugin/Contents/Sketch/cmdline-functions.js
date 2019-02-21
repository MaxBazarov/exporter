@import "exporter/exporter-run.js"

/*
/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool  --context='{"file":"/Users/baza/GitHub/exporter/tests/Links2.sketch"}' --new-instance=No run ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/Exporter.sketchplugin "cmdExportHTML"
osascript -e 'quit app "Sketch"'
*/

var cmdSyncLibs = function(context) {  

    let Document = require('sketch/dom').Document
    const Dom = require('sketch/dom')
    
    let path = context.file+""
    
    if(""==path){
        log("context.file is not specified\n")
        return
    }
    
    var document = new Document()
    Document.open(path, (err, document) => {
        if (err || !document) {
            log("ERROR: Can't open  "+path)
            return 
        }    
        //
        document.getSymbols().forEach(master => master.syncWithLibrary())
        //
        document.save()
        document.close()
        
    })
   
};


var cmdExportHTML = function(context) {  

    let Document = require('sketch/dom').Document
    const Dom = require('sketch/dom')
    
    let path = context.file+""
    
    if(""==path){
        log("context.file is not specified\n")
        return
    }
    
    var document = new Document()
    Document.open(path, (err, document) => {
        if (err || !document) {
            log("ERROR: Can't open  "+path)
            return 
        }    
        const runOptions={
            cmd:"exportHTML",
            fromCmd:true,        
            nDoc:document.sketchObject
        }    
        runExporter(context,runOptions)  
        document.close()
        
    })
   
};


