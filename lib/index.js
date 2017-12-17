/**
 * A Metalsmith plugin for injecting metadata constants into source files.
 */

const Debug = require('debug')('metalsmith-inject-metadata');
const Multimatch = require('multimatch');
const { injectFile } = require('./inject-metadata');


/////////////
// PRIVATE //
/////////////

/**
 * Check an argument type and return the argument converted to a desired type.
 * If the argument is not a desired or accepted type, return a default value.
 *
 * @param {*} arg - Argument used to check types.
 * @param {function} desiredType - Type constructor the arg should use.
 * @param {function} acceptedType - Type constructor the arg can use before conversion.
 * @param {*} [defaultValue] - Default value if the arg is an unaccepted type.
 * @return {*} - Argument of the desired type else a default value.
 */
function _setArgDefaults(arg, desiredType, acceptedType, defaultValue) {
    if (arg instanceof desiredType || typeof arg === typeof desiredType('')) {
        return arg;
    } else if (arg instanceof acceptedType || typeof arg === typeof acceptedType('')) {
        return desiredType(arg);
    }
    return defaultValue;
}


////////////
// PUBLIC //
////////////

/**
 * Inject metadata values into source files. Occurs where the metadata key name matches a key
 * found in the source file enclosed within the specified character pattern.
 *
 * @param {object} opts - Plugin configuration object.
 * @property {string[]|string} [pattern='** / *'] - Pattern used to match file names.
 * @property {string[]|string} [metadataKeys='*'] - Metadata keys to inject into files.
 * @property {object} [metadataKeyBounds={}] - Key marker bounds used to match the metadata key.
 * @property {string} [metadataKeyBounds.left='{{ '] - Left bound of the metadata key marker.
 * @property {string} [metadataKeyBounds.right=' }}'] - Right bound of the metadata key marker.
 * @property {string[]|string} [fileKeys='*'] - File keys with injectable data; defaults to all.
 * @example <caption>Example plugin argument.</caption>
 *   {
 *     pattern: '*.md',
 *     metadataKeys: '*',
 *     metadataKeyBounds: {
 *       left: '{{ ',
 *       right: ' }}'
 *     }
 *     fileKeys: ['title', 'contents'],
 *   }
 */
function plugin(opts = {}) {
    // Assign default argument values to prevent object access errors.
    opts.pattern = _setArgDefaults(opts.pattern, Array, String, ['**/*']);
    opts.metadataKeys = _setArgDefaults(opts.metadataKeys, Array, String, ['*']);
    opts.metadataKeyBounds = _setArgDefaults(opts.metadataKeyBounds, Object, Object, {});
    opts.metadataKeyBounds.left = _setArgDefaults(opts.metadataKeyBounds.left, String, String, '{{ ');
    opts.metadataKeyBounds.right = _setArgDefaults(opts.metadataKeyBounds.right, String, String, ' }}');
    opts.fileKeys = _setArgDefaults(opts.fileKeys, Array, String, ['*']);

    return (files, Metalsmith, done) => {
        setImmediate(done);

        // Limit work to the matched files to save a few CPU cycles.
        const injectSet = Multimatch(Object.keys(files), opts.pattern);
        if (injectSet.length > 0) {
            const isWildcard = x => Array.isArray(x) && x[0] === '*';
            let { metadataKeys } = opts;
            metadataKeys = isWildcard(metadataKeys)
                         ? Object.keys(Metalsmith.metadata())
                         : metadataKeys;

            // Search all matched files.
            injectSet.forEach((file) => {
                Debug('searching for key matches in "%s"', file);
                const fileData = files[file];
                let { fileKeys } = opts;
                fileKeys = isWildcard(fileKeys)
                         ? Object.keys(fileData)
                         : fileKeys;

                // Search all matched file key-values; inject metadata where keys match.
                fileKeys.forEach((fileKey) => {
                    if (fileKey in fileData) {
                        metadataKeys.forEach((metaKey) => {
                            injectFile(
                                fileData,
                                fileKey,
                                Metalsmith.metadata(),
                                metaKey,
                                opts.metadataKeyBounds
                            );
                        });
                    }
                });
            });
        } else {
            Debug('no files matched the pattern "%s"', opts.pattern);
        }
    };
}


/////////
// API //
/////////

module.exports = plugin;
