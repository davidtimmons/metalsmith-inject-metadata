const Multimatch = require('multimatch');


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
 * @param {*} defaultValue - Default value if the arg is an unaccepted type.
 * @return {*} - Original argument of the desired type or a default value.
 */
function _setArgDefaults(arg, desiredType, acceptedType, defaultValue) {
    if (arg instanceof desiredType || typeof arg === typeof desiredType('')) {
        return arg;
    } else if (arg instanceof acceptedType || typeof arg === typeof acceptedType('')) {
        return desiredType(arg);
    } else {
        return defaultValue;
    }
}

/**
 * Search text for a specific value then replace it wherever found.
 *
 * @param {string} text - Search text.
 * @param {string} search - Search value.
 * @param {string} replace - Replacement value.
 * @param {object} [metadata] - Contains all metadata.
 */
function _searchAndReplace(text, search, replace, metadata={}) {
    // Reset the replace value when the searched key is nested.
    let meta = metadata;
    let nestedSearch = search.indexOf('.') >= 0 ? search.split('.') : search;
    while (nestedSearch instanceof Array && nestedSearch.length > 1) {
        let subKey = nestedSearch.shift();
        if (subKey in meta) {
            meta = meta[subKey];
        }
        if (nestedSearch.length === 1) {
            replace = meta[nestedSearch];
        }
    }

    // Replace matches in the search text.
    let startIndex = text.indexOf('{{');
    while (startIndex >= 0) {
        let endIndex = text.indexOf('}}', startIndex)
          , value = text.substring(startIndex + 2, endIndex).trim();
        if (value === search) {
            text = text.substring(0, startIndex) + replace + text.substring(endIndex + 2);
        }
        startIndex = text.indexOf('{{', endIndex);
    }
    return text;
}


////////////
// PUBLIC //
////////////

/**
 * Inject metadata key-values into file key-values where there is a match between the
 * metadata key name and file content enclosed in double curly brackets. For example,
 * if there is a metadata key-value of <rootPath: 'http://my.example'> and a {{ rootPath }}
 * or {{rootPath}} value in the file content, <{{ rootPath }}> would become <http://my.example>.
 *
 * @param {object} opts - Plugin configuration object.
 * @property {string[]|string} [pattern] - Pattern used to match file names; defaults to all.
 * @property {string[]|string} [fileKeys] - File keys with data to search; defaults to all.
 * @property {string[]|string} [metadataKeys] - Metadata keys to inject; defaults to all.
 * @example <caption>Example plugin argument.</caption>
 *   {
 *     pattern: '*.md',
 *     fileKeys: ['title', 'contents'],
 *     metadataKeys: '*',
 *   }
 */
function plugin(opts={}) {
    // Assign default argument values to prevent object access errors.
    opts.pattern = _setArgDefaults(opts.pattern, Array, String, ['**/*']);
    opts.fileKeys = _setArgDefaults(opts.fileKeys, Array, String, ['*']);
    opts.metadataKeys = _setArgDefaults(opts.metadataKeys, Array, String, ['*']);

    return function (files, Metalsmith, done) {
        setImmediate(done);
        const injectSet = Multimatch(Object.keys(files), opts.pattern);
        const metadata = Metalsmith.metadata();

        // Default to wildcard metadata search-and-replace.
        if (injectSet.length > 0) {
            if (opts.metadataKeys[0] === '*') {
                opts.metadataKeys = Object.keys(metadata);
            }
        }

        // Look in every file that matches the search pattern.
        injectSet.forEach(file => {
            let fileData = files[file];

            // Default to wildcard file data search-and-replace.
            if (opts.fileKeys[0] === '*') {
                opts.fileKeys = Object.keys(fileData);
            }

            // Examine every metadata key given in the function argument.
            opts.fileKeys.forEach(fileKey => {
                if (fileKey in fileData) {

                    // Replace every instance of a matching metadata key in the file value.
                    opts.metadataKeys.forEach(metaKey => {
                        if (Buffer.isBuffer(fileData[fileKey])) {
                            // Replace values in Metalsmith "contents", a Buffer type.
                            let text = fileData[fileKey].toString();
                            text = _searchAndReplace(
                                text,
                                metaKey,
                                metadata[metaKey],
                                Metalsmith.metadata()
                            );
                            fileData[fileKey] = Buffer.from(text);
                        } else if (
                            typeof fileData[fileKey] === 'object'
                            && !Array.isArray(fileData[fileKey])
                        ) {
                            // Replace values in nested frontmatter objects.
                            const mutateNestedMetadata = function(
                                data,
                                metaKey,
                                metaValue,
                                Metalsmith
                            ) {
                                Object.keys(data).forEach(key => {
                                    if (data[key] !== null && data[key] !== undefined) {
                                        const isArray = Array.isArray(data[key]);
                                        if (!isArray && typeof data[key] === 'object') {
                                            mutateNestedMetadata(data[key]);
                                        } else if (!isArray) {
                                            data[key] = _searchAndReplace(
                                                data[key],
                                                metaKey,
                                                metaValue,
                                                Metalsmith.metadata()
                                            );
                                        }
                                    }
                                });
                            };
                            mutateNestedMetadata(
                                fileData[fileKey],
                                metaKey,
                                metadata[metaKey],
                                Metalsmith
                            );
                        } else {
                            // Replace values in frontmatter strings.
                            fileData[fileKey] = _searchAndReplace(
                                fileData[fileKey],
                                metaKey,
                                metadata[metaKey],
                                Metalsmith.metadata()
                            );
                        }
                    });
                }
            });
        });
    }
}


/////////
// API //
/////////

module.exports = plugin;
