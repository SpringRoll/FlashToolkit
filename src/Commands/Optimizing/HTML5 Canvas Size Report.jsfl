(function(){

	/**
	 * Generate a filesize report for HTML Canvas FLAs
	 * @class  FilesizeReport
	 */
	var FilesizeReport = function()
	{
		var dom = fl.getDocumentDOM();

		if (!dom)
		{
			alert("No document opened");
			return;
		}

		// Check for canvas
		if (dom.type != "htmlcanvas")
		{
			alert("Only works with HTML Canvas FLA documents");
			return;
		}

		// Make sure FLA is saved
		if (!dom.pathURI)
		{
			alert("Must save the document first");
			return;
		}

		// The folder URI
		this.folder = dirname(dom.pathURI);

		// If the FLA is uncompressed use the parent
		// folder for relative publish pathing
		if (/\.xfl$/i.test(dom.pathURI))
		{
			this.folder = dirname(this.folder);
		}

		// Add the trailing slash
		this.folder += "/";

		// Clear output
		fl.outputPanel.clear();

		// We need to get some information from the publish profile
		// this includes the path to the images, the libs namespace
		// and the export file name
		var profile = dom.exportPublishProfileString(),
			xml = new XML(profile),
			properties = xml.PublishProperties,
			name;

		for (var i = 0, len = properties.length(); i < len; i++)
		{
			name = properties[i].attribute('name');
			if (name == "JavaScript/HTML")
			{
				var props = properties.Property;
				var filename;
				var libNS;

				for (var j = 0, l = props.length(); j < l; j++)
				{
					name = props[j].attribute('name');

					if (name == "filename") filename = props[j];
					if (name == "libNS") libNS = props[j];
				}

				// Save the publis file contents
				this.publishFile = FLfile.read(this.folder + filename);

				if (!FLfile.exists(this.folder + filename))
				{
					alert("Publish the FLA before running.");
					return;
				}
				var assets = this.assetReport(filename, libNS);
				var media = this.mediaReport(filename);

				logTitle("SUMMARY");

				fl.trace(this.tableLayout([
					{
						type: "JavaScript Library Assets",
						size: filesize(this.totalSize)
					},
					{
						type: "JavaScript Overhead",
						size: filesize(this.assetSize - this.totalSize)
					},
					{
						type: "Number of Library Assets",
						size: this.numAssets
					},
					{
						type: "External Media Files",
						size: filesize(this.mediaSize)
					},
					{
						type: "Total JavaScript & External",
						size: filesize(this.mediaSize + this.assetSize)
					}], ['type', 'size'])
				);
				

				logTitle("JAVASCRIPT LIBRARY ASSETS");
				fl.trace(assets);

				logTitle("EXTERNAL MEDIA FILES");
				fl.trace(media);

				return;
			}
		}
		alert("Unable to find an HTML publishing target");
	};

	// Reference to the prototype
	var p = FilesizeReport.prototype;

	/**
	 * Generate a filesize report of media (images/sounds)
	 * @method  mediaReport
	 * @param  {filename} filename   The relative or absolute path to export JS file
	 */
	p.mediaReport = function(filename)
	{
		this.mediaSize = 0;

		var parent = dirname(this.folder + filename);

		var manifestRegExp = /manifest\: (\[[\s\S]*?\])/m;
		var match = manifestRegExp.exec(this.publishFile);

		if (match)
		{
			eval("var manifest = " + match[1]); // jshint ignore:line

			if (manifest && manifest.length)
			{
				var report = [], file, src;
				for (var i = 0; i < manifest.length; i++)
				{
					file = manifest[i];
					src = parent + "/" + manifest[i].src;

					// Ignore files we can't find
					if (!FLfile.exists(src)) continue;

					var bytes = FLfile.getSize(src);

					report.push({
						file: file.src.substr(file.src.lastIndexOf("/") + 1),
						bytes: bytes,
						size: filesize(bytes)

					});
					this.mediaSize += bytes;
				}

				report.sort(sortByBytes);

				return this.tableLayout(report, ['file', 'size']);
			}
		}
		return "";
	};

	/**
	 * Generate a filesize report
	 * @method  assetReport
	 * @param  {filename} filename   The relative or absolute path to export JS file
	 * @param {string} libNS Libraries namespace
	 */
	p.assetReport = function(filename, libNS)
	{
		// Total file size of export
		var assetSize = FLfile.getSize(this.folder + filename);

		// Looking for something that starts with "(lib.* = function(*) {"
		// and ends with "p.nominalBounds = new cjs.Rectangle(*);" which
		// is the entire library asset.
		var assetRegExp = new RegExp("\\(" + libNS + "\\.([\\w\\d\\-]+) \\= function\\([\\w\\,]*\\) \\{[\\s\\S]*?p.nominalBounds \\= (null|new (cjs\\.)?Rectangle\\([\\-\\d\\.\\,]+\\))\\;", "gm");

		// Get just the name of the asset
		var assetNameRegExp = new RegExp("^\\(" + libNS + "\\.([\\w\\d\\-]+)");

		// Get the collection of matched assets
		var assets = this.publishFile.match(assetRegExp),
			report = [],
			totalSize = 0,
			bytes;

		for (var i = 0; i < assets.length; i++)
		{
			bytes = assets[i].length;
			totalSize += bytes;

			report.push({
				name: assetNameRegExp.exec(assets[i])[1],
				size: filesize(bytes),
				bytes: bytes,
				percent: percentage(bytes / assetSize)
			});
		}

		report.sort(sortByBytes);

		this.assetSize = assetSize;
		this.totalSize = totalSize;
		this.numAssets = assets.length;

		return this.tableLayout(report, ['name', 'size', 'percent']);
	};

	/**
	 * Get the director path from another path
	 * @method  dirname
	 * @private
	 * @param  {string} path The incoming path
	 * @return {string} The base parent folder
	 */
	function dirname(path)
	{
		return path.replace(/\\/g, '/')
		.replace(/\/[^\/]*\/?$/, '');
	}

	/**
	 * Sort function by the bytes size
	 * @method  sortByBytes
	 * @private
	 * @param  {object} a asset entry
	 * @param {object} b asset entry
	 * @return {int} Comparitor output
	 */
	function sortByBytes(a, b)
	{
		return a.bytes < b.bytes;
	}

	/**
	 * Convert a number to a percentage
	 * @method
	 * @private
	 * @param  {number} num A number from 0 - 1
	 * @return {string}     The percentage with % sign
	 */
	function percentage(num)
	{
		return Math.round(num * 10000) / 100 + "%";
	}

	/**
	 * Make a filesize in bytes readable
	 * @method filesize
	 * @private
	 * @param  {int} fileSizeInBytes The bytes
	 * @return {string} The readable filesize
	 */
	function filesize(fileSizeInBytes)
	{
		var i = -1;
		var byteUnits = [' kB', ' MB', ' GB', ' TB', 'PB', 'EB', 'ZB', 'YB'];
		do {
			fileSizeInBytes = fileSizeInBytes / 1024;
			i++;
		} while (fileSizeInBytes > 1024);
		return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
	}

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
	p.tableLayout = function(entries, headers)
	{
		var finalStr = "";
		var layout = {};
		var label;

		// Set the minimum values
		for (i = 0; i < headers.length; ++i)
		{
			label = headers[i];
			layout[label] = label.length + PADDING;
		}

		// Measure the layout for prettier display
		for (i = 0; i < entries.length; ++i)
		{
			for (label in layout)
			{
				if (label == "contains") continue;

				layout[label] = Math.max(
					layout[label],
					String(entries[i][label]).length + PADDING
				);
			}
		}

		// Show the table headers
		res = "";
		var total = 0;
		for (label in layout)
		{
			if (label == "contains") continue;
			res += fontLayout(label, layout[label]);
			total += layout[label];
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
			for (label in layout)
			{
				if (label == "contains") continue;
				res += fontLayout(String(entries[i][label]), layout[label]);
			}
			finalStr += res + "\n";
		}

		finalStr += hr + "\n";
		return "\n" + finalStr;
	};

	/**
	 * Trace out a title fancy style
	 * @method logTitle
	 * @private
	 * @param {string} str The title name
	 */
	var logTitle = function(str)
	{
		var hr = "";
		var size = str.length + PADDING;
		while(hr.length < size)
		{
			hr += "-";
		}

		fl.trace("\n+" + hr + "+");
		fl.trace("|  " + str + "  |");
		fl.trace("+" + hr + "+");
	};

	/**
	*  Prepend string with text based on a fixed length
	*  @method fontLayout
	*  @private
	*  @param {String} str The string to pad
	*  @param {int} len The length of the output string
	*  @return {string} The formatted output string
	*/
	var fontLayout = function(str, len)
	{
		while(str.length < len)
		{
			str = str + " ";
		}
		return str;
	};

	// Run command
	new FilesizeReport();

}());