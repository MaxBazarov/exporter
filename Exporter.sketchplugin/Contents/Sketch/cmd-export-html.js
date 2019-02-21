@import "exporter/exporter-run.js"

/*
/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool  --context='{"file":"/Users/baza/GitHub/exporter/tests/Links2.sketch"}' --new-instance=No run "/Users/baza/Library/Application Support/com.bohemiancoding.sketch3/Plugins/Exporter.sketchplugin" "cmdExportHTML"
osascript -e 'quit app "Sketch"'
*/

var onRun = function(context) {  
    let Document = require('sketch/dom').Document
    const Dom = require('sketch/dom')
    
    let path = context.file+""
    log('path:'+path)
    
    if(""==path){
        log("context.file is not specified\n")
        return
    }
    
    var document = new Document()
    Document.open(path, (err, document) => {
        if (err) {
            log("ERROR: Can't open  "+path)
            return 
        }
        if(!document){
            log("Canceled")
            return 
        }
        const runOptions={
            cmd:"exportHTML",
            fromCmd:true,        
            nDoc:document.sketchObject
        }
    
        runExporter(context,runOptions)  
      })
   
};


