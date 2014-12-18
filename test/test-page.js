/// <reference path="../typings/mocha.d.ts" />
/// <reference path="../typings/expect.js.d.ts" />
/// <reference path="../dist/math-ui-v0.1.d.ts" />
describe('MathUI test page', function () {
    var $ = MathUI.get$();
    describe('math-ui elements', function () {
        var elems = $(document).find('.math-ui');
        it('element count', function () {
            expect(elems.length).to.be(2);
        });
        it('tabindex="0"', function () {
            elems.each(function (k, el) {
                expect(el.getAttribute('tabindex')).to.be('0');
            });
        });
        it('role="math"', function () {
            elems.each(function (k, el) {
                expect(el.getAttribute('role')).to.be('math');
            });
        });
        it('id="math-ui-element-??"', function () {
            elems.each(function (k, el) {
                expect(el.getAttribute('id')).to.match(/^math-ui-element-\d+$/);
            });
        });
    });
});
