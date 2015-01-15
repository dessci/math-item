/// <reference path="math-ui-microjq.ts" />
/// <reference path="math-ui-utils.ts" />
/// <reference path="../../typings/jquery.d.ts" />

// declare var ClipboardEvent: any;

// core

module MathUI {
    'use strict';

    export interface QueryStaticBase {
        (element: Element): MicroJQ;
        (element: Node): MicroJQ;
        (elements: Element[]): MicroJQ;
        parseXML(data: string): XMLDocument;
    }

    var $: QueryStaticBase = microJQ;
    var _ = getUtils();

    export interface SourceData {
        type: string;
        subtype?: string;
        source: string;
    }

    export interface LookAndFeel {
        init(element: MathItem);
    }

    export class Handler {
        canHandle(el: HTMLElement): boolean {
            return false;  // disable auto-discover by default
        }
        init(el: HTMLElement): Promise<void> {
            return null;
        }
        clonePresentation(from: HTMLElement, to: HTMLElement) {
            $(to).append($(from).contents().clone());
        }
        getSources(el?: HTMLElement): IPromise<SourceData[]> {
            return Promise.resolve([]);
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

    export class MathItem {
        static idCounter = 0;
        public id: string;
        public name: string;
        private handler: Handler;
        constructor(public element: HTMLElement, public container: MathItemContainer) {
            var el = $(element),
                index = ++MathItem.idCounter,
                type: string = el.data('type'),
                handler = handlerStore.get(type) || handlerStore.find((handler: Handler) => handler.canHandle(element));
            if (!handler)
                throw 'MathUI: No matching handler';
            this.id = 'math-ui-element-' + index;
            this.name = 'Equation ' + (index + 1);
            this.handler = handler;
            el.attr('id', this.id).attr('tabindex', 0).attr('role', 'math');
        }
        initHandler(): Promise<void> {
            return this.handler.init(this.element);
        }
        clonePresentation(to: MicroJQ) {
            this.handler.clonePresentation(this.element, to[0]);
        }
        getSources(): IPromise<SourceData[]> {
            return this.handler.getSources(this.element);
        }
        changeHighlight(on: boolean) {
            var el = $(this.element);
            on ? el.addClass('highlight') : el.removeClass('highlight');
        }
    }

    export var prettifyMathML: (el: Element) => string = (function () {
        var mathml_token_elements = ['mi', 'mn', 'mo', 'ms', 'mtext', 'ci', 'cn', 'cs', 'csymbol', 'annotation'];

        function tagToString(n: Node, inner: string, indent?: string) {
            var name = n.nodeName.toLowerCase();
            var ret = '<' + name + _.map(n.attributes, (attr: Attr) => ' ' + attr.name + '="' + attr.value + '"').join('');
            if (indent) ret = indent + ret;
            return inner ? ret + '>' + inner + '</' + name + '>' : ret + ' />';
        }

        function serializeInner(n: Node) {
            return _.map($(n).contents(), c => serializeNode(c)).join('');
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
                var items = _.map($(el).children(), c => prettifyElement(c, indent + '  '));
                if (items)
                    inner = '\n' + items.join('\n') + '\n' + indent;
            }
            return tagToString(el, inner, indent);
        }

        return (el: Element) => prettifyElement(el, '');
    })();

    export function registerHandler(type: string, handler: Handler): Handler {
        return handlerStore.put(type, handler);
    }

    export class MathItemContainer {
        private itemDict: Dictionary<MathItem> = {};
        private highlighted = false;
        private addOne(element: HTMLElement): Promise<void> {
            var mathItem = new MathItem(element, this),
                renderPromise = mathItem.initHandler();
            this.itemDict[mathItem.id] = mathItem;
            this.init(mathItem);
            return renderPromise;
        }
        add(arg: any): IPromise<any> {
            if (_.isArray(arg)) {
                var promises: IPromise<void>[] = [];
                _.each(<List<HTMLElement>> arg, (element: HTMLElement) => {
                    var promise = this.addOne(element);
                    if (promise) promises.push(promise);
                });
                return Promise.all(promises);
            }
            return this.addOne(<HTMLElement> arg);
        }
        highlightAll() {
            var on = this.highlighted = !this.highlighted;
            _.each(this.itemDict, (mathItem: MathItem) => {
                mathItem.changeHighlight(on);
            });
        }
        init(mathItem: MathItem) {
        }
        showDashboard() {
        }
    }

    var queryLibReadyQueue: {(qlib: QueryStaticBase): void}[] = [];
    var startedPromise = makePromiseWithResolver<QueryStaticBase>();

    export function queryLibReady(callback: (qlib: QueryStaticBase) => void) {
        if (queryLibReadyQueue === undefined) callback($);
        queryLibReadyQueue.push(callback);
    }

    export var started = () => startedPromise;

    microJQ.ready().then(function () {
        if ('jQuery' in window && jQuery.fn.on) $ = jQuery;
        _.each(queryLibReadyQueue, (callback: (qlib: QueryStaticBase) => void) => {
            callback($);
        });
        queryLibReadyQueue = undefined;
        startedPromise.resolve($);
    });

}
