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


const isAllGood = (assertion) =>
    assertion.reduce(constant(true))(file => lineno => msg => false);
assumption(isAllGood(AllGood));
assumption(!isAllGood(Fail("thisFile")(20)("oops")));


AssertionType.prototype.then = function (fThen) {
    if (isAllGood(this)) {
        return fThen();
    } else {
        return this;
    }
};


AssertionType.prototype.catch = function (fCatch) {
    if (isAllGood(this)) {
        return this;
    } else {
        return fCatch({
            fileName: this.content[1],
            lineNumber: this.content[2],
            message: this.content[3]
        })
    }
};


const messageWithDefault = def => assertion =>
    assertion.reduce(constant(def))(file => lineno => msg => msg);
assumptionEqual(messageWithDefault("fine")(fail("oops")), "oops");
assumptionEqual(messageWithDefault("fine")(AllGood), "fine");


AssertionType.prototype.isTrue = function (value) {
    return isAllGood(this)
        ? value
            ? this
            : fail("isTrue failed")
        : this;
};
assumptionEqual(AllGood.isTrue(true), AllGood);
assumptionEqual(messageWithDefault("none")(AllGood.isTrue(false)), "isTrue failed");
assumptionEqual(messageWithDefault("none")(AllGood.isTrue(true).isTrue(false).isTrue(true)), "isTrue failed");


AssertionType.prototype.equals = function (a) {
    return b => isAllGood(this)
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
            if (!isAllGood(assumption)) {
                console.log(Array.join(": ")(Array.append(name)(path)) + ": " + assumption.show())
            }
        });

    showUnitTestErrors([])(unitTest);

    return unitTest;
};


// testSummary :: UnitTest -> Promise _ { passed = Int, total = Int }
const testSummary = unitTest => {
    const unitTestAssertions = unitTest =>
        unitTest.reduce(name => tests => Array.foldl([])(acc => item => Array.concat(unitTestAssertions(item))(acc))(tests))(name => assertions => [assertions]);

    const allAssertions =
        unitTestAssertions(unitTest);

    const binaryAssertions =
        Array.map(assertion => assertion
            .then(_ => Promise.resolve(true))
            .catch(_ => Promise.resolve(false)))(allAssertions);

    return Promise.all(binaryAssertions)
        .then(items => Promise.resolve({
            passed: Array.length(Array.filter(i => i)(items)),
            total: Array.length(items)
        }))
};


const showSummary = unitTest => {
    testSummary(unitTest).then(summary => {
        console.log(`Passed ${summary.passed} out of ${summary.total}`);
    });

    return unitTest;
};


const setExitCodeOnFailures = unitTest => {
    testSummary(unitTest).then(summary => {
        if (summary.passed !== summary.total) {
            process.exitCode = -1;
        }
    });

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