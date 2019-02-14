
///

class ViewerPage {


    hide(preloadhide=false){     
        this.imageDiv.addClass("hidden")
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

    showAsOverlayIn(newParentPage,linkIndex,posX,posY){

        if( !this.imageDiv ){
            this.loadImages()
        }

        // Show overlay on the new position
        const div = this.imageDiv

        if(div.parent().attr('id')!=newParentPage.imageDiv.attr('id') || div.hasClass('hidden')){        
            newParentPage.imageDiv.append(div)
            div.css('top',posY+"px")        
            div.css('margin-left',posX+"px")
            this.show()

            var extURL = '/o/'+linkIndex
            viewer.refresh_url(newParentPage.index,extURL)
        }else{
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
        //if(!this.isDefault) imageDiv.css("webkit-transform","translate3d(0,0,0)")
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
                href:"#",
                pageIndex: this.index,
                pageType: this.type,
                linkIndex: link.index,
                link_url: link.url,    
                link_page: link.page ,    
                link_action: link.action ,    
                linkPosX:  link.rect.x,
                linkPosY:  link.rect.y+link.rect.height,
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
                var link_page = $( this ).attr("link_page")
                var link_action = $( this ).attr("link_action")

                if('overlay'==$(this).attr("pageType")){
                    var page =  story.pages[ $(this).attr("pageIndex") ]
                    page.hide()
                }

                if(link_page != null) {			
                    // title = story.pages[link.page].title;
                    var currentPage = story.pages[viewer.currentPage]
                    var newPageIndex = viewer.getPageIndex(parseInt(link_page))
                    var newPage = story.pages[newPageIndex];

                    if('overlay'==newPage.type){
                        var linkPosX = parseInt($( this ).attr("linkPosX"))
                        var linkPosY = parseInt($( this ).attr("linkPosY"))
                        var linkIndex = $( this ).attr("linkIndex")

                        const fullWidth = newPage.width+5 + (('overlayShadowX' in newPage)?newPage.overlayShadowX:0)
                        if( (linkPosX+fullWidth)>currentPage.width )
                            linkPosX = currentPage.width - fullWidth

                        newPage.showAsOverlayIn(currentPage,linkIndex,linkPosX,linkPosY)
                    }else{
                        viewer.goTo(parseInt(link_page))
                    }
                } else if(link_action != null && link_action== 'back') {
                    //title = "Go Back";
                    viewer.goBack()
                } else if(link_url != null){
                    //title = link.url;
                    document.location = link_url
                    //target = link.target!=null?link.target:null;		
                }
                return false
            }
            if(1==eventType){
                a.mouseenter(func)
                a.mouseleave(func)
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
