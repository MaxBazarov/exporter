class SymbolViewer{
    new (){
        this.visible = false
        this.created = false
    }

    show(){
        if(this.visible) return
        viewer.toggleLinks(false)
        viewer.toogleLayout(false)

        if(!this.created) this._create()

        const contentDiv = $('#content')
        contentDiv.addClass("contentSymbolsVisible")
    }

    _create(){
        this.page = story.pages[viewer.currentPage];

        this._processLayerList(layersData)
    }

    _processLayerList(layers){
        for(var l of layers){
            if(l.symbolMasterName!=undefined){
                this._showSymbol(l)
            }
            this._processLayerList(l.childs)
        }
    }

    _showSymbol(l){
        var pageDiv = this.page.imageDiv

        var a = $("<a>",{
            sym_name: l.symbolMasterName            
        })

        a.click(function () {
            var symName = $( this ).attr("sym_name")
            alert(symName)
        })

        a.appendTo(this.page.linksDiv)

        var style="left: "+ l.frame.x+"px; top:"+l.frame.y+"px; width: " + l.frame.width + "px; height:"+l.frame.height+"px; "
        var symbolDiv = $("<div>",{
            class:"symbolDiv",
        }).attr('style', style)
                    
        symbolDiv.appendTo(a) 

    }
}