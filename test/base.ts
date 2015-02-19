/// <reference path="mocha.d.ts" />
/// <reference path="expect.js.d.ts" />
/// <reference path="../dist/math-item.d.ts" />

interface Window {
    describe : {
        (description: string, spec: () => void): void;
        only(description: string, spec: () => void): void;
        skip(description: string, spec: () => void): void;
        timeout(ms: number): void;
    }
}

window.describe('math-item elements', function () {
    var items = document.querySelectorAll('math-item');

    it('global object HTMLMathItemElement', function () {
        expect(window).to.have.property('HTMLMathItemElement');
        expect(window.HTMLMathItemElement).to.have.property('render');
        if (!document.registerElement) {
            expect(window.HTMLMathItemElement).to.have.property('created');
            expect(window.HTMLMathItemElement).to.have.property('attached');
        }
    });

    it('global object HTMLMathSourceElement', function () {
        expect(window).to.have.property('HTMLMathSourceElement');
        if (!document.registerElement) {
            expect(window.HTMLMathSourceElement).to.have.property('created');
            expect(window.HTMLMathSourceElement).to.have.property('attached');
        }
    });

    it('number of items', function () {
        expect(items.length).to.be(3);
    });

    if (document.registerElement) {
        it('math-item instanceof HTMLElement', function () {
            for (var k = 0; k < items.length; k++) {
                expect(items[k]).to.be.a(HTMLElement);
            }
        });
    }

    it('item methods', function (done) {
        FlorianMath.initialized().then(() => {
            for (var k = 0; k < items.length; k++) {
                expect(items[k]).to.have.property('render');
                expect(items[k]).to.have.property('getRenderElements');
            }
            done();
        });
    });

});
