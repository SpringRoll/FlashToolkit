(function(){

	// Include the command library
	var dir = fl.scriptURI.split("/");
	dir = dir.slice(0,dir.length - 3).join("/");
	fl.runScript(dir + "/JSFLLibraries/Command.jsfl");

	/**
	 * Export a Bitmap sequence for all frame labels on the 
	 * current timeline.
	 * @class  FrameSequence
	 */
	var FrameSequence = function()
	{
		// Check for document
		if (!this.getDOM()) return;

		/**
		 * The current timeline
		 * @property {Timeline} timeline
		 */
		this.timeline = null;

		/**
		 * The animation labels
		 * @property {array} animationLabels
		 */
		this.animationLabels = [];

		var folderURI = fl.browseForFolderURL("Select a folder to export to");

		if(!folderURI) return;

		folderURI += "/";
		
		fl.outputPanel.clear();
		
		this.timeline = this.dom.getTimeline();

		var layers = this.timeline.layers,
			j = 0,
			k = 0,
			layer,
			frame;
		
		// Remove any stop or loop frames
		for (j=0; j < layers.length; j++)
		{
			layer = layers[j];
			if (layer.layerType != "guided" && layer.layerType != "folder")
			{
				for (k=0; k < layer.frames.length;)
				{
					frame = layer.frames[k];
					if (frame.name.search(/ stop$| loop$/) > -1)
					{
						this.timeline.clearKeyframes(frame.startFrame);
					}
					k += frame.duration;//increment k to get to the next frame
				}
			}
		}
		
		// Get all of the frame labels
		for (j=0; j < layers.length; j++)
		{
			layer = layers[j];
			if (layer.layerType != "guided" && layer.layerType != "folder")
			{
				for (k=0; k < layer.frames.length;)
				{
					frame = layer.frames[k];
					if (frame.name && frame.name !== "")
					{
						this.animationLabels.push(frame);
					}
					//increment k to get to the next frame
					k += frame.duration;
				}
			}
		}
		
		if (this.animationLabels.length === 0)
		{
			alert("no animations found");
			return;
		}
		
		for (j=0; j < this.animationLabels.length; ++j)
		{
			var f = this.animationLabels[j];

			// because exportInstanceToPNGSequence() doesn't 
			// work the way we want it to, we get to
			// do this the old fashioned way.
			this.exportPNGSequence(folderURI + f.name, f.startFrame + 1, f.startFrame + f.duration);
		}
	};

	var p = FrameSequence.prototype = new Command();

	/**
	 * Export a PNG sequence
	 * @method  exportPNGSequence
	 * @param  {string} fileURI_noExt The full URI without an extension
	 * @param  {int} startFrame    The starting frame number
	 * @param  {int} endFrame      The ending frame number
	 */
	p.exportPNGSequence = function(fileURI_noExt, startFrame, endFrame)
	{
		var frameCount = 0;
		for (var i = startFrame - 1; i < endFrame; ++i)
		{
			frameCount++;
			this.timeline.currentFrame = i;
			this.dom.exportPNG(fileURI_noExt + padNum(frameCount.toString()) + ".png", true, true);
		}
	};

	/**
	 * Add padding to a number
	 * @param  {int} input The input number
	 * @return {string}       The padded number
	 */
	var padNum = function(input)
	{
		while (input.length < 4)
			input = "0" + input;
		return input;
	};

	new FrameSequence();

}());