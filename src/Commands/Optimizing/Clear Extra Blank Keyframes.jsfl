(function(){
	
	/**
	*  Command to remove extraneous blank keyframes
	*  @class ClearExtraBlankKeyframes
	*/
	var ClearExtraBlankKeyframes = function()
	{
		/**
		*  The cache of items that have already been searched
		*  @property {Array} objectsSearched
		*/
		this.objectsSearched = [];

		/**
		*  The total number of empty keyframes removed
		*  @property {int} totalRemoved
		*/
		this.totalRemoved = 0;

		this.initialize();
	};

	// Reference to the prototype
	var p = ClearExtraBlankKeyframes.prototype = {};

	/**
	*  Initialize
	*  @method initialize
	*/
	p.initialize = function()
	{
		var doc = fl.getDocumentDOM();

		if (!doc) 
		{
			alert("No document opened");
			return;
		}

		var curTimelines = doc.timelines;
		var i;

		// Search through the timelines of this document
		for(i = 0; i < curTimelines.length; ++i)
		{
			this.clearByTimeline(curTimelines[i]);
		}

		var libraryItems = doc.library.items;

		// Search through library items not put on stage
		for(i = 0; i < libraryItems.length; ++i)
		{
			this.searchLibraryItem(libraryItems[i]);
		}

		if (this.totalRemoved > 0)
		{
			alert("Cleared " + this.totalRemoved + " extra blank keyframe" + (this.totalRemoved > 1 ? "s" : ""));
		}
		else
		{
			alert("No extra blank keyframes cleared");
		}
	};

	/**
	*  Clear extra empty keyframes by a timeline
	*  @method clearByTimeline
	*  @param {Timeline} timeline The timeline to clear frames from
	*/
	p.clearByTimeline = function(timeline)
	{
		var j = 0,
			k = 0,
			l = 0,
			el,
			num,
			prevNum = -1,
			frm,
			layer,
			lyrVisibility;

		// cycle through each of the layers in this timeline
		for(j = 0; j < timeline.layers.length; ++j)
		{
			// cycle through each of the layers in this timeline
			layer = timeline.layers[j];

			// Ignore non-normal layers
			if (layer.layerType != "normal")
			{
				continue;
			}
			timeline.setSelectedLayers(j);
			
			// store the layer visibility and then make the layer visible. 
			// Elements cannot be found on invisible layers
			lyrVisibility = layer.visible;
			layer.visible = true;
			
			// Loop through the frames
			for(k = 0; k < layer.frames.length; )
			{
				// step through the frames on this layer
				frm = layer.frames[k];
				num = frm.elements.length;

				// Match empty keyframes
				if (num === 0)
				{
					// Previous keyframe has no elements and
					// there's no sound on this frame
					if (prevNum === 0 && !frm.soundLibraryItem && !frm.name)
					{
						timeline.clearKeyframes(k);
						this.totalRemoved++;
					}
				}
				else
				{
					for (l = 0; l < num; ++l)
					{
						// then cycle through the elements on this frame
						el = frm.elements[l];

						if (el.elementType == "instance")
						{
							// lets get the library item for this element
							this.searchLibraryItem(el.libraryItem);
						}
					}
				}
				prevNum = num;
				k += frm.duration;
			}
			prevNum = -1;
			
			// return this layer to its original visibility (optional)
			layer.visible = lyrVisibility;
		}
	};

	/**
	*  Search the library by item
	*  @method searchLibraryItem
	*  @param {LibraryItem} libItem The library item to search for
	*/
	p.searchLibraryItem = function(libItem)
	{
		var validSymbolTypes = ["graphic", "movie clip", "button"];

		// Ignore invalid symbol types
		if (!inObject(libItem.itemType, validSymbolTypes))
		{
			this.objectsSearched.push(libItem.name);
			return;
		}

		// only process new objects and not runtime shared-assets
		if ( !inObject(libItem.name, this.objectsSearched))
		{
			this.objectsSearched.push(libItem.name);
			
			if (libItem.timeline)
			{
				// if there is a timeline, repeat the scan as a recursion
				this.clearByTimeline(libItem.timeline);
			}
		}
	};

	/**
	*  utility function to check if a value is in an object or array
	*  @method inObject
	*  @private
	*  @static
	*  @param {*} needle The value to check
	*  @param {Object|Array} haystack The object to check in
	*  @param {Boolean} If the needle is in the haystack
	*/
	var inObject = function(needle, haystack)
	{
		for(var k in haystack )
		{
			if ( haystack[k] == needle ) { return true; }
		}
		return false;
	};

	// Run the command
	new ClearExtraBlankKeyframes();

}());