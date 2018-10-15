@import("constants.js")
@import("lib/utils.js")
@import("lib/resizing-constraint.js")
@import("lib/resizing-type.js")

Sketch = require('sketch/dom')

class MyLayer {
  constructor(layer,myParent) {
    this.layer = layer
    this.name = layer.name() + ""
    this.parent = myParent
  
    // define type    
    this.isArtboard = false
    this.isGroup = false
    this.isSymbolInstance = false

    if(layer.isKindOfClass(MSLayerGroup)) this.isGroup = true
    if(layer.isKindOfClass(MSSymbolInstance)) this.isSymbolInstance = true
    if(layer.isKindOfClass(MSArtboardGroup))  this.isArtboard = true

    this.childs = []    
  }

}

class MyLayerCollector {
    constructor() {        
    }
    
    collectArtboardsLayers(exporter){
        this.e = exporter
        const myLayers = []
        exporter.artboardGroups.forEach(function (artboardGroup) {
            const artboard = artboardGroup[0].artboard;
            myLayers.push(this.getCollectLayer(artboard,undefined))
        }, this);

        return myLayers
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
}

class MyLayerResizer {
    constructor() {
    }
    
    resizeLayers(exporter){
        log( "--- RESIZE LAYERS ---")

        this.e = exporter
        this._resizeLayers(exporter.myLayers)        

        log( "--- /RESIZE LAYERS ---")
    }

    _resizeLayers(layers,prefix=""){
        layers.forEach(function (layer) {
            this._resizeLayer(layer,prefix+" ")
        }, this);
    }

    _resizeLayer(l,prefix){       
        log( prefix+l.name)

        l.frame = Utils.copyRectangle(l.layer.frame())
        l.cw = l.parent?l.parent.cw:1.0
        l.ch = l.parent?l.parent.cw:1.0    
    
        l.absoluteFrame  = Utils.copyRectangle(l.layer.frame())
        if(l.parent == undefined){
            l.absoluteFrame.x = 0
            l.absoluteFrame.y = 0
        }        
        if(l.cw!=1.0 || l.ch!=1.0){
          l.absoluteFrame.x = l.parent.absoluteFrame.x + (l.absoluteFrame.x * l.cw)
          l.absoluteFrame.y = l.parent.absoluteFrame.y + (l.absoluteFrame.y * l.ch)
          l.absoluteFrame.width =  l.absoluteFrame.width * l.cw
          l.absoluteFrame.height =  l.absoluteFrame.height * l.ch
        }else if (l.parent){          
          l.absoluteFrame.x = l.parent.absoluteFrame.x + l.absoluteFrame.x
          l.absoluteFrame.y = l.parent.absoluteFrame.y + l.absoluteFrame.y
        }
        
        if(l.isSymbolInstance){      
            this._calcSymbolInstanceConstrains(l,l.layer.symbolMaster())   
        }
  
        ///
        this._resizeLayers(l.childs,prefix)
    }

    _calcSymbolInstanceConstrains(l,masterLayer){
        l.cframe = Utils.copyRectangle(masterLayer.frame()) 
        l.cw = l.frame.width / l.cframe.width * l.cw
        l.ch = l.frame.width / l.cframe.width * l.ch
        
      }
}