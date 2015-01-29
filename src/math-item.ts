/// <reference path="promise.ts" />
/// <reference path="common-utils.ts" />
/// <reference path="dom-utils.ts" />
/// <reference path="xml-utils.ts" />

interface Document {
    registerElement(tagName: string, options: any): void;
}

module FlorianMath {
    'use strict';

    export interface MarkupData {
        type: string;
        subtype?: string;
        markup: string;
    }

    export interface HTMLMathItemElement extends HTMLElement {
        rendered(): IPromise<void>;
        getMarkup?(): IPromise<MarkupData[]>;
        clonePresentation?(dest: HTMLElement): IPromise<void>;
    }

    interface PrivateMathItemElement extends HTMLMathItemElement {
        _id: number;
        _handler: Handler;
    }

    var _ = _utils.common, dom = _utils.dom;

    export class Handler {
        ready(el: HTMLMathItemElement) {
            el.clonePresentation = function (dest: HTMLElement) {
                _.each(dom.getNodeChildren(this), (child: Node) => {
                    dest.appendChild(child.cloneNode(true));
                });
                return Promise.resolve<void>();
            };
        }
        canHandle(el: HTMLElement): boolean {
            return false;
        }
    }

    class HandlerStore {
        private handlerDict: Dictionary<Handler> = {};
        private handlerOrder: string[] = [];
        put(type: string, handler: Handler): Handler {
            var previous = this.remove(type);
            this.handlerDict[type] = handler;
            this.handlerOrder.splice(0, 0, type);
            return previous;
        }
        get(type: string): Handler {
            return this.handlerDict[type];
        }
        remove(type: string): Handler {
            if (type in this.handlerDict) {
                var k = _.indexOf(this.handlerOrder, type);
                if (k >= 0)
                    this.handlerOrder.splice(k, 1);
                delete this.handlerDict[type];
            }
            return null;
        }
        find(fn: (handler: Handler) => boolean): Handler {
            for (var k = 0; k < this.handlerOrder.length; k++) {
                var handler = this.handlerDict[this.handlerOrder[k]];
                if (fn(handler)) return handler;
            }
        }
    }

    var handlerStore = new HandlerStore();

    export function registerHandler(type: string, handler: Handler): Handler {
        return handlerStore.put(type, handler);
    }

    // Default container

    export var container: HTMLMathItemElement[] = [];

    // MathItem callbacks

    function mathItemAttached(mathItem: HTMLMathItemElement) {
        var rendered = _utils.makePromiseWithResolve<void>();
        mathItem.setAttribute('role', 'math');
        (<PrivateMathItemElement> mathItem)._id = container.length;
        container.push(mathItem);
        (<PrivateMathItemElement> mathItem)._handler = handlerStore.get(mathItem.getAttribute('handler'))
            || handlerStore.find((h: Handler) => h.canHandle(mathItem));
        mathItem.rendered = () => rendered;
        dom.async(() => {
            mathItemDOMReady(mathItem);
        });
    }

    function mathItemDOMReady(mathItem: HTMLMathItemElement) {
        (<PrivateMathItemElement> mathItem)._handler.ready(mathItem);
    }

    function mathItemDetached(mathItem: HTMLMathItemElement) {
        var index = (<PrivateMathItemElement> mathItem)._id;
        delete container[index];
    }

    export function addMathItem(el: HTMLElement) {
        mathItemAttached(<HTMLMathItemElement> el);
    }

    export function removeMathItem(el: HTMLElement) {
        mathItemDetached(<HTMLMathItemElement> el);
    }

    if (document.registerElement) {
        var proto = Object.create(HTMLElement.prototype);

        proto.attachedCallback = function () {
            mathItemAttached(this);
        };

        proto.detachedCallback = function () {
            mathItemDetached(this);
        };

        document.registerElement('math-item', {
            prototype: proto
        });
    } else {
        // make browser accept this tag for IE < 9
        document.createElement('math-item');
        dom.ready().then(() => {
            var items = document.querySelectorAll('math-item');
            _.each(items, (item: Node) => {
                addMathItem(<HTMLElement> item);
            });
        });
    }

}
