const Array = mrequire("core:Native.Data.Array:1.0.0");


function UnitTest$(content) {
    this.content = content;
}


// Suite :: name -> List (Promise _ UnitTest) -> Promise _ UnitTest
const Suite = name => tests =>
    Promise.resolve(new UnitTest$([0, name, tests]));


// Test :: name -> Assertion -> Promise _ UnitTest
const Test = name => assertion =>
    Promise.resolve(new UnitTest$([1, name, assertion]));


UnitTest$.prototype.reduce = function (fSuite) {
    return fUnit => {
        switch (this.content[0]) {
            case 0:
                return fSuite(this.content[1])(this.content[2]);
            default:
                return fUnit(this.content[1])(this.content[2]);
        }
    }
};


const showErrors = unitTest => {
    const unitTestMessages = path => unitTest =>
        unitTest.then(test =>
            test.reduce(
                name => tests =>
                    Promise.all(tests.map(unitTestMessages(Array.append(name)(path)))).then(Array.foldl([])(Array.concat)))(
                name => assertion =>
                    assertion.failContent().reduce(
                        () => "")(
                        i => "Failed: " + Array.join(": ")(Array.append(name)(path)) + ": " + i.fileName + ": " + i.lineNumber + ": " + i.message))
        );

    unitTestMessages([])(Promise.resolve(unitTest))
        .then(items => Array.filter(item => item.length > 0)(items))
        .then(items => items.forEach(i => console.log(i)));

    return unitTest;
};


const showDetail = unitTest => {
    const unitTestMessages = path => unitTest =>
        unitTest.then(test =>
            test.reduce(
                name => tests =>
                    Promise.all(tests.map(unitTestMessages(Array.append(name)(path)))).then(Array.foldl([])(Array.concat)))(
                name => assertion =>
                    assertion.failContent().reduce(
                        () => "  " + Array.join(": ")(Array.append(name)(path)))(
                        i => "Failed: " + Array.join(": ")(Array.append(name)(path)) + ": " + i.fileName + ": " + i.lineNumber + ": " + i.message))
        );

    unitTestMessages([])(Promise.resolve(unitTest))
        .then(items => items.forEach(i => console.log(i)));

    return unitTest;
};


const testSummary = unitTest => {
    const from = total => passed =>
        [total, passed];

    const zero =
        [0, 0];

    const add = a => b =>
        [a[0] + b[0], a[1] + b[1]];

    const accumumulateTestSummary = unitTest =>
        unitTest.then(test =>
            test.reduce(
                name => tests =>
                    Promise.all(tests.map(accumumulateTestSummary)).then(Array.foldl(zero)(add)))(
                name => assertion =>
                    from(1)(assertion.isAllGood() ? 1 : 0))
        );

    return accumumulateTestSummary(Promise.resolve(unitTest)).then(answer => ({
        passed: answer[1],
        total: answer[0]
    }));
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