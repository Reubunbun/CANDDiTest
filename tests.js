const fCrawlDomain = require("./app");
const fs = require("fs");

const pEmails = [
    "", "notanemail", "almost@anemail@gmail.com", "tim@canddi.com/doesntexist/", "tim@canddi.com",
    "rp506@reubenpricecs.co.uk", "n@betterplaced.com", "r@lutonbennett.co.uk", "n@quintondavies.com",
    "l@platform-recruitment.com", "o@twitter.com", "y@linkedin.com", "e@oscar-tech.com"
]


var sEmail;
var sTestText = "";
for (var i = 0; i < pEmails.length; i++) {
    sEmail = pEmails[i];
    var oInformation = {
        sError: "",
        sDescription: "",
        pNames: [],
        pAddresses: [],
        pNumbers: [],
        pEmails: [],
        pLinks: []
    };

    console.log("running with " + sEmail);
    fCrawlDomain(sEmail, oInformation, function () {
        sTestText += String(i) + "\n";
        sTestText += sEmail + "\n";
        sTestText += JSON.stringify(oInformation) + "\n\n";
        console.log("writing: " + sTestText);
        fs.appendFileSync("results.txt", sTestText, (err) => {
            if (err) throw err;
        });
    });

}