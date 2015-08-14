(function()
{
	var dom = fl.getDocumentDOM();

	if (!dom) return;

	var timeline = dom.getTimeline();
	var folderLayer = timeline.layers[0];

	if (folderLayer.name == "vectors")
	{
		var undo = confirm("Unable to convert to bitmap because the first layers is already 'vectors'. Would you like to undo?");
		
		if (undo)
		{
			// Get the bitmap layer
			var bitmapIndex = timeline.layers.length - 1;
			var bitmapLayer = timeline.layers[bitmapIndex];

			// Delete the bitmap
			var bitmap = bitmapLayer.frames[timeline.currentFrame].elements[0].libraryItem;
			dom.library.deleteItem(bitmap.name);

			// Delete the bitmap layer
			timeline.deleteLayer(bitmapIndex);

			// Delete the vectors layer
			folderLayer.visible = true;
			folderLayer.locked = false;
			folderLayer.layerType = "normal";
			timeline.deleteLayer(0);

			for (var i = timeline.layers.length - 1; i >= 0; i--)
			{
				timeline.layers[i].layerType = "normal";
			}
		}
		return;
	}

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

	// Select the contents of the original layers
	var frames = [];
	var newLength = timeline.layers.length;
	var startIndex = origLength + 1;

	for(i = startIndex; i < newLength; i++)
	{
		frames.push(i, timeline.currentFrame, 1);
	}

	timeline.setSelectedFrames(frames);
	dom.convertSelectionToBitmap();

	// Delete the rest of the layers
	for(i = startIndex + 1; i < newLength; i++)
	{
		timeline.deleteLayer(i);
	}

	// Update the name of the layer with the bitmap
	var bitmapLayer = timeline.layers[startIndex];
	bitmapLayer.name = "bitmap";

	// Get the library item from the instance
	var bitmap = bitmapLayer.frames[timeline.currentFrame].elements[0].libraryItem;

	// Ask to update the bitmap name
	var bitmapName = prompt("Image Name", bitmap.name);
	if (bitmapName)
	{
		bitmap.name = bitmapName;
	}
	
}());