// randomness

function generatePermutationTable(size) {
	perm = [];
	permMod8 = [];

	var i, j, k;
	for(i = 0; i < size; i++) {
		perm[i] = i;
	}
	
	while (--i) {
		j = Math.floor(Math.random() * size);
		k = perm[i];
		perm[i] = perm[j];
		perm[j] = k;
	}
	
	for(i = 0; i < size; i++) {
		perm[i + size] = perm[i];
		permMod8[i] = permMod8[i + size] = perm[i] % 8;
	}

	return permMod8;
}

var octaveFunctions = {
	absolute: function(octave) {
		return Math.abs((octave * 2) - 1);
	}
};

var sumFunctions = {
	sine: function(sum, scaledX) {
		return .5 + (Math.sin(scaledX * args.sineFrequencyCoeff + sum) / 2);
	},
	modular: function(sum) {
		var g = sum * args.modularAmplitude;
		return g - Math.floor(g);
	}
};

var smoothingFunctions = {
	none: function(t) {
		return t;
	},
	cosine: function(t) {
		return .5 * (1 + Math.cos((1 - t) * Math.PI))
	},
	hermite: function(t) {
		return t * t * (-t * 2 + 3);
	},
	quintic: function(t) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}
};

function interpolate(t, a, b) {
	return a + t * (b - a);
}

const value = {
	values: null,
	init: function(size) {
		this.values = [];
		for(var i = 0; i < size; i++) {
			this.values[i] = this.values[i + size] = Math.random();
		}
	},
	noise: function(x, y, size, permMod8, smooth) {
		var x0 = Math.floor(x) % size;
		var y0 = Math.floor(y) % size;
		var x1 = (x0 + 1) % size;
		var y1 = (y0 + 1) % size;
		var vx = x - Math.floor(x);
		var vy = y - Math.floor(y);
		var sx = smooth(vx);
		var sy = smooth(vy);
		var i = perm[x0];
		var j = perm[x1];
		//log(i,j);
		var p00 = perm[i + y0];
		var p10 = perm[j + y0];
		var p01 = perm[i + y1];
		var p11 = perm[j + y1];
		var i1 = interpolate(sx, this.values[p00], this.values[p10]);
		var i2 = interpolate(sx, this.values[p01], this.values[p11]);
		return interpolate(sy, i1, i2);
	}
};

const simplex = {
	F: .5 * (Math.sqrt(3) - 1),
	G: (3 - Math.sqrt(3)) / 6,
	grad: [
		[1, 1],
		[-1, 1],
		[1, -1],
		[-1, -1],
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1]
	],
	init: function() {},
	noise: function(x, y, size, permMod8, smooth) {
		var n0, n1, n2, s, i, j, t, X0, Y0, x0, y0, i1, j1, x1, x2, y1, y2, ii, jj, gi0, gi1, gi2, t0, t1, t2;
		
		s = (x + y) * this.F;
		i = Math.floor(x + s);
		j = Math.floor(y + s);
		t = (i + j) * this.G;
		X0 = i - t;
		Y0 = j - t;
		x0 = x - X0;
		y0 = y - Y0;
		
		if(x0 > y0) {
			i1 = 1;
			j1 = 0;
		}
		else {
			i1 = 0;
			j1 = 1;
		}
		
		x1 = x0 - i1 + this.G;
		y1 = y0 - j1 + this.G;
		x2 = x0 - 1 + 2 * this.G;
		y2 = y0 - 1 + 2 * this.G;
		
		ii = i % size;
		jj = j % size;
		gi0 = permMod8[ii + perm[jj]];
		gi1 = permMod8[ii + i1 + perm[jj + j1]];
		gi2 = permMod8[ii + 1 + perm[jj + 1]];
		
		t0 = .5 - x0 * x0 - y0 * y0;
		if(t0 < 0) n0 = 0;
		else {
			t0 *= t0;
			n0 = t0 * t0 * (this.grad[gi0][0] * x0 + this.grad[gi0][1] * y0);
		}
		
		t1 = .5 - x1 * x1 - y1 * y1;
		if(t1 < 0) n1 = 0;
		else {
			t1 *= t1;
			n1 = t1 * t1 * (this.grad[gi1][0] * x1 + this.grad[gi1][1] * y1);
		}
		
		t2 = .5 - x2 * x2 - y2 * y2;
		if(t2 < 0) n2 = 0;
		else {
			t2 *= t2;
			n2 = t2 * t2 * (this.grad[gi2][0] * x2 + this.grad[gi2][1] * y2);
		}
		
		return .5 + 35 * (n0 + n1 + n2);
	}
};

const perlin_classic = {
	grad: null,
	init: function(size) {
		var dist;
		
		this.grad = [];
		for(var i = 0; i < size; i++) {
			this.grad[i] = [(Math.random() * 2) - 1, (Math.random() * 2) - 1];
			dist = Math.sqrt(this.grad[i][0] *  this.grad[i][0] + this.grad[i][1] * this.grad[i][1]);
			this.grad[i][0] /= dist;
			this.grad[i][1] /= dist;
		}
	},
	noise: function(x, y, size, permMod8, smooth) {
		var bx0, bx1, by0, by1, b00, b01, b10, b11, rx0, rx1, ry0, ry1, sx, sy, a, b, t, u, v, i, j;
		bx0 = Math.floor(x) % size;
		bx1 = (bx0 + 1) % size;
		rx0 = x - Math.floor(x);
		rx1 = rx0 - 1;
		by0 = Math.floor(y) % size;
		by1 = (by0 + 1) % size;
		ry0 = y - Math.floor(y);
		ry1 = ry0 - 1;
		i = perm[bx0];
		j = perm[bx1];
		b00 = perm[i + by0];
		b10 = perm[j + by0];
		b01 = perm[i + by1];
		b11 = perm[j + by1];
		
		sx = smooth(rx0);
		sy = smooth(ry0);
		
		u = rx0 * this.grad[b00][0] + ry0 * this.grad[b00][1];
		v = rx1 * this.grad[b10][0] + ry0 * this.grad[b10][1];
		a = interpolate(sx, u, v);
		
		u = rx0 * this.grad[b01][0] + ry1 * this.grad[b01][1];
		v = rx1 * this.grad[b11][0] + ry1 * this.grad[b11][1];
		b = interpolate(sx, u, v);
		
		return .5 * (1 + interpolate(sy, a, b));
	}
};

const perlin_improved = {
	grad: [
		[1, 1],
		[-1, 1],
		[1, -1],
		[-1, -1],
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1]
	],
	init: function() {},
	noise: function(x, y, size, permMod8, smooth) {
		var bx0, bx1, by0, by1, b00, b01, b10, b11, rx0, rx1, ry0, ry1, sx, sy, a, b, t, u, v, i, j;
		bx0 = Math.floor(x) % size;
		bx1 = (bx0 + 1) % size;
		rx0 = x - Math.floor(x);
		rx1 = rx0 - 1;
		by0 = Math.floor(y) % size;
		by1 = (by0 + 1) % size;
		ry0 = y - Math.floor(y);
		ry1 = ry0 - 1;
		i = perm[bx0];
		j = perm[bx1];
		b00 = permMod8[i + by0];
		b10 = permMod8[j + by0];
		b01 = permMod8[i + by1];
		b11 = permMod8[j + by1];
		
		sx = smooth(rx0);
		sy = smooth(ry0);
		
		u = rx0 * this.grad[b00][0] + ry0 * this.grad[b00][1];
		v = rx1 * this.grad[b10][0] + ry0 * this.grad[b10][1];
		a = interpolate(sx, u, v);
		
		u = rx0 * this.grad[b01][0] + ry1 * this.grad[b01][1];
		v = rx1 * this.grad[b11][0] + ry1 * this.grad[b11][1];
		b = interpolate(sx, u, v);
		
		return .5 * (1 + interpolate(sy, a, b));
	}
};

window.addEventListener('load', async () => {
  console.log('----start')

	//Math.seedrandom('noise');

  var canvasSize = 500;

  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  canvas.width = canvasSize;
  canvas.height = canvasSize;
  var imageData =  context.createImageData(canvas.width, canvas.height);
  var scale = 70; //zoom taille des irregularités
  var size = 41;
  var colorGroups = [[0,1,2]] ;
  var octaves = 1;
  var lacunarity = 2;
  var persistence = 0.19;
  var octaveFunction = null;
  var sumFunction = null;
	//var noiseFunctions = perlin_improved;
	//var noiseFunctions = perlin_classic;
	//var noiseFunctions = simplex;
	var noiseFunctions = value;
	

  var relativeScale = Math.pow(imageData.width, -scale / 100);
  var smooth = smoothingFunctions.cosine;
  //var smooth = smoothingFunctions.none;


	for(var y = 0; y < imageData.height; y++) {
		for(var x = 0; x < imageData.width; x++) {
			var pixelIndex = (y * imageData.width * 4) + x * 4;
			imageData.data[pixelIndex + 3] = 255;
		}
  }
  
  var values = [];
	var min = Number.MAX_VALUE;
	var max = Number.MIN_VALUE;
  for(var i = 0; i < colorGroups.length; i++) {
		var permMod8 = generatePermutationTable(size);
		noiseFunctions.init(size);
		for(var y = 0; y < imageData.height; y++) {
			if(i == 0) values[y] = [];
			
			for(var x = 0; x < imageData.width; x++) {
				if(i == 0) values[y][x] = [];
				
				var scaledX = parseFloat(x) * relativeScale;
				var scaledY = parseFloat(y) * relativeScale;
				
				var noise = 0;
        var amplitude = 1; 
        var frequency = 1;
				
				for(var o = 0; o < octaves; o++) {
					var octave = noiseFunctions.noise(scaledX * frequency, scaledY * frequency, size, permMod8, smooth);
					if(octaveFunction) octave = octaveFunction(octave, scaledX, scaledY, o + 1);
					octave *= amplitude;
					noise += octave;
					frequency *= lacunarity;
					amplitude *= persistence;
				}
				
				values[y][x][i] = noise;
				min = Math.min(min, noise);
				max = Math.max(max, noise);
			}
		}
  }
  
  var noiseSpan = max - min;
  for(var y = 0; y < imageData.height; y++) {
		for(var x = 0; x < imageData.width; x++) {
			var scaledX = parseFloat(x) * relativeScale;
			var scaledY = parseFloat(y) * relativeScale;

			for(var i = 0; i < colorGroups.length; i++) {
				values[y][x][i] = (values[y][x][i] - min) / noiseSpan;
				
				if(sumFunction) values[y][x][i] = sumFunction(values[y][x][i], scaledX, scaledY);
			}
			
			var pixelIndex = (y * imageData.width * 4) + x * 4;
			
			for(var i = 0; i < colorGroups.length; i++) {
				var color = Math.round(values[y][x][i] * 255);
				
				for(var j = 0; j < colorGroups[i].length; j++) {
					imageData.data[pixelIndex + colorGroups[i][j]] = color;
				}
			}
		}
  }

  values = null;
  context.putImageData(imageData, 0, 0);

});

