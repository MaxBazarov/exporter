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
        if(viewer.currentPageModal){
            $(".modalSymbolLink").remove()
            delete this.createdPages[viewer.currentPage]
        }
        const contentDiv = viewer.currentPageModal?  $('#content-modal'): $('#content')
        contentDiv.removeClass("contentSymbolsVisible")        

        this.visible = false

        // hide sidebar
        viewer.sidebarVisible=false
        $('#sidebar').addClass("hidden")
        viewer.zoomContent()
    }

    show(){
        
        viewer.toggleLinks(false)
        viewer.toogleLayout(false)
        
        this._showPage(viewer.currentPage)
        if(this.page.currentOverlayPage){
            this._showPage(this.page.currentOverlayPage.index)
        }

        const contentDiv = viewer.currentPageModal?  $('#content-modal'): $('#content')
        contentDiv.addClass("contentSymbolsVisible")
 
        // show sidebar
        viewer.sidebarVisible=true
        $('#sidebar').removeClass("hidden")
        viewer.zoomContent()

        this.visible = true
    }

    _showPage(pageIndex){
        this.pageIndex = pageIndex
        this.page = story.pages[pageIndex];        
        if(!(pageIndex in this.createdPages)){
            const newPageInfo = {
                layerArray:[]
            }
            // cache only standalone pages
            // if(!viewer.currentPageModal){                  
             this.createdPages[pageIndex] = newPageInfo
            
            this.pageInfo = newPageInfo
            this._create()           
        }else{
            this.pageInfo = this.createdPages[pageIndex]
        }
    }



    _create(){        
        this._processLayerList(layersData[this.pageIndex].childs)        
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
            class:      viewer.currentPageModal?"modalSymbolLink":"symbolLink",
            pi:         this.pageIndex,
            li:         layerIndex,
        })        

        a.click(function () {
            const pageIndex =  $( this ).attr("pi")
            const layerIndex =  $( this ).attr("li")
            const layer = viewer.symbolViewer.createdPages[pageIndex].layerArray[layerIndex]
            
            var symName = layer.symbolMasterName
            var styleName = layer.styleName
            var comment = layer.comment
            var frameX = layer.frame.x
            var frameY = layer.frame.y
            var frameWidth = layer.frame.width
            var frameHeight = layer.frame.height

            var info = ""
            if(symName!=undefined) info = "Symbol: "+symName
            if(styleName!=undefined) info = "Style: "+styleName
            
            if(comment!=undefined) info += "\n\nComment: "+comment

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