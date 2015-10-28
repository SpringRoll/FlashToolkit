(function()
{
	var doc = fl.getDocumentDOM();

	if (!doc) return;

	if (!doc.selection.length)
	{
		return alert("Select symbol to get scale for");
	}

	fl.outputPanel.clear();

	var element = doc.selection[0];
	var scaleX = element.scaleX;
	var scaleY = element.scaleY;

	var timeline = doc.getTimeline();
	var libraryItem = timeline.libraryItem;

	while(libraryItem)
	{
		// Go "up" a nested level
		doc.exitEditMode();

		// Get the new timeline
		timeline = doc.getTimeline();

		var foundItem = false;
		for(var i = 0; i < timeline.layers.length; i++)
		{
			var frame = timeline.layers[i].frames[timeline.currentFrame];
			for(var j = 0; j < frame.elements.length; j++)
			{
				var element = frame.elements[j];
				if (element.libraryItem == libraryItem)
				{
					scaleX *= element.scaleX;
					scaleY *= element.scaleY;
					foundItem = true;
					continue;
				}
			}
		}
		if (!foundItem)
		{
			break;
		}
		libraryItem = timeline.libraryItem;
	}

	// Do a little rounding
	scaleX = Math.round(scaleX * 100000) / 100000;
	scaleY = Math.round(scaleY * 100000) / 100000;

	// Show the final scale
	if (Math.abs(scaleX - scaleY) <= 0.001)
	{
		fl.trace("Global Scale " + (scaleX * 100) + "% (copied to clipboard)");
		fl.clipCopyString(scaleX + "");
	}
	else
	{
		fl.trace("Global Scale [x: " + scaleX + ", y: " + scaleY + "]");
	}

}());