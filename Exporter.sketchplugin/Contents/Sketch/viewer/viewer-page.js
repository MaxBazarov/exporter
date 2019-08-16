
///

function inViewport($el) {
    var elH = $el.outerHeight(),
        H   = $(window).height(),
        r   = $el[0].getBoundingClientRect(), t=r.top, b=r.bottom;
    return Math.max(0, t>0? Math.min(elH, H-t) : Math.min(b, H));
}

class ViewerPage {

    constructor(){
        this.currentOverlays = {}
        this.parentPage = undefined
    
        this.image = undefined
        this.imageDiv = undefined
        this.imageObj = undefined

        this.currentLeft = undefined
        this.currentTop = undefined

        this.currentX = undefined
        this.currentY = undefined

        this.overlayByEvent = undefined
    }
    
	getHash(){
        var image = this.image;
        return image.substring(0, image.length - 4); // strip .png suffix
    }

    hide(preloadhide=false){             
        this.imageDiv.addClass("hidden")
        
        if(undefined != this.parentPage){ // current page is overlay            
            const parent = this.parentPage
            viewer.refresh_url(parent)    
            delete parent.currentOverlays[this.index]
            this.parentPage = undefined
        }else{
            this.hideCurrentOverlays()
        }
    }

    hideCurrentOverlays(){
        for(let [index,overlay] of Object.entries(this.currentOverlays)){
            overlay.hide()
        }   
    }
    

    show(){
        if(!this.imageObj) this.loadImages(true)						
        
        this.updatePosition()
        
        this.imageDiv.removeClass("hidden")
    }

    updatePosition(){
        var regPage = viewer.lastRegularPage
        this.currentLeft =  viewer.currentMarginLeft
        this.currentTop = viewer.currentMarginTop
    
        if( this.isModal ){
            this.currentLeft += Math.round(regPage.width / 2) -  Math.round(this.width / 2)
            this.currentTop +=  Math.round(inViewport(regPage.imageDiv) /2 ) -  Math.round(this.height / 2 * viewer.currentZoom)
            if(this.currentTop<0) this.currentTop = 0
            if(this.currentLeft<0) this.currentLeft = 0
            
            var contentModal = $('#content-modal');
            contentModal.css("margin-left",this.currentLeft+"px")
            contentModal.css("margin-top",this.currentTop+"px")
        }else{

        }
    }

    showOverlayByLinkIndex(linkIndex){
        linkIndex = parseInt(linkIndex,10)

        var link = this._getLinkByIndex(linkIndex)
        if(!link){
            console.log('Error: can not find link to overlay by index="'+linkIndex+'"')
            return false
        }

        if(!(link["action"]==="back")) link.a.click()    
    }

    onMouseMove(x,y){

        // handle mouse hover if this page is overlay
        while(1==this.overlayByEvent){
            var localX =  Math.round( x / viewer.currentZoom) -  this.currentLeft
            var localY =  Math.round( y / viewer.currentZoom) -  this.currentTop
            //alert(" localX:"+localX+" localY:"+localY+" linkX:"+this.currentLink.x+" linkY:"+this.currentLink.y);
            

            if( // check if we inside in overlay
                    localX >= this.currentLink.posX            
                &&  localY >= this.currentLink.posY       
                &&  localX < (this.currentLink.posX + this.width)
                &&  localY < (this.currentLink.posY + this.height)
            ){
                break
            }
            
            if( // check if we out of current hotspot
                    localX < this.currentLink.x            
                ||  localY < this.currentLink.y       
                ||  localX >= (this.currentLink.x + this.currentLink.width)
                ||  localY >= (this.currentLink.y + this.currentLink.height)
            ){
                this.hide()
                return 
            }
            break
        }

        // allow childs to handle mouse move
        for(let [index,overlay] of Object.entries(this.currentOverlays)){
            overlay.onMouseMove(x,y)
        }        
    }

    showAsOverlayIn(newParentPage,link,posX,posY,linkParentFixed){

        if( !this.imageDiv ){
            this.loadImages(true)
        }

        // check if we need to hide any other already visible overlay
        var positionCloned = false
        const currentOverlays = newParentPage.currentOverlays
        
        if( !currentOverlays[this.index] )
        {
            if('overlay'!==link.orgPage.type){
                for(let [index,overlay] of Object.entries(currentOverlays)){
                    overlay.hide()
                }
            }
            /*if('overlay'==linkPageType){
                posX = currentOverlay.currentX
                posY = currentOverlay.currentY
                positionCloned = true
            }else{
                newParentPage.currentOverlayPage.hide()                     
            }
            */
            //newParentPage.currentOverlayPage = undefined
        }

        // Show overlay on the new position
        const div = this.imageDiv

        // 
        if(true || div.parent().attr('id')!=newParentPage.imageDiv.attr('id') || div.hasClass('hidden') ){

            if(linkParentFixed && this.overlayAlsoFixed){
                div.removeClass('divPanel')
                div.addClass('fixedPanelFloat')
            }else if(newParentPage.isModal){
                //div.removeClass('divPanel')
                //div.removeClass('fixedPanelFloat')        
            }else{                
                div.removeClass('fixedPanelFloat')
                div.addClass('divPanel')
            }

            if(!positionCloned && undefined!=this.overlayShadowX && 10==this.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT
                posX -= this.overlayShadowX
            }

            this.currentX = posX
            this.currentY = posY
            
            newParentPage.imageDiv.append(div)
            div.css('top',posY+"px")        
            div.css('margin-left',posX+"px")
            
            this.show()
            newParentPage.currentOverlays[this.index] = this // add this as new overlay to parent overlays
            this.parentPage = newParentPage
            
            this.currentLink = link

            var extURL = '/o/'+link.index
            viewer.refresh_url(newParentPage,extURL)            


        }else if(1==this.overlayByEvent && posX==this.currentX && posY==this.currentY){//handle only mouse hover
            // cursor returned back from overlay to hotspot -> nothing to do
        }else{           
            this.hide()
            viewer.refresh_url(newParentPage)
        }       
    }

    loadImages(force=false){
        /// check if already loaded images for this page
        if(!force && this.imageObj!=undefined){     
            return pagerMarkImageAsLoaded()
        }

        const enableLinks = true
        var isModal = this.type==="modal";
        
        var content = $('#content')        
        var cssStyle = "height: "+this.height+"px; width: "+this.width+"px;"
        if(this.overlayShadow!=undefined)
            cssStyle+="box-shadow:"+this.overlayShadow+";"
        if('overlay'==this.type && this.overlayOverFixed)
            cssStyle+="z-index: 50;"            
        var imageDiv = $('<div>',{
            class:('overlay'==this.type)?"divPanel":"image_div", 
            id:"div_"+this.index,
            style:cssStyle
        });
        this.imageDiv = imageDiv
    

        // create fixed panel images        
        for(var panel of this.fixedPanels){
            let style="height: "+panel.height+"px; width: "+panel.width+"px; " 
            if(panel.constrains.top || panel.isFixedDiv || (!panel.constrains.top && !panel.constrains.bottom)){
                style+="top:"+panel.y+"px;"
            }else if(panel.constrains.bottom){
                style+="bottom:"+(this.height - panel.y- panel.height)+"px;"
            }
            if(panel.constrains.left  || panel.isFixedDiv || (!panel.constrains.left  && !panel.constrains.right)){
                style+="margin-left:"+panel.x+"px;"
            }else if(panel.constrains.right){
                style+="margin-left:"+panel.x+"px;"
            }
            //

            if(panel.shadow!=undefined)
                style+="box-shadow:"+panel.shadow+";"
            
                // create Div for fixed panel
            var cssClass = ""
            if(panel.isFloat){
                cssClass = 'fixedPanelFloat'
            }else if(panel.isFixedDiv){
                cssClass = 'divPanel'
            }else if("top" ==panel.type){
                cssClass = 'fixedPanel fixedPanelTop'
            }else if("left" == panel.type){
                cssClass = 'fixedPanel'
            }

            var divID = panel.divID!=''?panel.divID:("fixed_"+this.index+"_"+panel.index)

            var panelDiv = $("<div>",{
                id:divID,
                class:cssClass,
                style:style
            });
            //panelDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")     
            panelDiv.appendTo(imageDiv);
            panel.imageDiv = panelDiv

            // create link div
            panel.linksDiv = $("<div>",{                
                class:"linksDiv",
                style:"height: "+panel.height+"px; width: "+panel.width+"px;"
            })
            panel.linksDiv.appendTo(panel.imageDiv)            
            this._createLinks(panel)

            // add image itself
            panel.imageObj = this._loadSingleImage(panel.isFloat || panel.isFixedDiv?panel:this,'img_'+panel.index+"_")     
            panel.imageObj.appendTo(panelDiv);            
            if(!this.isDefault) panel.imageObj.css("webkit-transform","translate3d(0,0,0)")
        }
        
        // create main content image      
        {
            var isModal = this.type==="modal";
            var contentModal = $('#content-modal');		            
            imageDiv.appendTo(isModal?contentModal:content);	
            
            // create link div
            if(enableLinks){
                var linksDiv = $("<div>",{
                    id:"div_links_"+this.index,
                    class:"linksDiv", 
                    style:"height: "+this.height+"px; width: "+this.width+"px;"                   
                })
                linksDiv.appendTo(imageDiv)
                this.linksDiv = linksDiv

                this._createLinks(this)
            }
        }
        var img = this._loadSingleImage(this,'img_')		 
        this.imageObj = img
        img.appendTo(imageDiv) 
    }   

    showLayout(){
        if(undefined==this.layoutCreated){
            this.layoutCreated = true
            this._addLayoutLines(this.imageDiv) 
        }
    }

    _addLayoutLines(imageDiv){
        if( this.type!="regular" ||  undefined==this.layout) return
 
        var x = this.layout.offset
        var colWidth = this.layout.columnWidth
        var colWidthInt = Math.round(this.layout.columnWidth)
        var gutterWidth = this.layout.gutterWidth
        for(var i = 0;i<this.layout.numberOfColumns;i++){
            var style="left: "+ Math.trunc(x)+"px; top:"+0+"px; width: " + colWidthInt + "px; height:"+this.height+"px; "
            var colDiv = $("<div>",{
                class:"layoutColDiv layouLineDiv",
            }).attr('style', style)
            colDiv.appendTo(this.linksDiv) 
            x += colWidth + gutterWidth
        }

        for(var y = 0;y<this.height;y+=5){
            var style="left: "+ 0 +"px; top:"+y+"px; width: "+ this.width +"px; height:"+ 1 +"px; "
            var colDiv = $("<div>",{
                class:"layoutRowDiv layouLineDiv",
            }).attr('style', style)
            colDiv.appendTo(this.linksDiv) 
        }
    }


    /*------------------------------- INTERNAL METHODS -----------------------------*/
    _getLinkByIndex(index){
        var link = this._getLinkByIndexInLinks(index,this.links)
        if(link!=null) return link
        for(var panel of this.fixedPanels){
            link = this._getLinkByIndexInLinks(index,panel.links)
            if(link!=null) return link
        }
        return null
    }

    _getLinkByIndexInLinks(index,links){
        var found = links.find(function(el){
            return el.index==index
        })
        return found!=undefined?found:null
    }


    _loadSingleImage(sizeSrc,idPrefix){
        var hasRetinaImages = story.hasRetina
        var imageURI = hasRetinaImages && viewer.isHighDensityDisplay() ? sizeSrc.image2x : sizeSrc.image;	
        var unCachePostfix = "V_V_V"==story.docVersion?"":("?"+story.docVersion)

        var img = $('<img/>', {
            id : idPrefix+this.index,
            class: "pageImage",
            src : encodeURIComponent(viewer.files) + '/' + encodeURIComponent(imageURI)+unCachePostfix,		
        }).attr('width', sizeSrc.width).attr('height', sizeSrc.height);

        img.preload(function(perc, done) {
        console.log(perc, done);
        });
        return img;
    } 
 
    // panel: ref to panel or this
    _createLinks(panel){
        var linksDiv = panel.linksDiv
        
        for(var link of panel.links) {
            var a = $("<a>",{                
                lpi: this.index,
                li: link.index,
                lpx:  link.rect.x + (link.isParentFixed?panel.x:0),
                lpy:  link.rect.y+link.rect.height + (link.isParentFixed?panel.y:0),
            })

            var eventType = 0 // click

            if('page' in link){
                var newPageIndex = viewer.getPageIndex(parseInt(link.page))
                var newPage = story.pages[newPageIndex];
                if('overlay'==newPage.type){
                    eventType = newPage.overlayByEvent
                }
            }

            var func = function(event){

                if(viewer.linksDisabled) return false

                const currentPage = viewer.currentPage
                const orgPage = story.pages[ $(this).attr("lpi") ]

                const linkIndex = $( this ).attr("li") 
                const link = orgPage._getLinkByIndex(linkIndex)

                var link_page = link.page
                var linkParentFixed = link.isParentFixed           
                       

                if(link.page != null) {			
                    // title = story.pages[link.page].title;                   
                    var newPage = story.pages[parseInt(link.page)]
                    if(!newPage) return

                    if('overlay'==newPage.type){
                        var orgLink = {
                            orgPage : orgPage,
                            index:    linkIndex ,
                            this:  $( this ),
                            x:  link.rect.x,
                            y:  link.rect.y,
                            posX : parseInt($( this ).attr("lpx")),
                            posY : parseInt($( this ).attr("lpy")),
                            width: link.rect.width,
                            height: link.rect.height
                        }
                        var linkPosX = orgLink.posX
                        var linkPosY = orgLink.posY
                        var offsetX = newPage.overlayAlign <= 2 ? 5 : 0

                        // clicked from some other overlay
                        if('overlay'==orgPage.type){
                            linkPosX += orgPage.currentLink.posX
                            linkPosY += orgPage.currentLink.posY
                        }

                        if(0==newPage.overlayAlign){ // align on hotspot left                                                                            
                        }else if(1==newPage.overlayAlign){ // align on hotspot center                                                
                            linkPosX = linkPosX + parseInt(orgLink.width/2) - parseInt(newPage.width/2)
                        }else if(2==newPage.overlayAlign){// align on hotpost right
                            linkPosX = linkPosX + orgLink.width  - newPage.width
                        }else if(3==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_LEFT
                            linkPosX = 0
                            linkPosY = 0
                        }else if(4==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_CENTER
                            linkPosX = parseInt(orgPage.width / 2) - parseInt(newPage.width / 2)
                            linkPosY = 0
                        }else if(5==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT
                            linkPosX = orgPage.width - newPage.width
                            linkPosY = 0
                        }else if(6==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_CENTER
                            linkPosX = parseInt(orgPage.width / 2) - parseInt(newPage.width / 2)
                            linkPosY = parseInt(orgPage.height / 2) - parseInt(newPage.height / 2)
                        }else if(7==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_BOTTOM_LEFT
                            linkPosX = 0
                            linkPosY = orgPage.height - newPage.height
                        }else if(8==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_BOTTOM_CENTER
                            linkPosX = parseInt(orgPage.width / 2) - parseInt(newPage.width / 2)
                            linkPosY = orgPage.height - newPage.height
                        }else if(9==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT
                            linkPosX = orgPage.width - newPage.width
                            linkPosY = orgPage.height - newPage.height
                        }else if(10==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT                        
                            linkPosY -= orgLink.height
                        }else if(11==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_CENTER
                            linkPosY = linkPosY - newPage.height - orgLink.height
                            linkPosX = linkPosX + parseInt(orgLink.width/2) - parseInt(newPage.width/2)
                        }else if(12==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT
                            linkPosY = linkPosY - newPage.height - orgLink.height
                            linkPosX = linkPosX + orgLink.width  - newPage.width
                        }

                        // check page right side
                        if(10!=newPage.overlayAlign){// NOTARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT
                            const fullWidth = newPage.width + offsetX // + (('overlayShadowX' in newPage)?newPage.overlayShadowX:0)
                            if( (linkPosX+fullWidth)>orgPage.width )
                                linkPosX = orgPage.width - fullWidth

                            /*if(linkPosX < (offsetX + (('overlayShadowX' in newPage)?newPage.overlayShadowX:0))){  
                                linkPosX = offsetX + (('overlayShadowX' in newPage)?newPage.overlayShadowX:0)
                            }*/
                        }

                        if(linkPosX<0) linkPosX = 0
                        if(linkPosY<0) linkPosY = 0
                                
                        newPage.showAsOverlayIn(orgPage,orgLink,linkPosX,linkPosY,linkParentFixed)
                        return false
                    }else{
                        viewer.goTo(parseInt(link_page))
                        return false
                    }
                } else if(link.action != null && link.action== 'back') {
                    //title = "Go Back";
                    viewer.goBack()
                    return false
                } else if(link.url != null){
                    //title = link.url;
                    //page.hide()
                    var target = link.target
                    window.open(link.url,target!=undefined?target:"_self")                    
                    return false
                    //document.location = link_url
                    //target = link.target!=null?link.target:null;		
                }

                // close last current overlay if it still has parent
                if('overlay'==orgPage.type && undefined!=orgPage.parentPage){
                    orgPage.hide()
                }

                return false
            }
            
            if(1==eventType){ // for Mouse over event
                a.mouseenter(func)
                if(10==newPage.overlayAlign){ // for overlay on hotspot top left position
                    
                }else{
                    // need to pass click event to overlayed layers
                    a.click(function(e){
                        if(undefined==e.originalEvent) return
                        var nextObjects = document.elementsFromPoint(e.originalEvent.x,e.originalEvent.y);
                        for(var i = 0; i < nextObjects.length; i++) {
                            var obj = nextObjects[i].parentElement
                            if(obj.nodeName!='A' || obj==this) continue
                            $(obj).trigger('click', e);
                            return
                        }
                    })
                }
            }else{ // for On click event
                a.click(func)
            }
            
            a.appendTo(linksDiv)

            link.a = a

            var style="left: "+ link.rect.x+"px; top:"+link.rect.y+"px; width: "+ link.rect.width+"px; height:"+link.rect.height+"px; "
            var linkDiv = $("<div>",{
                class:"linkDiv"+(story.disableHotspots?"":" linkDivHighlight"),
            }).attr('style', style)
            linkDiv.appendTo(a)

            link.div = linkDiv
            
        } 
    }
}
