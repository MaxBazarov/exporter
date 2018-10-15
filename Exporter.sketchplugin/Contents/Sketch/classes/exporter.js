@import("constants.js")
@import("lib/utils.js")
@import("lib/resizing-constraint.js")
@import("lib/resizing-type.js")
@import("classes/exporter-build-html.js")
@import("classes/mylayer.js")

Sketch = require('sketch/dom')

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

  getLayerHotspots(myLayer) {
    const hotspots = [];

    if (layer.isKindOfClass(MSSymbolInstance)) {
      this.log(cident+"getHotspots: ["+layer.name()+"] class:MSSymbolInstance!")
      // symbol instance
      const childHotspots = this.getHotspots(layer.symbolMaster(), artboardData, absoluteRect, cident+' ');
      if (childHotspots != null) {
        Array.prototype.push.apply(hotspots, childHotspots);
      }
    } else if (layer.isKindOfClass(MSLayerGroup)) {
      this.log(cident+"getHotspots: ["+layer.name()+"] class:MSLayerGroup! layers: "+layer.layers().length)
      // layer group
      layer.layers().forEach(function (childLayer) {
        this.log(cident+"getHotspots: ["+layer.name()+"] childLayer: "+childLayer.name())
        const childHotspots = this.getHotspots(childLayer, artboardData, absoluteRect, cident+' ');
        if (childHotspots != null) {
          Array.prototype.push.apply(hotspots, childHotspots);
        }
      }, this);
    }else{
      this.log(cident+"getHotspots: ["+layer.name()+"] class:other!")
    }

    // PROCESS LAYOUT OWN HOTSPOTS
    let x = Math.round(absoluteRect.origin.x - Constants.HOTSPOT_PADDING);
    let y = Math.round(absoluteRect.origin.y - Constants.HOTSPOT_PADDING);
    const width = Math.round(absoluteRect.size.width);
    const height = Math.round(absoluteRect.size.height);


    let finalHotspot = {
      x: x, y: y, width: width, height: height,
      linkType: 'undefined'
    }

    // check custom link
    if(customTargetName==='__back'){
      finalHotspot.linkType = "back"
      hotspots.push(finalHotspot)
      return hotspots
    }
    if(!(customTargetName=='')){
      finalHotspot.linkType = "artboard"
      finalHotspot.artboardName = customTargetName
      finalHotspot.href = Utils.toFilename(customTargetName) + ".html"
      hotspots.push(finalHotspot)
      this.log(cident+"getHotspots: ||||||| ADD HOTSPOT 1: added hostpot for custom target x="+x+"  absoluteRect.origin.x="+absoluteRect.origin.x)
      return hotspots
    }
    
    // check regular link
    let externalLink = this.Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK);
    if (externalLink != null && externalLink != "") {
        // found external link
        const openLinkInNewWindow = this.Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN)
        const regExp = new RegExp("^http(s?)://");
        if (!regExp.test(externalLink.toLowerCase())) {
          externalLink = "http://" + externalLink;
        }
        const target = openLinkInNewWindow && 1==2 ? "_blank" : null;

        finalHotspot.linkType = "href"
        finalHotspot.href = externalLink
        finalHotspot.target = target
        hotspots.push(finalHotspot)
        return hotspots
    }

    // check other links
    let targetArtboadName = '';

    
    // check link to artboard
    if(layer.flow()!=null){
      const flow = this.Sketch.fromNative(layer.flow());
      const target = flow.target;

      if(flow.isBackAction()){
        finalHotspot.linkType = "back";
        hotspots.push(finalHotspot);
        return hotspots;

      }else if(target!=null){
        targetArtboadName = target.name;
      }    
    }     

    this.log(cident+"getHotspots: start: ["+layer.name()+'] targetArtboadName: '+targetArtboadName)
  

    if (targetArtboadName != "") {
      this.log(cident+"getHotspots: ||||||| ADD HOTSPOT 10 for "+ targetArtboadName +"["+layer.name()+']')      
      // found artboard link
      finalHotspot.linkType = "artboard";
      finalHotspot.artboardName = targetArtboadName;
      finalHotspot.href = Utils.toFilename(targetArtboadName) + ".html";

      hotspots.push(finalHotspot);
    }else{
      while(true){
        // check child customizations of non-linked layer
        // try to find customized link in layer custom properties
        let slayer = this.Sketch.fromNative(layer);
        if( !slayer.overrides ) break;

        this.log(cident+"getHotspots: ["+layer.name()+'] check customization  resizingConstraint='+(layer.resizingConstraint!=undefined))

        let replacedSymbols = []
        // check if symbol was replaced by another
        slayer.overrides.forEach(function (customProperty){       
          if( !(customProperty.property==='symbolID' && !customProperty.isDefault) ) return;   
          replacedSymbols[customProperty.path] = customProperty.value
          this.log(cident+"getHotspots: overrides: ["+layer.name()+'] check symbol replacing: found custom property: '+customProperty.value)    
        },this)

        // check if target was customized
        slayer.overrides.forEach(function (customProperty){       
          if( !(customProperty.property==='flowDestination' && !customProperty.isDefault && customProperty.value!='') ) return;        

          this.log(cident+"getHotspots: overrides: custom: ["+layer.name()+'] check customization: found custom property: '+customProperty.value)        
          this.log(customProperty)       

          let overAbsoluteRect = Utils.copyRect(absoluteRect)
                

          // get source layer
          let isReplacedSymbols = false
          let removedLayer = false
          let sourceID =  customProperty.path
          replacedSymbols.forEach(function(id1,id2){
            if(sourceID.path.indexOf(id1)<0) return
            if(id2==''){
              // removed layer
              removedLayer = true
              return
            }
            sourceID = sourceID.replace(id1,id2)
            isReplacedSymbols = true    
          },this)           
          if(removedLayer){
            this.log(cident+"getHotspots: found removed layer")
            return
          }
          if(!replacedSymbols) sourceID = customProperty.path           
          this.log(cident+"getHotspots: customProperty.path: '"+sourceID+"'")

          if(sourceID.indexOf("/")>0){
            // found nested symbols
            const splitedPath = sourceID.split("/")
            sourceID = splitedPath[splitedPath.length-1]
        
            // ask source layer about his hotspots (forcing it follow totargetArtboard )    
            if(splitedPath.length>1){
              for(let i=0;i<splitedPath.length-1;i++){
                let itemId = splitedPath[i]            
                let item = this.layersDict[itemId]
                if(item==undefined){
                  this.log(cident+"getHotspots:  ERROR!!! Can't find path item '"+itemId+"'")
                  break;
                }
                this.log(cident+"getHotspots:  before overAbsoluteRect.y="+overAbsoluteRect.origin.y + "for item :"+item.name() )       
                overAbsoluteRect = this.getAbsoluteRect(item,this.Sketch.fromNative(item), overAbsoluteRect, cident+" ",true);   
                this.log(cident+"getHotspots:  after overAbsoluteRect.y="+overAbsoluteRect.origin.y + "for item :"+item.name() )       
              }
            }
          }        


          let srcLayer = this.layersDict[sourceID];          
          if(!srcLayer){
            log('getHotspots: failed to find object srcLayer: '+sourceID);
            //log(slayer)
            //log(this.layersDict)
            return
          }

          if(customProperty.value=='back'){
            const childHotspots = this.getHotspots(srcLayer, artboardData, overAbsoluteRect, cident+' ',"__back")
            if (childHotspots == null) return
            Array.prototype.push.apply(hotspots, childHotspots)
            return
          }

          if(customProperty.value==''){
            return
          }
          // get custom target from the property                        
          //let targetArtboard = this.Doc.getLayerWithID( customProperty.value );
          let targetArtboard = this.layersDict[ customProperty.value ];
          //
          if(!targetArtboard){
            log('getHotspots: failed to find object targetArtboard: '+customProperty.value);
            return
          }

          this.log(cident+"getHotspots: layer: "+layer.name());
          this.log(cident+"getHotspots: src: "+srcLayer.name());
          this.log(cident+'getHotspots: target: '+targetArtboard.name());


          const childHotspots = this.getHotspots(srcLayer, artboardData, overAbsoluteRect, cident+' ',targetArtboard.name());
          if (childHotspots == null) return;
        
          this.log(cident+'getHotspots: completed childHotspots:'+childHotspots.length);
          
          Array.prototype.push.apply(hotspots, childHotspots);          
          // prevent current layer from clicking
          targetArtboadName = '';  

        },this);         
        break
      }   

    }
    // @check customizations      
    

    if (targetArtboadName != "") {
      this.log(cident+"getHotspots: ||||||| ADD HOTSPOT 10 for "+ targetArtboadName +"["+layer.name()+']')      
      // found artboard link
      finalHotspot.linkType = "artboard";
      finalHotspot.artboardName = targetArtboadName;
      finalHotspot.href = Utils.toFilename(targetArtboadName) + ".html";

      hotspots.push(finalHotspot);
    }

    // @check link to artboard   

    return hotspots;
  }


  getArtboardImageName(artboard, scale) {
    this.log("getArtboardImageName()");
    const suffix = scale == 2 ? "@2x" : "";
    return Utils.toFilename(artboard.name(), false) + suffix + ".png";
  }


  generateJSStoryBegin(){
    this.jsStory = 
    'var story = {\n'+
    '"docName": "'+ Utils.toFilename(this.docName)+'",\n'+
    '"docPath": "P_P_P",\n'+
    '"docVersion": "V_V_V",\n'+
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


  pushArtboardSetIntoJSStory(artboardSet,index) {
    const mainArtboard = artboardSet[0].artboard;
    const mainName = mainArtboard.name();

    const isOverlay = this.Settings.layerSettingForKey(mainArtboard,SettingKeys.ARTBOARD_OVERLAY)==1;
    const annotations = this.Settings.layerSettingForKey(mainArtboard,SettingKeys.LAYER_ANNOTATIONS)
    const externalArtboardURL = this.Settings.layerSettingForKey(mainArtboard,SettingKeys.LAYER_EXTERNAL_LINK);


    this.log("process main artboard "+mainName);

    //if(externalArtboardURL!=undefined && externalArtboardURL!='') return


    let js = index?',':'';
    js +=
      '{\n'+
      '"image": "'+ Utils.quoteString(Utils.toFilename(mainName+'.png',false))+'",\n'
    if(this.retinaImages)
      js +=
        '"image2x": "'+ Utils.quoteString(Utils.toFilename(mainName+'@2x.png',false))+'",\n'
    js +=      
      '"width": '+mainArtboard.frame().width()+',\n'+
      '"height": '+mainArtboard.frame().height()+',\n'+
      '"title": "'+Utils.quoteString(mainName)+'",\n';

    if(annotations && annotations!=''){
      js += '"annotations": `'+annotations+'`,\n'
    }

    if(isOverlay){
      js += "'type': 'overlay',\n";
      const isOverlayShadow = this.Settings.layerSettingForKey(mainArtboard,SettingKeys.ARTBOARD_OVERLAY_SHADOW)==1;
      js += "'overlayShadow': "+(isOverlayShadow?1:0)+",\n";

    }else{
      js += "'type': 'regular',\n";
    }


    // build flat link array
    js +='"links": [\n';      
    const hotspots = [];
    self.myLayers.forEach(function (myArtboard) {   
      const artboardHotspots = this.getLayerHotspots(myArtboards);
      if (artboardHotspots != null) {   
        hotspots.push.apply(hotspots, artboardHotspots);
      }
    },this);

    let hotspotIndex = 0;  
    hotspots.forEach(function (hotspot) {
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
      '    '+hotspot.x+',\n'+
      '    '+hotspot.y+',\n'+
      '    '+(hotspot.x+hotspot.width)+',\n'+
      '    '+(hotspot.y+hotspot.height)+'\n'+
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
    if (layer.isKindOfClass(MSArtboardGroup)) {
      slice = MSExportRequest.exportRequestsFromExportableLayer(layer).firstObject();
    } else {
      slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(layer, layer.absoluteInfluenceRect(), false).firstObject();
    }
    slice.scale = scale;
    slice.saveForWeb = false;
    slice.format = "png";
    this.context.document.saveArtboardOrSlice_toFile(slice, imagePath);
  }

  exportImages(artboardGroup) {
    this.log("exportImages()");
    artboardGroup.forEach(function (artboardData) {
      
      // skip empty artboard with External URL
      //if( this.externalArtboardsURLs[artboardData.artboard.name()] ) return;

      this.exportImage(artboardData.artboard, 1, this._imagesPath + this.getArtboardImageName(artboardData.artboard, 1));
      if (this.retinaImages) {
        this.exportImage(artboardData.artboard, 2, this._imagesPath + this.getArtboardImageName(artboardData.artboard, 2));
      }
    
    }, this);
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
        artboardGroups.push.apply(artboardGroups, getArtboardGroupsInPage(page, context, false));
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
    return dict;
  }



  exportArtboards() {        
    this.artboardGroups = this.getArtboardGroups(this.context);
    this.log('artboardGroups: '+this.artboardGroups.length);
    this.artboardsDictName = this.getArtboardsDictName();
    
    {
      const layerCollector  = new MyLayerCollector()
      this.myLayers = layerCollector.collectArtboardsLayers(this)
    }    
    {
      const layerResizer  = new MyLayerResizer()
      layerResizer.resizeLayers(this)
    }    

    //var UI = require('sketch/ui')
    //UI.alert('Output', JSON.stringify(this.myLayers))
    //this.log(JSON.stringify(this.myLayers))

    return

    this.copyResources();
    this.createMainHTML();

    // try to collect all hotspots into single dictionay
    this.generateJSStoryBegin();
    let index = 0;

    this.artboardGroups.forEach(function (artboardGroup) {
      this.exportImages(artboardGroup);
      this.pushArtboardSetIntoJSStory(artboardGroup,index++);
    }, this);


    this.generateJSStoryEnd();
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