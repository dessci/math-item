/// <reference path="math-ui-utils.ts" />

interface Element {
    microjqid: string;
}

module MathUI {
    'use strict';

    export interface BaseMicroJQEventObject extends Event {
        preventDefault(): any;
        stopPropagation(): void;
        which: number;
        originalEvent: Event;
    }

    export interface MicroJQInputEventObject extends BaseMicroJQEventObject {
    }

    export interface MicroJQMouseEventObject extends MicroJQInputEventObject {
    }

    export interface MicroJQKeyEventObject extends MicroJQInputEventObject {
    }

    export interface MicroJQEventObject extends BaseMicroJQEventObject, MicroJQInputEventObject,
        MicroJQMouseEventObject, MicroJQKeyEventObject {
    }

    export interface MicroJQEventHandler {
        (eventObject?: MicroJQEventObject): void;
    }

    export interface MicroJQ extends List<HTMLElement> {
        toArray(): Element[];
        find(selector: string): MicroJQ;
        first(): MicroJQ;
        contents(): MicroJQ;
        children(): MicroJQ;
        clone(): MicroJQ;
        each(func: (index: number, elem: Element) => any): MicroJQ;
        data(key: string): any;
        attr(attributeName: string, value: string): MicroJQ;
        attr(attributeName: string, value: number): MicroJQ;
        removeAttr(attributeName: string);
        width(): number;
        height(): number;
        on(events: string, handler: MicroJQEventHandler): MicroJQ;
        off(events: string, handler?: MicroJQEventHandler): MicroJQ;
        append(content1: MicroJQ, ...content2: any[]): MicroJQ;
        append(content1: Element, ...content2: any[]): MicroJQ;
        append(content1: any[], ...content2: any[]): MicroJQ;
        append(content1: string, ...content2: any[]): MicroJQ;
        text(txt: string): MicroJQ;
        text(): string;
        addClass(className: string): MicroJQ;
        removeClass(className?: string): MicroJQ;
        css(propertyName: string, value: string): MicroJQ;
        blur(): MicroJQ;
        focus(): MicroJQ;
        remove(): MicroJQ;
    }

    export interface MicroJQStatic {
        (element: Element): MicroJQ;
        (element: Node): MicroJQ;
        (elements: Element[]): MicroJQ;
        parseXML(data: string): XMLDocument;
        ready: () => IPromise<void>;
    }

    interface ElementEvents extends Dictionary<MicroJQEventHandler[]> { }

    interface ElementStore {
        events: ElementEvents;
        handler: (event: Event) => void;
    }

    interface ElementStoreMap extends Dictionary<ElementStore> { }

    export var microJQ: MicroJQStatic = (function (window: Window, document: Document, undefined?: any) {
        'use strict';

        var _ = getUtils();

        // internals

        var elementStore: ElementStoreMap = {};
        var elementCounter: number = 0;

        function nextId(): string {
            return '' + (++elementCounter);
        }

        function getElementStore(element: Element): ElementStore {
            var elementId = element.microjqid;
            var store = elementId && elementStore[elementId];

            if (!store) {
                element.microjqid = elementId = nextId();
                elementStore[elementId] = store = { events: {}, handler: undefined };
            }

            return store;
        }

        function addEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void) {
            if (el.addEventListener)
                el.addEventListener(type, callback, false);
            else
                (<MSEventAttachmentTarget> <any> el).attachEvent('on' + type, callback);
        }

        function removeEventListenerFn(el: EventTarget, type: string, callback: (event?: Event) => void) {
            if (el.removeEventListener)
                el.removeEventListener(type, callback, false);
            else
                (<MSEventAttachmentTarget> <any> el).detachEvent('on' + type, callback);
        }

        var KEYBOARD_EVENTS = ['keydown', 'keyup', 'keypress'];
        var MOUSE_EVENTS = ['mousedown', 'mouseup', 'click'];
        var mouseButtonToWhich = [1, 1, 3, 0, 2];  // 0,1 -> 1, 4 -> 2, 2 -> 3

        var MicroJQEvent = (function () {
            function MicroJQEvent(event: Event) {
                this.originalEvent = event;
                this.type = event.type;
                this.target = event.target || event.srcElement;
                this.which = 0;
                if (_.contains(KEYBOARD_EVENTS, event.type))
                    this.which = (<KeyboardEvent> event).which || (<KeyboardEvent> event).keyCode;
                else if (_.contains(MOUSE_EVENTS, event.type))
                    this.which = (<MouseEvent> event).which !== undefined ? (<MouseEvent> event).which
                        : mouseButtonToWhich[(<MouseEvent> event).button];
            }
            MicroJQEvent.prototype.preventDefault = Event.prototype.preventDefault
                ? function () { this.originalEvent.preventDefault(); }
                : function () { (<MSEventObj> this.originalEvent).returnValue = false; };
            MicroJQEvent.prototype.stopPropagation = Event.prototype.stopPropagation
                ? function () { this.originalEvent.stopPropagation(); }
                : function () { (<MSEventObj> this.originalEvent).cancelBubble = true; };
            return MicroJQEvent;
        })();

        function createEventHandler(element: Element, events: ElementEvents): (event: Event) => void {
            function eventHandler(event: Event) {
                var eventFns = events[event.type];
                if (eventFns && eventFns.length) {
                    var mjqevent = new MicroJQEvent(event);
                    if (eventFns.length > 1)
                        eventFns = _.toArray(eventFns);  // make copy to avoid changes while looping
                    _.each(eventFns, (fn: MicroJQEventHandler) => {
                        fn.call(element, mjqevent);
                    });
                }
            }
            return eventHandler;
        }

        function elementOff(el: Element, type?: string, fn?: MicroJQEventHandler) {
            var store = getElementStore(el);
            var events = store.events;
            var handler = store.handler;

            if (!handler) return;

            if (type) {
                _.each(_.words(type), (type: string) => {
                    if (fn) {
                        var listeners = events[type];
                        if (listeners) {
                            listeners = _.without(listeners, fn);
                            if (listeners.length) return;
                        }
                    }
                    removeEventListenerFn(el, type, handler);
                    delete events[type];
                });
            } else {
                /* tslint:disable:forin */
                for (type in events) {
                    removeEventListenerFn(el, type, handler);
                    delete events[type];
                }
                /* tslint:enable:forin */
            }
        }

        function elementRemoveData(element: Element) {
            var elementId = element.microjqid;
            var store = elementId && elementStore[elementId];

            if (store) {
                if (store.handler) {
                    elementOff(element);
                }
                delete elementStore[elementId];
                element.microjqid = undefined;
            }
        }

        function subTreeRemoveData(element: Element) {
            elementRemoveData(element);
            _.each(element.querySelectorAll('*'), (descendant: Element) => {
                elementRemoveData(descendant);
            });
        }

        // MicroJQ

        function MicroEl(elements: Element[]) {
            this.length = 0;
            _.each(elements, (el: Element) => {
                this[this.length++] = el;
            });
        }

        var deepClone = (function (): (n: Node) => Node {
            function deepCloneNew(el: Node): Node {
                return el.cloneNode(true);
            }

            function deepCloneOld(el: Node): Node {
                var n = el.cloneNode(false);
                if (n.nodeType === 1 /*Node.ELEMENT_NODE*/ && el.nodeName.toLowerCase() === 'script') {
                    (<HTMLScriptElement> n).text = (<HTMLScriptElement> el).text;
                } else {
                    for (var c = el.firstChild; c !== null; c = c.nextSibling)
                        n.appendChild(deepCloneOld(c));
                }
                return n;
            }

            var s = document.createElement('script');
            s.text = 'x';
            return (<HTMLScriptElement> s.cloneNode(true)).text === 'x' ? deepCloneNew : deepCloneOld;
        })();

        function setText(el: Element, txt: string) {
            if (el.textContent !== undefined)
                el.textContent = txt;
            else
            (<HTMLElement> el).innerText = txt;
        }

        function getText(el: Element) {
            return el.textContent !== undefined ? el.textContent
                : (<HTMLScriptElement> el).text !== undefined ? (<HTMLScriptElement> el).text
                : (<HTMLElement> el).innerText;
        }

        function allChildren(collection: List<Node>, filter?: (n: Node) => boolean): Element[] {
            var matches = [];
            _.each(collection, (el: Node) => {
                var child: Node = el.firstChild;
                while (child != null) {
                    if (!filter || filter(child))
                        matches.push(child);
                    child = child.nextSibling;
                }
            });
            return matches;
        }

        MicroEl.prototype = {

            find: function (selector: string): MicroJQ {
                var matches = [];
                _.each(this, (el: Element) => {
                    _.each(el.querySelectorAll(selector), (n: Node) => {
                        matches.push(n);
                    });
                });
                return new MicroEl(matches);
            },

            contents: function (): MicroJQ {
                return new MicroEl(allChildren(this));
            },

            children: function (): MicroJQ {
                return new MicroEl(allChildren(this, (n: Node) => n.nodeType === 1));
            },

            clone: function (): MicroJQ {
                return new MicroEl(_.map(this, <(el: Element) => Element> deepClone));
            },

            first: function (): MicroJQ {
                return this.length === 0 ? this : new MicroEl([this[0]]);
            },

            data: function (key: string): any {
                return this[0].getAttribute('data-' + key);
            },

            width: function (): number {
                var br = (<HTMLElement> this[0]).getBoundingClientRect();
                return br.width !== undefined ? br.width : (br.right - br.left);
            },

            height: function (): number {
                var br = (<HTMLElement> this[0]).getBoundingClientRect();
                return br.height !== undefined ? br.height : (br.bottom - br.top);
            },

            each: function (func: (indexInArray?: number, valueOfElement?: Element) => any): MicroJQ {
                return <MicroJQ> _.each(this, (el: Element, i: number) => {
                    func.call(el, i, el);
                });
            },

            text: function (txt?: string): any {
                if (txt !== undefined) {
                    return _.each(this, (el: Element) => {
                        setText(el, txt);
                    });
                } else {
                    return _.map(this, getText).join('');
                }
            },

            append: function (...content: any[]): MicroJQ {
                var nodes: Node[] = [];
                _.each(content, (item: any) => {
                    _.each(_.isArray(item) ? item : [item], (e: any) => {
                        if (e instanceof MicroEl) {
                            Array.prototype.push.apply(nodes, _.toArray(<MicroJQ> e));
                        } else {
                            nodes.push(typeof e === 'string' ? document.createTextNode(e) : e);
                        }
                    });
                });
                _.each(this, (el: Element, j: number) => {
                    var clone = j < this.length - 1;
                    _.each(nodes, (n: Node) => {
                        el.appendChild(clone ? n.cloneNode(true) : n);
                    });
                });
                return this;
            },

            toArray: function (): Element[] {
                return _.toArray(<List<Element>> this);
            }

        };

        // element chaining

        _.map({

            blur: (el: HTMLElement) => {
                el.blur();
            },

            focus: (el: HTMLElement) => {
                el.focus();
            },

            css: (el: HTMLElement, propertyName: string, value: string) => {
                el.style[propertyName] = value;
            },

            remove: (el: HTMLElement) => {
                subTreeRemoveData(el);
                var parent = el.parentNode;
                if (parent) parent.removeChild(el);
            },

            addClass: (el: HTMLElement, className: string) => {
                el.className = _.union(_.words(el.className), _.words(className)).join(' ');
            },

            removeClass: (el: HTMLElement, className?: string) => {
                el.className = className ? _.difference(_.words(el.className), _.words(className)).join(' ') : '';
            },

            attr: (el: Element, attributeName: string, value: string) => {
                el.setAttribute(attributeName, value);
            },

            removeAttr: (el: Element, attributeName: string) => {
                el.removeAttribute(attributeName);
            },

            on: (el: Element, type: string, fn: MicroJQEventHandler) => {
                var store = getElementStore(el),
                    events = store.events,
                    handler = store.handler;

                if (!handler)
                    handler = store.handler = createEventHandler(el, events);

                _.each(_.words(type), (type: string) => {
                    var eventFns = events[type];
                    if (!eventFns) {
                        eventFns = events[type] = [];
                        addEventListenerFn(el, type, handler);
                    }
                    eventFns.push(fn);
                });
            },

            off: elementOff

        }, (method: (el: HTMLElement, arg1: any, arg2: any) => void, name: string) => {
                MicroEl.prototype[name] = function (arg1: any, arg2: any): MicroJQ {
                    return <MicroJQ> _.each(this, (el: HTMLElement) => {
                        method(el, arg1, arg2);
                    });
                };
            });

        var microJQ = <MicroJQStatic> function (arg: any): MicroJQ {
            return new MicroEl(_.isArray(arg) ? arg : [arg]);
        };

        microJQ.ready = (function () {
            var promise = document.readyState === 'complete'
                ? Promise.resolve<void>()
                : new Promise<void>(function (resolve: () => void) {
                    var fired = false;

                    function trigger() {
                        if (fired) return;
                        fired = true;
                        resolve();
                    }

                    if (document.addEventListener) {
                        document.addEventListener('DOMContentLoaded', trigger);
                    }
                    if (document.attachEvent) {
                        document.attachEvent('onreadystatechange', (): void => {
                            if (document.readyState === 'complete')
                                trigger();
                        });
                    }
                    addEventListenerFn(window, 'load', trigger);
                });

            return () => promise;
        })();

        // http://stackoverflow.com/a/7951947/212069
        microJQ.parseXML = typeof DOMParser === 'function'
            ? (data: string) => (new DOMParser()).parseFromString(data, 'text/xml')
            : typeof ActiveXObject === 'function' && new ActiveXObject('Microsoft.XMLDOM')
            ? (data: string) => {
                var xmlDoc = new ActiveXObject('Microsoft.XMLDOM');
                xmlDoc.async = 'false';
                xmlDoc.loadXML(data);
                return xmlDoc;
            } : () => {
                throw new Error('parseXML not supported');
            };
 
        // http://stackoverflow.com/a/4916895/212069
        /*microJQ.serializeXML = typeof XMLSerializer === 'function'
            ? (n: Node) => (new XMLSerializer()).serializeToString(n)
            : (n: Node) => {
                if (!('xml' in n)) throw new Error('serializeXML not supported');
                return (<any> n).xml;
            };*/

        return microJQ;

    })(window, document);

}
