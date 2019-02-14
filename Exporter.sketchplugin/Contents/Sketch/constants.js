var Constants = {    
  DOCUMENT_VERSION: "docVersion",  
  TAB_SIZE: 2,
  HOTSPOT_PADDING: 0,
  LAYER_LOGGING: false,
  LOGGING: false,
  IMAGES_DIRECTORY: "images/",
  VIEWER_DIRECTORY: "viewer/",
  RESOURCES_DIRECTORY: "resources/",
  PLUGIN_IDENTIFIER: "com.cloudblue.sketch.exporter",  
  SORT_RULE_X:0,    
  SORT_RULE_SKETCH:1,
  SORT_RULE_REVERSIVE_SKETCH:2,
  SORT_RULE_OPTIONS: ["Left-to-right","Sketch default","Reversive Sketch default"],
  POSITION_DEFAULT:0,
  POSITION_TOP:1,
  POSITION_CENTER:2,
  EXPORT_MODE_SELECTED_ARTBOARDS:0,
  EXPORT_MODE_CURRENT_PAGE:1,
  DEF_BACK_COLOR: "#646464",
  INT_LAYER_NAME_BACKCOLOR : "@MainBackground@",
  INT_LAYER_NAME_SPLIT: "@Split@",
  ARTBOARD_TYPE_REGULAR: 0,
  ARTBOARD_TYPE_MODAL: 1,
  ARTBOARD_TYPE_EXTERNAL_URL: 2,
  ARTBOARD_TYPE_OVERLAY: 3,
  ARTBOARD_OVERLAY_BY_EVENT_CLICK: 0,
  ARTBOARD_OVERLAY_BY_EVENT_MOUSEOVER: 1,
  LAYER_OVERLAY_DEFAULT: 0,
  LAYER_OVERLAY_TRANSP_TOP: 1,
  LAYER_OVERLAY_TRANSP_LEFT: 2,
  LAYER_OVERLAY_DIV: 3
};

var PublishKeys = {
  SHOW_OUTPUT: false,
  TMP_FILE: "publish.sh",
  RESOURCES_FOLDER: "scripts",

}

var SettingKeys = {
  PLUGIN_POSITION: "positon",
  PLUGIN_DONT_OPEN_BROWSER: "dontOpenBrowser",
  PLUGIN_DONT_RETINA_IMAGES: "dontRetinaImages",
  PLUGIN_COMMENTS_URL: "commentsURL",
  PLUGIN_GOOGLE_CODE: "googleCode",
  PLUGIN_EXPORT_MODE: "exportMode",
  PLUGIN_HIDE_NAV: "hideNavigation",    
  PLUGIN_SORT_RULE: "pluginSortRule",    
  PLUGIN_DISABLE_HOTSPOTS: "pluginDisableHotspots",    
  PLUGIN_SAVE_JSON: "pluginSaveJSON",     
  PLUGIN_PUBLISH_LOGIN: "publishLogin",
  PLUGIN_PUBLISH_SITEROOT: "publishSiteRoot",
  PLUGIN_COMPRESS_TOOL_PATH: "pluginCompressPath",
  PLUGIN_EXPORTING_URL: "pluginExportingURL", 

  ARTBOARD_TYPE: "artboardType",

  LEGACY_ARTBOARD_MODAL: "artboardOverlay", //legacy, replaced by ARTBOARD_TYPE
  LEGACY_ARTBOARD_MODAL_SHADOW: "artboardOverlayShadow", // replaced by  ARTBOARD_SHADOW, Outdated on 14 Frev 2018

  ARTBOARD_SHADOW: "artboardShadow",
  ARTBOARD_DISABLE_AUTOSCROLL: "artboardDisableAutoScroll",
  ARTBOARD_TRANS_TO_NEXT_SECS: "artboardTransNextSecs",
  ARTBOARD_OVERLAY_BY_EVENT: "artboardOverlayByEvent",
  
  DOC_EXPORTING_URL: "docExportingURL", // legacy, replaced by PLUGIN_EXPORTING_URL
  DOC_PUBLISH_COMPRESS: "docPublishCompress",
  DOC_DISABLE_FIXED_LAYERS: "docDisablFixedLayers",
  DOC_PUBLISH_VERSION: "mockupsVersion",
  DOC_PUBLISH_REMOTE_FOLDER: "remoteFolder",
  DOC_CUSTOM_HIDE_NAV: "docCustomHideNavigation",
  DOC_CUSTOM_SORT_RULE: "docCustomSortRule", // How to sort artboards
  DOC_BACK_COLOR: "docBackColor",

  LAYER_ANNOTATIONS: "layerAnnotations",
  LAYER_OVERLAY_TYPE : "layerOverlayType",
  LAYER_DIV_ID: 'layerDivID',
  LAYER_EXTERNAL_LINK: "externalLink",  
  LAYER_EXTERNAL_LINK_BLANKWIN: "openLinkInNewWindow"
};
