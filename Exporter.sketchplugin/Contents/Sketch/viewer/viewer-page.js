
///

class ViewerPage {


    hide(preloadhide=false){     
        this.imageDiv.addClass("hidden")
    }
    

    show(){
        // prepare overlay div
        var isOverlay = this.type==="overlay";			
        if(isOverlay){
            var contentOverlay = $('#content-overlay');		
            //contentOverlay.width(this.width);
        }

        if(!this.imageObj){        
            // load image     
            this.loadImages()						
        }            

       this.imageDiv.removeClass("hidden")
    }

    loadImages(force=false){
        /// check if already loaded images for this page
        if(!force && this.imageObj!=undefined){     
            return pagerMarkImageAsLoaded()
        }

        const enableLinks = true
        var isOverlay = this.type==="overlay";
        
        var content = $('#content')        
        var imageDiv = $('<div>',{
            class:"image_div", 
            id:"div_"+this.index,
            //style:"width: "+this.width+"px;"
            style:"height: "+this.height+"px; width: "+this.width+"px;"
        });
        this.imageDiv = imageDiv
    

        // create fixed panel images        
        for(var panel of this.fixedPanels){
            let style="height: "+panel.height+"px; width: "+panel.width+"px; " 
            if(panel.constrains.top || panel.isSplit){
                style+="top:"+panel.y+"px;"
            }else if(panel.constrains.bottom){
                style+="bottom:"+(this.height - panel.y- panel.height)+"px;"
            }
            if(panel.constrains.left  || panel.isSplit){
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
            }else if(panel.isSplit){
                cssClass = 'splitPanel'
            }else if(panel.type="top"){
                cssClass = 'fixedPanel fixedPanelTop'
            }else if(panel.type="left"){
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
            panel.imageObj = this._loadSingleImage(panel.isFloat || panel.isSplit?panel:this,'img_'+panel.index+"_")     
            panel.imageObj.appendTo(panelDiv);
        }
        
        // create main content image      
        {
            var isOverlay = this.type==="overlay";
            var contentOverlay = $('#content-overlay');		            
            imageDiv.appendTo(isOverlay?contentOverlay:content);	
            
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

    /*------------------------------- INTERNAL METHODS -----------------------------*/
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
            var title, href, target;
            if(link.page != null) {			
                // title = story.pages[link.page].title;
                href = 'javascript:viewer.goTo(' + link.page + ')';
                target = null;
            } else if(link.action != null && link.action == 'back') {
                //title = "Go Back";
                href = 'javascript:viewer.goBack()';
                target = null;
            } else if(link.url != null){
                //title = link.url;
                href = link.url;
                target = link.target!=null?link.target:null;						
            }

            var a = $("<a>",{
                href:href,
                target: target
            })
            a.appendTo(linksDiv)

            var style="left: "+ link.rect.x+"px; top:"+link.rect.y+"px; width: "+ link.rect.width+"px; height:"+link.rect.height+"px; "
            var linkDiv = $("<div>",{
                class:"linkDiv"+(story.disableHotspots?"":" linkDivHighlight"),
            }).attr('style', style)
            linkDiv.appendTo(a)

            link.div = linkDiv
            
        } 
    }
}
