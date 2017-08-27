const Array = mrequire("core:Native.Data.Array:1.1.0");
const Assertion = mrequire("core:Test.Unit.Assertion:2.0.0");

const Unit = require("../index");


const tests = Unit.Suite("Test Suite")([
    Unit.Test("Passing Test")(
        Assertion.isTrue(true)),
    Unit.Test("Failing Test")(
        Assertion.isTrue(false)),
    Unit.Suite("Nested Test Suite")([
        Unit.Test("Nested Passing Test")(
            Assertion
                .equals(10)(10)
                .isTrue(11 === 11)
        ),
        Unit.Test("Nested Failing Test")(
            Assertion
                .equals(10)(11)
                .isTrue(22 === 22)
        )
    ])
]);


const totalTests = unitTest =>
    unitTest.then(test =>
        test.reduce(
            name => tests => Promise.all(tests.map(totalTests)).then(Array.sum))(
            name => assertion => 1));

const passedTests = unitTest =>
    unitTest.then(test =>
        test.reduce(
            name => tests => Promise.all(tests.map(passedTests)).then(Array.sum))(
            name => assertion => assertion.isAllGood() ? 1 : 0));


module.exports = Unit.Suite("Unit Test Test")([
    totalTests(tests).then(total => Unit.Test("Total tests is 4")(Assertion.equals(4)(total))),
    passedTests(tests).then(total => Unit.Test("Passed tests is 2")(Assertion.equals(2)(total)))
]);
