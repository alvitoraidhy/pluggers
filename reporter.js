/* eslint-disable */
/* istanbul ignore file */

const Base = require("mocha/lib/reporters/base");
const { constants } = require("mocha/lib/runner");

const {
  EVENT_RUN_BEGIN,
  EVENT_RUN_END,
  EVENT_SUITE_BEGIN,
  EVENT_SUITE_END,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_TEST_PENDING,
} = constants;

const { inherits } = require("mocha/lib/utils");

const { color } = Base;

function SpecExtended(runner, options) {
  Base.call(this, runner, options);

  const self = this;
  let indents = 0;
  let n = 0;

  function indent() {
    return Array(indents).join("  ");
  }

  runner.on(EVENT_RUN_BEGIN, () => {
    Base.consoleLog();
  });

  runner.on(EVENT_SUITE_BEGIN, (suite) => {
    ++indents;
    Base.consoleLog(color("suite", "%s%s"), indent(), suite.title);
  });

  runner.on(EVENT_SUITE_END, () => {
    --indents;
    if (indents === 1) {
      Base.consoleLog();
    }
  });

  runner.on(EVENT_TEST_PENDING, (test) => {
    const fmt = indent() + color("pending", "  - %s");
    Base.consoleLog(fmt, test.title);
  });

  runner.on(EVENT_TEST_PASS, (test) => {
    const fmt =
      indent() +
      color("checkmark", `  ${Base.symbols.ok}`) +
      color("pass", " %s") +
      color(test.speed, " (%dms)");
    Base.consoleLog(fmt, test.title, test.duration);
  });

  runner.on(EVENT_TEST_FAIL, (test) => {
    Base.consoleLog(indent() + color("fail", "  %d) %s"), ++n, test.title);
  });

  runner.once(EVENT_RUN_END, self.epilogue.bind(self));
}

inherits(SpecExtended, Base);

exports = module.exports = SpecExtended;
