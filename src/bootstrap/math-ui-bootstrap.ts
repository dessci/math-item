/// <reference path="../../dist/math-ui-core.d.ts" />

module MathUI {
    'use strict';

    var $: QueryStaticBase, _ = getUtils();
    queryLibReady(qlib => $ = qlib);

    // Main class

    export class BootstrapLookAndFeel extends MathItemContainer {
        init(mathItem: MathItem) {
        }
        showDashboard() {
        }
    }

}
