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


const rejectPromise = message => {
    const stack = myStackTrace();
    const call = stack[2];
    return Promise.reject({
        fileName: call.getFileName(),
        lineNumber: call.getLineNumber(),
        message: message
    });
};


function AssertionType(content) {
    this.content = content;
}


const AllGood =
    new AssertionType(Promise.resolve(true));


const Fail = message =>
    new AssertionType(rejectPromise(message));


AssertionType.prototype.then = function (fThen, fCatch) {
    return this.content.then(fThen, fCatch);
};


AssertionType.prototype.catch = function (fCatch) {
    return this.content.catch(fCatch);
};


AssertionType.prototype.isTrue = function (value) {
    if (value) {
        return this;
    } else {
        const rejection = rejectPromise("isTrue failed");
        return new AssertionType(this.content.then(_ => rejection));
    }
};


AssertionType.prototype.equals = function (a) {
    return b => {
        if (a === b) {
            return this;
        } else {
            const rejection = rejectPromise("equals failed: " + a.toString() + " != " + b.toString());
            return new AssertionType(this.content.then(_ => rejection));
        }
    }
};


const showErrors = unitTest => {
    const unitTestMessages = path => unitTest =>
        unitTest.reduce(name => tests =>
            Array.foldl([])(acc => item => Array.concat(acc)(unitTestMessages(Array.append(name)(path))(item)))(tests)
        )(name => assumption =>
            assumption
                .then(i => Promise.resolve(""))
                .catch(i => Promise.resolve(Array.join(": ")(Array.append(name)(path)) + ": " + i.fileName + ": " + i.lineNumber + ": " + i.message)));

    Promise.all(unitTestMessages([])(unitTest))
        .then(items => Array.filter(item => item.length > 0)(items))
        .then(items => items.forEach(i => console.log(i)));

    return unitTest;
};


// testSummary :: UnitTest -> Promise _ { passed = Int, total = Int }
const testSummary = unitTest => {
    const unitTestAssertions = unitTest =>
        unitTest.reduce(name => tests =>
            Array.foldl([])(acc => item => Array.concat(unitTestAssertions(item))(acc))(tests))(name => assertions => [assertions]);

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
    Fail
};