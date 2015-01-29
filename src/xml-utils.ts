/// <reference path="common-utils.ts" />
/// <reference path="dom-utils.ts" />

module FlorianMath {
    'use strict';

    export interface IUtils {
        xml: {
            parseXML(data: string): Document;
            prettifyMathML(el: Element): string;
        }
    }

    var _ = _utils.common;
    var dom = _utils.dom;

    _utils.xml = {
        // http://stackoverflow.com/a/7951947/212069
        parseXML: typeof DOMParser === 'function'
            ? (data: string) => (new DOMParser()).parseFromString(data, 'text/xml')
            : typeof ActiveXObject === 'function' && new ActiveXObject('Microsoft.XMLDOM')
            ? (data: string) => {
                var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
                xmlDoc.async = 'false';
                xmlDoc.loadXML(data);
                return xmlDoc;
            } : () => {
                throw new Error('parseXML not supported');
            },

        prettifyMathML: (function () {
            var mathml_token_elements = ['mi', 'mn', 'mo', 'ms', 'mtext', 'ci', 'cn', 'cs', 'csymbol', 'annotation'];

            function tagToString(n: Node, inner: string, indent?: string) {
                var name = n.nodeName.toLowerCase();
                var ret = '<' + name + _.map(n.attributes, (attr: Attr) => ' ' + attr.name + '="' + attr.value + '"').join('');
                if (indent) ret = indent + ret;
                return inner ? ret + '>' + inner + '</' + name + '>' : ret + ' />';
            }

            function serializeInner(n: Node) {
                return _.map(dom.getNodeChildren(n), c => serializeNode(c)).join('');
            }

            function serializeNode(n: Node) {
                switch (n.nodeType) {
                    case 1: return tagToString(n, serializeInner(n));
                    case 3: return n.nodeValue;
                    case 8: return '<!--' + n.nodeValue + '-->';
                }
                return '';
            }

            function prettifyElement(el: Element, indent: string): string {
                if (el.nodeType !== 1)
                    throw new Error('prettifyMathML: expected Element node');
                var name = el.nodeName.toLowerCase(), inner = '';
                if (_.contains(mathml_token_elements, name)) {
                    inner = _.words(serializeInner(el)).join(' ');
                } else {
                    var items = _.map(dom.getElementChildren(el), c => prettifyElement(c, indent + '  '));
                    if (items)
                        inner = '\n' + items.join('\n') + '\n' + indent;
                }
                return tagToString(el, inner, indent);
            }

            return (el: Element) => prettifyElement(el, '');
        })()

    };

}
