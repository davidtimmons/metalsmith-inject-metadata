/**
 * Helper functions that inject metadata values into source files.
 */

// const Debug = require('debug')('metalsmith-inject-metadata');


////////////
// PUBLIC //
////////////

/**
 * Replace every instance of a matching metadata key in the file value.
 *
 * @param {object} fileData -
 * @param {string} fileKey -
 * @param {object} fileKeyBounds -
 * @param {object} metadata -
 * @param {string} metaKey -
 */
function injectFile(fileData, fileKey, fileKeyBounds, metadata, metaKey) {
    const fileValue = fileData[fileKey];
    const metaValue = metadata[metaKey];

    if (Buffer.isBuffer(fileValue)) {
        // Replace values in Metalsmith "contents", a Buffer type.
        const text = searchAndReplace(fileValue.toString(), metaKey, metaValue, metadata);
        fileData[fileKey] = Buffer.from(text);
    } else if (typeof fileValue === 'object' && !Array.isArray(fileValue)) {
        mutateNestedMetadata(fileValue, metaKey, metaValue, metadata);
    } else {
        // Replace values in frontmatter strings.
        fileData[fileKey] = searchAndReplace(fileValue, metaKey, metaValue, metadata);
    }
}


/**
 * Replace values in nested frontmatter objects.
 *
 * @param {*} data -
 * @param {*} metaKey -
 * @param {*} metaValue -
 * @param {*} Metalsmith -
 */
function mutateNestedMetadata(data, metaKey, metaValue, metadata) {
    Object.keys(data).forEach((key) => {
        if (data[key] !== null && data[key] !== undefined) {
            const isArray = Array.isArray(data[key]);
            if (!isArray && typeof data[key] === 'object') {
                mutateNestedMetadata(data[key]);
            } else if (!isArray) {
                data[key] = searchAndReplace(
                    data[key],
                    metaKey,
                    metaValue,
                    metadata
                );
            }
        }
    });
}


/**
 * Search text for a specific value then replace it wherever found.
 *
 * @param {string} text - Search text.
 * @param {string} search - Search value.
 * @param {string} replace - Replacement value.
 * @param {object} [metadata] - Contains all metadata.
 */
function searchAndReplace(text, search, replace, metadata = {}) {
    // Reset the replace value when the searched key is nested.
    let _text = text;
    let _replace = replace;
    let _metadata = metadata;

    const nestedSearch = search.indexOf('.') >= 0 ? search.split('.') : search;
    while (nestedSearch instanceof Array && nestedSearch.length > 1) {
        const subKey = nestedSearch.shift();
        if (subKey in _metadata) {
            _metadata = _metadata[subKey];
        }
        if (nestedSearch.length === 1) {
            _replace = _metadata[nestedSearch];
        }
    }

    // Replace matches in the search text.
    let startIndex = _text.indexOf('{{');
    while (startIndex >= 0) {
        const endIndex = _text.indexOf('}}', startIndex);
        const value = _text.substring(startIndex + 2, endIndex).trim();
        if (value === search) {
            _text = _text.substring(0, startIndex) + _replace + _text.substring(endIndex + 2);
        }
        startIndex = _text.indexOf('{{', endIndex);
    }
    return _text;
}


/////////
// API //
/////////

module.exports = {
    injectFile,
    mutateNestedMetadata,
    searchAndReplace,
};
