/*!
 * jQuery Smooth Jump 1.1.0
 * Author: Mathieu Bouchard
 * Plugin Dependencies: jQuery Address 1.5+, Waypoints
 * Keywords: javascript,jquery,smooth,scroll,waypoint
 * License: MIT ( http://www.opensource.org/licenses/mit-license.php )
 * Repo: https://github.com/matb33/jquery-smooth-jump
 */
(function ($) {
	$.fn.smoothJump = function (options) {
		var settings = $.extend(true, {
			prefix: "id-",
			$nav: function () { return $(".nav"); },
			$sections: function () { return $(".waypoint"); },
			topOffset: function () { return 0; },
			waypointOffset: function () { return 0; },
			scrollAnimationDuration: 500,
			scrollAnimationTimingFunction: "swing",
			activeClass: "active"
		}, options);

		var that = this;

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
						if ($.fn.smoothJump.lastAddressValue === targetId) {
							onAddressChange({value: targetId});
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

				$.address.init(function (event) {
					if (event.value !== "") {
						// We have a hash on load, let's not monitor waypoints
						// until we're done acting on it
						$.fn.smoothJump.preventWaypointMonitoring = true;
					}

					setupWaypoints.call(context);
				});

				$.address.change(function (event) {
					if (event.value !== $.fn.smoothJump.lastAddressValue) {
						$.fn.smoothJump.lastAddressValue = event.value;
						onAddressChange(event);
					}
				});

				$this.data("smooth_jump_address_events_already_bound", true);
			} else {
				setupWaypoints.call(context);
			}
		};

		var onAddressChange = function (event) {
			var hash = event.value;
			var scrollElement = "html, body";
			var target, $target;
			var targetScrollTop;
			var $activeLink;
			var $nav = settings.$nav();

			if (hash && hash.indexOf(settings.prefix) === 0) {
				target = hash.replace(settings.prefix, "");
				$target = $("#" + target);

				if ($target.length > 0) {
					if (!$.fn.smoothJump.preventScroll) {
						targetScrollTop = $target.offset().top - settings.topOffset();

						$(scrollElement).stop().animate({
							"scrollTop": targetScrollTop
						}, settings.scrollAnimationDuration, settings.scrollAnimationTimingFunction, function () {
							$.fn.smoothJump.preventWaypointMonitoring = false;
							$.waypoints("refresh");
						});
					}

					$activeLink = $("a[href*='#" + hash + "']", $nav);

					if ($activeLink.length > 0) {
						$("." + settings.activeClass, $nav).removeClass(settings.activeClass);
						$activeLink.parent().addClass(settings.activeClass);
					}
				} else {
					throw "Invalid target #" + target + " in onAddressChange";
				}
			}
		};

		var setupWaypoints = function () {
			var $sections = settings.$sections();

			$sections.waypoint("destroy");
			$sections.waypoint(function (event, direction) {
				if (!$.fn.smoothJump.preventWaypointMonitoring) {
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

					// Update hash value in address bar
					$.fn.smoothJump.preventScroll = true;
					$.address.value(settings.prefix + activeID);
					$.fn.smoothJump.preventScroll = false;
				}
			}, {
				offset: settings.waypointOffset()
			});
		};

		this.each(main);

		return {
			get: function () {
				return that;
			},
			preventScroll: false,
			preventWaypointMonitoring: false,
			lastAddressValue: null
		};
	};

})(window.jQuery);
