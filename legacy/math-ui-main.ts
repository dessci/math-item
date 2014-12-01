/// <reference path="microjq.ts" />

declare var microJQ: MicroJQStatic;
declare var jQuery: JQueryStatic;

module MathUI {
    'use strict';

    var $: JQueryStaticCommon;

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

    function create(tagName: string): HTMLElement {
        return document.createElement(tagName);
    }

    function stopEvent(event: Event) {
        event.stopPropagation();
        event.preventDefault();
    }

    class Dialog {
        private backdrop: MicroJQ;
        private documentHandler: MicroJQEventHandler;
        show(): void {
            var wrapper = $(create('div')).addClass('math-ui-wrapper'),
                dialog = $(create('div')).addClass('math-ui-dialog').append(wrapper);
            this.backdrop = $(create('div')).addClass('math-ui-backdrop').append(dialog);
            this.prepareDialog(dialog, wrapper);
            this.documentHandler = (event: MicroJQEventObject) => {
                if (event.type === 'click' || event.which === 27) {
                    console.log('doc click', event);
                    stopEvent(event);
                    this.close();
                }
            };
            $(document.body).append(this.backdrop);
            $(document).on('click keydown', this.documentHandler);
            dialog.css('height', wrapper.get(0).offsetHeight + 'px')
                .on('click', (event: MicroJQEventObject) => {
                    stopEvent(event);
                    this.click(event);
                });
        }
        close(): void {
            $(document).off('click keydown', this.documentHandler);
            this.backdrop.remove();
            this.backdrop = this.documentHandler = undefined;
        }
        prepareDialog(dialog: MicroJQ, container: MicroJQ) {
        }
        click(event: MicroJQEventObject): void {
        }
    }

    function niy(name: string) {
        alert(name + ' not implemented yet');
    }

    interface MenuItem {
        label: string;
        action: (el?: any) => void;
    }

    class DashboardDialog extends Dialog {
        static dashboardItems: MenuItem[] = [
            { label: 'Highlight All Equations', action: niy },
            { label: 'Action 2', action: niy },
            { label: 'Action 3', action: niy },
            { label: 'Action 4', action: niy }
        ];
        private buttons: MicroJQ;
        prepareDialog(dialog: MicroJQ, container: MicroJQ) {
            dialog.addClass('math-ui-dashboard');
            this.buttons = $(microJQ.map(DashboardDialog.dashboardItems, () => create('button')))
                .each((k: number, el: Element) => {
                    $(el).append(DashboardDialog.dashboardItems[k].label);
                });
            container.append(
                $(create('div')).addClass('math-ui-header').append('MathUI Dashboard'),
                $(create('div')).addClass('math-ui-content').append(this.buttons)
            );
        }
        show(): void {
            super.show();
            this.buttons.first().focus();
        }
        click(event: MicroJQEventObject): void {
            var nr = microJQ.indexOf(this.buttons.get(), event.target);
            if (nr >= 0 && nr < DashboardDialog.dashboardItems.length) {
                this.close();
                DashboardDialog.dashboardItems[nr].action(DashboardDialog.dashboardItems[nr].label);
            }
        }
    }

    export function showDashboard(): void {
        var dialog = new DashboardDialog();
        dialog.show();
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

    var menuItems: MenuItem[] = [
        { label: 'Zoom', action: zoomAction },
        { label: 'Source', action: sourceAction },
        { label: 'Search', action: searchAction },
        { label: 'Share', action: shareAction },
        { label: 'Dashboard', action: showDashboard }
    ];

    function elementGotFocus(el: MicroJQ): void {
        var selectedIndex: number,
            triggerSelected = () => {
                el.blur();
                menuItems[selectedIndex].action(el.get(0));
            },
            buttons = $(microJQ.map(menuItems, () => create('span'))).addClass('math-ui-item'),
            menu = $(create('div')).addClass('math-ui-eqn-menu').append(
                $(create('span')).addClass('math-ui-header').append('Equation ?'),
                $(create('span')).addClass('math-ui-container').append(buttons)
            ),
            updateSelected = (index: number) => {
                selectedIndex = index;
                buttons.removeClass('math-ui-selected');
                $(buttons.get(index)).addClass('math-ui-selected');
            },
            onkeydown = (ev: MicroJQEventObject) => {
                switch (ev.which) {
                    case 13:
                        ev.preventDefault();  // don't trigger mouse click
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
        buttons.each(function (k: number, el: Element) {
            $(el).append(menuItems[k].label).on('mousedown', () => {
                updateSelected(k);
                triggerSelected();
            });
        });
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
