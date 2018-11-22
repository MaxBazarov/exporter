
///

class ViewerPage {

    /*------------------------------- PUBLIC -----------------------------*/
    createAreaMaps(parentDiv){
        let map = this._createSingleMapWithAreas(this.links,'map' + this.index,this.type)
        map.appendTo(parentDiv)
        for(var panel of this.fixedPanels){       
            map = this._createSingleMapWithAreas(panel.links,'map' + this.index+"_"+panel.index,this.type)
            map.appendTo(parentDiv)
        }
    }

    hide(){
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
            this.loadImages()						
        }            

        const fixedZs = {
            'float':14,            
            'top':13,
            'left':12
        }
        
        for(var panel of this.fixedPanels){
            panel.imageObj.removeClass("hidden")
            //if(panel.isFloat) panel.imageObj.removeClass("hidden")
            panel.imageDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")                
            panel.imageDiv.css("z-index",fixedZs[panel.type])
            //this._showPanelMap(panel)                             
        }

        this.imageDiv.removeClass('hidden');        

    }

    loadImages(force=false){
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
            //panelDiv.css("box-shadow",panel.shadow!=undefined?panel.shadow:"none")     
            panelDiv.appendTo(content);
            panel.imageDiv = panelDiv

            panel.imageObj = this._loadSingleImage(panel.isFloat?panel:this,'img_'+panel.index+"_")     
            panel.imageObj.appendTo(panelDiv);
            
            this._createPanelMap(panel)

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

        this._enableMainHotSpots()
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


    _enableMainHotSpots(){
        // init main area hotspots
        this._initImgMap($("#map_image_"+this.index), this,"#map"+this.index)
    }

    _enablePanelFixedHotSpots(panel){
        // init or hide fixed are hotsposts
        var img = $("#map_img_fixed_"+this.index + "_"+panel.index)     
        this._initImgMap(img,panel,"#map"+this.index+"_"+panel.index)
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

    _initImgMap(img,sizesFrom,mapName){    
        img.attr('usemap',mapName).attr('width', sizesFrom.width).attr('height', sizesFrom.height)
    
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
    

    _hidePanelMap(panel){
        const img = panel.fixedMapImg
        
        if(img==undefined) return
        if(img.parent().attr("id")==panel.imageDiv.attr("id"))
            img.addClass('hidden');
        else
            img.parent().addClass('hidden');
    }
    
    _showPanelMap(panel){
        let img = panel.fixedMapImg
        if(img==undefined){
            img = this._createPanelMap(panel)
        }else{
            if(img.parent().attr("id")==panel.imageDiv.attr("id"))
                img.removeClass('hidden');
            else
                img.parent().removeClass('hidden');
        }
    }

    _createPanelMap(panel){
        // create Map for fixed panel
        panel.fixedMapImg = $("<img>",{
            id:"map_img_fixed_"+this.index+"_"+panel.index,
            src:"resources/1.png"
        });
        panel.fixedMapImg.appendTo(panel.imageDiv);   
        this._enablePanelFixedHotSpots(panel)     
        return panel.fixedMapImg
    }


    _createSingleMapWithAreas(links,name,type){

        var map = $('<map/>', {
            id: name,
            type: type,
            name: name
        });

        for(var link of links) {
            var title, href, target;
            if(link.page != null) {			
                title = story.pages[link.page].title;
                href = 'javascript:viewer.goTo(' + link.page + ')';
                target = null;
            } else if(link.action != null && link.action == 'back') {
                title = "Go Back";
                href = 'javascript:viewer.goBack()';
                target = null;
            } else if(link.url != null){
                title = link.url;
                href = link.url;
                target = link.target!=null?link.target:null;						
            }
            
            $('<area/>', {
                shape: 'rect',
                coords: link.rect.join(','),
                href: href,
                alt: title,
                title: title,
                target: target
            }).appendTo(map);
        } 
        return map
    }
}
