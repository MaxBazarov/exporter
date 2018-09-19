@import("constants.js")

var onRun = function(context) {
  const sketch = require('sketch')
  var UI = require('sketch/ui')
  var Settings = require('sketch/settings')

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
  var link = "http://"
  var openNewWindow = true

  if(layers.length==1){
    var layer = layers[0]
    // restore settings for a single layer selected
    var savedLink  = Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK)
    if(savedLink != undefined && savedLink != null && savedLink!=''){
      link = savedLink
    }
    var savedOpenNewWindow = Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN)
    if(savedOpenNewWindow != undefined){
      openNewWindow = savedOpenNewWindow
    }
  }

  // Ask user for external URL
  //--------------------------------------------------------------------
  link = UI.getStringFromUser("Provide some external URL",link)
  // handle cancel button
  if(link == 'null'){
    return
  }

  //Save new external URL
  //--------------------------------------------------------------------
  layers.forEach(function(layer){
    Settings.setLayerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK,link)
    Settings.setLayerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN,openNewWindow)
  })
  
}
