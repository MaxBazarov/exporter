@import "exporter/exporter-run.js"

/// Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool --new-instance=No run "/Users/baza/Library/Application Support/com.bohemiancoding.sketch3/Plugins/Exporter.sketchplugin" "cmdExportHTML" "/Users/baza/Ingram/Git/ux1-mockups/Reseller Panel/Customers.sketch"

var onRun = function(context) {  
    let Document = require('sketch/dom').Document
    const Dom = require('sketch/dom')
    
    let path = "/Users/baza/GitHub/exporter/tests/Links2.sketch" 

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
    
        return runExporter(context,runOptions)  
      })

    return true
   
};


