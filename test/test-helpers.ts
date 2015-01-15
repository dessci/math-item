/// <reference path="../typings/mocha.d.ts" />
/// <reference path="../typings/expect.js.d.ts" />
/// <reference path="../dist/math-ui-core.d.ts" />

var _ = MathUI.getUtils();

declare var Promise;

function testPromise(P: any) {
    it('Promise.resolve', function () {
        P.resolve('foo').then((val: string) => {
            expect(val).to.be('foo');
        });
    });
    it('Immediate resolve', function () {
        var p = new P((resolve: (val: string) => void) => {
            resolve('foo');
        });
        p.then((val: string) => {
            expect(val).to.be('foo');
        });
    });
    it('Delayed resolve', function (done: MochaDone) {
        var p = new P((resolve: (val: string) => void) => {
            setTimeout(() => {
                resolve('foo');
            }, 200);
        });
        p.then((val: string) => {
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
