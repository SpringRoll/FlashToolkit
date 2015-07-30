(function(window)
{
	fl.addEventListener("postPublish", onPostPublish);

	function onPostPublish()
	{
		fl.showIdleMessage(false);
		postPublish();
		fl.showIdleMessage(true);
	}

	function postPublish()
	{
		// Get the current document
		var dom = fl.getDocumentDOM();
		
		// Ignore unsaved FLAs
		if (!dom.pathURI) return;

		// Check for canvas
		if (dom.type != "htmlcanvas") return;

		// The folder URI
		var folder = dirname(dom.pathURI);

		// If the FLA is uncompressed use the parent
		// folder for relative publish pathing
		if (/\.xfl$/i.test(dom.pathURI))
		{
			folder = dirname(folder);
		}

		// Add the trailing slash
		folder += "/";

		// Get the file name
		var filename = exportFile(dom);

		// No filename found
		if (!filename) return;

		var file = folder + filename;

		// Output file doesn't exist
		if (!FLfile.exists(file)) return;

		var content = FLfile.read(file);
		
		try
		{
			var empty = function(){};

			var createjs = {
				Container: empty,
				Bitmap: empty,
				MovieClip: empty,
				Shape: empty,
				Sprite: empty,
				Tween: empty,
				Rectangle: empty,
				Ease: empty
			};

			eval(content); // jshint ignore:line
		}
		catch(e)
		{
			fl.trace("error: " + e.message);
			alert("File was published improperly. Please quit Flash and try publishing again.");
			return;
		}

		// Extract the properties
		var regex = new RegExp("properties = [^;]+;", "gm");
		var result = regex.exec(content);
		if (result)
		{
			var properties;
			eval(String(result)); // jshint ignore:line
			FLfile.write(file + "on", stringify(properties));
			content = content.replace(/[\w]+\.properties = [^;]+;/gm, '');
		}

		content = classRef(content, "cjs.Shape");
		content = classRef(content, "cjs.Container");
		content = classRef(content, "cjs.Rectangle");
		content = classRef(content, "cjs.Tween");
		content = classRef(content, "cjs.Bitmap");
		content = classRef(content, "cjs.MovieClip");
		content = classRef(content, "cjs.Sprite");
		content = classRef(content, "cjs.Ease");

		var libItem = /\(([\w\d]+)\.[\w\d]+? \= function\(.*?\) \{([\s\S]+?)\}\)\.prototype \= p/gm;
		var libItems = content.match(libItem);

		if (libItems)
		{
			libItems.forEach(function(lib)
			{
				//var name = lib.substring(1, lib.indexOf(" ="));
				//fl.trace("Symbol " + name);
				var start = lib.indexOf('{') + 1;
				var end = lib.lastIndexOf('}');
				var libContent = lib.substring(start, end);
				var matches = libContent.match(/this\.([\w]+?) =/g);

				if (matches)
				{
					// add the var block at the beginning
					for(var id, i = 0; i < matches.length; i++)
					{
						id = matches[i].substr(5).replace(" =", '');
						libContent = "\n\tvar " + id + ";" + libContent;
						libContent = libContent.replace(
							new RegExp("this\." + id + "([\.\,\)\}\;])", "g"),
							id + "$1"
						);
					}

					// Replace the "this.instance =" with "instance = this.instance ="
					libContent = libContent.replace(/this\.([\w]+?) =/g, "$1 = this.$1 =");
				}

				// Update the content
				content = content.replace(lib, lib.substr(0, start) + libContent + lib.substr(end));
			});
		}
		FLfile.write(file, content);
	}

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
	 * Get an export filename
	 * @method exportFile
	 * @return {String|null} The export filename
	 */
	function exportFile(dom)
	{
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

			// Ignore other PublishProperties properties other than HTML
			if (name != "JavaScript/HTML") continue;
			
			// Get the list of properties
			var props = properties[i].Property;

			// Find the export filename
			for (var j = 0, l = props.length(); j < l; j++)
			{
				name = props[j].attribute('name');
				if (name == "filename") return String(props[j]);
			}
		}
		return null;
	}

	/**
	 * Substitute a class reference
	 * @method  classRef
	 * @param  {String} content   The javascript content
	 * @param  {String} className The filename to replace
	 * @return {String}           The updated content
	 */
	function classRef(content, className)
	{
		var regex = new RegExp(className.replace(".", "\\."), "g");
		if (content.match(regex))
		{
			var token = "var p; // shortcut to reference prototypes";
			var name = className.substr(className.indexOf('.') + 1);
			//fl.trace("Class " + className + " replace with " + name);
			content = content.replace(regex, name);
			content = content.replace(token, token += "\nvar " + name + " = " + className + ";");
		}
		return content;
	}

	function stringify(obj)
	{
		var t = typeof (obj);
		if (t != "object" || obj === null)
		{
			// simple data type
			if (t == "string") obj = '"' + obj + '"';
			return String(obj);
		}
		else
		{
			// recurse array or object
			var n, v, json = [], arr = (obj && obj.constructor == Array);
 
			for (n in obj)
			{
				v = obj[n];
				t = typeof(v);
				if (obj.hasOwnProperty(n))
				{
					if (t == "string")
						v = '"' + v + '"';
					else if (t == "object" && v !== null)
						v = stringify(v);
					json.push((arr ? "" : '"' + n + '":') + String(v));
				}
			}
			return (arr ? "[" : "{") + String(json) + (arr ? "]" : "}");
		}
	}

}(window));