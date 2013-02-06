var Settings = {
	cols: 36,
	rows: 20,
	width: 34,
}

Settings.height = Math.floor(Settings.width / Math.sqrt(2));

var Colours = [
	"#6BBF10",
	"#145289",
	"#D38311",
	"#B80F4D"
];

Colours.random = function() {
	return this[Math.floor(Math.random() * this.length)];
};

var Triangle = function(x, y, colour) {
	this.x = x;
	this.y = y;
	this.colour = colour;
}

Triangle.prototype = {
	down: function() { return (!this.odd() && this.x % 2 == 1) || (this.odd() && this.x % 2 == 0); },
	odd:  function() { return this.y % 2 == 1; },

	x_position: function() {
		var x = this.odd() ? this.x + 1 : this.x;
		var sx = Math.floor(x / 2);
		var dx = this.odd() ? Settings.width / 2 : 0;
		return sx * Settings.width - dx + 0.5;
	},
	y_position: function() {
		return this.y * Settings.height + 0.5;
	},

	draw: function(context) {
		var xp = this.x_position();
		var yp = this.y_position();

		context.fillStyle = this.colour;
		context.strokeStyle = "#fff";
		context.beginPath();
		context.moveTo(xp, yp);

		if (this.down()) {
			context.lineTo(xp + Settings.width, yp);
			context.lineTo(xp + Settings.width / 2, yp + Settings.height);
		} else {
			context.lineTo(xp - Settings.width / 2, yp + Settings.height);
			context.lineTo(xp + Settings.width / 2, yp + Settings.height);
		}
		context.lineTo(xp, yp);

		context.fill();
		context.stroke();
		context.closePath();
	},

	equals: function(other) {
		return other && other.x == this.x && other.y == this.y;
	},

	toString: function() {
		return "(" + this.x + ", " + this.y + ", " + this.colour + ")";
	}
}

Triangles = {
	initialise: function(canvas, context) {
		this.canvas = canvas;
		this.context = context;
		this.width = canvas.width;
		this.height = canvas.height;
		this.clicks = 0;

		context.fillStyle = "#999";
		context.fillRect(0, 0, this.width, this.height);

		this.triangles = [];
		for (var x = 0; x < Settings.cols; x++) {
			for (var y = 0; y < Settings.rows; y++) {
				this.triangles.push(new Triangle(x, y, Colours.random()));
			}
		}

		var that = this;
		$(canvas).click(function(e) {
			var offset = $(this).offset();
			var x = e.pageX - offset.left, y = e.pageY - offset.top;

			y -= 2; // I do not know why this is necessary.

			var t = that.at(x, y);
			that.flip(t);
			that.clicks += 1;
		});

		window.requestAnimFrame = (function(){
			return  window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame   ||
			window.mozRequestAnimationFrame      ||
			window.oRequestAnimationFrame        ||
			window.msRequestAnimationFrame       ||
			function(callback){
				window.setTimeout(callback, 1000 / 60);
			};
		})();

		this.refresh = true;

		(function animate() {
			requestAnimFrame(animate);
			if (!that.refresh)
				return;
			that.refresh = false;

			var colours = [];
			var won = false;
			for (var i = 0; i < that.triangles.length; i++) {
				var t = that.triangles[i];
				if (colours.indexOf(t.colour) == -1)
					colours.push(t.colour);

				t.draw(that.context);
			}
			var score = "Clicks: " + that.clicks;
			if (colours.length == 1)
				score += " - you win!";
			$("#score").html(score);
		})();
	},

	flip: function(t) {
		if (typeof t == "undefined") {
			return;
		}

		// Change the colour to something else
		var c = t.colour;
		while (c == t.colour)
			c = Colours.random();

		this.propagate([t], t.colour, c);
	},

	propagate: function(ts, from, to) {
		if (ts.length == 0)
			return;

		this.refresh = true;

		var matches = [];
		for (var i = 0; i < ts.length; i++) {
			var t = ts[i];

			if (t.colour != from)
				continue;
			t.colour = to;

			var others = this.surrounding(t);

			for (var j = 0; j < others.length; j++) {
				var tt = others[j];
				if (!tt || tt.colour != from)
					continue;

				var includes = function(xs, y) {
					for (var k = 0; k < xs.length; k++) {
						var x = xs[k];
						if (x.equals(y))
							return true;
					}
					return false;
				};

				if (!includes(matches, tt))
					matches.push(tt);
			}
		}

		var that = this;
		window.setTimeout(function() { that.propagate(matches, from, to); }, 100);
	},

	at: function(x, y) {
		if (x < 0 || y < 0)
			return undefined;

		var rh = Settings.height;
		var row = Math.floor(y / rh);

		var dy = y - row * rh;

		var cw = Settings.width / 2;

		var col = Math.floor(x / cw);

		var dx = x - col * cw;

		var delta = 0;
		if ((row % 2 == 0 && col % 2 == 0) || (row % 2 == 1 && col % 2 == 1)) {
			if (dy == 0 || dx / dy > cw / rh )
				delta = 1;
		} else {
			dx = cw - dx;
			if (dx / dy < cw / rh )
				delta = 1;
		}

		var tx = col + delta, ty = row;

		return this.find(tx, ty);
	},

	find: function(x, y) {
		// FIXME this is dumb
		for (var i = 0; i < this.triangles.length; i++) {
			var t = this.triangles[i];
			if (t.x == x && t.y == y)
				return t;
		}

		return undefined;
	},

	surrounding: function(t) {
		var ts = [];
		if (t.x > 0)
			ts.push(this.find(t.x - 1, t.y));
		if (t.x < Settings.cols)
			ts.push(this.find(t.x + 1, t.y));
		if (t.down() && t.y > 0)
			ts.push(this.find(t.x, t.y - 1));
		if (!t.down() && t.y < Settings.rows)
			ts.push(this.find(t.x, t.y + 1));
		return ts;
	}
}

$(document).ready(function(){
	var canvas = $("canvas")[0];

	if (canvas && canvas.getContext) {
		var context = canvas.getContext('2d');
		Triangles.initialise(canvas, context);
		canvas.onselectstart = function () { return false; }
	}
});
