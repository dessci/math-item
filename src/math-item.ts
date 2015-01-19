interface Document {
    registerElement(tagName: string, options: any): void;
}

(function (document: Document) {

    var proto = Object.create(HTMLElement.prototype);

    proto.createdCallback = () => {
        console.log('created');
    };

    proto.attachedCallback = () => {
        console.log('attached');
    };

    proto.detachedCallback = () => {
        console.log('detached');
    };

    document.registerElement('math-item', {
        prototype: proto
    });

})(document);
