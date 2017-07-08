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

const isAllGood = (assertion) =>
    assertion.reduce(x => true)(file => lineno => msg => false);

const passedTests = unitTest =>
    unitTest.reduce(name => tests => Array.foldl(0)(acc => t => acc + passedTests(t))(tests))(name => assertion => isAllGood(assertion) ? 1 : 0);


module.exports = Unit.Suite("Unit Test Test")([
    Unit.Test("Total tests is 4")(Unit.AllGood.equals(4)(totalTests(tests))),
    Unit.Test("Passed tests is 2")(Unit.AllGood.equals(2)(passedTests(tests)))
]);

