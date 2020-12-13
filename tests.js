const fCrawlDomain = require("./app");
const fs = require("fs");

const pEmails = [
    "", "notanemail", "almost@anemail@gmail.com", "tim@canddi.com/doesntexist/", "tim@canddi.com",
    "rp506@reubenpricecs.co.uk", "n@betterplaced.com", "r@lutonbennett.co.uk", "n@quintondavies.com",
    "l@platform-recruitment.com", "o@twitter.com", "y@linkedin.com", "e@oscar-tech.com"
]


pEmails.forEach(executeTest);

function executeTest(sEmail) {
    var oInformation = {
        sError: "",
        sDescription: "",
        pNames: [],
        pAddresses: [],
        pNumbers: [],
        pEmails: [],
        pLinks: []
    };
    var sTestText = "";
    fCrawlDomain(sEmail, oInformation, function () {
        sTestText += sEmail + "\n";
        sTestText += JSON.stringify(oInformation) + "\n\n";
        console.log("writing: " + sTestText);
        fs.appendFileSync("results.txt", sTestText, (err) => {
            if (err) throw err;
        });
        console.log("task complete")
    });
}
