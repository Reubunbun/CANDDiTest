'use strict';

const oCheerio = require("../node_modules/cheerio");
const oKnwl    = require("../node_modules/knwl.js");
const fRequest = require("../node_modules/request");
const oKnwlInstance = new oKnwl("english");
module.exports = crawlDomain;

if (require.main === module) {
    main();
}


function main() {
    if (process.argv.length != 3) {
        console.log("Input one email");
        return -1;
    } else {
        oKnwlInstance.init(process.argv[2]);
        let pFindEmail = oKnwlInstance.get("emails");
        if (pFindEmail.length === 1) {
            crawlDomain(process.argv[2], oInfo => console.log(oInfo) );
        } else {
            console.log("The email entered is invalid.");
            return -1;
        }
    }
}

function crawlDomain(sEmail, fCallback) {
    const sDomain = sEmail.slice(sEmail.indexOf('@') + 1);
    const oOptions = {
        url: "https://www." + sDomain,
        method: "GET"
    };
    let oInformation = {
        pError:       [],
        sDescription: "",
        pNames:       [],
        pAddresses:   [],
        pNumbers:     [],
        pEmails:      [],
        pLinks:       []
    };

    fRequest(oOptions, (sErr, oResponse, oHtml) => {
        if (!sErr && oResponse.statusCode == 200) {
            const $ = oCheerio.load(oHtml);

            //Start with meta tags
            $("meta").each( function() {
                //Check if name attribute is author and the content attribute exists
                if ($(this).attr("name") === "author")
                    oInformation.pNames.push($(this).attr("content"));
                else if ($(this).attr("name") === "description")
                    oInformation.sDescription = $(this).attr("content");
            });

            //Check for external links to crawl, and for contact page
            let sLink;
            let sContactLink;
            $("a").each( function() {
                sLink = $(this).attr("href");
                if (sLink) {
                    //External link
                    if (sLink.startsWith("http") && !sLink.includes(sDomain) && oInformation.pLinks.indexOf(sLink) === -1)
                        oInformation.pLinks.push(sLink);
                    //Call link
                    else if (sLink.startsWith("tel:"))
                        checkKnwl(oInformation, sLink.slice(4), "phones")
                    //Email link
                    else if (sLink.startsWith("mailto:"))
                        checkKnwl(oInformation, sLink.slice(7), "emails")
                    //Contact page
                    else if (sLink.includes("contact")) {
                        if (sLink.startsWith("//"))
                            sContactLink = "https:" + sLink;
                        else if (sLink.startsWith('/'))
                            sContactLink = oOptions.url + sLink;
                        else if (!sLink.includes('/'))
                            sContactLink = oOptions.url + "/" + sLink;
                        else
                            sContactLink = sLink;
                    }
                }
            });

            //Check for schema object
            if ($("script[type='application/ld+json']").html()) {
                const oSchema = JSON.parse($("script[type='application/ld+json']").html());
                if ('address' in oSchema) oInformation.pAddresses.push(oSchema.address);
                if ('contactPoint' in oSchema) {
                    if ('telephone' in oSchema.contactPoint) {
                        if (oInformation.pNumbers.indexOf(oSchema.contactPoint.telephone) === -1)
                            oInformation.pNumbers.push(oSchema.contactPoint.telephone);
                    }
                    if ('email' in oSchema.contactPoint) {
                        if (oInformation.pEmails.indexOf(oSchema.contactPoint.email) === -1)
                            oInformation.pEmails.push(oSchema.contactPoint.email);
                    }
                }
            }

            if (sContactLink) {
                crawlContactPage(oInformation, sContactLink, () => {
                    traverseDOM($, oInformation, "body");
                    fCallback(oInformation);
                });
            } else {
                traverseDOM($, oInformation, "body");
                fCallback(oInformation);
            }

        } else {
            if (sErr)
                oInformation.pError.push(sErr);
            else
                oInformation.pError.push("HTTP error: " + oResponse.statusCode);
            fCallback(oInformation);
        }
    });

}

function crawlContactPage(oInfo, sUrl, fCallback) {
    //Will search the entire body for useful information
    const oOptions = {
        url:    sUrl,
        method: "GET"
    };

    fRequest(oOptions, (sErr, oResponse, oHtml) => {
        if (!sErr && oResponse.statusCode == 200) {
            const $ = oCheerio.load(oHtml);
            traverseDOM($, oInfo, "body");
        } else {
            if (sErr)
                oInformation.pError.push(sErr);
            else
                oInformation.pError.push("HTTP error: " + oResponse.statusCode);
        }
        fCallback();
    });
}

function traverseDOM($, oInfo, sStartNode) {
    //Checks the text of each node that has no children
    $(sStartNode).find("*:not(:has(*))").each(function () {
        let text = $(this).html();
        if (text) {
            if (text.includes("\n")) {
                text.split("\n").forEach(line => {
                    checkKnwl(oInfo, line, "phones");
                    checkKnwl(oInfo, line, "emails");
                });
            } else {
                checkKnwl(oInfo, text, "phones");
                checkKnwl(oInfo, text, "emails");
            }
        }
    });
}

function checkKnwl(oInfo, sText, sType) {
    //Checks text for type (phones/places/emails), and adds to the information object if found.
    let pFoundText;
    switch (sType) {
        case "phones":
            const fRemoveChar = index => {
                let sPart1 = sText.substring(0, index);
                let sPart2 = sText.substring(index + 1, sText.length);
                return sPart1 + sPart2;
            }
            const fIsDigit = char => parseInt(char) || char == '0'
            for (let i = 0; i < sText.length; i++) {
                if (i == 0) {
                    if (!fIsDigit(sText[i]) && fIsDigit(sText[i + 1])) {
                        sText = fRemoveChar(i);
                    }
                } else if (i == sText.length - 1) {
                    if (!fIsDigit(sText[i]) && fIsDigit(sText[i - 1])) {
                        sText = fRemoveChar(i);
                    }
                } else {
                    if (!fIsDigit(sText[i]) && fIsDigit(sText[i - 1]) && fIsDigit(sText[i + 1])) {
                        sText = fRemoveChar(i);
                    }
                }
            }
            oKnwlInstance.init(sText);
            pFoundText = oKnwlInstance.get("phones");
            for (let i = 0; i < pFoundText.length; i++) {
                if (oInfo.pNumbers.indexOf(pFoundText[i].phone) === -1)
                    oInfo.pNumbers.push(pFoundText[i].phone);
            }
        case "emails":
            oKnwlInstance.init(sText);
            pFoundText = oKnwlInstance.get("emails");
            for (let i = 0; i < pFoundText.length; i++) {
                if (oInfo.pEmails.indexOf(pFoundText[i].address) === -1)
                    oInfo.pEmails.push(pFoundText[i].address);
            }
    }
}
