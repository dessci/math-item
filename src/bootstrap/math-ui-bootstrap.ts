/// <reference path="../../dist/math-ui-core.d.ts" />
/// <reference path="../../typings/jquery.d.ts" />

module MathUI {
    'use strict';

    var _ = getUtils();

    interface MenuItem {
        label: string;
        action: () => void;
    }

    // Zoom

    function zoomAction(mathItem: MathItem) {
        console.log('zoom');
        var inner = $('<div class="panel-body">');
        var popup = $('<div class="panel panel-default math-ui-zoom">').append(inner);
        mathItem.clonePresentation(inner);
        $(mathItem.element).append(popup);
        $(document).on('mousedown keydown', (ev) => {
            ev.stopPropagation();
            popup.remove();
        });
    }

    // View Markup

    function sourceAction(mathItem: MathItem) {
        console.log('source');
        /*var dialog = new SourceDialog(mathItem);
        dialog.show();*/
    }

    // Focus menu

    function makeMenuItems(mathItem: MathItem): MenuItem[] {
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
            menuItems = makeMenuItems(mathItem),
            menu = $('<ul class="dropdown-menu" role="menu">')
                .append($('<li role="presentation" class="dropdown-header">').append(mathItem.name));
        _.each(menuItems, (menuItem: MenuItem) => {
            menu.append($('<li role="presentation">').append($('<a role="menuitem" tabindex="-1" href="#">').append(menuItem.label)));
        });
        el.append(menu)
            .on('blur', () => {
                menu.remove();
            });
        menu.on('mousedown', (ev) => {
            menu.find('a').each((k, elem) => {
                if (elem === ev.target) {
                    ev.stopPropagation();
                    menuItems[k].action();
                }
            });
        });
    }

    // Main class

    export class BootstrapLookAndFeel extends MathItemContainer {
        init(mathItem: MathItem) {
            var el = $(mathItem.element);
            el.on('focus', (ev) => {
                ev.stopPropagation();
                gotFocus(mathItem)
            });
        }
        showDashboard() {
        }
    }

}
