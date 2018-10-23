@import "constants.js"

const sketch = require('sketch')
var UI = require('sketch/ui')
var Settings = require('sketch/settings')


function getEmptyLink(){
  return  {
    href:"http://",
    openNewWindow:false
  }
}

function saveLayerLink(doc,layer,link){
  var allLinks = Settings.documentSettingForKey(doc,SettingKeys.DOC_EXTERNAL_LINKS)
  if (allLinks==undefined || allLinks==null){
    allLinks = {}
  }
  if(link.href!=""){
    allLinks[layer.id] = link
  }else{
    delete(allLinks[layer.id])
  }

  Settings.setDocumentSettingForKey(doc,SettingKeys.DOC_EXTERNAL_LINKS,allLinks) 
}

function getLayerLink(doc,layer){
  var allLinks = Settings.documentSettingForKey(doc,SettingKeys.DOC_EXTERNAL_LINKS)
  if(allLinks==undefined || allLinks==null){
    return getEmptyLink()
  }
  var layerLink = allLinks[layer.id]

  if(layerLink == undefined || layerLink == null || layerLink==''){
    return getEmptyLink()
  }

  return layerLink
}

var onRun = function(context) {

  
  const document = sketch.fromNative(context.document)
  var selection = document.selectedLayers

  // We need at least one symbol
  //--------------------------------------------------------------------
  if(selection.length==0){
    UI.alert("alert","Select at least one layer.")
    return
  }
  var layers = selection.layers;

  // Get current settings for this layer (and reset to default if undefined)
  //--------------------------------------------------------------------
  var link = getEmptyLink()

  if(layers.length==1){
    var layer = layers[0]
    // restore settings for a single layer selected
    link  = getLayerLink(document,layer)   
  }

  // Ask user for external URL
  //--------------------------------------------------------------------
  link.href = UI.getStringFromUser("Provide some external URL",link.href)
  // handle cancel button
  if(link.href == 'null'){
    return
  }

  //Save new external URL
  //--------------------------------------------------------------------
  for(var layer of layers){
    saveLayerLink(document,layer,link)
  }
  
}
