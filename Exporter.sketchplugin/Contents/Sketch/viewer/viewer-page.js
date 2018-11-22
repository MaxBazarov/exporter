
///

class ViewerPage {

//function loadPageImages(page,force=false,visible=false){
    loadImages(force=false,visible=false){
        /// check if already loaded images for this page
        if(!force && this.imageObj!=undefined){     
            return pagerMarkImageAsLoaded()
        }
        
        var content = $('#content'); 
        var imageDiv = $('<div>',{
            class:"image_div",
            id:"div_"+this.index,
            style:"height: "+this.height+"px; width: "+this.width+"px;"    
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
            // create Div for fixed panel
            var panelDiv = $("<div>",{
                id:"fixed_"+this.index+"_"+panel.index,
                class:" "+(panel.isFloat?'fixedPanelFloat ':'fixedPanel ')+("top"==panel.type?'fixedPanelTop ':''),
                style:style
            });
            panelDiv.appendTo(content);
            panel.imageDiv = panelDiv

            panel.imageObj = this._loadSingleImage(panel.isFloat?panel:this,'img_'+panel.index+"_")     
            //panel.imageObj.addClass("hidden")   
            panel.imageObj.appendTo(panelDiv);
            
            // create Map for fixed panel
            var fixedMapImg = $("<img>",{
                id:"map_img_fixed_"+this.index+"_"+panel.index,
                src:"resources/1.png"
            });
            fixedMapImg.appendTo(panelDiv);
        }
        
        // create main content image      
        {
            var isOverlay = this.type==="overlay";
            var contentOverlay = $('#content-overlay');		
            
            imageDiv.appendTo(isOverlay?contentOverlay:content);	
            
            // create map div
            var mapDiv = $("<div>",{
                class:"map",
            }).attr('width', this.width).attr('height', this.height)
            mapDiv.appendTo(imageDiv)
    
            // create image
            var mapImage = $("<img>",{
                id: "map_image_"+this.index,
                src: "resources/1.png",            
            }).attr('width', this.width).attr('height', this.height)
            mapImage.appendTo(mapDiv)
        }
        var img = this._loadSingleImage(this,'img_')		 
        this.imageObj = img
        img.appendTo(imageDiv)

        this.enableHotSpots()

        if(!visible){
            imageDiv.addClass("hidden")   
            for(var panel of this.fixedPanels){
                panel.imageObj.addClass("hidden")
            }
        }
    }   

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

    enableHotSpots(){
        // init main area hotspots
        this._initImgMap($("#map_image_"+this.index), this)
        // init or hide fixed are hotsposts
        for(var panel of this.fixedPanels){
            var img = $("#map_img_fixed_"+this.index + "_"+panel.index)     
            this._initImgMap(img,panel)        
        }
    }

    _initImgMap(img,sizesFrom){    
        img.attr('usemap',"#map"+this.index).attr('width', sizesFrom.width).attr('height', sizesFrom.height)
    
        // 0=non-transparent  1.0=fully transparent
        let transp = 0
        if(viewer.highlightLinks) transp = 0.4
        else if(!story.disableHotspots) transp = 0.2
    
        img.maphilight({
            alwaysOn: viewer.highlightLinks,
            stroke: false,
            fillColor: 'FFC400',
            fillOpacity: transp
        });	    
    }
    
    hide(){
        for(var panel of this.fixedPanels){
            panel.imageObj.addClass("hidden")
        }
        this.imageDiv.addClass('hidden');
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
            this.loadImages(false,true)						
        }else{
            // just show already loaded, but hidden image main div
            this.imageDiv.removeClass('hidden');
            for(var panel of this.fixedPanels){
                panel.imageObj.removeClass("hidden")
            }
        }

    }
}
