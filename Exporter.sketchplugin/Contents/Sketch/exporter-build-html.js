
function buildMainHTML(docName, centerContent) {
  
  let s = "";
  s += '<!DOCTYPE html>\n<html>\n<head>\n<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">\n';
  s += '<meta name="generator" content="Generated using Exporter Skerch Plugin - https://github.com/MaxBazarov/exporter">\n';
  s += '<title>'+docName+'</title>\n';
  s += '<link rel="stylesheet" type="text/css" href="resources/fa/css/all.min.css"/>\n';
  s += '<link rel="stylesheet" type="text/css" href="resources/viewer.css">\n';
  if(centerContent){
    s += '<link rel="stylesheet" type="text/css" href="resources/viewer-center.css">\n';
  }else{
    s += '<link rel="stylesheet" type="text/css" href="resources/viewer-top.css">\n';
  }
  s += '<script type="text/javascript" src="resources/jquery-1.12.4.min.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/jquery-migrate-1.4.1.min.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/jquery.maphilight.min.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/jquery.hotkeys.min.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/jquery.ba-hashchange.min.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/story.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/viewer.js" charset="UTF-8"></script>\n';
  s += '<script type="text/javascript" src="resources/gallery.js" charset="UTF-8"></script>\n';

  s += '<script type="text/javascript">\n';
  s += '  var viewer = createViewer(story, "images");\n';
  s += '  var gallery = createGallery();\n';
  s += '</script>\n';
  s += '</head>\n';
  s += '<body class="screen">\n';
  s += ' <div id="container">\n';
  s += ' <div id="content"></div>\n'; 
  s += ' <div id="content-shadow" class="hidden"></div>\n';
  s += ' <div id="content-overlay" class="hidden"></div>\n';
  s += ' <div id="gallery" class="hidden"></div>\n';
  s += '</div>\n';


  s += ' <div id="nav">\n';
  s += '     <ul id="nav-right-hide" class="nav-set">\n';
  s += '         <li class="nav-item-icon">\n';
  s += '             <a onclick="viewer.hideNavbar(); return false;" href="" title="Hide controls"><i class="fas fa-times"></i></a>\n';
  s += '         </li>\n';
  s += '     </ul>\n';
  s += '     <ul id="nav-left" class="nav-set">\n';
  s += '         <li id="nav-left-prev" class="nav-item-icon">\n';
  s += '             <a onclick="viewer.previous(); return false;" href="" title="View previous screen (or →)"><i class="fas fa-angle-left"></i></a>\n';
  s += '         </li>\n';
  s += '         <li id="nav-left-next" class="nav-item-icon">\n';
  s += '             <a onclick="viewer.next(); return false;" href="" title="View next screen (or ←)"><i class="fas fa-angle-right"></i></a>\n';
  s += '         </li>\n';
  s += '         <li id="nav-right-links" class="nav-item-icon">\n';
  s += '             <a onclick="viewer.toggleLinks(); return false;" href="" title="Toggle links (or SHIFT to toggle)"><i class="far fa-hand-pointer"></i></a>\n';
  s += '         </li>\n';
  s += '         <li id="nav-right-hints" class="nav-item-icon">\n';
  s += '             <a onclick="viewer.showHints(); return false;" href="" title="Show page annotations"><i class="far fa-info"></i></a>\n';
  s += '         </li>\n';
  s += '         <li id="nav-right-gallery" class="nav-item-icon">\n';
  s += '             <a onclick="gallery.switch(); return false;" href="" title="Show all pages"><i class="far fa-images"></i></a>\n';
  s += '         </li>\n';  
  s += '     </ul>\n';
  s += '     <ul id="nav-title">\n';
  // TODO - show version in some other good and always visible place
  s += '         <li><div class="nav-title-label">Screen title <!--VERSION--></div><div class="title">Title</div></li>\n';
  s += '     </ul>\n';
  s += ' </div>\n';
  s += ' <div id="nav-hide" class="hidden">\n';
  s += '     <ul class="nav-set">\n';
  s += '         <li class="nav-item-icon">\n';
  s += '             <a onclick="viewer.showNavbar(); return false;" href="" title="Show controls"><i class="fas fa-bars"></i></a>\n';
  s += '         </li>\n';
  s += '     </ul>\n';
  s += ' </div>\n';
  s += '</body>\n';
  s += '</html>\n';

  return s;
};

