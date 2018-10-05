@import("../constants.js")
@import("../lib/utils.js")
@import("../lib/uidialog.js")

class Publisher {
	constructor(context,doc) {    
	    this.doc = doc;	    
	    this.context = context;
		this.UI = require('sketch/ui')
		this.Settings = require('sketch/settings');

		this.login = ''
		this.siteRoot = ''
		this.ver = ''
		this.remoteFolder = ''
		
	    this.allMockupsdDir = this.Settings.documentSettingForKey(doc,SettingKeys.DOC_EXPORTING_URL)
	    this.scriptPath = this.allMockupsdDir + "/publish.sh"
	}

	log(msg){
		//log(msg)
	}	

	publish(){
		while(true){
			if(!this.askOptions()) return false		
			if(this.checkOptions()) break
		}

		let version = this.ver
		let destFolder = this.remoteFolder

		// prepare script
		if(!this.copyScript()){			
			return false
		}

		// run script
		let docFolder =  this.doc.cloudName();
		let posSketch =  docFolder.indexOf(".sketch")
		if(posSketch>0){
			docFolder = docFolder.slice(0,posSketch)
		}

		let commentsID = destFolder
		commentsID = Utils.toFilename(commentsID)
		const runResult = this.runScript(version,this.allMockupsdDir,docFolder,destFolder,commentsID)

		// open browser
		if(this.siteRoot!=''){
			const openURL = this.siteRoot + destFolder + "/"+version+"/index.html"
			const openResult = Utils.runCommand('/usr/bin/open', [openURL])
			
			if(openResult.result){
			}else{
			  UI.alert('Can not open HTML in browser', openResult.output)
			}
		  }


		// success
		this.showMessage(runResult)		
		return true
	}

	showMessage(result){		
		if(result.result){
			this.UI.alert('Success',PublishKeys.SHOW_OUTPUT?result.output:'Mockups published!')
		}else{
			this.UI.alert('Error', result.output)
		}
	}

	checkOptions(){
		if(this.ver==''){
			this.UI.alert('Error', 'Version should be specified')
			return false
		}
		if(this.login==''){
			this.UI.alert('Error', 'SFTP login should be specified')
			return false
		}
		if(this.remoteFolder==''){
			this.UI.alert('Error', 'Remote site folder should be specified')
			return false
		}
		return true
	}

	askOptions(){
		// read current version from document settings
		let Settings = this.Settings
		let ver =  Settings.documentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_VERSION)
		if(ver==undefined || ver==null) ver = '1'
		let login =  Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN)
		if(login==undefined || login==null) login = ''
		let siteRoot =  Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT)
		if(siteRoot==undefined || siteRoot==null) siteRoot = ''
		let remoteFolder =  Settings.documentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_REMOTE_FOLDER)
		if(remoteFolder==undefined || remoteFolder==null) remoteFolder = ''


		// show dialod
		const dialog = new UIDialog("Publish HTML",NSMakeRect(0, 0, 400, 340),"Publish","Generated HTML will be uploaded to external site by SFTP.")
		
		dialog.addTextInput("version","Version", ver,'1')  	  	
		dialog.addHint("Exporter will publish two HTML sets - live and <version>")

		dialog.addTextInput("remoteFolder","Remote Site Folder", remoteFolder,'myprojects/project1',350)  
		dialog.addHint("Relative path on server")

		dialog.addTextInput("login","SFTP Login", login,'html@mysite.com:/var/www/html/',350)  
		dialog.addHint("SSH key should be uploaded to the site already")

		dialog.addTextInput("siteRoot","Site Root URL (Optional)", siteRoot,'http://mysite.com',350)  
		dialog.addHint("Specify to open uploaded HTML in web browser automatically")

		
	  
		if(dialog.run()){			
			this.login = dialog.inputs['login'].stringValue()+""
			Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN,this.login )    

			this.siteRoot = dialog.inputs['siteRoot'].stringValue()+""
			Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT,this.siteRoot )    

			this.remoteFolder = dialog.inputs['remoteFolder'].stringValue()+""
			Settings.setDocumentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_REMOTE_FOLDER,this.remoteFolder )    


			// save new version into document settings
			ver =  dialog.inputs['version'].stringValue()+""
			this.ver = parseInt(ver)+""
			Settings.setDocumentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_VERSION, (parseInt(ver)+1)+"")

		  return true
		}
		return false

	
	}

	runScript(version, allMockupsdDir, docFolder, remoteFolder,commentsID){
		let args = [this.scriptPath,version,allMockupsdDir, docFolder, remoteFolder,commentsID]
		args.push(this.login)
		//args.push(Constants.MIRROR2)
		return Utils.runCommand('/bin/bash', args)		
	}


	copyScript() {    

	    const fileManager = NSFileManager.defaultManager()
	    const resFolder = PublishKeys.RESOURCES_FOLDER
	    const targetPath = this.scriptPath

	    // delete old copy
	    Utils.deleteFile(targetPath)
	    
	    const sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent(resFolder).path()+"/publish.sh"
		let error = MOPointer.alloc().init();
		
		this.log('sourcePath:'+sourcePath)
		this.log('targetPath:'+targetPath)
	    
	    if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
			this.UI.alert('Can`t copy script', error.value().localizedDescription())
			return false
		 }
		
		 return true
	}
}
