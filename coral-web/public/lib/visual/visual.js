function Visual(options) {
  'use strict';

  var def = Object.defineProperty;
  var slice = [].slice;
  var hasOwnProperty = Object.prototype.hasOwnProperty;


  if (!options.getBlock) {
    options.getBlock = function(name, hint) {
      var b = options.blocks[name];
      if (b) return b.slice(0, 2).concat(name, b.slice(2));
      if (!hint) hint = {};
      if (!hint.name) hint.name = name;
      return obsoleteBlock(hint);
    };
  }
  if (!options.getCategory) {
    options.getCategory = function(name) {
      var cat = options.categories[name];
      return cat ? [name].concat(cat) : [undefined, 'Undefined', '#d42828'];
    };
  }
  if (!options.getMenu) {
    options.getMenu = function(arg) {
      var m = options.menus[arg.menu];
      return m ? m(arg) : null;
    };
    if (!options.menus) options.menus = {};
  }
  if (!options.getText) {
    options.getText = function(key) {
      var translation = options.strings[key];
      return translation == null ? key : translation;
    };
    if (!options.strings) options.strings = {};
  }
  if (options.animationTime == null) options.animationTime = 0.3;


  function obsoleteBlock(hint) {
    var args = hint && hint.argTypes ? hint.argTypes.map(function(t) {return ' %' + t}).join('') : '';
    return [hint && hint.type || 'c', 'obsolete'+(hint.name ? ' '+hint.name : '')+args, undefined, undefined];
  }


  function format(string, values) {
    return string.replace(/\{([\w_]*)\}/g, function(t, name) {
      return values[name];
    });
  }

  function el(tagName, className) {
    var d = document.createElement(className ? tagName : 'div');
    d.className = className || tagName || '';
    return d;
  }

  function setValue(value) {
    this.value = value;
  }

  function redraw() {
    if (this.workspace) {
      this.graphicsDirty = false;
      this.draw();
    } else {
      this.graphicsDirty = true;
    }
  }

  function getEl(o) {
    return o.el;
  }

  function toJSON(o) {
    return o.toJSON();
  }

  function layoutChildren(o) {
    o.layoutChildren();
  }

  function drawChildren(o) {
    o.drawChildren();
  }

  function copy(o) {
    return o.copy();
  }

  function resize(o) {
    if (o.resize) o.resize();
  }


  function eventEmitter(c) {
    c.prototype.dispatch = dispatch;
    c.prototype.on = addListener;
    c.prototype.once = addListenerOnce;
    c.prototype.removeListener = removeListener;
    c.prototype.removeAllListeners = removeAllListeners;
  }

  function dispatch(event, object) {
    if (!object) object = {};
    object.type = event;
    if (!this.listeners) return this;
    var listeners = this.listeners[event];
    if (!listeners || !listeners.length) return this;
    for (var i = listeners.length; i--;) {
      var l = listeners[i];
      l.fn.call(l.context);
      if (l.transient) listeners.splice(i, 1);
    }
    return this;
  }

  function addListener(event, fn, context) {
    if (!this.listeners) this.listeners = {};
    var listener = {fn: fn, context: context};
    var l = this.listeners[event];
    if (l) {
      l.push(listener);
    } else {
      this.listeners[event] = [listener];
    }
    return this;
  }

  function addListenerOnce(event, fn, context) {
    if (!this.listeners) this.listeners = {};
    var listener = {fn: fn, context: context, transient: true};
    var l = this.listeners[event];
    if (l) {
      l.push(listener);
    } else {
      this.listeners[event] = [listener];
    }
    return this;
  }

  function removeListener(event, fn) {
    if (!this.listeners) return this;
    var l = this.listeners[event];
    if (!l) return this;
    for (var i = l.length; i--;) {
      if (l[i].fn === fn) {
        l.splice(i, 1);
        return this;
      }
    }
    return this;
  }

  function removeAllListeners(event) {
    if (!this.listeners) return this;
    this.listeners[event] = null;
    return this;
  }


  function layout() {
    if (!this.parent) return;

    this.layoutSelf();
    this.parent.layout();
  }

  function layoutNoChildren() {
    if (this.dirty) {
      this.dirty = false;
      this.layoutSelf();
    }
  }

  function drawNoChildren() {
    if (this.graphicsDirty) {
      this.graphicsDirty = false;
      this.draw();
    }
  }

  function opaqueObjectFromPoint(x, y) {
    return containsPoint(this, x, y) ? this : null;
  }

  function moveTo(x, y) {
    if (this.x === x && this.y === y) return;
    this.x = x;
    this.y = y;
    setTransform(this.el, 'translate('+(x|0)+'px,'+(y|0)+'px)');
    return this;
  }

  function scaledMoveTo(x, y) {
    if (this.x === x && this.y === y && this.__scale == this._scale) return;
    this.x = x;
    this.y = y;
    this.__scale = this._scale;
    setTransform(this.el, 'translate('+(x * this._scale | 0)+'px,'+(y * this._scale | 0)+'px)');
    return this;
  }

  function slideTo(x, y, time, callback, context) {
    if (typeof time === 'function') {
      context = callback;
      callback = time;
      time = options.animationTime;
    }
    if (this.x === x && this.y === y) {
      if (callback) setTimeout(callback.bind(context));
      return this;
    }
    setTransition(this.el, 'all '+time+'s ease');
    this.el.offsetHeight;
    moveTo.call(this, x, y);
    var self = this;
    setTimeout(function() {
      setTransition(self.el, '');
      if (callback) callback.call(context);
    }, time * 1000);
    return this;
  }

  function scaledSlideTo(x, y, time, callback, context) {
    if (typeof time === 'function') {
      context = callback;
      callback = time;
      time = options.animationTime;
    }
    if (this.x === x && this.y === y) {
      if (callback) setTimeout(callback.bind(context));
      return this;
    }
    setTransition(this.el, 'all '+time+'s ease');
    this.el.offsetHeight;
    scaledMoveTo.call(this, x, y);
    var self = this;
    setTimeout(function() {
      setTransition(self.el, '');
      if (callback) callback.call(context);
    }, time * 1000);
    return this;
  }

  function getWorkspace() {
    var o = this;
    while (o && !o.isWorkspace) {
      o = o.parent;
    }
    return o;
  }

  function getApp() {
    var o = this;
    while (o && !o.isApp) {
      o = o.parent;
    }
    return o;
  }

  function getTopScript() {
    var o = this;
    while (o.parent) {
      if (o.parent.isWorkspace) return o;
      o = o.parent;
    }
    return null;
  }

  function getWorkspacePosition() {
    var o = this;
    var x = 0;
    var y = 0;
    while (o && !o.isWorkspace) {
      x += o.x;
      y += o.y;
      o = o.parent;
    }
    return {x: x, y: y};
  }

  function getWorldPosition() {
    var o = this;
    var x = 0;
    var y = 0;
    while (o && !o.isWorkspace) {
      x += o.x;
      y += o.y;
      o = o.parent;
    }
    if (o) {
      x *= o._scale;
      y *= o._scale;
      var bb = o.el.getBoundingClientRect();
      x += Math.round(bb.left);
      y += Math.round(bb.top);
      if (o.el !== document.body) {
        x -= o.scrollX;
        y -= o.scrollY;
      }
    }
    return {x: x, y: y};
  }

  function containsPoint(extent, x, y) {
    return x >= 0 && y >= 0 && x < extent.width && y < extent.height;
  }

  function opaqueAt(context, x, y) {
    return containsPoint(context.canvas, x, y) && context.getImageData(x, y, 1, 1).data[3] > 0;
  }

  function numberToColor(num) {
    var s = num.toString(16);
    return '#'+'000000'.slice(s.length)+s;
  }

  function colorToNumber(color) {
    return parseInt(color.slice(1), 16);
  }

  function randColor() {
    return Math.random() * 0x1000000 | 0;
  }

  function setTransform(el, transform) {
    el.style.WebkitTransform =
    el.style.MozTransform =
    el.style.msTransform =
    el.style.OTransform =
    el.style.transform = transform;
  }

  function setTransition(el, transition) {
    el.style.WebkitTransition =
    el.style.MozTransition =
    el.style.msTransition =
    el.style.OTransition =
    el.style.transition = transition;
  }

  function bezel(context, path, thisArg, inset, scale) {
    if (scale == null) scale = 1;
    var s = inset ? -1 : 1;
    var w = context.canvas.width;
    var h = context.canvas.height;

    context.beginPath();
    path.call(thisArg, context);
    context.fill();
    // context.clip();

    context.save();
    context.translate(-10000, -10000);
    context.beginPath();
    context.moveTo(-3, -3);
    context.lineTo(-3, h+3);
    context.lineTo(w+3, h+3);
    context.lineTo(w+3, -3);
    context.closePath();
    path.call(thisArg, context);

    context.globalCompositeOperation = 'source-atop';

    context.shadowOffsetX = (10000 + s * -1) * scale;
    context.shadowOffsetY = (10000 + s * -1) * scale;
    context.shadowBlur = 1.5 * scale;
    context.shadowColor = 'rgba(0, 0, 0, .4)';
    context.fill();

    context.shadowOffsetX = (10000 + s * 1) * scale;
    context.shadowOffsetY = (10000 + s * 1) * scale;
    context.shadowBlur = 1.5 * scale;
    context.shadowColor = 'rgba(255, 255, 255, .3)';
    context.fill();

    context.restore();
  }

  function createMetrics(className) {
    var field = el('Visual-metrics ' + className);
    var node = document.createTextNode('');
    field.appendChild(node);
    metricsContainer.appendChild(field);

    var stringCache = Object.create(null);

    return function measure(text) {
      if (hasOwnProperty.call(stringCache, text)) {
        return stringCache[text];
      }
      node.data = text + '\u200B';
      return stringCache[text] = {
        width: field.offsetWidth,
        height: field.offsetHeight
      };
    };
  }


  var metricsContainer = el('Visual-metrics-container');
  document.body.appendChild(metricsContainer);

  var scrollbarWidth = function() {
    var field = document.createElement('div');
    field.style.width = '200px';
    field.style.height = '100px';
    field.style.overflow = 'auto';
    field.style.opacity = 0;

    var content = document.createElement('div');
    content.style.width = '1px';
    content.style.height = '200px';

    field.appendChild(content);
    metricsContainer.appendChild(field);

    var w = field.offsetWidth - field.clientWidth;
    metricsContainer.removeChild(field);
    return w;
  }();


  function Block(info, args) {
    this.el = el('Visual-absolute');
    this.el.appendChild(this.canvas = el('canvas', 'Visual-absolute'));
    this.context = this.canvas.getContext('2d');

    if (typeof info === 'string') info = options.getBlock(info);

    if (!args) args = [];
    this.defaultArgs = info.slice(4);
    this.args = args.concat(this.defaultArgs.slice(args.length));

    this.name = info[2];
    this.type = info[0];
    this.infoSpec = info[1];
    this.spec = options.getText(this.infoSpec);
    this.category = info[3];
  }

  var PI12 = Math.PI * 1/2;
  var PI = Math.PI;
  var PI32 = Math.PI * 3/2;

  Block.prototype.isBlock = true;
  Block.prototype.isDraggable = true;

  Block.prototype.parent = null;
  Block.prototype._scale = 1;
  Block.prototype.dirty = true;
  Block.prototype.graphicsDirty = true;

  Block.prototype.radius = 3;
  Block.prototype.puzzle = 3;
  Block.prototype.puzzleWidth = 8;
  Block.prototype.puzzleInset = 13;
  Block.prototype.hatHeight = 13;
  Block.prototype.hatWidth = 80;

  Block.prototype.pathBlockType = {
    c: function(context) {
      this.pathCommandShape(context, true, true);
    },
    f: function(context) {
      this.pathCommandShape(context, false, true);
    },
    r: function(context) {
      var w = this.ownWidth;
      var h = this.ownHeight;
      var r = Math.min(w, (this.hasScript ? 15 : h)) / 2;

      context.moveTo(0, r);
      context.arc(r, r, r, PI, PI32, false);
      context.arc(w - r, r, r, PI32, 0, false);
      context.arc(w - r, h - r, r, 0, PI12, false);
      context.arc(r, h - r, r, PI12, PI, false);
    },
    b: function(context) {
      var w = this.ownWidth;
      var h = this.ownHeight;
      var r = Math.min(h, w) / 2;

      context.moveTo(0, r);
      context.lineTo(r, 0);
      context.lineTo(w - r, 0);
      context.lineTo(w, r);
      context.lineTo(w - r, h);
      context.lineTo(r, h);
    },
    h: function(context) {
      var r = this.radius;
      var w = this.ownWidth;
      var hh = this.hatHeight;
      var hp = this.paddingTop;
      var hw = this.hatWidth;
      context.moveTo(0, hh);
      context.quadraticCurveTo(.125*hw, .15*hh, hw/2, 0);
      context.quadraticCurveTo(.875*hw, .15*hh, hw, hh - hp);
      context.arc(w - r, hh - hp + r, r, PI32, 0, false);
      this.pathCommandShape(context, true, false);
    }
  };

  Block.prototype.pathCommandShape = function(context, bottom, top) {
    var r = this.radius;
    var p = this.puzzle;
    var pi = this.puzzleInset;
    var pw = this.puzzleWidth;
    var w = this.ownWidth;
    var h = this.ownHeight - bottom * p;
    if (top) {
      context.moveTo(0, r);
      context.lineTo(r, 0);
      context.lineTo(pi, 0);
      context.lineTo(pi + p, p);
      context.lineTo(pi + pw + p, p);
      context.lineTo(pi + pw + p * 2, 0);
      context.lineTo(w - r, 0);
      context.lineTo(w, r);
    }
    context.lineTo(w, h - r);
    context.lineTo(w - r, h);
    if (bottom) {
      context.lineTo(pi + pw + p * 2, h);
      context.lineTo(pi + pw + p, h + p);
      context.lineTo(pi + p, h + p);
      context.lineTo(pi, h);
    }
    context.lineTo(r, h);
    context.lineTo(0, h - r);
  };

  def(Block.prototype, 'spec', {
    get: function() {return this._spec},
    set: function(value) {
      this._spec = value;

      if (this.parts) {
        var i = this.parts.length;
        while (i--) {
          this.el.removeChild(this.parts[i].el);
          this.parts[i].parent = null;
        }
      }

      var args = this.args || [];
      this.inputs = [];
      this.args = [];
      this.labels = [];
      this.parts = [];
      this.hasScript = false;

      var parts = value.split(/(?:@(\w+)|%(\w+(?:\.\w+)?)|([^\s%@]+|[%@]))/g);
      var i = 0;
      for (;;) {
        i++;
        if (i >= parts.length) break;
        if (parts[i]) {
          this.add(new Icon(parts[i]));
        }
        i++;
        if (parts[i]) {
          var old = args[this.args.length];
          var arg = old && old.isArg ? old : new Arg(parts[i], old && old.isBlock ? this.defaultArgs[this.args.length] : old);
          this.inputs.push(arg);
          this.add(old && old.isBlock ? old : arg);
          if (arg._type === 't') {
            this.hasScript = true;
          }
        }
        i++;
        var text = parts[i];
        if (text && (text = text.trim())) {
          this.add(new Label(text));
        }
        i++;
      }
    }
  });

  def(Block.prototype, 'category', {
    get: function() {return this._category},
    set: function(value) {
      if (typeof value !== 'object') value = options.getCategory(value);
      this._category = value;
      this.color = value[2];
    }
  });

  def(Block.prototype, 'color', {
    get: function() {return this._color},
    set: function(value) {
      this._color = value;
      this.redraw();
    }
  });

  def(Block.prototype, 'type', {
    get: function() {return this._type},
    set: function(value) {
      this._type = value;
      this.pathFn = this.pathBlockType[value];

      this.isHat = value === 'h';
      this.hasPuzzle = value === 'c' || value === 'h';
      this.isFinal = value === 'f';
      this.isCommand = value === 'c' || value === 'f';
      this.isReporter = value === 'r' || value === 'b';
      this.isBoolean = value === 'b';

      var p = this.padding[value];
      this.paddingTop = p[0];
      this.paddingX = p[p[1] == null ? 0 : 1];
      this.paddingBottom = p[p[2] == null ? 0 : 2];

      this.layout();
    }
  });

  def(Block.prototype, 'state', {get: function() {
    if (!this.parent) return null;
    if (this.parent.isBlock) {
      return {
        block: this.parent,
        arg: this.parent.argIndex(this)
      };
    }
    if (this.parent.isScript) {
      if (this.parent.blocks[0] === this) {
        if (this.parent.parent && this.parent.parent.isWorkspace) {
          return {
            workspace: this.parent.parent,
            pos: this.parent.workspacePosition
          };
        }
        return {
          arg: this.parent.parent
        };
      }
      return {script: this.parent};
    }
    return null;
  }});

  Script.prototype.restore = function(state) {
    if (!state) return this;
    if (state.block) {
      state.block.replace(state.block.args[state.arg], this.blocks[0]);
    } else if (state.script) {
      state.script.add(this);
    } else if (state.workspace) {
      state.workspace.add(state.pos.x, state.pos.y, this);
    } else if (state.arg) {
      state.arg.value = this;
    }
    return this;
  };

  def(Block.prototype, 'app', {get: getApp});
  def(Block.prototype, 'workspace', {get: getWorkspace});
  def(Block.prototype, 'workspacePosition', {get: getWorkspacePosition});
  def(Block.prototype, 'worldPosition', {get: getWorldPosition});
  def(Block.prototype, 'topScript', {get: getTopScript});

  def(Block.prototype, 'contextMenu', {get: function() {
    if (this.workspace.isPalette) {
      return this.help && new Menu(['help', this.help]).translate().withContext(this);
    }
    var app = this.app;
    var pressX = app.pressX;
    var pressY = app.pressY;
    return new Menu(
      ['duplicate', function() {
        var pos = this.worldPosition;
        app.grab(this.scriptCopy(), pos.x - pressX, pos.y - pressY);
      }],
      Menu.line,
      this.help && ['help', this.help],
      'add comment',
      Menu.line,
      ['delete', this.destroy]).translate().withContext(this);
  }, configurable: true});

  def(Block.prototype, 'dragObject', {get: function() {
    if (this.workspace.isPalette) {
      var o = this;
      while (!o.parent.isWorkspace) {
        o = o.parent;
      }
      return o.blocks[0];
    }
    return this;
  }});

  Block.prototype.click = function() {};
  Block.prototype.help = null;

  Block.prototype.acceptsDropOf = function(b) {
    if (!this.parent || !this.parent.isBlock) return;
    var i = this.parent.argIndex(this);
    var def = this.parent.inputs[i];
    return def && def.acceptsDropOf(b);
  };

  Block.prototype.argIndex = function(a) {
    return this.args.indexOf(a);
  };

  Block.prototype.add = function(part) {
    if (part.parent) part.parent.remove(part);

    part.parent = this;
    part.setScale(this._scale);
    this.parts.push(part);

    if (part.isBlock || part.isArg) {
      this.args.push(part);
    } else {
      this.labels.push(part);
    }

    if (this.parent) part.layoutChildren();
    this.layout();

    this.el.appendChild(part.el);

    return this;
  };

  Block.prototype.replace = function(oldPart, newPart) {
    if (oldPart.parent !== this) return this;
    if (newPart.parent) newPart.parent.remove(newPart);

    oldPart.parent = null;
    newPart.setScale(this._scale);
    newPart.parent = this;

    var i = this.parts.indexOf(oldPart);
    this.parts.splice(i, 1, newPart);

    var array = oldPart.isArg || oldPart.isBlock ? this.args : this.labels;
    i = array.indexOf(oldPart);
    array.splice(i, 1, newPart);

    newPart.layoutChildren();
    this.layout();
    if (this.workspace) newPart.drawChildren();

    this.el.replaceChild(newPart.el, oldPart.el);

    return this;
  };

  Block.prototype.remove = function(part) {
    if (part.parent !== this) return this;

    part.parent = null;
    var i = this.parts.indexOf(part);
    this.parts.splice(i, 1);

    var array = part.isArg ? this.args : this.labels;
    i = array.indexOf(part);
    array.splice(i, 1);

    this.el.removeChild(part.el);

    return this;
  };

  Block.prototype.destroy = function() {
    if (!this.parent) return this;
    if (this.parent.isScript) {
      this.parent.remove(this);
    } else if (this.parent.isBlock) {
      this.parent.reset(this);
    }
    return this;
  };

  Block.prototype.reset = function(arg) {
    if (arg.parent !== this || !arg.isArg && !arg.isBlock) return this;

    var i = this.args.indexOf(arg);
    this.replace(arg, this.inputs[i]);

    return this;
  };

  Block.prototype.detach = function() {
    if (this.workspace.isPalette) {
      return this.scriptCopy();
    }
    if (this.parent.isBlock) {
      this.parent.reset(this);
      return new Script().setScale(this._scale).add(this);
    }
    if (this.parent.isScript) {
      return this.parent.splitAt(this);
    }
  };

  Block.prototype.copy = function() {
    var b = new Block([this._type, this.infoSpec, this.name, this._category], this.args.map(copy)).setScale(this._scale);
    if (b._color !== this._color) b.color = this.color;
    return b;
  };

  Block.prototype.scriptCopy = function() {
    if (!this.parent || !this.parent.isScript) return new Script().setScale(this._scale).add(this.copy());
    return this.parent.copyAt(this);
  };

  Block.prototype.toJSON = function() {
    return [this.name].concat(this.args.map(toJSON));
  };

  Block.prototype.objectFromPoint = function(x, y) {
    var args = this.args;
    for (var i = args.length; i--;) {
      var arg = args[i];
      var o = arg.objectFromPoint(x - arg.x, y - arg.y);
      if (o) return o;
    }
    return opaqueAt(this.context, x * this._scale, y * this._scale) ? this : null;
  };

  Block.prototype.moveTo = scaledMoveTo;
  Block.prototype.slideTo = scaledSlideTo;
  Block.prototype.layout = layout;

  Block.prototype.layoutChildren = function() {
    this.parts.forEach(layoutChildren);
    if (this.dirty) {
      this.dirty = false;
      this.layoutSelf();
    }
  };

  Block.prototype.drawChildren = function() {
    this.parts.forEach(drawChildren);
    if (this.graphicsDirty) {
      this.graphicsDirty = false;
      this.draw();
    }
  };

  Block.prototype.padding = {
    c: [4, 6, 2],
    f: [4, 6, 2],
    r: [3, 4, 1],
    b: [3, 4, 2],
    h: [3, 6, 2]
  };
  Block.prototype.partPadding = 4;
  Block.prototype.lineSpacing = 2;
  Block.prototype.scriptPadding = 15;
  Block.prototype.blockOffsetY = 1;

  Block.prototype.minDistance = function(part) {
    if (this.isBoolean) {
      return (
        part.isBlock && part._type === 'r' && !part.hasScript ? this.paddingX + part.height/4 | 0 :
        part._type !== 'b' ? this.paddingX + part.height/2 | 0 :
        0);
    }
    if (this.isReporter) {
      return (
        part.isArg && (part._type === 'd' || part._type === 'n') || part.isReporter && !part.hasScript ? 0 :
        (part.height)/2 | 0);
    }
    return 0;
  };

  Block.prototype.layoutSelf = function() {
    var s = this._scale;
    var xp = this.paddingX;
    var tp = this.paddingTop - (this.hasScript ? 1 : 0);
    var bp = this.paddingBottom;
    var pp = this.partPadding;
    var ls = this.lineSpacing;
    var sp = this.scriptPadding;
    var cmw = this.puzzle * 2 + this.puzzleInset + this.puzzleWidth;
    var command = this.isCommand;

    var lines = [[]];
    var lineXs = [[0]];
    var lineHeights = [0];
    var loop = null;

    var line = 0;
    var width = 0;
    var lineX = 0;
    var scriptWidth = 0;

    var parts = this.parts;
    var length = parts.length;
    for (var i = 0; i < length; i++) {
      var part = parts[i];
      if (part.isIcon && part.name === 'loop') {
        loop = part;
        continue;
      }
      if (part.isArg && part._type === 't') {
        lines.push([part], []);
        lineXs.push([0], [0]);
        lineHeights.push(part.height, 0);
        lineX = 0;
        scriptWidth = Math.max(scriptWidth, sp + part.script.width);
        line += 2;
      } else if (!part.isArg || part._type !== 'h') {
        var md = command ? 0 : this.minDistance(part);
        var mw = command ? (part.isBlock || part.isArg ? cmw : 0) : md;
        if (mw && !line && lineX < mw - xp) lineX = lineXs[line][lineXs[line].length-1] = mw - xp;
        lineX += part.width;
        width = Math.max(width, lineX + Math.max(0, md - xp));
        lineX += pp;
        lineXs[line].push(lineX);
        lineHeights[line] = Math.max(lineHeights[line], part.height);
        lines[line].push(part);
      }
    }

    if (!lines[line].length) {
      lineHeights[line] = 12;
    }
    width = Math.max(width + xp * 2, this.isHat || this.hasScript ? 83 : command ? 39 : 0);

    var y = this.isHat ? this.hatHeight : tp;
    length = lines.length;
    for (i = 0; i < length; i++) {
      var line = lines[i];
      var lh = lineHeights[i];
      var xs = lineXs[i];
      if (line[0] && line[0]._type === 't') {
        line[0].moveTo(sp, y);
      } else {
        for (var j = 0, l = line.length; j < l; j++) {
          var p = line[j];
          p.moveTo(xp + xs[j], y + ((lh - p.height) / 2 | 0) - (p.isBlock ? this.blockOffsetY : 0));
        }
      }
      y += lh + ls;
    }
    var height = y - ls + bp;

    if (loop) {
      loop.moveTo(width - loop.width - 2, height - loop.height - 3);
    }

    this.ownWidth = width;
    this.ownHeight = height + (this.hasPuzzle ? this.puzzle : 0);
    this.width = Math.max(width, scriptWidth);
    this.height = height;

    this.redraw();
  };

  Block.prototype.pathBlock = function(context) {
    this.pathFn(context);
    context.closePath();
    var w = this.ownWidth;
    var r = this.radius;
    var ri = r - 1;
    var p = this.puzzle;
    var pi = this.puzzleInset;
    var pw = this.puzzleWidth;
    this.args.forEach(function(a) {
      if (a._type === 't') {
        var x = a.x;
        var y = a.y;
        var h = a.height;
        context.moveTo(x + ri, y);
        context.lineTo(x, y + ri);
        context.lineTo(x, y + h - ri);
        context.lineTo(x + ri, y + h);
        context.lineTo(w - r, y + h);
        context.lineTo(w, y + h + r);
        context.lineTo(w, y - r);
        context.lineTo(w - r, y);
        context.lineTo(x + pi + pw + p * 2, y);
        context.lineTo(x + pi + pw + p, y + p);
        context.lineTo(x + pi + p, y + p);
        context.lineTo(x + pi, y);
        context.closePath();
      }
    });
  };

  Block.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    this.parts.forEach(function(p) {
      if (p.setScale) p.setScale(value);
    });
    this.layout();
    return this;
  };

  Block.prototype.redraw = redraw;

  Block.prototype.draw = function() {
    this.canvas.width = this.ownWidth * this._scale;
    this.canvas.height = this.ownHeight * this._scale;

    this.context.scale(this._scale, this._scale);
    this.drawOn(this.context);
  };

  Block.prototype.drawOn = function(context) {
    context.fillStyle = this._color;
    bezel(context, this.pathBlock, this, false, this._scale);
  };

  Block.prototype.pathShadowOn = function(context) {
    this.pathBlock(context);
    this.args.forEach(function(a) {
      if (a._type === 't') {
        context.save();
        context.translate(a.x, a.y);
        a.script.pathShadowOn(context);
        context.restore();
      }
    });
  };


  function Label(text) {
    this.el = el('Visual-absolute');
    this.el.appendChild(this.elText = el('Visual-absolute Visual-label'));

    this.text = text;
  }

  Label.measure = createMetrics('Visual-label');

  Label.prototype.isLabel = true;

  Label.prototype.parent = null;
  Label.prototype._scale = 1;
  Label.prototype.x = 0;
  Label.prototype.y = 0;
  Label.prototype.dirty = false;

  def(Label.prototype, 'text', {
    get: function() {return this._text},
    set: function(value) {
      this.elText.textContent = value;
      this._text = value;
      var metrics = Label.measure(value);
      this.width = metrics.width;
      this.height = metrics.height * 1.2 | 0;
    }
  });

  def(Label.prototype, 'app', {get: getApp});
  def(Label.prototype, 'workspace', {get: getWorkspace});
  def(Label.prototype, 'workspacePosition', {get: getWorkspacePosition});
  def(Label.prototype, 'worldPosition', {get: getWorldPosition});

  def(Label.prototype, 'dragObject', {get: function() {return this.parent.dragObject}});

  Label.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    setTransform(this.elText, 'scale('+value+')');
    return this;
  };

  Label.prototype.layoutSelf = function() {};
  Label.prototype.drawChildren = function() {};
  Label.prototype.layoutChildren = layoutNoChildren;
  Label.prototype.layout = layout;
  Label.prototype.moveTo = scaledMoveTo;
  Label.prototype.slideTo = scaledSlideTo;


  function Icon(name) {
    this.el = el('Visual-absolute');
    this.el.appendChild(this.canvas = el('canvas', 'Visual-absolute'));
    this.context = this.canvas.getContext('2d');
    this.name = name;
    this.info = this.icons[name] || this.icons.empty;
    this.fn = this.info.draw;
  }

  Icon.prototype.isIcon = true;

  Icon.prototype.parent = null;
  Icon.prototype._scale = 1;
  Icon.prototype.x = 0;
  Icon.prototype.y = 0;
  Icon.prototype.dirty = true;
  Icon.prototype.graphicsDirty = true;

  def(Icon.prototype, 'app', {get: getApp});
  def(Icon.prototype, 'workspace', {get: getWorkspace});
  def(Icon.prototype, 'workspacePosition', {get: getWorkspacePosition});
  def(Icon.prototype, 'worldPosition', {get: getWorldPosition});

  def(Icon.prototype, 'dragObject', {get: function() {return this.parent.dragObject}});

  Icon.prototype.icons = {
    loop: {
      width: 14,
      height: 11,
      draw: function(context) {
        this.pathLoopArrow(context);
        context.fillStyle = 'rgba(0, 0, 0, .3)';
        context.fill();

        context.translate(-1, -1);
        this.pathLoopArrow(context);
        context.fillStyle = 'rgba(255, 255, 255, .9)';
        context.fill();
      }
    },
    empty: {
      width: 0,
      height: 0,
      draw: function(context) {}
    }
  };

  Icon.prototype.redraw = redraw;

  Icon.prototype.draw = function() {
    this.canvas.width = this.width * this._scale;
    this.canvas.height = this.height * this._scale;
    this.context.scale(this._scale, this._scale);
    this.fn(this.context);
  };

  Icon.prototype.layoutSelf = function() {
    this.width = this.info.width;
    this.height = this.info.height;
    this.redraw();
  };

  Icon.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    this.layout();
    return this;
  };

  Icon.prototype.layoutChildren = layoutNoChildren;
  Icon.prototype.drawChildren = drawNoChildren;
  Icon.prototype.layout = layout;
  Icon.prototype.moveTo = scaledMoveTo;
  Icon.prototype.slideTo = scaledSlideTo;

  Icon.prototype.pathLoopArrow = function(context) {
    // m 1,11 8,0 2,-2 0,-3 3,0 -4,-5 -4,5 3,0 0,3 -8,0 z
    context.beginPath();
    context.moveTo(1, 11);
    context.lineTo(9, 11);
    context.lineTo(11, 9);
    context.lineTo(11, 6);
    context.lineTo(14, 6);
    context.lineTo(10, 1);
    context.lineTo(6, 6);
    context.lineTo(9, 6);
    context.lineTo(9, 9);
    context.lineTo(1, 9);
    context.lineTo(1, 11);
  };


  function Arg(info, value) {
    this.el = el('Visual-absolute');
    this.el.appendChild(this.canvas = el('canvas', 'Visual-absolute'));
    this.context = this.canvas.getContext('2d');

    if (typeof info === 'string') info = info.split('.');
    this.type = info[0];
    this.menu = info[1];

    if (value != null) this.value = value;
  }

  Arg.measure = createMetrics('Visual-field');

  Arg.prototype.pathArgType = {
    b: 'pathBooleanShape',
    c: 'pathRectShape',
    d: 'pathRoundedShape',
    h: 'pathNoShape',
    l: 'pathNoShape',
    m: 'pathRectShape',
    n: 'pathRoundedShape',
    s: 'pathRectShape'
  };

  Arg.prototype.isArg = true;
  Arg.prototype.isDraggable = true;

  Arg.prototype.parent = null;
  Arg.prototype._scale = 1;
  Arg.prototype.x = 0;
  Arg.prototype.y = 0;
  Arg.prototype.dirty = true;
  Arg.prototype.graphicsDirty = true;
  Arg.prototype._value = '';

  Arg.prototype.insetColor = 'rgba(0, 0, 0, .1)';
  Arg.prototype.fieldPadding = 4;
  Arg.prototype.minWidth = 6;

  def(Arg.prototype, 'value', {
    get: function() {
      return this._type === 't' ? this.script : this._value;
    },
    set: function(value) {
      if (this._type === 't') {
        if (value.isScript) {
          this.el.removeChild(this.script.el);
          this.script.parent = null;
          this.script = value;
          if (value.parent) value.parent.remove(value);
          value.moveTo(0, 0);
          value.parent = this;
          this.el.appendChild(value.el);
          this.layout();
        } else {
          var script = new Script();
          value.forEach(function(v) {
            script.add(v);
          }, this);
          this.value = script;
        }
        return;
      }
      if (this._type !== 'm' && this._type !== 'l' && (this._type !== 'd' || !isNaN(value))) {
        this._value = value;
        if (this.field) this.field.value = this._type === 'c' ? numberToColor(value) : value;
        if (this.type !== 'h') this.layout();
        return;
      }
      this._value = value;
      var text = this.shouldTranslate(value) ? options.getText(value) : value;
      if (this._type === 'm' || this._type === 'l') {
        this.field.textContent = text;
      } else {
        this.field.value = text;
      }
      this.layout();
      return;
    }
  });

  Arg.prototype.shouldTranslate = function(value) {
    return true;
  };

  def(Arg.prototype, 'type', {
    get: function() {return this._type},
    set: function(value) {
      this._type = value;
      this.pathFn = this[this.pathArgType[value]];

      while (this.el.firstChild) {
        this.el.removeChild(this.el.lastChild);
      }
      this.isTextArg = false;

      var arrow;
      switch (value) {
        case 'c':
          this.field = el('input', 'Visual-absolute Visual-field Visual-color-field');
          this.field.type = 'color';
          this._value = randColor();
          this.field.value = numberToColor(this._value);
          this.field.addEventListener('input', this.changeColor.bind(this));
          break;
        case 'd':
          arrow = true;
          /* falls through */
        case 'n':
        case 's':
          this.field = el('input', 'Visual-absolute Visual-field Visual-text-field');
          if (value === 'n' || value === 'd') {
            this.field.pattern = '[0-9]*';
            this.field.addEventListener('keypress', this.keyPress.bind(this));
          }
          this.field.addEventListener('input', this.change.bind(this));
          this.field.addEventListener('keydown', this.keyDown.bind(this));
          this.isTextArg = true;
          break;
        case 'm':
          arrow = true;
          this.field = el('Visual-absolute Visual-field Visual-enum-field');
          break;
        case 'l':
          this.field = el('Visual-absolute Visual-label');
          break;
        case 'h':
          return;
        case 't':
          this.script = new Script();
          this.script.parent = this;
          break;
      }
      if (this.script) {
        this.el.appendChild(this.script.el);
      } else {
        this.el.appendChild(this.canvas);
      }
      if (this.field) this.el.appendChild(this.field);
      if (arrow) {
        this.arrow = el('canvas', 'Visual-absolute');
        this.drawArrow();
        this.el.appendChild(this.arrow);
      }

      this.layout();
    }
  });

  Arg.prototype.changeColor = function() {
    this._value = colorToNumber(this.field.value);
    this.draw();
  };

  Arg.prototype.change = function() {
    this._value = this.field.value;
    if (this._type === 'n' && false) {
      var v = this._value.replace(/[^eE\d.-]/g, '');
      if (v !== this._value) {
        this.field.value = this._value = v;
      }
    }
    this.layout();
  };

  Arg.prototype.keyPress = function(e) {
    if (e.charCode === 0x2d || e.charCode === 0x2e || e.charCode >= 0x30 && e.charCode <= 0x39 || e.charCode === 0x45 || e.charCode === 0x65 || e.charCode < 0x20 || e.metaKey || e.ctrlKey || e.key === '£' || e.charCode === 0x70) return;
    console.log(e)
    e.preventDefault();
  };

  var NUM_RE = /[+-]?\d+(?:\.\d+)?/g;
  Arg.prototype.keyDown = function(e) {
    if (e.keyCode === 38 || e.keyCode === 40) {
      var delta = e.keyCode === 38 ? 1 : -1;
      if (e.shiftKey) delta *= 10;
      else if (e.altKey) delta /= 10;

      var v = this.field.value;
      var ss = this.field.selectionStart;

      var x;
      NUM_RE.lastIndex = 0;
      while (x = NUM_RE.exec(v)) {
        if (x.index > ss) break;
        if (ss <= NUM_RE.lastIndex) {

          var nv = "" + Math.round((+x[0] + delta) * 1000000) / 1000000;
          this.field.value = this._value = v.slice(0, x.index) + nv + v.slice(NUM_RE.lastIndex);
          this.field.selectionStart = x.index;
          this.field.selectionEnd = x.index + nv.length;
          // this.field.selectionStart = this.field.selectionEnd = x.index + Math.max(0, ss - x.index + nv.length - x[0].length);

          e.preventDefault();
          this.layout();
          break;
        }
      }
    }
  };

  def(Arg.prototype, 'app', {get: getApp});
  def(Arg.prototype, 'workspace', {get: getWorkspace});
  def(Arg.prototype, 'workspacePosition', {get: getWorkspacePosition});
  def(Arg.prototype, 'worldPosition', {get: getWorldPosition});

  def(Arg.prototype, 'contextMenu', {get: function() {
    if (this._type === 'l' && this.menu) {
      var m = this.parent.contextMenu || new Menu;
      var src = options.getMenu(this);
      if (src && src.items.length) {
        m.add(Menu.line);
        src.items.forEach(function(item) {
          if (item === Menu.line || typeof item[1] === 'function') {
            m.add(item);
          } else {
            m.add([item[0], setValue.bind(this, item[1])]);
          }
        }, this);
      }
      return m;
    }
    return this.parent.contextMenu;
  }, configurable: true});

  def(Arg.prototype, 'dragObject', {get: function() {return this.parent.dragObject}});

  Arg.prototype.click = function(x, y) {
    if (this._type === 'l' || this._type === 'b') {
      return this.parent.click(x, y);
    }
    if (this._type === 'd') {
      var pos = this.worldPosition;
    }
    if (this._type === 'm' || this._type === 'd' && x >= pos.x + this.arrowX) {
      var menu = options.getMenu(this);
      if (menu) {
        pos = pos || this.worldPosition;
        menu.ignoreMouse = false;
        menu.withAction(setValue, this).showAt(pos.x, pos.y + this.height * this._scale, this.app);
      }
    } else if (this.isTextArg) {
      this.field.select();
      this.field.setSelectionRange(0, this.field.value.length);
    }
  };

  Arg.prototype.acceptsDropOf = function(b) {
    return this.type !== 't';
  };

  Arg.prototype.copy = function() {
    var value = this.type === 't' ? this.script.copy() : this.value;
    return new Arg([this.type, this.menu], value).setScale(this._scale);
  };

  Arg.prototype.toJSON = function() {
    return this._type === 't' ? this.script.toJSON() : this.value;
  };

  Arg.prototype.objectFromPoint = function(x, y) {
    switch (this._type) {
      case 'b': return null;
      case 'l': return containsPoint(this, x, y) ? this : null;
      case 't': return this.script.objectFromPoint(x, y);
    }
    return opaqueAt(this.context, x * this._scale, y * this._scale) ? this : null;
  };

  Arg.prototype.draw = function() {
    this.canvas.width = this.width * this._scale;
    this.canvas.height = this.height * this._scale;

    this.context.scale(this._scale, this._scale);
    this.drawOn(this.context);
  };

  Arg.prototype.drawOn = function(context) {
    if (this._type === 't') return;

    var field = 'bcm'.indexOf(this._type) === -1;

    context.fillStyle =
      field ? '#fff' :
      this._type === 'c' ? this.field.value : this.color;
    bezel(context, this.pathFn, this, true, this._scale);
  };

  Arg.prototype.pathShadowOn = function(context) {
    if (this._type === 't') return;
    if (this._type === 'l') {
      this.pathRectShape(context);
    } else {
      this.pathFn(context);
    }
    context.closePath();
  };

  Arg.prototype.pathRoundedShape = function(context) {
    var w = this.width;
    var h = this.height;
    var r = Math.min(w, h) / 2;

    context.moveTo(0, r + .5);
    context.arc(r, r + .5, r, PI, PI32, false);
    context.arc(w - r, r + .5, r, PI32, 0, false);
    context.arc(w - r, h - r - .5, r, 0, PI12, false);
    context.arc(r, h - r - .5, r, PI12, PI, false);
  };

  Arg.prototype.pathRectShape = function(context) {
    var w = this.width;
    var h = this.height;
    var y = this._type === 's' ? .5 : 0;

    context.moveTo(0, y);
    context.lineTo(w, y);
    context.lineTo(w, h-y);
    context.lineTo(0, h-y);
  };

  Arg.prototype.pathBooleanShape = function(context) {
    var w = this.width;
    var h = this.height;
    var r = Math.min(w, h) / 2;

    context.moveTo(0, r);
    context.lineTo(r, 0);
    context.lineTo(w - r, 0);
    context.lineTo(w, r);
    context.lineTo(w - r, h);
    context.lineTo(r, h);
  };

  Arg.prototype.pathNoShape = function(context) {};

  Arg.prototype.arrowWidth = 7;
  Arg.prototype.arrowHeight = 4;
  Arg.prototype.drawArrow = function() {
    var w = this.arrowWidth * this._scale;
    var h = this.arrowHeight * this._scale;
    var canvas = this.arrow;
    canvas.width = w;
    canvas.height = h;
    var context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, .6)';
    context.moveTo(0, 0);
    context.lineTo(w, 0);
    context.lineTo(w/2, h);
    context.closePath();
    context.fill();
  };

  Arg.prototype.layoutSelf = function() {
    if (this._type === 'm' || this._type === 'b') {
      var can = document.createElement('canvas');
      can.width = 1;
      can.height = 1;
      var c = can.getContext('2d');
      c.fillStyle = this.parent.color;
      c.fillRect(0, 0, 1, 1);
      c.fillStyle = this.insetColor;
      c.fillRect(0, 0, 1, 1);
      var d = c.getImageData(0, 0, 1, 1).data;
      var s = (d[0] * 0x10000 + d[1] * 0x100 + d[2]).toString(16);
      this.color = '#' + '000000'.slice(s.length) + s;
    }
    switch (this._type) {
      case 'd':
      case 'm':
      case 'n':
      case 's':
        var metrics = Arg.measure(this._type === 'm' ? this.field.textContent : this.field.value);
        var w = Math.max(this.minWidth, metrics.width) + this.fieldPadding * 2;
        if (this.arrow) {
          this.width = w + this.arrowWidth + 1;
          w -= this.fieldPadding - 2;
        } else {
          this.width = w;
        }
        this.height = metrics.height + 1;
        this.field.style.width = w + 'px';
        this.field.style.height = this.height + 'px';
        // this.field.style.lineHeight = this.height + 'px';
        if (this.arrow) {
          this.arrowX = (this.width - this.arrowWidth) * this._scale - 3;
          this.arrowY = ((this.height - this.arrowHeight) * this._scale) / 2 | 0;
          setTransform(this.arrow, 'translate('+this.arrowX+'px, '+this.arrowY+'px)');
        }
        break;
      case 'l':
        var metrics = Label.measure(this.field.textContent);
        this.width = metrics.width;
        this.height = metrics.height * 1.2 | 0;
        break;
      case 't':
        this.width = 0;
        this.height = Math.max(9, this.script.height);
        break;
      case 'b':
        this.width = 27;
        this.height = 15;
        break;
      default:
        this.width = 13;
        this.height = 13;
        if (this.field) {
          this.field.style.width = this.width + 'px';
          this.field.style.height = this.height + 'px';
        }
        break;
    }

    this.redraw();
  };

  Arg.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    if (this.script) this.script.setScale(value);
    this.layout();
    if (this.arrow) {
      this.drawArrow();
    }
    if (this.field) {
      setTransform(this.field, 'scale('+value+')');
    }
    return this;
  };

  Arg.prototype.layoutChildren = function() {
    if (this._type === 't') this.script.layoutChildren();
    if (this.dirty) {
      this.dirty = false;
      this.layoutSelf();
    }
  };

  Arg.prototype.drawChildren = function() {
    if (this._type === 't') this.script.drawChildren();
    if (this.graphicsDirty) {
      this.graphicsDirty = false;
      this.draw();
    }
  };

  Arg.prototype.redraw = redraw;
  Arg.prototype.layout = layout;
  Arg.prototype.moveTo = scaledMoveTo;
  Arg.prototype.slideTo = scaledSlideTo;


  function Script(blocks) {
    this.el = el('Visual-absolute Visual-script');

    this.effectFns = [];
    this.effects = [];

    this.blocks = [];
    this.x = 0;
    this.y = 0;
    this.width = 0;
    this.height = 0;

    if (blocks) this.addAll(blocks);
  }

  Script.prototype.isScript = true;

  Script.prototype.parent = null;
  Script.prototype._scale = 1;
  Script.prototype.dirty = true;

  def(Script.prototype, 'app', {get: getApp});
  def(Script.prototype, 'workspace', {get: getWorkspace});
  def(Script.prototype, 'workspacePosition', {get: getWorkspacePosition});
  def(Script.prototype, 'worldPosition', {get: getWorldPosition});
  def(Script.prototype, 'topScript', {get: getTopScript});

  def(Script.prototype, 'hasHat', {get: function() {return this.blocks.length && this.blocks[0].isHat}});
  def(Script.prototype, 'hasFinal', {get: function() {return this.blocks.length && this.blocks[this.blocks.length-1].isFinal}});

  def(Script.prototype, 'isReporter', {get: function() {return this.blocks.length && this.blocks[0].isReporter}});
  def(Script.prototype, 'isEmpty', {get: function() {return !this.blocks.length}});

  Script.prototype._visible = true;
  def(Script.prototype, 'visible', {
    get: function() {return this._visible},
    set: function(value) {
      if (this._visible === value) return;
      this._visible = value;
      this.el.style.display = value ? 'block' : 'none';
    }
  });

  Script.prototype.shadow = function(offsetX, offsetY, blur, color) {
    var canvas = el('canvas', 'Visual-absolute');
    setTransform(canvas, 'translate('+(offsetX - blur * this._scale)+'px, '+(offsetY - blur * this._scale)+'px)');
    canvas.width = (this.width + blur * 2) * this._scale;
    canvas.height = (this.ownHeight + blur * 2) * this._scale;

    var context = canvas.getContext('2d');
    context.save();
    context.scale(this._scale, this._scale);
    context.shadowColor = color;
    context.shadowBlur = blur * this._scale;
    context.shadowOffsetX = (10000 + blur) * this._scale;
    context.shadowOffsetY = (10000 + blur) * this._scale;
    context.translate(-10000, -10000);
    this.pathShadowOn(context);
    context.fill();
    context.restore();

    return canvas;
  };

  Script.prototype.addShadow = function(offsetX, offsetY, blur, color) {
    if (!this._shadow) {
      this.addEffect(this._shadow = this.shadow.bind(this, offsetX, offsetY, blur, color));
    }
    return this;
  };

  Script.prototype.removeShadow = function() {
    this.removeEffect(this._shadow);
    this._shadow = null;
    return this;
  };

  Script.prototype.addEffect = function(fn) {
    var effect = fn.call(this);
    this.el.insertBefore(effect, this.el.firstChild);
    this.effectFns.push(fn);
    this.effects.push(effect);
    return this;
  };

  Script.prototype.removeEffect = function(fn) {
    var i = this.effectFns.indexOf(fn);
    if (i !== -1) {
      this.el.removeChild(this.effects[i]);
      this.effectFns.splice(i, 1);
      this.effects.splice(i, 1);
    }
    return this;
  };

  Script.prototype.outline = function(size, color) {
    var canvas = el('canvas', 'Visual-absolute');
    setTransform(canvas, 'translate('+(-size * this._scale)+'px, '+(-size * this._scale)+'px)');
    canvas.width = (this.width + size * 2) * this._scale;
    canvas.height = (this.ownHeight + size * 2) * this._scale;

    var context = canvas.getContext('2d');
    context.save();
    context.scale(this._scale, this._scale);
    context.translate(size, size);
    this.pathShadowOn(context);
    context.strokeStyle = color;
    context.lineWidth = size * 2;
    context.stroke();
    context.globalCompositeOperation = 'destination-out';
    context.fill();
    context.restore();

    return canvas;
  };

  Script.prototype.addOutline = function(size, color) {
    if (!this._outline) {
      this.addEffect(this._outline = this.outline.bind(this, size, color));
    }
    return this;
  };

  Script.prototype.removeOutline = function() {
    this.removeEffect(this._outline);
    this._outline = null;
    return this;
  };

  Script.prototype.pathShadowOn = function(context) {
    context.save();
    var blocks = this.blocks;
    var length = blocks.length;
    var y = 0;
    for (var i = 0; i < length; i++) {
      var b = blocks[i];
      context.translate(0, b.y - y);
      b.pathShadowOn(context);
      y = b.y;
    }
    context.restore();
  };

  Script.prototype.splitAt = function(topBlock) {
    var script = new Script().setScale(this._scale);
    if (topBlock.parent !== this) return script;

    var blocks = this.blocks;
    var i = blocks.indexOf(topBlock);

    if (i === 0) {
      if (this.parent.isArg) this.parent.value = script;
      return this;
    }

    script.blocks = blocks.slice(i);
    this.blocks = blocks.slice(0, i);

    var f = document.createDocumentFragment();

    var length = blocks.length;
    for (; i < length; i++) {
      var b = blocks[i];
      b.parent = script;
      f.appendChild(b.el);
    }

    this.layout();
    script.el.appendChild(f);
    return script;
  };

  Script.prototype.add = function(block) {
    if (block.parent) block.parent.remove(block);

    if (block.isScript) {
      this.addScript(block);
      return this;
    }

    block.parent = this;
    this.blocks.push(block);

    block.layoutChildren();
    this.layout();
    if (this.workspace) block.drawChildren();

    this.el.appendChild(block.el);
    return this;
  };

  Script.prototype.addAll = function(blocks) {
    var f = document.createDocumentFragment();

    var length = blocks.length;
    for (var i = 0; i < length; i++) {
      var b = blocks[i];
      if (b.parent) b.parent.remove(b);
      b.parent = this;
      f.appendChild(b.el);
    }

    this.blocks.push.apply(this.blocks, blocks);

    var ws = this.workspace;
    for (var i = 0; i < length; i++) {
      blocks[i].layoutChildren();
      if (ws) blocks[i].drawChildren();
    }

    this.layout();
    this.el.appendChild(f);
    return this;
  };

  Script.prototype.addScript = function(script) {
    var f = document.createDocumentFragment();

    var blocks = script.blocks;
    var length = blocks.length;
    for (var i = 0; i < length; i++) {
      var b = blocks[i];
      b.parent = this;
      f.appendChild(b.el);
    }

    this.blocks.push.apply(this.blocks, blocks);

    script.blocks = [];

    var ws = this.workspace;
    for (var i = 0; i < length; i++) {
      blocks[i].layoutChildren();
      if (ws) blocks[i].drawChildren();
    }

    this.layout();
    this.el.appendChild(f);
  };

  Script.prototype.insert = function(block, beforeBlock) {
    if (!beforeBlock || beforeBlock.parent !== this) return this.add(block);
    if (block.parent) block.parent.remove(block);

    if (block.isScript) {
      this.insertScript(block, beforeBlock);
      return this;
    }

    block.parent = this;
    var i = this.blocks.indexOf(beforeBlock);
    this.blocks.splice(i, 0, block);
    if (this.workspace) block.drawChildren();

    block.layoutChildren();
    this.layout();

    this.el.insertBefore(block.el, beforeBlock.el);
    return this;
  };

  Script.prototype.insertScript = function(script, beforeBlock) {
    var f = document.createDocumentFragment();

    var blocks = script.blocks;
    var length = blocks.length;
    for (var i = 0; i < length; i++) {
      var b = blocks[i];
      b.parent = this;
      f.appendChild(b.el);
    }

    var i = this.blocks.indexOf(beforeBlock);
    this.blocks.splice.apply(this.blocks, [i, 0].concat(blocks));

    script.blocks = [];

    if (i === 0 && this.parent && this.parent.isWorkspace) {
      this.moveTo(this.x, this.y - script.height);
    }

    var ws = this.workspace;
    for (var i = 0; i < length; i++) {
      blocks[i].layoutChildren();
      if (ws) blocks[i].drawChildren();
    }

    this.layout();
    this.el.insertBefore(f, beforeBlock.el);
  };

  Script.prototype.replace = function(oldBlock, newBlock) {
    if (oldBlock.parent !== this) return this;

    oldBlock.parent = null;
    newBlock.parent = this;

    var i = this.blocks.indexOf(oldBlock);
    this.blocks.splice(i, 1, newBlock);

    newBlock.layoutChildren();
    this.layout();
    if (this.workspace) newBlock.drawChildren();

    this.el.replaceChild(newBlock.el, oldBlock.el);
    return this;
  };

  Script.prototype.remove = function(block) {
    if (block.parent !== this) return this;

    block.parent = null;
    var i = this.blocks.indexOf(block);
    this.blocks.splice(i, 1);
    this.el.removeChild(block.el);

    this.layout();
    return this;
  };

  Script.prototype.copy = function() {
    var script = new Script().setScale(this._scale);
    script.moveTo(this.x, this.y);
    script.addScript({blocks: this.blocks.map(copy)});
    return script;
  };

  Script.prototype.copyAt = function (b) {
    var script = new Script().setScale(this._scale);
    var i = this.blocks.indexOf(b);
    if (i === -1) return script;
    script.addScript({blocks: this.blocks.slice(i).map(copy)});
    return script;
  };

  Script.prototype.toJSON = function() {
    return !this.parent || this.parent.isWorkspace ? [this.x, this.y, this.blocks.map(toJSON)] : this.blocks.map(toJSON);
  };

  Script.prototype.objectFromPoint = function(x, y) {
    if (!containsPoint(this, x, y)) return null;
    var blocks = this.blocks;
    for (var i = blocks.length; i--;) {
      var block = blocks[i];
      var o = block.objectFromPoint(x, y - block.y);
      if (o) return o;
    }
    return null;
  };

  Script.prototype.layoutChildren = function() {
    this.blocks.forEach(layoutChildren);
    if (this.dirty) {
      this.dirty = false;
      this.layoutSelf();
    }
  };

  Script.prototype.drawChildren = function() {
    this.blocks.forEach(drawChildren);
  };

  Script.prototype.layoutSelf = function() {
    var blocks = this.blocks;
    var length = blocks.length;
    var y = 0;
    var w = 0;
    for (var i = 0; i < length;) {
      var b = blocks[i];
      b.moveTo(0, y);
      w = Math.max(w, b.width);
      i++;
      y += b.height;
    }

    this.width = this.ownWidth = w;
    this.height = y;
    this.ownHeight = this.height + (b ? b.ownHeight - b.height : 0);

    var l = this.effects.length;
    for (var i = 0; i < l; i++) {
      var effect = this.effects[i];
      this.el.replaceChild(this.effects[i] = this.effectFns[i].call(this), effect);
    }
  };

  Script.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    this.blocks.forEach(function(b) {
      b.setScale(value);
    });
    if (this.parent && this.parent.isWorkspace) this.moveTo(this.x, this.y);
    return this;
  };

  Script.prototype.layout = layout;
  Script.prototype.moveTo = scaledMoveTo;
  Script.prototype.slideTo = scaledSlideTo;


  function Comment(text, width, height, collapse) {
    this.el = el('Visual-absolute Visual-comment');

    this.el.appendChild(this.canvas = el('canvas', 'Visual-absolute'));
    this.context = this.canvas.getContext('2d');

    this.el.appendChild(this.title = el('Visual-comment-title Visual-absolute'));
    setTransform(this.title, 'translate(16px,1px)');
    this.title.style.height = this.title.style.lineHeight = this.titleHeight + 'px';

    this.el.appendChild(this.field = el('textarea', 'Visual-comment-field Visual-absolute'));
    setTransform(this.field, 'translate(0,'+this.titleHeight+'px)');

    this.effectFns = [];
    this.effects = [];

    this.width = this.ownWidth = width || 150;
    this.height = this.ownHeight = this.fullHeight = height || 200;

    this.text = text || '';
    this.collapse = !!collapse;
  }

  Comment.prototype.isComment = true;
  Comment.prototype.isDraggable = true;
  Comment.prototype.isResizable = true;

  Comment.prototype.parent = null;
  Comment.prototype._scale = 1;
  Comment.prototype.x = 0;
  Comment.prototype.y = 0;
  Comment.prototype.dirty = true;

  Comment.prototype.minWidth = 100;
  Comment.prototype.minHeight = 34;

  Comment.prototype.titleHeight = 18;
  Comment.prototype.radius = 5;
  Comment.prototype.resizerSize = 10;
  Comment.prototype.resizerColor = '#606060';
  Comment.prototype.arrowColor = 'rgba(80, 80, 80, .8)';
  Comment.prototype.borderColor = 'rgba(80, 80, 80, .2)'; // NS
  // Comment.prototype.borderColor = '#d0d1d2';
  Comment.prototype.bodyColor = '#ffffd2';
  Comment.prototype.titleColor = '#ffffa5';

  def(Comment.prototype, 'app', {get: getApp});
  def(Comment.prototype, 'workspace', {get: getWorkspace});
  def(Comment.prototype, 'workspacePosition', {get: getWorkspacePosition});
  def(Comment.prototype, 'worldPosition', {get: getWorldPosition});

  def(Comment.prototype, 'text', {
    get: function() {return this.field.value},
    set: function(value) {
      this.field.value = this.title.textContent = value;
    }
  });

  def(Comment.prototype, 'collapse', {
    get: function() {return this._collapse},
    set: function(value) {
      if (this._collapse !== value) {
        this._collapse = value;
        this.title.textContent = this.field.value;
        this.layout();
      }
    }
  });

  def(Comment.prototype, 'contextMenu', {get: function() {
    if (this.workspace.isPalette) {
      return null;
    }
    var app = this.app;
    var pressX = app.pressX;
    var pressY = app.pressY;
    return new Menu(
      ['duplicate', function() {
        var pos = this.worldPosition;
        app.grab(this.copy(), pos.x - pressX, pos.y - pressY);
      }],
      Menu.line,
      ['delete', this.destroy]).translate().withContext(this);
  }});

  Comment.prototype.destroy = function() {
    if (!this.parent) return this;
    if (this.parent) {
      this.parent.remove(this);
    }
    return this;
  };

  def(Comment.prototype, 'state', {get: function() {
    return {
      workspace: this.workspace,
      pos: this.workspacePosition
    };
  }});

  Comment.prototype.restore = function(state) {
    state.workspace.add(state.pos.x, state.pos.y, this);
  };

  def(Comment.prototype, 'dragObject', {get: function() {return this}});

  Comment.prototype.detach = function() {
    return this.workspace.isPalette ? this.copy() : this;
  };

  Comment.prototype.click = function(x, y) {
    if (y - this.worldPosition.y < this.titleHeight * this._scale) {
      this.collapse = !this.collapse;
    } else {
      this.field.focus();
    }
  };

  Comment.prototype.copy = function() {
    return new Comment(this.text, this.width, this.fullHeight, this.collapse);
  };

  Comment.prototype.toJSON = function() {
    return [this.x, this.y, this.width, this.fullHeight, !this.collapse, -1, this.text];
  };

  Comment.prototype.resizableAt = function(x, y) {
    return x >= (this.width - this.resizerSize - 2) * this._scale && y >= (this.height - this.resizerSize - 2) * this._scale && opaqueAt(this.context, x, y);
  };

  Comment.prototype.resizeTo = function(w, h) {
    this.width = w;
    this.fullHeight = h;
    this.layout();
  };

  Comment.prototype.shadow = Script.prototype.shadow;
  Comment.prototype.addShadow = Script.prototype.addShadow;
  Comment.prototype.removeShadow = Script.prototype.removeShadow;
  Comment.prototype.outline = Script.prototype.outline;
  Comment.prototype.addOutline = Script.prototype.addOutline;
  Comment.prototype.removeOutline = Script.prototype.removeOutline;
  Comment.prototype.addEffect = Script.prototype.addEffect;
  Comment.prototype.removeEffect = Script.prototype.removeEffect;

  Comment.prototype.layoutSelf = function() {
    var s = this._scale;
    var w = this.width;
    var h = this._collapse ? this.titleHeight + 2 : this.fullHeight;
    if (this._collapse) {
      this.title.style.width = (w - 20) + 'px';
      this.field.style.visibility = 'hidden';
      this.title.style.visibility = 'visible';
    } else {
      this.field.style.width = w + 'px';
      this.field.style.height = (h - this.titleHeight) + 'px';
      this.field.style.visibility = 'visible';
      this.title.style.visibility = 'hidden';
    }
    this.ownWidth = w;
    this.height = this.ownHeight = h
    this.redraw();
  };

  Comment.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    setTransform(this.title, 'scale('+value+') translate(16px,1px)');
    setTransform(this.field, 'scale('+value+') translate(0,'+this.titleHeight+'px)');
    this.moveTo(this.x, this.y);
    this.layout();
    return this;
  };

  Comment.prototype.draw = function() {
    this.canvas.width = this.width * this._scale;
    this.canvas.height = this.height * this._scale;
    this.context.scale(this._scale, this._scale);
    this.drawOn(this.context);
  };

  Comment.prototype.drawOn = function(context) {
    var w = this.width;
    var h = this.height;
    var th = this.titleHeight;
    var r = this.radius;
    var r1 = this.radius + 1.5;
    var r2 = this.radius + 1;

    context.beginPath();
    context.arc(r1, r1, r2, PI, PI32, false);
    context.arc(w - r1, r1, r2, PI32, 0, false);
    context.arc(w - r1, h - r1, r2, 0, PI12, false);
    context.arc(r1, h - r1, r2, PI12, PI, false);
    context.closePath();
    context.strokeStyle = this.borderColor;
    context.stroke();

    context.beginPath();
    context.arc(r2, r2, r, PI, PI32, false);
    context.arc(w - r2, r2, r, PI32, 0, false);
    if (this._collapse) {
      context.arc(w - r2, h - r2, r, 0, PI12, false);
      context.arc(r2, h - r2, r, PI12, PI, false);
    } else {
      context.lineTo(w - 1, th);
      context.lineTo(1, th);
    }
    context.fillStyle = this.titleColor;
    context.fill();

    if (!this._collapse) {
      context.beginPath();
      context.moveTo(1, th);
      context.lineTo(w - 1, th);
      context.arc(w - r2, h - r2, r, 0, PI12, false);
      context.arc(r2, h - r2, r, PI12, PI, false);
      context.fillStyle = this.bodyColor;
      context.fill();
    }

    context.beginPath();
    if (this._collapse) {
      context.moveTo(6, 4);
      context.lineTo(12, 9.5);
      context.lineTo(6, 15);
    } else {
      context.moveTo(4, 6);
      context.lineTo(9.5, 12);
      context.lineTo(15, 6);
    }
    context.fillStyle = this.arrowColor;
    context.fill();

    if (!this._collapse) {
      var s = this.resizerSize;
      context.beginPath();
      context.moveTo(w - s - 2, h - 2);
      context.lineTo(w - 2, h - s - 2);
      context.moveTo(w - s * .6 - 2, h - 2);
      context.lineTo(w - 2, h - s * .6 - 2);
      context.strokeStyle = this.resizerColor;
      context.stroke();
    }
  };

  Comment.prototype.pathShadowOn = function(context) {
    var w = this.width;
    var h = this.height;
    var r = this.radius;
    context.moveTo(0, r);
    context.arc(r, r, r, PI, PI32, false);
    context.arc(w - r, r, r, PI32, 0, false);
    context.arc(w - r, h - r, r, 0, PI12, false);
    context.arc(r, h - r, r, PI12, PI, false);
  };

  Comment.prototype.objectFromPoint = function(x, y) {
    return opaqueAt(this.context, x * this._scale, y * this._scale) ? this : null;
  };
  Comment.prototype.layoutChildren = layoutNoChildren;
  Comment.prototype.drawChildren = drawNoChildren;
  Comment.prototype.redraw = redraw;
  Comment.prototype.layout = layout;
  Comment.prototype.moveTo = scaledMoveTo;
  Comment.prototype.slideTo = scaledSlideTo;


  function Workspace(host) {
    this.el = host;
    this.el.className += ' Visual-workspace Visual-no-select';
    this.el.appendChild(this.elContents = el('Visual-absolute'));

    this.scripts = [];

    if (host.tagName === 'BODY' && host.parentNode) {
      host.parentNode.style.height = '100%';
      window.addEventListener('resize', this.resize.bind(this));
    }
    this.el.addEventListener('scroll', this.onScroll.bind(this));

    this.layout();
    this.resize();
  }

  Workspace.prototype.isWorkspace = true;

  Workspace.prototype._scale = 1;
  Workspace.prototype.parent = null;
  Workspace.prototype.scrollX = 0;
  Workspace.prototype.scrollY = 0;

  Workspace.prototype.paddingLeft = 20;
  Workspace.prototype.paddingTop = 20;
  Workspace.prototype.paddingRight = 100;
  Workspace.prototype.paddingBottom = 100;
  Workspace.prototype.spacing = 20;

  def(Workspace.prototype, 'app', {get: getApp});
  def(Workspace.prototype, 'workspace', {get: function() {return this}});
  def(Workspace.prototype, 'workspacePosition', {get: function() {return {x: 0, y: 0}}});
  def(Workspace.prototype, 'worldPosition', {get: getWorldPosition});

  def(Workspace.prototype, 'contextMenu', {get: function() {
    if (this.isPalette) return;
    var app = this.app;
    var pos = this.worldPosition;
    var pressX = app.pressX - pos.x;
    var pressY = app.pressY - pos.y;
    return new Menu(
      ['clean up', this.cleanUp],
      ['add comment', function() {
        this.add(new Comment('add comment here...').moveTo(pressX / this._scale, pressY / this._scale));
      }]).translate().withContext(this);
  }});

  Workspace.prototype.add = function(x, y, script) {
    if (x && script == null && y == null) {
      script = x;
      x = null;
    }
    if (script.parent) script.parent.remove(script);

    script.setScale(this._scale);
    script.parent = this;
    this.scripts.push(script);

    if (x != null) script.moveTo(x, y);
    script.layoutChildren();
    script.drawChildren();
    this.layout();

    this.elContents.appendChild(script.el);

    return this.dispatch('change');
  };

  Workspace.prototype.addAll = function(scripts) {
    var f = document.createDocumentFragment();

    for (var i = 0, length = scripts.length; i < length; i++) {
      var s = scripts[i];
      if (s.parent) s.parent.remove(s);
      s.setScale(this._scale);
      s.parent = this;
      s.layoutChildren();
      s.drawChildren();
      f.appendChild(s.el);
    }
    this.scripts = this.scripts.concat(scripts);
    this.layout();
    this.elContents.appendChild(f);

    return this.dispatch('change');
  };

  Workspace.prototype.remove = function(script) {
    if (script.parent !== this) return this;
    script.parent = null;

    var i = this.scripts.indexOf(script);
    this.scripts.splice(i, 1);
    if (!script.isSpace) this.elContents.removeChild(script.el);
    this.layout();

    return this.dispatch('change');
  };

  Workspace.prototype.clear = function() {
    var scripts = this.scripts;
    for (var i = scripts.length; i--;) {
      var s = scripts[i];
      if (!s.isSpace) this.elContents.removeChild(s.el);
      s.parent = null;
    }
    this.scripts = [];
    this.contentWidth = this.paddingLeft + this.paddingRight;
    this.contentHeight = this.paddingTop + this.paddingBottom;
    this.refill();
    return this.dispatch('change');
  };

  Workspace.prototype.objectFromPoint = function(x, y) {
    x /= this._scale;
    y /= this._scale;
    var sx = this.scrollX / this._scale;
    var sy = this.scrollY / this._scale;
    if (x < sx || y < sy || x >= sx + this.width / this._scale || y >= sy + this.height / this._scale) return null;
    var scripts = this.scripts;
    for (var i = scripts.length; i--;) {
      var script = scripts[i];
      if (script.isSpace) continue;
      var o = script.objectFromPoint(x - script.x, y - script.y);
      if (o) return o;
    }
    return this;
  };

  Workspace.prototype.scrollBy = function(x, y) {
    return this.scrollTo(this.scrollX + x, this.scrollY + y);
  };

  Workspace.prototype.scrollTo = function(x, y) {
    this.el.scrollLeft = this.scrollX = Math.max(0, this.isPalette ? Math.min(this.contentWidth - this.width, x) : x);
    this.el.scrollTop = this.scrollY = Math.max(0, this.isPalette ? Math.min(this.contentHeight - this.height, y) : y);
    this.updateVisibility();
    if (this.parent) this.parent.showAllFeedback();
    return this;
  };

  Workspace.prototype.onScroll = function() {
    this.scrollX = this.el.scrollLeft;
    this.scrollY = this.el.scrollTop;
    if (this.isPalette) {
      this.updateVisibility();
    } else {
      this.refill();
    }
    return this;
  };

  Workspace.prototype.updateVisibility = function() {
    var l = this.scrollX / this._scale;
    var t = this.scrollY / this._scale;
    var r = l + this.width / this._scale;
    var b = t + this.height / this._scale;
    var scripts = this.scripts;
    for (var i = scripts.length; i--;) {
      var s = scripts[i];
      s.visible = s.x < r && s.x + s.width > l && s.y < b && s.y + s.ownHeight > t;
    }
  };

  Workspace.prototype.layout = function() {
    var px = this.paddingLeft;
    var py = this.paddingTop;
    var x = px;
    var y = py;
    var width = 0;
    var height = 0;

    var scripts = this.scripts;
    for (var i = scripts.length; i--;) {
      var script = scripts[i];
      if (script === this.dragScript) return;
      if (script.isScript && script.blocks.length === 0) {
        this.remove(script);
        continue;
      }
      x = Math.min(x, script.x);
      y = Math.min(y, script.y);
      width = Math.max(width, script.x - x + script.ownWidth);
      height = Math.max(height, script.y - y + script.ownHeight);
    }

    if (x < px || y < py) {
      x -= px;
      y -= py;
      this.scripts.forEach(function(script) {
        script.moveTo(script.x - x, script.y - y);
      });
      width -= x;
      height -= y;
    } else {
      width += x;
      height += y;
    }

    width += this.paddingRight;
    height += this.paddingBottom;

    this.contentWidth = width;
    this.contentHeight = height;

    this.refill();
  };

  Workspace.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    this.scripts.forEach(function(s) {
      if (s.setScale) s.setScale(value);
    });
    this.refill();
    return this;
  };

  Workspace.prototype.resize = function() {
    this.width = this.el.offsetWidth;
    this.height = this.el.offsetHeight;
    this.refill();
  };

  Workspace.prototype.refill = function() {
    var w = this.contentWidth*this._scale;
    var h = this.contentHeight*this._scale;
    if (!this.isPalette) {
      w = Math.max(w, this.scrollX + this.width + this.paddingRight);
      h = Math.max(h, this.scrollY + this.height + this.paddingBottom);
    }
    this.elContents.style.width = w+'px';
    this.elContents.style.height = h+'px';
    this.updateVisibility();
  };

  Workspace.prototype.cleanUp = function() {
    var scripts = this.scripts;
    scripts.sort(function(a, b) {
      return a.y - b.y;
    });
    var y = this.paddingTop;
    var length = scripts.length;
    for (var i = 0; i < length; i++) {
      var s = scripts[i];
      s.moveTo(this.paddingLeft, y);
      y += s.height + this.spacing;
    }
    this.layout();
  };

  eventEmitter(Workspace);


  function Palette(host) {
    Workspace.call(this, host);

    this.cx = this.paddingLeft;
    this.cy = this.paddingTop;
    this.lineHeight = 0;
    this.line = [];
  }

  Palette.space = function(size) {
    return {
      isSpace: true,
      size: size == null ? Palette.prototype.spaceSize : size
    };
  };

  Palette.element = function(el, w, h) {
    return new PaletteElement(el, w, h);
  };

  Palette.inline = function(el, w, h) {
    return new PaletteElement(el, w, h, true);
  };

  Palette.prototype = Object.create(Workspace.prototype);
  Palette.prototype.constructor = Palette;

  Palette.prototype.isPalette = true;
  Palette.prototype.paddingLeft = 10;
  Palette.prototype.paddingTop = 10;
  Palette.prototype.paddingRight = 10;
  Palette.prototype.paddingBottom = 10;
  Palette.prototype.spacing = 7;
  Palette.prototype.spaceSize = 24;

  Palette.prototype.cleanUp = undefined;

  Palette.prototype.add = function(script) {
    if (script.parent) script.parent.remove(script);

    if (!script.isSpace) script.setScale(this._scale);
    this.scripts.push(script);
    script.parent = this;

    if (script.isSpace) {
      this.cy += script.size - this.spacing;
      this.lineHeight = 0;
    } else {
      script.moveTo(this.cx, this.cy);

      script.layoutChildren();
      script.drawChildren();
      this.lineHeight = Math.max(this.lineHeight, script.ownHeight);
      this.contentWidth = Math.max(this.contentWidth, this.cx + script.ownWidth + this.paddingRight);
      if (script.isInline) {
        this.line.push(script);
        this.cx += script.ownWidth + this.spacing;
      } else {
        for (var i = this.line.length; i--;) {
          var s = this.line[i];
          s.moveTo(s.x, this.cy + (this.lineHeight - s.ownHeight) / 2 | 0);
        }
        this.cy += this.lineHeight + this.spacing;
      }
      this.elContents.appendChild(script.el);
    }

    if (!script.isInline) {
      this.cx = this.paddingLeft;
      this.lineHeight = 0;
      this.line = [];
    }
    this.contentHeight = this.cy + this.lineHeight + this.paddingBottom;

    this.refill();
    return this.dispatch('change');
  };

  Palette.prototype.addAll = function(scripts) {
    scripts.forEach(this.add, this);
    return this;
  };

  Palette.prototype.insert = function(script, before) {
    if (!before || before.parent !== this) return this.add(script);

    if (script.parent) script.parent.remove(script);

    var i = this.scripts.indexOf(before);
    this.scripts.splice(i, 0, script);
    if (!script.isSpace) script.setScale(this._scale);
    script.parent = this;

    if (!script.isSpace) {
      script.layoutChildren();
      script.drawChildren();
      this.elContents.appendChild(script.el);
    }

    this.layout();
    return this.dispatch('change');
  };

  Palette.prototype.clear = function() {
    Workspace.prototype.clear.call(this);
    this.cx = this.paddingLeft;
    this.cy = this.paddingTop;
    this.lineHeight = 0;
    this.line = [];
    this.scrollTo(0, 0);
    return this;
  };

  Palette.prototype.layout = function() {
    var px = this.paddingLeft;
    var py = this.paddingTop;
    var sp = this.spacing;

    var y = py;
    var x = px;
    var w = 0;
    var lh = 0;
    var line = [];
    var scripts = this.scripts;
    var length = scripts.length;
    for (var i = 0; i < length; i++) {
      var s = scripts[i];
      if (s.isSpace) {
        y += s.size - sp;
        lh = 0;
      } else {
        s.moveTo(x, y);
        lh = Math.max(lh, s.ownHeight);
        w = Math.max(w, x + s.ownWidth);
        if (s.isInline) {
          line.push(s);
          x += s.ownWidth + sp;
        } else {
          for (var j = line.length; j--;) {
            var s2 = line[j];
            s2.moveTo(s2.x, y + (lh - s2.ownHeight) / 2 | 0);
          }
          y += s.ownHeight + sp;
        }
      }
      if (!s.isInline) {
        x = px;
        lh = 0;
        line = [];
      }
    }

    if (s && s.isInline) {
      this.lineHeight = lh;
      this.line = line;
    } else {
      this.lineHeight = 0;
      this.line = [];
    }
    this.cx = x;
    this.cy = y;

    this.contentHeight = y + lh + this.paddingBottom;
    this.contentWidth = w + this.paddingRight;
    this.refill();
  };

  function PaletteElement(content, width, height, inline) {
    this.isInline = inline;
    this.width = this.ownWidth = width;
    this.height = this.ownHeight = height;
    this.el = el('Visual-absolute');
    content.style.display = 'block';
    this.el.appendChild(this.content = content);
    content.classList.add('Visual-absolute');
  }

  PaletteElement.prototype.isElement = true;

  PaletteElement.prototype.parent = null;
  PaletteElement.prototype._scale = 1;
  PaletteElement.prototype.x = 0;
  PaletteElement.prototype.y = 0;
  PaletteElement.prototype.dirty = true;

  PaletteElement.prototype.objectFromPoint = opaqueObjectFromPoint;

  PaletteElement.prototype.layoutSelf = function() {};

  PaletteElement.prototype.setScale = function(value) {
    if (this._scale === value) return this;
    this._scale = value;
    setTransform(this.content, 'scale('+value+')');
    this.moveTo(this.x, this.y);
    return this;
  }

  PaletteElement.prototype.layoutChildren = layoutNoChildren;
  PaletteElement.prototype.drawChildren = function() {};
  PaletteElement.prototype.layout = layout;
  PaletteElement.prototype.moveTo = scaledMoveTo;
  PaletteElement.prototype.slideTo = scaledSlideTo;


  function Target(host) {
    this.el = host;
    this.resize();
  }

  Target.prototype.isWorkspace = true;
  Target.prototype.isTarget = true;

  Target.prototype._scale = 1;
  Target.prototype.scrollX = 0;
  Target.prototype.scrollY = 0;

  def(Target.prototype, 'app', {get: getApp});
  def(Target.prototype, 'workspace', {get: function() {return this}});
  def(Target.prototype, 'workspacePosition', {get: function() {return {x: 0, y: 0}}});
  def(Target.prototype, 'worldPosition', {get: getWorldPosition});

  Target.prototype.objectFromPoint = opaqueObjectFromPoint;

  Target.prototype.resize = function() {
    this.width = this.el.offsetWidth;
    this.height = this.el.offsetHeight;
  };

  Target.prototype.acceptsDropOf = function(script) {
    return true;
  };

  Target.prototype.showFeedback = function(script) {
    this.el.classList.add('feedback');
  };

  Target.prototype.hideFeedback = function() {
    this.el.classList.remove('feedback');
  };

  Target.prototype.drop = function(script) {
    return true;
  };

  Target.prototype.setScale = function() {
    return this;
  };


  function App() {
    this.children = [];
    this.workspaces = [];
    this.palettes = [];
    this.menus = [];

    this.gestures = [];
    this.feedbackPool = [];
    this.feedback = this.createFeedback();

    document.body.appendChild(this.elScripts = el('Visual-absolute Visual-dragging'));

    document.addEventListener('mousedown', this.mouseDown.bind(this), true);
    document.addEventListener('mousemove', this.mouseMove.bind(this));
    document.addEventListener('mouseup', this.mouseUp.bind(this), true);
    document.addEventListener('touchstart', this.touchStart.bind(this), true);
    document.addEventListener('touchmove', this.touchMove.bind(this));
    document.addEventListener('touchend', this.touchEnd.bind(this), true);
    document.addEventListener('touchcancel', this.touchEnd.bind(this), true);
    document.addEventListener('contextmenu', this.disableContextMenu.bind(this));
  }

  App.prototype.isApp = true;

  App.prototype.parent = null;
  App.prototype._blockScale = 1;

  App.prototype.dragShadowX = 6; // NS
  App.prototype.dragShadowY = 6;
  App.prototype.dragShadowBlur = 8;
  App.prototype.dragShadowColor = 'rgba(0, 0, 0, .2)';
  // App.prototype.dragShadowX = 6;
  // App.prototype.dragShadowY = 6;
  // App.prototype.dragShadowBlur = 2;
  // App.prototype.dragShadowColor = 'rgba(0, 0, 0, .4)';

  def(App.prototype, 'app', {get: function() {return this}});

  def(App.prototype, 'blockScale', {
    get: function() {return this._blockScale},
    set: function(value) {
      this._blockScale = value;
      this.workspaces.forEach(function(s) {
        s.setScale(value);
      });
    }
  });

  App.prototype.objectFromPoint = function(x, y) {
    var workspaces = this.workspaces;
    for (var i = workspaces.length; i--;) {
      var w = workspaces[i];
      var pos = w.worldPosition;
      var o = w.objectFromPoint(x - pos.x, y - pos.y);
      if (o) return o;
    }
    return null;
  };

  App.prototype.layout = function() {};

  App.prototype.resize = function() {
    this.children.forEach(resize);
  };

  App.prototype.add = function(thing) {
    if (thing.parent) thing.parent.remove(thing);

    thing.parent = this;
    this.children.push(thing);

    if (thing.isPalette) {
      this.palettes.push(thing);
    }
    if (thing.isWorkspace) {
      this.workspaces.push(thing);
      thing.setScale(this._blockScale);
    }
    if (thing.isMenu) {
      this.menus.push(thing);
      document.body.appendChild(thing.el);
    }
    if (thing.install) {
      thing.install(this);
    }

    return this;
  };

  App.prototype.remove = function(thing) {
    if (thing.parent !== this) return this;
    thing.parent = null;
    var i = this.children.indexOf(thing);
    if (i !== -1) this.children.splice(i, 1);

    if (thing.isPalette) {
      var i = this.palettes.indexOf(thing);
      if (i !== -1) this.palettes.splice(i, 1);
    }
    if (thing.isWorkspace) {
      var i = this.workspaces.indexOf(thing);
      if (i !== -1) this.workspaces.splice(i, 1);
    }
    if (thing.isMenu) {
      var i = this.menus.indexOf(thing);
      if (i !== -1) this.menus.splice(i, 1);
      thing.el.parentNode.removeChild(thing.el);
    }
    if (thing.uninstall) {
      thing.uninstall(this);
    }

    return this;
  };

  App.prototype.grab = function(script, offsetX, offsetY, g) {
    if (!g) g = this.createGesture(this);
    this.drop(g);
    g.dragging = true;

    if (offsetX === undefined) {
      var pos = script.worldPosition;
      offsetX = pos.x - g.pressX;
      offsetY = pos.y - g.pressY;
    }
    g.dragX = offsetX;
    g.dragY = offsetY;

    if (script.parent) {
      script.parent.remove(script);
    }

    g.dragScript = script;
    g.dragScript.moveTo((g.dragX + g.mouseX) / this._blockScale, (g.dragY + g.mouseY) / this._blockScale);
    g.dragScript.parent = this;
    this.elScripts.appendChild(g.dragScript.el);
    g.dragScript.layoutChildren();
    g.dragScript.drawChildren();
    g.dragScript.addShadow(this.dragShadowX, this.dragShadowY, this.dragShadowBlur, this.dragShadowColor);
    this.showFeedback(g);
  };

  App.prototype.hideMenus = function() {
    if (!this.menus.length) return this;
    this.menus.forEach(function(m) {
      m.el.parentNode.removeChild(m.el);
      m.parent = null;
    });
    this.menus = [];
    return this;
  };

  App.prototype.mouseDown = function(e) {
    var p = {clientX: e.clientX, clientY: e.clientY, identifier: this};
    if (!this.startGesture(p, e)) return;
    this.gestureDown(p, e);
  };

  App.prototype.mouseMove = function(e) {
    var p = {clientX: e.clientX, clientY: e.clientY, identifier: this};
    this.updateMouse(p, e);
    this.gestureMove(p, e);
  };

  App.prototype.mouseUp = function(e) {
    var p = {clientX: e.clientX, clientY: e.clientY, identifier: this};
    this.updateMouse(p, e);
    this.gestureUp(p, e);
  };

  App.prototype.touchStart = function(e) {
    var touch = e.changedTouches[0];
    var p = {clientX: touch.clientX, clientY: touch.clientY, identifier: touch.identifier};
    if (!this.startGesture(p, e)) return;
    this.gestureDown(p, e);
    for (var i = e.changedTouches.length; i-- > 1;) {
      touch = e.changedTouches[i];
      this.gestureDown({clientX: touch.clientX, clientY: touch.clientY, identifier: touch.identifier}, e);
    }
  };

  App.prototype.touchMove = function(e) {
    var touch = e.changedTouches[0];
    var p = {clientX: touch.clientX, clientY: touch.clientY, identifier: touch.identifier};
    this.updateMouse(p, e);
    this.gestureMove(p, e);
    for (var i = e.changedTouches.length; i-- > 1;) {
      var touch = e.changedTouches[i];
      this.gestureMove({clientX: touch.clientX, clientY: touch.clientY, identifier: touch.identifier}, e);
    }
  };

  App.prototype.touchEnd = function(e) {
    var touch = e.changedTouches[0];
    var p = {clientX: touch.clientX, clientY: touch.clientY, identifier: touch.identifier};
    this.updateMouse(p, e);
    this.gestureUp(p, e);
    for (var i = e.changedTouches.length; i-- > 1;) {
      var touch = e.changedTouches[i];
      this.gestureUp({clientX: touch.clientX, clientY: touch.clientY, identifier: touch.identifier}, e);
    }
  };

  App.prototype.startGesture = function(p, e) {
    this.updateMouse(p, e);
    this.menuMouseDown(e);

    var pressType = this.pressType(e);
    if (pressType !== 'workspace' && (pressType !== 'input' || e.button === 2)) return false;
    if (this.dragging) {
      this.drop();
      return false;
    }
    return true;
  };

  App.prototype.createFeedback = function() {
    if (this.feedbackPool.length) {
      return this.feedbackPool.pop();
    }
    var feedback = el('canvas', 'Visual-absolute Visual-feedback');
    var feedbackContext = feedback.getContext('2d');
    feedback.style.display = 'none';
    document.body.appendChild(feedback);
    return feedbackContext;
  };

  App.prototype.destroyFeedback = function(feedback) {
    if (feedback) {
      this.feedbackPool.push(feedback);
    }
  };

  App.prototype.createGesture = function(id) {
    if (id === this) {
      var g = this;
    } else {
      this.destroyGesture(id);
      g = this.getGesture(id);
    }
    return g;
  };

  App.prototype.getGesture = function(id) {
    if (id === this) return this;
    var g = this.gestures[id];
    if (g) return g;
    return this.gestures[id] = {feedback: this.createFeedback()};
  };

  App.prototype.destroyGesture = function(id) {
    var g = id === this ? this : this.gestures[id];
    if (g) {
      if (g.dragging) this.drop(g);
      this.destroyFeedback(g.feedback);

      g.pressed = false;
      g.pressObject = null;
      g.dragging = false;
      g.resizing = false;
      g.shouldDrag = false;
      g.shouldResize = false;
      g.dragScript = null;

      delete this.gestures[id];
    }
  };

  App.prototype.gestureDown = function(p, e) {
    var g = this.createGesture(p.identifier);
    g.pressX = g.mouseX = p.clientX;
    g.pressY = g.mouseY = p.clientY;
    g.pressObject = this.objectFromPoint(g.pressX, g.pressY);
    g.shouldDrag = false;
    g.shouldResize = false;

    if (g.pressObject) {
      var leftClick = e.button === 0 || e.button === undefined;
      if (e.button === 2 || leftClick && e.ctrlKey) {
        this.hideMenus();
        var cm = (g.pressObject || this).contextMenu;
        if (cm) cm.show(this);
        e.preventDefault();
      } else if (leftClick) {
        if (g.pressObject.isResizable) {
          var pos = g.pressObject.worldPosition;
          g.shouldResize = g.pressObject.resizableAt(g.pressX - pos.x, g.pressY - pos.y);
        }
        g.shouldDrag = !g.shouldResize && g.pressObject.isDraggable && !((g.pressObject.isTextArg || g.pressObject.isComment) && e.target === g.pressObject.field);
      }
    }

    if (g.shouldDrag || g.shouldResize) {
      document.activeElement.blur();
      e.preventDefault();
    }

    g.pressed = true;
    g.dragging = false;
  };

  App.prototype.gestureMove = function(p, e) {
    var g = this.getGesture(p.identifier);
    g.mouseX = p.clientX;
    g.mouseY = p.clientY;
    if (g.dragging) {
      g.dragScript.moveTo((g.dragX + g.mouseX) / this._blockScale, (g.dragY + g.mouseY) / this._blockScale);
      this.showFeedback(g);
      e.preventDefault();
    } else if (g.pressed && g.shouldDrag) {
      var block = g.pressObject.dragObject;
      g.dragWorkspace = block.workspace;
      g.dragPos = block.workspacePosition;
      g.dragState = block.state;
      var pos = block.worldPosition;
      this.grab(block.detach(), pos.x - g.pressX, pos.y - g.pressY, g);
      e.preventDefault();
    } else if (g.resizing) {
      g.pressObject.resizeTo(Math.max(g.pressObject.minWidth, (g.dragWidth + g.mouseX) / this._blockScale | 0), Math.max(g.pressObject.minHeight, (g.dragHeight + g.mouseY) / this._blockScale | 0));
    } else if (g.shouldResize) {
      g.resizing = true;
      g.dragWidth = g.pressObject.width * this._blockScale - g.pressX;
      g.dragHeight = g.pressObject.height * this._blockScale - g.pressY;
    }
  };

  App.prototype.gestureUp = function(p, e) {
    var g = this.getGesture(p.identifier);
    g.mouseX = p.clientX;
    g.mouseY = p.clientY;
    if (g.dragging) {
      this.drop(g);
    } else if (g.resizing) {
    } else if (g.shouldDrag || g.shouldResize) {
      g.pressObject.click(g.pressX, g.pressY);
    }
    this.destroyGesture(p.identifier);
  };

  App.prototype.disableContextMenu = function(e) {
    var pressType = this.pressType(e);
    if (pressType === 'workspace' || pressType === 'menu') {
      e.preventDefault();
    }
  };

  App.prototype.pressType = function(e) {
    var t = e.target;
    var workspaceEls = this.workspaces.map(getEl);
    var menuEls = this.menus.map(getEl);
    var isInput = false;
    while (t) {
      var n = t.tagName;
      if (n === 'INPUT' || n === 'TEXTAREA' || t === 'SELECT') isInput = true;
      if (workspaceEls.indexOf(t) !== -1) return isInput ? 'input' : 'workspace';
      if (menuEls.indexOf(t) !== -1) return 'menu';
      t = t.parentNode;
    }
    return null;
  };

  App.prototype.menuMouseDown = function(e) {
    if (!this.menus.length) return;

    var t = e.target;
    var els = this.menus.map(getEl);
    while (t) {
      if (els.indexOf(t) === 0) return;
      t = t.parentNode;
    }

    this.hideMenus();
  };

  App.prototype.updateMouse = function(p, e) {
    var menus = this.menus;
    if (menus.length) {
      for (var i = menus.length; i--;) {
        menus[i].updateMouse(e);
      }
    }
  };

  App.prototype.drop = function(g) {
    if (!g) g = this.getGesture(this);
    if (!g.dragging) return;

    var script = g.dragScript;
    var workspace = g.dragWorkspace;
    var dragPos = g.dragPos;
    var state = g.dragState;

    this.elScripts.removeChild(g.dragScript.el);
    g.dragScript.parent = null;
    g.dragScript.removeShadow();
    g.feedback.canvas.style.display = 'none';

    var handled = false;
    if (g.feedbackInfo) {
      this.applyDrop(g);
      handled = true;
    } else if (g.dropWorkspace) {
      handled = true;
      if (g.dropWorkspace.isTarget) {
        g.dropWorkspace.hideFeedback();
        handled = g.dropWorkspace.drop(g.dragScript);
      } else if (!g.dropWorkspace.isPalette) {
        var pos = g.dropWorkspace.worldPosition;
        g.dropWorkspace.add((g.dragX + g.mouseX - pos.x) / this._blockScale, (g.dragY + g.mouseY - pos.y) / this._blockScale, script);
      }
    }
    if (!handled && workspace && !workspace.isPalette) {
      g.dragScript.addShadow(g.dragShadowX, g.dragShadowY, g.dragShadowBlur, g.dragShadowColor);
      this.elScripts.appendChild(g.dragScript.el);

      var pos = workspace.worldPosition;
      script.slideTo(dragPos.x + pos.x / this._blockScale, dragPos.y + pos.y / this._blockScale, function() {
        this.elScripts.removeChild(script.el);
        script.removeShadow();
        script.restore(state);
      }, this);
    }

    g.dragging = false;
    g.dragPos = null;
    g.dragState = null;
    g.dragWorkspace = null;
    g.dragScript = null;
    g.dropWorkspace = null;
    g.feedbackInfo = null;
    g.commandScript = null;
  };

  App.prototype.applyDrop = function(g) {
    var info = g.feedbackInfo;
    switch (info.type) {
      case 'append':
        info.script.add(g.dragScript);
        return;
      case 'insert':
        info.script.insert(g.dragScript, info.block);
        return;
      case 'wrap':
        info.script.parent.add(info.script.x - g.commandScript.x, info.script.y - g.commandScript.y, g.dragScript);
        g.commandScript.value = info.script;
        info.script.layoutChildren();
        return;
      case 'replace':
        if (info.arg.isBlock) {
          var pos = info.arg.workspacePosition;
        }
        info.block.replace(info.arg, g.dragScript.blocks[0]);
        if (info.arg.isBlock) {
          info.block.workspace.add(pos.x + 20, pos.y + 20, new Script().add(info.arg));
        }
        return;
    }
  };

  App.prototype.showAllFeedback = function() {
    var g = this.gestures;
    for (var k in g) if (hasOwnProperty.call(g, k)) {
      this.showFeedback(g[k]);
    }
    if (this.dragScript) this.showFeedback(this);
  };

  App.prototype.showFeedback = function(g) {
    this.resetFeedback(g);
    if (g.dragScript.isReporter) {
      this.updateReporterFeedback(g);
    } else if (g.dragScript.isScript) {
      this.updateCommandFeedback(g);
    } else if (g.dragScript.isComment) {
      this.updateCommentFeedback(g);
    }
    if (g.feedbackInfo) {
      this.renderFeedback(g);
      g.feedback.canvas.style.display = 'block';
    } else {
      if (g.dropWorkspace && g.dropWorkspace.isTarget) {
        g.dropWorkspace.showFeedback(g.dragScript);
      }
      g.feedback.canvas.style.display = 'none';
    }
  };

  App.prototype.resetFeedback = function(g) {
    g.feedbackDistance = Infinity;
    g.feedbackInfo = null;
    if (g.dropWorkspace && g.dropWorkspace.isTarget) {
      g.dropWorkspace.hideFeedback();
    }
    g.dropWorkspace = null;
  };

  App.prototype.commandFeedbackRange = 70;
  App.prototype.feedbackRange = 20;

  App.prototype.updateCommandFeedback = function(g) {
    g.commandHasHat = g.dragScript.hasHat;
    g.commandHasFinal = g.dragScript.hasFinal;
    g.commandScript = null;
    var args = g.dragScript.blocks[0].args;
    var length = args.length;
    for (var i = 0; i < length; i++) {
      if (args[i]._type === 't') {
        if (!args[i].script.blocks.length) g.commandScript = args[i];
        break;
      }
    }
    this.updateFeedback(g, this.addScriptCommandFeedback);
  };

  App.prototype.updateReporterFeedback = function(g) {
    this.updateFeedback(g, this.addScriptReporterFeedback);
  };

  App.prototype.updateCommentFeedback = function(g) {
    this.updateFeedback(g, function() {});
  };

  App.prototype.updateFeedback = function(g, p) {
    var workspaces = this.workspaces;
    for (var i = workspaces.length; i--;) {
      var ws = workspaces[i];
      var pos = ws.worldPosition;
      if (ws.el !== document.body) {
        var x = pos.x + ws.scrollX;
        var y = pos.y + ws.scrollY;
        var w = ws.width;
        var h = ws.height;
      }
      if (ws.el === document.body || g.mouseX >= x && g.mouseX < x + w && g.mouseY >= y && g.mouseY < y + h) {
        if (ws.isTarget && !ws.acceptsDropOf(g.dragScript)) continue;
        g.dropWorkspace = ws;
        if (ws.isPalette || ws.isTarget) return;

        var scripts = ws.scripts;
        var l = scripts.length;
        for (var j = 0; j < l; j++) {
          p.call(this, g, pos.x, pos.y, scripts[j]);
        }
        return;
      }
    }
  };

  App.prototype.addScriptCommandFeedback = function(g, x, y, script) {
    if (!script.isScript) return;
    x += script.x * this._blockScale;
    y += script.y * this._blockScale;
    if (!script.hasFinal && !script.isReporter && !g.commandHasHat) {
      this.addFeedback(g, {
        x: x,
        y: y + script.height * this._blockScale,
        feedbackY: y + script.height * this._blockScale,
        rangeX: this.commandFeedbackRange,
        rangeY: this.feedbackRange,
        type: 'append',
        script: script
      });
    }
    if (g.commandScript && script.parent.isWorkspace && !script.hasHat && !script.isReporter) {
      this.addFeedback(g, {
        x: x,
        y: y - g.commandScript.y * this._blockScale,
        feedbackY: y,
        rangeX: this.commandFeedbackRange,
        rangeY: this.feedbackRange,
        type: 'wrap',
        script: script
      });
    }
    var blocks = script.blocks;
    var length = blocks.length;
    for (var i = 0; i < length; i++) {
      this.addBlockCommandFeedback(g, x, y, blocks[i], i === 0);
    }
  };

  App.prototype.addBlockCommandFeedback = function(g, x, y, block, isTop) {
    y += block.y * this._blockScale;
    x += block.x * this._blockScale;
    var args = block.args;
    var length = args.length;
    for (var i = 0; i < length; i++) {
      var a = args[i];
      if (a.isBlock) {
        this.addBlockCommandFeedback(g, x, y, a);
      } else if (a._type === 't' && !g.commandHasHat) {
        this.addScriptCommandFeedback(g, x + a.x * this._blockScale, y + a.y * this._blockScale, a.script);
      }
    }
    if (isTop && block.isHat || !isTop && g.commandHasHat || g.commandHasFinal || block.isReporter) return;
    this.addFeedback(g, {
      x: x,
      y: isTop && block.parent.parent.isWorkspace ? y - g.dragScript.height * this._blockScale : y,
      feedbackY: y,
      rangeX: this.commandFeedbackRange,
      rangeY: this.feedbackRange,
      type: 'insert',
      script: block.parent,
      block: block
    });
  };

  App.prototype.addScriptReporterFeedback = function(g, x, y, script) {
    if (!script.isScript) return;
    x += script.x * script._scale;
    y += script.y * script._scale;
    var blocks = script.blocks;
    var length = blocks.length;
    for (var i = 0; i < length; i++) {
      this.addBlockReporterFeedback(g, x, y, blocks[i]);
    }
  };

  App.prototype.addBlockReporterFeedback = function(g, x, y, block) {
    x += block.x * block._scale;
    y += block.y * block._scale;
    var args = block.args;
    var length = args.length;
    for (var i = 0; i < length; i++) {
      var a = args[i];
      var ax = x + a.x * this._blockScale;
      var ay = y + a.y * this._blockScale;
      if (a._type === 't') {
        this.addScriptReporterFeedback(g, ax, ay, a.script);
      } else {
        if (a.isBlock) {
          this.addBlockReporterFeedback(g, x, y, a);
        }
      }
      if (a.acceptsDropOf(g.dragScript.blocks[0])) {
        this.addFeedback(g, {
          x: ax,
          y: ay,
          rangeX: this.feedbackRange,
          rangeY: this.feedbackRange,
          type: 'replace',
          block: block,
          arg: a
        });
      }
    }
  };

  App.prototype.addFeedback = function(g, obj) {
    var dx = obj.x - g.dragScript.x * this._blockScale;
    var dy = obj.y - g.dragScript.y * this._blockScale;
    var d2 = dx * dx + dy * dy;
    if (Math.abs(dx) > obj.rangeX * this._blockScale || Math.abs(dy) > obj.rangeY * this._blockScale || d2 > g.feedbackDistance) return;
    g.feedbackDistance = d2;
    g.feedbackInfo = obj;
  };

  App.prototype.feedbackLineWidth = 6;
  App.prototype.feedbackColor = '#fff';

  App.prototype.renderFeedback = function(g) {
    var info = g.feedbackInfo
    var context = g.feedback;
    var canvas = g.feedback.canvas;
    var b = g.dragScript.blocks[0];
    var s = this._blockScale;
    var l = this.feedbackLineWidth;
    var r = l/2;

    var pi = b.puzzleInset * s;
    var pw = b.puzzleWidth * s;
    var p = b.puzzle * s;

    var x, y;
    switch (info.type) {
      case 'wrap':
        x = info.x - r;
        y = info.feedbackY - r;
        var w = (b.ownWidth - g.commandScript.x) * s + l;
        var h = info.script.height * s + l;
        canvas.width = w;
        canvas.height = h + p;

        context.lineWidth = l;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = this.feedbackColor;
        context.moveTo(w - r, r);
        context.lineTo(pi + pw + p * 2 + r, r);
        context.lineTo(pi + pw + p + r, r + p);
        context.lineTo(pi + p + r, r + p);
        context.lineTo(pi + r, r);
        context.lineTo(r, r);
        context.lineTo(r, h - r);
        // context.lineTo(pi + r, h - r)
        // context.lineTo(pi + p + r, h - r + p);
        // context.lineTo(pi + pw + p + r, h - r + p);
        // context.lineTo(pi + pw + p * 2 + r, h - r);
        context.lineTo(w - r, h - r);
        context.stroke();
        break;
      case 'insert':
      case 'append':
        x = info.x - r;
        y = info.feedbackY - r;
        canvas.width = b.ownWidth * s + l;
        canvas.height = l + p;
        context.lineWidth = l;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = this.feedbackColor;
        context.moveTo(r, r);
        context.lineTo(pi + r, r);
        context.lineTo(pi + p + r, r + p);
        context.lineTo(pi + pw + p + r, r + p);
        context.lineTo(pi + pw + p * 2 + r, r);
        context.lineTo(canvas.width - r, r);
        context.stroke();
        break;
      case 'replace':
        x = info.x - l;
        y = info.y - l;
        var w = info.arg.width * s;
        var h = info.arg.height * s;
        canvas.width = w + l * 2;
        canvas.height = h + l * 2;

        context.translate(l, l);
        context.scale(s, s);

        info.arg.pathShadowOn(context);

        context.lineWidth = l / this._blockScale;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = this.feedbackColor;
        context.stroke();

        context.globalCompositeOperation = 'destination-out';
        context.beginPath();
        info.arg.pathShadowOn(context);
        context.fill();
        context.globalCompositeOperation = 'source-over';
        context.globalAlpha = .6;
        context.fillStyle = this.feedbackColor;
        context.fill();
        break;
      // case 'replace': // Scratch 2.0
      //   var w = info.arg.width;
      //   var h = info.arg.height;
      //   l += 1;
      //   canvas.width = w + l * 2;
      //   canvas.height = h + l * 2;
      //   setTransform(canvas, 'translate('+(info.x - l)+'px, '+(info.y - l)+'px)');

      //   context.translate(l, l);

      //   context.save();
      //   context.translate(-10000, -10000);
      //   info.arg.pathShadowOn(context);

      //   context.lineWidth = l;
      //   context.lineCap = 'round';
      //   context.shadowOffsetX = 10000;
      //   context.shadowOffsetY = 10000;
      //   context.shadowBlur = r;
      //   context.shadowColor = this.feedbackColor;
      //   context.stroke();
      //   context.restore();

      //   context.globalCompositeOperation = 'destination-out';
      //   info.arg.pathShadowOn(context);
      //   context.fill();
      //   return;
    }
    if (x != null) {
      setTransform(canvas, 'translate('+x+'px,'+y+'px)');
    }
  };


  function Menu(items) {
    this.el = el('Visual-menu Visual-no-select');
    this.el.appendChild(this.field = el('input', 'Visual-menu-field'));

    this.selectedIndex = -1;
    this.items = [];

    items = slice.call(arguments);
    if (typeof items[0] === 'function') {
      this.action = items.shift();
    }
    this.addAll(items);

    this.ignoreMouse = true;
    this.cancelTyping = this.cancelTyping.bind(this);

    this.el.addEventListener('mouseup', this.mouseUp.bind(this), true);
    this.el.addEventListener('touchend', this.mouseUp.bind(this), true);
    this.change = this.change.bind(this);
    this.field.addEventListener('keydown', this.keyDown.bind(this));
    this.field.addEventListener('input', this.input.bind(this));
  }

  Menu.line = {};

  Menu.prototype.isMenu = true;

  Menu.prototype.parent = null;
  Menu.prototype.x = 0;
  Menu.prototype.y = 0;

  Menu.prototype.padding = 4;
  Menu.prototype.allowTyping = true;

  def(Menu.prototype, 'app', {get: getApp});

  Menu.prototype.withAction = function(action, context) {
    this.action = action;
    this.context = context;
    return this;
  };

  Menu.prototype.withContext = function(context) {
    this.context = context;
    return this;
  };

  Menu.prototype.createItem = function(item) {
    return typeof item === 'object' ? item : [item, item];
  };

  Menu.prototype.add = function(item) {
    this.items.push(this.createItem(item));
    return this;
  };

  Menu.prototype.insert = function(i, item) {
    this.items.splice(i, 0, this.createItem(item));
    return this;
  };

  Menu.prototype.addLine = function() {
    return this.add(Menu.line);
  };

  Menu.prototype.insertLine = function(i) {
    return this.insert(i, Menu.line);
  };

  Menu.prototype.translateItem = function(item) {
    if (item === Menu.line) return item;
    item = this.createItem(item);
    item = [options.getText(item[0]), item[1]];
    item.translated = true;
    return item;
  };

  Menu.prototype.addTranslated = function(item) {
    return this.add(this.translateItem(item));
  };

  Menu.prototype.insertTranslated = function(i, item) {
    return this.insert(i, this.translateItem(item));
  };

  Menu.prototype.addAll = function(items) {
    this.items = this.items.concat(items.map(this.createItem, this));
    return this;
  };

  Menu.prototype.insertAll = function(i, items) {
    this.items.splice.apply(this.items, [i, 0].concat(items.map(this.createItem, this)));
    return this;
  };

  Menu.prototype.addAllTranslated = function(items) {
    return this.addAll(items.map(this.translateItem, this));
  };

  Menu.prototype.insertAllTranslated = function(i, items) {
    return this.insertAll(i, items.map(this.translateItem, this));
  };

  Menu.prototype.translate = function() {
    var items = this.items;
    for (var i = items.length; i--;) {
      var item = items[i];
      if (item && item !== Menu.line && !item.translated) {
        item[0] = options.getText(item[0]);
        item.translated = true;
      }
    }
    return this;
  };

  Menu.prototype.show = function(app) {
    this.showAt(app.mouseX, app.mouseY, app);
  };

  Menu.prototype.showAt = function(x, y, app) {
    var items = this.items;
    var line = true;
    for (var i = items.length; i--;) {
      var has = items[i] === Menu.line;
      if (items[i]) {
        if (has && line) items.splice(i, 1);
        line = has;
      } else {
        items.splice(i, 1);
      }
    }
    if (line) items.shift();
    if (!items.length) return;

    var c = this.el;
    this.els = [];
    for (var i = 0, l = items.length; i < l; i++) {
      var item = items[i];
      if (item === Menu.line) {
        var it = el('Visual-menu-line');
      } else {
        it = el('Visual-menu-item');
        it.textContent = item[0];
        it.dataset.index = i;
        if (item[2]) {
          var file = item[2].file || item[2].files;
          if (file) {
            var input = el('input', 'Visual-menu-file');
            if (typeof file === 'string') input.accept = file;
            if (item[2].files) input.multiple = true;
            input.type = 'file';
            input.addEventListener('change', this.change);
            it.appendChild(input);
          }
          if (item[2].checked) {
            it.classList.add('Visual-menu-checked');
          }
        }
      }
      this.els.push(it);
      c.appendChild(it);
    }

    var p = this.padding;
    app.add(this);
    var w = c.offsetWidth+16;
    var h = c.offsetHeight;
    c.style.width = w+'px';
    c.style.height = h+'px';
    c.style.maxWidth = (window.innerWidth - p * 2)+'px';
    c.style.maxHeight = (window.innerHeight - p * 2)+'px';
    this.moveTo(Math.max(p, Math.min(window.innerWidth - w - p, x)), Math.max(p, Math.min(window.innerHeight - h - p, y)));
    if (this.allowTyping) {
      this.field.focus();
    }
  };

  Menu.prototype.updateMouse = function(e) {
    if (this.ignoreMouse) {
      this.ignoreMouse = false;
      return;
    }
    var t = e.target;
    if (e.changedTouches) {
      var touch = e.changedTouches[0];
      t = document.elementFromPoint(touch.clientX, touch.clientY);
    }
    while (t) {
      if (t.parentNode === this.el && t.dataset.index) {
        this.select(t.dataset.index);
        return;
      }
      t = t.parentNode;
    }
    this.select(-1);
  };

  Menu.prototype.select = function(i) {
    if (this.selectedIndex !== -1) {
      this.els[this.selectedIndex].classList.remove('selected');
    }
    this.selectedIndex = i;
    if (i === -1) return;
    this.els[i].classList.add('selected');
  };

  Menu.prototype.change = function(e) {
    var t = e.target;
    while (t) {
      if (t.parentNode === this.el && t.dataset.index) {
        this.perform(this.items[t.dataset.index], e.target.multiple ? slice.call(e.target.files) : e.target.files[0]);
        return;
      }
      t = t.parentNode;
    }
  };

  Menu.prototype.mouseUp = function(e) {
    if (this.selectedIndex === -1) return;
    if (e.target.tagName === 'INPUT') {
      setTimeout(this.hide.bind(this));
      return;
    }
    this.commit(this.selectedIndex);
  };

  Menu.prototype.commit = function(index, value) {
    this.hide();
    var input = this.els[index].querySelector('input');
    if (input) {
      input.click();
      return;
    }
    var item = this.items[index];
    this.perform(item, item.length > 1 ? item[1] : item[0]);
  };

  Menu.prototype.perform = function(item, value) {
    if (typeof item[1] === 'function') {
      item[1].call(this.context, value, item);
    } else if (typeof this.action === 'function') {
      this.action.call(this.context, value, item);
    }
  };

  Menu.prototype.hide = function() {
    this.app.remove(this);
  };

  Menu.prototype.moveTo = moveTo;
  Menu.prototype.slideTo = slideTo;

  Menu.prototype.typeDelay = 600;
  Menu.prototype.input = function() {
    if (this.typeTimeout) clearTimeout(this.typeTimeout);
    this.typeTimeout = setTimeout(this.cancelTyping, this.typeDelay);
    var search = this.field.value.toLowerCase();
    var sl = search.length;
    var items = this.items;
    for (var i = 0, l = items.length; i < l; i++) {
      if (items[i] !== Menu.line && items[i][0].slice(0, sl).toLowerCase() === search) {
        return this.select(i);
      }
    }
  };

  Menu.prototype.cancelTyping = function() {
    this.typeTimeout = null;
    this.field.value = '';
  };

  Menu.prototype.keyDown = function(e) {
    if (e.keyCode === 13 || e.keyCode === 32 && this.typeTimeout == null) {
      if (this.selectedIndex !== -1) this.commit(this.selectedIndex);
    } else if (e.keyCode === 27) {
      this.hide();
    } else if (e.keyCode === 40) {
      var i = this.selectedIndex;
      do {
        i = (i + 1) % this.items.length;
      } while (this.items[i] === Menu.line);
      this.select(i);
    } else if (e.keyCode === 38) {
      var i = this.selectedIndex;
      do {
        if (i <= 0) {
          i = this.items.length - 1;
        } else {
          i = i - 1;
        }
      } while (this.items[i] === Menu.line);
      this.select(i);
    } else {
      var unused = true;
    }
    if (!unused) e.preventDefault();
  };


  return {
    util: {
      metricsContainer: metricsContainer,
      format: format,
      eventEmitter: eventEmitter,
      obsoleteBlock: obsoleteBlock,
      createMetrics: createMetrics,
      scrollbarWidth: scrollbarWidth,
      moveTo: moveTo,
      slideTo: slideTo,
      containsPoint: containsPoint,
      opaqueObjectFromPoint: opaqueObjectFromPoint,
      setTransform: setTransform,
      setTransition: setTransition,
      numberToColor: numberToColor,
      colorToNumber: colorToNumber
    },
    options: options,
    getCategory: options.getCategory,
    getBlock: options.getBlock,
    getMenu: options.getMenu,
    getText: options.getText,
    Block: Block,
    Label: Label,
    Icon: Icon,
    Arg: Arg,
    Script: Script,
    Comment: Comment,
    Workspace: Workspace,
    Palette: Palette,
    Target: Target,
    App: App,
    Menu: Menu
  };
}
