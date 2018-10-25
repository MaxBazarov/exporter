#!/bin/bash
# This Export plugin script resizes all the images it finds in a folder and resizes them
# The resized image is placed in the /resized folder which will reside in the same directory as the image
#
# Usage: > ./batch_resize.sh IMG_FOLDER 

initial_folder="$1" # You can use "." to target the folder in which you are running the script for example
resized_folder_name="previews"
destination_folder=$initial_folder"/"$resized_folder_name"/"
mkdir "$destination_folder"

## rezise regular images
all_images=$(find -E "$initial_folder" -maxdepth 1 -iname "*.png" ! -iname "*@2x.png")

while read -r image_full_path; do
    filename=$(basename "$image_full_path");
    destination_full_path=$destination_folder$filename;
    
    sips -Z 300 "$image_full_path" --out "$destination_full_path";

done <<< "$all_images"


## rezise retina images
all_images=$(find -E "$initial_folder" -maxdepth 1 -iname "*@2x.png")

while read -r image_full_path; do
    filename=$(basename "$image_full_path");
    destination_full_path=$destination_folder$filename;
    
    sips -Z 600 "$image_full_path" --out "$destination_full_path";

done <<< "$all_images"