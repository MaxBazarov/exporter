var  UIDialog_iconImage = null

class UIDialog {    

  static setUp(context){
    UIDialog_iconImage = NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path())
  }  

  constructor(title,rect,okButtonTitle,description='') { 
    var alert = NSAlert.alloc().init()
    alert.setIcon(UIDialog_iconImage)
    alert.setMessageText(title)
    if(description!=''){
        alert.setInformativeText(description)
    }
    alert.addButtonWithTitle(okButtonTitle)
    alert.addButtonWithTitle("Cancel")
    this.alert = alert

    var container = NSView.alloc().initWithFrame(rect)
    alert.setAccessoryView(container)
    this.container = container

    this.userClickedOK = false
    this.inputs = []

    this.y = NSHeight(rect)
    this.rect = rect
  }
  

  getNewFrame(height = 25,width=-1){
    var frame = NSMakeRect(0, this.y - height, width==-1?NSWidth(this.rect)-10:width,height)
    this.y-=height+10
    return frame
  }

  addLabel(text,height = 25) {    
    const label = NSTextField.alloc().initWithFrame(this.getNewFrame(height));
    label.setStringValue(text);   
    label.setBezeled(false);
    label.setDrawsBackground(false);
    label.setEditable(false);
    label.setSelectable(false);
    
    this.container.addSubview(label)
    return label
  }

  addCheckbox(id,label,checked,height = 25){
    checked = (checked == false) ? NSOffState : NSOnState;    
    
    const checkbox = NSButton.alloc().initWithFrame(this.getNewFrame(height));
    checkbox.setButtonType(NSSwitchButton);
    checkbox.setBezelStyle(0);
    checkbox.setTitle(label);
    checkbox.setState(checked);    

    this.container.addSubview(checkbox)
    this.inputs[id] = checkbox
    return checkbox
  }

  addTextBox(id,label,textValue,inlineHint="",height = 120){
    if(label!='') this.addLabel(label,17)    

    const textBox = NSTextField.alloc().initWithFrame(this.getNewFrame(height))
    textBox.setEditable(true)
    textBox.setBordered(true)
    textBox.setStringValue(textValue)
    if (inlineHint != "") {
      textBox.setPlaceholderString(inlineHint)
    }
    
    this.container.addSubview(textBox)
    this.inputs[id] = textBox

    return textBox  
  }

  addTextInput(id,label,textValue,inlineHint="", width=220){
    if(label!='') this.addLabel(label,17)    

    const input = NSTextField.alloc().initWithFrame(this.getNewFrame(20,width))
    input.setEditable(true)
    input.setBordered(true)
    input.setStringValue(textValue)
    if (inlineHint != "") {
      input.setPlaceholderString(inlineHint)
    }
    
    this.container.addSubview(input)
    this.inputs[id] = input

    return input  
  }


  addComboBox(id,label,selectItem, options, width=100){
    if(label!='') this.addLabel(label,15)

    const v = NSPopUpButton.alloc().initWithFrame(this.getNewFrame(20,width));    
    v.addItemsWithTitles(options)
    v.selectItemAtIndex(selectItem)

    this.container.addSubview(v)
    this.inputs[id] = v
    return v
  } 

  addHint(label,height = 30){
    this.y += 7

    const hint = NSTextField.alloc().initWithFrame(this.getNewFrame(height));
    hint.setStringValue(label);
    //label.setFont(NSFont.systemFontOfSize(fontSize));
    hint.setBezeled(false);
    hint.setDrawsBackground(false);
    hint.setEditable(false);
    hint.setSelectable(false);
    hint.setFont(NSFont.systemFontOfSize(10))

    this.container.addSubview(hint)    
    return hint
  }


  run(){
    if (this.alert.runModal() == '1000') {
        this.userClickedOK  = true           
    }

    return this.userClickedOK
  }

  finish(){
    this.alert = null
  }

}
