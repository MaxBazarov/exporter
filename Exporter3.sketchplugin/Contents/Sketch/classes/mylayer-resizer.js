@import("constants.js")
@import("lib/utils.js")
@import("lib/resizing-constraint.js")
@import("lib/resizing-type.js")
@import("mylayer.js")

Sketch = require('sketch/dom')


class MyLayerResizer {
    constructor() {
    }
    
    resizeLayers(exporter){
        log( "--- RESIZE LAYERS ---")

        this.e = exporter
        this._resizeLayers(exporter.myLayers)        

        log( "--- /RESIZE LAYERS ---")
    }

    _resizeLayer2(l,prefix){       
        log( prefix+l.name)

        l.frame = Utils.copyRectToRectangle(l.nlayer.frame())
        
        l.cw = l.parent?l.parent.cw:1.0
        l.ch = l.parent?l.parent.cw:1.0    
    
        l.absoluteFrame  = Utils.copyRectToRectangle(l.nlayer.frame())
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
            this._calcSymbolInstanceConstrains(l,l.nlayer.symbolMaster())   
        }
  
        ///
        this._resizeLayers(l.childs,prefix)
    }

    _calcSymbolInstanceConstrains(l,masterLayer){
        l.cframe = Utils.copyRectToRectangle(masterLayer.frame()) 
        l.cw = l.frame.width / l.cframe.width * l.cw
        l.ch = l.frame.width / l.cframe.width * l.ch        
    }


    _resizeLayers(layers,topOffset=undefined,prefix=""){
        layers.forEach(function (layer) {
            if(layer.parent == undefined){
                // process top layer (artboard)            
                this.currentArtboard = layer
            }
            this._resizeLayer(layer,topOffset,prefix+" ")
        }, this);
    }

    _resizeLayer(l,topOffset,prefix){        
        const layer = l.nlayer
        const e = this.e

        this.e.log( prefix+l.name+" id="+l.nlayer.objectID())
        
        this.overrides=[]

        l.frame = Utils.copyRectToRectangle(layer.absoluteRect())
        let localFrame  = Utils.copyRectToRectangle(layer.frame())
     
        if(l.parent==undefined){
            // reset top artboard absolute position
            topOffset = new Rectangle(l.frame.x,l.frame.y,0,0)
            l.frame.x = 0
            l.frame.y = 0
        }else{  
            // apply top offset to all childs
            l.frame.x -= topOffset.x
            l.frame.y -= topOffset.y
        }
        
        if(l.isSymbolInstance){      
            // reset topOfset for all symbol content
            const master = layer.symbolMaster()
            topOffset = new Rectangle(master.absoluteRect().x() - l.frame.x, master.absoluteRect().y() - l.frame.y,0,0)
        }
        
        // --------------- NO CONSTRAINT --------------
        if (layer.resizingConstraint == undefined) {
            
        // --------------- CONSTRAINT --------------
        }else{
           
            
        }     

        this._processLayerLinks(l,prefix+" ")

        //e.log(prefix+"- frame="+l.frame+ " topOffset: "+topOffset + " absoluteRect="+layer.absoluteRect() )
  
        ///
        this._resizeLayers(l.childs,topOffset,prefix)

        this.overrides=[]
    }

    _processLayerLinks(l,prefix){
        
        const layer = l.nlayer
        const hotspots = []

        let finalHotspot = {
            r: Utils.copyRectangle(l.frame),
            l: l,
            linkType: 'undefined'
        }

        if(l.isSymbolInstance){
            this._processLayeryOverrides(l,prefix + " ")
        }

        while(true){               
            // check custom link from parent overrides
            if(l.customLink!=undefined){
                if( !this._specifyCustomizedHotspot(prefix+" ",l,finalHotspot)  ) return        
                break
            }

            // check link to external URL
            const externalLink = this.e.Settings.layerSettingForKey(l.slayer,SettingKeys.LAYER_EXTERNAL_LINK);
            this.e.log(prefix+" externalLink: " + externalLink + " key="+l.slayer)  
            if (externalLink != null && externalLink != "") {
                if( !this._specifyExternalURLHotspot(prefix+" ",l,finalHotspot,externalLink)) return
                break
            }

            // check native link
            if(layer.flow()!=null){
                if( !this._specifyHotspot(prefix+" ",l,finalHotspot)) return
                break
            }
            return
        }
        hotspots.push(finalHotspot);          

        // finalization
        l.hotspots = hotspots
        if(hotspots.length>0){
            Array.prototype.push.apply(this.currentArtboard.hotspots, hotspots);
        }
    }

    _specifyExternalURLHotspot(prefix,l,finalHotspot,externalLink){   
        const layer = l.nlayer  
        
        this.e.log(prefix+"hotspot: href")
        // found external link
        const openLinkInNewWindow = this.e.Settings.layerSettingForKey(l.slayer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN);
        const regExp = new RegExp("^http(s?)://");
        if (!regExp.test(externalLink.toLowerCase())) {
          externalLink = "http://" + externalLink;
        }
        const target = openLinkInNewWindow && 1==2 ? "_blank" : null;

        finalHotspot.linkType = "href"
        finalHotspot.href = externalLink
        finalHotspot.target = target

        return true
    }

    _specifyCustomizedHotspot(prefix,l,finalHotspot){     
        this.e.log(prefix+"CUSTOM hotspot: " + l.customLink.linkType)  
        finalHotspot.linkType = l.customLink.linkType                
        
        if(l.customLink.linkType=="back"){                    
            // linkType copied already, nothing more to do for Back link
        }else if(l.customLink.linkType=="artboard"){
            const targetArtboadName = l.customLink.artboardName
            finalHotspot.artboardName = targetArtboadName
            finalHotspot.href = Utils.toFilename(targetArtboadName) + ".html";
        }else{
            this.e.log(prefix+"CUSTOM hotspot: " + l.customLink.linkType)  
            return false            
        }
        return true
    }

    _specifyHotspot(prefix,l,finalHotspot){        
        const layer = l.nlayer
        const flow = this.e.Sketch.fromNative(layer.flow());
        const target = flow.target;
    
        if(flow.isBackAction()){
            // hande Back action
            finalHotspot.linkType = "back";
            this.e.log(prefix+"hotspot: back")                             
        }else if(target!=null){
            // hande direct link
            let targetArtboadName = target.name;
            
            finalHotspot.linkType = "artboard";
            finalHotspot.artboardName = targetArtboadName;
            finalHotspot.href = Utils.toFilename(targetArtboadName) + ".html";

            this.e.log(prefix+"hotspot: direct")
        }else{                    
            this.e.log(prefix+"hotspot: none  l.isSymbolInstance="+l.isSymbolInstance)
            return false
        }
        return true
    }


    // Process all Symbol Instance overrides to find overrided links
    _processLayeryOverrides(l,prefix){
        const slayer = this.e.Sketch.fromNative(l.nlayer)
        if( !slayer.overrides ) return

        // check if target was customized
        slayer.overrides.forEach(function (customProperty){       
            if( !(customProperty.property==='flowDestination' && !customProperty.isDefault && customProperty.value!='') ) return;        

            let sourceID =  customProperty.path
            this.e.log(prefix+"found custom property / sourceID="+sourceID +  " customProperty.value="+customProperty.value)

            let srcLayer = undefined            
            if(sourceID.indexOf("/")>0){
                // found nested symbols
                const splitedPath = sourceID.split("/")
                 // find override owner
                srcLayer = this._findChildInPath(prefix+" ",l,splitedPath,0)                
            }else{       
                srcLayer = this._findChildByID(l,sourceID)
            }
                       
            this.e.log(prefix+"found srcLayer: "+srcLayer)

            if(srcLayer==undefined){
                this.e.log(prefix+"ERROR! can't find child by ID="+sourceID)
                return
            }
            
            // srcLayer link was already overrided by parents
            if(srcLayer.customLink!=undefined){
                return
            }
            
            // setup ciu
            if(customProperty.value=='back'){
                // handle Back link
                srcLayer.customLink = {
                    linkType: "back"
                }
                this.e.log(prefix+"srcLayer.customLink.linkType="+srcLayer.customLink.linkType)
                return
            }else{       
                // handle link to artboard
                const targetArtboard = this.e.myLayersDict[customProperty.value]
                if(targetArtboard==undefined){
                    return
                }
                srcLayer.customLink = {
                    linkType: "artboard",
                    artboardName: targetArtboard.name
                }                
                this.e.log(prefix+"srcLayer.customLink.linkType="+srcLayer.customLink.linkType)
                return
            }

        },this);       

    }


    // find overrided layer by customPropery path
    _findChildInPath(prefix,l,path,index){        
        let foundLayer = undefined        
        const seekId  = path[index]
        const lastIndex = path.length-1        

        for(var layer of l.childs){
            this.e.log(prefix+"scan layer.id="+layer.objectID+"  seekID="+seekId)            
            if(layer.objectID==seekId){
                this.e.log(prefix+"found!")            
                if(index==lastIndex){
                    foundLayer = layer
                    this.e.log(prefix+"found last")
                    return foundLayer
                }
                foundLayer = this._findChildInPath(prefix+" ",layer,path,index+1)
                return foundLayer
            }
        }
        return undefined
    }

    // find child layer by ID
    _findChildByID(l,id){
        let foundLayer = undefined
        for(var layer of l.childs){
            if(layer.objectID==id){
                foundLayer = layer
                return foundLayer
            }
            if(layer.childs.length>0){
                foundLayer = this._findChildByID(layer,id)
                if(foundLayer!=undefined) return foundLayer
            }            
        }

        return undefined
    }

}
