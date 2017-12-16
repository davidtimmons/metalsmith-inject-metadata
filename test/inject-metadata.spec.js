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
const _injectNestedFileObject = InjectMetadata.__get__('_injectNestedFileObject');
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

    context('_injectNestedFileObject()', () => {
        it('should throw an error if <fileValueObject> is not an object', () => {
            expect(_ => _injectNestedFileObject()).to.throw(/Cannot convert .+? to object/);
        });

        it('should mutate each object value when that value is not an array', () => {
            const obj = { a: true, b: true, c: true };
            const stub = Sinon.stub().returns(42);
            _injectNestedFileObject(obj, stub);
            expect(stub.calledThrice).to.be.true;
            Object.keys(obj).forEach((key) => {
                expect(obj[key]).to.equal(42);
            });
        });

        it('should set object values using an identity function when not given a function', () => {
            const obj = { a: 42, b: 43, c: 44 };
            _injectNestedFileObject(obj);
            Object.keys(obj).forEach((key, i) => {
                expect(obj[key]).to.equal(42 + i);
            });
        });

        it('should recursively mutate the object when there are nested objects', () => {
            const obj = { a: { b: { c: true } } };
            const stub = Sinon.stub().returns(42);
            _injectNestedFileObject(obj, stub);
            expect(stub.calledOnce).to.be.true;
            expect(obj.a.b.c).to.equal(42);
        });

        it('should mutate each non-object value in an array', () => {
            const obj = { arr: [1, 'batman', true, null, undefined] };
            const stub = Sinon.stub().returns(42);
            _injectNestedFileObject(obj, stub);
            obj.arr.forEach((val) => {
                expect(val).to.equal(42);
            });
        });

        it('should mutate each object and array value in an array', () => {
            const sample = { a: { b: { c: true } } };
            const obj = { arr: [{ ...sample }, [{ ...sample }], { ...sample }] };
            const stub = Sinon.stub().returns(42);
            _injectNestedFileObject(obj, stub);
            obj.arr.forEach((value) => {
                let val = value;
                if (Array.isArray(val)) {
                    [val] = val;
                }
                expect(val.a.b.c).to.equal(42);
            });
        });
    });

    context('injectFile()', () => {
        beforeEach('stub external functions', () => {
            InjectMetadata.__set__('_getNestedKeyValue', Sinon.stub());
            InjectMetadata.__set__('_injectNestedFileObject', Sinon.stub());
        });

        after('reset external function', () => {
            InjectMetadata.__set__('_getNestedKeyValue', _getNestedKeyValue);
            InjectMetadata.__set__('_injectNestedFileObject', _injectNestedFileObject);
        });

        it('');
    });
});
