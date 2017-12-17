/**
 * Test the "metalsmith-inject-metadata" plugin using the Metalsmith software.
 */

/* eslint-disable no-unused-expressions, function-paren-newline */

const { expect } = require('chai');
const Metalsmith = require('metalsmith');
const debug = require('metalsmith-debug');
const injectMetadata = require('..');


describe('metalsmith-inject-metadata', () => {
    const opts = Object.freeze({
        // === DEFAULTS ===
        // pattern: '**/*',
        // metadataKeys: '*',
        // metadataKeyBounds: {
        //     left: '{{ ',
        //     right: ' }}',
        // },
        // fileKeys: '*',
    });

    it('should inject metadata values into file front-matter', (done) => {
        Metalsmith('test/fixtures/frontmatter')
            .metadata({
                hero: 'Batman',
                sidekick: 'Robin',
            })
            .use(injectMetadata({
                ...opts,
                fileKeys: 'test',
            }))
            .use(debug())
            .build(function(err, files) { // eslint-disable-line
                if (err) return done(err);
                Object.keys(files).forEach((file) => {
                    const { test } = files[file];
                    const msg = 'Gotham City needs the dynamic duo, Batman and Robin!';
                    expect(test).to.equal(msg);
                });
                done();
            });
    });

    it('should inject metadata values into file contents', (done) => {
        Metalsmith('test/fixtures/contents')
            .metadata({
                hero: 'Batman',
                sidekick: 'Robin',
            })
            .use(injectMetadata({
                ...opts,
                fileKeys: 'contents',
            }))
            .use(debug())
            .build(function(err, files) { // eslint-disable-line
                if (err) return done(err);
                Object.keys(files).forEach((file) => {
                    const contents = files[file].contents.toString();
                    const msg = 'Gotham City needs the dynamic duo,\nBatman and Robin!\n';
                    expect(contents).to.equal(msg);
                });
                done();
            });
    });

    it('should inject metadata values into all file data', (done) => {
        Metalsmith('test/fixtures/all')
            .metadata({
                gotham: {
                    hero: 'Batman',
                    sidekick: 'Robin',
                    police: 'James Gordon',
                },
                other: {
                    blüdhaven: {
                        hero: 'Nightwing',
                    },
                },
            })
            .use(injectMetadata({
                ...opts,
                metadataKeys: [
                    'gotham.hero',
                    'gotham.police',
                    'gotham.sidekick',
                    'other.blüdhaven.hero'
                ],
                metadataKeyBounds: {
                    left: '<',
                    right: '>',
                },
                fileKeys: [
                    'contents',
                    'government',
                    'vigilante'
                ],
            }))
            .use(debug())
            .build(function(err, files) { // eslint-disable-line
                if (err) return done(err);
                Object.keys(files).forEach((file) => {
                    const fileData = files[file];
                    const vigilante = 'This is Gotham City, home of Batman.';
                    const government = 'James Gordon is the police commissioner.';
                    const contents = [
                        'Batman\'s sidekick, Robin, helps fight crime. Meanwhile, the\n',
                        'former Robin, now called "Nightwing", fights crime in\n',
                        'a different city.\n'
                    ].join('');

                    expect(fileData.vigilante).to.equal(vigilante);
                    expect(fileData.government).to.equal(government);
                    expect(fileData.contents.toString()).to.equal(contents);
                });
                done();
            });
    });
});
