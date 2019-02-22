@import("constants.js")
@import("lib/utils.js")
@import("lib/uidialog.js")

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
		
		this.allMockupsdDir = this.Settings.settingForKey(SettingKeys.PLUGIN_EXPORTING_URL)		
		this.compressToolPath = this.Settings.settingForKey(SettingKeys.PLUGIN_COMPRESS_TOOL_PATH)		
	}


	log(msg){
		//log(msg)
	}	

	publish(){

        this.readOptions()

        // Show UI
        if(!this.context.fromCmd){
            while(true){
                if(!this.askOptions()) return false		
                if(this.checkOptions()) break
            }
        }

		let version = this.ver
		let destFolder = this.remoteFolder

		// copy publish script
		if(!this.copyScript("publish.sh")){			
			return false
        }        
        
        // copy compress script
		if(this.doCompress){
			if(this.compressToolPath==undefined || this.compressToolPath==''){
				this.UI.alert('Error', "You need to setup a path to image compressing tool in plugin settings.")	
				return false
			}

			if(!this.copyScript("compress.sh")){			
				return false
			}
        }
        
        
		
		let docFolder =  this.doc.cloudName();
		let posSketch =  docFolder.indexOf(".sketch")
		if(posSketch>0){
			docFolder = docFolder.slice(0,posSketch)
		}		
		// copy compress script
		if(this.doCompress){
			const runResult = this.runCompressScript(this.allMockupsdDir,docFolder)
			if(!runResult.result){
				this.showOutput(runResult)
				return false
			}
		}

		// run publish script
		let commentsID = destFolder
		commentsID = Utils.toFilename(commentsID)
		const runResult = this.runPublishScript(version,this.allMockupsdDir,docFolder,destFolder,commentsID)				

        if(!this.context.fromCmd){
            // success
            if(runResult.result){
                // open browser
                if(this.siteRoot!=''){
                    const openURL = this.siteRoot + destFolder + "/"+version+"/index.html"
                    const openResult = Utils.runCommand('/usr/bin/open', [openURL])
                    
                    if(openResult.result){
                    }else{
                        UI.alert('Can not open HTML in browser', openResult.output)
                    }
                }
            }

            this.showMessage(runResult)		
        }
		return true
	}

	showMessage(result){		
		if(result.result){
			this.UI.alert('Success',PublishKeys.SHOW_OUTPUT?result.output:'Mockups published!')
		}else{
			this.showOutput(result)
		}
	}

	showOutput(result){		
		if(result.result) return true
		this.UI.alert('Error', result.output)		
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
    

    readOptions(){
        // read current version from document settings
        let Settings = this.Settings
        
		this.ver =  Settings.documentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_VERSION)
        if(this.ver==undefined || this.ver==null) this.ver = '1'
        
		this.login =  Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN)
		if(this.login==undefined || this.login==null) this.login = ''
        
        this.siteRoot =  Settings.settingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT)
        if(this.siteRoot==undefined || this.siteRoot==null) this.siteRoot = ''
        
		this.remoteFolder =  Settings.documentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_REMOTE_FOLDER)
        if(this.remoteFolder==undefined || this.remoteFolder==null) this.remoteFolder = ''	
        
		this.doCompress =  Settings.documentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_COMPRESS)==1

    }

	askOptions(){
        let Settings = this.Settings
        
        // show dialod        
		const dialog = new UIDialog("Publish HTML",NSMakeRect(0, 0, 400, 340),"Publish","Generated HTML will be uploaded to external site by SFTP.")
		
		dialog.addTextInput("version","Version", this.ver,'1')  	  	
		dialog.addHint("versionHint","Exporter will publish two HTML sets - live and <version>")

		dialog.addTextInput("remoteFolder","Remote Site Folder", this.remoteFolder,'myprojects/project1',350)  
		dialog.addHint("remoteFolderHint","Relative path on server")

		dialog.addCheckbox("doCompress","Compress Images", this.doCompress)
  		dialog.addHint("doCompressHint","Compress PNG imaged before publishing (see Plugin Settings)")

		dialog.addTextInput("login","SFTP Login", this.login,'html@mysite.com:/var/www/html/',350)  
		dialog.addHint("loginHint","SSH key should be uploaded to the site already")

		dialog.addTextInput("siteRoot","Site Root URL (Optional)", this.siteRoot,'http://mysite.com',350)  
		dialog.addHint("siteRootHint","Specify to open uploaded HTML in web browser automatically")

		
	  
		if(dialog.run()){			
			this.login = dialog.views['login'].stringValue()+""
			Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_LOGIN,this.login )    

			this.siteRoot = dialog.views['siteRoot'].stringValue()+""
			Settings.setSettingForKey(SettingKeys.PLUGIN_PUBLISH_SITEROOT,this.siteRoot )    

			this.remoteFolder = dialog.views['remoteFolder'].stringValue()+""
			Settings.setDocumentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_REMOTE_FOLDER,this.remoteFolder )    

			this.doCompress = dialog.views['doCompress'].state() == 1
			Settings.setDocumentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_COMPRESS,this.doCompress)    	

			// save new version into document settings
			let ver =  dialog.views['version'].stringValue()+""
			this.ver = parseInt(ver)+""
			Settings.setDocumentSettingForKey(this.doc,SettingKeys.DOC_PUBLISH_VERSION, (parseInt(ver)+1)+"")

		  return true
		}
		return false

	
	}

	runPublishScript(version, allMockupsdDir, docFolder, remoteFolder,commentsID){
		let args = [version,allMockupsdDir, docFolder, remoteFolder,commentsID]
		args.push(this.login)
		//args.push(Constants.MIRROR2)
		return this.runScriptWithArgs("publish.sh",args)		
	}

	runCompressScript(allMockupsdDir, docFolder){
		let args = [allMockupsdDir+"/"+docFolder+"/images",this.compressToolPath ]
		return this.runScriptWithArgs("compress.sh",args)		
	}

	runScriptWithArgs(scriptName,args){				
		const scriptPath = this.allMockupsdDir + "/" + scriptName
		args.unshift(scriptPath) // add script itself as a first argument
		const res =  Utils.runCommand('/bin/bash', args)				

		// delete script
		Utils.deleteFile(scriptPath)

		return res
	}


	copyScript(scriptName) {    

		const scriptPath = this.allMockupsdDir + "/" + scriptName

	    const fileManager = NSFileManager.defaultManager()
	    const resFolder = PublishKeys.RESOURCES_FOLDER
	    const targetPath = scriptPath

	    // delete old copy
        Utils.deleteFile(targetPath)
                
        let sourcePath = this.context.plugin.url().URLByAppendingPathComponent("Contents").URLByAppendingPathComponent("Sketch").URLByAppendingPathComponent(resFolder).URLByAppendingPathComponent(scriptName)
		let error = MOPointer.alloc().init()
	    
	    if (!fileManager.copyItemAtPath_toPath_error(sourcePath, targetPath, error)) {
            log("copyScript(): Can't copy '"+sourcePath+"' to '"+targetPath+"'. Error: "+error.value().localizedDescription());)

			this.UI.alert('Can`t copy script', error.value().localizedDescription())
			return false
		 }
		
		 return true
	}
}
