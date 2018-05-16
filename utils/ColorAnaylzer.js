var ColorAnalyser;

ColorAnalyser = (function() {
  function ColorAnalyser(img, canvas, maxColorBits) {
    if (maxColorBits == null) {
      maxColorBits = 8;
    }
    this.octree = new Octree(maxColorBits);
    this.loadCanvas(img, canvas);
  }

  ColorAnalyser.prototype.loadCanvas = function(img, canvas) {
    var context;
    context = canvas.getContext('2d');
    this.imgWidth = img.width;
    this.imgHeight = img.height;
    canvas.width = this.imgWidth;
    canvas.height = this.imgHeight;
    context.drawImage(img, 0, 0);
    return this.imageData = context.getImageData(0, 0, this.imgWidth, this.imgHeight);
  };

  ColorAnalyser.prototype.getPixel = function(x, y, channels) {
    var channel, idx, _i, _results;
    if (channels == null) {
      channels = 3;
    }
    idx = (y * this.imgWidth + x) * 4;
    _results = [];
    for (channel = _i = 0; 0 <= channels ? _i < channels : _i > channels; channel = 0 <= channels ? ++_i : --_i) {
      _results.push(this.imageData.data[idx + channel]);
    }
    return _results;
  };

  ColorAnalyser.prototype.detectBackground = function() {
    var bgColor, border, bottom, color, colorFreqs, freq, left, mostFrequent, right, top, x, y, _i, _len;
    top = (function() {
      var _i, _ref, _results;
      _results = [];
      for (x = _i = 0, _ref = this.imgWidth; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.getPixel(x, 0));
      }
      return _results;
    }).call(this);
    bottom = (function() {
      var _i, _ref, _results;
      _results = [];
      for (x = _i = 0, _ref = this.imgWidth; 0 <= _ref ? _i < _ref : _i > _ref; x = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.getPixel(x, this.imgHeight - 1));
      }
      return _results;
    }).call(this);
    left = (function() {
      var _i, _ref, _results;
      _results = [];
      for (y = _i = 0, _ref = this.imgHeight; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.getPixel(0, y));
      }
      return _results;
    }).call(this);
    right = (function() {
      var _i, _ref, _results;
      _results = [];
      for (y = _i = 0, _ref = this.imgHeight; 0 <= _ref ? _i < _ref : _i > _ref; y = 0 <= _ref ? ++_i : --_i) {
        _results.push(this.getPixel(this.imgWidth - 1, y));
      }
      return _results;
    }).call(this);
    border = ((top.concat(bottom)).concat(left)).concat(right);
    colorFreqs = {};
    for (_i = 0, _len = border.length; _i < _len; _i++) {
      color = border[_i];
      if (colorFreqs[color.toString()] != null) {
        colorFreqs[color.toString()]++;
      } else {
        colorFreqs[color.toString()] = 1;
      }
    }
    bgColor = top[0];
    mostFrequent = 0;
    for (color in colorFreqs) {
      freq = colorFreqs[color];
      if (freq > mostFrequent) {
        bgColor = color.split(',').map(function(x) {
          return parseInt(x);
        });
        mostFrequent = freq;
      }
    }
    return bgColor;
  };

  ColorAnalyser.prototype.rgbToHsl = function(r, g, b) {
    var d, h, l, max, min, s;
    r /= 255;
    g /= 255;
    b /= 255;
    max = Math.max(r, g, b);
    min = Math.min(r, g, b);
    l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
      }
      h /= 6;
    }
    return [h, s, l];
  };

  ColorAnalyser.prototype.hslToRgb = function(h, s, l) {
    var b, g, hue2rgb, p, q, r;
    if (s === 0) {
      r = g = b = l;
    } else {
      hue2rgb = function(p, q, t) {
        if (t < 0) {
          t += 1;
        }
        if (t > 1) {
          t -= 1;
        }
        if (t < 1 / 6) {
          return p + (q - p) * 6 * t;
        }
        if (t < 1 / 2) {
          return q;
        }
        if (t < 2 / 3) {
          return p + (q - p) * (2 / 3 - t) * 6;
        }
        return p;
      };
      q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return [r * 255, g * 255, b * 255];
  };

  ColorAnalyser.prototype.chooseTextColor = function(backgroundColor, palette) {
    var b, color, count, g, h, l, lerp, mB, mG, mH, mL, mR, mS, modeColor, modeCount, r, rgb, s, _i, _len, _ref, _ref1, _ref2, _ref3;
    if (palette == null) {
      palette = null;
    }
    r = backgroundColor[0], g = backgroundColor[1], b = backgroundColor[2];
    _ref = this.rgbToHsl(r, g, b), h = _ref[0], s = _ref[1], l = _ref[2];
    h += 0.5;
    if (h > 1) {
      h -= 1;
    }
    s = (1 - s) * 0.25;
    l = 1 - l;
    if (l < 0.5) {
      l = -l + 0.5;
    } else if (l > 0.5) {
      l = -l + 1.5;
    } else {
      l = 1;
    }
    if (palette != null) {
      lerp = function(t, from, to) {
        return t * to + (1 - t) * from;
      };
      _ref1 = palette[0], modeColor = _ref1[0], modeCount = _ref1[1];
      for (_i = 0, _len = palette.length; _i < _len; _i++) {
        _ref2 = palette[_i], color = _ref2[0], count = _ref2[1];
        if (count > modeCount) {
          modeCount = count;
          modeColor = color;
        }
      }
      mR = modeColor[0], mG = modeColor[1], mB = modeColor[2];
      _ref3 = this.rgbToHsl(mR, mG, mB), mH = _ref3[0], mS = _ref3[1], mL = _ref3[2];
      s = Math.min(s, mS);
      h = lerp(0.75, h, mH);
    }
    rgb = (this.hslToRgb(h, s, l)).map(Math.floor);
    return rgb;
  };

  ColorAnalyser.prototype.analyseImage = function(paletteSize, background, ignoreGrey) {
    var numVectors, palette, _ref;
    if (background == null) {
      background = null;
    }
    if (ignoreGrey == null) {
      ignoreGrey = false;
    }
    if (background == null) {
      background = this.detectBackground();
    }
    _ref = this.getClusteredPalette(paletteSize, 1, 1024, background, 32, ignoreGrey), palette = _ref[0], numVectors = _ref[1];
    return [palette, numVectors];
  };

  ColorAnalyser.prototype.getClusteredPalette = function(numClusters, threshold, paletteSize, exclude, error, ignoreGrey) {
    var cluster, clusterer, clusters, colors, numVectors, palette, _ref;
    _ref = this.getThresholdedPalette(threshold, paletteSize, exclude, error, ignoreGrey), palette = _ref[0], numVectors = _ref[1];
    clusterer = new KMeans(numClusters, 3);
    clusterer.setPoints(palette);
    clusters = clusterer.performCluster();
    colors = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = clusters.length; _i < _len; _i++) {
        cluster = clusters[_i];
        _results.push([cluster.getMean(), cluster.size]);
      }
      return _results;
    })();
    return [colors, numVectors];
  };

  ColorAnalyser.prototype.getThresholdedPalette = function(threshold, paletteSize, exclude, error, ignoreGrey) {
    var color, colors, newColors, numVectors, sum, _i, _len, _ref;
    _ref = this.getPalette(paletteSize, exclude, error, ignoreGrey), colors = _ref[0], numVectors = _ref[1];
    colors.sort(function(a, b) {
      return b[1] - a[1];
    });
    newColors = [];
    sum = 0;
    for (_i = 0, _len = colors.length; _i < _len; _i++) {
      color = colors[_i];
      newColors.push(color);
      sum += color[1];
      if (sum > (numVectors * threshold)) {
        break;
      }
    }
    return [newColors, numVectors];
  };

  ColorAnalyser.prototype.getFilteredPalette = function(stdDeviations, paletteSize, exclude, error, ignoreGrey) {
    var color, colors, filteredColors, freq, freqSum, i, meanDiff, meanFrequency, numColors, numVectors, stdDevFrequency, stdDevSum, _i, _j, _ref, _ref1, _ref2, _ref3, _ref4;
    _ref = this.getPalette(paletteSize, exclude, error, ignoreGrey), colors = _ref[0], numVectors = _ref[1];
    numColors = 0;
    freqSum = 0;
    for (i = _i = 0, _ref1 = colors.length; 0 <= _ref1 ? _i < _ref1 : _i > _ref1; i = 0 <= _ref1 ? ++_i : --_i) {
      _ref2 = colors[i], color = _ref2[0], freq = _ref2[1];
      freqSum += freq;
      numColors++;
    }
    meanFrequency = freqSum / numColors;
    stdDevSum = 0;
    for (i = _j = 0, _ref3 = colors.length; 0 <= _ref3 ? _j < _ref3 : _j > _ref3; i = 0 <= _ref3 ? ++_j : --_j) {
      _ref4 = colors[i], color = _ref4[0], freq = _ref4[1];
      meanDiff = freq - meanFrequency;
      stdDevSum += meanDiff * meanDiff;
    }
    stdDevFrequency = Math.sqrt(stdDevSum / numColors);
    filteredColors = (function() {
      var _k, _len, _ref5, _results;
      _results = [];
      for (_k = 0, _len = colors.length; _k < _len; _k++) {
        _ref5 = colors[_k], color = _ref5[0], freq = _ref5[1];
        if (Math.abs(freq - meanFrequency) < (stdDevFrequency * stdDeviations)) {
          _results.push([color, freq]);
        }
      }
      return _results;
    })();
    return [filteredColors, numVectors];
  };

  ColorAnalyser.prototype.getPalette = function(paletteSize, exclude, error, ignoreGrey) {
    var a, b, bIsWithinError, eb, eg, er, excludeGrey, g, gIsWithinError, gb, i, isExcluded, numVectors, pixelData, r, rIsWithinError, rb, rg, _i, _ref;
    if (error == null) {
      error = 0;
    }
    pixelData = this.imageData.data;
    for (i = _i = 0, _ref = pixelData.length; _i < _ref; i = _i += 4) {
      r = pixelData[i];
      g = pixelData[i + 1];
      b = pixelData[i + 2];
      a = pixelData[i + 3];
      isExcluded = false;
      if (exclude != null) {
        er = exclude[0], eg = exclude[1], eb = exclude[2];
        rIsWithinError = ((er - error) < r && r < (er + error));
        gIsWithinError = ((eg - error) < g && g < (eg + error));
        bIsWithinError = ((eb - error) < b && b < (eb + error));
        isExcluded = rIsWithinError && gIsWithinError && bIsWithinError;
      }
      excludeGrey = false;
      if (ignoreGrey) {
        rg = Math.abs(r - g) < error;
        rb = Math.abs(r - b) < error;
        gb = Math.abs(g - b) < error;
        excludeGrey = ignoreGrey && rg && rb && gb;
        isExcluded = isExcluded || excludeGrey;
      }
      if (!isExcluded) {
        this.octree.insertVector([r, g, b]);
      }
    }
    numVectors = this.octree.numVectors;
    return [this.octree.reduceToSize(paletteSize), numVectors];
  };

  return ColorAnalyser;

})();