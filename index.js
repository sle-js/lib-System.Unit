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


UnitTest$.prototype.flatten = function () {
    const flattenUnitTest = path => unitTest =>
        unitTest.then(test =>
            test.reduce(
                name => tests =>
                    Promise.all(tests.map(flattenUnitTest(Array.append(name)(path)))).then(Array.foldl([])(Array.concat)))(
                name => assertion =>
                    ({name: Array.append(name)(path), assertion: assertion}))
        );

    return flattenUnitTest([])(Promise.resolve(this));
};


const showTest = item =>
    console.log(item.assertion.failContent().reduce(
        () => "  " + Array.join(": ")(item.name))(
        i => "Failed: " + Array.join(": ")(item.name) + ": " + i.fileName + ": " + i.lineNumber + ": " + i.message));


const showErrors = unitTest =>
    unitTest
        .flatten()
        .then(Array.filter(item => !item.assertion.isAllGood()))
        .then(items => items.forEach(showTest))
        .then(_ => unitTest);


const showDetail = unitTest =>
    unitTest
        .flatten()
        .then(items => items.forEach(showTest))
        .then(_ => unitTest);


const countOfPassedTests = items =>
    Array.length(Array.filter(item => item.assertion.isAllGood())(items));


const countOfTests = items =>
    Array.length(items);


const showSummary = unitTest =>
    unitTest
        .flatten()
        .then(items => console.log(`Passed ${countOfPassedTests(items)} out of ${countOfTests(items)}`))
        .then(_ => unitTest);


const setExitCodeOnFailures = unitTest =>
    unitTest
        .flatten()
        .then(items => {
            if (countOfPassedTests(items) !== countOfTests(items)) {
                process.exitCode = -1;
            }
        })
        .then(_ => unitTest);


module.exports = {
    Suite,
    Test,
    showDetail,
    showErrors,
    showSummary,
    setExitCodeOnFailures
};