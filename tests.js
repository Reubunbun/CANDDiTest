const fCrawlDomain = require("./app");
const fs = require("fs");

const pEmails = [
    "", "notanemail", "almost@anemail@gmail.com", "tim@canddi.com/doesntexist/", "tim@canddi.com",
    "rp506@reubenpricecs.co.uk", "n@betterplaced.com", "r@lutonbennett.co.uk", "n@quintondavies.com",
    "l@platform-recruitment.com", "o@twitter.com", "y@linkedin.com", "e@oscar-tech.com"
]

const sURLRegEx =
    /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;

let pTotalTime  = [0, 0];
let iTotalNames = 0;
let iTotalAddresses = 0;
let iTotalNumbers = 0;
let iTotalEmails = 0;
let iTotalLinks = 0;
let iCompletedTests = 0;

pEmails.forEach(executeTest);

function executeTest(sEmail) {
    let pHrStart  = process.hrtime();
    fCrawlDomain(sEmail, oInfo => {
        let pHrEnd = process.hrtime(pHrStart);
        let sTestText = `Result for ${sEmail}, took ${pHrEnd[0]}s ${pHrEnd[1] / 1000000}ms\n${JSON.stringify(oInfo)}\n`;
        sTestText += `Errors: ${oInfo.pError.length}, Names: ${oInfo.pNames.length}, Addresses: ${oInfo.pAddresses.length}, Numbers: ${oInfo.pNumbers.length}`;
        sTestText += `, Emails: ${oInfo.pEmails.length}, Links: ${oInfo.pLinks.length}`;
        let pBadURLs = oInfo.pLinks.filter(link => { link.match(sURLRegEx) });
        if (pBadURLs.length > 0) {
            sTestText += pBadURLs.length + "\n incorrect urls found: "
            pBadURLs.forEach(url => { sTestText += url + ", " });
        }
        sTestText += "\n\n";
        console.log("writing: " + sTestText);
        fs.appendFile("results.txt", sTestText, err => { if (err) throw err; });

        pTotalTime[0] += pHrEnd[0];
        pTotalTime[1] += pHrEnd[1] / 1000000;
        iTotalNames     += oInfo.pNames.length;
        iTotalAddresses += oInfo.pAddresses.length;
        iTotalNumbers   += oInfo.pNumbers.length;
        iTotalEmails    += oInfo.pEmails.length;
        iTotalLinks     += oInfo.pLinks.length;
        iCompletedTests += 1;

        if (iCompletedTests == pEmails.length) {
            sTestText  = `Total time taken: ${pTotalTime[0]}s ${pTotalTime[1]}ms, total names: ${iTotalNames}, total addressses: ${iTotalAddresses}`;
            sTestText += `, total numbers: ${iTotalNumbers}, total emails: ${iTotalEmails}, total links: ${iTotalLinks}\n\n\n`
            fs.appendFile("results.txt", sTestText, err => { if (err) throw err; });
        }
    });
}
