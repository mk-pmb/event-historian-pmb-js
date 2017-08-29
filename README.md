
<!--#echo json="package.json" key="name" underline="=" -->
event-historian-pmb
===================
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
Watch a standard node.js EventEmitter so you can be notified of events even
after they already happened.
<!--/#echo -->


Usage
-----

from [test/usage.js](test/usage.js):

<!--#include file="test/usage.js" start="  //#u" stop="  //#r"
  outdent="  " code="javascript" -->
<!--#verbatim lncnt="70" -->
```javascript
var eventHistorian = require('event-historian-pmb'), chronicles,
  clock = require('event-test-clock-pmb').flavors.quarterSeconds();

function logPanicOnce(why) {
  test.log({ panic: why });
  this.onPanic = null;
  return false;   // false = no more reason to panic, at least for now.
}

chronicles = eventHistorian({
  subj: clock,    // Subject to study.
  name: 'usageTestEH',
  all: 'dblSec',  // Remember all occurrences of these events.
    // Event name lists can be an array, or a string with names
    // separated by space.
  prev: 'tick fullSec',   // Remember just the latest occurrence.
  first: 'halfSec',       // Remember just the first occurrence.
  firstPrev: 'qtrSec',    // Remember first and latest occurrence.
  singular: 'beginTest',  // Like 'first' but panic if occurs again.
  onPanic: logPanicOnce,
});
test.log('Watching.');

equal(chronicles.asa, chronicles.asSoonAs);
equal(chronicles.paf, chronicles.previousAndFuture);
chronicles.paf('beginTest', test.log.l8r(['Test begins.']));

clock.emit('beginTest', 'Godspeed!');

function lateSubscribe() {
  chronicles.asa('fullSec', test.log.l8r(['late asa full']));
  chronicles.paf('fullSec', test.log.l8r(['late paf full']));
}

clock.schedule([ 'abs',
  4, test.log.l8r('One second passed.'),
  6, lateSubscribe,
  13, function () { clock.emit('beginTest', 'again!'); },
  17, function () { test.verify(); },
  ]);

test.verify = function () {
  clock.stop();

  equal(chronicles.counts(), { beginTest: 2,
    qtrSec: 17, halfSec: 8, fullSec: 4, dblSec: 2 });

  equal.lists(test.log(), [
    'Watching.',
    [ 'Test begins.', 'Godspeed!' ],
    'One second passed.',
    [ 'late asa full', 1 ],
    [ 'late paf full', 1 ],
    [ 'late paf full', 2 ],
    [ 'late paf full', 3 ],
    { panic: 'Singular event occurred again: beginTest' },
    [ 'Test begins.', 'again!' ],
    [ 'late paf full', 4 ],
  ]);

  test.log.clear();
  equal.err(function () { clock.emit('beginTest', 'anew!'); },
    'Error: [EventHistorian usageTestEH]: panic: ' +
    'Singular event occurred again: beginTest anew!');
  equal.lists(test.log(), []);

  test.ok();
};
```
<!--/include-->


<!--#toc stop="scan" -->



Known issues
------------

* needs more/better tests and docs




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
ISC
<!--/#echo -->
