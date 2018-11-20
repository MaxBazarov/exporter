@import "exporter/exporter-run.js"

var onRun = function(context) {  
    let Document = require('sketch/dom').Document

    let path = "/Users/baza/Ingram/Git/ux1-mockups/Reseller Panel/Customers.sketch" 

    var document = new Document()
    Document.open(path, (err, document) => {
        if (err) {
          log("ERROR: Can't open  "+path)
          return 
        }
        log(document)
        return
        const runOptions={
            "cmd":"exportHTML"
        }
    
        return runExporter(context,runOptions)  
      })

   
};


