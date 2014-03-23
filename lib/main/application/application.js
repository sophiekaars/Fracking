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

        /**
         * Dimensions of the screens.
         */
    var WIDTH = 1280, HEIGHT = 720,
	
        /**
         * Used to embed vimeo videos. Just use the URL from the video and put it in the vimeoSlides object below!
		 * 
		 * For example, not for children lives here: http://vimeo.com/67078338
		 * Take the ID at the end of the URL "67078338" and use it below!
         */
		VIMEO_SLUG = '<iframe src="//player.vimeo.com/video/%id?autoplay=1&amp;loop=1" width="' +  WIDTH + '" height="' +  HEIGHT + '" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe>',

        /**
         * This can be fast, slow, or a number of milliseconds.
         * So 3 seconds of slide time would be 3000 milliseconds.
         */
        SLIDE_TIME = "slow",

        /**
         * If this variable is true, not only will the explcitly defined
         * directions be enabled for a given screen, but we will ALSO show the
         * inverse of the way they just came in to allow the user to go backwards
         * in the flow.
         *
         * For example, if you clicked on a left bumper to arrive at a screen
         * and this variable is set to true, the right bumper will automagically
         * appear to allow the user to back up a screen.
         *
         * Backup functionality does not apply to screen1, which is understood to
         * be a special screen (the start point of the whole affair).
         */
        canBackUp = true,

        /**
         * Based on the 20 column layout sent in the map, these are the
         * scaled X/Y coordinates of the first screen.
         */
        startAt = {top: 0, left: 11520},

    //------------------------------
    //
    // Properties
    //
    //------------------------------

        /**
         * Always start on the first screen.
         * Screens are labeled first by row then by column based on the map
         * you sent.
         */
        currentScreen = 1,
        lastScreen = 1,

        /**
         * We want to label the screens starting at 1 for consistency.
         * Each row of this array should be an array dictating which movers
         * should be enabled when arriving on this screen.
         *
         * This part is a bit offputtingly confusing. We are labeling the
         * screens roughly based on their position that you move to, so we're
         * going to be defining each "direction" as both a direction as well
         * as the screen you "land" on so we know which directions are valid.
         *
         * This array needs to be read from the context of the screen you're on,
         * so the first element in the array indicates "on screen 1, I can move
         * in the bottom direction to arrive at screen 2"
         *
         * "On screen 2, I can move to the left direction to arrive at screen 3
         *  OR I can move to the right direction to arrive at screen 4."
         *
         * I'm assuming the user can always "back up" a direction. If you want
         * to NOT allow that behavior, change the "canBackUp" variable to false
         * above.
         *
         * If the array starts with a "true" it means "I am an automatic screen
         * and show the given screen after the applied time."
         *
         * The last two argument should map exactly to the index in the object,
         * and the opposite of the direction you took to get there.
         *  myIndex: [true, time, fwdDir, fwdScreen, backScreen, backDir]
         *
         * If it starts with false, it shows the first arg but moves in the second.
         */
        screenMovers = {
             1: ["bottom", 2],
             2: ["left", '3a', "right", '3aa'],

            // To the left of the first T junction
             '3a': [true, 1000, "bottom", '4a', 2],
             '4a': ["bottom", '5a'],
             '5a': ["bottom", 6],

            // To the right of the first T junction
             '3aa': [true, 1000, "bottom", '4aa', 2],
             '4aa': ["bottom", '5aa'],
             '5aa': ["bottom", 6],

            // Leasing
             6: ["bottom", 7],
             7: ["left", '8a', "right", '8aa'],

            // Leasing left
            '8a': ["bottom", '9a'],
            '9a': ["bottom", 10],
            
            //Leasing right
            '8aa': ["bottom", '9aa'],
            '9aa': ["bottom", 10],
            
            //Prospecting
            10: ["left", '11a', "right", '11aa'],
            '11a': ["bottom", 12],
            '11aa': ["bottom", 12],

            // Seismology
            12: [true, 3000, "bottom", 13],
            13: ["bottom", 14],
            14: ["bottom", 15],
            15: [true, 1000, "bottom", 16],

            // Last in the menu so we don't need to worry about commas
            0: [false]
        },
		
		vimeoSlides = {
			//'3a': '89859296'
		},

        restoreDirection;

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

    /**
     * Called after we finish sliding to a new screen, this method enables
     * the proper movers for the given screen to allow the user to navigate
     * the labyrinth.
     */
    function cleanupScroll() {
        var opts = screenMovers[currentScreen],
            index = 0,
            dir, screen,
            // Used below
            canGo, delay, autoDir, autoScreen;

        // If the options for movers aren't defined, we're probably at the end
        // of the presentation. We create an empty array here so if we're in
        // goBackwards mode we can properly have that work even at the end
        // of the presentation.
        //
        // @TODO: Add in the ability to "return to the start". Maybe a hideous
        // button in the middle of the screen for now?
        if (opts === undefined) {
            opts = [];
            $("#restart").fadeIn("slow");
        } else {
            $("#restart").fadeOut("fast");
        }

        if (opts[0] === true) {
            delay = opts[1];
            autoDir = opts[2];
            autoScreen = opts[3];

            if (lastScreen >= autoScreen) {
                // We are going backwards, invert everything
                autoScreen = opts[4];
                autoDir = restoreDirection;
            }

            // Perform an automagic delayed screen transition
            setTimeout(function () {
                $("#" + autoDir + "-move")
                    .attr("data-screen", autoScreen)
                    .click();
            }, delay);
        } else {
            if (currentScreen > 1 && canBackUp) {
                canGo = true;
                $.each(opts, function (k, v) {
                    if (typeof v === "string") {
                        if (v === restoreDirection) {
                            canGo = false;
                            return false;
                        }
                    }
                });
                if (canGo) {
                    opts.push(restoreDirection, lastScreen);
                }
            }

            console.log(opts);
            for (; index < opts.length; index += 2) {
                dir = opts[index];
                screen = opts[index + 1];
                $("#" + dir + "-move")
                    .attr("data-screen", screen)
                    .fadeIn("slow");
            }
        }
    }

    //------------------------------
    //
    // Exposure
    //
    //------------------------------

    $(function () {
        /**
         * We define a simple function to move the user in a given direction
         * based on where they currently are.
         *
         * We are positioning the screens absolutely using the css, so we simply
         * need to "walk" the viewport around to center it on the appropriate
         * screen.
         *
         * The system keeps track of what it's moving to based on its index.
         */
        $(".mover").on("click", function (event) {
            event.preventDefault();

            var scTop = 0,
                scLeft = 0,
                op,
                pp = $("[data-index=" + currentScreen + "]"),
                o,
                e = $(this),
                restart = (e.attr("id") === "restart");

            if (restart) {
                lastScreen = 1;
                currentScreen = 1;
                op = $("[data-index=1]");
                o = {
                    scrollTop: startAt.top,
                    scrollLeft: startAt.left
                };
            } else {
                switch (e.attr("id")) {
                case "top-move":
                    restoreDirection = "bottom";
                    break;

                case "left-move":
                    restoreDirection = "right";
                    break;

                case "bottom-move":
                    restoreDirection = "top";
                    break;

                case "right-move":
                    restoreDirection = "left";
                    break;
                }

                lastScreen = currentScreen;
                currentScreen = e.attr("data-screen");

                op = $("[data-index=" + currentScreen + "]");
                o = {
                    scrollTop: op.css("top"),
                    scrollLeft: op.css("left")
                };
            }
			console.log(pp);
			pp.trigger("deactivate");
			op.trigger("activate");

            $(".mover").fadeOut("slow");
            $("#viewport-scroller").animate(o, SLIDE_TIME, function () {
                cleanupScroll();
            });
        });
		
		$("[data-index]")
			.on("deactivate", function (event) {
				var e = $(event.target);
				if (vimeoSlides[e.attr("data-index")]) {
					e.html("");
				}
			})
			.on("activate", function (event) {
				var e = $(event.target);	
				if (vimeoSlides[e.attr("data-index")]) {
					console.log("yes");
					e.html(VIMEO_SLUG.replace("%id", vimeoSlides[e.attr("data-index")]));
					console.log(e.html());
				}
			});
			
        $("#viewport-scroller")
            .scrollTop(startAt.top)
            .scrollLeft(startAt.left);

        cleanupScroll();

        if (window.location.search.match(/oneway/)) {
            canBackUp = false;
        }
    });

}(window.jQuery));

