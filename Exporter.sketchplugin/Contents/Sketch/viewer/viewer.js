
// =============================== PRELOAD IMAGES =========================
var pagerLoadingTotal=0

function getQuery(uri,q) {
    return (uri.match(new RegExp('[?&]' + q + '=([^&]+)')) || [, null])[1];
}

function doTransNext(){
	// get oldest transition
	const trans = viewer.transQueue[0]
	// if it still active then run it
	if(trans.active){
		viewer.next()
		console.log("RUN transition")
	}else{
		console.log("skip transition")
	}
	
	// remove this transtion from stack
	viewer.transQueue.shift()
}

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
		if(page.imageObj==undefined){
			page.loadImages()
			page.hide(true)
		}
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

function doBlinkHotspots(){
    viewer.toggleLinks()
}


// ============================ VIEWER ====================================

function createViewer(story, files) {
	return {
        highlightLinks: story.highlightLinks,
        showLayout: false,
        isEmbed: false,
		prevPageIndex: -1,
		lastRegularPage: -1,
		currentPage : -1,
		currentPageModal : false,
		prevPageModalIndex : -1,
		backStack: [],
        urlLastIndex: -1,
        handleURLRefresh : true,
        files: files,
        userStoryPages: [],
        zoomEnabled: story.zoomEnabled,

		transQueue : [],
		
		initialize: function() {
            this.initParseGetParams()
            this.addHotkeys();
			this.buildUserStory();            
			this.initializeHighDensitySupport();			
        },
        initParseGetParams : function() {
            var s = document.location.search
            if(s.includes('embed')){
                this.isEmbed = true
                // hide image preload indicator
                $('#loading').hide()
                // hide Navigation                
                $('.navCenter').hide()             
                $('.navPreviewNext').hide()
                $('#btnMenu').hide()
                $('#btnOpenNew').show()
            }
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
        buildUserStory: function() {
            this.userStoryPages = []
			for(var page of story.pages){
				if('regular'==page.type || 'modal'==page.type){
                    page.userIndex = this.userStoryPages.length
                    this.userStoryPages.push(page)
                }else{
                    page.userIndex = -1
                }
            }	
		},
		addHotkeys: function() {
			var v = this;
			$(document).bind('keydown', 'right return', function() {
				v.next();
			});
			$(document).bind('keydown', 'left backspace', function() {
				v.previous();
			});
			$(document).bind('keydown', 'shift', function() {
				v.toggleLinks();
            });
            $(document).bind('keydown', 'z', function() {
				v.toggleZoom();
            });
            $(document).bind('keydown', 'e', function() {
				v.share();
			});
			$(document).bind('keydown', 'g', function() {
				gallery.toogle();
            });
            $(document).bind('keydown', 'l', function() {
				v.toogleLayout();
            });
            
			$(document).bind('keydown', 's', function() {
                var first = v.getFirstUserPage()
                if(first && first.index!=v.currentPage) v.goToPage( first.index );
			});			
			$(document).keydown(function(event) {
				var ch = event.which
				if (ch == 27) {
					v.onKeyEscape()
					return false
				}	
			})						
        },
        
        blinkHotspots: function(){
            this.toggleLinks()
            setTimeout(doBlinkHotspots,500)
        },

        share: function(){
            var href = ''            

            if(document.location.search.includes('embed')){
                href = document.location.href
            }else{
                href = document.location.href.split('#')[0] + '?embed' + document.location.hash
            }

            var currentPageIndex = undefined==this.lastRegularPage || this.lastRegularPage<0 ? this.currentPage : this.lastRegularPage
            var page = story.pages[currentPageIndex]

            var iframe = '<iframe src="'+href+'" style="border: none;" noborder="0"'
            iframe += ' width="'+(story.iFrameSizeWidth?story.iFrameSizeWidth:page.width) + '"'
            iframe += ' height="'+(story.iFrameSizeHeight?story.iFrameSizeHeight:page.height) + '"'
            iframe += ' scrolling="auto" seamless id="iFrame1"></iframe>'

            alert(iframe)
        },

        toggleZoom: function(){
            this.zoomEnabled = !this.zoomEnabled
            this.zoomContent()
        },

        openNewWindow: function(){
            // remove GET parames from current URL 
            var cleanURL = window.location.origin 
            if(window.location.port!='') cleanURL = cleanURL + ":" + window.location.port
            cleanURL = cleanURL + window.location.pathname 
            if(window.location.hash!='') cleanURL = cleanURL + window.location.hash
            // ok, now open it in the new browse window
            window.open(cleanURL,"_blank")
        },

        zoomContent: function(){
            if(undefined==this.lastRegularPage || this.lastRegularPage<0) return
            var page = story.pages[this.lastRegularPage]

            if(undefined==this.marker){
                this.marker = $('#marker')
            }
            var marker = this.marker    
            
            var content = $('#content')
            //var contentShadow = $('#content-shadow')
            var contentModal= $('#content-modal')
            var elems = [content,contentModal] //,contentShadow
 
            var markerWidth = marker.innerWidth()
            var zoom = ""
            var scale = ""
            if(this.zoomEnabled && markerWidth<page.width){                
                zoom = markerWidth / page.width
                scale = "scale("+zoom+")"
            } 
                        
            for(var el of elems){
                el.css("zoom",zoom)
                el.css("-moz-transform",scale)                
            }
            content.css("-moz-transform-origin","left top")
            //contentShadow.css("-moz-transform-origin","left top")
            contentModal.css("-moz-transform-origin","center top")
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
		getModalFirstParentPageIndex: function(modalIndex){
			var page = null;
			var link = null;
			for(var i=story.pages.length-1; i>=0 ;i --) {
				page = story.pages[i];
				if(page.type==='modal') continue;
				for(var li = 0; li < page.links.length; li ++) {
					link = page.links[li];
					if(link.page!=null && link.page==modalIndex){
                        // check if the source link is in overlay?
                        if(page.type==='overlay'){
                            // ok, now find the source page for this overlay
                            return this.getModalFirstParentPageIndex(i)
                        }
						// return the page index which has link to modal
						return i;
					}
				}
			}
			// return first prototype page
			return 0;
		},
		getPageIndex: function(page,defIndex=0) {
			var index;

			if (typeof page === "number") {
				index = page;
			} else if (page === "") {
				index = defIndex;
			} else {
				index = this.getPageHashes()[page];
				if (index==undefined) {
					index = defIndex;
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
			// We don't need any waiting page transitions anymore
            this._resetTransQueue()
            
			var index = this.getPageIndex(page);

			if(!this.currentPageModal && this.currentPage>=0){
				this.backStack.push(this.currentPage);
			}

            var oldcurrentPageModal  = this.currentPageModal
			this.currentPageModal = false;
			this.prevPageModalIndex = -1;
			
			if(index <0 ||  index == this.currentPage || index >= story.pages.length) return;

			var newPage = story.pages[index];
			if(newPage.type==="modal"){                
                // hide parent page links hightlighting
                this._updateLinksState(false, $('#content'))

				// no any page to modal, need to find something
				if(this.currentPage==-1){
					parentIndex = this.getModalFirstParentPageIndex(index);					
					this.goTo(parentIndex,false);
					this.prevPageModalIndex = parentIndex;
				}else{
					this.prevPageModalIndex = this.currentPage;
				}
                this.currentPageModal = true;	            
                
                // redraw modal links hightlighting
                this._updateLinksState()
			}else{
                if(oldcurrentPageModal){
                    // hide modal page links hightlighting
                    this._updateLinksState(false, $('#content-modal'))
                    this._updateLinksState(undefined,$('#content'))
                }

				this.currentPageModal = false;
			}
            this.prevPageIndex = this.currentPage		
            var prevRegularPage = this.lastRegularPage
                        	
            newPage.show()                      
            this.refresh_adjust_content_layer(index);	  
            
            this.refresh_hide_last_image(index)                       
			this.refresh_switch_modal_layer(index);	
			this.refresh_update_navbar(index);			
			if(refreshURL)this.refresh_url(index)			

			this.currentPage = index;
			if(story.pages[index].type!="modal"){
				this.lastRegularPage = index
            }
            
            // zoom content if the new page dimensions differ from the previous
            if(story.pages[index].type!="modal"){
                if(prevRegularPage>=0){
                    var lastPage = story.pages[prevRegularPage]
                    if(newPage.width!=lastPage.width || newPage.height!=lastPage.height)
                        this.zoomContent()
                }
            }


			if(newPage.transNextMsecs!=undefined){				
				this._setupTransNext(newPage.transNextMsecs)
            }
            
            if(!newPage.disableAutoScroll){
               window.scrollTo(0,0)       
            }                 
								
        },
		_setupTransNext: function(msecs){	
			// deactivate all waiting transitions
			for(var trans of this.transQueue){
				trans.active = false	
			}
			// place new active transition over the top of stack
			this.transQueue.push({
				page: story.pages[this.currentPage],
				active: true
			})
			// set timer in milisecs
			setTimeout(doTransNext,msecs)
		},
		// Deactivate all waiting transitions
		_resetTransQueue: function(){	
			for(var trans of this.transQueue){
                trans.active = false	
            }			
		},
		refresh_update_navbar: function(pageIndex) {
			var page = story.pages[pageIndex];
			var VERSION_INJECT="";
            
            var prevPage = this.getPreviousUserPage(page)
            var nextPage = this.getNextUserPage(page)

			$('#nav .title').html((page.userIndex+1) + '/' + this.userStoryPages.length + ' - ' + page.title + VERSION_INJECT);
			$('#nav-left-prev').toggleClass('disabled', !prevPage)
			$('#nav-left-next').toggleClass('disabled', !nextPage)			
			
			if(prevPage) {
				$('#nav-left-prev a').attr('title', prevPage.title);
			} else {
				$('#nav-left-prev a').removeAttr('title');
			}
			
			if(nextPage) {
				$('#nav-left-next a').attr('title', nextPage.title);
			} else {
				$('#nav-left-next a').removeAttr('title');
			}

			$('#nav-right-hints').toggleClass('disabled', page.annotations==undefined);

			this.refresh_update_links_toggler(pageIndex);			
		},
		refresh_update_links_toggler: function(pageIndex) {
			var page = story.pages[pageIndex];
			$('#nav-right-links').toggleClass('active', this.highlightLinks);
			$('#nav-right-links').toggleClass('disabled', page.links.length == 0);
		},
		refresh_hide_last_image: function(pageIndex){
		
			var page = story.pages[pageIndex];
			var content = $('#content');
			var contentModal = $('#content-modal');		
			var isModal = page.type==="modal";

			// hide last regular page to show a new regular after modal
			if(!isModal && this.lastRegularPage>=0 && this.lastRegularPage!=pageIndex){
				var lastPageImg = $('#img_'+this.lastRegularPage);
				if(lastPageImg.length){
					story.pages[this.lastRegularPage].hide()
					//pagerHideImg(lastPageImg)
					//pageSwitchFixedPanels(story.pages[this.lastRegularPage],show=false);
				}
			}

			// hide last modal 
			var prevPageWasModal = this.prevPageIndex>=0 && story.pages[this.prevPageIndex].type==="modal";
			if(prevPageWasModal){
				var prevImg = $('#img_'+this.prevPageIndex);
				if(prevImg.length){
					story.pages[this.prevPageIndex].hide()
					//pagerHideImg(prevImg)
				}
			}
			
		},
		refresh_adjust_content_layer: function(pageIndex){
            
			var page = story.pages[pageIndex];

			if(page.type=="modal") return;

			var contentShadow = $('#content-shadow');
			var contentModal = $('#content-modal');
			var content = $('#content');

			var prevPageWasModal = this.prevPageIndex>=0 && story.pages[this.prevPageIndex].type==="modal";
			if(prevPageWasModal){
				contentShadow.addClass('hidden');
				contentModal.addClass('hidden');
			}

			//content.width(page.width);		
			//content.height(page.height);
			//contentShadow.width(page.width);		
			//contentShadow.height(page.height);
			//contentModal.width(page.width);		
            //contentModal.height(page.height)            

		},

		refresh_switch_modal_layer: function(pageIndex){
			var page = story.pages[pageIndex];
			var lastMainPage = story.pages[this.lastRegularPage];
			
			if(page.type!="modal") return;

			var showShadow = page.showShadow==1;	
			var contentModal = $('#content-modal');		
			var contentShadow = $('#content-shadow');				
			
			if(showShadow){				
				contentShadow.removeClass('no-shadow');
				contentShadow.addClass('shadow');
				contentShadow.removeClass('hidden');
			}else{
				contentModal.addClass('hidden');								
			}
			contentModal.removeClass('hidden');			
		},
    
        refresh_url: function(pageIndex,extURL=null) {
            this.handleURLRefresh = false

			var page = story.pages[pageIndex];
			this.urlLastIndex = pageIndex
            $(document).attr('title', story.title + ': ' + page.title)

            if(null==extURL) extURL = ''

            location.hash = '#' 
                + encodeURIComponent(this.getPageHash(pageIndex))
                + extURL

		},
        
        _parseLocationHash : function(){
            var result = {
                reset_url : false
            }
            var hash = location.hash;
            
            if(hash == null || hash.length == 0){
                hash = '#'
                result.reset_url = true
                
            }else if(hash.indexOf('/')>0){
                // read additonal parameters
                var args = hash.split('/')
                // check for link to click
                if(args[1]=='o'){
                    result.overlayLinkIndex = args[2]                                    
                }
                hash = hash.substring(0,hash.indexOf('/'))
                hash = '#' + hash.replace( /^[^#]*#?(.*)$/, '$1' );
            }

            result.hash = hash
            return result
        },

        handleNewLocation : function(initial){
            var hashInfo = this._parseLocationHash()	
        
            var pageName = hashInfo.hash.substring(1)
            var pageIndex = this.getPageIndex(pageName,null);
            if(null==pageIndex){
                // get the default page
                pageIndex = 0
                hashInfo.reset_url = true
            }

            if(!initial && this.urlLastIndex==pageIndex){
                return
            }

            var page =  story.pages[pageIndex];            

            if(initial)
                page.isDefault = true
            else
                this.clear_context();
            
            this.goTo(pageIndex,hashInfo.reset_url);
            
            if(hashInfo.overlayLinkIndex!=null){
                page.showOverlayByLinkIndex(hashInfo.overlayLinkIndex)
                //hashInfo.overlay.page.showAsOverlayIn(page,hashInfo.overlay.posX,hashInfo.overlay.posY)
            }

            if(!initial) this.urlLastIndex = pageIndex
        },
 
		clear_context_hide_all_images: function(){
			var page = story.pages[this.currentPage];
			var content = $('#content');
			var contentModal = $('#content-modal');		
			var contentShadow = $('#content-shadow');
			var isModal = page.type==="modal";

			contentShadow.addClass('hidden');
			contentModal.addClass('hidden');
						
			// hide last regular page
			if(this.lastRegularPage>=0){
				var lastPageImg = $('#img_'+this.lastRegularPage);
				if(lastPageImg.length){
					story.pages[this.lastRegularPage].hide()
					//pagerHideImg(lastPageImg)
				}
				//pageSwitchFixedPanels(story.pages[this.lastRegularPage],show=false);
			}

			// hide current modal 
			if(isModal){
				var modalImg = $('#img_'+this.currentPage);
				if(modalImg.length){
					story.pages[this.currentPage].hide()
					//pagerHideImg(modalImg);
				}
				//pageSwitchFixedPanels(story.pages[this.currentPage],show=false);
			}
			
		},

		clear_context: function(){
			this.clear_context_hide_all_images()

			this.prevPageIndex = -1
			this.lastRegularPage = -1
			this.currentPage = -1
			this.currentPageModal = false
			this.prevPageModalIndex = -1	
			this.backStack = []
		},

		refresh: function(){
			reloadAllPageImages()
			story.pages[this.currentPage].show()
		},
		onKeyEscape: function(){
			// If gallery is enabled then close it
			if(gallery.isVisible()){
				gallery.toogle()
				return
			}
			// If the current page is modal then close it and go to the last non-modal page
			if(this.currentPageModal){
                if(this.prevPageModalIndex>=0){
                    viewer.goTo(this.prevPageModalIndex)
                }else{
                    viewer.goBack()
                }
				return
			}
		},
		next: function() {
            var page = this.getNextUserPage( story.pages[this.currentPage] )
            if(!page) return
			this.goToPage(page.index);	
		},
		previous : function() {
            var page = this.getPreviousUserPage( story.pages[this.currentPage] )
            if(!page) return
			this.goToPage(page.index);	
        },
        getFirstUserPage : function() {           
            var first = this.userStoryPages[0]
            return first?first:null
		},
		getNextUserPage : function(page) {
            var nextUserIndex = page.userIndex + 1
            if(nextUserIndex>=this.userStoryPages.length) return null
            return this.userStoryPages[ nextUserIndex ] 
		},
		getPreviousUserPage : function(page) {
            var prevUserIndex = page.userIndex - 1
            if(prevUserIndex<0) return null
            return this.userStoryPages[ prevUserIndex ] 
		},
		toggleLinks : function() {
            this.highlightLinks = !this.highlightLinks
            this.refresh_update_links_toggler(this.currentPage)
            this._updateLinksState()
        },

        toogleLayout : function() {
            this.showLayout = !this.showLayout
            div = $('#content')

            if(this.showLayout )
                div.addClass("contentLayoutVisible")
            else
                div.removeClass("contentLayoutVisible")        
        },

        

        _updateLinksState : function(showLinks = undefined, div = undefined){
            if(undefined == div){
                if(this.currentPageModal){
                    div = $('#content-modal')
                }else{
                    div = $('#content')
                }
            }
            if(undefined == showLinks) showLinks = this.highlightLinks
            if(showLinks)
                div.addClass("contentLinksVisible")
            else
                div.removeClass("contentLinksVisible")        
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
    viewer.initialize();
    gallery.initialize();		
	
	if(!!('ontouchstart' in window) || !!('onmsgesturechange' in window)) {
		$('body').removeClass('screen');
	}
    
    viewer.handleNewLocation(true)

    if(!viewer.isEmbed) preloadAllPageImages();
	
	$(window).hashchange(function(e) {
        if(viewer.handleURLRefresh)
            viewer.handleNewLocation(false)       
        viewer.handleURLRefresh = true
	});
    //$(window).hashchange();
    viewer.zoomContent()
});
