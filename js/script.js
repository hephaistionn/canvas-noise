// randomness
let _seed = 1010;
function random() {
	_seed ^= _seed << 13;
	_seed ^= _seed >> 17;
	_seed ^= _seed >> 5;
	_seed = (_seed < 0) ? ~_seed + 1 : _seed;
	return _seed / 2147483647;
}


function generatePermutationTable(size) {
	perm = [];
	permMod8 = [];

	let i, j, k;
	for (i = 0; i < size; i++) {
		perm[i] = i;
	}

	while (--i) {
		j = Math.floor(random() * size);
		k = perm[i];
		perm[i] = perm[j];
		perm[j] = k;
	}

	for (i = 0; i < size; i++) {
		perm[i + size] = perm[i];
		permMod8[i] = permMod8[i + size] = perm[i] % 8;
	}

	return permMod8;
}

const octaveFunctions = {
	absolute: function (octave) {
		return Math.abs((octave * 2) - 1);
	}
};


const smoothingFunctions = {
	none: function (t) {
		return t;
	},
	cosine: function (t) {
		return .5 * (1 + Math.cos((1 - t) * Math.PI))
	},
	hermite: function (t) {
		return t * t * (-t * 2 + 3);
	},
	quintic: function (t) {
		return t * t * t * (t * (t * 6 - 15) + 10);
	}
};

function interpolate(t, a, b) {
	return a + t * (b - a);
}


const noiseFunctions = {
	value: {
		values: null,
		init: function (size) {
			this.values = [];
			for (let i = 0; i < size; i++) {
				this.values[i] = this.values[i + size] = random();
			}
		},
		noise: function (x, y, size, permMod8, smooth) {
			const x0 = Math.floor(x) % size;
			const y0 = Math.floor(y) % size;
			const x1 = (x0 + 1) % size;
			const y1 = (y0 + 1) % size;
			const vx = x - Math.floor(x);
			const vy = y - Math.floor(y);
			const sx = smooth(vx);
			const sy = smooth(vy);
			const i = perm[x0];
			const j = perm[x1];
			const p00 = perm[i + y0];
			const p10 = perm[j + y0];
			const p01 = perm[i + y1];
			const p11 = perm[j + y1];
			const i1 = interpolate(sx, this.values[p00], this.values[p10]);
			const i2 = interpolate(sx, this.values[p01], this.values[p11]);
			return interpolate(sy, i1, i2);
		}
	},
	simplex: {
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
		init: function () { },
		noise: function (x, y, size, permMod8, smooth) {
			let n0, n1, n2, s, i, j, t, X0, Y0, x0, y0, i1, j1, x1, x2, y1, y2, ii, jj, gi0, gi1, gi2, t0, t1, t2;

			s = (x + y) * this.F;
			i = Math.floor(x + s);
			j = Math.floor(y + s);
			t = (i + j) * this.G;
			X0 = i - t;
			Y0 = j - t;
			x0 = x - X0;
			y0 = y - Y0;

			if (x0 > y0) {
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
			if (t0 < 0) n0 = 0;
			else {
				t0 *= t0;
				n0 = t0 * t0 * (this.grad[gi0][0] * x0 + this.grad[gi0][1] * y0);
			}

			t1 = .5 - x1 * x1 - y1 * y1;
			if (t1 < 0) n1 = 0;
			else {
				t1 *= t1;
				n1 = t1 * t1 * (this.grad[gi1][0] * x1 + this.grad[gi1][1] * y1);
			}

			t2 = .5 - x2 * x2 - y2 * y2;
			if (t2 < 0) n2 = 0;
			else {
				t2 *= t2;
				n2 = t2 * t2 * (this.grad[gi2][0] * x2 + this.grad[gi2][1] * y2);
			}

			return .5 + 35 * (n0 + n1 + n2);
		}
	},
	perlin_classic: {
		grad: null,
		init: function (size) {
			let dist;

			this.grad = [];
			for (let i = 0; i < size; i++) {
				this.grad[i] = [(random() * 2) - 1, (random() * 2) - 1];
				dist = Math.sqrt(this.grad[i][0] * this.grad[i][0] + this.grad[i][1] * this.grad[i][1]);
				this.grad[i][0] /= dist;
				this.grad[i][1] /= dist;
			}
		},
		noise: function (x, y, size, permMod8, smooth) {
			let bx0, bx1, by0, by1, b00, b01, b10, b11, rx0, rx1, ry0, ry1, sx, sy, a, b, t, u, v, i, j;
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
	},
	perlin_improved: {
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
		init: function () { },
		noise: function (x, y, size, permMod8, smooth) {
			let bx0, bx1, by0, by1, b00, b01, b10, b11, rx0, rx1, ry0, ry1, sx, sy, a, b, t, u, v, i, j;
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
	}
};


function noiseGenerator(arraySize, scale, size, octaves, lacunarity, persistence, seed, smoothFunctionsName, noiseFunctionsName, octaveFunctionName) {
	_seed = seed;
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	canvas.width = arraySize;
	canvas.height = arraySize;
	const imageData = context.createImageData(canvas.width, canvas.height);
	const noiseFunction = noiseFunctions[noiseFunctionsName];
	const octaveFunction = octaveFunctions[octaveFunctionName] || null;
	const relativeScale = Math.pow(imageData.width, -scale / 100);
	const smooth = smoothingFunctions[smoothFunctionsName] || smoothingFunctions.none;

	const values = [];
	let min = 100;
	let max = -100;

	const permMod8 = generatePermutationTable(size);
	noiseFunction.init(size);
	for (let y = 0; y < imageData.height; y++) {
		values[y] = [];
		for (let x = 0; x < imageData.width; x++) {

			const scaledX = parseFloat(x) * relativeScale;
			const scaledY = parseFloat(y) * relativeScale;

			let noise = 0;
			let amplitude = 1;
			let frequency = 1;

			for (let o = 0; o < octaves; o++) {
				let octave = noiseFunction.noise(scaledX * frequency, scaledY * frequency, size, permMod8, smooth);
				if (octaveFunction) octave = octaveFunction(octave, scaledX, scaledY, o + 1);
				octave *= amplitude;
				noise += octave;
				frequency *= lacunarity;
				amplitude *= persistence;
			}

			values[y][x] = noise;
			min = Math.min(min, noise);
			max = Math.max(max, noise);
		}
	}

	////////////////////////OPTIONAL DRAWING/////////////////////////////
	const noiseSpan = max - min;
	for (let y = 0; y < imageData.height; y++) {
		for (let x = 0; x < imageData.width; x++) {
			values[y][x] = (values[y][x] - min) / noiseSpan;
			const pixelIndex = (y * imageData.width * 4) + x * 4;
			const color = Math.round(values[y][x] * 255);
			imageData.data[pixelIndex + 0] = color;
			imageData.data[pixelIndex + 1] = color;
			imageData.data[pixelIndex + 2] = color;
			imageData.data[pixelIndex + 3] = 255;
		}
	}
	context.putImageData(imageData, 0, 0);
	document.body.appendChild(canvas);
	//////////////////////////////////////////////////////////////////////

	return values;
}

window.addEventListener('load', async () => {
	const arraySize = 500;
	const scale = 70;
	const size = 41;
	const octaves = 1;
	const lacunarity = 2;
	const persistence = 0.19;
	const octaveFunction = null;
	const noiseFunction = 'perlin_classic'; //perlin_classic perlin_improved simplex value
	const smoothFunction = 'cosine'; //none cosine
	const seed = 1445454;

	const values = noiseGenerator(arraySize, scale, size, octaves, lacunarity, persistence, seed, smoothFunction, noiseFunction, octaveFunction);

	console.log(values);
});

