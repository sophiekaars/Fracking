/**
 * Main application
 *
 * Copyright (c) 2012 Knewton
 * Dual licensed under:
 *  MIT: http://www.opensource.org/licenses/mit-license.php
 *  GPLv3: http://www.opensource.org/licenses/gpl-3.0.html
 */
/*jslint browser: true, indent: 4, maxlen: 79 */
(function ($) {
    "use strict";

    //------------------------------
    //
    // Constants
    //
    //------------------------------

    //------------------------------
    //
    // Properties
    //
    //------------------------------

    //------------------------------
    //
    // Methods
    //
    //------------------------------

    //------------------------------
    //
    // Event bindings
    //
    //------------------------------

    //------------------------------
    //
    // Exposure
    //
    //------------------------------

    $(function () {
        $("#bottom-move").on('click', function (event) {
            event.preventDefault();
            $("#viewport-scroller").animate({
                scrollTop: "+=" + 720
            }, 1000, function () {
                $("#right-move").fadeIn("fast");
            });


            $(this).fadeOut("fast");
        });

        $("#right-move").on('click', function (event) {
            event.preventDefault();
            $("#viewport-scroller").animate({
                scrollLeft: "+=" + 1280
            }, 1000);

            $(this).fadeOut("fast");
        });
    });

}(window.jQuery));

