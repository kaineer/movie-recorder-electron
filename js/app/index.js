// src/index.js

var App = window.App || (window.App = {});

App.Ace = require('brace');
App.Modes = {};
App.Modes.Javascript = require('brace/mode/javascript');
App.Themes = {};
App.Themes.Monokai = require('brace/theme/monokai');

App.Document = require('./js/app/document.js');

var editor = App.Document.setAceEditor(App.Ace);

App.editor = editor;

var Watcher = require('./js/app/watcher');

App.watcher = new Watcher();

var displayMaps = {};

displayMaps.dsl = function(e) {
  var text = '  .at(' + e.start.row + ', ' + e.start.column + ').';

  if (e.action === 'insert') {
    text += 'insert(' + JSON.stringify(e.lines.join('\n')) + ')';
  } else {
    text += 'find(' + JSON.stringify(e.lines.join('\n')) + ').remove()'
  }

  return text;
};

displayMaps.data = function (e) {
  var text = '{\n  action: \'';

  if (e.action === 'insert') {
    text += 'add';
  } else {
    text += 'delete';
  }

  text += '\',\n  cursorPos: {\n    row: ' + e.start.row +
    ',\n    column: ' + e.start.column + '\n  },\n';

  if (e.action === 'insert') {
    text += '  to: ' + JSON.stringify(e.lines.join('\n')) + '\n}';
  } else {
    text += '  from: ' + JSON.stringify(e.lines.join('\n')) + '\n}'
  }

  return text;
};

App.output = 'data';

const displayChanges = function() {
  const mode = App.output;
  let text;

  if (mode === 'data') {
    text = (App.watcher.events || []).map(displayMaps.data).join(',\n');
  } else {
    text = (App.watcher.events || []).map(displayMaps.dsl).join('.\n');
    if (text !== '') {
      text = 'this.\n' + text + ';';
    }
  }

  document.querySelector('#actions').textContent = text;
};

editor.on('change', function(e) {
  App.watcher.onChange(e);

  displayChanges();
});

let $initialCode = editor.getSession().getValue();


var $load = document.querySelector('.button-load');
var $reset = document.querySelector('.button-reset');
var $replay = document.querySelector('.button-replay');
var $removeLast = document.querySelector('.button-remove-last');

var $tabData = document.querySelector('.tab-data');
var $tabDSL = document.querySelector('.tab-dsl');

var resetEditor = function() {
  var saveOnChange = App.watcher.onChange;
  App.watcher.onChange = function() {};

  editor.getSession().setValue($initialCode);

  App.watcher.onChange = saveOnChange;
};


var loadFile = function() {
  const {remote} = require('electron');
  const dialog = remote.dialog;
  const fs = require('fs');

  dialog.showOpenDialog(function (fileNames) {
    if (typeof (fileNames) === 'object') {
      fs.readFile(fileNames[0], 'utf-8', function (err, buffer) {
        App.watcher.events = null;

        $initialCode = buffer.toString();

        resetEditor();
      });
    }
  });
};

var replayEditor = function() {
  var session = editor.getSession();

  resetEditor();

  var saveOnChange = App.watcher.onChange;
  App.watcher.onChange = function() {};

  App.watcher.events.forEach(function(e) {
    if (e.action === 'insert') {
      session.insert(e.start, e.lines.join('\n'));
    } else if (e.action === 'remove') {
      session.remove(e);
    }
  });

  App.watcher.onChange = saveOnChange;
};

$load.addEventListener('click', function(e) {
  e.preventDefault();

  loadFile();
});

$reset.addEventListener('click', function(e) {
  e.preventDefault();

  App.watcher.events = null;

  resetEditor();
});

$replay.addEventListener('click', function(e) {
  e.preventDefault();

  replayEditor();
});

$removeLast.addEventListener('click', function(e) {
  e.preventDefault();

  App.watcher.events.pop();

  replayEditor();
});

$tabData.addEventListener('click', function(e) {
  e.preventDefault();

  $tabData.classList.add('active');
  $tabDSL.classList.remove('active');

  App.output = 'data';

  displayChanges();
});

$tabDSL.addEventListener('click', function(e) {
  e.preventDefault();

  $tabDSL.classList.add('active');
  $tabData.classList.remove('active');

  App.output = 'dsl';

  displayChanges();
});