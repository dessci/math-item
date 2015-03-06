/// <reference path="mocha.d.ts" />
/// <reference path="expect.js.d.ts" />
/// <reference path="../dist/math-item.d.ts" />
/// <reference path="../dist/autowrap-mathjax.d.ts" />

describe('mathjax wrap', function () {

    var firstResolve, secondResolve,
        first = new FlorianMath.Promise<void>((resolve: () => void) => { firstResolve = resolve; }),
        second = new FlorianMath.Promise<void>((resolve: () => void) => { secondResolve = resolve; });

    function tagNamed(n: Node, tagName: string) {
        return n.nodeType === 1 && (<Element> n).tagName.toLowerCase() === tagName;
    }

    function tagWithClass(n: Node, tagName: string, className: string) {
        return tagNamed(n, tagName) && (<HTMLElement> n).className === className;
    }

    function visibleContents(item: HTMLElement): Node[] {
        var n, visible: Node[] = [];

        for (n = item.firstChild; n; n = n.nextSibling) {
            if (tagNamed(n, 'script') || FlorianMath.getElementStyle(n, 'display') !== 'none')
                visible.push(n);
        }

        if (item.shadowRoot) {
            var shadow: Node[] = [];
            for (n = item.shadowRoot.firstChild; n; n = n.nextSibling) {
                if (n.nodeType === 1 && (<Element> n).tagName.toLowerCase() === 'content')
                    Array.prototype.push.apply(shadow, visible);
                else
                    shadow.push(n);
            }
            visible = shadow;
        }

        return visible;
    }

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

    (function () {
        var count = 0;
        FlorianMath.addCustomEventListener(document, 'wrapped.mathjax-wrap.math-item', function () {
            count++;
            switch (count) {
                case 4: firstResolve(); break;
                case 6: secondResolve(); break;
            }
        });
    })();

    before(function (done) {
        first.then(() => {
            setTimeout(function () {
                insertInline();
                insertBlock();
            }, 500);
            done();
        });
    });

    function check(count: number) {
        var items = document.querySelectorAll(FlorianMath.MATH_ITEM_TAG);
        expect(items).to.have.length(count);
        FlorianMath.each(items, function (item: HTMLElement) {
            var visible = visibleContents(item), script;
            expect(visible).to.have.length(3);
            if (!tagWithClass(visible[0], 'span', 'MathJax_Preview'))
                expect().fail('child 0 != <span class="MathJax_Preview">');
            if (!tagWithClass(visible[1], 'span', 'MathJax') && !tagWithClass(visible[1], 'div', 'MathJax_Display'))
                expect().fail('child 1 != <span class="MathJax"> / <div class="MathJax_Display">');
            if (!tagNamed(visible[2], 'script'))
                expect().fail('no script tag');
            script = <HTMLScriptElement> visible[2];
            if (script.type !== 'math/tex' && script.type !== 'math/tex; mode=display' && script.type !== 'math/mml')
                expect().fail('illegal script type');
        });
    }

    it('initial items', function () {
        check(4);
    });

    it('items after dynamic insert', function (done) {
        /* Typesetting inserted math may take longer than 2s in old browsers */
        this.timeout(5000);
        second.then(() => {
            check(6);
            done();
        });
    });

});
