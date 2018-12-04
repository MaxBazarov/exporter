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
        if(myParent!=undefined) this.constrains = this._calculateConstrains()
        this.tempOverrides = undefined        
        
        if(nlayer.isFixedToViewport()) this.addSelfAsFixedLayerToArtboad()    
        
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

    addSelfAsFixedLayerToArtboad(){         
        this.isFixed = true
        this.fixedIndex = this.artboard.fixedLayers.length
        this.artboard.fixedLayers.push(this)
    }

    calculateFixedType(){              
     
        // Dirty code to detect a type of layer with fixed position
        let type = "";
        if (0==this.frame.x && this.frame.width < this.frame.height) {
            type = "left";
        }
        // handle the only one top-pinnded layers for now
        else if (0==this.frame.y && this.frame.width > this.frame.height) {
            type = "top";
        }
        // ok, it will a float panel
        else{
            type = "float"
        } 
        this.fixedType = type
        this.isFloat = type=='float'
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

        exporter.myLayers = myLayers
        log( prefix+"collectArtboardsLayers: done!")
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
