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

    //------------------ GENERATE STORY.JS FILE  ------------------
    pushIntoJSStory(index) {
        const mainName = this.name;

        exporter.log("process main artboard " + mainName);
        exporter.totalImages++

        let js = index ? ',' : '';
        js +=
            '{\n' +
            '"index": ' + index + ',\n' +
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
        let js = "'fixedPanels': {\n";

        if (this.fixedLayers.length) {
            const foundPanels = []
            for (var l of this.fixedLayers) {
                let type = "";
                if (l.frame.width < l.frame.height) {
                    type = "left";
                }
                // handle the only one top-pinnded layers for now
                if (l.frame.width > l.frame.height) {
                    type = "top";
                }
                if (type == "") {
                    exporter.logError("pushFixedLayersIntoJSStory: can't understand fixed panel type for artboard '" + this.name + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    continue
                }

                exporter.totalImages++

                if (foundPanels[type]) {
                    exporter.logError("pushFixedLayersIntoJSStory: found more than one panel with type '" + type + "' for artboard '" + this.name + "' layer='" + l.name + "' layer.frame=" + l.frame + " this.frame=" + this.frame)
                    const existedPanelLayer = foundPanels[type]
                    exporter.logError("pushFixedLayersIntoJSStory: already exists panel layer='" + existedPanelLayer.name + "' layer.frame=" + existedPanelLayer.frame)
                    continue
                }
                foundPanels[type] = l
                js += "'" + type + "':" + "{\n";
                js += " 'width':" + l.frame.width + ",\n";
                js += " 'height':" + l.frame.height + ",\n";
                js += " 'type':'" + type + "'";
                js += "},";
            }
        }

        js += "},\n";

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


    _getImageName(scale) {
        exporter.log("getArtboardImageName()");
        const suffix = scale == 2 ? "@2x" : "";
        return Utils.toFilename(this.name, false) + suffix + ".png";
      }

    _exportImage(scale) {
        exporter.log("exportImage()");
        
        const imagePath = exporter.imagesPath + this._getImageName(scale)
        let slice;        

        if (this.nlayer.isKindOfClass(MSArtboardGroup)) {
            slice = MSExportRequest.exportRequestsFromExportableLayer(this.nlayer).firstObject();
        } else {
            slice = MSExportRequest.exportRequestsFromExportableLayer_inRect_useIDForName(this.nlayer, this.nlayer.absoluteInfluenceRect(), false).firstObject();
        }
        slice.scale = scale;
        slice.saveForWeb = false;
        slice.format = "png";
        exporter.context.document.saveArtboardOrSlice_toFile(slice, imagePath);
    }

    // new experimental code to export images
    // we don't use it because it doesn't allow to set a file name
    _exportImage2(scales) {
        exporter.log("exportImage()");
        
        const imagePath = exporter.imagesPath // + this._getImageName(scales)
        
        const options = { 
            scales: scales,
            output: exporter.imagesPath,
            overwriting: true,
            'save-for-web': true, 
            formats: 'png' 
        }
        Sketch.export(this.slayer, options)        
        
    }

    exportImages() {
        log("  exportArtboardImages: running... " + this.name)
        let scales = exporter.retinaImages?[1,2]:[1]

        // hide fixed panels to generate a main page content without fixed panels 
        // and their artefacts (shadows)
        // ! temporary disabled because an exported image still shows hidden layers
        //this.switchFixedLayers(true)
        
        for(var scale of scales){                     
            this._exportImage(scale)
        }
        
        // show fixed panels back
        // ! temporary disabled because an exported image still shows hidden layers
        //this.switchFixedLayers(false)

        log("  exportArtboardImages: done!")
    }


    switchFixedLayers(hide){
        for(var layer of this.fixedLayers){
            // re-init Sketch Layer  (it was cleared before to help JSON procedure)
           if(layer.slayer==undefined)
                layer.slayer = Sketch.fromNative(layer.nlayer)

           // hide or show fixed panel                        
           layer.slayer.hidden = hide

           // clear to don't break future JSON-encoding 
           if(!hide) layer.slayer = undefined 
       }
    }

}
