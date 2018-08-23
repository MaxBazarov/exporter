@import "constants.js";

class Utils {

  static askSavePath(currentPath=null) {
    let panel = NSOpenPanel.openPanel()
    panel.setTitle("Choose a location...")
    panel.setPrompt("Export")
    panel.setCanChooseDirectories(true)
    panel.setCanChooseFiles(false)
    panel.setAllowsMultipleSelection(false)
    panel.setShowsHiddenFiles(false)
    panel.setExtensionHidden(false)
    if(currentPath!=null && currentPath!=undefined){
      let url = [NSURL fileURLWithPath:currentPath ]
      panel.setDirectoryURL(url)
    }
    const buttonPressed = panel.runModal()
    const newURL =  panel.URL()
    panel.close()
    panel = null
    if (buttonPressed == NSFileHandlingPanelOKButton) {      
      return newURL.path()+''
    }
    return null
  }

  static writeToFile(str, filePath) {
    const objcStr = NSString.stringWithFormat("%@", str);
    return objcStr.writeToFile_atomically_encoding_error(filePath, true, NSUTF8StringEncoding, null);
  }

  static copyRect(rect){
    return NSMakeRect(rect.origin.x,rect.origin.y,rect.size.width,rect.size.height)
  }


  static toFilename(name, dasherize = true) {
    if (dasherize == null) {
      dasherize = true;
    }
    const dividerCharacter = dasherize ? "-" : "_";
    return name.replace(/[/]/g, "").replace(/[\s_-]+/g, dividerCharacter).toLowerCase();
  }


  static getArtboardGroups(artboards, context) {
    const artboardGroups = [];
   
      artboards.forEach(function (artboard) {
        // skip marked by '*'
        if(artboard.name().indexOf("*")==0){
          return
        }
        artboardGroups.push([{artboard: artboard, baseName: artboard.name()}]);
      });
    return artboardGroups;
  }

 

  static isSymbolsPage(page) {
    return page.artboards()[0].isKindOfClass(MSSymbolMaster);
  }

  static removeFilesWithExtension(path, extension) {
    const error = MOPointer.alloc().init();
    const fileManager = NSFileManager.defaultManager();
    const files = fileManager.contentsOfDirectoryAtPath_error(path, null);
    files.forEach(function (file) {
      if (file.pathExtension() == extension) {
        if (!fileManager.removeItemAtPath_error(path + "/" + file, error)) {
          log(error.value().localizedDescription());
        }
      }
    });
  }


  static runCommand(command, args) {
    var task = NSTask.alloc().init();

    var pipe = NSPipe.alloc().init()
    task.setStandardOutput_(pipe);
    task.setStandardError_(pipe);
    task.setLaunchPath_(command);
    task.arguments = args;
    task.launch();
    task.waitUntilExit();

    
    var fileHandle = pipe.fileHandleForReading()
    var data= [fileHandle readDataToEndOfFile];        
    var outputString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];      

    return {
      result:(task.terminationStatus() == 0),
      output:outputString
    }
  }
}

