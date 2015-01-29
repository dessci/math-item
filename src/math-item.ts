interface Document {
    registerElement(tagName: string, options: any): any;
}

interface IHTMLMathItemElement extends HTMLElement {
}

interface IHTMLMathSourceElement extends HTMLElement {
}

interface Window {
    HTMLMathItemElement: IHTMLMathItemElement;
    HTMLMathSourceElement: IHTMLMathSourceElement;
}

(function (win: Window, doc: Document) {

    if (doc.registerElement) {
     
        function mathItemCreated() {
            console.log('math-item created', this);
        }

        function mathItemAttached() {
            console.log('math-item attached', this);
        }

        function mathSourceCreated() {
            console.log('math-source created', this);
        }

        function mathSourceAttached() {
            console.log('math-source attached', this);
        }

        var MathItemPrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: mathItemCreated },
            attachedCallback: { enumerable: true, value: mathItemAttached }
        });

        var MathSourcePrototype = Object.create(HTMLElement.prototype, {
            createdCallback: { enumerable: true, value: mathSourceCreated },
            attachedCallback: { enumerable: true, value: mathSourceAttached }
        });

        win.HTMLMathItemElement = doc.registerElement('math-item', { prototype: MathItemPrototype });
        win.HTMLMathSourceElement = doc.registerElement('math-source', { prototype: MathSourcePrototype });

    }

})(window, document);
