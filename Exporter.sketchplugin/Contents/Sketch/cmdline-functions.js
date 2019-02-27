@import "exporter/exporter-run.js"

// osascript -e 'quit app "Sketch"'
const example=`
/Applications/Sketch.app/Contents/Resources/sketchtool/bin/sketchtool --without-activating=YES --new-instance=No run ~/Library/Application\ Support/com.bohemiancoding.sketch3/Plugins/Exporter.sketchplugin "cmdRun"  --context='{"file":"/Users/baza/GitHub/exporter/tests/Links2.sketch","commands":"sync,export"}'

`

function syncDocument(document){
    log(" SYNCING SYMBOLS...")
    for(var master of document.getSymbols()){
        if(!master.syncWithLibrary()){
            log("  Failed to sync symbol "+master.name)
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


function saveDocument(document){
    log(" SAVING DOCUMENT...")
    document.save()   
}

function closeDocument(document){
    log(" CLOSING DOCUMENT...")
    document.save()   
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

    const commands = argCommands.split(',')
    const cmdSave = commands.includes('save')
    const cmdSync = commands.includes('sync')
    const cmdExport = commands.includes('export')
    const cmdPublish = commands.includes('publish')
    const cmdClose = commands.includes('close')
    
    // Open Sketch document 
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
        if(cmdSync)      syncDocument(document)
        if(cmdExport)    exportDocument(context,runOptions)  
        if(cmdPublish)   publishDocument(context,document)
        if(cmdSave)      saveDocument(document)
        if(cmdClose)     closeDocument(document)
        
    })
   
};


