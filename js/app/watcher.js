// src/watcher.js

var Watcher = function(editor) {
};

module.exports = Watcher;

var wp = Watcher.prototype;

var Loc = {
  add: function(loc, diff) {
    return {
      row: loc.row + diff.rows,
      column: diff.rows < 1 ? loc.column + diff.columns : diff.columns
    };
  },
  diff: function(left, right) {
    return {
      rows: right.row - left.row,
      columns: left.row === right.row ? right.column - left.column : right.column
    };
  },

  isSame: function(loc, prevLoc) {
    return (
      loc.row === prevLoc.row &&
      loc.column === prevLoc.column
    );
  }
};

var Event = {
  isBoth: function (e, pe, action) {
    return e.action === action && pe.action === action;
  },

  isNext: function (e, pe) {
    if (Event.isBoth(e, pe, 'insert')) {
      return Loc.isSame(pe.end, e.start);
    } else if(Event.isBoth(e, pe, 'remove')) {
      return (
        Loc.isSame(e.end, pe.start) ||
        Loc.isSame(e.start, pe.start)
      );
    }
  },

  joinLines: function (left, right) {
    var leftLines = left.lines;
    var rightLines = right.lines;

    return leftLines.slice(0, -1).concat([
      leftLines.slice(-1)[0] + rightLines[0]
    ]).concat(rightLines.slice(1));
  },

  join: function (e, pe) {
    if (Event.isBoth(e, pe, 'insert')) {
      return {
        action: 'insert', start: pe.start, end: e.end,
        lines: Event.joinLines(pe, e)
      };
    } else if (Event.isBoth(e, pe, 'remove')) {
      if (Loc.isSame(e.start, pe.start)) {
        return {
          action: 'remove', start: e.start,
          end: Loc.add(pe.end, Loc.diff(e.start, e.end)),
          lines: Event.joinLines(pe, e)
        };
      } else {
        return {
          action: 'remove', start: e.start, end: pe.end,
          lines: Event.joinLines(e, pe)
        };
      }
    }
  }
};

wp.onChange = function(event) {
  if(typeof it === 'undefined') {
    console.log(event);
  }

  if (!this.events || this.events.length === 0) {
    this.events = [event];
  } else {
    var lastEvent = this.events[this.events.length - 1];

    if (Event.isNext(event, lastEvent)) {
      this.events.pop();
      this.events.push(Event.join(event, lastEvent));
    } else {
      this.events.push(event);
    }
  }
};