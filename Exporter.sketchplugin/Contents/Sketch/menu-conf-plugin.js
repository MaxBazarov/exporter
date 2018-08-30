@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function(context) {  
  const sketch = require('sketch')
  const Settings = require('sketch/settings') 
  const document = sketch.fromNative(context.document)
  
  UIDialog.setUp(context);

  let position = Settings.settingForKey(SettingKeys.PLUGIN_POSITION)
  if(position==undefined || position=="") position = Constants.POSITION_DEFAULT

  const dontOpen = Settings.settingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER)==1
  const dontRetina = Settings.settingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES)==1
  let commentsURL = Settings.settingForKey(SettingKeys.PLUGIN_COMMENTS_URL)
  if(commentsURL==undefined) commentsURL = ''

  //
  const dialog = new UIDialog("Plugin Settings",NSMakeRect(0, 0, 300, 220),"Save","Edit settings which are common for all documents.")

  dialog.addComboBox("position","Artboards Aligment", position,["Default (Top)","Top","Center"],150)
  dialog.addHint("Specify how artboard will be aligned in browser page")

  dialog.addCheckbox("open","Open generated HTML in browser", !dontOpen)
  dialog.addCheckbox("retina","Export Retina images", !dontRetina)


  dialog.addTextInput("comments","Comments URL (Experimental)", commentsURL)
  //

  if(dialog.run()){
    Settings.setSettingForKey(SettingKeys.PLUGIN_POSITION, dialog.inputs['position'].indexOfSelectedItem())
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER, dialog.inputs['open'].state() != 1)    
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES, dialog.inputs['retina'].state() != 1) 
    Settings.setSettingForKey(SettingKeys.PLUGIN_COMMENTS_URL, dialog.inputs['comments'].stringValue()+"")    
    //log('new dontOpen:'+dialog.inputs['dontopen'].state())
  }
  dialog.finish()

};

