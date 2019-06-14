class SymbolViewer{
    constructor (){
        this.visible = false
        this.createdPages = {}
    }

    initialize(){
        
    }


    toggle(){
        return this.visible ? this.hide(): this.show()        
    }

    hide(){
        const contentDiv = $('#content')
        contentDiv.removeClass("contentSymbolsVisible")

        this.visible = false
    }

    show(){
        this.page = story.pages[viewer.currentPage];        

        viewer.toggleLinks(false)
        viewer.toogleLayout(false)

        if(!(viewer.currentPage in this.createdPages)){
            this.createdPages[viewer.currentPage] = {
                layerArray:[]
            }            
            this.pageInfo = this.createdPages[viewer.currentPage]
            this._create()
           
        } 


        const contentDiv = $('#content')
        contentDiv.addClass("contentSymbolsVisible")
 
        this.visible = true
}

    _create(){        
        this._processLayerList(layersData[viewer.currentPage].childs)        
    }

    _processLayerList(layers,isParentSymbol=false){
        for(var l of layers){
            if(l.symbolMasterName!=undefined || (!isParentSymbol && l.styleName!=undefined)){
                this._showElement(l)
            }
            this._processLayerList(l.childs,l.symbolMasterName!=undefined)
        }
    }

    _showElement(l){

        var currentPanel = this.page
    
        for(const panel of this.page.fixedPanels){
            if( l.frame.x >= panel.x && l.frame.y >= panel.y &&
                ((l.frame.x + l.frame.width) <= (panel.x + panel.width )) && ((l.frame.y + l.frame.height) <= (panel.y + panel.height ))
            ){
                currentPanel = panel
                break
            }
        }

        const layerIndex = this.pageInfo.layerArray.length
        this.pageInfo.layerArray.push(l)

        var a = $("<a>",{
            l_index:    layerIndex,
        })        

        a.click(function () {
            const layerIndex =  $( this ).attr("l_index")
            const layer = viewer.symbolViewer.pageInfo.layerArray[layerIndex]
            
            var symName = layer.symbolMasterName
            var styleName = layer.styleName
            var frameX = layer.frame.x
            var frameY = layer.frame.y
            var frameWidth = layer.frame.width
            var frameHeight = layer.frame.height

            var info = ""
            if(symName!=undefined) info = "Symbol: "+symName
            if(styleName!=undefined) info = "Style: "+styleName
            info += "\n\n X,Y: " + frameX + "," + frameY + " Width,Height: "  + frameWidth + "," + frameHeight

            if(layer.text!=undefined && layer.text!=''){
                info+="\n\nText: "+layer.text
            }

            if(symName!=undefined && symName in symbolsData){
                const symInfo = symbolsData[symName]
                info+="\n\nSymbol layers and @tokens:"
                for(const layerName of Object.keys(symInfo.layers)){
                    info+="\n    "+layerName
                    for(const tokenName of Object.keys(symInfo.layers[layerName].tokens)){
                        info+="\n        "+tokenName
                    }
                }                
            }
            if(styleName!=undefined && styleName in  symbolsData.styles){
                const styleInfo = symbolsData.styles[styleName]
                info+="\n\nStyle @tokens:"     
                for(const tokenName of Object.keys(styleInfo.tokens)){
                    info+="\n     "+tokenName
                }                                
            }
            
            alert(info)
        })

        a.appendTo(currentPanel.linksDiv)

        var style="left: "+ l.frame.x+"px; top:"+l.frame.y+"px; width: " + l.frame.width + "px; height:"+l.frame.height+"px; "
        var symbolDiv = $("<div>",{
            class:"symbolDiv",
        }).attr('style', style)
                    
        symbolDiv.appendTo(a) 

    }
}