
// Copying declaration of Document
declare var HTMLDocument: {
    prototype: Document;
    new (): Document;
}

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget.addEventListener
(function () {
    if (!Event.prototype.preventDefault) {
        Event.prototype.preventDefault = function () {
            this.returnValue = false;
        };
    }
    if (!Event.prototype.stopPropagation) {
        Event.prototype.stopPropagation = function () {
            this.cancelBubble = true;
        };
    }
    if (!Element.prototype.addEventListener) {
        var eventListeners = [];

        var addEventListener = function (type, listener /*, useCapture (will be ignored) */) {
            var self = this;
            var wrapper = function (e) {
                e.target = e.srcElement;
                e.currentTarget = self;
                if (listener.handleEvent) {
                    listener.handleEvent(e);
                } else {
                    listener.call(self, e);
                }
            };
            if (type == "DOMContentLoaded") {
                var wrapper2 = function (e) {
                    if (document.readyState == "complete") {
                        wrapper(e);
                    }
                };
                document.attachEvent("onreadystatechange", wrapper2);
                eventListeners.push({ object: this, type: type, listener: listener, wrapper: wrapper2 });

                if (document.readyState == "complete") {
                    var e = new Event();
                    e.srcElement = <Element><any> window;
                    wrapper2(e);
                }
            } else {
                this.attachEvent("on" + type, wrapper);
                eventListeners.push({ object: this, type: type, listener: listener, wrapper: wrapper });
            }
        };
        var removeEventListener = function (type, listener /*, useCapture (will be ignored) */) {
            var counter = 0;
            while (counter < eventListeners.length) {
                var eventListener = eventListeners[counter];
                if (eventListener.object == this && eventListener.type == type && eventListener.listener == listener) {
                    if (type == "DOMContentLoaded") {
                        this.detachEvent("onreadystatechange", eventListener.wrapper);
                    } else {
                        this.detachEvent("on" + type, eventListener.wrapper);
                    }
                    eventListeners.splice(counter, 1);
                    break;
                }
                ++counter;
            }
        };
        Element.prototype.addEventListener = addEventListener;
        Element.prototype.removeEventListener = removeEventListener;
        if (HTMLDocument) {
            HTMLDocument.prototype.addEventListener = addEventListener;
            HTMLDocument.prototype.removeEventListener = removeEventListener;
        }
        if (Window) {
            Window.prototype.addEventListener = addEventListener;
            Window.prototype.removeEventListener = removeEventListener;
        }
    }
})();

// foreach
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (callbackfn: (value: any, index: number, array: any[]) => void, thisArg?: any): void {
        var array = this;
        for (var k: number = 0; k < array.length; k++)
            callbackfn.call(thisArg, array[k], k, array);
    }
}

// map
if (!Array.prototype.map) {
    Array.prototype.map = function<U> (callbackfn: (value: any, index: number, array: any[]) => U, thisArg?: any): U[] {
        var array = this;
        var result = [];
        for (var k: number = 0; k < array.length; k++)
            result.push(callbackfn.call(thisArg, array[k], k, array));
        return result;
    }
}

// bind (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind)
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () { },
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                    ? this
                    : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}
