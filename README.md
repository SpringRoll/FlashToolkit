# SpringRoll Flash Toolkit

Adobe Flash Professional CC 2014 Commands for Exporting, Optimizing and Publish HTML5 Canvas document. While these commands are exclusive to using SpringRoll, there are a couple helper function for use with certain SpringRoll features.

## Installation

Install **bin/FlashToolkit.zxp** with the Adobe Extension Manager.

## Usage

All the scripts are runable from the Commands menu within Flash Professional.

### Exporting/Export BitmapMovieClip

Create JSON and spritesheet useable for `springroll.easeljs.BitmapMovieClip`

### Exporting/Export Frame Label Sequence

Export a sequence of PNGs based on the frame labels. Useful if you're creating spritesheets using TexturePacker. 

### Optimizing/Clear Extra Blank Keyframe

Remove all redundant clear keyframes on the current timeline.

### Optimizing/Filter Finder

Generate a report of all the MovieClips within the current project which contain filters (Color transforms, Drop shadows, etc). This is useful for tracking down and remove filters which harm performance. 

### Optimizing/HTML5 Canvas Size Report

Generate a report of the output size of all the assets in an HTML5 Canvas published document.

### Optimizing/Optimize Graphics

Remove all unused graphic frame from a selected graphic symbol in the library. 

### Optimizing/Optimize Keyframe

Reduce the number of keyframes by eliminating keyframes that are similar. 

### Timeline/Animation Event Label

Create animation event labels on the timeline which work with `springroll.easeljs.Animator`.

### HTML5 Canvas Post Publish

This is not a command. This script automatically is invoked whenever an HTML5 Canvas FLA is published. It does two things: first, a JSON file is created of the `lib.properties` (which contains the manifest, size, framerate, etc) of the current document. Also, the output file is optimize to better work with a JavaScript minification tool (e.g., [Uglify](https://github.com/mishoo/UglifyJS2)).

## License

Copyright (c) 2015 [CloudKid](https://github.com/cloudkidstudio)

Released under the MIT License.