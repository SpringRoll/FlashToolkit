module.exports = function(grunt)
{
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-simple-version');
	grunt.loadNpmTasks('grunt-exec');

	var settings;

	if (grunt.file.exists('settings.json'))
	{
		settings = grunt.file.readJSON('settings.json');
	}
	else
	{
		grunt.log.error("To build the FlashToolkit there must be a settings.json " +
			"file which contains keys 'packager' (path to ZXPSignCmd), 'keystore' " +
			"(path to p12 certificate) and 'storepass' (certificate password).");
	}

	grunt.initConfig({
		settings: settings || {},
		output: 'FlashToolkit.zxp',
		jshint: {
			all: {
				src: [
					'Gruntfile.js',
					'src/‘**/*.jsfl'
				]
			}
		},
		exec: {
			package: "\"<%= settings.packager %>\" " +
				"-sign " +
				"src " +
				"\"<%= output %>\" " +
				"\"<%= settings.keystore %>\" " +
				"<%= settings.storepass %>"
				
		},
		version: {
			options: {
				"src/io.springroll.toolkit.mxi": function(content, version)
				{
					return content.replace(
						/version\=\".+?\"\>/,
						'version="' + version + '">'
					);
				}
			}
		},
		clean: {
			build: ["<%= output %>"]
		}
	});

	grunt.registerTask(
		'default',
		'Default build and package',
		[
			'version:current',
			'clean:build',
			'test',
			'exec:package'
		]
	);

	grunt.registerTask(
		'test',
		'Test to run for continuous integration',
		['jshint:all']
	);
};