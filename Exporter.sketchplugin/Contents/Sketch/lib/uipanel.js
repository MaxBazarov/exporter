class UIPanel extends UIAbstractWindow {    

  constructor() { 
    let winRect = NSMakeRect(300, 500, 400, 270)
    let window = NSWindow.alloc().initWithContentRect_styleMask_backing_defer(winRect,NSWindowStyleMaskTitled|NSWindowStyleMaskFullSizeContentView,NSBackingStoreBuffered,true)

    let contRect = window.contentLayoutRect()
    
    super(window, contRect)
    window.setContentView(this.container)
  }


  show(){
    this.window.makeKeyAndOrderFront( this.window )
  }

  finish(){
    log('closing...')
    this.window.close()
    log('closed')
    this.window = null
  }

}
