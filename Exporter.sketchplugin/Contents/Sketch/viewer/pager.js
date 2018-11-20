var pagerLoadingTotal=0

// PRELOAD IMAGES
$.fn.preload = function (callback) {
    var length = this.length;
    var iterator = 0;
  
    return this.each(function () {
      var self = this;
      var tmp = new Image();
  
      if (callback) tmp.onload = function () {
        callback.call(self, 100 * ++iterator / length, iterator === length);
        pagerMarkImageAsLoaded()
      };  
      tmp.src = this.src;
    });
  };

function pagerMarkImageAsLoaded(){
    console.log(pagerLoadingTotal);
    if(--pagerLoadingTotal==0){
        $("#loading").addClass("hidden")
    }
}

async function preloadAllPageImages(){
    $("#loading").removeClass("hidden")
    pagerLoadingTotal = story.totalImages
	var pages = story.pages;
	for(var page of story.pages){
		loadPageImages(page)
    }
    
}
///

function reloadAllPageImages(){
	for(var page of story.pages){        
        page.imageObj.parent().remove();        
        page.imageObj = undefined
        for(var type of Object.keys(page.fixedPanels)){
            var p = page.fixedPanels[type]            
            p.imageObj.parent().remove(); 
            p.imageObj = undefined	
        }
    }	
    preloadAllPageImages()
}

function loadPageImages(page,force=false,visible=false){
	/// check if already loaded images for this page
	if(!force && page.imageObj!=undefined){     
        return pagerMarkImageAsLoaded()
    }
    
    var content = $('#content');

    var imageDiv = $('<div>',{class:"image_div",style:"height: "+page.height+"px; width: "+page.width+"px;"});
    page.imageDiv = imageDiv    
   
    {
        var isOverlay = page.type==="overlay";
        var contentOverlay = $('#content-overlay');		
        
        imageDiv.appendTo(isOverlay?contentOverlay:content);	
        
        // create map div
        var mapDiv = $("<div>",{
            class:"map",
        }).attr('width', page.width).attr('height', page.height)
        mapDiv.appendTo(imageDiv)

        // create image
        var mapImage = $("<img>",{
            id: "map_image_"+page.index,
            src: "resources/1.png",            
        }).attr('width', page.width).attr('height', page.height)
        mapImage.appendTo(mapDiv)
    }
    var img = loadPageOneImage(page,page.index,'img_')		 
    page.imageObj = img
    img.appendTo(imageDiv)    
    if(!visible) imageDiv.addClass("hidden")    

	for(var panelType of Object.keys(page.fixedPanels)){
        var panel = page.fixedPanels[panelType]
        // create Div for fixed paneli
        var panelDiv = $("div",{
            id:"fixed_"+page.index+"_"+panel.index,
            class:"hidden fixedPanel",
            style:"height: "+panel.height+"px; width: "+panel.width+"px; align-top:"+panel.y+"px; align-left:"+panel.x+"px;",            
        });
        panelDiv.appendTo(content);

        panel.imageObj = loadPageOneImage(panel.isFloat?page:panel,page.index,'img_'+panel.index+"_")     
        panel.imageObj.addClass("hidden")   
        panel.imageObj.appendTo(panelDiv);
	}
}   

function loadPageOneImage(page,pageIndex,idPrefix){
	var hasRetinaImages = story.hasRetina
	var imageURI = hasRetinaImages && viewer.isHighDensityDisplay() ? page.image2x : page.image;	

	var img = $('<img/>', {
        id : idPrefix+pageIndex,
		src : encodeURIComponent(viewer.files) + '/' + encodeURIComponent(imageURI),		
	}).attr('width', page.width).attr('height', page.height);

    img.preload(function(perc, done) {
     console.log(perc, done);
    });
	return img;
} 

function enablePageHotSpots(page){
    // init main area hotspots
    _pagerInitImgMap(page,$("#map_image_"+page.index),sizesFrom = page)
    // init or hide fixed are hotsposts
    for(var panelType of viewer.fixedPanelTypes){
        var panel =  page.fixedPanels[panelType];
        var img = $("#map_img_fixed_"+panelType)
        if(panel==undefined){					
            // the page has no such fixed panel of this type
            img.attr('usemap',"")
        }else{
            // the page has it
            _pagerInitImgMap(page,img,sizesFrom = panel)        
        }
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

function pageSwitchFixedPanels(page,show){		
    for(var panelType of viewer.fixedPanelTypes){
        var panel =  page.fixedPanels[panelType];
        if(panel==undefined){					            
            $("#fixed_"+panelType).addClass('hidden');
            $("#fixed_"+panelType+"_back").addClass('hidden');
        }else{
            _pagerSwitchFixedPanel(page,panel,show);
        }
    }
}

function _pagerSwitchFixedPanel (page,panel,show){			
    var panelDiv = $("#fixed_"+panel.type);
    var panelBackDiv = $("#fixed_"+panel.type+"_back");   

    if(show){       
        loadPageImages(page)
    
        panelDiv.height(panel.height);
        panelDiv.width(panel.width);				

        if(panel.type=="left"){
            if(panel.transparent){
                panelDiv.css("top",'0px')
                panelBackDiv.css("top",'0px')
            }else{
                panelDiv.css("top",panel.y+'px')
                panelBackDiv.css("top",panel.y+'px')
            }
        }
        panelDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")     
        
        panelDiv.removeClass('hidden');		
        panel.imageObj.removeClass('hidden');		

        panelBackDiv.removeClass('hidden');	
        panelBackDiv.height(panel.height);
        panelBackDiv.width(panel.width);	
    }else{
        panelBackDiv.addClass('hidden');
        panel.imageObj.addClass('hidden');
        panelDiv.css("box-shadow","none")  
        panelDiv.css("top",'0px')
        panelBackDiv.css("top",'0px')
    }		
}
