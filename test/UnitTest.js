const Array = mrequire("core:Native.Data.Array:1.0.0");

const Unit = require("../index");


const tests = Unit.Suite("Test Suite")([
    Unit.Test("Passing Test")(
        Unit.AllGood.isTrue(true)),
    Unit.Test("Failing Test")(
        Unit.fail("Houston we have a problem")),
    Unit.Suite("Nested Test Suite")([
        Unit.Test("Nested Passing Test")(
            Unit.AllGood
                .equals(10)(10)
                .isTrue(11 === 11)
        ),
        Unit.Test("Nested Failing Test")(
            Unit.AllGood
                .equals(10)(11)
                .isTrue(22 === 22)
        )
    ])
]);


const totalTests = unitTest =>
    unitTest.reduce(name => tests => Array.foldl(0)(acc => t => acc + totalTests(t))(tests))(name => assertion => 1);


const passedTests = unitTest => {
    const countPassedTests = count => unitTest =>
        unitTest.reduce(
            name => tests => Array.foldl(count)(acc => t => countPassedTests(acc)(t))(tests)
        )(name => assertion =>
            assertion.then(_ => count.then(c => Promise.resolve(c + 1))).catch(_ => count));

    return countPassedTests(Promise.resolve(0))(unitTest);
};


module.exports = Unit.Suite("Unit Test Test")([
    Unit.Test("Total tests is 4")(Unit.AllGood.equals(4)(totalTests(tests))),
    Unit.Test("Passed tests is 2")(passedTests(tests).then(count => Unit.AllGood.equals(2)(count)))
]);
