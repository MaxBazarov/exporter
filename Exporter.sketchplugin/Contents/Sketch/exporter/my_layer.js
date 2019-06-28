@import("constants.js")
@import("lib/utils.js")
@import("exporter/child-finder.js")

var ResizingConstraint = {
    NONE: 0,
    RIGHT: 1 << 0,
    WIDTH: 1 << 1,
    LEFT: 1 << 2,
    BOTTOM: 1 << 3,
    HEIGHT: 1 << 4,
    TOP: 1 << 5
}


var UX1LibraryName = "ux1-ui"

Sketch = require('sketch/dom')

class MyLayer {

    // nlayer: ref to native MSLayer Layer
    // myParent: ref to parent MyLayer
    constructor(nlayer,myParent) {
        this.nlayer = nlayer
        this.name = nlayer.name() + ""
        this.parent = myParent
        this.objectID = nlayer.objectID()
        this.originalID = undefined
        this.symbolMaster = undefined
        this.slayer = Sketch.fromNative(nlayer)
        this.artboard = myParent ? myParent.artboard : this
        this.isParentFixed = myParent && (myParent.isFixed || myParent.isParentFixed)
    
        // define type    
        this.isArtboard = false
        this.isGroup = false
        this.isSymbolInstance = false

        this.customLink = undefined

        //log('+++++ this.name: ' + this.name + " symbol: "+(nlayer.isKindOfClass(MSSymbolInstance)))

        if(nlayer.isKindOfClass(MSLayerGroup)) this.isGroup = true
        if(nlayer.isKindOfClass(MSSymbolInstance)){
            this.isSymbolInstance = true
            this.symbolMaster = nlayer.symbolMaster()

            // prepare data for Element Inspector
            const lib = this.slayer.master.getLibrary()            
            if(lib && UX1LibraryName==lib.name||true){
                this.symbolMasterName = this.symbolMaster.name()+""                
            }
        }else{
            this.symbolMasterName = undefined
        }
        if(nlayer.isKindOfClass(MSArtboardGroup))  this.isArtboard = true
        if(nlayer.isKindOfClass(MSTextLayer)){
            // prepare data for Element Inspector
            const sharedStyle = nlayer.sharedStyle()
            if(sharedStyle)
                this.styleName = sharedStyle.name()+""
                this.text = this.slayer.text+""
        }

        var comment = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_COMMENT)
        if(undefined!=comment && ''!=comment){
            this.comment = comment
        }


        
        this.childs = []  
        this.hotspots = [] 
        
        this.frame = undefined
        this.orgFrame = undefined
        if(myParent!=undefined) this.constrains = this._calculateConstrains()
        this.tempOverrides = undefined        
        
        if(!this.isArtboard && !exporter.disableFixedLayers && !this.isParentFixed){
            var overlayType = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_OVERLAY_TYPE)
            if(undefined==overlayType || ''==overlayType)
                overlayType = Constants.LAYER_OVERLAY_DEFAULT
            
            if(nlayer.isFixedToViewport() || overlayType!=Constants.LAYER_OVERLAY_DEFAULT){
                this.addSelfAsFixedLayerToArtboad(overlayType)    
            }
        }

         // check special internal properties
         // check: if this layer provides browser window background color
         if(""==exporter.backColor){            
            while(true){
                if(this.name.indexOf(Constants.INT_LAYER_NAME_BACKCOLOR)<0) break
                let fills =  this.slayer.style.fills
                if(undefined==fills) break
                fills =  fills.filter(function(el){return el.enabled})
                if(0==fills.length) break
                exporter.backColor = fills[0].color                
                break
            }
        }   
        // check: if this layer provides browser favicon
        if(this.name.indexOf(Constants.INT_LAYER_NAME_SITEICON)>=0){
            exporter.siteIconLayer = this
        }
        // check: if this layer contains special overlay
        if(!this.isArtboard && this.name.indexOf(Constants.INT_LAYER_NAME_OVERLAYONHOVER)>=0){
            this.hasHoverOverlay = true
            this.artboard.overlayLayers.push(this)
        }
        
    }

    _calculateConstrains(){
        const resizingConstraint = 63 ^ this.nlayer.resizingConstraint()
        const res = {
            top : (resizingConstraint & ResizingConstraint.TOP) === ResizingConstraint.TOP,
            bottom : (resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM,
            left : (resizingConstraint & ResizingConstraint.LEFT) === ResizingConstraint.LEFT,
            right : (resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT,
            height : (resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT,
            width: (resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH
        }
        return res        
    }    

    addSelfAsFixedLayerToArtboad(overlayType){         

        if(Constants.LAYER_OVERLAY_DIV==overlayType){
            var layerDivID = exporter.Settings.layerSettingForKey(this.slayer, SettingKeys.LAYER_DIV_ID)
            if(layerDivID!=undefined && layerDivID!=''){
                this.layerDivID = layerDivID
            }else{
                // No Div ID = No div overlay
                return
            }
        }
        
        this.isFixed = true
        this.overlayType = overlayType
        this.fixedIndex = this.artboard.fixedLayers.length
        this.artboard.fixedLayers.push(this)
    }

    calculateFixedType(){     
        let type = "";

        if(Constants.LAYER_OVERLAY_DIV==this.overlayType){
            type = 'div'
        }else if(Constants.LAYER_OVERLAY_TRANSP_TOP==this.overlayType){
           type = "top";      
        }else if(Constants.LAYER_OVERLAY_TRANSP_LEFT==this.overlayType){
            type = "left";      
        }else	
            type = "float"

        this.fixedType = type
        this.isFloat = type=='float'
        this.isFixedDiv = type=='div'
                
    }

    getShadowAsStyle(){
        if(this.slayer.style==undefined ||  this.slayer.style.shadows==undefined || this.slayer.style.length==0) return undefined

        let shadowInfo = undefined
        for(var shadow of this.slayer.style.shadows){
            if(!shadow.enabled) continue
            let shadowsStyle=""

            if(shadowsStyle!="") shadowsStyle+=","
            shadowsStyle += shadow.x + "px "
            shadowsStyle += shadow.y + "px "
            shadowsStyle += shadow.blur + "px "
            shadowsStyle += shadow.spread + " "
            shadowsStyle += shadow.color + " "

            shadowInfo = {
                style:  shadowsStyle,
                x:      shadow.x + shadow.blur
            }
        }

        return shadowInfo
    }


    clearRefsBeforeJSON(){
        // need to cleanup temp object to allow dump it into JSON
        // but keep nlayer because Exporter.exportImage() needs it
        this.symbolMaster = undefined
        this.tempOverrides = undefined
        this.slayer = undefined
        //l.nlayer = undefined
        this.customLink = undefined

        //log('---- this.symbolMasterName:')
        //log( this.symbolMasterName )
        //log('---- this.name:')
        //log( this.name)


        for(var l of this.childs){
            l.clearRefsBeforeJSON()
        }
    }

    exportSiteIcon(){
        const nlayer = this.nlayer
        const layer = this
        
        const imageName = "icon.png"
        const imagePath = exporter._outputPath+"/resources/"+imageName;

        log("imagePath:"+imagePath)
        let slice = null

        slice = MSExportRequest.exportRequestsFromExportableLayer(nlayer).firstObject();
        
        slice.scale = 1;
        slice.saveForWeb = false;
        slice.format = "png";
        exporter.ndoc.saveArtboardOrSlice_toFile(slice, imagePath);

        /*const options = { 
            scales: [1],
            output: imagePath,
            overwriting: true,
            'save-for-web': true, 
            formats: 'png' 
        }
        Sketch.export(this.slayer, options)       */
    }

}

class MyLayerCollector {
    constructor() {        
    }
    
    collectArtboardsLayers(prefix){                
        log( prefix+"collectArtboardsLayers: running...")
        this.childFinder = new ChildFinder()        
        const myLayers = []
        exporter.artboardGroups.forEach(function (artboardGroup) {
            const artboard = artboardGroup[0].artboard;
            myLayers.push(this.getCollectLayer(prefix+" ",artboard,undefined,{}))
        }, this);

        // do we need to add some artboards from libraries ?
        const overlayedArtboards = this._findOverlayArtboardsFromLibraries(myLayers)
        for(const nArtboard of overlayedArtboards){
            myLayers.push(this.getCollectLayer(prefix+" ",nArtboard,undefined,{}))
        }

        exporter.myLayers = myLayers

        log( prefix+"collectArtboardsLayers: done!")
    }

    _findOverlayArtboardsFromLibraries(knownArtboards){
        let result = []
        log('_addOverlayArtboardsFromLibraries: running')  

        for(const artboard of knownArtboards){
            for(const layer of artboard.overlayLayers){
                const sLibraryArtboard = this._findLibraryArtboardByName(layer.name+"@")
                if(!sLibraryArtboard) continue
                layer.hoverOverlayArtboardID = sLibraryArtboard.sketchObject.objectID()
                log('hoverOverlayArtboardID---------------+++ '+sLibraryArtboard.id )  //--
                log('hoverOverlayArtboardID---------------+++ '+layer.hoverOverlayArtboardID )  //--
                result.push(sLibraryArtboard.sketchObject)
            }
        }
    
        log('_addOverlayArtboardsFromLibraries: done!')  
        return result
    }


    // return wrappedObject
    _findLibraryArtboardByName(name){
        var libraries = require('sketch/dom').getLibraries()    
        log('_findLibraryArtboardByName.1')
        log(libraries)
        for(const lib of libraries){           
            log('_findLibraryArtboardByName.3')
            const doc = lib.getDocument() 
            const artboards = doc.getLayersNamed(name)
            if(artboards.length){
                log('_findLibraryArtboardByName.3.1 SUCCESS')
                return artboards[0]
            }
            log('_findLibraryArtboardByName.4')

        }
        log('_findLibraryArtboardByName.10 FAILED')
        return undefined
    }

    getCollectLayer(prefix,nlayerOrg,myParent,symbolOverrides){
        let nlayer = nlayerOrg
        
        let myLayer = undefined
        if(myParent==undefined)
            myLayer = new MyArtboard(nlayer)
        else
            myLayer = new MyLayer(nlayer,myParent) 
    

        let newMaster = undefined

        exporter.log(prefix + nlayer.name()+ " "+nlayer.objectID())

        if(nlayer.isKindOfClass(MSSymbolInstance)){
            const objectID = nlayer.objectID()
            while(objectID in symbolOverrides){
                const over = symbolOverrides[objectID] 
                exporter.log("getCollectLayer found override for "+objectID + "  newMaster = "+over['newMaster']   )

                if(over['path']!=undefined){
                    if(over['path'].length>1){
                        exporter.log("getCollectLayer shifted override path")
                        over['path'].shift()
                        const newID =  over['path'][0]
                        // replace ID in symbolOverrides dictionary
                        symbolOverrides[newID] = over
                        delete symbolOverrides[objectID]                        
                        break
                    }
                }
                newMaster = over['newMaster']               
                if(newMaster==null){
                    return null
                }
                myLayer.originalID = objectID
                myLayer.symbolMaster = newMaster      
                
                const lib =   Sketch.fromNative(newMaster).getLibrary()            
                if(lib && UX1LibraryName==lib.name){
                    myLayer.symbolMasterName = myLayer.symbolMaster.name()+""
                }        
                
                //log('myLayer.symbolMasterName:')
                //log(myLayer.symbolMasterName)
                delete symbolOverrides[objectID] 
                break                                              
            }                     
        }
        
        exporter.log(prefix + nlayer.name()+ " "+nlayer.objectID())

        if(myLayer.isSymbolInstance){      
            var newSymbolOverrides = this._extendSymbolOverrides(myLayer,symbolOverrides)   
            myLayer.childs =  this.getCollectLayerChilds(prefix+" ", myLayer.symbolMaster.layers(),myLayer,newSymbolOverrides)
        }else if(myLayer.isGroup){
            myLayer.childs =  this.getCollectLayerChilds(prefix+" ",nlayer.layers(),myLayer,symbolOverrides)
        }
          
        return myLayer
    }

    getCollectLayerChilds(prefix,layers, myParent,symbolOverrides){
        const myLayers = []     

        layers.forEach(function (childLayer) {                      
            const newLayer = this.getCollectLayer(prefix+" ",childLayer,myParent,symbolOverrides)
            if(newLayer==null) return

            myLayers.push( newLayer )
        }, this);
        return myLayers
    }

    _extendSymbolOverrides(layer,symbolOverrides){
        var cloned = false
        
        // check if symbol was replaced by another
        for(var customProperty of layer.slayer.overrides){
            if( !(customProperty.property==='symbolID' && !customProperty.isDefault && customProperty.value!=undefined) ) continue
            let oldID = customProperty.path
            let newID = customProperty.value            

            // check if it was overrided by parents
            if( oldID in symbolOverrides) continue
            
            if(!cloned){
                symbolOverrides = Utils.cloneDict(symbolOverrides)
                cloned = true
            }

            const overStruct = {
                'newMaster': null,
                'path': undefined
            }

            if(oldID.indexOf("/")>0){
                exporter.log("_extendSymbolOverrides() found complex override: "+oldID)    
                overStruct['path'] = oldID.split("/")
                oldID = overStruct['path'][0]
            }

            if(newID==""){
                overStruct['newMaster'] = null            
            }else{
                const newNLayer = exporter.symDict[newID]
                if(newNLayer==undefined || newNLayer==null){
                    exporter.stopWithError("_extendSymbolOverrides() Can't find symbol with ID:"+newID+" for object:"+layer.name)
                }

                overStruct['newMaster'] = newNLayer
            }

            symbolOverrides[oldID] = overStruct

            exporter.log("_extendSymbolOverrides() overrided old="+oldID+" overStruct="+overStruct)    
        }        
        return symbolOverrides
    }

}
