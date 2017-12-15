/**
 * Helper functions that inject metadata values into source files.
 */

const Debug = require('debug')('metalsmith-inject-metadata');


/////////////
// PRIVATE //
/////////////

/**
 * Get the object value mapped to a potentially nested key. Dot character(s) within a key string
 * signify nested object properties.
 *
 * @param {string} [key=''] - Potentially nested key which takes the form "key" or "my.nested.key".
 * @param {object} [obj={}] - Object that may contain a value mapped to this key.
 * @return {*|null} - Deep object value associated with this key else null if not found.
 */
function _getNestedKeyValue(key = '', obj = {}) {
    const keyArray = key.split('.');
    let data = obj; // No need to copy object since this function is not destructive.

    while (keyArray.length > 1) {
        const subKey = keyArray.shift();
        data = data[subKey];
        if (!data) {
            return null;
        }
    }

    const finalKey = keyArray[0];
    if (data[finalKey] === undefined) {
        return null;
    }
    return data[finalKey];
}


/**
 * Inject values into front-matter objects and arrays.
 *
 * @param {object} fileValueObject - Front-matter object to inject.
 * @param {function} transformText - Function used to inject a file value.
 */
function _injectNestedFileObject(fileValueObject, transformText) {
    Object.keys(fileValueObject).forEach((fileKey) => {
        const fileValue = fileValueObject[fileKey];
        const isNotArray = !Array.isArray(fileValue);

        if (isNotArray && typeof fileValue === 'object') {
            Debug('diving into the object at file key "%s"', fileKey);
            _injectNestedFileObject(fileValue, transformText);
        } else if (isNotArray) {
            Debug('transforming the value at file key "%s"', fileKey);
            fileValueObject[fileKey] = transformText(fileValue);
        } else {
            Debug('transforming the array at file key "%s"', fileKey);
            fileValueObject[fileKey].map(value => transformText(value));
        }
    });
}


////////////
// PUBLIC //
////////////

/**
 * Replace matching metadata keys in file values.
 *
 * @param {object} fileData - Metalsmith source file object.
 * @param {string} fileKey - Key used to "unlock" the file value for injection.
 * @param {string} metaKey - Key used to "unlock" the metadata value to be injected.
 * @param {object} metaKeyBounds - Key marker configuration used to match the meta key.
 * @param {object} metadata - Metalsmith metadata constants.
 */
function injectFile(fileData, fileKey, metaKey, metaKeyBounds, metadata) {
    const metaValue = _getNestedKeyValue(metaKey, metadata);
    if (metaValue === null) {
        Debug('could not find a metadata match for key "%s"', metaKey);
        return;
    }

    const fileValue = fileData[fileKey];
    const metaKeySearch = metaKeyBounds.left + metaKey + metaKeyBounds.right;
    const transformText = searchAndReplace.bind(null, metaKeySearch, metaValue);

    if (Buffer.isBuffer(fileValue)) {
        Debug('injecting new text into the Buffer at file key "%s"', fileKey);
        fileData[fileKey] = Buffer.from(transformText(fileValue.toString()));
    } else if (typeof fileValue === 'object') {
        Debug('injecting new text into the object at file key "%s"', fileKey);
        _injectNestedFileObject(fileValue, transformText);
    } else {
        Debug('injecting new text into file key "%s"', fileKey);
        fileData[fileKey] = transformText(fileValue);
    }
}


/**
 * Search text for a specific value then replace it wherever found.
 *
 * @param {string} query - Search value.
 * @param {string} replacement - Replacement value.
 * @param {string} searchText - Search text.
 */
function searchAndReplace(query, replacement, searchText) {
    let text = searchText;
    let startIndex = text.indexOf(query);

    while (~startIndex) {
        const endIndex = startIndex + query.length;
        text = text.substring(0, startIndex) + replacement + text.substring(endIndex);
        startIndex = text.indexOf(query, startIndex + 1);
    }

    return text;
}


/////////
// API //
/////////

module.exports = {
    injectFile,
    searchAndReplace,
};
