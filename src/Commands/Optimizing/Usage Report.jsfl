(function(){

	// Include the command library
	var dir = fl.scriptURI.split("/");
	dir = dir.slice(0,dir.length - 3).join("/");
	fl.runScript(dir + "/JSFLLibraries/Command.jsfl");

	/*
	*  This script parses all of the items inside of a Flash document (fla)
	*  and give a report of all the references.
	*  @class UsageReport
	*  @extends Command
	*/
	var UsageReport = function()
	{
		if (!this.getDOM()) return;

		/**
		*  The objects we've checked already
		*  @property {Array} objectsUsed
		*/
		this.objectsUsed = [];

		/**
		*  The output report
		*  @property {Array} output
		*/
		this.output = [];

		/**
		*  The valid type of symbols
		*  @property {Array} validTypes
		*/
		this.validTypes = ["movie clip","graphic","button"];

		/**
		*  The item we're searching for
		*  @property {Item} item
		*/
		this.item = null;
		
		var curTimelines = this.dom.timelines;
		var libraryItems = this.dom.library.items;
		
		// Clear the output window
		fl.outputPanel.clear();

		var items = this.dom.library.getSelectedItems();
		
		if (items.length != 1)
		{
			alert("Select a library item to start.");
			return;
		}

		// Get the library item
		this.item = items[0];
		
		// Search through the timelines of this document
		for(var i = 0; i < curTimelines.length; ++i)
		{
			this.searchInTimeline(curTimelines[i], "(Main Timeline)");
		}  

		// Search through library items not put on stage
		for(i = 0; i < libraryItems.length; ++i)
		{
			this.searchInItem(libraryItems[i]);
		}

		fl.trace("\nSearching for: " + this.item.name);
		fl.trace("Usages found: " + this.output.length + "\n\n");
		
		this.tableLayout(["Timeline", "Layer", "Frame"], this.output);
	};

	// Extend the command
	var p = UsageReport.prototype = new Command();

	/**
	*  The number of space to pad the report with
	*  @property {int} PADDING
	*  @final
	*  @readOnly
	*/
	UsageReport.PADDING = 4;

	/**
	*  Create a table layout
	*  @method tableLayout
	*  @param {Array} header The names of the headers
	*  @param {Array} entries The list of entries
	*/
	p.tableLayout = function(headers, entries)
	{
		var finalStr = "";
		var layout = [];
		
		// Set the minimum values
		for (i = 0; i < headers.length; ++i)
		{
			layout[i] = headers[i].length + UsageReport.PADDING;
		}
		
		// Measure the layout for prettier display
		for (i = 0; i < entries.length; ++i)
		{
			for(j = 0; j < layout.length; ++j)
			{
				layout[j] = Math.max(layout[j], String(entries[i][j]).length + UsageReport.PADDING);
			}
		}
		
		// Show the table headers
		var res = "";
		var total = 0;
		for (j = 0; j < layout.length; ++j)
		{
			res += this.fontLayout(headers[j], layout[j]);
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
				res += this.fontLayout(String(entries[i][j]), layout[j]);
			}
			finalStr += res + "\n";
		}
		
		finalStr += hr + "\n";
		
		fl.trace(finalStr);
	};

	/**
	*  For the table layout, add padding to a string
	*  @method fontLayout
	*  @param {String} str The string to layout
	*  @param {int} len The number of spaces to pad
	*  @return {String} The padded string
	*/
	p.fontLayout = function(str, len)
	{
		while(str.length < len)
		{
			str = str + " ";
		}
		return str;
	};

	/**
	*  Search for a library item within an item
	*  @method searchInItem
	*  @param {Item} libItem The item to search within
	*/
	p.searchInItem = function(libItem)
	{
		// Ignore shared runtime libraries
		if (!this.isCanvas && libItem.linkageImportForRS) return;

		// only process new objects and not runtime shared-assets
		if (this.validTypes.contains(libItem.itemType) && !this.objectsUsed.contains(libItem.name))
		{
			this.objectsUsed.push(libItem.name);
			
			if (libItem.timeline)
			{
				// if there is a timeline, repeat the scan as a recursion
				this.searchInTimeline(libItem.timeline, libItem.name);
			}
		}
	};

	/**
	*  Find the usage within a timeline
	*  @method searchInTimeline
	*  @param {Timeline} tLine THe time to look withint
	*  @param {String} timelineName The name of the timeline
	*/
	p.searchInTimeline = function(tLine, timelineName)
	{
		var j = 0;
		var k = 0;
		var l = 0;
		var el;
		var frm;
		var layer;
		var lyrVisibility;
		
		// cycle through each of the layers in this timeline
		for(j = 0; j < tLine.layers.length; ++j )
		{
			// cycle through each of the layers in this timeline
			layer = tLine.layers[j];
			
			// store the layer visibility and then make the layer visible. 
			// Elements cannot be found on invisible layers
			lyrVisibility = layer.visible;
			layer.visible = true;
			
			for(k = 0; k < layer.frames.length;)
			{
				// step through the frames on this layer
				frm = layer.frames[k];

				for (l = 0; l < frm.elements.length; ++l )
				{
					// then cycle through the elements on this frame
					el = frm.elements[l];
					
					// If the element is a text field, check the font face
					if (el.elementType == "instance")
					{
						if (el.libraryItem.name == this.item.name)
						{
							var entry = [];

							entry.push(timelineName);
							entry.push(layer.name);
							entry.push(k+1);

							this.output.push(entry);
						}
						else
						{
							this.searchInItem(el.libraryItem);
						}
					}
				}
				k += frm.duration;
			}
			// return this layer to its original visibility (optional)
			layer.visible = lyrVisibility;
		}
	};

	new UsageReport();

}());