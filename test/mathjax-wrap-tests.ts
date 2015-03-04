/// <reference path="mocha.d.ts" />
/// <reference path="expect.js.d.ts" />
/// <reference path="../dist/math-item.d.ts" />
/// <reference path="../dist/autowrap-mathjax.d.ts" />

describe('mathjax wrap', function () {

    var state = 0, firstResolve, secondResolve,
        first = new FlorianMath.Promise<void>((resolve: () => void) => { firstResolve = resolve; }),
        second = new FlorianMath.Promise<void>((resolve: () => void) => { secondResolve = resolve; });

    function insertInline() {
        var p = document.createElement('p'),
            script = document.createElement('script');
        script.type = 'math/tex';
        script.text = '\\sqrt{x}';
        p.appendChild(document.createTextNode('Pre equation '));
        p.appendChild(script);
        p.appendChild(document.createTextNode(' post equation.'));
        document.querySelector('#container').appendChild(p);
        MathJax.Hub.Queue(['Process', MathJax.Hub, script]);
    }

    function insertBlock() {
        var script = document.createElement('script');
        script.type = 'math/tex; mode=display';
        script.text = '\\sum_{k=1}^n k^2';
        document.querySelector('#container').appendChild(script);
        MathJax.Hub.Queue(['Process', MathJax.Hub, script]);
    }

    FlorianMath.AutowrapMathJax.addListener('end', function () {
        state++;
        switch (state) {
            case 1: firstResolve(); break;
            case 3: secondResolve(); break;
        }        
    });

    first.then(() => {
        setTimeout(function () {
            insertInline();
            insertBlock();
        }, 500);
    });

    function check(count: number, done: () => void) {
        var items = document.querySelectorAll(FlorianMath.MATH_ITEM_TAG);
        expect(items).to.have.length(count);
        done();
    }

    it('initial items', function (done) {
        first.then(() => {
            check(4, done);
        });
    });

    it('items after dynamic insert', function (done) {
        second.then(() => {
            check(6, done);
        });
    });

});
