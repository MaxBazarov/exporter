
// =============================== PRELOAD IMAGES =========================
var pagerLoadingTotal=0

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
		page.loadImages()
    }
    
}

function reloadAllPageImages(){
	for(var page of story.pages){        
        page.imageObj.parent().remove();        
        page.imageObj = undefined
        for(var p of page.fixedPanels){
            p.imageObj.parent().remove(); 
            p.imageObj = undefined	
        }
    }	
    preloadAllPageImages()
}

// ============================ VIEWER ====================================

function createViewer(story, files) {
	return {
		highlightLinks: story.highlightLinks,
		prevPageIndex: -1,
		lastRegularPage: -1,
		currentPage : -1,
		currentPageOverlay : false,
		prevPageOverlayIndex : -1,
		backStack: [],
		urlLastIndex: -1,
		files: files,
		
		initialize: function() {
            this.addHotkeys();
			this.createImageMaps();            
			this.initializeHighDensitySupport();			
		},
		initializeHighDensitySupport: function() {
			if (window.matchMedia) {
				this.hdMediaQuery = window
						.matchMedia("only screen and (min--moz-device-pixel-ratio: 1.1), only screen and (-o-min-device-pixel-ratio: 2.2/2), only screen and (-webkit-min-device-pixel-ratio: 1.1), only screen and (min-device-pixel-ratio: 1.1), only screen and (min-resolution: 1.1dppx)");
				var v = this;
				this.hdMediaQuery.addListener(function(e) {
					v.refresh();
				});
			}
		},
		isHighDensityDisplay: function() {
			return (this.hdMediaQuery && this.hdMediaQuery.matches || (window.devicePixelRatio && window.devicePixelRatio > 1));
        },		
        createImageMaps: function() {
			var div = $('<div/>', {
				'class': ''
			});
			var pages = story.pages;
			for(var i = 0; i < pages.length; i ++) {
				var page = pages[i];
				var name = 'map' + i;
				var map = $('<map/>', {
					id: name,
					type: "'"+page.type+"'",
					name: name
				});
				for(var j = page.links.length - 1; j >= 0; j --) {
					var link = page.links[j];
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
				map.appendTo(div);
			}
			div.appendTo('body');
		},
		addHotkeys: function() {
			var v = this;
			$(document).bind('keydown', 'right space return', function() {
				v.next();
			});
			$(document).bind('keydown', 'left backspace', function() {
				v.previous();
			});
			$(document).bind('keydown', 'shift', function() {
				v.toggleLinks();
			});
			$(document).bind('keydown', 'g', function() {
				gallery.toogle();
			});
			$(document).bind('keydown', 's', function() {
				v.goToPage(0);
			});
			$(document).keydown(function(event) {
				var ch = event.which
				if (ch == 27) {
					v.onKeyEscape()
					return true;
				}
				return false;
			})			
		},
		getPageHash: function(index) {
			var image = story.pages[index].image;
			return image.substring(0, image.length - 4); // strip .png suffix
		},
		getPageHashes: function() {
			if(this.pageHashes == null) {
				var hashes = {};
				var pages = story.pages;
				for(var i = 0; i < pages.length; i ++) {
					hashes[this.getPageHash(i)] = i;
				}
				this.pageHashes = hashes;
			}
			return this.pageHashes;
		},
		getOverlayFirstParentPageIndex: function(overlayIndex){
			var page = null;
			var link = null;
			for(var i=story.pages.length-1; i>=0 ;i --) {
				page = story.pages[i];
				if(page.type==='overlay') continue;
				for(var li = 0; li < page.links.length; li ++) {
					link = page.links[li];
					if(link.page!=null && link.page==overlayIndex){
						// return the page index which has link to overlay
						return i;
					}
				}
			}
			// return first prototype page
			return 0;
		},
		getPageIndex: function(page) {
			var index;

			if (typeof page === "number") {
				index = page;
			} else if (page === "") {
				index = 0;
			} else {
				index = this.getPageHashes()[page];
				if (index==undefined) {
					var pageNumber = parseInt(page);
					if (isNaN(pageNumber))
						index = 0;
					else
						index = pageNumber - 1;
				}
			}
			return index;
		},
		goBack: function() { 
			if(this.backStack.length>0){
				this.goTo(this.backStack[this.backStack.length-1]);
				this.backStack.shift();
			}else{
				window.history.back();
			}
		},
		goToPage : function(page) {
			this.clear_context();
			this.goTo(page);
		},
		goTo : function(page,refreshURL=true) {
			var index = this.getPageIndex(page);

			if(!this.currentPageOverlay && this.currentPage>=0){
				this.backStack.push(this.currentPage);
			}

			this.currentPageOverlay = false;
			this.prevPageOverlayIndex = -1;
			
			if(index <0 ||  index == this.currentPage || index >= story.pages.length) return;

			var newPage = story.pages[index];
			if(newPage.type==="overlay"){
				// no any page to overlay, need to find something
				if(this.currentPage==-1){
					parentIndex = this.getOverlayFirstParentPageIndex(index);					
					this.goTo(parentIndex);
					this.prevPageOverlayIndex = parentIndex;
				}else{
					this.prevPageOverlayIndex = this.currentPage;
				}
				this.currentPageOverlay = true;			
			}else{
				this.currentPageOverlay = false;
			}
			this.prevPageIndex = this.currentPage;		
			
			this.refresh_adjust_content_layer(index);					
			this.refresh_show_or_create_img(index,true);			
			this.refresh_switch_overlay_layer(index);	
			this.refresh_update_navbar(index);			
			if(refreshURL) this.refresh_url(index)			

			this.currentPage = index;
			if(story.pages[index].type!="overlay"){
				this.lastRegularPage = index;				
			}


			if(!newPage.disableAutoScroll)
				window.scrollTo(0,0)
			


								
		},

		refresh_update_navbar: function(pageIndex) {
			var page = story.pages[pageIndex];
			var VERSION_INJECT="";
			
			$('#nav .title').html((pageIndex+1) + '/' + story.pages.length + ' - ' + page.title + VERSION_INJECT);
			$('#nav-left-prev').toggleClass('disabled', !this.hasPrevious(pageIndex));
			$('#nav-left-next').toggleClass('disabled', !this.hasNext(pageIndex));			
			
			if(this.hasPrevious(pageIndex)) {
				$('#nav-left-prev a').attr('title', story.pages[pageIndex - 1].title);
			} else {
				$('#nav-left-prev a').removeAttr('title');
			}
			
			if(this.hasNext(pageIndex)) {
				$('#nav-left-next a').attr('title', story.pages[pageIndex + 1].title);
			} else {
				$('#nav-left-next a').removeAttr('title');
			}

			$('#nav-right-hints').toggleClass('disabled', page.annotations==undefined);

			this.refresh_update_links_toggler(pageIndex);			
		},

		refresh_url: function(pageIndex) {
			var page = story.pages[pageIndex];
			this.urlLastIndex = pageIndex
			$(document).attr('title', story.title + ': ' + page.title)			
			location.hash = '#' + encodeURIComponent(this.getPageHash(pageIndex))			
		},
		
		refresh_update_links_toggler: function(pageIndex) {
			var page = story.pages[pageIndex];
			$('#nav-right-links').toggleClass('active', this.highlightLinks);
			$('#nav-right-links').toggleClass('disabled', page.links.length == 0);
		},
		

		refresh_hide_last_image: function(pageIndex){
		
			var page = story.pages[pageIndex];
			var content = $('#content');
			var contentOverlay = $('#content-overlay');		
			var isOverlay = page.type==="overlay";

			// hide last regular page to show a new regular after ovelay
			if(!isOverlay && this.lastRegularPage>=0 && this.lastRegularPage!=pageIndex){
				var lastPageImg = $('#img_'+this.lastRegularPage);
				if(lastPageImg.length){
					story.pages[this.lastRegularPage].hide()
					//pagerHideImg(lastPageImg)
					//pageSwitchFixedPanels(story.pages[this.lastRegularPage],show=false);
				}
			}

			// hide last overlay 
			var prevPageWasOverlay = this.prevPageIndex>=0 && story.pages[this.prevPageIndex].type==="overlay";
			if(prevPageWasOverlay){
				var prevImg = $('#img_'+this.prevPageIndex);
				if(prevImg.length){
					story.pages[this.prevPageIndex].hide()
					//pagerHideImg(prevImg)
				}
			}
			
		},


		refresh_adjust_content_layer: function(pageIndex){
			var page = story.pages[pageIndex];

			if(page.type=="overlay") return;

			var contentShadow = $('#content-shadow');
			var contentOverlay = $('#content-overlay');
			var content = $('#content');

			var prevPageWasOverlay = this.prevPageIndex>=0 && story.pages[this.prevPageIndex].type==="overlay";
			if(prevPageWasOverlay){
				contentShadow.addClass('hidden');
				contentOverlay.addClass('hidden');
			}

			content.width(page.width);		
			content.height(page.height);
			contentShadow.width(page.width);		
			contentShadow.height(page.height);
			contentOverlay.width(page.width);		
			//contentOverlay.height(page.height)

		},

		refresh_switch_overlay_layer: function(pageIndex){
			var page = story.pages[pageIndex];
			var lastMainPage = story.pages[this.lastRegularPage];
			
			if(page.type!="overlay") return;

			var isOverlayShadow = page.overlayShadow==1;	
			var contentOverlay = $('#content-overlay');		
			var contentShadow = $('#content-shadow');				
			
			if(isOverlayShadow){				
				contentShadow.removeClass('no-shadow');
				contentShadow.addClass('shadow');
				contentShadow.removeClass('hidden');
			}else{
				contentOverlay.addClass('hidden');								
			}
			contentOverlay.removeClass('hidden');			
		},

		refresh_show_or_create_img: function(pageIndex,hideLast=false){
			var page = story.pages[pageIndex];
			var img = page.imageObj;
			var isOverlay = page.type==="overlay";
			
			if(isOverlay){
				var contentOverlay = $('#content-overlay');		
				contentOverlay.width(page.width);
			}
				
			if(img){			
				page.show()
				if(hideLast) this.refresh_hide_last_image(pageIndex);	
				//pagerShowImg(img)		
			}else{
				this.create_img(pageIndex,hideLast);
			}			

			//page.enableHotSpots()	
		},
 
		clear_context_hide_all_images: function(){
			var page = story.pages[this.currentPage];
			var content = $('#content');
			var contentOverlay = $('#content-overlay');		
			var contentShadow = $('#content-shadow');
			var isOverlay = page.type==="overlay";

			contentShadow.addClass('hidden');
			contentOverlay.addClass('hidden');
						
			// hide last regular page
			if(this.lastRegularPage>=0){
				var lastPageImg = $('#img_'+this.lastRegularPage);
				if(lastPageImg.length){
					story.pages[this.lastRegularPage].hide()
					//pagerHideImg(lastPageImg)
				}
				//pageSwitchFixedPanels(story.pages[this.lastRegularPage],show=false);
			}

			// hide current overlay 
			if(isOverlay){
				var overlayImg = $('#img_'+this.currentPage);
				if(overlayImg.length){
					story.pages[this.currentPage].hide()
					//pagerHideImg(overlayImg);
				}
				//pageSwitchFixedPanels(story.pages[this.currentPage],show=false);
			}
			
		},

		clear_context: function(){
			this.clear_context_hide_all_images()

			this.prevPageIndex = -1
			this.lastRegularPage = -1
			this.currentPage = -1
			this.currentPageOverlay = false
			this.prevPageOverlayIndex = -1	
			this.backStack = []
		},

		refresh: function(){
			reloadAllPageImages()
			this.create_img(this.currentPage);			
		},

		create_img: function(pageIndex,hideLast=false){
			if(hideLast) viewer.refresh_hide_last_image(pageIndex);		
			var page = story.pages[pageIndex];
			page.loadImages(force=false,visible=true)						
		},
		onKeyEscape: function(){
			// If gallery is enabled then close it
			if(gallery.isVisible()){
				gallery.toogle()
				return
			}
			// If the current page is overlay then close it and go to the last non-overlay page
			if(this.currentPageOverlay){
				viewer.goBack()
				return
			}
		},

		next : function() {
			if (this.hasNext(this.currentPage)){
				const index = this.currentPage + 1;				
				this.goToPage(index);
			}
		},
		previous : function() {
			if (this.hasPrevious(this.currentPage)){
				const index = this.currentPage - 1;				
				this.goToPage(index);
			}
		},
		hasNext : function(pageIndex) {
			return pageIndex < story.pages.length - 1;
		},
		hasPrevious : function(pageIndex) {
			return pageIndex > 0;
		},
		toggleLinks : function() {
			this.highlightLinks = !this.highlightLinks;
			this.refresh_update_links_toggler(this.currentPage);
			var page = story.pages[this.currentPage]
			page.enableHotSpots()		
		},
		showHints : function(){
			var text = story.pages[this.currentPage].annotations;
			if(text==undefined) return;
			alert(text);
		},
		hideNavbar : function() {
			$('#nav').slideToggle('fast', function() {
				$('#nav-hide').slideToggle('fast').removeClass('hidden');
			});
		},
		showNavbar : function() {
			$('#nav-hide').slideToggle('fast', function() {
				$('#nav').slideToggle('fast');
			}).addClass('hidden');
		}
	};
}

// ADD | REMOVE CLASS
// mode ID - getELementByID
// mode CLASS - getELementByClassName

function addRemoveClass(mode, el, cls) {
	
	var el;

	switch(mode) {
		case 'class':
		el = document.getElementsByClassName(el)[0];
		break;

		case 'id':
		el = document.getElementById(el);
		break;
	}

	if (el.classList.contains(cls)) {
		el.classList.remove(cls)
	} else {
		el.classList.add(cls);
	}
}


$(document).ready(function() {
	var hash = location.hash;
	if(hash == null || hash.length == 0)
		hash = '#';
	hash = '#' + hash.replace( /^[^#]*#?(.*)$/, '$1' );
	
	
	var pageName = decodeURIComponent(hash.substring(1));

	viewer.initialize();
	gallery.initialize();
	
	if(!!('ontouchstart' in window) || !!('onmsgesturechange' in window)) {
		$('body').removeClass('screen');
	}
	
	viewer.goTo(pageName);
	preloadAllPageImages();
	
	$(window).hashchange(function(e) {
		var hash = location.hash;
		if(hash == null || hash.length == 0)
			hash = '#';
		hash = '#' + hash.replace( /^[^#]*#?(.*)$/, '$1' );
		
		var page = decodeURIComponent(hash.substring(1));
		var pageIndex = viewer.getPageIndex(page);
		if(viewer.urlLastIndex==pageIndex){
			return
		}
		viewer.clear_context();
		viewer.goTo(page,false);
		viewer.urlLastIndex= pageIndex
	});
	$(window).hashchange();
});
