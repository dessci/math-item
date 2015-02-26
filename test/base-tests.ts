/// <reference path="mocha.d.ts" />
/// <reference path="expect.js.d.ts" />
/// <reference path="../dist/math-item.d.ts" />
/// <reference path="base-app.d.ts" />

describe('math-item elements', function () {
    var itemCount = 4,
        items = document.querySelectorAll('math-item');

    function map<T, S>(list: T[], fn: (T) => S): S[] {
        var k, result: S[] = [];
        for (k = 0; k < list.length; k++)
            result.push(fn(list[k]));
        return result;
    }

    function itemContents(item: IHTMLMathItemElement): Node[] {
        var showSources = [], otherSources = [], html = [], n, k;
        expect(item).to.be.ok();
        for (n = item.firstChild; n; n = n.nextSibling) {
            if (n.nodeType === 1 && (<Element> n).tagName.toLowerCase() === 'math-source') {
                if (FlorianMath.getElementStyle(n, 'display') !== 'none')
                    showSources.push(n);
                else
                    otherSources.push(n);
            } else
                html.push(n);
        }
        if (item.shadowRoot) {
            var shadow = [];
            expect(html).to.be.empty();
            for (n = item.shadowRoot.firstChild; n; n = n.nextSibling) {
                shadow.push(n);
            }
            if (showSources.length) {
                expect(shadow).to.have.length(1);
                expect(shadow[0].nodeType).to.be(1);
                expect(shadow[0].tagName.toLowerCase()).to.be('content');
            } else
                html = shadow;
        }
        if (showSources.length) {
            expect(html).to.be.empty();
            for (k = 0; k < showSources.length; k++) {
                for (n = showSources[k].firstChild; n; n = n.nextSibling) {
                    html.push(n);
                }
            }
        }
        return html;
    }

    it('global object HTMLMathItemElement', function () {
        expect(window).to.have.property('HTMLMathItemElement');
        expect(window.HTMLMathItemElement).to.have.property('render');
        expect(window.HTMLMathItemElement).to.have.property('manualCreate');
        expect(window.HTMLMathItemElement).to.have.property('manualAttach');
    });

    it('global object HTMLMathSourceElement', function () {
        expect(window).to.have.property('HTMLMathSourceElement');
        expect(window.HTMLMathSourceElement).to.have.property('manualCreate');
        expect(window.HTMLMathSourceElement).to.have.property('manualAttach');
    });

    it('number of items', function () {
        expect(items.length).to.be(itemCount);
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
                expect(items[k]).to.have.property('clean');
                expect(items[k]).to.have.property('getSources');
            }
            done();
        });
    });

    it('render call count', function () {
        expect(BaseApp.renderCount).to.be(itemCount);
    });

    it('getSources', function (done) {
        FlorianMath.initialized().then(() => {
            var item = <IHTMLMathItemElement> document.querySelector('#item4'), sources;

            sources = map(item.getSources(), src => src.getAttribute('name'));
            expect(sources).to.have.length(12);
            expect(sources).to.contain('A4');
            expect(sources).to.contain('B4');
            expect(sources).to.contain('C4');
            expect(sources).to.contain('D4');
            expect(sources).to.contain('E4');
            expect(sources).to.contain('F4');
            expect(sources).to.contain('G4');
            expect(sources).to.contain('H4');
            expect(sources).to.contain('I4');
            expect(sources).to.contain('J4');
            expect(sources).to.contain('K4');
            expect(sources).to.contain('L4');

            sources = map(item.getSources({render: true}), src => src.getAttribute('name'));
            expect(sources).to.have.length(6);
            expect(sources).to.contain('A4');
            expect(sources).to.contain('D4');
            expect(sources).to.contain('E4');
            expect(sources).to.contain('H4');
            expect(sources).to.contain('I4');
            expect(sources).to.contain('L4');

            sources = map(item.getSources({markup: true}), src => src.getAttribute('name'));
            expect(sources).to.have.length(6);
            expect(sources).to.contain('A4');
            expect(sources).to.contain('B4');
            expect(sources).to.contain('E4');
            expect(sources).to.contain('F4');
            expect(sources).to.contain('I4');
            expect(sources).to.contain('J4');

            sources = map(item.getSources({type: 'type/1'}), src => src.getAttribute('name'));
            expect(sources).to.have.length(4);
            expect(sources).to.contain('E4');
            expect(sources).to.contain('F4');
            expect(sources).to.contain('G4');
            expect(sources).to.contain('H4');

            sources = map(item.getSources({render: true, type: 'type/2'}), src => src.getAttribute('name'));
            expect(sources).to.have.length(2);
            expect(sources).to.contain('I4');
            expect(sources).to.contain('L4');

            done();
        });
    });

    it('render output', function () {
        var item, html;

        item = <HTMLElement> document.querySelector('#item1');
        html = itemContents(item);
        expect(html).to.have.length(1);
        expect(html[0].nodeType).to.be(3);
        expect(html[0].nodeValue).to.be('A1');

        item = <HTMLElement> document.querySelector('#item2');
        html = itemContents(item);
        expect(html).to.have.length(1);
        expect(html[0].nodeType).to.be(3);
        expect(html[0].nodeValue).to.be('B2');

        item = <HTMLElement> document.querySelector('#item3');
        html = itemContents(item);
        expect(html).to.have.length(1);
        expect(html[0].nodeType).to.be(3);
        expect(html[0].nodeValue).to.be('C3');
    });

});
