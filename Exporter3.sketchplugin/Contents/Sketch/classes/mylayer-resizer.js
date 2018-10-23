@import("constants.js")
@import("lib/utils.js")


var ResizingConstraint = {
    NONE: 0,
    RIGHT: 1 << 0,
    WIDTH: 1 << 1,
    LEFT: 1 << 2,
    BOTTOM: 1 << 3,
    HEIGHT: 1 << 4,
    TOP: 1 << 5
}

var ResizingType = {
    STRETCH: 0,
    PIN_TO_CORNER: 1,
    RESIZE_OBJECT: 2,
    FLOAT_IN_PLACE: 3
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



    _resizeLayers(layers,topOffset=undefined,prefix="",lostOverrides=[]){
        layers.forEach(function (layer) {
            if(layer.parent == undefined){
                // process top layer (artboard)            
                this.currentArtboard = layer
            }
            this._resizeLayer(layer,topOffset,prefix+" ",lostOverrides)
        }, this);
    }

    _resizeLayer(l,topOffset,prefix,lostOverrides){        
        const layer = l.nlayer
        const master = l.symbolMaster
        const parent = l.parent
        const e = this.e

        this.e.log( prefix+l.name+" id="+l.nlayer.objectID())
        
        l.frame = Utils.copyRectToRectangle(layer.absoluteRect())        
        l.orgFrame = Utils.copyRectToRectangle(layer.frame())        

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
            l.orgFrame.width = master.absoluteRect().width()
            l.orgFrame.height = master.absoluteRect().height()
           
            this.e.log(prefix+" _resizeLayer() orgFrame:"+l.orgFrame +"frame"+l.frame+" name:"+l.name)      
        }          

        const srcFrame = l.frame.copy()
        
        // --------------- CONSTRAINT --------------
        if (layer.resizingConstraint != undefined) {   
           this._applyLayerConstrains(prefix,l)
        }     

        if(l.isSymbolInstance ){      
            // reset topOfset for all symbol content
            topOffset = new Rectangle(master.absoluteRect().x() - l.frame.x, master.absoluteRect().y() - l.frame.y,0,0)
           
            this.e.log(prefix+" _resizeLayer1() orgFrame:"+l.orgFrame +"frame"+l.frame+" name:"+l.name + " master.absoluteRect="+master.absoluteRect())      
        }else if(l.isGroup ){      
            // reset topOfset for all symbol content
            topOffset = new Rectangle(layer.absoluteRect().x() - l.frame.x, layer.absoluteRect().y() - l.frame.y,0,0)
           
            this.e.log(prefix+" _resizeLayer2() orgFrame:"+l.orgFrame +"frame"+l.frame+" name:"+l.name + " absoluteRect="+layer.absoluteRect())      
        } 

        this._processLayerLinks(l,prefix+" ",lostOverrides)
        if(l.tempOverrides!=undefined){
            lostOverrides = Object.assign({}, lostOverrides, l.tempOverrides);
            this.e.log(prefix+" _resizeLayer, newOverrides="+Object.keys(lostOverrides).length) 
        }

        this.e.log(prefix+"- frame="+l.frame+ " topOffset: "+topOffset + " absoluteRect="+layer.absoluteRect() )
  
        ///
        this._resizeLayers(l.childs,topOffset,prefix,lostOverrides)

    }

    _processLayerLinks(l,prefix,lostOverrides){
        
        const layer = l.nlayer
        const hotspots = []

        let finalHotspot = {
            r: l.frame.copy(),
            l: l,
            linkType: 'undefined'
        }

        this._processLayerOverrides(l,prefix + " ",lostOverrides)
        
        while(true){               
            // check custom link from parent overrides
            if(l.customLink!=undefined){
                if( !this._specifyCustomizedHotspot(prefix+" ",l,finalHotspot)  ) return        
                break
            }

            // check link to external URL
            const externalLink = this.e.externalLinks[ l.objectID ]
            this.e.log(prefix+" externalLink: " + externalLink + " key="+l.slayer)  
            if (externalLink != null && externalLink.href != "") {
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
        const regExp = new RegExp("^http(s?)://");
        var href= externalLink.href
        if (!regExp.test(href.toLowerCase())) {
            href = "http://" + href;
        }
        const target = externalLink.openNewWindow ? "_blank" : null;

        finalHotspot.linkType = "href"
        finalHotspot.href = href
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
    _processLayerOverrides(l,prefix,lostOverrides){
        const slayer = l.slayer
        
        let newLostOverrides = undefined
        let overrides = []

        if( lostOverrides!=undefined && l.objectID in lostOverrides) Array.prototype.push.apply(overrides,lostOverrides[l.objectID])    
        if( l.isSymbolInstance && slayer.overrides) Array.prototype.push.apply(overrides,slayer.overrides)
        
        if(overrides.length==0) return newLostOverrides        
        

        // check if target was customized
        overrides.forEach(function (customProperty){       
            if( !(customProperty.property==='flowDestination' && !customProperty.isDefault && customProperty.value!='') ) return;        

            let sourceID =  customProperty.path
            this.e.log(prefix+"found custom property / sourceID="+sourceID +  " customProperty.value="+customProperty.value)

            let srcLayer = undefined            
            if(sourceID.indexOf("/")>0){
                // found nested symbols
                const splitedPath = sourceID.split("/")
                // find override owner
                this.e.log(prefix+"override owner path="+sourceID)            
                srcLayer = this._findChildInPath(prefix+" ",l,splitedPath,0)                
                if(srcLayer==undefined && !(l.objectID in lostOverrides) )
                {          
                    this.e.log(prefix+"pushed to newLostOverrides")         

                    if(newLostOverrides==undefined) 
                        newLostOverrides = []
                    const firstID = splitedPath[0]
                    if(!(firstID in newLostOverrides)) 
                        newLostOverrides[firstID] = []
                    newLostOverrides[firstID].push(customProperty)

                    this.e.log(prefix+" pushed newOverrides="+(newLostOverrides?newLostOverrides[firstID].length:" undefined"))
                }
            }else{       
                srcLayer = this._findChildByID(l,sourceID)
            }
                       
            if(srcLayer) this.e.log(prefix+"found srcLayer: "+srcLayer.name)

            if(srcLayer==undefined){
                this.e.log(prefix+"ERROR! can't find child by ID="+sourceID)
                return
            }
            
            // srcLayer link was already overrided by parents
            if(srcLayer.customLink!=undefined){
                return
            }
            
            // setup customLink
            if(customProperty.value=='back'){
                // handle Back link
                srcLayer.customLink = {
                    linkType: "back"
                }
                this.e.log(prefix+"srcLayer.customLink.linkType="+srcLayer.customLink.linkType)
                return
            }else{       
                // handle link to artboard
                const targetArtboard = this.e.artboadDict[customProperty.value]
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
        
        this.e.log(prefix+" _processLayerOverrides, newLostOverrides="+newLostOverrides) 
        l.tempOverrides = newLostOverrides
    }


    // find overrided layer by customPropery path
    _findChildInPath(prefix,l,path,index){        
        let foundLayer = undefined        
        let seekId  = path[index]
        const lastIndex = path.length-1        

        // if start from current layer itself?
        if(seekId==l.objectID){
            seekId  = path[++index]
        }

        for(var layer of l.childs){
            this.e.log(prefix+"scan layer.id="+layer.objectID+"  seekID="+seekId)            
            if(layer.objectID==seekId || layer.originalID==seekId){
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

        // failed to found. time to use deep nested search
        for(var layer of l.childs){
            foundLayer = this._findChildInPath(prefix+" ",layer,path,index)
            if(foundLayer) return foundLayer
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

    _applyLayerConstrains(prefix,l){
        const layer = l.nlayer
        if (layer.resizingConstraint == undefined || l.parent == undefined) return
        
        const parent = l.parent
        let parentAbsoluteFrame = parent.frame
        let parentOrgFrame = parent.orgFrame
        const orgFrame = l.orgFrame

        /*
        if(parent.isSymbolInstance){
            parentOrgFrame =  new Rectangle(parentAbsoluteFrame.x,parentAbsoluteFrame.y,parent.symbolMaster.frame().width(),parent.symbolMaster.frame().height())
        }else{
            parentOrgFrame = parentAbsoluteFrame
        }*/
        
        // CHECK DO WE NEED TO CALCULATE CONSTRAINS
        if (parentAbsoluteFrame.width==parentOrgFrame.width && parentAbsoluteFrame.height==parentOrgFrame.height) return
        let newFrame = l.frame.copy()
    
        this.e.log(prefix+" getAbsoluteRect() 0 parent name:"+parent.name+" parentOrgFrame= "+parentOrgFrame+" parentAbsoluteFrame="+parentAbsoluteFrame )
        this.e.log(prefix+" getAbsoluteRect() 0 frame:"+l.frame + " orgFrame:"+l.orgFrame )


        const resizingConstraint = 63 ^ layer.resizingConstraint();
        const frame = l.frame
        
        if ((resizingConstraint & ResizingConstraint.LEFT) === ResizingConstraint.LEFT) {
            if ((resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT) {
                this.e.log(prefix+" getAbsoluteRect() 2 "+newFrame.y);
                const rightDistance = parentOrgFrame.width - orgFrame.x - orgFrame.width
                const width = parentAbsoluteFrame.width - orgFrame.x - rightDistance
                newFrame.width = width < 1 ? 1 : width;
            } else if ((resizingConstraint & ResizingConstraint.WIDTH) !== ResizingConstraint.WIDTH) {
                this.e.log(prefix+" getAbsoluteRect() 3");
                newFrame.width = (frame.width / (parentOrgFrame.width - orgFrame.x)) * (parentAbsoluteFrame.width - orgFrame.x);
            }
        } else if ((resizingConstraint & ResizingConstraint.RIGHT) === ResizingConstraint.RIGHT) {
            if ((resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH) {
                this.e.log(prefix+" getAbsoluteRect() 4");
                newFrame.x = (parentAbsoluteFrame.width - (parentOrgFrame.width - (frame.x + frame.width)) - frame.width);
            } else {
                const rightDistance = parentOrgFrame.width - orgFrame.x - orgFrame.width;
                newFrame.width = (frame.width / (parentOrgFrame.width - rightDistance)) * (parentAbsoluteFrame.width - rightDistance);
                newFrame.x = parentAbsoluteFrame.width - (parentOrgFrame.width - (frame.x + frame.width)) - newFrame.width
                this.e.log(prefix+" getAbsoluteRect() 5 rightDistance="+rightDistance);
            }
        } else {
            if ((resizingConstraint & ResizingConstraint.WIDTH) === ResizingConstraint.WIDTH) {
                newFrame.x = parentAbsoluteFrame.x + ((((orgFrame.x + frame.width / 2.0) / parentOrgFrame.width) * parentAbsoluteFrame.width) - (orgFrame.width / 2.0));
                this.e.log(prefix+" getAbsoluteRect() 6");
            } else {
                const inc = parentOrgFrame.width / parentAbsoluteFrame.width
                newFrame.x = frame.x + (orgFrame.x / inc) - orgFrame.x
                newFrame.width = frame.width / inc
                this.e.log(prefix+" getAbsoluteRect() 7 inc="+inc);
            }
        }

        if ((resizingConstraint & ResizingConstraint.TOP) === ResizingConstraint.TOP) { 
            if ((resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM) {
                const bottomDistance = parentOrgFrame.height - orgFrame.y - orgFrame.height;
                const height = parentAbsoluteFrame.height - orgFrame.y - bottomDistance;
                newFrame.height = height < 1 ? 1 : height;
                this.e.log(prefix+" getAbsoluteRect() 8 ret.y="+newFrame.y+  "parent.y="+parentAbsoluteFrame.y+" frame.y="+frame.y);
            } else if ((resizingConstraint & ResizingConstraint.HEIGHT) !== ResizingConstraint.HEIGHT) {
                newFrame.height = (frame.height / (parentOrgFrame.height - orgFrame.y)) * (parentAbsoluteFrame.height - orgFrame.y);
                this.e.log(prefix+" getAbsoluteRect() 9");
            }
        } else if ((resizingConstraint & ResizingConstraint.BOTTOM) === ResizingConstraint.BOTTOM) {
            if ((resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT) {
                newFrame.y = (parentAbsoluteFrame.height - (parentOrgFrame.height - (frame.y + frame.height)) - frame.height);
                this.e.log(prefix+" getAbsoluteRect() 10");
            } else {
                const bottomDistance = parentOrgFrame.height - orgFrame.y - orgFrame.height
                newFrame.height = (frame.height / (parentOrgFrame.height - bottomDistance)) * (parentAbsoluteFrame.height - bottomDistance)
                newFrame.y =  parentAbsoluteFrame.height - (parentOrgFrame.height - (frame.y + frame.height)) - newFrame.height
                this.e.log(prefix+" getAbsoluteRect() 11 bottomDistance="+bottomDistance);
            }
        } else {
            if ((resizingConstraint & ResizingConstraint.HEIGHT) === ResizingConstraint.HEIGHT) {
                newFrame.y = ((((frame.y + frame.height / 2.0) / parentOrgFrame.height) * parentAbsoluteFrame.height) - (frame.height / 2.0));
                this.e.log(prefix+" getAbsoluteRect() 12");
            } else {
                const inc = parentOrgFrame.height / parentAbsoluteFrame.height
                newFrame.y = frame.y + (orgFrame.y / inc) - orgFrame.y
                newFrame.height = frame.height / inc
                this.e.log(prefix+" getAbsoluteRect() 13 inc="+inc);
            }
        }
        newFrame.round()

        this.e.log(prefix+" getAbsoluteRect() 99 old "+l.frame + " const="+resizingConstraint)
        l.frame = newFrame        
        this.e.log(prefix+" getAbsoluteRect() 99 new "+newFrame)
            
    }
    

}
