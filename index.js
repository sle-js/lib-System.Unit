const Array = mrequire("core:Native.Data.Array:1.0.0");


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


const showDetail = unitTest => {
    const unitTestMessages = path => unitTest =>
        unitTest.reduce(name => tests =>
            Array.foldl([])(acc => item => Array.concat(acc)(unitTestMessages(Array.append(name)(path))(item)))(tests)
        )(name => assumption =>
            assumption
                .then(i => Promise.resolve("  " + Array.join(": ")(Array.append(name)(path))))
                .catch(i => Promise.resolve("Failed: " + Array.join(": ")(Array.append(name)(path)) + ": " + i.fileName + ": " + i.lineNumber + ": " + i.message)));

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
    showDetail,
    showErrors,
    showSummary,
    setExitCodeOnFailures
};