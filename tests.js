const fCrawlDomain = require("./app");
const fs = require("fs");

const pEmails = [
    "", "notanemail", "almost@anemail@gmail.com", "tim@canddi.com/doesntexist/", "tim@canddi.com",
    "rp506@reubenpricecs.co.uk", "n@betterplaced.com", "r@lutonbennett.co.uk", "n@quintondavies.com",
    "l@platform-recruitment.com", "o@twitter.com", "y@linkedin.com", "e@oscar-tech.com"
]

pEmails.forEach(executeTest);

function executeTest(sEmail) {
    let sTestText = "";
    let pHrStart = process.hrtime();
    fCrawlDomain(sEmail, oInfo => {
        let pHrEnd = process.hrtime(pHrStart);
        sTestText += `Result for ${sEmail}, took ${pHrEnd[0]}s ${pHrEnd[1] / 1000000}ms\n`;
        sTestText += JSON.stringify(oInfo) + "\n\n";
        console.log("writing: " + sTestText);
        fs.appendFile("results.txt", sTestText, err => { if (err) throw err; } );
    });
}
