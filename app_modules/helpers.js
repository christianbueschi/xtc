module.exports = function(app) {

	var path = require('path')
		,hbs = require('hbs')
		,fs = require('fs')
		,NODE_ENV = app.get('env')
	;

	// todo: look at my other error utils.
	app.error = function(message, originalError) {
		var err = ''
			,originalMessage = originalError && originalError.message || ''
		;
		message = message || '';
		err += message + ' Reason: ' + originalMessage;
		return {
			c: err
			,web: '\n'+err
		};
	}

	return {
		/**
		 * Convert all relative paths in config.js to absolute paths using our base path
		 */
		configAbsolutePaths: function() {
				var paths = app.config.paths
					,pathName
				;
				for (pathName in paths) {

					paths[pathName] = this.localPathToAbsolute(paths[pathName]);
				};
			},

		localPathToAbsolute: function(localPath) {
			return path.join( app.config.dirName, localPath);
		},

		/**
		 * Create URLs to asset files and make them available to templates through app.locals
		 */
		shareAssetWebPathsWithLocals: function() {
			var  assets = app.config.assets;

			// this could be created dynamically depending on config properties
			app.locals({
				assets: {
					js: {
						external: app.config.webPaths.dist + assets.js.external[NODE_ENV]
					}
					,css: {
						external: app.config.webPaths.dist + assets.css.external[NODE_ENV]
					}
				}
			});
		},

		registerTemplateHelpers: function() {
			var cache = {};

			hbs.registerHelper('asset', function(inlineAssetName) {
				var  file = path.join(app.config.paths.dist, app.config.assets[inlineAssetName].inline[NODE_ENV])
					,cached = cache[inlineAssetName]
				;

				if (!cached && cached !== '') {
					try {
						//console.log('read inline asset "'+ inlineAssetName +'" from:', file)
						cached = cache[inlineAssetName] = fs.readFileSync(file, 'utf8');
					} catch (e) {
						err = app.error('Can\'t read inline asset file.', e);
						console.error(err.c);
					}
				}
				return new hbs.SafeString(cached);
			});

			hbs.registerHelper('env', function(name, context) {
				//  return the template only if the name matches NODE_ENV ('development', 'production', etc.)
				return name == NODE_ENV ? context.fn(this) : '';
			});

			hbs.registerHelper('test', function(name, context) {
				var  file, template
					,config = app.config.QUnitFE

				if (NODE_ENV != 'development')
					return '';

				file = path.join(app.config.paths.views, 'test-modules.hbs');

				try {
					template = fs.readFileSync(file, 'utf8');
				} catch (e) {
					err = app.error('Can\'t read test template file.', e);
					console.error(err.c);
				}
				template = hbs.compile(template)({
					alterTitle: config.alterTitle.toString()
					,showUi: config.showUi
					,reorder: 'false'
				});
				return new hbs.SafeString(template);
			});
		}
	};

}
