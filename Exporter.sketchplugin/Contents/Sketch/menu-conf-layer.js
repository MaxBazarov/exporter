@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function(context) {  
  const sketch = require('sketch')
  const Settings = require('sketch/settings') 
  var UI = require('sketch/ui')
  const document = sketch.fromNative(context.document)
  var selection = document.selectedLayers
  var layers = selection.layers;

  UIDialog.setUp(context);

  // We need at least one layer
  if(layers.length!=1){
    UI.alert("alert","Select some single layer.")
    return
  }
  
  var layer = layers[0]
  
  var layerDivID  = Settings.layerSettingForKey(layer,SettingKeys.LAYER_DIV_ID)
  if(undefined == layerDivID) layerDivID = ""
  //
  const dialog = new UIDialog("Layer Settings",NSMakeRect(0, 0, 300, 100),"Save","Configure single layer options ")

  dialog.addTextInput("layerDivID","Layer <div> ID", layerDivID,'MyLayer1')
  dialog.addHint("This layer will be presented by standalone <div> with specified ID")

  //
  while(true){ 
    // Cancel clicked
    if(!dialog.run()) break;
    
    // OK clicked
    // read data
    layerDivID = dialog.views['layerDivID'].stringValue()+""

    // check data
    if(false){
      continue
    }

    // save data    
    Settings.setLayerSettingForKey(layer, SettingKeys.LAYER_DIV_ID, layerDivID)

    break

  }
  dialog.finish()

};

