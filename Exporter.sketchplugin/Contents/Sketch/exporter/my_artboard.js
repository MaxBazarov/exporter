@import("constants.js")
@import("lib/utils.js")
@import("exporter/child-finder.js")
@import("exporter/my_layer.js")

Sketch = require('sketch/dom')

class MyArtboard extends MyLayer {

    static getArtboardGroupsInPage(page, context, includeNone = true) {
        const artboardsSrc = page.artboards();
        const artboards = [];
      
        artboardsSrc.forEach(function(artboard){
            if( !artboard.isKindOfClass(MSSymbolMaster)){
              artboards.push(artboard);
            }
        });
      
        return Utils.getArtboardGroups(artboards, context);  
      }
      

    // nlayer: ref to native MSLayer Layer
    // myParent: ref to parent MyLayer
    constructor(nlayer) {
        super(nlayer, undefined)

        this.fixedLayers = [] // list of layers which are configured as fixed

        // check if the page name is unique in document
        if(this.name in exporter.pagesDict){
            // we need to find a new name                        
            for(let i=1;i<1000;i++){               
                const newName = this.name+"("+i+")"
                if( !(newName in exporter.pagesDict)){
                    // found new unique name!
                    this.name = newName
                    break
                }
            }            
        }
        exporter.pagesDict[this.name] = this
        exporter.pageIDsDict[this.objectID] = this
        
        // init Artboard own things
        this.isOverlay =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY) == 1
        this.externalArtboardURL =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_EXTERNAL_LINK)
        if(this.externalArtboardURL!=undefined && ''==this.externalArtboardURL) 
            this.externalArtboardURL = undefined
        this.isOverlayShadow =
            this.isOverlay && exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_SHADOW) == 1
        this.disableAutoScroll =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL)
        this.transNextSecs = 
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS)
        if(undefined != this.transNextSecs && '' == this.transNextSecs)
            this.transNextSecs = undefined

        

        this.pageIndex = MyLayerPageCounter++        
    }

    export(pageIndex){
        this._exportImages()
        this._findFixedPanelHotspots()
        this._pushIntoJSStory(pageIndex)
        this._cleanUpAfterExport()
    }


    //------------------- FIND HOTSPOTS WHICH LOCATE OVER FIXED HOTPOSTS ----------------------------
    //------------------- AND MOVE THEM INTO FIXED LAYER SPECIAL HOTSPOTS ---------------------------
    _findFixedPanelHotspots(){
        for (var l of this.fixedLayers){
            for (let hIndex=0;hIndex<this.hotspots.length;hIndex++){
                let hotspot = this.hotspots[hIndex]
                // move hotspot from artboard hotspots to fixed layer hotspots
                if(hotspot.r.insideRectangle(l.frame)){
                    this.hotspots.splice(hIndex--,1)                                        
                    hotspot.r.x-=l.frame.x
                    hotspot.r.y-=l.frame.y
                    l.hotspots.push(hotspot)                    
                }
            }
            
        }
    }

    //------------------ GENERATE STORY.JS FILE  ------------------
    _pushIntoJSStory(pageIndex) {
        const mainName = this.name

        exporter.log("process main artboard " + mainName);
        exporter.totalImages++

        let js = pageIndex ? ',' : '';
        js +=
            '$.extend(new ViewerPage(),{\n' + 
            '"index": ' + parseInt(pageIndex) + ',\n' +
            '"image": "' + Utils.quoteString(Utils.toFilename(mainName + '.png', false)) + '",\n'
        if (exporter.retinaImages)
            js +=
                '"image2x": "' + Utils.quoteString(Utils.toFilename(mainName + '@2x.png', false)) + '",\n'
        js +=
            '"width": ' + parseInt(this.frame.width) + ',\n' +
            '"height": ' + parseInt(this.frame.height) + ',\n' +
            '"title": "' + Utils.quoteString(mainName) + '",\n';

        if( this.transNextSecs!=undefined ){
            js += "'transNextSecs': " + parseInt(this.transNextSecs) + ",\n";
        }

        if (this.disableAutoScroll) {
            js += "'disableAutoScroll': " + (this.disableAutoScroll ? 'true' : 'false') + ",\n";
        }

        if (this.isOverlay) {
            js += "'type': 'overlay',\n";
            js += "'overlayShadow': " + (this.isOverlayShadow ? 1 : 0) + ",\n";
        } else {
            js += "'type': 'regular',\n";
        }

        // add fixed layers
        js += this._pushFixedLayersIntoJSStory()

        // add hotspots 
        js += "'links' : " +JSON.stringify(this._buildHotspots(this.hotspots),null,"\t") +",\n" 
            

        js+="})\n"

        exporter.jsStory += js;
    }


    _pushFixedLayersIntoJSStory() {
        let recs = []

        if (this.fixedLayers.length) {
            const mainName = this.name
            const foundPanels = []
            for (var l of this.fixedLayers) {
                let type = l.fixedType
                if(type == "") {
                    exporter.logError("pushFixedLayersIntoJSStory: can't understand fixed panel type for artboard '" + this.name 
                        + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    continue
                }
                exporter.totalImages++

                if (!l.isFloat && foundPanels[type]) {
                    exporter.logError("pushFixedLayersIntoJSStory: found more than one panel with type '" + type + "' for artboard '" 
                        + this.name + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    const existedPanelLayer = foundPanels[type]
                    exporter.logError("pushFixedLayersIntoJSStory: already exists panel layer='" + existedPanelLayer.name 
                        + "' layer.frame=" + existedPanelLayer.frame)
                    continue
                }
                foundPanels[type] = l

                const fileNamePostfix = !l.isFloat?"":('_'+l.fixedIndex)

                const rec = {
                    constrains:l.constrains,
                    x:l.frame.x,
                    y:l.frame.y,
                    width:l.frame.width,
                    height:l.frame.height,
                    type:type,
                    index:l.fixedIndex,
                    isFloat: l.isFloat,
                    links: this._buildHotspots(l.hotspots),
                    image:Utils.quoteString(Utils.toFilename(mainName + fileNamePostfix+'.png', false))
                }                
                if (exporter.retinaImages)
                    rec.image2x = Utils.quoteString(Utils.toFilename(mainName + fileNamePostfix +'@2x.png', false))
                
                // setup shadow
                let shadowsStyle=""
                for(var shadow of l.slayer.style.shadows){
                    if(!shadow.enabled) continue
                    if(shadowsStyle!="") shadowsStyle+=","
                    shadowsStyle += shadow.x + "px "
                    shadowsStyle += shadow.y + "px "
                    shadowsStyle += shadow.blur + "px "
                    shadowsStyle += shadow.spread + " "
                    shadowsStyle += shadow.color + " "
                }
                if(shadowsStyle!="")
                    rec.shadow = shadowsStyle                  
                recs.push(rec)
            }
        }

        let js = "'fixedPanels': " + JSON.stringify(recs,null,"\t")+",\n";

        return js
    }

    _buildHotspots(srcHotspots) {        
        let newHotspots = []
        for(var hotspot of srcHotspots){
            const newHotspot = {
               rect: [ hotspot.r.x, hotspot.r.y,hotspot.r.x + hotspot.r.width,hotspot.r.y + hotspot.r.height],               
            }

            exporter.log(' _buildHotspots linkType='+hotspot.linkType+" l.name="+hotspot.l.name)

            if (hotspot.linkType == 'back') {
                newHotspot.action = 'back'
            } else if (hotspot.linkType == 'artboard' && exporter.pagesDict[hotspot.artboardID] != undefined 
                && exporter.pageIDsDict[hotspot.artboardID].externalArtboardURL != undefined
            ) {
                newHotspot.url = exporter.pageIDsDict[hotspot.artboardID].externalArtboardURL
            } else if (hotspot.linkType == 'artboard') {
                const targetPage = exporter.pageIDsDict[hotspot.artboardID]
                if (targetPage == undefined) {
                    exporter.log("undefined artboard: '" + hotspot.artboardName + '"');
                    continue
                }
                const targetPageIndex = targetPage.pageIndex;
                newHotspot.page = targetPageIndex
            } else if (hotspot.linkType == 'href') {
                newHotspot.url = hotspot.href 
            } else if (hotspot.target != undefined) {
                newHotspot.target = hotspot.target
            } else {
                exporter.log("_pushHotspotIntoJSStory: Uknown hotspot link type: '" + hotspot.linkType + "'")
            }

            newHotspots.push(newHotspot)

        }
        return newHotspots
    }


    //------------------ GENERATE IMAGES  ------------------


    _getImageName(scale,panelPostix="") {
        const suffix = scale == 2 ? "@2x" : "";
        return Utils.toFilename(this.name, false) + panelPostix +  suffix + ".png";
      }

    _exportImage(scale,layer,panelPostix="") {
        exporter.log("   exportImage() for "+layer.name);
        const  nlayer = layer.nlayer
        
        const imagePath = exporter.imagesPath + this._getImageName(scale,panelPostix)
        let slice;        

        if (nlayer.isKindOfClass(MSArtboardGroup)) {
            slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();
        } else {            
            slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();
            //slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(nlayer, nlayer.absoluteInfluenceRect(), false).firstObject();
        }
        slice.scale = scale;
        slice.saveForWeb = false;
        slice.format = "png";
        exporter.context.document.saveArtboardOrSlice_toFile(slice, imagePath);
    }

    // new experimental code to export images
    // we don't use it because it doesn't allow to set a file name
    _exportImage2(scales,slayer) {
        exporter.log("exportImage()");
        
        const imagePath = exporter.imagesPath // + this._getImageName(scales)
        log('_exportImage2 name='+slayer.name)
        const options = { 
            scales: scales,
            output: exporter.imagesPath,
            overwriting: true,
            'save-for-web': true, 
            formats: 'png' 
        }
        Sketch.export(slayer, options)        
        
    }

    _exportImages() {
        log("  exportArtboardImages: running... " + this.name)
        let scales = exporter.retinaImages?[1,2]:[1]    

        // export fixed panels to their own image files
        this._exportFixedLayersToImages(scales)

        // hide fixed panels to generate a main page content without fixed panels 
        // and their artefacts (shadows)
        // ! temporary disabled because an exported image still shows hidden layers
        this._switchFixedLayers(true)
                
        for(var scale of scales){                     
            this._exportImage(scale,this)
        }
        
        // show fixed panels back
        // ! temporary disabled because an exported image still shows hidden layers
        this._switchFixedLayers(false)

        log("  exportArtboardImages: done!")
    }

    _exportFixedLayersToImages(scales){
        for(var layer of this.fixedLayers){               
            // re-init Sketch Layer  (it was cleared before to help JSON procedure)
            if(layer.slayer==undefined)
               layer.slayer = Sketch.fromNative(layer.nlayer)

            layer.calculateFixedType()         

            // temporary disable fixed panel shadows
            let orgShadows = layer.slayer.style.shadows
            layer.slayer.style.shadows = []            
            
            // for float fixed layer we need to generate its own image files
            if(layer.isFloat){
                //this._exportImage2('1, 2',layer.parent.slayer)         
                for(var scale of scales){                                         
                    this._exportImage(scale,layer.parent.isSymbolInstance?layer.parent:layer,"_"+layer.fixedIndex)                    
                }                 
            }

            // restore original fixed panel shadows
            layer.slayer.style.shadows  = orgShadows
        }
    }

    _switchFixedLayers(hide){         
        const show = !hide
        for(var layer of this.fixedLayers){
            // we need to hide/show only float panels
            if(layer.isFloat){
                layer.slayer.hidden = hide
            }

            // temporary remove fixed panel shadows
            if(hide){
                layer.fixedShadows = layer.slayer.style.shadows
                layer.slayer.style.shadows = []  
            }

            // restore original fixed panel shadows
            if(show){
                layer.slayer.style.shadows  = layer.fixedShadows
            }

       }
    }

    // do some cleanup after exporting
    _cleanUpAfterExport(){
        for(var layer of this.fixedLayers){
            // clear ref to Sketch layer to don't break future JSON-encoding of layers
            layer.slayer = undefined 
       }
    }

}
