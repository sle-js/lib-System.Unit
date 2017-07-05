const Array = mrequire("core:Native.Data.Array:1.0.0");

const constant = v => _ =>
    v;


function UnitTestType(content) {
    this.content = content;
}


const Suite = name => tests =>
    new UnitTestType([0, name, tests]);


const Test = name => assertion =>
    new UnitTestType([1, name, assertion]);


UnitTestType.prototype.reduce = function (fSuite) {
    return fUnit => {
        switch (this.content[0]) {
            case 0:
                return fSuite(this.content[1])(this.content[2]);
            default:
                return fUnit(this.content[1])(this.content[2]);
        }
    }
};
assumptionEqual(Suite("hello")(10).reduce(name => tests => name + tests)(name => assertion => "none"), "hello10");
assumptionEqual(Test("hello")(10).reduce(name => assertion => "none")(name => tests => name + tests), "hello10");


UnitTestType.prototype.then = function (f) {
    return f(this);
};


function myStackTrace() {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (_, stack) {
        return stack;
    };
    const err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    const stack = err.stack;
    Error.prepareStackTrace = orig;

    return stack;
}


function AssertionType(content) {
    this.content = content;
}


const AllGood =
    new AssertionType([0]);


const Fail = file => lineno => message =>
    new AssertionType([1, file, lineno, message]);


const fail = message => {
    const stack = myStackTrace();
    const call = stack[1];
    const file = call.getFileName();
    const lineno = call.getLineNumber();

    return Fail(file)(lineno)(message);
};


AssertionType.prototype.reduce = function (fAllGood) {
    return fFail => {
        switch (this.content[0]) {
            case 0:
                return fAllGood();
            default:
                return fFail(this.content[1])(this.content[2])(this.content[3]);
        }
    }
};
assumptionEqual(AllGood.reduce(() => 0)(file => lineno => msg => 1), 0);
assumptionEqual(Fail("thisFile")(10)("Ooops").reduce(() => "none")(file => lineno => msg => file + ":" + lineno + ":" + msg), "thisFile:10:Ooops");


AssertionType.prototype.isAllGood = function () {
    return this.reduce(constant(true))(file => lineno => msg => false);
};
assumption(AllGood.isAllGood());
assumption(!Fail("thisFile")(20)("oops").isAllGood());


const messageWithDefault = def => assertion =>
    assertion.reduce(constant(def))(file => lineno => msg => msg);
assumptionEqual(messageWithDefault("fine")(fail("oops")), "oops");
assumptionEqual(messageWithDefault("fine")(AllGood), "fine");


AssertionType.prototype.isTrue = function (value) {
    return this.isAllGood()
        ? value
            ? this
            : fail("isTrue failed")
        : this;
};
assumptionEqual(AllGood.isTrue(true), AllGood);
assumptionEqual(messageWithDefault("none")(AllGood.isTrue(false)), "isTrue failed");
assumptionEqual(messageWithDefault("none")(AllGood.isTrue(true).isTrue(false).isTrue(true)), "isTrue failed");


AssertionType.prototype.equals = function (a) {
    return b => this.isAllGood()
        ? (a === b)
            ? this
            : fail("equals failed: " + a.toString() + " != " + b.toString())
        : this;
};
assumptionEqual(AllGood.equals(1)(1), AllGood);
assumptionEqual(messageWithDefault("none")(AllGood.equals(1)(2)), "equals failed: 1 != 2");
assumptionEqual(messageWithDefault("none")(AllGood.equals(1)(2).equals(3)(4)), "equals failed: 1 != 2");


AssertionType.prototype.show = function () {
    return this.reduce(constant("All good"))(file => lineno => msg => file + ": " + lineno + ": " + msg);
};


const showErrors = unitTest => {
    const showUnitTestErrors = path => unitTest =>
        unitTest.reduce(name => tests =>
            tests.forEach(test => showUnitTestErrors(Array.append(name)(path))(test))
        )(name => assumption => {
            if (!assumption.isAllGood()) {
                console.log(Array.join(": ")(Array.append(name)(path)) + ": " + assumption.show())
            }
        });

    showUnitTestErrors([])(unitTest);

    return unitTest;
};


const testSummary = unitTest => {
    const accumulate = acc => item => ({
        passed: acc.passed + item.passed,
        total: acc.total + item.total
    });

    const testSummaryHelper = unitTest =>
        unitTest.reduce(
            name => tests => Array.foldl({
                passed: 0,
                total: 0
            })(acc => t => accumulate(acc)(testSummaryHelper(t)))(tests))(name => assertion => ({
            passed: assertion.isAllGood() ? 1 : 0,
            total: 1
        }));

    return testSummaryHelper(unitTest);
};


const showSummary = unitTest => {
    const results =
        testSummary(unitTest);

    console.log(`Passed ${results.passed} out of ${results.total}`);

    return unitTest;
};


const setExitCodeOnFailures = unitTest => {
    const results =
        testSummary(unitTest);

    if (results.passed !== results.total) {
        process.exitCode = -1;
    }

    return unitTest;
};


module.exports = {
    Suite,
    Test,
    showErrors,
    showSummary,
    setExitCodeOnFailures,

    AllGood,
    Fail,
    fail
};