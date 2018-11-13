@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function(context) {  
  const sketch = require('sketch')
  const Settings = require('sketch/settings') 
  const doc = context.document
  const document = sketch.fromNative(doc)

  UIDialog.setUp(context);

  let customHideNavigation = Settings.documentSettingForKey(doc,SettingKeys.DOC_CUSTOM_HIDE_NAV)
  if(customHideNavigation==undefined) customHideNavigation = 0
  
  //
  const dialog = new UIDialog("Document Settings",NSMakeRect(0, 0, 300, 100),"Save","Configure settings common for all document artboards. ")

  dialog.addComboBox("customHideNavigation","Navigation", customHideNavigation,["Use plugin default setting","Visible","Hidden"],250)

  //
  if(dialog.run()){
    Settings.setDocumentSettingForKey(doc, SettingKeys.DOC_CUSTOM_HIDE_NAV, dialog.inputs['customHideNavigation'].indexOfSelectedItem())    
  }
  dialog.finish()

};

