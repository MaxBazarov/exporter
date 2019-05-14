
///

class ViewerPage {


    hide(preloadhide=false){             
        this.imageDiv.addClass("hidden")
        
        if(this.currentOverlayPage!=undefined){
            this.currentOverlayPage.hide()
            this.currentOverlayPage = undefined
        }
    }
    

    show(){
        // prepare modal div
        var isModal = this.type==="modal";			
        if(isModal){
            var contentModal = $('#content-modal');		
            //contentModal.width(this.width);
        }

        if(!this.imageObj){        
            // load image     
            this.loadImages()						
        }            

        this.imageDiv.removeClass("hidden")
    }

    showOverlayByLinkIndex(linkIndex){
        linkIndex = parseInt(linkIndex,10)

        var link = this._getLinkByIndex(linkIndex)
        if(!link){
            console.log('Error: can not find link to overlay by index="'+linkIndex+'"')
            return false
        }

        link.a.click()    
    }

    showAsOverlayIn(newParentPage,linkIndex,posX,posY,linkParentFixed,linkPageType){

        if( !this.imageDiv ){
            this.loadImages()
        }

        // check if we need to hide any other already visible overlay
        if( ("currentOverlayPage" in newParentPage) 
        && newParentPage.currentOverlayPage!=undefined 
            && newParentPage.currentOverlayPage!=this)
        {
            newParentPage.currentOverlayPage.hide()

            if('overlay'==linkPageType){
                posX = newParentPage.currentOverlayPage.currentX
                posY = newParentPage.currentOverlayPage.currentY
            }

            newParentPage.currentOverlayPage = undefined

        }

        // Show overlay on the new position
        const div = this.imageDiv

        if(div.parent().attr('id')!=newParentPage.imageDiv.attr('id') || div.hasClass('hidden')){

            if(linkParentFixed && this.overlayAlsoFixed){
                div.removeClass('divPanel')
                div.addClass('fixedPanelFloat')
            }else{                
                div.removeClass('fixedPanelFloat')
                div.addClass('divPanel')
            }

            this.currentX = posX
            this.currentY = posY
            
            newParentPage.imageDiv.append(div)
            div.css('top',posY+"px")        
            div.css('margin-left',posX+"px")
            
            this.show()
            newParentPage.currentOverlayPage = this

            var extURL = '/o/'+linkIndex
            viewer.refresh_url(newParentPage.index,extURL)
        }else{
            if(this == newParentPage.currentOverlayPage){
                newParentPage.currentOverlayPage = undefined
            }
            this.hide()
            viewer.refresh_url(newParentPage.index)
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


        this._addLayoutLines(imageDiv)
        
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

        var img = $('<img/>', {
            id : idPrefix+this.index,
            class: "pageImage",
            src : encodeURIComponent(viewer.files) + '/' + encodeURIComponent(imageURI),		
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
                href:link.url,
                pageIndex: this.index,
                pageType: this.type,
                linkIndex: link.index,
                link_url: link.url,    
                link_page: link.page ,    
                link_action: link.action ,    
                linkPosX:  link.rect.x + (link.isParentFixed?panel.x:0),
                linkWidth: link.rect.width,
                linkHeight: link.rect.height,
                linkPosY:  link.rect.y+link.rect.height + (link.isParentFixed?panel.y:0),
                linkParentFixed: link.isParentFixed?'1':'0',
                target: link.target
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
                var link_url = $( this ).attr("link_url")
                var link_page_src =  $( this ).attr("link_page")
                var link_page = parseInt( $( this ).attr("link_page") )
                var link_action = $( this ).attr("link_action")
                var linkParentFixed = $( this ).attr("linkParentFixed")=='1'
                var linkPageType = $(this).attr("pageType")
        

                // close overlay on clock
                if('overlay'==linkPageType && link_page!=null){
                    var page =  story.pages[ $(this).attr("pageIndex") ]
                    page.hide()
                    // don't do anything if link follows to overlay itseld
                    if(link_page == page.index) return false
                }

                if(link_page_src != null) {			
                    // title = story.pages[link.page].title;
                    var currentPage = story.pages[viewer.currentPage]
                    var newPageIndex = viewer.getPageIndex(link_page)
                    var newPage = story.pages[newPageIndex];

                    if('overlay'==newPage.type){

                        var linkPosX = parseInt($( this ).attr("linkPosX"))
                        var linkPosY = parseInt($( this ).attr("linkPosY"))
                        var linkIndex = $( this ).attr("linkIndex")
                        var linkWidth = parseInt($( this ).attr("linkWidth"))
                        var linkHeight = parseInt($( this ).attr("linkHeight"))
                        var offsetX = newPage.overlayAlign <= 2 ? 5 : 0

                        if(0==newPage.overlayAlign){ // align on hotspot left                                                                            
                        }else if(1==newPage.overlayAlign){ // align on hotspot center                                                
                            linkPosX = linkPosX + parseInt(linkWidth/2) - parseInt(newPage.width/2)
                        }else if(2==newPage.overlayAlign){// align on hotpost right
                            linkPosX = linkPosX + linkWidth  - newPage.width
                        }else if(3==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_LEFT
                            linkPosX = 0
                            linkPosY = 0
                        }else if(4==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_CENTER
                            linkPosX = parseInt(currentPage.width / 2) - parseInt(newPage.width / 2)
                            linkPosY = 0
                        }else if(5==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT
                            linkPosX = currentPage.width - newPage.width
                            linkPosY = 0
                        }else if(6==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_CENTER
                            linkPosX = parseInt(currentPage.width / 2) - parseInt(newPage.width / 2)
                            linkPosY = parseInt(currentPage.height / 2) - parseInt(newPage.height / 2)
                        }else if(7==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_BOTTOM_LEFT
                            linkPosX = 0
                            linkPosY = currentPage.height - newPage.height
                        }else if(8==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_BOTTOM_CENTER
                            linkPosX = parseInt(currentPage.width / 2) - parseInt(newPage.width / 2)
                            linkPosY = currentPage.height - newPage.height
                        }else if(9==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_TOP_RIGHT
                            linkPosX = currentPage.width - newPage.width
                            linkPosY = currentPage.height - newPage.height
                        }else if(10==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_LEFT
                            linkPosY = linkPosY - newPage.height - linkHeight
                        }else if(11==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_CENTER
                            linkPosY = linkPosY - newPage.height - linkHeight
                            linkPosX = linkPosX + parseInt(linkWidth/2) - parseInt(newPage.width/2)
                        }else if(12==newPage.overlayAlign){// ARTBOARD_OVERLAY_ALIGN_HOTSPOT_TOP_RIGHT
                            linkPosY = linkPosY - newPage.height - linkHeight
                            linkPosX = linkPosX + linkWidth  - newPage.width
                        }

                        // check page right side
                        const fullWidth = newPage.width + offsetX + (('overlayShadowX' in newPage)?newPage.overlayShadowX:0)
                        if( (linkPosX+fullWidth)>currentPage.width )
                            linkPosX = currentPage.width - fullWidth

                        if(linkPosX < (offsetX + (('overlayShadowX' in newPage)?newPage.overlayShadowX:0))){
                            linkPosX = offsetX + (('overlayShadowX' in newPage)?newPage.overlayShadowX:0)
                        }

                        if(linkPosY<0) linkPosY = 0
                                
                        newPage.showAsOverlayIn(currentPage,linkIndex,linkPosX,linkPosY,linkParentFixed,linkPageType)
                    }else{
                        viewer.goTo(parseInt(link_page))
                    }
                } else if(link_action != null && link_action== 'back') {
                    //title = "Go Back";
                    viewer.goBack()
                } else if(link_url != null){
                    //title = link.url;
                    var target = $( this ).attr("target")
                    window.open(link_url,target!=undefined?target:"_self")
                    //document.location = link_url
                    //target = link.target!=null?link.target:null;		
                }
                return false
            }
            if(1==eventType){
                a.mouseenter(func)
                a.mouseleave(func)
                a.click(function(){return false})
            }else{
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
