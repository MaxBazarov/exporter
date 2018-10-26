@import("constants.js")
@import("lib/utils.js")
@import("classes/exporter-build-html.js")
@import("classes/mylayer.js")
@import("classes/mylayer-resizer.js")
@import("classes/publisher.js") // we need it to run resize.sh script


var getArtboardGroupsInPage = function(page, context, includeNone = true) {
  const artboardsSrc = page.artboards();
  const artboards = [];

  artboardsSrc.forEach(function(artboard){
      if( !artboard.isKindOfClass(MSSymbolMaster)){
        artboards.push(artboard);
      }
  });

  return Utils.getArtboardGroups(artboards, context);  
}

/*
Object.prototype.getConstructorName = function () {
  var str = (this.prototype ? this.prototype.constructor : this.constructor).toString();
  var cname = str.match(/function\s(\w*)/)[1];
  var aliases = ["", "anonymous", "Anonymous"];
  return aliases.indexOf(cname) > -1 ? "Function" : cname;
}*/


const replaceValidKeys = ["name","frame","x","y","width","height","childs"]
function replacer(key, value) {
  // Pass known keys and array indexes
  if (value!=undefined && (replaceValidKeys.indexOf(key)>=0 ||  !isNaN(key))) {
    //log("VALID "+key)
    return value
  }    
  //log("INVALID "+key)
  return undefined
}


class Exporter {

  constructor(selectedPath, doc, page, exportOptions,context) {       
    this.Settings = require('sketch/settings');
    this.Sketch = require('sketch/dom');
    this.Doc = this.Sketch.fromNative(doc);
    this.doc = doc;
    this.page = page;
    this.context = context;

    this.myLayers = []

    // workaround for Sketch 52
    this.docName = this._clearCloudName(this.context.document.cloudName())
    let posSketch =  this.docName.indexOf(".sketch")
    if(posSketch>0){
      this.docName = this.docName.slice(0,posSketch)
    }
    // @workaround for Sketch 52

    this.prepareOutputFolder(selectedPath);
    this.retinaImages = this.Settings.settingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES)!=1
    this.jsStory = '';

    this.exportOptions = exportOptions

    this.externalArtboardsURLs = [];

  }

  
  collectArtboardGroups(){
    this.myLayers = []
    this.artboardGroups.forEach(function (artboardGroup) {
      const artboard = artboardGroup[0].artboard;
      this.myLayers.push(this.getCollectLayer(artboard,undefined))
    }, this);
  }

  getCollectLayer(layer,myParent){
    const myLayer = new MyLayer(layer,myParent)    

    if(myLayer.isSymbolInstance){      
      //myLayer.childs.push( this.getCollectLayer(layer.symbolMaster(),myLayer)  )
      myLayer.childs =  this.getCollectLayerChilds(layer.symbolMaster().layers(),myLayer)
    }else if(myLayer.isGroup){
      myLayer.childs =  this.getCollectLayerChilds(layer.layers(),myLayer)
    }else{

    }
    return myLayer
  }


  getCollectLayerChilds(layers,myParent){
    const myLayers = []
   
    layers.forEach(function (childLayer) {
      myLayers.push( this.getCollectLayer(childLayer,myParent) )
    }, this);
   
    return myLayers
  }

  log(msg){
    if(!Constants.LOGGING) return
    log(msg)
  }

  logError(error){
    log("[ ERROR ] "+error)
  }

  stopWithError(error){
    const UI = require('sketch/ui')
    UI.alert('Error', error)
    exit = true
  }

  _clearCloudName(cloudName)
  {
    let name = cloudName
    let posSketch =  name.indexOf(".sketch")
    if(posSketch>0){
      name = name.slice(0,posSketch)
    }
    return name
  }


  prepareFilePath(filePath,fileName)
  {
    const fileManager = NSFileManager.defaultManager();
    const targetPath = filePath + '/'+fileName;

    let error = MOPointer.alloc().init();
    if (!fileManager.fileExistsAtPath(filePath)) {
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(filePath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    }

    error = MOPointer.alloc().init();
    if (fileManager.fileExistsAtPath(targetPath)) {
      if (!fileManager.removeItemAtPath_error(targetPath, error)) {
        log(error.value().localizedDescription());
      }
    }
    return targetPath;
  }


  copyResources() {    
    const fileManager = NSFileManager.defaultManager();
    const resFolder = "resources";    
    const targetPath = this.prepareFilePath(this._outputPath,resFolder);
    
    const sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent(resFolder).path();
    let error = MOPointer.alloc().init();
    if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
      log(error.value().localizedDescription());
    }
  }

  getArtboardImageName(artboard, scale) {
    this.log("getArtboardImageName()");
    const suffix = scale == 2 ? "@2x" : "";
    return Utils.toFilename(artboard.name, false) + suffix + ".png";
  }


  generateJSStoryBegin(){
    this.jsStory = 
    'var story = {\n'+
    '"docName": "'+ Utils.toFilename(this.docName)+'",\n'+
    '"docPath": "P_P_P",\n'+
    '"docVersion": "V_V_V",\n'+
    '"hasRetina": '+(this.retinaImages?'true':'false') + ',\n'+
    '"pages": [\n';
  }


  createJSStoryFile(){
    const fileName = 'story.js';
    return this.prepareFilePath(this._outputPath + "/" + Constants.RESOURCES_DIRECTORY,fileName);
  }

  generateJSStoryEnd(){
    this.jsStory += 
     '   ]\n,'+
     '"resolutions": ['+(this.retinaImages?'2':'1')+'],\n'+
     '"title": "'+this.docName+'",\n'+
     '"highlightLinks": false\n'+
    '}\n';

    const pathStoryJS = this.createJSStoryFile();
    Utils.writeToFile(this.jsStory, pathStoryJS);
  }

  createMainHTML(){
    const docName = this.docName

    let position = this.Settings.settingForKey(SettingKeys.PLUGIN_POSITION)
    const isPositionCenter = position === Constants.POSITION_CENTER
    let hideNav = this.Settings.settingForKey(SettingKeys.PLUGIN_HIDE_NAV)==1
    let commentsURL = this.Settings.settingForKey(SettingKeys.PLUGIN_COMMENTS_URL)
    if(commentsURL==undefined) commentsURL = ''
    let googleCode = this.Settings.settingForKey(SettingKeys.PLUGIN_GOOGLE_CODE)
    if(googleCode==undefined) googleCode = ''
  
    
    const s = buildMainHTML(docName,isPositionCenter,commentsURL,hideNav,googleCode);

    const filePath = this.prepareFilePath(this._outputPath,'index.html');
    Utils.writeToFile(s, filePath);
  }


  pushArtboardIntoJSStory(artboard,index) {
    const mainName = artboard.name;

    this.log("process main artboard "+mainName);

    let js = index?',':'';
    js +=
      '{\n'+
      '"image": "'+ Utils.quoteString(Utils.toFilename(mainName+'.png',false))+'",\n'
    if(this.retinaImages)
      js +=
        '"image2x": "'+ Utils.quoteString(Utils.toFilename(mainName+'@2x.png',false))+'",\n'
    js +=      
      '"width": '+artboard.frame.width+',\n'+
      '"height": '+artboard.frame.height+',\n'+
      '"title": "'+Utils.quoteString(mainName)+'",\n';

    if(artboard.isOverlay){
      js += "'type': 'overlay',\n";
      js += "'overlayShadow': "+(artboard.isOverlayShadow?1:0)+",\n";

    }else{
      js += "'type': 'regular',\n";
    }

    // build flat link array
    js +='"links": [\n';       

    let hotspotIndex = 0;  
    artboard.hotspots.forEach(function (hotspot) {
      const spotJs = this.pushHotspotIntoJSStory(hotspot);
      if(spotJs!=''){
        js += hotspotIndex++?',':'';
        js += spotJs;
      }
    }, this);

    js += ']}\n';

    this.jsStory += js;
  }

  pushHotspotIntoJSStory(hotspot) {
    let js = 
      '{\n'+
      '  "rect": [\n'+
      '    '+hotspot.r.x+',\n'+
      '    '+hotspot.r.y+',\n'+
      '    '+(hotspot.r.x+hotspot.r.width)+',\n'+
      '    '+(hotspot.r.y+hotspot.r.height)+'\n'+
      '   ],\n';

    this.log()

    if(hotspot.target!=undefined){   
      js += '   "target": "'+hotspot.target+'",\n';
    }

    if(hotspot.linkType=='back'){ 
      js += '   "action": "back"\n';
    }else if(hotspot.linkType=='artboard' && this.externalArtboardsURLs[hotspot.artboardName]){      
      js += '   "url": "'+this.externalArtboardsURLs[hotspot.artboardName]+'"\n';  
    }else if(hotspot.linkType=='artboard'){
      const targetBoard = this.artboardsDictName[hotspot.artboardName];
      if(targetBoard==undefined){
        this.log("undefined artboard: '"+hotspot.artboardName + '"');
        return '';     
      }              
      js += '   "page": ' + targetBoard+'\n';
    }else if(hotspot.linkType=='href'){     
      js += '   "url": "'+hotspot.href+'"\n';                    
    }else{
      this.log("pushHotspotIntoJSStory: Uknown hotspot link type: '"+hotspot.linkType+"'")
    }
          
    js += '  }\n';
 
    return js;
  }


  exportImage(layer, scale, imagePath) {
    this.log("exportImage()");
    let slice;
    if (layer.nlayer.isKindOfClass(MSArtboardGroup)) {
      slice = MSExportRequest.exportRequestsFromExportableLayer(layer.nlayer).firstObject();
    } else {
      slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(layer.nlayer, layer.nlayer.absoluteInfluenceRect(), false).firstObject();
    }
    slice.scale = scale;
    slice.saveForWeb = false;
    slice.format = "png";
    this.context.document.saveArtboardOrSlice_toFile(slice, imagePath);
  }

  exportArtboardImages(artboard) {
    log("  exportArtboardImages: running... "+artboard.name)

    this.exportImage(artboard, 1, this._imagesPath + this.getArtboardImageName(artboard, 1));
    if (this.retinaImages) {
      this.exportImage(artboard, 2, this._imagesPath + this.getArtboardImageName(artboard, 2));
    }

    log("  exportArtboardImages: done!")
  
  }


  getArtboardGroups(context) {

    const artboardGroups = [];

    if(this.exportOptions==null){
      this.doc.pages().forEach(function(page){
        // skip marked by '*'
        log('name='+page.name())
        if(page.name().indexOf("*")==0){
          return
        }
        const artBoards = getArtboardGroupsInPage(page, context, false)
        if(!artBoards.length) return
        artboardGroups.push.apply(artboardGroups,artBoards);
      })
    }else if (this.exportOptions.mode==Constants.EXPORT_MODE_CURRENT_PAGE){      
      artboardGroups.push.apply(artboardGroups, getArtboardGroupsInPage(this.exportOptions.currentPage, context, false));
    }else if (this.exportOptions.mode==Constants.EXPORT_MODE_SELECTED_ARTBOARDS){
      const list = []
      for (var i = 0; i < this.exportOptions.selectedArtboards.length; i++) {
        list.push(this.exportOptions.selectedArtboards[i].sketchObject)        
      }
      artboardGroups.push.apply(artboardGroups,Utils.getArtboardGroups(list, context))  
    }else{
      log('ERROR: unknown export mode: '.this.exportOptions.mode)
    }

    // try to find flowStartPoint and move it on top  
    for (var i = 0; i < artboardGroups.length; i++) {
      const a = artboardGroups[i][0].artboard;
      if( a.isFlowHome() ){
         if(i!=0){              
              // move found artgroup to the top
              const item1 = artboardGroups[i];
              artboardGroups.splice(i,1);
              artboardGroups.splice(0,0,item1);
          }
          break;
      }
    }

    return artboardGroups;
  }

  getArtboardsDictName(){
    let dict = [];
    let index = 0;    
    this.artboardGroups.forEach(function (artboardGroup) {
      const mainArtboard = artboardGroup[0].artboard;
      const mainName = mainArtboard.name();
      dict[mainName] = index++;
    }, this);
    
    return dict
  }



  buildArtboardDict() {
    var dict = []
    
    for(var ab of this.myLayers){
      dict[ab.objectID] = ab
    }  

    this.artboadDict = dict
      
  }

  buildSymbolDict() {
    var symDict = []

    for(var symbol of this.Doc.getSymbols()){
      const sid = symbol.symbolId
      const skSymbol = symbol.sketchObject      
      if( sid in symDict) continue
      symDict[ sid ] = skSymbol      
    }

    this.symDict = symDict
      
  }

  exportImages(){
    log(" exportImages: running...")
    let index = 0;

    this.myLayers.forEach(function (artboard) {
      this.exportArtboardImages(artboard);
      this.pushArtboardIntoJSStory(artboard,index++);
    }, this);
    log(" exportImages: done!")
  }

  buildPreviews(){
    log(" buildPreviews: running...")
    const pub = new Publisher(this.context,this.context.document);
    pub.setScriptName("resize.sh")
    pub.copyScript()
    const res = pub.runScriptWithArgs([this._imagesPath])
    log(" buildPreviews: done!")
    if(!res.result) pub.showOutput(res)    
  }

  createResourceFile(fileName){
    return this.prepareFilePath(this._outputPath + "/" + Constants.RESOURCES_DIRECTORY,fileName);
  }

  generateJSStoryEnd(){
    this.jsStory += 
     '   ]\n,'+
     '"resolutions": ['+(this.retinaImages?'2':'1')+'],\n'+
     '"title": "'+this.docName+'",\n'+
     '"highlightLinks": false\n'+
    '}\n';

    const pathStoryJS = this.createResourceFile('story.js')
    Utils.writeToFile(this.jsStory, pathStoryJS)
  }

  saveToJSON(){
    if( this.Settings.settingForKey(SettingKeys.PLUGIN_SAVE_JSON)!=1) return true

    log(" SaveToJSON: running...")
    const layersJSON = JSON.stringify(this.myLayers,replacer)
    const pathJSFile = this.createResourceFile('layers.json')
    Utils.writeToFile(layersJSON, pathJSFile)
    log(" SaveToJSON: done!")

    return true
  }

  exportArtboards() {        
    log("exportArtboards: running...")

    // Collect artboards and prepare caches
    this.artboardGroups = this.getArtboardGroups(this.context);
    this.log('artboardGroups: '+this.artboardGroups.length);
    this.artboardsDictName = this.getArtboardsDictName();    
    
    this.buildSymbolDict()
    {
      const layerCollector  = new MyLayerCollector()
      layerCollector.collectArtboardsLayers(this)
    }    
    this.buildArtboardDict()
    {
      const layerResizer  = new MyLayerResizer()
      layerResizer.resizeLayers(this)
    }    

    // Copy static resources
    this.copyResources();

    // Build main HTML file
    this.createMainHTML();

    // Build Story.js with hotspots  
    this.generateJSStoryBegin();
    let index = 0;

    // Export every artboard into PNG image
    this.exportImages()

    this.generateJSStoryEnd();

    // Build image small previews for Gallery
    this.buildPreviews()

    // Dump document layers to JSON file
    this.saveToJSON()

    log("exportArtboards: done!")

  }  

  prepareOutputFolder(selectedPath) {
    this.log("prepareOutputFolder()");
    let error;
    const fileManager = NSFileManager.defaultManager();

    this._outputPath = selectedPath + "/" + this.docName
  

    if (fileManager.fileExistsAtPath(this._outputPath)) {
      error = MOPointer.alloc().init();
      if(!fileManager.removeItemAtPath_error(this._outputPath,error)){
         log(error.value().localizedDescription());
      }
    }
    error = MOPointer.alloc().init();
    if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(this._outputPath, false, null, error)) {
      log(error.value().localizedDescription());
    }       

    this._imagesPath = this._outputPath + "/" + Constants.IMAGES_DIRECTORY;
    if (!fileManager.fileExistsAtPath(this._imagesPath)) {
      error = MOPointer.alloc().init();
      if (!fileManager.createDirectoryAtPath_withIntermediateDirectories_attributes_error(this._imagesPath, false, null, error)) {
        log(error.value().localizedDescription());
      }
    } else {
      Utils.removeFilesWithExtension(this._imagesPath, "png");
    }
  }
}