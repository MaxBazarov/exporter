class SymbolViewer{
    constructor (){
        this.visible = false
        this.createdPages = {}
        this.inited = false
        this.currentLib = ""
    }

    initialize(force=false){
        if(!force && this.inited) return
                
        // populate library select
        const libSelect =  $('#symbol_viewer #lib_selector')
        libSelect.append($('<option>', {
            value: "",
            text: 'Library autoselection'
        }));
        for(const libName of Object.keys(symbolsData)){
            libSelect.append($('<option>', {
                value: libName,
                text: libName
            }));
        }  
        libSelect.change(function(){
            var libName = ('#symbol_viewer #lib_selector:selected').val            
            viewer.symbolViewer._selectLib(libName)

        })

        this.inited = true
    }

    _selectLib(libName){
        this.currentLib = libName
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
        $('#symbol_viewer').addClass("hidden")        
        viewer.zoomContent()
    }

    show(){
        if(!this.inited) this.initialize()
        
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
        
        $("#symbol_viewer_content").html("")
        $('#symbol_viewer #empty').removeClass("hidden")
        
        $('#symbol_viewer').removeClass("hidden")        
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
            if(l.smName!=undefined || (!isParentSymbol && l.styleName!=undefined)){
                this._showElement(l)
            }
            this._processLayerList(l.childs,l.smName!=undefined)
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
            
            var symName = layer.smName
            var styleName = layer.styleName
            var comment = layer.comment
            var frameX = layer.frame.x
            var frameY = layer.frame.y
            var frameWidth = layer.frame.width
            var frameHeight = layer.frame.height

            var info = ""
            if(symName!=undefined) info = "<p class='head'>Symbol</p>"+symName
            if(styleName!=undefined) info = "<p class='head'>Style</p> "+styleName
            
            if(comment!=undefined) info += "<p class='head'>Comment</p> "+comment

            info += "<p class='head'>Position (left x top)</p>" + frameX + " x " + frameY
            info += "<p class='head'>Size (width x height)</p>" + frameWidth + " x " + frameHeight

            if(layer.text!=undefined && layer.text!=''){
                info+="<p class='head'>Text</p> "+layer.text
            }

         
            if(symName!=undefined){
                const symInfo = viewer.symbolViewer._findSymbolByName( symName )                
                if(symInfo!=undefined){
                    info+="<p class='head'>Symbol layers and Tokens</p>"
                    var layerCounter = 0
                    for(const layerName of Object.keys(symInfo.layers)){
                        if(layerCounter)
                            info+="<br/>"    
                        info+=layerName + "<br/>"
                        for(const tokenName of Object.keys(symInfo.layers[layerName].tokens)){
                            info+=tokenName+"<br/>"
                        }
                        layerCounter++
                    }
                }                
            }
            if(styleName!=undefined){
                const styleInfo = viewer.symbolViewer._findStyleByName( styleName )                
                if(styleInfo!=undefined){
                    info+="<p class='head'>Style Tokens</p>"     
                    for(const tokenName of Object.keys(styleInfo.tokens)){
                        info+=tokenName+"<br/>"
                    }
                }
            }
            
            $('#symbol_viewer #empty').addClass("hidden")
            $("#symbol_viewer_content").html(info)
            //alert(info)
        })

        a.appendTo(currentPanel.linksDiv)

        var style="left: "+ l.frame.x+"px; top:"+l.frame.y+"px; width: " + l.frame.width + "px; height:"+l.frame.height+"px; "
        var symbolDiv = $("<div>",{
            class:"symbolDiv",
        }).attr('style', style)
                    
        symbolDiv.appendTo(a) 

    }

    _findSymbolByName(symName){
        for(const lib of Object.values(symbolsData)){
            if(!(symName in lib)) continue
            return lib[symName]
        }        
        return undefined
    }

    _findStyleByName(styleName){
        for(const lib of Object.values(symbolsData)){
            if(!(styleName in lib.styles)) continue
            return lib.styles[styleName]
        }
        return undefined
    }
}
