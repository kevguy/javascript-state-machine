//-----------------------------------------------------------------------------

module("async");

//-----------------------------------------------------------------------------

test("state transitions", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',  to: 'yellow', async: true },
      { name: 'panic', from: 'yellow', to: 'red',    async: true },
      { name: 'calm',  from: 'red',    to: 'yellow', async: true },
      { name: 'clear', from: 'yellow', to: 'green',  async: true }
  ]});

                    equals(fsm.current, 'green',  "initial state should be green");
  fsm.warn();       equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
  fsm.panic();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
  fsm.calm();       equals(fsm.current, 'red',    "should still be red because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
  fsm.clear();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

});

//-----------------------------------------------------------------------------

test("state transitions with delays", function() {

  stop(); // doing async stuff - dont run next qunit test until I call start() below

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',  to: 'yellow', async: true },
      { name: 'panic', from: 'yellow', to: 'red',    async: true },
      { name: 'calm',  from: 'red',    to: 'yellow', async: true },
      { name: 'clear', from: 'yellow', to: 'green',  async: true }
  ]});

                            equals(fsm.current, 'green',  "initial state should be green");
  fsm.warn();               equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
  setTimeout(function() {
    fsm.transition();       equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
    fsm.panic();            equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
    setTimeout(function() {
      fsm.transition();     equals(fsm.current, 'red',    "panic event should transition from yellow to red");
      fsm.calm();           equals(fsm.current, 'red',    "should still be red because we haven't transitioned yet");
      setTimeout(function() {
        fsm.transition();   equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
        fsm.clear();        equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
        setTimeout(function() {
          fsm.transition(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");
          start();
        }, 10);
      }, 10);
    }, 10);
  }, 10);

});

//-----------------------------------------------------------------------------

test("state transition fired imediately during onleavestate hook", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',  to: 'yellow', async: true },
      { name: 'panic', from: 'yellow', to: 'red',    async: true },
      { name: 'calm',  from: 'red',    to: 'yellow', async: true },
      { name: 'clear', from: 'yellow', to: 'green',  async: true }
  ]});

  fsm.onleavegreen  = function() { this.transition(); }
  fsm.onleaveyellow = function() { this.transition(); }
  fsm.onleavered    = function() { this.transition(); }

  equals(fsm.current, 'green', "initial state should be green");

  fsm.warn();  equals(fsm.current, 'yellow', "warn  event should transition from green  to yellow");
  fsm.panic(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
  fsm.calm();  equals(fsm.current, 'yellow', "calm  event should transition from red    to yellow");
  fsm.clear(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

});

//-----------------------------------------------------------------------------

test("state transition fired during onleavestate hook with delay", function() {

  stop(); // doing async stuff - dont run next qunit test until I call start() below

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'panic', from: 'green', to: 'red', async: true }
  ]});

  fsm.onleavegreen = function() { setTimeout(function() { fsm.transition(); }, 10); }
  fsm.onenterred   = function() { 
    equals(fsm.current, 'red', "panic event should transition from green to red");
    start();
  }

               equals(fsm.current, 'green', "initial state should be green");
  fsm.panic(); equals(fsm.current, 'green', "should still be green because we haven't transitioned yet");

});

//-----------------------------------------------------------------------------

test("state transition fired during onleavestate hook - with MIXED async and non-async transitions!", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',   from: 'green',           to: 'yellow', async: true }, // leave green     async
      { name: 'panic',  from: 'green',           to: 'red'                 }, // leave green non-async
      { name: 'reset',  from: ['yellow', 'red'], to: 'green'               }
  ]});

  fsm.onleavegreen  = function() { this.transition(); }

               equals(fsm.current, 'green',  "initial state should be green");
  fsm.warn();  equals(fsm.current, 'yellow', "warn  event should transition from green  to yellow");
  fsm.reset(); equals(fsm.current, 'green',  "reset event should transition from yellow to green");
  fsm.panic(); equals(fsm.current, 'red',    "panic event should transition from green  to red");

});

//-----------------------------------------------------------------------------

test("state transitions using onleavestate run-time return value instead of design-time async attribute", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',  to: 'yellow' },
      { name: 'panic', from: 'yellow', to: 'red'    },
      { name: 'calm',  from: 'red',    to: 'yellow' },
      { name: 'clear', from: 'yellow', to: 'green'  }
  ]});

  // default behavior is synchronous

                    equals(fsm.current, 'green',  "initial state should be green");
  fsm.warn();       equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
  fsm.panic();      equals(fsm.current, 'red',    "panic event should transition from yellow to red");
  fsm.calm();       equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
  fsm.clear();      equals(fsm.current, 'green',  "clear event should transition from yellow to green");

  // but add hooks that return false and it magically becomes asynchronous

  fsm.onleavegreen  = function() { return false; }
  fsm.onleaveyellow = function() { return false; }
  fsm.onleavered    = function() { return false; }

                    equals(fsm.current, 'green',  "initial state should be green");
  fsm.warn();       equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
  fsm.panic();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
  fsm.calm();       equals(fsm.current, 'red',    "should still be red because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
  fsm.clear();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

  // this allows you to make on-the-fly decisions about whether async or not ...

  fsm.onleavegreen = function(async) {
    if (async) {
      setTimeout(function() {
        fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
        start(); // move on to next test
      }, 10);
      return false;
    }
  }
  fsm.onleaveyellow = fsm.onleavered = null;

  fsm.warn(false);  equals(fsm.current, 'yellow', "expected synchronous transition from green to yellow");
  fsm.clear();      equals(fsm.current, 'green',  "clear event should transition from yellow to green");
  fsm.warn(true);   equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");

  stop(); // doing async stuff - dont run next qunit test until I call start() in callback above

});

//-----------------------------------------------------------------------------


test("state transition fired without completing previous transition", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',  to: 'yellow', async: true },
      { name: 'panic', from: 'yellow', to: 'red',    async: true },
      { name: 'calm',  from: 'red',    to: 'yellow', async: true },
      { name: 'clear', from: 'yellow', to: 'green',  async: true }
  ]});

                    equals(fsm.current, 'green',  "initial state should be green");
  fsm.warn();       equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
  fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
  fsm.panic();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");

  raises(fsm.calm.bind(fsm), /event calm innapropriate because previous async transition \(panic\) from yellow to red did not complete/);

});

//-----------------------------------------------------------------------------

test("hooks are called when appropriate", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',  to: 'yellow', async: true },
      { name: 'panic', from: 'yellow', to: 'red',    async: true },
      { name: 'calm',  from: 'red',    to: 'yellow', async: true },
      { name: 'clear', from: 'yellow', to: 'green',  async: true },
  ]});

  var called = [];

  // generic state hook
  fsm.onchangestate = function(from,to) { called.push('onchange from ' + from + ' to ' + to); };

  // state hooks
  fsm.onentergreen    = function() { called.push('onentergreen');     };
  fsm.onleavegreen    = function() { called.push('onleavegreen');     };
  fsm.onenteryellow   = function() { called.push('onenteryellow');    };
  fsm.onleaveyellow   = function() { called.push('onleaveyellow');    };
  fsm.onenterred      = function() { called.push('onenterred');       };
  fsm.onleavered      = function() { called.push('onleavered');       };

  // event hooks
  fsm.onbeforewarn    = function() { called.push('onbeforewarn');     };
  fsm.onafterwarn     = function() { called.push('onafterwarn');      };
  fsm.onbeforepanic   = function() { called.push('onbeforepanic');    };
  fsm.onafterpanic    = function() { called.push('onafterpanic');     };
  fsm.onbeforecalm    = function() { called.push('onbeforecalm');     };
  fsm.onaftercalm     = function() { called.push('onaftercalm');      };
  fsm.onbeforeclear   = function() { called.push('onbeforeclear');    };
  fsm.onafterclear    = function() { called.push('onafterclear');     };

  called = [];
  fsm.warn();       deepEqual(called, ['onbeforewarn', 'onleavegreen']);
  fsm.transition(); deepEqual(called, ['onbeforewarn', 'onleavegreen', 'onenteryellow', 'onchange from green to yellow', 'onafterwarn']);

  called = [];
  fsm.panic();      deepEqual(called, ['onbeforepanic', 'onleaveyellow']);
  fsm.transition(); deepEqual(called, ['onbeforepanic', 'onleaveyellow', 'onenterred', 'onchange from yellow to red', 'onafterpanic']);

  called = [];
  fsm.calm();       deepEqual(called, ['onbeforecalm', 'onleavered']);
  fsm.transition(); deepEqual(called, ['onbeforecalm', 'onleavered', 'onenteryellow', 'onchange from red to yellow', 'onaftercalm']);

  called = [];
  fsm.clear();      deepEqual(called, ['onbeforeclear', 'onleaveyellow']);
  fsm.transition(); deepEqual(called, ['onbeforeclear', 'onleaveyellow', 'onentergreen', 'onchange from yellow to green', 'onafterclear']);

});

//-----------------------------------------------------------------------------
