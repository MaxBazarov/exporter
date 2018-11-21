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
        
        // init Artboard own things
        this.isOverlay =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY) == 1
        this.externalArtboardURL =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_EXTERNAL_LINK)
        this.isOverlayShadow =
            this.isOverlay && exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_OVERLAY_SHADOW) == 1
        this.disableAutoScroll =
            exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL)

        this.pageIndex = MyLayerPageCounter++
        exporter.pagesDict[this.name] = this
    }

    export(pageIndex){
        this._exportImages()
        this._pushIntoJSStory(pageIndex)
        this._cleanUpAfterExport()
    }

    //------------------ GENERATE STORY.JS FILE  ------------------
    _pushIntoJSStory(pageIndex) {
        const mainName = this.name

        exporter.log("process main artboard " + mainName);
        exporter.totalImages++

        let js = pageIndex ? ',' : '';
        js +=
            '{\n' +
            '"index": ' + pageIndex + ',\n' +
            '"image": "' + Utils.quoteString(Utils.toFilename(mainName + '.png', false)) + '",\n'
        if (exporter.retinaImages)
            js +=
                '"image2x": "' + Utils.quoteString(Utils.toFilename(mainName + '@2x.png', false)) + '",\n'
        js +=
            '"width": ' + this.frame.width + ',\n' +
            '"height": ' + this.frame.height + ',\n' +
            '"title": "' + Utils.quoteString(mainName) + '",\n';

        if (this.disableAutoScroll) {
            js += "'disableAutoScroll': " + (this.disableAutoScroll ? 'true' : 'false') + ",\n";
        }

        if (this.isOverlay) {
            js += "'type': 'overlay',\n";
            js += "'overlayShadow': " + (this.isOverlayShadow ? 1 : 0) + ",\n";
        } else {
            js += "'type': 'regular',\n";
        }

        js += this._pushFixedLayersIntoJSStory()

        // build flat link array
        js += '"links": [\n';

        let hotspotIndex = 0;
        this.hotspots.forEach(function (hotspot) {
            const spotJs = this._pushHotspotIntoJSStory(hotspot);
            if (spotJs != '') {
                js += hotspotIndex++ ? ',' : '';
                js += spotJs;
            }
        }, this);

        js += ']}\n';

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
                    exporter.logError("pushFixedLayersIntoJSStory: can't understand fixed panel type for artboard '" + this.name + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    continue
                }
                exporter.totalImages++

                if (!l.isFloat && foundPanels[type]) {
                    exporter.logError("pushFixedLayersIntoJSStory: found more than one panel with type '" + type + "' for artboard '" + this.name + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    const existedPanelLayer = foundPanels[type]
                    exporter.logError("pushFixedLayersIntoJSStory: already exists panel layer='" + existedPanelLayer.name + "' layer.frame=" + existedPanelLayer.frame)
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

        let js = "'fixedPanels': \n" + JSON.stringify(recs,null,"\t")+",\n";

        return js
    }

    _pushHotspotIntoJSStory(hotspot) {
        let js =
            '{\n' +
            '  "rect": [\n' +
            '    ' + hotspot.r.x + ',\n' +
            '    ' + hotspot.r.y + ',\n' +
            '    ' + (hotspot.r.x + hotspot.r.width) + ',\n' +
            '    ' + (hotspot.r.y + hotspot.r.height) + '\n' +
            '   ],\n';

        if (hotspot.linkType == 'back') {
            js += '   "action": "back"\n';
        } else if (hotspot.linkType == 'artboard' && exporter.pagesDict[hotspot.artboardName] != undefined && exporter.pagesDict[hotspot.artboardName].externalArtboardURL != undefined) {
            js += '   "url": "' + exporter.pagesDict[hotspot.artboardName].externalArtboardURL + '"\n';
        } else if (hotspot.linkType == 'artboard') {
            const targetPage = exporter.pagesDict[hotspot.artboardName]
            if (targetPage == undefined) {
                exporter.log("undefined artboard: '" + hotspot.artboardName + '"');
                return '';
            }
            const targetPageIndex = exporter.pagesDict[hotspot.artboardName].pageIndex;
            js += '   "page": ' + targetPageIndex + '\n';
        } else if (hotspot.linkType == 'href') {
            js += '   "url": "' + hotspot.href + '"\n';
        } else if (hotspot.target != undefined) {
            js += '   "target": "' + hotspot.target + '",\n';
        } else {
            exporter.log("_pushHotspotIntoJSStory: Uknown hotspot link type: '" + hotspot.linkType + "'")
        }

        js += '  }\n';

        return js;
    }


    //------------------ GENERATE IMAGES  ------------------


    _getImageName(scale,panelPostix="") {
        exporter.log("getArtboardImageName()");
        const suffix = scale == 2 ? "@2x" : "";
        return Utils.toFilename(this.name, false) + panelPostix +  suffix + ".png";
      }

    _exportImage(scale,layer,panelPostix="") {
        exporter.log("exportImage() for "+layer.name);
        const  nlayer = layer.nlayer
        
        const imagePath = exporter.imagesPath + this._getImageName(scale,panelPostix)
        let slice;        

        if (nlayer.isKindOfClass(MSArtboardGroup)) {
            slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();
        } else {
            slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(nlayer, nlayer.absoluteInfluenceRect(), false).firstObject();
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
                for(var scale of scales){                     
                    this._exportImage(scale,layer,"_"+layer.fixedIndex)                    
                }                 
            }

            // restore original fixed panel shadows
            layer.slayer.style.shadows  = orgShadows
        }
    }

    _switchFixedLayers(hide){         
        for(var layer of this.fixedLayers){
            // we need to hide/show only float panels
            if(!layer.isFloat) continue
            
            // hide or show fixed float panel                        
            layer.slayer.hidden = hide
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
