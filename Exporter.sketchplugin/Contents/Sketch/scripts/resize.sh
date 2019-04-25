#!/bin/bash
# This Export plugin script resizes all the images it finds in a folder and resizes them
# The resized image is placed in the /resized folder which will reside in the same directory as the image
#
# Usage: > ./batch_resize.sh IMG_FOLDER 

initial_folder="$1" # You can use "." to target the folder in which you are running the script for example
cd "$initial_folder"

rm -rf previews
mkdir previews
sips -Z 300 *.png --out previews/