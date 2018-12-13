@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function(context) {  
  const sketch = require('sketch')
  const Settings = require('sketch/settings') 
  const document = sketch.fromNative(context.document)
  const UI = require('sketch/ui')
  
  UIDialog.setUp(context);

  let position = Settings.settingForKey(SettingKeys.PLUGIN_POSITION)
  if(position==undefined || position=="") position = 0

  let sortRule = Settings.settingForKey(SettingKeys.PLUGIN_SORT_RULE)
  if(sortRule==undefined || sortRule=="") position = 0

  const dontRetina = Settings.settingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES)==1
  const hideNav = Settings.settingForKey(SettingKeys.PLUGIN_HIDE_NAV)==1
  const disableHotspots = Settings.settingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS)==1
  const saveJSON = Settings.settingForKey(SettingKeys.PLUGIN_SAVE_JSON)==1
  let compressPath =  Settings.settingForKey(SettingKeys.PLUGIN_COMPRESS_TOOL_PATH)
  if(compressPath==undefined) compressPath = ""

  /*Temporary disable, it's too experimental
  let commentsURL = Settings.settingForKey(SettingKeys.PLUGIN_COMMENTS_URL)
  if(commentsURL==undefined) commentsURL = ''*/
  let googleCode = Settings.settingForKey(SettingKeys.PLUGIN_GOOGLE_CODE)
  if(googleCode==undefined) googleCode = ''


  //
  const dialog = new UIDialog("Plugin Settings",NSMakeRect(0, 0, 300, 380),"Save","Edit settings which are common for all documents.")

  dialog.addComboBox("position","Artboards Aligment", position,["Default (Top)","Top","Center"],150)
  dialog.addHint("Specify how artboard will be aligned in browser page")

  dialog.addComboBox("sortRule","Artboards Sort Order", sortRule,Constants.SORT_RULE_OPTIONS,250)
  dialog.addHint("Specify how artboards will sorted in HTML story.")

  dialog.addCheckbox("retina","Export Retina images", !dontRetina)
  dialog.addCheckbox("hidenav","Show navigation", !hideNav)
  dialog.addCheckbox("disableHotspots","Highlight hotspots on mouse over", !disableHotspots)
  dialog.addCheckbox("savejson","Dump layers into JSON file", saveJSON)

  dialog.addTextInput("googleCode","Google Code", googleCode,'e.g. UA-XXXXXXXX-X')  
  dialog.addTextInput("compressPath","Image Compressing Tool ", compressPath,'e.g. /Applications/pngquant/pngquant')  

  /*Temporary disable, it's too experimental
  dialog.addTextInput("comments","Comments URL (Experimental)", commentsURL)
  */
  
  if(dialog.run()){
    Settings.setSettingForKey(SettingKeys.PLUGIN_POSITION, dialog.views['position'].indexOfSelectedItem())    
    Settings.setSettingForKey(SettingKeys.PLUGIN_SORT_RULE, dialog.views['sortRule'].indexOfSelectedItem())    
    Settings.setSettingForKey(SettingKeys.PLUGIN_DONT_RETINA_IMAGES, dialog.views['retina'].state() != 1) 
    /*Temporary disable, it's too experimental
    Settings.setSettingForKey(SettingKeys.PLUGIN_COMMENTS_URL, dialog.views['comments'].stringValue()+"")*/
    Settings.setSettingForKey(SettingKeys.PLUGIN_GOOGLE_CODE, dialog.views['googleCode'].stringValue()+"")  
    Settings.setSettingForKey(SettingKeys.PLUGIN_COMPRESS_TOOL_PATH, dialog.views['compressPath'].stringValue()+"")    
    Settings.setSettingForKey(SettingKeys.PLUGIN_HIDE_NAV, dialog.views['hidenav'].state() != 1)     
    Settings.setSettingForKey(SettingKeys.PLUGIN_DISABLE_HOTSPOTS, dialog.views['disableHotspots'].state() != 1)     
    Settings.setSettingForKey(SettingKeys.PLUGIN_SAVE_JSON, dialog.views['savejson'].state() == 1)     
  }
  dialog.finish()

};

