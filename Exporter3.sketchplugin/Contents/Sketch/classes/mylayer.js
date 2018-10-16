@import("constants.js")
@import("lib/utils.js")
@import("lib/resizing-constraint.js")
@import("lib/resizing-type.js")

Sketch = require('sketch/dom')

class MyLayer {
    // nlayer: ref to native MSLayer Layer
    // myParent: ref to parent MyLayer
    constructor(nlayer,myParent) {
        this.nlayer = nlayer
        this.name = nlayer.name() + ""
        this.parent = myParent
        this.objectID = nlayer.objectID()
        this.slayer = Sketch.fromNative(nlayer)
    
        // define type    
        this.isArtboard = false
        this.isGroup = false
        this.isSymbolInstance = false

        this.customLink = undefined

        if(nlayer.isKindOfClass(MSLayerGroup)) this.isGroup = true
        if(nlayer.isKindOfClass(MSSymbolInstance)) this.isSymbolInstance = true
        if(nlayer.isKindOfClass(MSArtboardGroup))  this.isArtboard = true

        this.childs = []  
        this.hotspots = []  
    }

}

class MyLayerCollector {
    constructor() {        
    }
    
    collectArtboardsLayers(exporter){
        this.e = exporter
        exporter.myLayersDict = []
        const myLayers = []
        exporter.artboardGroups.forEach(function (artboardGroup) {
            const artboard = artboardGroup[0].artboard;
            myLayers.push(this.getCollectLayer(artboard,undefined))
        }, this);

        exporter.myLayers = myLayers
    }

    getCollectLayer(nlayer,myParent){
        const myLayer = new MyLayer(nlayer,myParent) 
        this.e.myLayersDict[ myLayer.objectID ] = myLayer

        if(myLayer.isSymbolInstance){      
            //myLayer.childs.push( this.getCollectLayer(layer.symbolMaster(),myLayer)  )
            myLayer.childs =  this.getCollectLayerChilds(nlayer.symbolMaster().layers(),myLayer)
        }else if(myLayer.isGroup){
            myLayer.childs =  this.getCollectLayerChilds(nlayer.layers(),myLayer)
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
}
