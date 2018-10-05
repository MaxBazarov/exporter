#!/bin/bash

ver="$1"
allMockupsFolder="$2"
docFolder="$3"
remoteFolder="$4"
docPathValue="$5"
mirror1="$6"
mirror2="$7"

docPathPlaceholder="P_P_P"
docVerPlaceholder="V_V_V"
storyVerPlaceholder='VERSION_INJECT=""'

tmpFolder="$(mktemp -d)/"

storyVerPlaceholderCode="VERSION_INJECT=' "

echo "$tmpFolder"

prepareMockups()
{	
	rm -rf "${tmpFolder}"*
	mkdir "$tmpFolder"$ver

	echo $tmpFolder$ver
	                

	# copy to version
	echo "-- prepare temp folder"
	cp -R "${allMockupsFolder}/${docFolder}/" "${tmpFolder}${ver}/"
	# inject version
	sed -i '' "s/${storyVerPlaceholder}/${storyVerPlaceholderCode}(v${ver})'/g" "${tmpFolder}${ver}/resources/viewer.js"	
	sed -i '' "s/${docPathPlaceholder}/${docPathValue}/g" "${tmpFolder}${ver}/resources/story.js"
	sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}${ver}/resources/story.js"	
	
	if [ "$skipLive" == "" ]; then
		# copy version to live
		cp -R "${allMockupsFolder}/${docFolder}/" "${tmpFolder}live"
        sed -i '' "s/${storyVerPlaceholder}/${storyVerPlaceholderCode}(v${ver})';/g" "${tmpFolder}live/resources/viewer.js"
		sed -i '' "s/${docPathPlaceholder}/${docPathValue}/g" "${tmpFolder}live/resources/story.js"
		sed -i '' "s/${docVerPlaceholder}/${ver}/g" "${tmpFolder}live/resources/story.js"

	fi
}

#arguments: remoteFolder (nextcp/ux-framework/providercp)
uploadReadyMockups()
{

	echo "-- publish to mirror1 site from ${tmpFolder}"
	rsync -r -v "$tmpFolder" "${mirror1}${remoteFolder}/"
	if [ "$mirror2" != "" ]; then
		echo "-- publish to mirror2 site"
		rsync -r -v  "$tmpFolder" "${mirror2}${remoteFolder}/"
	fi
} 

if [ "$ver" == "" ]; then
	if [ "$docFolder" == "" ]; then
		if [ "$remoteFolder" == "" ]; then
			echo "ERROR - not all arguments specified"
			echo "format: publish.sh VERSION ALLMOCKUPSFOLDER DOCFOLDER REMOTEFOLDER MIRROК1 MIRROR2"
			exit 1
		fi
	fi
fi

prepareMockups
uploadReadyMockups

