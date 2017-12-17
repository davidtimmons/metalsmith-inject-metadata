/**
 * Test the metalsmith-inject-metadata plugin.
 */

/* eslint-disable no-unused-expressions, function-paren-newline */

const { expect } = require('chai');
const Rewire = require('rewire');
const Sinon = require('sinon'); // eslint-disable-line
const plugin = Rewire('../lib/index');
const _setArgDefaults = plugin.__get__('_setArgDefaults');
const { injectFile } = require('../lib/inject-metadata');


///////////
// TESTS //
///////////

describe('index.js', () => {
    context('_setArgDefaults()', () => {
        it('should fail when called without required arguments', () => {
            const fns =
                [ _ => _setArgDefaults()
                , _ => _setArgDefaults(true)
                , _ => _setArgDefaults(true, String)
                ];
            fns.forEach((fn) => {
                expect(fn).to.throw();
            });
            expect(_ => _setArgDefaults(true, String, Number)).to.not.throw();
        });

        it('should return "arg" if instance of "desiredType"', () => {
            // See: https://nodejs.org/api/buffer.html
            const arg = Buffer.from('test');
            const result = _setArgDefaults(arg, Buffer);
            expect(arg.compare(result)).to.equal(0);
        });

        it('should return "arg" if type of "desiredType"', () => {
            const result = _setArgDefaults(42, Number);
            expect(result).to.equal(42);
        });

        it('should return a type-casted "arg" if instance of "acceptedType"', () => {
            const arg = Buffer.from('test');
            const result = _setArgDefaults(arg, String, Buffer);
            expect(result).to.be.a('string');
            expect(result).to.equal('test');
        });

        it('should return a type-casted "arg" if type of "acceptedType"', () => {
            const result = _setArgDefaults(42, String, Number);
            expect(result).to.be.a('string');
            expect(result).to.equal('42');
        });

        it('should return "defaultValue" if "arg" not of "desiredType" or "acceptedType"', () => {
            const result = _setArgDefaults(42, String, Boolean, 'test');
            expect(result).to.equal('test');
        });
    });

    context('plugin()', () => {
        const files = {
            a: { hero: 'nightwing', city: 'blüdhaven' },
            b: { hero: 'robin', police: 'gordon' },
            c: { hero: 'batgirl' },
        };
        const _Metalsmith = {
            metadata: () => ({
                alfa: 1,
                bravo: 2,
                charlie: 3,
            }),
        };

        beforeEach('stub the private functions', () => {
            // Returns the default value.
            plugin.__set__('_setArgDefaults', Sinon.stub().callsFake(
                (...args) => args[0] || args[3]
            ));
            plugin.__set__('injectFile', Sinon.stub());
        });

        after('reset the private functions', () => {
            plugin.__set__('_setArgDefaults', _setArgDefaults);
            plugin.__set__('injectFile', injectFile);
        });

        it('should enforce types for all plugin configuration options', () => {
            const stub = plugin.__get__('_setArgDefaults');
            plugin();
            expect(stub.callCount).to.equal(6);
        });

        it('should do nothing if the file matching pattern produces no matches', () => {
            const stub = plugin.__get__('injectFile');
            plugin({ pattern: '*.md' })(files, _Metalsmith, _ => '');
            expect(stub.callCount).to.equal(0);
        });

        it('should do nothing if the given file keys are not in the file objects', () => {
            const stub = plugin.__get__('injectFile');
            plugin({ fileKeys: ['villain'] })(files, _Metalsmith, _ => '');
            expect(stub.callCount).to.equal(0);
        });

        it('should inject all metadata keys when using a wildcard', () => {
            const stub = plugin.__get__('injectFile');
            const opts = { fileKeys: ['hero'], metadataKeys: ['*'] };
            plugin(opts)(files, _Metalsmith, _ => '');
            expect(stub.callCount).to.equal(9);
        });

        it('should inject into all files when using a wildcard', () => {
            const stub = plugin.__get__('injectFile');
            const opts = { fileKeys: ['*'], metadataKeys: ['alfa'] };
            plugin(opts)(files, _Metalsmith, _ => '');
            expect(stub.callCount).to.equal(5);
        });

        it('should inject specific metadata keys into specific file keys', () => {
            const stub = plugin.__get__('injectFile');
            const opts = { fileKeys: ['police', 'city'], metadataKeys: ['alfa', 'charlie'] };
            plugin(opts)(files, _Metalsmith, _ => '');
            expect(stub.callCount).to.equal(4);
        });
    });
});
