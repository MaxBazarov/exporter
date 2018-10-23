@import("constants.js")
@import("lib/utils.js")


Sketch = require('sketch/dom')

class MyLayer {
    // nlayer: ref to native MSLayer Layer
    // myParent: ref to parent MyLayer
    constructor(nlayer,myParent,) {
        this.nlayer = nlayer
        this.name = nlayer.name() + ""
        this.parent = myParent
        this.objectID = nlayer.objectID()
        this.originalID = undefined
        this.symbolMaster = undefined
        this.slayer = Sketch.fromNative(nlayer)
    
        // define type    
        this.isArtboard = false
        this.isGroup = false
        this.isSymbolInstance = false

        this.customLink = undefined

        if(nlayer.isKindOfClass(MSLayerGroup)) this.isGroup = true
        if(nlayer.isKindOfClass(MSSymbolInstance)){
            this.isSymbolInstance = true
            this.symbolMaster = nlayer.symbolMaster()
        }
        if(nlayer.isKindOfClass(MSArtboardGroup))  this.isArtboard = true

        this.childs = []  
        this.hotspots = [] 
        
        this.frame = undefined
        this.orgFrame = undefined
        
        this.tempOverrides = undefined
    }

}

class MyLayerCollector {
    constructor() {        
    }
    
    collectArtboardsLayers(exporter){        
        this.e = exporter
        this.e.log( "--- COLLECT LAYERS ---")
        const myLayers = []
        exporter.artboardGroups.forEach(function (artboardGroup) {
            const artboard = artboardGroup[0].artboard;
            myLayers.push(this.getCollectLayer("",artboard,undefined,{}))
        }, this);

        exporter.myLayers = myLayers
        this.e.log( "--- /COLLECT LAYERS ---")
    }

    getCollectLayer(prefix,nlayerOrg,myParent,symbolOverrides){
        let nlayer = nlayerOrg
        
        const myLayer = new MyLayer(nlayer,myParent) 

        let newMaster = undefined

        if(nlayer.isKindOfClass(MSSymbolInstance)){
            const objectID = nlayer.objectID()
            newMaster = symbolOverrides[objectID]
            if(newMaster != null ){
                myLayer.originalID = objectID
                myLayer.symbolMaster = newMaster
            }                                
        }
        
        this.e.log(prefix + nlayer.name()+ " "+nlayer.objectID())

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
            myLayers.push( newLayer )
        }, this);
        return myLayers
    }

    _extendSymbolOverrides(layer,symbolOverrides){
        var cloned = false
        
        // check if symbol was replaced by another
        for(var customProperty of layer.slayer.overrides){
            if( !(customProperty.property==='symbolID' && !customProperty.isDefault && customProperty.value!=undefined) ) continue
            const oldID = customProperty.path
            const newID = customProperty.value

            if(newID==""){
                log(customProperty)
                continue
            }

            // check if it was overrided by parents
            if( oldID in symbolOverrides) continue
            
            if(!cloned){
                symbolOverrides = Utils.cloneDict(symbolOverrides)
                cloned = true
            }

            const newNLayer = this.e.symDict[newID]
            if(newNLayer==undefined || newNLayer==null){
                this.e.stopWithError("_extendSymbolOverrides() Can't find symbol with ID:"+newID+" for object:"+layer.name)
            }

            symbolOverrides[oldID] = newNLayer
            this.e.log("overrided old="+oldID+" new="+newID)    
        }        
        return symbolOverrides
    }

}
