/// <reference path="../../dist/math-item.d.ts" />
/// <reference path="../../typings/jquery.d.ts" />

interface JQuery {
    modal(options?: any): void;
}

module FlorianMath {
    'use strict';

    var _ = _utils.common, $ = jQueryLib;

    interface MenuItem {
        label: string;
        action: () => void;
    }

    function getName(mathItem: HTMLMathItemElement) {
        return 'Equation ' + ((<any> mathItem)._id + 1);
    }

    // Zoom

    function zoomAction(mathItem: HTMLMathItemElement) {
        var inner = $('<div class="panel-body">'),
            popup = $('<div class="panel panel-default math-ui-zoom">').append(inner);
        mathItem.clonePresentation(inner[0]);
        $(mathItem).append(popup);
        $(document).on('mousedown keydown', (ev) => {
            ev.stopPropagation();
            popup.remove();
        });
    }

    // View Markup

    function sourceDataToLabel(sd: MarkupData) {
        var label = sd.type;
        if (sd.subtype) label += ' (' + sd.subtype + ')';
        return label;
    }

    function sourceAction(mathItem: HTMLMathItemElement) {
        var tabs = $('<ul class="nav nav-pills">'),
            markup = $('<textarea class="form-control" readonly></textarea>'),
            content = $('<div class="modal-content">')
                .append($('<div class="modal-header">')
                    .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                    .append($('<h4 class="modal-title">').append('Markup for ' + getName(mathItem)))
                )
                .append($('<div class="modal-body">').append(tabs, markup))
                .append($('<div class="modal-footer">')
                    .append($('<button type="button" class="btn btn-primary">Select All</button>'))
                    .append($('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'))
                ),
            modal = $('<div class="modal" tabindex="-1" role="dialog" aria-hidden="true">')
                .append($('<div class="modal-dialog modal-lg">').append(content)),
            selected = -1,
            sources: MarkupData[] = [];

        function setSelected(s: number) {
            var tabItems = tabs.children();
            if (s === selected) return;
            selected = s;
            tabItems.removeClass('active');
            markup.text(sources[s].markup);
            $(tabItems[s]).addClass('active');
        }

        mathItem.getMarkup().then((_sources: MarkupData[]) => {
            sources = _sources;
            _.each(sources, (sourceData: MarkupData) => {
                tabs.append($('<li role="presentation">').append($('<a href="#">').append(sourceDataToLabel(sourceData))));
            });
            setSelected(0);
        });

        tabs.on('click', (ev) => {
            tabs.find('a').each((k, elem) => {
                ev.preventDefault();
                if (elem === ev.target)
                    setSelected(k);
            });
        });

        content.find('.modal-footer > button').first().on('click', () => {
            markup.focus().select();
        });

        modal.on('hidden.bs.modal', () => {
            modal.remove();
        }).modal();
    }

    // Equation menu

    function makeMenuItems(mathItem: HTMLMathItemElement): MenuItem[] {
        var result: MenuItem[] = [];
        if (mathItem.clonePresentation)
            result.push({ label: 'Zoom', action: () => { zoomAction(mathItem) } });
        if (mathItem.getMarkup)
            result.push({ label: 'View Markup', action: () => { sourceAction(mathItem) } });
        result.push({ label: 'Dashboard', action: () => { lookAndFeel.showDashboard() } });
        return result;
    }

    function gotFocus(mathItem: HTMLMathItemElement) {
        var el = $(mathItem),
            menuItems = makeMenuItems(mathItem),
            menu = $('<ul class="dropdown-menu" role="menu">')
                .append($('<li role="presentation" class="dropdown-header">').append(getName(mathItem)));
        _.each(menuItems, (menuItem: MenuItem) => {
            menu.append($('<li role="presentation">').append(
                $('<a role="menuitem" tabindex="-1" href="#">').append(menuItem.label)));
        });
        el.append(menu).on('blur', () => { menu.remove(); });
        menu.on('mousedown', (ev) => {
            menu.find('a').each((k, elem) => {
                if (elem === ev.target) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    el.blur();
                    menuItems[k].action();
                }
            });
        });
    }

    // Main class

    class BootstrapLookAndFeel {
        private highlighted = false;
        init(mathItem: HTMLMathItemElement) {
            $(mathItem).attr('tabindex', 0).on('focus', (ev) => {
                ev.stopPropagation();
                ev.preventDefault();
                gotFocus(mathItem);
            });
        }
        highlightAll() {
            var on = this.highlighted = !this.highlighted;
            _.each(container, (mathItem: HTMLMathItemElement) => {
                var el = $(mathItem);
                on ? el.addClass('highlight') : el.removeClass('highlight');
            });
        }
        showDashboard() {
            var body = $('<div class="modal-body">')
                    .append($('<div class="btn-group-vertical">')
                        //.append($('<li>').append($('<a href="#">Highlight All Equations</a>')))
                        //.append($('<li>').append($('<a href="#">About Florian MathUI</a>')))
                        .append($('<button type="button" class="btn btn-primary form-control">Highlight All Equations</button>'))
                        .append($('<button type="button" class="btn btn-primary form-control">About</button>'))
                        .append($('<button type="button" class="btn btn-primary" data-dismiss="modal">Close</button>'))
                    ),
                modal = $('<div class="modal math-ui-dashboard" tabindex="-1" role="dialog" aria-hidden="true">')
                    .append($('<div class="modal-dialog modal-sm">').append($('<div class="modal-content">')
                        .append($('<div class="modal-header">')
                            .append($('<button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>'))
                            .append($('<h4 class="modal-title">').append('Dashboard')))
                        .append(body)
                        //.append($('<div class="modal-footer">')
                        //    .append($('<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>'))
                        //)
                        )
                    );

            body.on('click', (ev) => {
                body.find('button').each((k, elem) => {
                    if (k <= 1 && elem === ev.target) {
                        ev.preventDefault();
                        modal.modal('hide');
                        if (k === 0) {
                            this.highlightAll();
                        } else {
                            window.location.href = 'https://github.com/dessci/math-ui'
                        }
                    }
                });
            });
            modal.on('hidden.bs.modal', () => {
                modal.remove();
            }).modal();
        }
    }

    // Set the 'lookAndFeel' property to signal a successful load
    lookAndFeel = new BootstrapLookAndFeel();

    _.each(container, (mathItem: HTMLMathItemElement) => {
        lookAndFeel.init(mathItem);
    });

}
