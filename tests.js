const Unit = require("./index");

require("./test/UnitTest")
    .then(Unit.showDetail)
    .then(Unit.showErrors)
    .then(Unit.showSummary)
    .then(Unit.setExitCodeOnFailures);