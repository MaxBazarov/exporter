@import "exporter/exporter-run.js"

// osascript -e 'quit app "Sketch"'
const example=`
/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool --without-activating=YES --new-instance=No run ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/Exporter.sketchplugin "cmdRun"  --context='{"file":"/Users/baza/GitHub/exporter/tests/Links2.sketch","commands":"sync,export"}'

`

function syncDocument(document){
    log(" SYNCING SYMBOLS...")
    for(var master of document.getSymbols()){
        if(null == master.getLibrary()) continue // we need only library-based master

        if(!master.syncWithLibrary()){
            log("  Failed to sync symbol "+master.name)
            for(var i of master.getAllInstances()){
                log("     instance: "+i.name)
            }
        }
    }
}

function exportDocument(context,runOptions){    
    log(" EXPORTING...")
    runExporter(context,runOptions)  
}

function publishDocument(context,document){    
    log(" PUBLISHING...")
    context.fromCmd = true
    const publisher = new Publisher(context,document.sketchObject);
    publisher.publish();
}

function showError(error){
    log(error+"\n")
    log("Command line example:")
    log(example+"\n")
}


function saveDocument(document,close){
    log(" SAVING DOCUMENT...")
    document.save(err => {
        if (err) {
            log(" Failed to save a document. Error: "+err)
        }
        if(close){
            closeDocument(document)
        }
    })
}

function closeDocument(document){
    log(" CLOSING DOCUMENT...")
    document.close()
}

var cmdRun = function(context) {      
    let Document = require('sketch/dom').Document
    var document = new Document()    
        
    // Parse command line arguments    
    let path = context.file+""
    if(''==path){
        return showError("context.file is not specified")        
    }    

    log("PROCESS "+path)

    let argCommands = context.commands+""
    if(''==argCommands){
        return showError("context.commands is not specified")
    }    

    const commandsList = argCommands.split(',')
    const allCommands = ['save','sync','export','publish','close']
    const cmds = {}
    for(var cmd of allCommands){
        cmds[cmd] = commandsList.includes(cmd)
    }    
    // Open Sketch document 
    Document.open(path, (err, document) => {        
        if (err || !document    ) {
            log("ERROR: Can't open  "+path)
            return 
        }    
        const runOptions={
            cmd:"exportHTML",
            fromCmd:true,        
            nDoc:document.sketchObject
        }    
        if(cmds.sync)       syncDocument(document)
        if(cmds.export)     exportDocument(context,runOptions)  
        if(cmds.publish)    publishDocument(context,document)
        if(cmds.save)       saveDocument(document,cmds.close)
        else if(cmds.close) closeDocument(document)
        
    })
   
};


