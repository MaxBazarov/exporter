
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
            panelDiv.appendTo(imageDiv);

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

        enablePageHotSpots(this)
        if(!visible) imageDiv.addClass("hidden")   
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
}

function enablePageHotSpots(page){
    // init main area hotspots
    _pagerInitImgMap(page,$("#map_image_"+page.index),sizesFrom = page)
    // init or hide fixed are hotsposts
    for(var panel of page.fixedPanels){
        var img = $("#map_img_fixed_"+page.index + "_"+panel.index)     
        _pagerInitImgMap(page,img,sizesFrom = panel)        
    }
}

function _pagerInitImgMap(page,img,sizesFrom){    
    img.attr('usemap',"#map"+page.index).attr('width', sizesFrom.width).attr('height', sizesFrom.height)

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



function pagerHideImg(img){
    if(img.parent().attr("id")=="content")
        img.addClass('hidden');
    else
        img.parent().addClass('hidden');
}

function pagerShowImg(img){
    if(img.parent().attr("id")=="content")
        img.removeClass('hidden');
    else
        img.parent().removeClass('hidden');
}

/////////////////////  HANDLE EVENTS IN VIEWER

/*
function pageSwitchFixedPanels(page,show){
    for(var panel of page.fixedPanels){        
        _pagerSwitchFixedPanel(page,panel,show);
    }
}

function _pagerSwitchFixedPanel (page,panel,show){			
    var panelDiv = $("#fixed_"+page.index + "_" + panel.index);
    var panelBackDiv = $("#fixed_" + page.index + panel.index+"_back");   

    if(show){       
        //loadPageImages(page)
    
        //panelDiv.height(panel.height);
        //panelDiv.width(panel.width);				
    
        //panelDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")     
        
        panelDiv.removeClass('hidden');		

        //panelBackDiv.removeClass('hidden');	
        //panelBackDiv.height(panel.height);
        //panelBackDiv.width(panel.width);	
    }else{
        //panelBackDiv.addClass('hidden');
        panelDiv.addClass('hidden');
        //panelDiv.css("box-shadow","none")  
        //panelDiv.css("top",'0px')
        //panelBackDiv.css("top",'0px')
    }		
}
*/