var Octree, OctreeNode;

Octree = (function() {
  Octree.branching = 8;

  Octree.dimensions = 3;

  function Octree(maxBits) {
    var _i, _ref, _results;
    this.maxBits = maxBits != null ? maxBits : 8;
    this.leafCount = 0;
    this.numVectors = 0;
    this.reducibleNodes = new Array(this.maxBits + 1);
    this.levelMasks = (function() {
      _results = [];
      for (var _i = _ref = this.maxBits - 1; _ref <= 0 ? _i <= 0 : _i >= 0; _ref <= 0 ? _i++ : _i--){ _results.push(_i); }
      return _results;
    }).apply(this).map(function(bit) {
      return Math.pow(2, bit);
    });
    this.root = new OctreeNode(this);
  }

  Octree.prototype.isVectorEqual = function(v1, v2) {
    var i, _i, _ref;
    if ((v1 == null) || (v2 == null)) {
      return false;
    }
    for (i = _i = 0, _ref = Octree.dimensions; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      if (v1[i] !== v2[i]) {
        return false;
      }
    }
    return true;
  };

  Octree.prototype.insertVector = function(newVect) {
    if ((this.prevNode != null) && (this.isVectorEqual(newVect, this.prevVect))) {
      this.prevNode.insertVector(newVect, this);
    } else {
      this.prevVect = newVect;
      this.prevNode = this.root.insertVector(newVect, this);
    }
    return this.numVectors++;
  };

  Octree.prototype.reduce = function() {
    var levelIndex, node;
    levelIndex = this.maxBits - 1;
    while (levelIndex > 0 && (this.reducibleNodes[levelIndex] == null)) {
      levelIndex--;
    }
    node = this.reducibleNodes[levelIndex];
    this.reducibleNodes[levelIndex] = node.nextReducible;
    this.leafCount -= node.reduce();
    return this.prevNode = null;
  };

  Octree.prototype.reduceToSize = function(itemCount) {
    while (this.leafCount > itemCount) {
      this.reduce();
    }
    return this.root.getData();
  };

  return Octree;

})();

OctreeNode = (function() {
  function OctreeNode(octree, level) {
    var i;
    if (level == null) {
      level = 0;
    }
    this.isLeaf = level === octree.maxBits;
    this.mean = (function() {
      var _i, _ref, _results;
      _results = [];
      for (i = _i = 0, _ref = Octree.dimensions; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        _results.push(0);
      }
      return _results;
    })();
    this.count = 0;
    if (this.isLeaf) {
      octree.leafCount++;
      this.nextReducible = null;
      this.children = null;
    } else {
      this.nextReducible = octree.reducibleNodes[level];
      octree.reducibleNodes[level] = this;
      this.children = new Array(Octree.branching);
    }
  }

  OctreeNode.prototype.insertVector = function(v, octree, level) {
    var child, i, index, _i, _ref;
    if (level == null) {
      level = 0;
    }
    if (this.isLeaf) {
      this.count++;
      for (i = _i = 0, _ref = Octree.dimensions; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if ((this.mean[i] == null) || this.count === 1) {
          this.mean[i] = v[i];
        } else {
          this.mean[i] = (this.mean[i] * (this.count - 1) + v[i]) / this.count;
        }
      }
      return this;
    } else {
      index = this.getIndex(v, level, octree);
      child = this.children[index];
      if (child == null) {
        child = new OctreeNode(octree, level + 1);
        this.children[index] = child;
      }
      return child.insertVector(v, octree, level + 1);
    }
  };

  OctreeNode.prototype.getIndex = function(v, level, octree) {
    var i, index, reverseIndex, shift, _i, _ref;
    shift = octree.maxBits - 1 - level;
    index = 0;
    for (i = _i = 0, _ref = Octree.dimensions; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
      reverseIndex = Octree.dimensions - 1 - i;
      index |= (v[i] & octree.levelMasks[level]) >> (shift - reverseIndex);
    }
    return index;
  };

  OctreeNode.prototype.reduce = function() {
    var child, childIndex, childSum, i, newCount, nodeSum, numChildren, _i, _j, _ref, _ref1;
    if (this.isLeaf) {
      return 0;
    }
    numChildren = 0;
    for (childIndex = _i = 0, _ref = Octree.branching; 0 <= _ref ? _i < _ref : _i > _ref; childIndex = 0 <= _ref ? ++_i : --_i) {
      child = this.children[childIndex];
      if (child != null) {
        newCount = this.count + child.count;
        for (i = _j = 0, _ref1 = Octree.dimensions; 0 <= _ref1 ? _j < _ref1 : _j > _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
          nodeSum = this.mean[i] * this.count;
          childSum = child.mean[i] * child.count;
          this.mean[i] = (nodeSum + childSum) / newCount;
        }
        this.count = newCount;
        numChildren++;
        this.children[childIndex] = null;
      }
    }
    this.isLeaf = true;
    return numChildren - 1;
  };

  OctreeNode.prototype.getData = function(data, index) {
    var i, _i, _ref;
    if (data == null) {
      data = this.getData([], 0);
    } else if (this.isLeaf) {
      data.push([this.mean, this.count]);
    } else {
      for (i = _i = 0, _ref = Octree.branching; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
        if (this.children[i] != null) {
          data = this.children[i].getData(data, index);
        }
      }
    }
    return data;
  };

  return OctreeNode;

})();