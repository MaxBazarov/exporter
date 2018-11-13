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
  const hideNav = Settings.settingForKey(SettingKeys.PLUGIN_HIDE_NAV)==1
  const disableHotspots = Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS)==1
  const saveJSON = Settings.settingForKey(SettingKeys.PLUGIN_SAVE_JSON)==1

  /*Temporary disable, it's too experimental
  let commentsURL = Settings.settingForKey(SettingKeys.PLUGIN_COMMENTS_URL)
  if(commentsURL==undefined) commentsURL = ''*/
  let googleCode = Settings.settingForKey(SettingKeys.PLUGIN_GOOGLE_CODE)
  if(googleCode==undefined) googleCode = ''


  //
  const dialog = new UIDialog("Plugin Settings",NSMakeRect(0, 0, 300, 340),"Save","Edit settings which are common for all documents.")

  dialog.addComboBox("position","Artboards Aligment", position,["Default (Top)","Top","Center"],150)
  dialog.addHint("Specify how artboard will be aligned in browser page")

  dialog.addCheckbox("open","Open generated HTML in browser", !dontOpen)
  dialog.addCheckbox("retina","Export Retina images", !dontRetina)
  dialog.addCheckbox("hidenav","Show navigation", !hideNav)
  dialog.addCheckbox("disableHotspots","Highlight hotspots on mouse over", !disableHotspots)
  dialog.addCheckbox("savejson","Dump layers into JSON file", saveJSON)

  dialog.addTextInput("googleCode","Google Code", googleCode,'e.g. UA-XXXXXXXX-X')  

  /*Temporary disable, it's too experimental
  dialog.addTextInput("comments","Comments URL (Experimental)", commentsURL)
  */
  
  if(dialog.run()){
    Settings.setSettingForKey(SettingKeys.PLUGIN_POSITION, dialog.inputs['position'].indexOfSelectedItem())
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_OPEN_BROWSER, dialog.inputs['open'].state() != 1)    
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES, dialog.inputs['retina'].state() != 1) 
    /*Temporary disable, it's too experimental
    Settings.setSettingForKey(SettingKeys.PLUGIN_COMMENTS_URL, dialog.inputs['comments'].stringValue()+"")*/
    Settings.setSettingForKey(SettingKeys.PLUGIN_GOOGLE_CODE, dialog.inputs['googleCode'].stringValue()+"")    
    Settings.setSettingForKey(SettingKeys.PLUGIN_HIDE_NAV, dialog.inputs['hidenav'].state() != 1)     
    Settings.setSettingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS, dialog.inputs['disableHotspots'].state() != 1)     
    Settings.setSettingForKey(SettingKeys.PLUGIN_SAVE_JSON, dialog.inputs['savejson'].state() == 1)     
  }
  dialog.finish()

};

