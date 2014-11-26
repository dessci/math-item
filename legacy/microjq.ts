// https://github.com/borisyankov/DefinitelyTyped/blob/master/jquery/jquery.d.ts

interface BaseMicroJQEventObject extends Event {
    data: any;
    delegateTarget: Element;
    isDefaultPrevented(): boolean;
    isImmediatePropagationStopped(): boolean;
    isPropagationStopped(): boolean;
    namespace: string;
    originalEvent: Event;
    preventDefault(): any;
    relatedTarget: Element;
    result: any;
    stopImmediatePropagation(): void;
    stopPropagation(): void;
    pageX: number;
    pageY: number;
    which: number;
    metaKey: boolean;
}

interface MicroJQInputEventObject extends BaseMicroJQEventObject {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

interface MicroJQMouseEventObject extends MicroJQInputEventObject {
    button: number;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
}

interface MicroJQKeyEventObject extends MicroJQInputEventObject {
    char: any;
    charCode: number;
    key: any;
    keyCode: number;
}

interface MicroJQEventObject extends BaseMicroJQEventObject, MicroJQInputEventObject, MicroJQMouseEventObject, MicroJQKeyEventObject {
}

interface MicroJQEventHandler {
    (eventObject?: MicroJQEventObject): void;
}

interface MicroJQ {
    find(selector: string): MicroJQ;
    each(func: (index: number, elem: Element) => any): MicroJQ;
    data(key: string): any;
    attr(attributeName: string, value: number): MicroJQ;
    get(index: number): HTMLElement;
    on(events: string, handler: MicroJQEventHandler): MicroJQ;
    off(events: string, handler?: MicroJQEventHandler): MicroJQ;
    append(content1: MicroJQ, ...content2: any[]): MicroJQ;
    append(content1: any[], ...content2: any[]): MicroJQ;
    append(content1: string, ...content2: any[]): MicroJQ;
    addClass(className: string): MicroJQ;
    removeClass(className?: string): MicroJQ;
    css(propertyName: string, value: string): MicroJQ;
    blur(): MicroJQ;
    remove(): MicroJQ;
}

interface MicroJQStatic {
    (element: Element): MicroJQ;
    (element: Document): MicroJQ;
    (elements: Element[]): MicroJQ;
    each<T>(array: T[], callback: (indexInArray: number, valueOfElement: T) => any): void;
    map<T, U>(array: T[], callback: (elementOfArray: T, indexInArray: number) => U): U[];
    ready(fn: () => void): void;
    isArray(obj: any): boolean;
    fn: any;
}

interface Window {
    microJQ: MicroJQStatic;
}

interface ElementEvents {
    [key: string]: MicroJQEventHandler[];
}

interface ElementStore {
    events: ElementEvents;
    handler: (event: Event) => void;
}

interface ElementStoreMap {
    [key: string]: ElementStore;
}

interface Element {
    microjqid: string;
}

interface Indexable<T> {
    length: number;
    [index: number]: T;
}

window.microJQ = (function (): any {
    'use strict';

    // internals

    var KEYBOARD_EVENTS = ['keydown', 'keyup', 'keypress'];
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

    function indexOf<T>(array: T[], item: T): number {
        if (array.indexOf)
            return array.indexOf(item);
        for (var i = 0; i < array.length; i++)
            if (item === array[i])
                return i;
        return -1;
    }

    function arrayEach<T>(array: Indexable<T>, callback: (indexInArray?: number, valueOfElement?: T) => any): void {
        for (var k = 0; k < array.length; k++) {
            var item = array[k];
            callback.call(item, k, item);
        }
    }

    function objectEach(obj: any, callback: (key: string, value: any) => void) {
        var key;
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                var value = obj[key];
                callback.call(value, key, value);
            }
        }
    }

    function map<T, U>(array: Indexable<T>, callback: (elementOfArray: T, indexInArray: number) => U): U[] {
        var result: U[] = [];
        for (var k = 0; k < array.length; k++)
            result.push(callback(array[k], k));
        return result;
    }

    function toArray<T>(array: Indexable<T>): T[] {
        return map(array, (item: T) => item);
    }

    function arrayRemove<T>(array: T[], elem: T) {
        var idx = indexOf(array, elem);
        if (idx >= 0)
            array.splice(idx, 1);
    }

    function filter<T>(array: Indexable<T>, fn: (value: T, index: number) => boolean): T[] {
        var result: T[] = [];
        arrayEach(array, (i: number, value: T) => {
            if (fn(value, i))
                result.push(value);
        });
        return result;
    }

    function spaceSplit(st: string): string[] {
        return filter(st.split(' '), (item: string) => item.length != 0);
    }

    function isArray(obj: any): boolean {
        return Object.prototype.toString.call(obj) === '[object Array]';
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

    function normalizeEvent(event: Event): MicroJQEventObject {
        var mjqevent: MicroJQEventObject = <MicroJQEventObject> event;
        if (indexOf(KEYBOARD_EVENTS, event.type) >= 0) {
            mjqevent.which = mjqevent.keyCode;
        }
        return mjqevent;
    }

    function createEventHandler(element: Element, events: ElementEvents): (event: Event) => void {
        function eventHandler(event: Event) {
            var eventFns = events[event.type];
            if (eventFns && eventFns.length) {
                var mjqevent = normalizeEvent(event);
                if (eventFns.length > 1)
                    eventFns = toArray(eventFns);  // make copy to avoid changes while looping
                arrayEach(eventFns, (i: number, fn: MicroJQEventHandler) => {
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
            arrayEach(spaceSplit(type), (i: number, type: string) => {
                if (fn) {
                    var listeners = events[type];
                    if (listeners) {
                        arrayRemove(listeners, fn);
                        if (listeners.length) return;
                    }
                }
                removeEventListenerFn(el, type, handler);
                delete events[type];
            });
        } else {
            for (type in events) {
                removeEventListenerFn(el, type, handler);
                delete events[type];
            }
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
        arrayEach(element.querySelectorAll('*'), (i: number, descendant: Element) => {
            elementRemoveData(descendant);
        });
    }

    // MicroJQ

    function MicroEl(els: Element[]) {
        this.els = els;
    }

    MicroEl.prototype = {

        find: function (selector: string): MicroJQ {
            return new MicroEl(<Element[]> toArray(document.querySelectorAll(selector)));
        },

        data: function (key: string): any {
            return this.els[0].getAttribute('data-' + key);
        },

        get: function (index: number): HTMLElement {
            return <HTMLElement> this.els[index];
        },

        each: function (func: (indexInArray?: number, valueOfElement?: Element) => any): MicroJQ {
            arrayEach(this.els, func);
            return this;
        },

        append: function (...content: any[]): MicroJQ {
            var els: Element[] = this.els;
            var nodes: Node[] = [];
            arrayEach(content, (i: number, item: any) => {
                arrayEach(isArray(item) ? item : [item], (j: number, e: any) => {
                    var newnodes = e instanceof MicroEl ? e.els : typeof e === 'string' ? document.createTextNode(e) : e;
                    nodes = nodes.concat(newnodes);
                });
            });
            arrayEach(els, (j: number, el: Element) => {
                var clone = j < els.length - 1;
                arrayEach(nodes, (k: number, n: Node) => {
                    el.appendChild(clone ? n.cloneNode() : n);
                });
            });
            return this;
        }

    };

    // element chaining

    objectEach({

        blur: (el: HTMLElement) => {
            el.blur();
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
            var classes = spaceSplit(el.className);
            arrayEach(spaceSplit(className), (j: number, newClass: string) => {
                if (indexOf(classes, newClass) < 0)
                    classes.push(newClass);
            });
            el.className = classes.join(' ');
        },

        removeClass: (el: HTMLElement, className?: string) => {
            if (className) {
                var classes = spaceSplit(el.className);
                arrayEach(spaceSplit(className), (j: number, removeClass: string) => {
                    arrayRemove(classes, removeClass);
                });
                el.className = classes.join(' ');
            } else
                el.className = '';
        },

        attr: (el: Element, attributeName: string, value: string) => {
            el.setAttribute(attributeName, value);
        },

        on: (el: Element, type: string, fn: MicroJQEventHandler) => {
            var store = getElementStore(el);
            var events = store.events;
            var handler = store.handler;

            if (!handler)
                handler = store.handler = createEventHandler(el, events);

            arrayEach(spaceSplit(type), (i: number, type: string) => {
                var eventFns = events[type];
                if (!eventFns) {
                    eventFns = events[type] = [];
                    addEventListenerFn(el, type, handler);
                }
                eventFns.push(fn);
            });
        },

        off: elementOff

    }, (name: string, method: (el: HTMLElement, arg1: any, arg2: any) => void) => {
        MicroEl.prototype[name] = function (arg1, arg2): MicroJQ {
            arrayEach(this.els, (i: number, el: HTMLElement) => {
                method(el, arg1, arg2);
            });
            return this;
        };
    });

    var microJQ: MicroJQStatic = <MicroJQStatic> function (arg: any): MicroJQ {
        return new MicroEl(isArray(arg) ? arg : [arg]);
    };

    microJQ.ready = (fn: () => void) => {
        var fired = false;

        function trigger() {
            if (fired) return;
            fired = true;
            fn();
        }

        if (document.readyState === 'complete') {
            setTimeout(trigger);
        } else {
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
        }
    };

    microJQ.each = arrayEach;
    microJQ.map = map;
    microJQ.isArray = isArray;

    return microJQ;
})();
