(function(){
	
	/**
	*  This script parses all of the items inside of a Flash document (fla)
	*  and alerts the user to replace the font face with something else.
	*  @class FilterFinder
	*/
	var FilterFinder = function()
	{
		var doc = fl.getDocumentDOM();

		// Check for document
		if (!doc) return;

		/** 
		*  Collection of the library item names used to keep track of what we've already searched
		*  @property {Array} objectsUsed
		*  @private
		*/
		this.objectsUsed = [];
		
		/**
		*  The output result 
		*  @property {Array} output
		*  @private
		*/
		this.output = [];

		var i;
		var curTimelines = doc.timelines;
		var libraryItems = doc.library.items;

		this.isCanvas = doc.type == "htmlcanvas";
		
		// Create the headers
		var headers = [
			'symbol',
			'timeline',
			'layer',
			'frame',
			'filters',
			'colorized'
		];

		// Clear the output window
		fl.outputPanel.clear();

		// Search through the timelines of this document
		for (i = 0; i < curTimelines.length; ++i)
		{
			this.findFilters(curTimelines[i], "(Main Timeline)");
		}  

		// Search through library items not put on stage
		for (i = 0; i < libraryItems.length; ++i)
		{
			this.searchLibraryItem(libraryItems[i]);
		}

		// Check for no finds
		if (this.output.length < 1)
		{
			alert("Document contains no filters or colorizations.");
			return;
		}

		fl.trace("\nINSTANCE FILTERS");
		fl.trace(this.tableLayout(headers, this.output));
	};
	
	// Save the prototype
	var p = FilterFinder.prototype;
	
	/** 
	*  The amount of padding in the output report 
	*  @property {int} PADDING
	*  @static
	*  @readOnly
	*  @default 4
	*/
	var PADDING = 4;

	/**
	*  Generate an ASCII table
	*  @method tableLayout
	*  @private
	*  @param {Array} header Collection of header labels
	*  @param {Array} entries Collection of array entries
	*  @return {String} The full ASCII table
	*/
	p.tableLayout = function(headers, entries)
	{
		var finalStr = "";

		// How wide each column is
		var layout = [];

		// Set the minimum values
		for (i = 0; i < headers.length; ++i)
		{
			layout[i] = headers[i].length + PADDING;
		}

		// Measure the layout for prettier display
		for (i = 0; i < entries.length; ++i)
		{
			for (j = 0; j < layout.length; ++j)
			{
				layout[j] = Math.max(layout[j], String(entries[i][headers[j]]).length + PADDING);
			}
		}

		// Show the table headers
		res = "";
		var total = 0;
		for (j = 0; j < layout.length; ++j)
		{
			var th = headers[j];
			res += fontLayout(th[0].toUpperCase() + th.substr(1), layout[j]);
			total += layout[j];
		}
		finalStr += res + "\n";

		// Place a divider
		var hr = "";
		for (i = 0; i < total; ++i)
		{
			hr += "-";
		}	

		finalStr += hr + "\n";

		// Prep the entries
		for (i = 0; i < entries.length; ++i)
		{
			res = "";
			for (j = 0; j < layout.length; ++j)
			{
				res += fontLayout(String(entries[i][headers[j]]), layout[j]);
			}
			finalStr += res + "\n";
		}

		finalStr += hr + "\n";
		return "\n" + finalStr;
	};

	/**
	*  Prepend string with text based on a fixed length
	*  @method fontLayout
	*  @param {String} str THe string to pad
	*  @param {int} len The length of the output string
	*/
	var fontLayout = function(str, len)
	{
		while(str.length < len)
		{
			str = str + " ";
		}
		return str;
	};

	/**
	*  Find a text fields on a timeline
	*  @method findFilters
	*  @param {Timeline} tLine The flash Timeline object
	*  @param {String} timelineName The name of the timeline for reporting
	*/
	p.findFilters = function(tLine, timelineName)
	{
		var j = 0;
		var k = 0;
		var l = 0;
		var el;
		var frm;
		var layer;
		var lyrVisibility;

		// cycle through each of the layers in this timeline
		for (j = 0; j < tLine.layers.length; ++j )
		{
			// cycle through each of the layers in this timeline
			layer = tLine.layers[j];

			// store the layer visibility and then make the layer visible. 
			// Elements cannot be found on invisible layers
			lyrVisibility = layer.visible;
			layer.visible = true;

			//fl.trace("layer is : '"+layer.name+"'");
			for (k = 0; k < layer.frames.length;)
			{
				// step through the frames on this layer
				frm = layer.frames[k];

				for ( l = 0; l < frm.elements.length; ++l )
				{
					// then cycle through the elements on this frame
					el = frm.elements[l];

					// If the element is a text field, check the font face
					if (el.elementType == "instance" && el.instanceType == "symbol")
					{
						var colorized = el.colorMode != "none" && el.colorMode != "alpha";
						var filters = el.filters ? el.filters.length : 0;
						if (filters > 0 || colorized)
						{
							this.output.push({
								symbol: el.libraryItem.name,
								timeline: timelineName,
								layer: layer.name,
								frame: k + 1,
								filters: filters,
								colorized: colorized
							});
						}
						
						// lets get the library item for this element
						this.searchLibraryItem(el.libraryItem);
					}
				}
				// Go to the next keyframe
				k += frm.duration; 
			}
			// return this layer to its original visibility (optional)
			layer.visible = lyrVisibility;
		}
	};

	/**
	*  Search for fonts within a library item
	*  @searchLibraryItem
	*  @param {Item} libItem The library item
	*/
	p.searchLibraryItem = function(libItem)
	{
		var validTypes = ["movie clip","graphic","button"];
		var runtimeShared = !this.isCanvas && libItem.linkageImportForRS;

		// only process new objects and not runtime shared-assets
		if ( validTypes.contains(libItem.itemType) && 
			!this.objectsUsed.contains(libItem.name) && 
			!runtimeShared)
		{
			this.objectsUsed.push(libItem.name);

			// get the timeline of this library symbol
			libTLine = libItem.timeline;

			if (libTLine)
			{
				// if there is a timeline, repeat the scan as a recursion
				this.findFilters(libTLine, libItem.name);
			}
		}
	};

	/**
	*  See if an array contains a value
	*  @method contains
	*  @param {mixed} needle The value to check for
	*/
	Array.prototype.contains = function(needle)
	{
		for(var k in this)
		{
			if (this[k] == needle) { return true; }
		}
		return false;
	};
	
	new FilterFinder();
	
}());