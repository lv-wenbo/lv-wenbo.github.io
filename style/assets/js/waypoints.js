/*
Waypoints - 4.0.1
Copyright © 2011-2016 Caleb Troughton
Licensed under the MIT license.
https://github.com/imakewebthings/waypoints/blob/master/licenses.txt
*/
(function() {
	var b = 0;
	var a = {};

	function c(d) {
		if (!d) {
			throw new Error("No options passed to Waypoint constructor")
		}
		if (!d.element) {
			throw new Error("No element option passed to Waypoint constructor")
		}
		if (!d.handler) {
			throw new Error("No handler option passed to Waypoint constructor")
		}
		this.key = "waypoint-" + b;
		this.options = c.Adapter.extend({}, c.defaults, d);
		this.element = this.options.element;
		this.adapter = new c.Adapter(this.element);
		this.callback = d.handler;
		this.axis = this.options.horizontal ? "horizontal" : "vertical";
		this.enabled = this.options.enabled;
		this.triggerPoint = null;
		this.group = c.Group.findOrCreate({
			name: this.options.group,
			axis: this.axis
		});
		this.context = c.Context.findOrCreateByElement(this.options.context);
		if (c.offsetAliases[this.options.offset]) {
			this.options.offset = c.offsetAliases[this.options.offset]
		}
		this.group.add(this);
		this.context.add(this);
		a[this.key] = this;
		b += 1
	}
	c.prototype.queueTrigger = function(d) {
		this.group.queueTrigger(this, d)
	};
	c.prototype.trigger = function(d) {
		if (!this.enabled) {
			return
		}
		if (this.callback) {
			this.callback.apply(this, d)
		}
	};
	c.prototype.destroy = function() {
		this.context.remove(this);
		this.group.remove(this);
		delete a[this.key]
	};
	c.prototype.disable = function() {
		this.enabled = false;
		return this
	};
	c.prototype.enable = function() {
		this.context.refresh();
		this.enabled = true;
		return this
	};
	c.prototype.next = function() {
		return this.group.next(this)
	};
	c.prototype.previous = function() {
		return this.group.previous(this)
	};
	c.invokeAll = function(g) {
		var d = [];
		for (var h in a) {
			d.push(a[h])
		}
		for (var f = 0, e = d.length; f < e; f++) {
			d[f][g]()
		}
	};
	c.destroyAll = function() {
		c.invokeAll("destroy")
	};
	c.disableAll = function() {
		c.invokeAll("disable")
	};
	c.enableAll = function() {
		c.Context.refreshAll();
		for (var d in a) {
			a[d].enabled = true
		}
		return this
	};
	c.refreshAll = function() {
		c.Context.refreshAll()
	};
	c.viewportHeight = function() {
		return window.innerHeight || document.documentElement.clientHeight
	};
	c.viewportWidth = function() {
		return document.documentElement.clientWidth
	};
	c.adapters = [];
	c.defaults = {
		context: window,
		continuous: true,
		enabled: true,
		group: "default",
		horizontal: false,
		offset: 0
	};
	c.offsetAliases = {
		"bottom-in-view": function() {
			return this.context.innerHeight() - this.adapter.outerHeight()
		},
		"right-in-view": function() {
			return this.context.innerWidth() - this.adapter.outerWidth()
		}
	};
	window.Waypoint = c
}());
(function() {
	function e(g) {
		window.setTimeout(g, 1000 / 60)
	}
	var c = 0;
	var b = {};
	var f = window.Waypoint;
	var d = window.onload;

	function a(g) {
		this.element = g;
		this.Adapter = f.Adapter;
		this.adapter = new this.Adapter(g);
		this.key = "waypoint-context-" + c;
		this.didScroll = false;
		this.didResize = false;
		this.oldScroll = {
			x: this.adapter.scrollLeft(),
			y: this.adapter.scrollTop()
		};
		this.waypoints = {
			vertical: {},
			horizontal: {}
		};
		g.waypointContextKey = this.key;
		b[g.waypointContextKey] = this;
		c += 1;
		if (!f.windowContext) {
			f.windowContext = true;
			f.windowContext = new a(window)
		}
		this.createThrottledScrollHandler();
		this.createThrottledResizeHandler()
	}
	a.prototype.add = function(h) {
		var g = h.options.horizontal ? "horizontal" : "vertical";
		this.waypoints[g][h.key] = h;
		this.refresh()
	};
	a.prototype.checkEmpty = function() {
		var g = this.Adapter.isEmptyObject(this.waypoints.horizontal);
		var i = this.Adapter.isEmptyObject(this.waypoints.vertical);
		var h = this.element == this.element.window;
		if (g && i && !h) {
			this.adapter.off(".waypoints");
			delete b[this.key]
		}
	};
	a.prototype.createThrottledResizeHandler = function() {
		var h = this;

		function g() {
			h.handleResize();
			h.didResize = false
		}
		this.adapter.on("resize.waypoints", function() {
			if (!h.didResize) {
				h.didResize = true;
				f.requestAnimationFrame(g)
			}
		})
	};
	a.prototype.createThrottledScrollHandler = function() {
		var h = this;

		function g() {
			h.handleScroll();
			h.didScroll = false
		}
		this.adapter.on("scroll.waypoints", function() {
			if (!h.didScroll || f.isTouch) {
				h.didScroll = true;
				f.requestAnimationFrame(g)
			}
		})
	};
	a.prototype.handleResize = function() {
		f.Context.refreshAll()
	};
	a.prototype.handleScroll = function() {
		var p = {};
		var g = {
			horizontal: {
				newScroll: this.adapter.scrollLeft(),
				oldScroll: this.oldScroll.x,
				forward: "right",
				backward: "left"
			},
			vertical: {
				newScroll: this.adapter.scrollTop(),
				oldScroll: this.oldScroll.y,
				forward: "down",
				backward: "up"
			}
		};
		for (var i in g) {
			var h = g[i];
			var n = h.newScroll > h.oldScroll;
			var l = n ? h.forward : h.backward;
			for (var s in this.waypoints[i]) {
				var r = this.waypoints[i][s];
				if (r.triggerPoint === null) {
					continue
				}
				var q = h.oldScroll < r.triggerPoint;
				var o = h.newScroll >= r.triggerPoint;
				var k = q && o;
				var j = !q && !o;
				if (k || j) {
					r.queueTrigger(l);
					p[r.group.id] = r.group
				}
			}
		}
		for (var m in p) {
			p[m].flushTriggers()
		}
		this.oldScroll = {
			x: g.horizontal.newScroll,
			y: g.vertical.newScroll
		}
	};
	a.prototype.innerHeight = function() {
		if (this.element == this.element.window) {
			return f.viewportHeight()
		}
		return this.adapter.innerHeight()
	};
	a.prototype.remove = function(g) {
		delete this.waypoints[g.axis][g.key];
		this.checkEmpty()
	};
	a.prototype.innerWidth = function() {
		if (this.element == this.element.window) {
			return f.viewportWidth()
		}
		return this.adapter.innerWidth()
	};
	a.prototype.destroy = function() {
		var g = [];
		for (var h in this.waypoints) {
			for (var l in this.waypoints[h]) {
				g.push(this.waypoints[h][l])
			}
		}
		for (var k = 0, j = g.length; k < j; k++) {
			g[k].destroy()
		}
	};
	a.prototype.refresh = function() {
		var o = this.element == this.element.window;
		var l = o ? undefined : this.adapter.offset();
		var t = {};
		var h;
		this.handleScroll();
		h = {
			horizontal: {
				contextOffset: o ? 0 : l.left,
				contextScroll: o ? 0 : this.oldScroll.x,
				contextDimension: this.innerWidth(),
				oldScroll: this.oldScroll.x,
				forward: "right",
				backward: "left",
				offsetProp: "left"
			},
			vertical: {
				contextOffset: o ? 0 : l.top,
				contextScroll: o ? 0 : this.oldScroll.y,
				contextDimension: this.innerHeight(),
				oldScroll: this.oldScroll.y,
				forward: "down",
				backward: "up",
				offsetProp: "top"
			}
		};
		for (var j in h) {
			var i = h[j];
			for (var w in this.waypoints[j]) {
				var v = this.waypoints[j][w];
				var g = v.options.offset;
				var q = v.triggerPoint;
				var m = 0;
				var n = q == null;
				var k, u, p;
				var r, s;
				if (v.element !== v.element.window) {
					m = v.adapter.offset()[i.offsetProp]
				}
				if (typeof g === "function") {
					g = g.apply(v)
				} else {
					if (typeof g === "string") {
						g = parseFloat(g);
						if (v.options.offset.indexOf("%") > -1) {
							g = Math.ceil(i.contextDimension * g / 100)
						}
					}
				}
				k = i.contextScroll - i.contextOffset;
				v.triggerPoint = Math.floor(m + k - g);
				u = q < i.oldScroll;
				p = v.triggerPoint >= i.oldScroll;
				r = u && p;
				s = !u && !p;
				if (!n && r) {
					v.queueTrigger(i.backward);
					t[v.group.id] = v.group
				} else {
					if (!n && s) {
						v.queueTrigger(i.forward);
						t[v.group.id] = v.group
					} else {
						if (n && i.oldScroll >= v.triggerPoint) {
							v.queueTrigger(i.forward);
							t[v.group.id] = v.group
						}
					}
				}
			}
		}
		f.requestAnimationFrame(function() {
			for (var x in t) {
				t[x].flushTriggers()
			}
		});
		return this
	};
	a.findOrCreateByElement = function(g) {
		return a.findByElement(g) || new a(g)
	};
	a.refreshAll = function() {
		for (var g in b) {
			b[g].refresh()
		}
	};
	a.findByElement = function(g) {
		return b[g.waypointContextKey]
	};
	window.onload = function() {
		if (d) {
			d()
		}
		a.refreshAll()
	};
	f.requestAnimationFrame = function(g) {
		var h = window.requestAnimationFrame || window.mozRequestAnimationFrame || window
			.webkitRequestAnimationFrame || e;
		h.call(window, g)
	};
	f.Context = a
}());
(function() {
	function b(f, g) {
		return f.triggerPoint - g.triggerPoint
	}

	function a(f, g) {
		return g.triggerPoint - f.triggerPoint
	}
	var d = {
		vertical: {},
		horizontal: {}
	};
	var e = window.Waypoint;

	function c(f) {
		this.name = f.name;
		this.axis = f.axis;
		this.id = this.name + "-" + this.axis;
		this.waypoints = [];
		this.clearTriggerQueues();
		d[this.axis][this.name] = this
	}
	c.prototype.add = function(f) {
		this.waypoints.push(f)
	};
	c.prototype.clearTriggerQueues = function() {
		this.triggerQueues = {
			up: [],
			down: [],
			left: [],
			right: []
		}
	};
	c.prototype.flushTriggers = function() {
		for (var f in this.triggerQueues) {
			var l = this.triggerQueues[f];
			var j = f === "up" || f === "left";
			l.sort(j ? a : b);
			for (var h = 0, g = l.length; h < g; h += 1) {
				var k = l[h];
				if (k.options.continuous || h === l.length - 1) {
					k.trigger([f])
				}
			}
		}
		this.clearTriggerQueues()
	};
	c.prototype.next = function(h) {
		this.waypoints.sort(b);
		var f = e.Adapter.inArray(h, this.waypoints);
		var g = f === this.waypoints.length - 1;
		return g ? null : this.waypoints[f + 1]
	};
	c.prototype.previous = function(g) {
		this.waypoints.sort(b);
		var f = e.Adapter.inArray(g, this.waypoints);
		return f ? this.waypoints[f - 1] : null
	};
	c.prototype.queueTrigger = function(g, f) {
		this.triggerQueues[f].push(g)
	};
	c.prototype.remove = function(g) {
		var f = e.Adapter.inArray(g, this.waypoints);
		if (f > -1) {
			this.waypoints.splice(f, 1)
		}
	};
	c.prototype.first = function() {
		return this.waypoints[0]
	};
	c.prototype.last = function() {
		return this.waypoints[this.waypoints.length - 1]
	};
	c.findOrCreate = function(f) {
		return d[f.axis][f.name] || new c(f)
	};
	e.Group = c
}());
(function() {
	var a = window.jQuery;
	var c = window.Waypoint;

	function b(d) {
		this.$element = a(d)
	}
	a.each(["innerHeight", "innerWidth", "off", "offset", "on", "outerHeight", "outerWidth", "scrollLeft",
		"scrollTop"
	], function(d, e) {
		b.prototype[e] = function() {
			var f = Array.prototype.slice.call(arguments);
			return this.$element[e].apply(this.$element, f)
		}
	});
	a.each(["extend", "inArray", "isEmptyObject"], function(d, e) {
		b[e] = a[e]
	});
	c.adapters.push({
		name: "jquery",
		Adapter: b
	});
	c.Adapter = b
}());
(function() {
	var b = window.Waypoint;

	function a(c) {
		return function() {
			var e = [];
			var d = arguments[0];
			if (c.isFunction(arguments[0])) {
				d = c.extend({}, arguments[1]);
				d.handler = arguments[0]
			}
			this.each(function() {
				var f = c.extend({}, d, {
					element: this
				});
				if (typeof f.context === "string") {
					f.context = c(this).closest(f.context)[0]
				}
				e.push(new b(f))
			});
			return e
		}
	}
	if (window.jQuery) {
		window.jQuery.fn.waypoint = a(window.jQuery)
	}
	if (window.Zepto) {
		window.Zepto.fn.waypoint = a(window.Zepto)
	}
}());
