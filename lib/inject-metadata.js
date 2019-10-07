/**
 * Helper functions that inject metadata values into source files.
 */

const Debug = require('debug')('metalsmith-inject-metadata');


/////////////
// PRIVATE //
/////////////

/**
 * Detects whether the argument can contain keys.
 *
 * @param {*} val - Value used to detect possible keys.
 * @return {boolean} - Whether the argument can contain keys.
 */
function _canHaveKeys(val) {
    if (
        typeof val === 'boolean'
        || typeof val === 'number'
        || typeof val === 'string'
        || val === null
        || val === undefined
    ) {
        return false;
    }
    return true;
}


/**
 * Get the object value mapped to a potentially nested key. Dot character(s) within a key string
 * signify nested object properties.
 *
 * @param {string} [key=''] - Potentially nested key which takes the form "key" or "my.nested.key".
 * @param {object} [obj={}] - Object that may contain a value mapped to this key.
 * @return {*|null} - Deep object value associated with this key else null if not found.
 */
function _getNestedKeyValue(key = '', obj = {}) {
    Debug('looking for the value mapped to key "%s"', key);

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


////////////
// PUBLIC //
////////////

/**
 * Replace matching metadata keys in file values.
 *
 * @param {object} fileData - Metalsmith source file object.
 * @param {string} fileKey - Key used to "unlock" the file value for injection.
 * @param {object} metadata - Metalsmith metadata constants.
 * @param {string} metaKey - Key used to "unlock" the metadata value to be injected.
 * @param {object} metadataKeyBounds - Key marker configuration used to match the meta key.
 */
function injectFile(fileData, fileKey, metadata, metaKey, metadataKeyBounds) {
    Debug('injecting metadata from key "%s" into data at key "%s"', metaKey, fileKey);

    const metaValue = _getNestedKeyValue(metaKey, metadata);

    if (metaValue === null) {
        Debug('could not find a metadata match for key "%s"', metaKey);
        return;
    }

    const fileValue = fileData[fileKey];
    const metaKeySearch = metadataKeyBounds.left + metaKey + metadataKeyBounds.right;
    const transformText = searchAndReplace.bind(null, metaKeySearch, metaValue);

    if (typeof fileValue === 'string') {
        Debug('injecting new text into the string at key "%s"', fileKey);
        fileData[fileKey] = transformText(fileValue);
    } else if (Buffer.isBuffer(fileValue)) {
        Debug('injecting new text into the Buffer at key "%s"', fileKey);
        fileData[fileKey] = Buffer.from(transformText(fileValue.toString()));
    } else if (Array.isArray(fileValue)) {
        Debug('injecting new text into the array at key "%s"', fileKey);
        fileData[fileKey] = fileValue.map((value, i) => {
            if (typeof value === 'string') {
                Debug('transforming string in array at position "%d" in key "%s"', i, fileKey);
                return transformText(value);
            } else if (Buffer.isBuffer(value)) {
                Debug('transforming Buffer in array at position "%d" in key "%s"', i, fileKey);
                return Buffer.from(transformText(value.toString()));
            } else if (_canHaveKeys(value)) {
                Debug('transforming object in array at position "%d" in key "%s"', i, fileKey);
                Object.keys(value).forEach(valueKey => {
                    injectFile(value, valueKey, metadata, metaKey, metadataKeyBounds);
                });
                return value;
            }
            Debug('ignoring data at position "%d" in key "%s"', i, fileKey);
            return value;
        });
    } else if (_canHaveKeys(fileValue)) {
        Debug('injecting new text into the object at key "%s"', fileKey);
        Object.keys(fileValue).forEach(fileValueKey => {
            injectFile(fileValue, fileValueKey, metadata, metaKey, metadataKeyBounds);
        });
    }
}


/**
 * Search text for a specific value then replace it wherever found.
 *
 * @param {string} query - Search value.
 * @param {string} replacement - Replacement value.
 * @param {string} searchText - Search text.
 * @return {string} - Injected text value or the original text.
 */
function searchAndReplace(query, replacement, searchText) {
    Debug('searching for query "%s" to replace with "%s"', query, replacement);

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
