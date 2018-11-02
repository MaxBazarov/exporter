async function preloadAllPageImages(){
	var pages = story.pages;
	for(var page of story.pages){
		loadPageImages(page)
	}	
}

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
	if(!force && page.imageObj!=undefined) return;    
    
    var img = loadPageOneImage(page,'img_')		 
    {
        var isOverlay = page.type==="overlay";
        var content = $('#content');
        var contentOverlay = $('#content-overlay');		
        var highlight = viewer.highlightLinks;				
        
        img.appendTo(isOverlay?contentOverlay:content);				
        img.maphilight({
            alwaysOn: highlight,
            stroke: false,
            fillColor: 'FFC400',
            fillOpacity: 100.0/255
        });
    }
    if(!visible) img.attr("class","hidden")
    page.imageObj = img

	for(var panelType of Object.keys(page.fixedPanels)){
        var panel = page.fixedPanels[panelType]
		panel.imageObj = loadPageOneImage(page,'img_'+panelType+"_")		
	}
}   

function loadPageOneImage(page,idPrefix){

	var hasRetinaImages = story.hasRetina
	var imageURI = hasRetinaImages && viewer.isHighDensityDisplay() ? page.image2x : page.image;	

	var img = $('<img/>', {
		id : idPrefix+page.index,
		src : encodeURIComponent(viewer.files) + '/' + encodeURIComponent(imageURI),
		usemap: '#map' + page.index,
	}).attr('width', page.width).attr('height', page.height);

	img.trigger('load');	

	return img;
}

