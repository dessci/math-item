/// <reference path="microjq.ts" />

declare var microJQ: MicroJQStatic;
declare var jQuery: MicroJQStatic;

module MathUI {
    'use strict';

    var $: MicroJQStatic;

    export interface Handler {
        init(el: HTMLElement): void;
    }

    interface HandlerDictionary {
        [index: string]: Handler;
    }

    interface Callback {
        (): void;
    }

    class PlainHandler implements Handler {
        init(el: HTMLElement): void { }
    }

    class MathMLHandler implements Handler {
        init(el: HTMLElement): void { }
    }

    var handlers: HandlerDictionary = {
        'plain-html': new PlainHandler(),
        'native-mathml': new MathMLHandler()
    };

    function createElem(tagName: string, count?: number): MicroJQ {
        count = count || 1;
        var els = [];
        while (count-- > 0)
            els.push(document.createElement(tagName));
        return $(els);
    }

    export function showDashboard(): void {
        alert('Dashboard');
    }

    function zoomAction(el: HTMLElement): void {
        alert('zoom');
    }

    function sourceAction(el: HTMLElement): void {
        alert('source');
    }

    function searchAction(el: HTMLElement): void {
        alert('search');
    }

    function shareAction(el: HTMLElement): void {
        alert('share');
    }

    interface MenuItem {
        label: string;
        action: (el: HTMLElement) => void;
    }

    var menuItems: MenuItem[] = [
        { label: 'Zoom', action: zoomAction },
        { label: 'Source', action: sourceAction },
        { label: 'Search', action: searchAction },
        { label: 'Share', action: shareAction },
        { label: 'Dashboard', action: showDashboard }
    ];

    function elementGotFocus(el: MicroJQ): void {
        var selectedIndex: number,
            buttons = createElem('span', menuItems.length).addClass('math-ui-item').each(function (k: number, el: Element) {
                $(el).append(menuItems[k].label).on('mousedown', () => {
                    updateSelected(k);
                    triggerSelected();
                });
            }),
            menu = createElem('div').addClass('math-ui-eqn-menu').append(
                createElem('span').addClass('math-ui-header').append('Equation ?'),
                createElem('span').addClass('math-ui-container').append(buttons)
            ),
            updateSelected = (index: number) => {
                selectedIndex = index;
                buttons.removeClass('math-ui-selected');
                $(buttons.get(index)).addClass('math-ui-selected');
            },
            triggerSelected = () => {
                el.blur();
                menuItems[selectedIndex].action(el.get(0));
            },
            onkeydown = (ev: MicroJQEventObject) => {
                switch (ev.which) {
                    case 13:
                        triggerSelected();
                        break;
                    case 27:
                        el.blur();
                        break;
                    case 37:
                        updateSelected((selectedIndex + menuItems.length - 1) % menuItems.length);
                        break;
                    case 39:
                        updateSelected((selectedIndex + 1) % menuItems.length);
                        break;
                }
            },
            onblur = () => {
                menu.remove();
                el.off('keydown', onkeydown)
                    .off('blur', onblur);
            };
        el.append(menu)
            .on('blur', onblur)
            .on('keydown', onkeydown);
        updateSelected(0);
        menu.css('top', (el.get(0).offsetHeight - 3) + 'px');
    }

    function elementReady(el: MicroJQ): void {
        var type: string = el.data('type');
        if (type && type in handlers) {
            var handler: Handler = handlers[type];
            handler.init(el.get(0));
        }
        el.attr('tabindex', 0)
            .on('focus', () => elementGotFocus(el));
    }

    export function registerHandler(type: string, handler: Handler): void {
        handlers[type] = handler;
    }

    microJQ.ready(function () {
        $ = ('jQuery' in window && jQuery.fn.on) ? jQuery : microJQ;
        $(document).find('.math-ui').each(function () {
            elementReady($(this));
        });
    });
}

// extensions

declare var MathJax: any;

class MathJaxHandler implements MathUI.Handler {
    init(el: HTMLElement): void {
        MathJax.Hub.Queue(['Typeset', MathJax.Hub, el]);
    }
}

class MathJaxTexHandler extends MathJaxHandler {
}

MathUI.registerHandler('tex', new MathJaxTexHandler());

class MathJaxMathMLHandler extends MathJaxHandler {
}

MathUI.registerHandler('mml', new MathJaxMathMLHandler());
