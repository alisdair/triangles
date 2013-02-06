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
}

Triangles = {
	initialise: function(canvas, context) {
		this.canvas = canvas;
		this.context = context;
		this.width = canvas.width;
		this.height = canvas.height;

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
			var oc = t.colour;
			while (t.colour == oc)
				t.colour = Colours.random();
			that.draw();
		});

		this.draw();
	},

	draw: function() {
		for (var i = 0; i < this.triangles.length; i++) {
			this.triangles[i].draw(this.context);
		}
	},

	at: function(x, y) {
		if (x < 0 || y < 0)
			return undefined;

		console.log("\n\n");

		console.log(x + ", " + y);
		var rh = Settings.height;
		var row = Math.floor(y / rh);
		console.log("row: " + row);

		var dy = y - row * rh;
		console.log("dy: " + dy);

		var cw = Settings.width / 2;

		var col = Math.floor(x / cw);
		console.log("col: " + col);

		var dx = x - col * cw;
		console.log("dx: " + dx);

		var delta = 0;
		if ((row % 2 == 0 && col % 2 == 0) || (row % 2 == 1 && col % 2 == 1)) {
			console.log("\n\\");
			console.log("dx / dy: " + (dx / dy));
			console.log("cw / rh: " + (cw / rh));
			if (dy == 0 || dx / dy > cw / rh )
				delta = 1;
		} else {
			console.log("\n/");
			dx = cw - dx;
			console.log("dx: " + dx);
			console.log("dx / dy: " + (dx / dy));
			console.log("-cw / rh: " + (cw / rh));
			if (dx / dy < cw / rh )
				delta = 1;
		}
		console.log("delta: " + delta);

		var tx = col + delta, ty = row;

		// FIXME this is dumb
		for (var i = 0; i < this.triangles.length; i++) {
			var t = this.triangles[i];
			if (t.x == tx && t.y == ty)
				return t;
		}

		return undefined;
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
