/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, PT, arSlc = Array.prototype.slice;

function arLast(a, n) { return (a[(+a.length || 0) - (+n || 1)] || false); }
function sortedKeys(o) { return Object.keys(o).sort(); }
function oc0() { return Object.create(null); }
function fail(why) { throw new Error(why); }


PT = (function () {
  function EventHistorian() { return; }
  return new EventHistorian();
}());


function mapKV(o, f) {
  return o && sortedKeys(o).map(function (k) { return f(k, o[k]); });
}


EX = function makeEventHistorian(cfg) {
  var eh = Object.create(PT);
  eh.subj = cfg.subj;
  eh.observers = oc0();
  eh.had = oc0();
  mapKV(EX.recModes, function (m) { eh.observe(cfg[m], { recMode: m }); });
  eh.name = (cfg.name || '');
  if (cfg.onPanic) { eh.onPanic = cfg.onPanic; }
  return eh;
};


function incEvCnt(eh, ev, add) {
  var n = ev.name, had = eh.had[n];
  if (!had) {
    had = eh.had[n] = [];
    had.count = 0;
  }
  if ((!had.length) && add) { had[0] = ev; }
  had.count += 1;
  return had;
}


EX.recModes = {
  all: function (eh, ev) { incEvCnt(eh, ev, true).push(ev); },
  prev: function (eh, ev) { incEvCnt(eh, ev)[0] = ev; },
  first: function (eh, ev) { incEvCnt(eh, ev, true); },
  singular: function (eh, ev, opt) {
    if (incEvCnt(eh, ev, true).count === 1) { return; }
    if (opt.onDupe && (opt.onDupe(ev) === false)) { return; }
    eh.panic('Singular event occurred again: ' + ev.name, ev);
  },
  firstPrev: function (eh, ev) {
    var had = incEvCnt(eh, ev);
    had[had.length && 1] = ev;
  },
};


EX.replayOne = function (pastEv, hnd) {
  setImmediate(function () { hnd.apply(pastEv.ctx, pastEv); });
};


PT.toString = function () {
  return '['.concat(this.constructor.name, ' ', (this.name
    || ('for ' + String(this.subj))), ']');
};


PT.bind = function (mthd) {
  var f = this[mthd];
  if (typeof f !== 'function') { fail('No such method: ' + mthd); }
  return f.bind.apply(f, [this].concat(arSlc.call(arguments, 1)));
};


PT.panic = function (why) {
  var a = arguments;
  if (this.onPanic && (this.onPanic.apply(this, a) === false)) { return; }
  if (a.length > 1) { why = arSlc.call(a).join(' '); }
  fail(String(this) + ': panic: ' + why);
};


PT.observe = function (evNames, opt) {
  if (!opt) { opt = false; }
  var eh = this, rec = EX.recModes[opt.recMode || 'prev'];
  if (!rec) { fail('Unsupported recording mode: ' + opt.recMode); }
  if (evNames.match) { evNames = evNames.match(/\S+/g); }
  evNames.forEach(function (n) {
    if (eh.observers[n]) { return; }
    function obs() {
      var ev = arSlc.call(arguments);
      ev.name = n;
      ev.ctx = this;
      rec(eh, ev, opt);
    }
    eh.observers[n] = obs;
    eh.subj.on(n, obs);
  });
  return eh;
};


PT.counts = function (evName) {
  var cnt;
  if (evName !== undefined) {
    cnt = this.had[evName];
    return ((!!cnt) && cnt.count);
  }
  cnt = {};
  mapKV(this.had, function (k, v) { cnt[k] = v.count; });
  return cnt;
};


PT.replayPrevByName = function (evName, hnd) {
  var eh = this, had = (eh.had[evName] || false);
  if (!eh.observers[evName]) { fail("Event isn't being observed: " + evName); }
  if (!had.length) { return false; }
  EX.replayOne(arLast(had), hnd);
  return true;
};


PT.asa = PT.asSoonAs = function (evName, hnd) {
  if (this.replayPrevByName(evName, hnd)) { return this; }
  this.subj.once(evName, hnd);
  return this;
};


PT.paf = PT.previousAndFuture = function (evName, hnd) {
  this.replayPrevByName(evName, hnd);
  this.subj.on(evName, hnd);
  return this;
};
















module.exports = EX;
