/// <reference path="../typings/mocha.d.ts" />
/// <reference path="../typings/expect.js.d.ts" />
/// <reference path="../dist/math-ui-v0.1.d.ts" />
var _ = MathUI.getUtils();
function testPromise(P) {
    it('Promise.resolve', function () {
        P.resolve('foo').then(function (val) {
            expect(val).to.be('foo');
        });
    });
    it('Immediate resolve', function () {
        var p = new P(function (resolve) {
            resolve('foo');
        });
        p.then(function (val) {
            expect(val).to.be('foo');
        });
    });
    it('Delayed resolve', function (done) {
        var p = new P(function (resolve) {
            setTimeout(function () {
                resolve('foo');
            }, 200);
        });
        p.then(function (val) {
            expect(val).to.be('foo');
            done();
        });
        this.timeout(250);
    });
}
describe('MathUI helpers', function () {
    if ('Promise' in window) {
        describe('native Promise', function () {
            testPromise(Promise);
        });
    }
    describe('MathUI.Promise', function () {
        testPromise(MathUI.Promise);
    });
});
