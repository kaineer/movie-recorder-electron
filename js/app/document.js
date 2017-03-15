// src/document.js

var Document = {};

module.exports = Document;

var doc = Document.document = document;

var editorId = 'editor';

Document.setAceEditor = function(ace) {
  var editor = ace.edit(editorId);
  // editor.getSession().setMode('ace/mode/javascript');
  editor.setTheme('ace/theme/monokai');
  editor.setFontSize(24);

  return editor;
};