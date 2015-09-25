(function()
{
	var dom = fl.getDocumentDOM();

	if (!dom) return;

	var timeline = dom.getTimeline();
	var folderLayer = timeline.layers[0];
	
	var i, bitmapLayer, bitmap, frame;

	if (folderLayer.name == "vectors")
	{
		var undo = confirm("Unable to convert to bitmap because the first layers is already 'vectors'. Would you like to undo?");
		
		if (undo)
		{
			// Get the bitmap layer
			var bitmapIndex = timeline.layers.length - 1;
			bitmapLayer = timeline.layers[bitmapIndex];

			// Delete all the bitmaps
			for(i = 0; i < bitmapLayer.frames.length; i++)
			{
				frame = bitmapLayer.frames[i]
				if (frame.elements.length)
				{
					bitmap = frame.elements[0].libraryItem;
					dom.library.deleteItem(bitmap.name);
				}
			}	

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

	// Add a new bitmap layer above the copied layers
	var bitmapLayerIndex = origLength + 1;
	timeline.setSelectedLayers(bitmapLayerIndex);
	timeline.addNewLayer('bitmap', 'normal', true);
	bitmapLayer = timeline.layers[bitmapLayerIndex];

	var EMPTY = -1;
	var CONTENT = 0;
	var KEYFRAME = 1;

	// Select the contents of the original layers
	var status;
	var numFrames = timeline.frameCount;
	for(i = numFrames - 1; i >=0 ; --i)
	{
		timeline.currentFrame = i;

		// Check the status of the current frame
		// 0 = no keyframes
		// 1 = keyframes no elements
		// 2 = keyframes + elements
		status = frameStatus(bitmapLayerIndex + 1, i);

		// Current frame has no keyframes, no content
		if (status < KEYFRAME)
		{
			if (status == EMPTY)
			{
				timeline.setSelectedLayers(bitmapLayerIndex);
				timeline.insertBlankKeyframe();	
			}
			continue;
		}

		//ensure that there is a blank keyframe there to paste into
		selectFrame(bitmapLayerIndex, i);
		if (i > 0) timeline.insertBlankKeyframe(); // don't insert on the first frame

		// Copy all the frames and paste on the bitmap layer
		dom.selectAll();
		dom.clipCopy();
		selectFrame(bitmapLayerIndex, i);
		dom.clipPaste(true);

		// Convert the selection to a bitmap
		dom.convertSelectionToBitmap();

		//put selection on the bitmap layer
		// dom.selectNone();

		// Get the library item from the instance and rename it
		if (bitmapName)
		{
			bitmap = bitmapLayer.frames[i].elements[0].libraryItem;
			bitmap.name = numFrames > 1 ? bitmapName + (i+1) : bitmapName;
		}
	}

	// Delete the rest of the layers
	while(bitmapLayerIndex + 1 < timeline.layers.length)
	{
		timeline.deleteLayer(timeline.layers.length - 1);
	}

	function selectFrame(layer, frame)
	{
		// Select the current frame
		timeline.setSelectedLayers(layer);
		timeline.setSelectedFrames(frame, frame + 1);
	}

	// Function to check the current status of a frame
	// -1 = no content
	// 0 = content but no keyframe
	// 1 = keyframes + content
	function frameStatus(index, currentFrame)
	{
		var layer = timeline.layers[index];
		var status = -1; // empty
		var frame;
		while(layer)
		{
			// if (currentFrame >= layer.frameCount) continue;

			frame = layer.frames[currentFrame];

			// Has content on it
			if (frame && frame.elements.length)
			{
				status = 0;
				if (frame.startFrame == i)
				{
					status = 1;
					break;
				}
			}
			layer = timeline.layers[++index];
		}
		return status;
	}
	
}());