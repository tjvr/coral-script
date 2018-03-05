(function() {
  'use strict';


  var blocks;
  var vis = Visual({
    strings: {
      '_mouse_': 'mouse-pointer',
      '_edge_': 'edge',
      '_myself_': 'myself',
      '_stage_': 'Stage'
    },
    // for testing translation
    // getText: function(key) {
    //   return '\u2023' + (vis.options.strings[key] || key);
    // },
    categories: {
      undefined: ['Undefined', '#d42828'],
      //1: ['Motion', '#4a6cd4'],
      2: ['Account', '#8a55d7'],
      3: ['Pots', '#bb42c3'],
      //4: ['Pen', '#0e9a6c'], // Scratch 1.4: #009870
      5: ['Events', '#c88330'],
      6: ['Control', '#e1a91a'],
      7: ['Transactions', '#2ca5e2'],
      8: ['Operators', '#5cb712'],
      9: ['Variables', '#ee7d16'], // Scratch 1.4: #f3761d
      10: ['More Blocks', '#632d99'], // #531e99
      11: ['Parameter', '#5947b1'],
      12: ['List', '#cc5b22'], // Scratch 1.4: #d94d11
      20: ['Extension', '#4b4a60'] // #72228c / #672d79
    },
    blocks: {

      // triggers
      //'whenTxLoad': ['h', 'when I 💰 top up', 5],
      'whenTxCredit': ['h', 'when I receive ➕', 5],
      'whenTxDebit': ['h', 'when I spend ➖', 5],

      // account
      'balance': ['r', 'account balance', 2],
      'createFeedItem': ['c', 'post title: %s body: %s to feed', 2, "Nyan", ""],

      // operations
      'potBalance': ['r', 'balance of 🍯 %m.pot', 3, "Giving"],
      'potDeposit': ['c', 'deposit %n into 🍯 %m.pot', 3, "£1", "Savings"],
      'potWithdraw': ['c', 'withdraw %n from 🍯 %m.pot', 3, "£1", "Holiday"],

      // sensing
      'txTimeAndDate': ['r', 'current %m.timeAndDate', 7, 'minute'],

      'txAmount': ['r', 'amount', 7],
      'txDescription': ['r', 'description', 7],
      'txNotes': ['r', 'notes', 7],
      'txLocalAmount': ['r', 'original currency', 7],
      //'txLocalCurrency': ['r', 'local amount', 7],

      'isTopup': ['b', 'is topup?', 7],
      'categoryTest': ['b', 'category is %m.category?', 7, "eating out"],
      'schemeTest': ['b', 'scheme is %m.scheme?', 7, "mastercard"],

      'txMerchantName': ['r', 'merchant name', 7],
      'txMerchantEmoji': ['r', 'merchant emoji', 7],
      'txMerchantCountry': ['r', 'merchant country', 7],

      // operators
      '+': ['r', '%n + %n', 8, '', ''],
      '-': ['r', '%n - %n', 8, '', ''],
      '*': ['r', '%n * %n', 8, '', ''],
      '/': ['r', '%n / %n', 8, '', ''],

      'randomFrom:to:': ['r', 'pick random %n to %n', 8, 1, 10],

      '<': ['b', '%s < %s', 8, '', ''],
      '=': ['b', '%s = %s', 8, '', ''],
      '>': ['b', '%s > %s', 8, '', ''],

      '&': ['b', '%b and %b', 8],
      '|': ['b', '%b or %b', 8],
      'not': ['b', 'not %b', 8],

      'concatenate:with:': ['r', 'join %s %s', 8, 'hello ', 'world'],
      'letter:of:': ['r', 'letter %n of %s', 8, 1, 'world'],
      'stringLength:': ['r', 'length of %s', 8, 'world'],

      '%': ['r', '%n mod %n', 8, '', ''],
      'rounded': ['r', 'round %n', 8, ''],

      'computeFunction:of:': ['r', '%m.mathOp of %n', 8, 'abs', 9],

      // control - sprite
      'doRepeat': ['c', '@loop repeat %n %t', 6, 10],

      'doIf': ['c', 'if %b then %t', 6],
      'doIfElse': ['c', 'if %b then %t else %t', 6],

      'doUntil': ['c', '@loop repeat until %b %t', 6],

      'stop': ['f', 'stop script', 6],

      // variables
      'readVariable': ['r', '%l', 9, 'variable'],

    },
    menus: {
      var: function(arg) {
        var m = new Menu;
        var editor = arg.app.editor;
        m.addAll(editor.stage.variables.map(getName));
        if (editor.selectedSprite.isSprite && editor.selectedSprite.variables.length) {
          if (editor.stage.variables.length) {
            m.add(Menu.line);
          }
          m.addAll(editor.selectedSprite.variables.map(getName));
        }
        return m;
      },
      timeAndDate: function() {
        return new Menu('year', 'month', 'date', 'day of week', 'hour', 'minute', 'second').translate();
      },
      mathOp: function() {
        return new Menu('abs', 'floor', 'ceiling', 'sqrt', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'ln', 'log', 'e ^', '10 ^').translate();
      },
      pot: function(arg) {
        var m = new Menu
        const exec = arg.app.editor.exec;
        m.addAll(exec.pots.map(p => p.name))
        return m
      },
    }
  });

  
  var palettes = {
    2: [
      'balance',
      '--',
      'createFeedItem',
    ],
    3: [
      // pots
      'potDeposit',
      'potWithdraw',
      '--',
      'potBalance',
    ],
    6: [
      // control
      'whenTxCredit',
      'whenTxDebit',
      '---',
      'doIf',
      'doIfElse',
      'doUntil',
      '--',
      'doRepeat',
      '--',
      'stop',
    ],
    7: [
      'txAmount',
      'txDescription',
      'txNotes',
      'txLocalAmount',
      '--',
      'isTopup',
      'categoryTest',
      'schemeTest',
      '--',
      'txMerchantName',
      'txMerchantEmoji',
      'txMerchantCountry',
      '--',
      'txTimeAndDate',
    ],
    8: [
      // operators
      '+',
      '-',
      '*',
      '/',
      '--',
      'randomFrom:to:',
      '--',
      '<',
      '=',
      '>',
      '--',
      '&',
      '|',
      'not',
      '--',
      'concatenate:with:',
      'letter:of:',
      'stringLength:',
      '--',
      '%',
      'rounded',
      '--',
      'computeFunction:of:'
    ],
    9: [
      // variables
      {text: 'Make a Variable', action: 'newVariable'},
      {if: 'variables', then: [
        {all: 'variables'},
        '--',
        ['setVar:to:', {first: 'var'}, '0'],
        ['changeVar:by:', {first: 'var'}, 1],
        ['showVariable:', {first: 'var'}],
        ['hideVariable:', {first: 'var'}],
        '--'
      ]},
    ],
    10: [
      {text: 'Make a Block', action: 'newBlock'},
      {text: 'Add an Extension', action: 'addExtension'},
    ]
  };

  var Workspace = vis.Workspace;
  var Palette = vis.Palette;
  var Script = vis.Script;
  var Comment = vis.Comment;
  var Block = vis.Block;
  var Arg = vis.Arg;
  var Icon = vis.Icon;
  var Menu = vis.Menu;

  function _(key, values) {
    var text = vis.getText(key);
    return values ? vis.util.format(text, values) : text;
  }

  var menusThatAcceptReporters = ['broadcast', 'costume', 'backdrop', 'scene', 'sound', 'spriteOnly', 'spriteOrMouse', 'spriteOrStage', 'touching'];
  Arg.prototype.acceptsDropOf = function(b) {
    return this.type !== 't' && this.type !== 'l' && (this.type !== 'b' || b.isBoolean) && (this.type !== 'm' || menusThatAcceptReporters.indexOf(this.menu) !== -1);
  };

  Workspace.prototype.paddingLeft = 10;
  Workspace.prototype.paddingTop = 10;
  Workspace.prototype.spacing = 10;

  Palette.prototype.paddingLeft = 6;
  Palette.prototype.paddingTop = 7;
  Palette.prototype.paddingRight = 6;
  Palette.prototype.paddingBottom = 6;
  Palette.prototype.spacing = 5;
  Palette.prototype.spaceSize = 15;

  Block.prototype.click = function() {
    var app = this.app;
    if (app && app.exec) {
      app.exec.runScript(this.topScript);
    }
  };

  Block.prototype.groups = [ // NS
    ['changeXposBy:', 'xpos:', 'changeYposBy:', 'ypos:'],
    ['xpos', 'ypos'],
    ['say:', 'think:'],
    ['say:duration:elapsed:from:', 'think:duration:elapsed:from:'],
    ['show', 'hide'],
    ['playSound:', 'doPlaySoundAndWait'],
    ['putPenDown', 'putPenUp'],
    ['setPenHueTo:', 'changePenHueBy:', 'setPenShadeTo:', 'changePenShadeBy:', 'changePenSizeBy:', 'setPenSizeTo:'],
    ['doIf', 'doIfElse'],
    ['mouseX', 'mouseY'],
    ['+', '-', '*', '/', '%'],
    ['&', '|'],
    ['<', '=', '>']
  ];

  Block.prototype.defaultContextMenu = Object.getOwnPropertyDescriptor(Block.prototype, 'contextMenu').get;
  Object.defineProperty(Block.prototype, 'contextMenu', {get: function() {
    var m = this.defaultContextMenu();
    var editor = this.app.editor;
    if (this.name === 'readVariable' || this.name === 'contentsOfList:') {
      var isVar = this.name === 'readVariable';
      if (this.workspace.isPalette) {
        m.insertAllTranslated(0, [
          isVar ? 'rename variable' : 'rename list',
          [isVar ? 'delete variable' : 'delete list', function() {
            if (isVar) {
              editor.removeVariable(this.args[0].value);
            } else {
              editor.removeList(this.args[0].value);
            }
          }.bind(this)],
          Menu.line]);
      } else {
        m.action = function(value) {
          this.args[0].value = value;
        }.bind(this);
        m.addLine();
        var globals = isVar ? editor.stage.variables : editor.stage.lists;
        var locals = isVar ? editor.selectedSprite.variables : editor.selectedSprite.lists;
        m.addAll(globals.map(getName));
        if (editor.selectedSprite.isSprite && locals.length) {
          if (globals.length) m.addLine();
          m.addAll(locals.map(getName));
        }
      }
    } else if (!this.workspace.isPalette) {
      m.addLine();
      m.action = function(value) {
        this.name = value;
        this.infoSpec = vis.getBlock(value)[1];
        this.spec = _(this.infoSpec);
        this.fn = null;
      }.bind(this);
      var gs = this.groups;
      for (var i = gs.length; i--;) {
        var g = gs[i];
        if (g.indexOf(this.name) !== -1) {
          for (var j = 0, l = g.length; j < l; j++) {
            var b = vis.getBlock(g[j]);
            m.add([_(b[1]).replace(/%[\w.]+/g, '').trim(), b[2]]);
          }
        }
      }
    }
    return m;
  }});

  Block.prototype.help = function() {
    // TODO
    Dialog.alert(_('Help'), _('Help is not available yet.')).show(this.app.editor);
  };

  Arg.prototype.menuTranslations = {
    'attribute': ['x position', 'y position', 'direction', 'costume #', 'costume name', 'size', 'volume', 'backdrop #', 'backdrop name', 'volume'],
    'backdrop': ['next backdrop', 'previous backdrop'],
    'broadcast': ['new message...'],
    'list': ['delete list', 'rename list'],
    'sound': ['record...'],
    'var': ['delete variable', 'rename variable'],
    'costume': [],
    'key': ['up arrow', 'down arrow', 'left arrow', 'right arrow', 'space']
  };

  Arg.prototype.shouldTranslate = function(value) {
    if (this.type === 'l') return false;
    if (['spriteOnly', 'spriteOrMouse', 'spriteOrStage', 'touching'].indexOf(this.menu) !== -1) {
      return ['_myself_', '_mouse_', '_edge_', '_stage_'].indexOf(value) !== -1;
    }
    var translations = this.menuTranslations[this.menu];
    return translations ? translations.indexOf(value) !== -1 : true;
  };

  Icon.prototype.icons.turnRight = {
    width: 16,
    height: 15,
    draw: function(context) {
      if (!assetsLoaded) return onAssetsLoaded(this.redraw, this);
      context.drawImage(assets, 230, 0, 31, 29, 0, 0, 15.5, 14.5);
    }
  };

  Icon.prototype.icons.turnLeft = {
    width: 16,
    height: 15,
    draw: function(context) {
      if (!assetsLoaded) return onAssetsLoaded(this.redraw, this);
      context.drawImage(assets, 230, 30, 31, 29, 0, 0, 15.5, 14.5);
    }
  };

  Icon.prototype.icons.greenFlag = {
    width: 23,
    height: 23,
    draw: function(context) {
      if (!assetsLoaded) return onAssetsLoaded(this.redraw, this);
      context.drawImage(assets, 262, 0, 46, 46, 0, 0, 23, 23);
    }
  };

  Script.prototype.addRunningEffect = function() {
    if (!this._runningEffect) {
      this.addEffect(this.runningEffect);
      this._runningEffect = true;
    }
    return this;
  };

  Script.prototype.runningEffect = function() {
    var canvas = this.shadow(0, 0, 12, '#ff9');
    var ctx = canvas.getContext('2d');
    ctx.drawImage(canvas, 0, 0);
    ctx.drawImage(canvas, 0, 0);
    return canvas;
  };

  Script.prototype.removeRunningEffect = function() {
    this.removeEffect(this.runningEffect);
    this._runningEffect = false;
    return this;
  };

  function makePrimitive(value) {
    return typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ? value : 0;
  }

  function deserializeScript(json) {
    // TODO not very defensive
    return (json.length > 3 ? deserializeComment(json) : deserializeStack(json[2])).moveTo(json[0], json[1]);
  }

  function deserializeComment(json) {
    return new Comment(json[6], json[2], json[3], !json[4]);
  }

  function deserializeStack(json) {
    return new Script(json.map(deserializeCommand));
  }

  function deserializeCommand(json) {
    return deserializeBlock(json, 'c');
  }

  function deserializeBlock(json, typeHint) {
    switch (json[0]) {
      case '\\\\':
        json[0] = '%';
        break;
      case 'call':
        return new Block(['c', '%h ' + json[1], 'call', 10], json.slice(1).map(deserializeArg));
      case 'getParam':
        return new Block([json[2] === 'b' ? 'b' : 'r', '%l', 'getParam', 11], [json[1]]);
      case 'procDef':
        return new Block(['h', 'define %l', 'procDef', 10], [json[1]]);
    }
    var info = vis.getBlock(json[0], {
      type: typeHint || 'c',
      argTypes: json.slice(1).map(guessArgType)
    });
    var b = new Block(info, json.slice(1).map(deserializeArg));
    if (b.name === 'stopScripts' && ['other scripts in sprite', 'other scripts in stage'].indexOf(b.args[0].value) !== -1) {
      b.type = 'c';
    }
    return b;
  }

  function guessArgType(json) {
    return Array.isArray(json) && typeof json[0] !== 'string' ? 't' : 's';
  }

  function deserializeArg(json) {
    return Array.isArray(json) ? (typeof json[0] === 'string' ? deserializeBlock(json, 'r') : deserializeStack(json)) : json;
  }

  /***************************************************************************/

  var def = Object.defineProperty;
  var slice = [].slice;

  function el(tagName, properties, children) {
    if (Array.isArray(properties)) {
      children = properties;
      properties = undefined;
    }
    var e = document.createElement(tagName);
    if (properties) {
      extendr(e, properties);
    }
    if (children) {
      for (var i = 0, l = children.length; i < l; i++) {
        var c = children[i];
        e.appendChild(typeof c === 'object' ? c : document.createTextNode(c));
      }
    }
    return e;
  }

  function cl(tagName, className, properties, children) {
    if (typeof className !== 'string') {
      children = properties;
      properties = className;
      className = tagName;
      tagName = 'div';
    }
    var e = el(tagName, properties, children);
    e.className = className;
    return e;
  }

  function extendr(o, properties) {
    for (var k in properties) if (hasOwnProperty.call(properties, k)) {
      var v = properties[k];
      if (typeof v === 'object') {
        extendr(o[k], v);
      } else {
        o[k] = v;
      }
    }
    return o;
  }

  function ScriptsPanel(editor) {
    this.editor = editor;

    this.el = cl('scripts-panel', [
      this.elButtons = cl('palette-buttons'),
      this.elPalette = cl('palette-contents'),
      this.elWorkspace = cl('editor-workspace')
    ]);
    this.createButtons();

    this.palette = new Palette(this.elPalette);
    this.workspace = new Workspace(this.elWorkspace);

    this.workspace.on('change', this.save, this);
  }

  ScriptsPanel.prototype.save = function() {
    if (this.sprite) this.sprite.scripts = this.workspace.scripts.slice(0);
  };

  ScriptsPanel.prototype.showSprite = function(sprite) {
    this.save();
    this.sprite = null;
    if (sprite) {
      this.workspace.clear();
      this.workspace.addAll(sprite.scripts);
      this.workspace.scrollTo(0, 0);
      this.sprite = sprite;
    }
    this.refreshPalette();
  };

  ScriptsPanel.prototype.createButtons = function() {
    var self = this;
    function buttonClick() {
      self.category = this.value;
    }

    this.buttons = {};
    // TODO variables
    [2, 6, 3, 8, 7].forEach(function(id) {
      var cat = vis.getCategory(id);

      var b = cl('button', 'palette-button', {value: id}, [
        el('div', {style: {color: cat[2]}}, [
          el('strong', [_(cat[1])])
        ])
      ]);
      b.addEventListener('click', buttonClick);

      this.buttons[cat[0]] = b;
      this.elButtons.appendChild(b);
    }, this);
  };

  ScriptsPanel.prototype.install = function(parent) {
    parent.add(this.palette);
    parent.add(this.workspace);
  };

  ScriptsPanel.prototype.uninstall = function(parent) {
    parent.remove(this.palette);
    parent.remove(this.workspace);
  };

  def(ScriptsPanel.prototype, 'category', {
    get: function() {return this._category},
    set: function(value) {
      if (this._category === value) {
        this.refreshPalette();
        return;
      }
      value = +value;
      this._category = value;

      if (this.categoryButton) {
        this.categoryButton.classList.remove('selected');
      }
      this.categoryButton = this.buttons[value];
      this.categoryButton.classList.add('selected');

      this.refreshPalette(true);
    }
  });

  ScriptsPanel.prototype.refreshPalette = function(resetScroll) {
    if (!resetScroll) {
      var sx = this.palette.scrollX;
      var sy = this.palette.scrollY;
    }

    this.palette.clear();
    (palettes[this._category] || []).forEach(this.append, this);

    if (!resetScroll) {
      this.palette.scrollTo(sx, sy);
    }
  };

  ScriptsPanel.prototype.append = function(t) {
    if (t.if) {
      ((this.appendCondition(t.if) ? t.then : t.else) || []).forEach(this.append, this);
      return;
    }
    if (t.action) {
      var editor = this.editor;
      var button = cl('button', 'ui-button', [_(t.text)]);
      if (editor[t.action]) button.addEventListener('click', editor[t.action].bind(editor));
      return this.palette.add(Palette.element(button, 0, 26));
    }
    if (t.text) {
      var div = cl('palette-label', [_(t.text)]);
      return this.palette.add(Palette.element(div, 0, 14));
    }
    if (t.watcher) {
      var b = t.watcher;
      if (!Array.isArray(b)) b = [b];
      var checked = this.editor.hasWatcher(b);
      var button = cl('button', 'check-box'+(checked ? ' checked' : ''));
      button.addEventListener('click', function() {
        checked = this.editor.toggleWatcher(b);
        button.classList.toggle('checked', !!checked);
      }.bind(this));
      this.palette.add(Palette.inline(button, 13, 12));
      return this.append(b);
    }
    if (t === '==') {
      return this.palette.add(Palette.element(cl('palette-separator'), 0, 2));
    }
    if (t === '--' || t === '---') {
      return this.palette.add(Palette.space(t.length * 10 - 5));
    }
    if (t.all) {
      return (this.appendAll(t.all) || []).forEach(this.append, this);
    }
    if (!Array.isArray(t)) {
      t = [t];
    }
    var script = new Script().add(new Block(t[0], t.slice(1).map(this.appendArg, this)));
    //if (!this.editor.exec.table[t[0]]) script.addEffect(script.outline.bind(script, 2, '#faa'));
    this.palette.add(script);
  };

  ScriptsPanel.prototype.appendArg = function(arg) {
    if (typeof arg !== 'object') return arg;
    if (arg.first) {
      var key = arg.first === 'var' ? 'variables' : arg.first === 'list' ? 'lists' : '';
      if (key) return this.editor[key].map(getName).sort()[0];
      if (arg.first === 'pot') {
        // TODO
        return '';
      }
    }
    return '';
  };

  ScriptsPanel.prototype.appendCondition = function(condition) {
    switch (condition) {
      case 'variables': return this.editor.variables.length;
    }
  };

  ScriptsPanel.prototype.appendAll = function(all) {
    function getter(get) {
      return function(name) {return {watcher: [get, name]}};
    }

    function collection(key, make) { // NS
      var stagec = stage[key].map(getName).sort().map(make);
      var spritec = sprite.isStage ? [] : sprite[key].map(getName).sort().map(make);
      return stagec.concat(stagec.length && spritec.length ? '==' : [], spritec);
    }

    var stage = this.editor.stage;
    var sprite = this.editor.selectedSprite;
    switch (all) {
      case 'variables':
        return collection('variables', getter('readVariable'));
      case 'lists':
        return collection('lists', getter('contentsOfList:'));
    }
  };

  /***************************************************************************/

  class Interpreter {
    constructor(editor) {
      this.editor = editor;

      this.pots = []
      this.init()
    }

    async init() {
      const data = await fetch("/config", {
        credentials: "include",
      }).then(rsp => rsp.json())

      this.user_id = data.user_id
      this.account_id = data.account_id
      this.pots = data.pots
      console.log('init')
    }

    async runScript(script) {
      if (!this.user_id || !this.account_id) return
      console.log(JSON.stringify(script.blocks))

      script.addRunningEffect();

      const data = await fetch("/execute", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          user_id: this.user_id,
          account_id: this.account_id,
          script: script.blocks,
        }),
        headers: new Headers({
          "Content-Type": "application/json"
        })
      }).then(rsp => rsp.json())

      script.removeRunningEffect();

      if (data.error) {
        const redOutline = script.outline.bind(script, 2, '#faa')
        script.addEffect(redOutline);
        setTimeout(() => {
          script.removeEffect(redOutline)
        }, 1000)
      }

      const message = data.result === undefined ? data.error : data.result
      if (message === undefined) return
      var pos = script.blocks[0].worldPosition;
      this.editor.showBubble(message, pos.x + script.width, pos.y);
    }
  }

  class Editor {
    constructor() {
      this.exec = new Interpreter(this);

      this.app = new vis.App();
      this.app.editor = this;
      this.app.exec = this.exec;
      this.app.add(this.scriptsPanel = new ScriptsPanel(this))

      this.el = cl('editor Visual-no-select', [
        cl('tab-panel-content', [this.scriptsPanel.el]),
      ])
      this.scriptsPanel.category = 6

      this.variables = [];

      window.addEventListener('resize', () => this.app.resize());

      document.addEventListener('mousedown', this.hideBubble.bind(this));
      document.addEventListener('wheel', this.hideBubble.bind(this));
    }

    hasWatcher(n) { return false; }
  }

  Editor.prototype.bubbleRange = 25;
  Editor.prototype.bubbleMinWidth = 12;
  Editor.prototype.bubbleFont = '12px Arial, Verdana, DejaVu Sans, sans-serif';
  Editor.prototype.bubbleHeight = 18;
  Editor.prototype.bubbleColor = '#fff';
  Editor.prototype.bubbleBorderColor = 'rgba(0, 0, 0, .3)';
  Editor.prototype.bubbleTextColor = '#5c5d5f';
  Editor.prototype.bubblePadding = 4;
  Editor.prototype.bubbleRadius = 5;
  Editor.prototype.bubblePaddingX = 8;
  Editor.prototype.bubblePaddingY = 2;
  Editor.prototype.bubblePointerX = 2;
  Editor.prototype.bubblePointerY = 5;
  Editor.prototype.bubblePointerWidth = 10;
  Editor.prototype.bubbleShadowColor = 'rgba(0, 0, 0, .2)';
  Editor.prototype.bubbleShadowBlur = 8;
  Editor.prototype.bubbleShadowX = 3;
  Editor.prototype.bubbleShadowY = 3;

  Editor.prototype.mouseMove = function(e) {
    if (this.bubble) {
      var dx = e.clientX - this.bubbleX;
      var dy = e.clientY - this.bubbleY;
      if (dx * dx + dy * dy >= this.bubbleRange * this.bubbleRange) {
        this.hideBubble();
      }
    }
  };

  Editor.prototype.showBubble = function(text, x, y) {
    this.hideBubble();

    var p = this.bubblePadding;
    var px = this.bubblePaddingX;
    var py = this.bubblePaddingY;
    var ix = this.bubblePointerX;
    var iy = this.bubblePointerY;
    var iw = this.bubblePointerWidth;
    var sx = this.bubbleShadowX;
    var sy = this.bubbleShadowY;
    var sc = this.bubbleShadowColor;
    var sb = this.bubbleShadowBlur;
    var r = this.bubbleRadius;
    var canvas = cl('canvas', 'Visual-absolute bubble');
    var ct = canvas.getContext('2d');
    ct.font = this.bubbleFont;
    var w = Math.max(ct.measureText(text).width, this.bubbleMinWidth) + px + Math.max(px, ix);
    var i = Math.max(0, ix - px);
    var h = this.bubbleHeight + py * 2 + iy;
    canvas.width = w + sx + sb * 2;
    canvas.height = h + sy + sb * 2;
    ct.translate(sb, sb);
    ct.moveTo(i + px - ix, h);
    ct.lineTo(i + px, h - iy);
    ct.arc(i + r, h - iy - r, r, Math.PI/2, Math.PI, false);
    ct.arc(i + r, r, r, Math.PI, Math.PI*3/2, false);
    ct.arc(w - r, r, r, Math.PI*3/2, 0, false);
    ct.arc(w - r, h - iy - r, r, 0, Math.PI/2, false);
    ct.lineTo(i + px - ix + iw, h - iy);
    ct.closePath();
    ct.strokeStyle = this.bubbleBorderColor;
    ct.lineWidth = 2;
    ct.stroke();
    ct.fillStyle = this.bubbleColor;
    ct.shadowColor = sc;
    ct.shadowOffsetX = sx;
    ct.shadowOffsetY = sy;
    ct.shadowBlur = sb;
    ct.fill();
    ct.shadowColor = 'transparent';
    ct.shadowBlur = 0;
    ct.shadowOffsetX = 0;
    ct.shadowOffsetY = 0;
    ct.fillStyle = this.bubbleTextColor;
    ct.textBaseline = 'middle';
    ct.textAlign = 'center';
    ct.font = this.bubbleFont;
    ct.fillText(text, i + w/2, (h - iy)/2);

    this.bubble = canvas;
    this.bubbleX = this.app.mouseX;
    this.bubbleY = this.app.mouseY;
    x = Math.max(p, Math.min(window.innerWidth - w - p, x));
    y = Math.max(p, Math.min(window.innerHeight - h - p, y));
    vis.util.setTransform(this.bubble, 'translate('+(x + i - sb)+'px,'+(y - sb - h)+'px)');
    document.body.appendChild(this.bubble);
  };

  Editor.prototype.hideBubble = function() {
    if (this.bubble) {
      document.body.removeChild(this.bubble);
      this.bubble = null;
    }
  };


  const editor = window.editor = new Editor()
  document.body.appendChild(editor.el)
  editor.app.resize();

}());
