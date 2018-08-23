@import("constants.js")

var onRun = function(context) {
  const sketch = require('sketch')
  var UI = require('sketch/ui')
  var Settings = require('sketch/settings')

  const document = sketch.fromNative(context.document)
  var selection = document.selectedLayers

  // We need at least one symbol
  //--------------------------------------------------------------------
  if(selection.length!=1){
    UI.alert("alert","Select a one layer.")
    return
  }
  var layer = selection.layers[0];

  // Get current settings for this layer (and reset to default if undefined)
  //--------------------------------------------------------------------
  var link  = Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK)
  if(link == undefined || link == null || link==''){
    link = "http://"
  }
  var openNewWindow = Settings.layerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN)
  // currently we
  if(openNewWindow == undefined){
    openNewWindow = true
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
  Settings.setLayerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK,link)
  Settings.setLayerSettingForKey(layer,SettingKeys.LAYER_EXTERNAL_LINK_BLANKWIN,openNewWindow)
  
}
