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
            this._create()
            this.createdPages[viewer.currentPage] = true
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

        var a = $("<a>",{
            l_x: l.frame.x,
            l_y: l.frame.y,
            l_width: l.frame.width,
            l_height: l.frame.height,
            sym_name: l.symbolMasterName!=undefined?l.symbolMasterName:"",
            style_name: (l.styleName!=undefined)?l.styleName:""
        })        

        a.click(function () {
            var symName = $( this ).attr("sym_name")
            var styleName = $( this ).attr("style_name")
            var frameX = $( this ).attr("l_x")
            var frameY = $( this ).attr("l_y")
            var frameWidth = $( this ).attr("l_width")
            var frameHeight = $( this ).attr("l_height")

            var info = ""
            if(symName!="") info = "Symbol: "+symName
            if(styleName!="") info = "Style: "+styleName
            info += "\n\n X,Y: " + frameX + "," + frameY + " Width,Height: "  + frameWidth + "," + frameHeight

            if(symName!="" && symName in symbolsData){
                const symInfo = symbolsData[symName]
                info+="\n\nSymbol layers and @tokens:"
                for(const layerName of Object.keys(symInfo.layers)){
                    info+="\n    "+layerName
                    for(const tokenName of Object.keys(symInfo.layers[layerName].tokens)){
                        info+="\n        "+tokenName
                    }
                }                
            }
            if(styleName!="" && styleName in  symbolsData.styles){
                const styleInfo = symbolsData.styles[styleName]
                info+="\n\Style @tokens:"     
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