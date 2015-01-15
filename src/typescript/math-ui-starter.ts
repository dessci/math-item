/// <reference path="math-ui-core.ts" />
/// <reference path="math-ui-vanilla.ts" />

module MathUI {
    'use strict';

    var initDonePromise = makePromiseWithResolver<void>(),
        renderingDonePromise = makePromiseWithResolver<void>();

    export function initDone(): IPromise<void> {
        return initDonePromise;
    }

    export function renderingDone(): IPromise<void> {
        return renderingDonePromise;
    }

    export var container = new VanillaLookAndFeel();

    started().then(($) => {
        var elements = $(document).find('.math-ui').toArray();
        container.add(elements).then(() => {
            renderingDonePromise.resolve();
        });
        initDonePromise.resolve();
    });

}
