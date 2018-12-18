
///

class ViewerPage {


    hide(preloadhide=false){
        /*
        const fixedZs = {
            'float':0,            
            'top':0,
            'left':0
        }
                
        for(var panel of this.fixedPanels){       
            panel.imageObj.addClass("hidden")
            //if(panel.isFloat) panel.imageObj.addClass("hidden")
            panel.imageDiv.css("box-shadow","none")  
            panel.imageDiv.css("z-index",fixedZs[panel.type])
            //this._hidePanelMap(panel)
        }*/
        
        //this.imageObj.css("z-index",1)
        //this.imageDiv.css("opacity",0)
        this.imageObj.addClass("hidden")    
        if(!preloadhide) this._hideLinks(this)
        
        //this.linksDiv.addClass("hidden")

        //this.imageDiv.hide()

        //this.imageDiv.addClass('hidden');
        //document.getElementById("div_"+this.index).classList.add('hidden');
        //this.imageDiv.css("opacity",0)
        //this.imageDiv.css("z-index",1)
    }
    

    show(){
        // prepare overlay div
        var isOverlay = this.type==="overlay";			
        if(isOverlay){
            var contentOverlay = $('#content-overlay');		
            contentOverlay.width(this.width);
        }

        if(!this.imageObj){        
            // load image     
            this.loadImages()						
        }            

        /*
        const fixedZs = {
            'float':13,            
            'top':14,
            'left':12
        }
                
        for(var panel of this.fixedPanels){
            panel.imageObj.removeClass("hidden")
            //if(panel.isFloat) panel.imageObj.removeClass("hidden")
            panel.imageDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")                
            panel.imageDiv.css("z-index",fixedZs[panel.type])
        }
        */
       //this.imageObj.css("z-index",2) 
       //this.imageDiv.css("opacity",100)
       this.imageObj.removeClass("hidden")
       this._showLinks(this)
       //this.linksDiv.removeClass("hidden")
       //this.imageDiv.css("opacity",100)

       //this.imageDiv.css("opacity",100)
        //this.imageDiv.removeClass('hidden');
        //this.imageDiv.css("z-index",2)
        //document.getElementById("div_"+this.index).classList.remove('hidden');
    }

    loadImages(force=false){
        /// check if already loaded images for this page
        if(!force && this.imageObj!=undefined){     
            return pagerMarkImageAsLoaded()
        }

        const enableLinks = true
        
        var content = $('#content')        
        var imageDiv = $('<div>',{
            class:"image_div", 
            id:"div_"+this.index,
            style:"width: "+this.width+"px;"
            //style:"height: "+this.height+"px; width: "+this.width+"px;"
        });
        this.imageDiv = imageDiv
    

        // create fixed panel images        
        for(var panel of this.fixedPanels){
            let style="height: "+panel.height+"px; width: "+panel.width+"px; " 
            if(panel.constrains.top){
                style+="top:"+panel.y+"px;"
            }else if(panel.constrains.bottom){
                style+="bottom:"+(this.height - panel.y- panel.height)+"px;"
            }
            if(panel.constrains.left){
                style+="margin-left:"+panel.x+"px;"
            }else if(panel.constrains.right){
                style+="margin-left:"+panel.x+"px;"
            }
            if(panel.shadow!=undefined)
                style+="box-shadow:"+panel.shadow+";"
            // create Div for fixed panel
            var panelDiv = $("<div>",{
                id:"fixed_"+this.index+"_"+panel.index,
                class:" "+(panel.isFloat?'fixedPanelFloat ':'fixedPanel ')+("top"==panel.type?'fixedPanelTop ':''),
                style:style
            });
            //panelDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")     
            panelDiv.appendTo(imageDiv);
            panel.imageDiv = panelDiv

            // create link div
            panel.linksDiv = $("<div>",{                
                class:"linksDiv",
            }) //.attr('width', panel.width).attr('height', panel.height)
            panel.linksDiv.appendTo(panel.imageDiv)            
            this._createLinks(panel)

            // add image itself
            panel.imageObj = this._loadSingleImage(panel.isFloat?panel:this,'img_'+panel.index+"_")     
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
                    style:"width: "+this.width+"px;"
                    //style:"height: 0px; width: "+this.width+"px;"
                })  //.attr('width', this.width).attr('height', this.height)
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
                class:"linkDiv",
            }).attr('style', style)
            linkDiv.appendTo(a)

            link.div = linkDiv
            
        } 
    }

    // panel: ref to panel or this
    _hideLinks(panel){
        panel.linksDiv.css("height","0px")
    }

    // panel: ref to panel or this
    _showLinks(panel){
        panel.linksDiv.css("height",panel.height+"px")
    }
}
