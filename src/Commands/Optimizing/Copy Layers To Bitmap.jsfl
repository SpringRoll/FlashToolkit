(function()
{
	var dom = fl.getDocumentDOM();

	if (!dom) return;

	var timeline = dom.getTimeline();
	var folderLayer = timeline.layers[0];
	
	var i, bitmapLayer, bitmap;

	if (folderLayer.name == "vectors")
	{
		var undo = confirm("Unable to convert to bitmap because the first layers is already 'vectors'. Would you like to undo?");
		
		if (undo)
		{
			// Get the bitmap layer
			var bitmapIndex = timeline.layers.length - 1;
			bitmapLayer = timeline.layers[bitmapIndex];

			// Delete the bitmap
			bitmap = bitmapLayer.frames[timeline.currentFrame].elements[0].libraryItem;
			dom.library.deleteItem(bitmap.name);

			// Delete the bitmap layer
			timeline.deleteLayer(bitmapIndex);

			// Delete the vectors layer
			folderLayer.visible = true;
			folderLayer.locked = false;
			folderLayer.layerType = "normal";
			timeline.deleteLayer(0);

			for (i = timeline.layers.length - 1; i >= 0; i--)
			{
				timeline.layers[i].layerType = "normal";
			}
		}
		return;
	}
	
	// Ask to update the bitmap name
	var bitmapName = prompt("Image Name", "");//bitmap.name);

	// The number of layers
	var origLength = timeline.layers.length;

	// Copy the current layers
	timeline.copyLayers(0, origLength - 1);

	// Create a new folder for the hidden, guided, locked vector layers
	var folderLayerIndex = timeline.addNewLayer('vectors', 'folder');

	// Make sure the folder is first
	timeline.reorderLayer(folderLayerIndex, 0);

	// Copy to the folder
	timeline.pasteLayers(0);

	// Guide out the child layers
	for(i = 1; i <= origLength; i++)
	{
		timeline.layers[i].layerType = "guide";
	}

	// Lock and hide all the vectors
	var parentLayer = timeline.layers[0];
	parentLayer.visible = false;
	parentLayer.locked = true;
	
	// Update the name of the layer with the bitmap
	var newLayerLength = timeline.layers.length;
	var bitmapLayerIndex = origLength + 1;
	bitmapLayer = timeline.layers[bitmapLayerIndex];
	bitmapLayer.name = "bitmap";

	// Select the contents of the original layers
	var numFrames = timeline.frameCount;
	for(i = 0; i < numFrames; ++i)
	{
		timeline.currentFrame = i;
		dom.selectAll();
		//if nothing is selected, then continue
		if(!dom.getSelectionRect())
			continue;
		//if we've selected an already converted bitmap, then continue
		if(dom.selection.length == 1 && dom.selection[0].instanceType == "bitmap")
			continue;
		//convert selection
		dom.convertSelectionToBitmap();
		//put selection on the bitmap layer
		dom.selectAll();
		dom.clipCut();
		timeline.setSelectedFrames([bitmapLayerIndex, i, i + 1]);
		//ensure that there is a blank keyframe there to paste into
		if(bitmapLayer.frameCount < i + 1 || bitmapLayer.frames[i].startFrame != i)
			timeline.insertBlankKeyframe();
		dom.clipPaste(true);
		// Get the library item from the instance and rename it
		if (bitmapName)
		{
			bitmap = bitmapLayer.frames[timeline.currentFrame].elements[0].libraryItem;
			bitmap.name = numFrames > 1 ? bitmapName + (i+1) : bitmapName;
		}
	}
	
	// Delete the rest of the layers
	for(i = bitmapLayerIndex + 1; i < newLayerLength; i++)
	{
		timeline.deleteLayer(i);
	}
	
}());