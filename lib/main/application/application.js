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
         * Used to embed videos.
         */
		VIDEO_SLUG = '<video width="' + WIDTH + '" height="' + HEIGHT + '" src="movies/%id.%ext" data-autoplay="%autoplay" data-video="%ident"></video>',

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
         *  myIndex: [true, timeSet, fwdDir, fwdScreen, backScreen, backDir]
		 *
		 * The timeSet object is a representation of [inSpeed, outSpeed]
		 *
		 * If the outSpeed is false, the inSpeed will be used for both.
		 * If the outSpeed is true, the slide will jump backwards to the original screen not the last screen.
         *
         * If it starts with false, it shows the first arg but moves in the second.
         */
        screenMovers = {
             1: ["bottom", 2],
             2: ["left", '3a', "right", '3aa'],

            // To the left of the first T junction
             '3a': [true, [2500, 500], "bottom", '4a', 2],
             '4a': ["bottom", '5a', "left", '4b'],
             '4b': ["left", '4c'],
             '4c': ["left", '4d'],
             '4d': [false, '4a'],
             '5a': ["bottom", 6],

            // To the right of the first T junction
             '3aa': [true, [1000, false], "bottom", '4aa', 2],
             '4aa': ["bottom", '5aa', "left", '3a'],
             '5aa': ["bottom", 6],

            // Leasing
             6: ["bottom", 7],
             7: ["left", '8a', "right", '8aa'],

            // Leasing left
            '8a': ["bottom", '9a', "left", '8b'],
            '8b': ["left", '8c'],
            '8c': [false, '8a'],
            '9a': ["bottom", 10],
            
            //Leasing right
            '8aa': ["bottom", '9aa'],
            '9aa': ["bottom", 10],
            
            //Prospecting
            10: ["left", '11a', "right", '11aa'],
            '11a': ["bottom", 12],
            '11aa': ["bottom", 12],

            // Seismology
            12: [true, [3000, false], "bottom", 13],
            13: ["bottom", 14],
            14: ["bottom", 15],
            15: [true, [1000, false], "bottom", 16],

            // Last in the menu so we don't need to worry about commas
            0: []
        },
		
		
		videoSlides = {
			'3a': '3',
			'4aa': {
				"drawer-geochemistry": [false, '4aa_geochemistry']
			}
		},
		
		//these are the drawers on your image map.
		
		mappedVideos = {
			"[id^=drawer]": [
				"drawer-maps",
				"drawer-fieldwork",
				"drawer-gravimetry",
				"drawer-geomorphology",
				"drawer-geochemistry",
				"drawer-surprise"
			]
		},
		
		//this is the duration of each video for each drawer.
		VIDEO_TIMES = {
			"drawer-maps": 9500,
			"drawer-fieldwork": 7500,
			"drawer-gravimetry": 10500,
			"drawer-geomorphology": 10500,
			"drawer-geochemistry": 7500,
			"drawer-surprise": 2500
		},

        restoreDirection;

    //------------------------------
    //
    // Methods
    //
    //------------------------------

	VIDEO_SLUG = VIDEO_SLUG.replace("%ext", (window.mozInnerScreenX === undefined) ? "mp4" : "ogv");
	
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
    function cleanupScroll(bakwards, specific) {
        var opts = screenMovers[currentScreen],
            index = 0,
            dir, screen, retScreen,
            // Used below
            canGo, delay, autoDir, autoScreen, optSpec;

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
		
		if (opts[0] === false) {
			opts.shift();
			optSpec = opts.shift();
            $("#specific").fadeIn("slow").attr("data-move-to", optSpec);
		} else {
            $("#specific").fadeOut("fast");
		}

        if (opts[0] === true) {
            delay = opts[1];
            autoDir = opts[2];
            autoScreen = opts[3];

            if (bakwards) {
                // We are going backwards, invert everything
                autoScreen = opts[4];
                autoDir = restoreDirection;
			}
			
			if (delay[1] === true) {
				retScreen = lastScreen;
				delay = delay[0];
			} else if (delay[1] === false) {
				retScreen = currentScreen;
				delay = delay[0];
			} else {
				retScreen = currentScreen;
				delay = delay[1];
			}

            // Perform an automagic delayed screen transition
            setTimeout(function () {
                $("#" + autoDir + "-move")
                    .attr("data-screen", autoScreen)
					.attr("data-return", retScreen)
                    .click();
            }, delay);
        } else {
            if (currentScreen !== 1 && canBackUp && !specific) {
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

            for (; index < opts.length; index += 2) {
                dir = opts[index];
                screen = opts[index + 1];
                $("#" + dir + "-move")
                    .attr("data-screen", screen)
                    .fadeIn("slow");
            }
        }
		
		if (optSpec !== undefined) {
			opts.unshift(optSpec);
			opts.unshift(false);
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
                restart = (e.attr("id") === "restart"),
                specific = (e.attr("id") === "specific"),
				backward = false;

            if (restart) {
                lastScreen = 1;
                currentScreen = 1;
                op = $("[data-index=1]");
                o = {
                    scrollTop: startAt.top,
                    scrollLeft: startAt.left
                };
            } else if (specific) {
                lastScreen = e.attr("data-move-to");
                currentScreen = lastScreen;

                op = $("[data-index=" + currentScreen + "]");
                o = {
                    scrollTop: op.css("top"),
                    scrollLeft: op.css("left")
                };
            } else {
				backward = restoreDirection + "-move" === e.attr("id");
				
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

                lastScreen = e.attr("data-return") || currentScreen;
                currentScreen = e.attr("data-screen");
				e.attr("data-return", "");

                op = $("[data-index=" + currentScreen + "]");
                o = {
                    scrollTop: op.css("top"),
                    scrollLeft: op.css("left")
                };
            }
			
			if (backward) pp.trigger("slide-out");
			else op.trigger("slide-in");

            $(".mover").fadeOut("slow");
            $("#viewport-scroller").animate(o, SLIDE_TIME, function () {
                cleanupScroll(backward, specific);
            });
        });
		
		$.each(videoSlides, function (idx, vset) {
			var video,
				autoplay = true;
			if ($.isPlainObject(vset)) {
				$.each(vset, function (name, def) {
					if ($.isArray(def)) {
						var ap = def[0],
							vp = def[1];
					} else {
						var ap = false,
							vp = def;
					}
					
					$("[data-index=" + idx + "]").append(VIDEO_SLUG.replace("%id", vp).replace("%autoplay", ap ? "yes" : "no").replace("%ident", name));
				});
				return;
			} else if ($.isArray(vset)) {
				autoplay = vset[0];
				video = vset[1];
			} else {
				video = vset;
			}
			$("[data-index=" + idx + "]").append(VIDEO_SLUG.replace("%id", video).replace("%autoplay", autoplay ? "yes" : "no").replace("%ident", "video-" + video));
		});
		
		$("[data-index]")
			.on("slide-out", function (event) {
				var e = $(event.target);
				if (videoSlides[e.attr("data-index")]) {
					e.find("video[data-autoplay=no]").hide();
				}
			})
			.on("slide-in", function (event) {
				var e = $(event.target);	
				if (videoSlides[e.attr("data-index")]) {
					var ee = e.find("video"),
						me = ee[0];
					if (ee.attr("data-autoplay") === "yes") {
						me.play();
					}
				//	me.playbackRate = 1;
				}
			});
			
        $("#viewport-scroller")
            .scrollTop(startAt.top)
            .scrollLeft(startAt.left);

        cleanupScroll();
		
		$.each(mappedVideos, function (selector, elements) {
			$(selector).on("click", function (event) {
				event.preventDefault();
				var e = $(event.target),
					s = e.parents(".screen");
				if ($.inArray(e.attr("id"), elements) > -1) {
					var ee = s.find("video[data-video=" + e.attr("id") + "]").show(),
						me = ee[0];
						me.play();
						setTimeout(function () {
							me.currentTime = 0;
							ee.hide();
						}, VIDEO_TIMES[e.attr("id")]);
						console.log("Video activated");
				} else {
					console.log("no video defined for this map!", e.attr("id"));
				}
			});
		});
		
		

        if (window.location.search.match(/oneway/)) {
            canBackUp = false;
        }
    });

}(window.jQuery));

