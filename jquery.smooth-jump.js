/*!
 * jQuery Smooth Jump 1.2.0
 * Author: Mathieu Bouchard
 * Plugin Dependencies: jQuery Address 1.5+, Waypoints
 * Keywords: javascript,jquery,smooth,scroll,waypoint
 * License: MIT ( http://www.opensource.org/licenses/mit-license.php )
 * Repo: https://github.com/matb33/jquery-smooth-jump
 */

 (function ($) {
	var SMOOTH_JUMP_PREVENT_SCROLL;
	var SMOOTH_JUMP_PREVENT_WAYPOINT_MONITORING;
	var SMOOTH_JUMP_LAST_ADDRESS_VALUE;

	$.fn.smoothJump = function (options) {
		var settings = $.extend(true, {
			prefix: "id-",
			$nav: function () { return $(".nav"); },
			$sections: function () { return $(".waypoint"); },
			topOffset: function () { return 0; },
			waypointOffset: function () { return 0; },
			scrollAnimationDuration: 500,
			scrollAnimationTimingFunction: "swing",
			activeClass: "active",
			updateHashOnWaypoint: false,
			dontSmoothJump: false
		}, options);

		var main = function () {
			setupAnchors.call(this);
			bindAddressEvents.call(this);
		};

		var setupAnchors = function () {
			// Replace all # anchor style links to have #[settings.prefix] prepended.
			// We do this in JS in order to prevent normal jump-scrolling
			// from EVER occuring when JS is enabled:
			$(this).find("a[href*='#']").each(function (index, item) {
				var $item = $(item);
				var href = $item.attr("href");
				var matches = /#([A-Za-z0-9_:-]+)/.exec(href);
				var hash = matches && matches.length > 1 && matches[1];
				var newHref = href.replace("#", "#" + settings.prefix);
				var targetId = settings.prefix + hash;

				if (hash && href !== "#") {
					$item.attr("href", newHref);
					$item.click(function () {
						// If we click on an anchor that has the same target again, ensure
						// it actually does the scrolling action
						if (SMOOTH_JUMP_LAST_ADDRESS_VALUE === targetId) {
							onAddressChange.call(this, {value: targetId});
						}
					});
				}
			});
		};

		var bindAddressEvents = function () {
			var context = this;
			var $this = $(this);

			if ($this.data("smooth_jump_address_events_already_bound") !== true) {
				$.address.strict(false);
				$.address.history(true);

				$.address.init(function (event) {
					if (event.value !== "") {
						// We have a hash on load, let's not monitor waypoints
						// until we're done acting on it
						SMOOTH_JUMP_PREVENT_WAYPOINT_MONITORING = true;
					}

					setupWaypoints.call(context);
				});

				$.address.change(function (event) {
					if (event.value !== SMOOTH_JUMP_LAST_ADDRESS_VALUE) {
						SMOOTH_JUMP_LAST_ADDRESS_VALUE = event.value;
						onAddressChange.call(this, event);
					}
				});

				$this.data("smooth_jump_address_events_already_bound", true);
			} else {
				setupWaypoints.call(context);
				// onAddressChange.call(context, {value: window.location.hash.replace("#", "")});
			}
		};

		var onAddressChange = function (event) {
			var hash = event.value;
			var $scrollElement = $("html, body");
			var target, $target;
			var targetScrollTop;
			var $activeLink;
			var $nav = settings.$nav();

			if (hash && hash.indexOf(settings.prefix) === 0) {
				target = hash.replace(settings.prefix, "");
				$target = $("#" + target);

				if ($target.length > 0) {
					if (!SMOOTH_JUMP_PREVENT_SCROLL) {
						if (settings.dontSmoothJump) {
							// Non-smooth behavior: do built-in scroll via hash,
							// then after adjust top offset
							$.address.value(target);
							$scrollElement.scrollTop($scrollElement.scrollTop() - settings.topOffset());
						} else {
							// Normal behavior, smooth jump
							targetScrollTop = $target.offset().top - settings.topOffset();

							$scrollElement.stop().animate({
								"scrollTop": targetScrollTop
							}, settings.scrollAnimationDuration, settings.scrollAnimationTimingFunction, function () {
								SMOOTH_JUMP_PREVENT_WAYPOINT_MONITORING = false;
								$.waypoints("refresh");
								setTimeout(function () {
									$(window).trigger("scroll");
								}, 250);
							});
						}
					}

					$activeLink = $("a[href*='#" + hash + "']", $nav);

					if ($activeLink.length > 0) {
						$("." + settings.activeClass, $nav).removeClass(settings.activeClass);
						$activeLink.parent().addClass(settings.activeClass);
					}
				} else {
					// throw "Invalid target #" + target + " in onAddressChange";
				}
			}
		};

		var setupWaypoints = function () {
			var $sections = settings.$sections();
			var $nav = settings.$nav();

			$sections.waypoint("destroy");
			$sections.waypoint(function (event, direction) {
				if (!SMOOTH_JUMP_PREVENT_WAYPOINT_MONITORING) {
					var active = this;
					var $active = $(active);
					var activeID;
					var prevSection;
					var $prevSection;

					if (direction === "up") {
						prevSection = false;
						$sections.each(function () {
							if (this === active) {
								return false;
							}
							prevSection = this;
						});
						if (prevSection) {
							$prevSection = $(prevSection);
							if ($prevSection.length) {
								$active = $prevSection;
							}
						}
					}

					activeID = $active.attr("id");

					if (settings.updateHashOnWaypoint && activeID) {
						// Update hash value in address bar
						SMOOTH_JUMP_PREVENT_SCROLL = true;
						$.address.value(settings.prefix + activeID);
						SMOOTH_JUMP_PREVENT_SCROLL = false;
					} else {
						$activeLink = $("a[href*='#" + settings.prefix + activeID + "']", $nav);
						if ($activeLink.length > 0) {
							$("." + settings.activeClass, $nav).removeClass(settings.activeClass);
							$activeLink.parent().addClass(settings.activeClass);
						}
					}
				}
			}, {
				offset: settings.waypointOffset()
			});
		};

		SMOOTH_JUMP_PREVENT_SCROLL = false;
		SMOOTH_JUMP_PREVENT_WAYPOINT_MONITORING = false;

		this.each(main);

		return this;
	};

})(window.jQuery);
