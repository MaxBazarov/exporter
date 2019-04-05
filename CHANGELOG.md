# Change Log

##  Version 5.14.1 (5 Apr 2019)
- Executed autoscale on page switching

##  Version 5.14.0 (5 Apr 2019)
- Removed custom handling of "Space" key
- Changed rendering of fixed layes to fix many know issues

##  Version 5.13.2 (30 Mar 2019)
- Switched compression off by default
- Running compressing in sync

##  Version 5.13.1 (29 Mar 2019)
- Corrected compressor permissions
- Running compressing in async

##  Version 5.13.0 (29 Mar 2019)
- Added image compression

##  Version 5.12.0 (28 Mar 2019)
- Added "Show embed code" item to view menu (also available on "e" key)

##  Version 5.11.2 (27 Mar 2019)
- Fixed exporting
- Now custom artboard size is reseting after an exporting

##  Version 5.11.1 (25 Mar 2019)
- Fixed support for custom sizes

##  Version 5.11.0 (22 Mar 2019)
- Added custom height and width settings to Export HTML dialog (also it flatten fixed layers automatically)

##  Version 5.10.2 (18 Mar 2019)
- Improved auto-scale of modal dialogs in FireFox
- Stretched modal dialog shadow on full page

##  Version 5.10.1 (18 Mar 2019)
- Fixed auto-scale for FireFox

##  Version 5.10.0 (14 Mar 2019)
- Add ?embed to prototype URL to hide navigation and show "Scale" icon

##  Version 5.9.2 (13 Mar 2019)
- Improved Auto-Scale feature (thanks to Konstantin Smirnov for the new icon)
- Fixed Set External URL dialog

##  Version 5.9.1 (12 Mar 2019)
- Fixed support for shadow inside a fixed layer

##  Version 5.9.0 (11 Mar 2019)
- Added zooming of large pages (can be disabled in Plugin settings)

##  Version 5.8.1 (11 Mar 2019)
- Fixed rendering of direct link to modal dialog executed by overlay artboard link

##  Version 5.8.0 (1 Mar 2019)
- Overlays calling by hotspot inside a fixed layer also are showing with fixed position (configurable in Artboard Settings)

##  Version 5.7.3 (28 Feb 2019)
- Keep the only one overlay visible
- Hide overlay on primary artboard hide

##  Version 5.7.1 (27 Feb 2019)
- Fixed external links functionality

##  Version 5.7.0 (26 Feb 2019)
- Changed command line API [Description](https://github.com/MaxBazarov/exporter/blob/master/Hints.md#hint4)
- Added new overlay positions [Illustration](https://raw.githubusercontent.com/MaxBazarov/exporter/master/tests/Overlays/Overlay-Positions.png)

##  Version 5.6.0 (21 Feb 2019)
- Added command line API for exporting into HTML [Description](https://github.com/MaxBazarov/exporter/blob/master/Hints.md#hint4)

##  Version 5.5.0 (20 Feb 2019)
- Click outside hotspots highlights all hotspots for a short time
- Improved Path selector UI

##  Version 5.4.0 (15 Feb 2019)
- New ability to show overlay on mouse over [Example](https://github.com/MaxBazarov/exporter/tree/master/tests/OverlayOnMouseOver)
- New ability to align overlay on left, center or right side of source link

##  Version 5.3.2 (7 Feb 2019)
- Changed way to open HTML in browser

##  Version 5.3.1 (1 Feb 2019)
- Fixed issue with nested fixed layers
- Nowu user can specify unexistent folder as Destination Folder

##  Version 5.3.0 (30 Jan 2019)
- Added ability to setup autotransiton time less than 1 second (in form of 0.001)

##  Version 5.2.3 (29 Jan 2019)
- Fixed bugs

##  Version 5.2.2 (23 Jan 2019)
- Fixed bugs
- Added default left+top constrain for float layers

##  Version 5.2.1 (16 Jan 2019)
- Fixed bugs

##  Version 5.2.0 (14 Jan 2019)
- Fuzy logic for top/left fixed panel detection replaced by the new Layer Setting — Overlay Mode

##  Version 5.1.0 (11 Jan 2019)
New features:
- Added URLs for overlay arboards (user can bookmark a page with visible overlay)

##  Version 5.0.1 (9 Jan 2019)
Fixed bugs:
- The default page doesn't show images in full size

##  Version 5.0.0 (30 Dec 2018)
New features:
- Added ability to define any artboard as "Overlay" / Pictures: [One](https://raw.githubusercontent.com/MaxBazarov/exporter/master/tests/FixedLayers/Overlay1.png), [Two](https://raw.githubusercontent.com/MaxBazarov/exporter/master/tests/FixedLayers/Overlay2.png), [Three](https://raw.githubusercontent.com/MaxBazarov/exporter/master/tests/FixedLayers/Overlay3.png)
Fixed bugs:
- Crashes with "layer.slayer.style is undefined" if Export to JSON enabled

##  Version 4.6.0 (28 Dec 2018)
New features:
- Added Configure Layer command to specify layer <div> ID. It can be possible if you want to do some custom JS-based manipulations.
Fixed bugs:
- Expoter detects @MainBackground@ in wrong way

##  Version 4.5.1 (24 Dec 2018)
If some layer name contain @MainBackground@ substring then it's fill color will be used as browser page background (in case of unspecified Custom Background Color setting in Configure Document dialog). 
It can be useful if you have many Sketch files which are using a common background symbol and don't want to define Custom Background Color in the every Sketch file.

##  Version 4.5.0 (20 Dec 2018)
- Totally redesigned hotspots engine (moved from imagemap+jquery to plain DIVs)

##  Version 4.4.1 (15 Dec 2018)
- Bugfixing

##  Version 4.4.0 (13 Dec 2018)
- New plugin global and document local setting to select artboard sorting rule
- Show Exporting errors after the completion
- Ability to disable fixed layers in plugin settings
- Minor improvements

##  Version 4.3.1 (10 Dec 2018)
- Removed hotspot alt/title/hint
- Moved Exporting process to async process to don't freeze UI  (done partially)

##  Version 4.3.0 (4 Dec 2018)
- Added ability to enable page auto-transition (https://github.com/MaxBazarov/exporter/raw/master/tests/PageTransition.sketch)
- Excluded artboards with "External URL" enabled from exporting
- Changed float fixed panel image name generation to fix possible name collisitions

##  Version 4.2.0 (3 Dec 2018)
- Redesigned Export to HTML dialog
- Moved "Open in browser..."  checkbox from Plugin Settings to Export to HTML

##  Version 4.1.0 (30 Nov 2018)
- Added ability to compress PNG files before publishing
- Added artboard sorting by X position 
- Fixed wrong handling of resized symbol hotspots

##  Version 4.0.3 (29 Nov 2018)
- Minor fixes

##  Version 4.0.2 (29 Nov 2018)
- Minor fixes

##  Version 4.0.1 (27 Nov 2018)
- Supported arboards with non-unique names
- "Highlight hotlinks" current mode is common for all pages

##  Version 4.0.0 (26 Nov 2018)
- Redesigned support for layers with "fixed position during scrolling" option enabled (https://github.com/MaxBazarov/exporter/tree/master/tests/FixedLayers)
- Moved to modern jQuery and jQuery plugins

##  Version 3.4.3 (21 Nov 2018)
- Improved Esc key handling

##  Version 3.4.2 (16 Nov 2018)
- Fixed hotspot cursor view in Chrome
- Added exit on Espace key from overlay pages and Gallery

##  Version 3.4.1 (15 Nov 2018)
- Supported two fixed layer usage types (https://github.com/MaxBazarov/exporter/tree/master/tests/FixedLayers)
- Fixes

##  Version 3.4.0 (13 Nov 2018)
- Added plugin settting to disable hotspots highlighting
- Changed hotspot higlighting color
- Many internal improvements
- Fixed external URL artbords
- Totally improved image preloading
- Added image preloading process indicator
- Added limited support for "fixed position while scrolling" (https://github.com/MaxBazarov/exporter/tree/master/tests/FixedLayers)

##  Version 3.3.1 (2 Nov 2018)
- Rollbacked code to 3.2.0 (3.3.0 was too buggy)

##  Version 3.3.0 (1 Nov 2018)
- Added page images preloading
- Hide navigation global plugin setting can be overwritten for specific document

##  Version 3.2.0 (21 Oct 2018)
- Added artboard autoscroll to top (can be disable for some artboard in Configure Artboard)
- Experimental export into JSON (enable in Configure Plugin)

##  Version 3.1.0 (25 Oct 2018)
- Optimized Gallery (pre-generate preview images)

##  Version 3.0.0 (23 Oct 2018)
- Totally refactored hotspot calculation engine to support any Symbol properties overrides

## Version 2.0.1 ( 9 Oct 2018)
- Fixed publishing error handling

## Version 2.0.0 (5 Oct 2018)
- Added publishing

## Version 1.9.5 (4 Oct 2018)
- Workaround for Sketch 52

## Version 1.9.3 (1 Oct 2018)
- Corrected placeholder for version injection

## Version 1.9.2 (23 Sep 2018)
- Added Plugin setting to disable Navigation

## Version 1.9.1 (21 Sep 2018)
- Added command to export selected artboards

## Version 1.8.4 (19 Sep 2018)
- Fixed wrong handling of artboard name with double quote inside

## Version 1.8.3 (19 Sep 2018)
- Set External Link operation can handle multiply selected layers

## Version 1.8.2 (10 Sep 2018)
- Corrected alert messages (thanks to Ale Muñoz)

## Version 1.8.1 (31 Aug 2018)
- Navigation restyle
- Improved Gallery look-n-feel

## Version 1.7.2 (25 Aug 2018)
- Returned back "Export Retina Images" checkbox in Plugin Settings

## Version 1.7.1 (24 Aug 2018)
- Corrected Gallery icon behaviour

## Version 1.7.0 (23 Aug 2018)
- Reworked dialogs
- Added plugin log
- Fixed bugs
- Added experimental Gallery

## Version 1.6.5 (20 Aug 2018)
- Fixed issue with multi-group symbol
- Fixed issue with overided link to external artboard
