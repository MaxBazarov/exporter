@import "lib/uidialog.js";
@import "lib/utils.js";
@import "constants.js";


var onRun = function (context) {
    const sketch = require('sketch')
    const Settings = require('sketch/settings')
    const document = sketch.fromNative(context.document)
    const selection = document.selectedLayers

    UIDialog.setUp(context);

    // We need the only one artboard
    if (selection.length != 1 || selection.layers[0].type != 'Artboard') {
        const UI = require('sketch/ui')
        UI.alert("Alert", "Select a single artboard.")
        return
    }
    const artboard = selection.layers[0]

    // Read configuration
    const enabledModal = Settings.layerSettingForKey(artboard, SettingKeys.LEGACY_ARTBOARD_MODAL) == 1
    const enabledModalShadow = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_MODAL_SHADOW) == 1
    const enableAutoScroll = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL) != 1

    let transNextSecs = Settings.layerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS)
    if (undefined == transNextSecs) transNextSecs = ""

    let artboardType = Settings.layerSettingForKey(artboard,SettingKeys.ARTBOARD_TYPE)
    if (artboardType == undefined || artboardType == "") {
        if (enabledModal) // take legacy settings
            artboardType = Constants.ARTBOARD_TYPE_MODAL
        else
            artboardType = 0
    }


    //
    const dialog = new UIDialog("Artboard Settings", NSMakeRect(0, 0, 300, 280), "Save", "Configure exporting options for the selected artboard. ")

    dialog.addComboBox("artboardType","Artboard Type", artboardType,["Regular page","Modal Dialog","External URL Page","Overlay"],250)
    /*
    dialog.addCheckbox("enable_overlay","Enable overlay", enabledModal)
    dialog.addHint("Determines whether artboard will be shown as an overlay over a previous artboard.")
    */

    dialog.addCheckbox("enable_shadow", "Show modal shadow", enabledModalShadow)
    dialog.addHint("Dim a previous artboard to set visual focus on an modal.")

    dialog.addCheckbox("enableAutoScroll", "Scroll browser page to top", enableAutoScroll)
    dialog.addHint("The artboard will be scrolled on top after showing")

    dialog.addTextInput("transNextSecs", "Delay for autotranstion to next screen (Secs)", transNextSecs, '', 60)
    dialog.addHint("Go to the next page auto the delay (0..60 secs)")

    //
    while (true) {
        // Cancel clicked
        if (!dialog.run()) break;

        // OK clicked
        // read data
        transNextSecs = dialog.views['transNextSecs'].stringValue() + ""

        // check data
        if (transNextSecs != '' && isNaN(transNextSecs)) {
            continue
        }

        // save data
        Settings.setLayerSettingForKey(artboard,SettingKeys.ARTBOARD_TYPE, dialog.views['artboardType'].indexOfSelectedItem())    
        Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_MODAL_SHADOW, dialog.views['enable_shadow'].state() == 1)
        Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_DISABLE_AUTOSCROLL, dialog.views['enableAutoScroll'].state() != 1)
        Settings.setLayerSettingForKey(artboard, SettingKeys.ARTBOARD_TRANS_TO_NEXT_SECS, transNextSecs)

        break

    }
    dialog.finish()

};

