/**
 * Test the helper functions.
 */

/* eslint-disable no-unused-expressions, function-paren-newline */

const { expect } = require('chai');
const Rewire = require('rewire');
const Sinon = require('sinon'); // eslint-disable-line
const InjectMetadata = Rewire('../lib/inject-metadata');
const _canHaveKeys = InjectMetadata.__get__('_canHaveKeys');
const _getNestedKeyValue = InjectMetadata.__get__('_getNestedKeyValue');
const { injectFile, searchAndReplace } = InjectMetadata;


///////////
// TESTS //
///////////

describe('inject-metadata.js', () => {
    context('_canHaveKeys()', () => {
        it('should return true if the argument can have keys', () => {
            const results =
                [ _canHaveKeys({})
                , _canHaveKeys([])
                ];

            results.forEach((result) => {
                expect(result).to.be.true;
            });
        });

        it('should return false if the argument can not have keys', () => {
            const results =
                [ _canHaveKeys(true)
                , _canHaveKeys(42)
                , _canHaveKeys('batman')
                , _canHaveKeys(null)
                , _canHaveKeys(undefined)
                ];

            results.forEach((result) => {
                expect(result).to.be.false;
            });
        });
    });

    context('_getNestedKeyValue()', () => {
        const obj = Object.freeze({
            gotham: {
                city: {
                    batman: 'dresses like a bat',
                },
                harbor: 'something is fishy',
            },
            metropolis: 'faster than a speeding bullet',
        });

        it('should return data with a nested key', () => {
            const result01 = _getNestedKeyValue('gotham.city.batman', obj);
            const result02 = _getNestedKeyValue('gotham.harbor', obj);
            expect(result01).to.equal(obj.gotham.city.batman);
            expect(result02).to.equal(obj.gotham.harbor);
        });

        it('should return data without a nested key', () => {
            const result = _getNestedKeyValue('metropolis', obj);
            expect(result).to.equal(obj.metropolis);
        });

        it('should return null if the key does not match an object value', () => {
            const result01 = _getNestedKeyValue('amazonia', obj);
            const result02 = _getNestedKeyValue('gotham.arkham', obj);
            const result03 = _getNestedKeyValue('gotham.arkham.asylum', obj);
            expect(result01).to.be.null;
            expect(result02).to.be.null;
            expect(result03).to.be.null;
        });
    });

    context('injectFile()', () => {
        let fileData;
        const metadata = {
            teams: {
                justiceLeague: 'good guys',
                legionOfDoom: 'bad guys',
            },
            hero: 'Batman',
        };
        const metadataKeyBounds = { left: '{{ ', right: ' }}' };

        beforeEach('stub external functions and reset values', () => {
            InjectMetadata.__set__('searchAndReplace', Sinon.stub().returns('42'));
            fileData = {
                a: Buffer.from('The best hero is {{ hero }}.'),
                b: { gotham: { city: 'robin' } },
                c: 3,
                d: 'joker',
            };
        });

        after('reset external function', () => {
            InjectMetadata.__set__('searchAndReplace', searchAndReplace);
        });

        it('should not modify file data if there is no matching metadata value', () => {
            const _fileData = { ...fileData };
            injectFile(_fileData, 'a', metadata, 'villain', metadataKeyBounds);
            expect(_fileData).to.deep.equal(fileData);
        });

        it('should not modify file data if the file value is not an accepted type', () => {
            const _fileData = { ...fileData };
            injectFile(_fileData, 'c', metadata, 'hero', metadataKeyBounds);
            expect(_fileData).to.deep.equal(fileData);
        });

        it('should transform text into a string if the file value is a string', () => {
            expect(fileData.d).to.be.a('string');
            const stub = InjectMetadata.__get__('searchAndReplace');
            injectFile(fileData, 'd', metadata, 'hero', metadataKeyBounds);
            expect(stub.calledOnce).to.be.true;
            expect(fileData.d).to.be.a('string');
        });

        it('should transform text into a new Buffer if the file value is a Buffer', () => {
            expect(Buffer.isBuffer(fileData.a)).to.be.true;
            const stub = InjectMetadata.__get__('searchAndReplace');
            injectFile(fileData, 'a', metadata, 'hero', metadataKeyBounds);
            expect(stub.calledOnce).to.be.true;
            expect(Buffer.isBuffer(fileData.a)).to.be.true;
        });

        it('should recursively mutate an object if the file value is an object', () => {
            const _injectFile = Sinon.spy(injectFile);
            InjectMetadata.__set__('injectFile', _injectFile);

            _injectFile(fileData, 'b', metadata, 'hero', metadataKeyBounds);
            const results = InjectMetadata.__get__('injectFile');

            expect(results.callCount).to.equal(3);
            expect(results.args[0][1]).to.equal('b');
            expect(results.args[1][1]).to.equal('gotham');
            expect(results.args[2][1]).to.equal('city');

            InjectMetadata.__set__('injectFile', injectFile);
        });

        it('should ignore non-accepted types found in an array', () => {
            const arr = [1, true, null, undefined];
            const obj = { arr: [...arr] };
            injectFile(obj, 'arr', metadata, 'hero', metadataKeyBounds);
            obj.arr.forEach((val, i) => {
                expect(val).to.equal(arr[i]);
            });
        });

        it('should mutate each string or Buffer value in an array', () => {
            const obj = { arr: ['batman', Buffer.from('joker')] };
            injectFile(obj, 'arr', metadata, 'hero', metadataKeyBounds);
            obj.arr.forEach((val) => {
                if (typeof val === 'string') {
                    expect(val).to.equal('42');
                } else {
                    expect(val.toString()).to.equal('42');
                }
            });
        });

        it('should mutate each object and array value in an array', () => {
            const sample = { a: { b: { c: 'batman' } } };
            const obj = { arr: [{ ...sample }, [{ ...sample }], { ...sample }] };
            injectFile(obj, 'arr', metadata, 'hero', metadataKeyBounds);
            obj.arr.forEach((value) => {
                let val = value;
                if (Array.isArray(val)) {
                    [val] = val;
                }
                expect(val.a.b.c).to.equal('42');
            });
        });
    });

    context('searchAndReplace()', () => {
        const query = '{{ hero }}';
        const replacement = 'Batman';

        it('should return the search text if the query was not found', () => {
            const searchText = 'The greatest threat to Gotham City is {{ villain }}!';
            const result = searchAndReplace(query, replacement, searchText);
            expect(result).to.equal(searchText);
        });

        it('should replace all instances of the query in the seach text', () => {
            const searchText = '{{ hero }} is pretty great. I\'m {{ hero }}!';
            const result = searchAndReplace(query, replacement, searchText);
            expect(result).to.equal('Batman is pretty great. I\'m Batman!');
        });
    });
});
