/// <reference path="math-ui-microjq.ts" />
/// <reference path="math-ui-core.ts" />

module MathUI {
    'use strict';

    var $: QueryStaticBase, _ = getUtils();
    queryLibReady(qlib => $ = qlib);

    // helpers

    function create(tagName: string): HTMLElement {
        return document.createElement(tagName);
    }

    function new$(tagName: string): MicroJQ {
        return $(create(tagName));
    }

    function stopEvent(event: Event) {
        event.stopPropagation();
        event.preventDefault();
    }

    interface MenuItem {
        label: string;
        action: () => void;
    }

    // Dialog

    class Dialog {
        private documentHandler: MicroJQEventHandler;
        private element: MicroJQ;
        private dialog: MicroJQ;
        private wrapper: MicroJQ;
        show(className: string, prepareDialog: (container: MicroJQ) => void, buttons?: MenuItem[], parent?: Element) {
            parent = parent || document.body;
            this.wrapper = new$('div').addClass('math-ui-wrapper');
            this.dialog = new$('div').addClass(className).append(this.wrapper);
            this.element = parent === document.body
                ? new$('div').addClass('math-ui-backdrop').append(this.dialog) : this.dialog;
            prepareDialog(this.wrapper);
            if (buttons) {
                var bottom = new$('div').addClass('math-ui-footer');
                _.each(buttons, (buttonData: MenuItem) => {
                    var button = new$('button').append(buttonData.label).on('click', () => {
                        buttonData.action();
                    });
                    bottom.append(button);
                });
                this.wrapper.append(bottom);
            }
            this.documentHandler = (event: MicroJQEventObject) => {
                if (event.type === 'click' ? event.which === 1 : event.which === 27) {
                    stopEvent(event);
                    this.close();
                } else if (event.type === 'keydown')
                    this.keydown(event);
            };
            $(parent).append(this.element);
            $(document).on('click keydown', this.documentHandler);
            this.dialog.on('click', (event: MicroJQEventObject) => {
                if (event.which === 1) {
                    stopEvent(event);
                    this.click(event);
                }
            });
        }
        close() {
            $(document).off('click keydown', this.documentHandler);
            this.element.remove();
            this.element = this.documentHandler = undefined;
        }
        fitContentHeight() {
            var height = this.wrapper.height();
            this.dialog.css('height', height + 'px');
            if (height <= 0) {
                // setting height twice + async seems to make it work on IE9
                async(() => {
                    this.dialog.css('height', this.wrapper.height() + 'px');
                });
            }
        }
        click(event: MicroJQMouseEventObject) {
        }
        keydown(event: MicroJQKeyEventObject) {
        }
    }

    // Zoom action

    class ZoomDialog extends Dialog {
        constructor(private host: MathItem) {
            super();
        }
        show(): void {
            super.show('math-ui-zoom', (container: MicroJQ) => {
                this.host.clonePresentation(container);
            }, undefined, this.host.element);
        }
        click() {
            this.close();
        }
    }

    function zoomAction(mathItem: MathItem) {
        var dialog = new ZoomDialog(mathItem);
        dialog.show();
    }

    // View Markup

    function sourceDataToLabel(sd: SourceData) {
        var label = sd.type;
        if (sd.subtype) label += ' (' + sd.subtype + ')';
        return label;
    }

    class SourceDialog extends Dialog {
        private sources: SourceData[];
        private sourceTabContainer: MicroJQ;
        private sourceArea: MicroJQ;
        private selected: number;
        constructor(private host: MathItem) {
            super();
            this.host.getSources().then((sources: SourceData[]) => {
                this.sources = sources;
                this.updateSelected();
            });
        }
        updateSelected() {
            if (this.selected === undefined) return;
            this.sourceArea.text(this.sources[this.selected].source);
        }
        setSelected(k: number) {
            if (this.sources.length === 0) return;
            k = (k + this.sources.length) % this.sources.length;
            if (k !== this.selected) {
                var children = this.sourceTabContainer.children();
                this.selected = k;
                children.removeClass('math-ui-selected');
                $(children[k]).addClass('math-ui-selected');
                this.updateSelected();
            }
        }
        show() {
            var selectAll = () => {
                (<HTMLTextAreaElement> this.sourceArea.focus()[0]).select();
            };
            var buttons = [
                { label: 'Select All', action: selectAll },
                { label: 'Close', action: () => { this.close(); } }
            ];
            //if (typeof ClipboardEvent !== 'undefined' && new ClipboardEvent('copy') instanceof Event) {
            //    buttons.splice(0, 0, {
            //        label: 'Copy to Clipboard', action: () => {
            //            var e = new ClipboardEvent('copy', { bubbles: true, cancelable: true, dataType: 'text/plain', data: 'Copy test' });
            //            this.sourceArea[0].dispatchEvent(e);
            //        }
            //    });
            //}
            this.sourceArea = new$('textarea').attr('readonly', 'readonly');
            this.sourceTabContainer = new$('div').addClass('math-ui-types').attr('tabindex', 0);
            _.each(this.sources, (item: SourceData) => {
                this.sourceTabContainer.append(new$('span').append(sourceDataToLabel(item)));
            });
            super.show('math-ui-dialog math-ui-source', (container: MicroJQ) => {
                container.append(
                    new$('div').addClass('math-ui-header').append('Markup for ' + this.host.name),
                    new$('div').addClass('math-ui-content').append(this.sourceTabContainer, this.sourceArea)
                    );
            }, buttons);
            this.setSelected(0);
            this.fitContentHeight();
            this.sourceTabContainer.focus();
            this.sourceArea.on('copy', (ev: MicroJQEventObject) => {
                console.log('copy', ev);
                (<any> ev.originalEvent).clipboardData.setData("text/plain", "Simulated copy. Yay!");
                (<any> ev.originalEvent).clipboardData.setData("application/mathml+xml", "<math><mi>x</mi></math>");
                ev.preventDefault();
            });
        }
        close() {
            this.sources = this.sourceTabContainer = this.sourceArea = undefined;
            super.close();
        }
        click(event: MicroJQMouseEventObject) {
            this.sourceTabContainer.children().each((k: number, elem: Element) => {
                if (elem === event.target)
                    this.setSelected(k);
            });
        }
        keydown(event: MicroJQKeyEventObject) {
            if (event.target === this.sourceTabContainer[0]) {
                var k = _.indexOf([37, 39], event.which);
                if (k >= 0) this.setSelected(this.selected + (k === 0 ? 1 : -1));
            }
        }
    }

    function sourceAction(mathItem: MathItem) {
        var dialog = new SourceDialog(mathItem);
        dialog.show();
    }

    // Dashboard

    class DashboardDialog extends Dialog {
        static dashboardLabels: string[] = [
            'Highlight All Equations',
            'About MathUI'
        ];
        private buttons: MicroJQ;
        constructor(private container: MathItemContainer) {
            super();
        }
        show(): void {
            super.show('math-ui-dialog math-ui-dashboard', (container: MicroJQ) => {
                this.buttons = $(_.map(DashboardDialog.dashboardLabels, () => create('button')))
                    .each((k: number, el: Element) => {
                        $(el).append(DashboardDialog.dashboardLabels[k]);
                    });
                container.append(
                    new$('div').addClass('math-ui-header').append('MathUI Dashboard'),
                    new$('div').addClass('math-ui-content').append(this.buttons)
                );
            });
            this.buttons.first().focus();
            this.fitContentHeight();
        }
        click(event: MicroJQEventObject): void {
            var nr = _.indexOf(this.buttons.toArray(), event.target);
            if (nr >= 0 && nr < DashboardDialog.dashboardLabels.length) {
                this.close();
                if (nr === 0) {
                    this.container.highlightAll();
                } else {
                    window.location.href = 'https://github.com/dessci/math-ui'
                }
            }
        }
    }

    // Focus menu

    function makeMenuItems(mathItem: MathItem): MenuItem[]{
        var result: MenuItem[] = [];
        if (MathItem.prototype.clonePresentation)
            result.push({ label: 'Zoom', action: () => zoomAction(mathItem) });
        if (MathItem.prototype.getSources)
            result.push({ label: 'View Markup', action: () => sourceAction(mathItem) });
        result.push({ label: 'Dashboard', action: () => mathItem.container.showDashboard() });
        return result;
    }

    function gotFocus(mathItem: MathItem) {
        var el = $(mathItem.element),
            selectedIndex: number,
            menuItems = makeMenuItems(mathItem),
            triggerSelected = () => {
                el.blur();
                // IE8: Make sure focus menu is removed before triggering action
                async(() => {
                    menuItems[selectedIndex].action();
                });
            },
            buttons = $(_.map(menuItems, () => create('span'))).addClass('math-ui-item'),
            menu = new$('div').addClass('math-ui-eqn-menu').append(
                new$('span').addClass('math-ui-header').append(mathItem.name),
                new$('span').addClass('math-ui-container').append(buttons)
            ),
            updateSelected = (index: number) => {
                selectedIndex = index;
                buttons.removeClass('math-ui-selected');
                $(buttons[index]).addClass('math-ui-selected');
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
                el.off('keydown', onkeydown).off('blur', onblur);
            };
        buttons.each(function (k: number, btn: Element) {
            $(btn).append(menuItems[k].label).on('mousedown', (event: MicroJQEventObject) => {
                if (event.which === 1) {
                    stopEvent(event);
                    updateSelected(k);
                    triggerSelected();
                }
            });
        });
        el.append(menu).on('keydown', onkeydown).on('blur', onblur);
        updateSelected(0);
        menu.css('top', (el[0].offsetHeight - 3) + 'px');
    }

    // Main class

    export class VanillaLookAndFeel extends MathItemContainer {
        init(mathItem: MathItem) {
            var el = $(mathItem.element);
            el.on('focus', () => gotFocus(mathItem));
        }
        showDashboard() {
            var dialog = new DashboardDialog(this);
            dialog.show();
        }
    }

}
