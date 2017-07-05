const Unit = require("./index");

require("./test/UnitTest")
    .then(Unit.showErrors)
    .then(Unit.showSummary)
    .then(Unit.setExitCodeOnFailures);