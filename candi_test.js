'use strict';

const oCheerio = require("../node_modules/cheerio");
const oKnwl    = require("../node_modules/knwl.js");
const fRequest = require("../node_modules/request");
const oKnwlInstance = new oKnwl("english");

if (process.argv.length != 3) {
    console.log("Input one email");
    return -1;
} else {
    oKnwlInstance.init( process.argv[2] );
    const pFindEmail = oKnwlInstance.get("emails");
    if (pFindEmail.length === 1) {
        crawlDomain(process.argv[2]);
    } else {
        console.log("The email entered is invalid.");
        return -1;
    }
}


function crawlDomain(sEmail) {
    const sDomain = sEmail.slice(sEmail.indexOf('@') + 1);
    const oOptions = {
        url: "https://www." + sDomain,
        method: "GET"
    };

    var oInformation = {
        sDescription: "",
        pNames: [],
        pAddresses: [],
        pNumbers: [],
        pEmails: [],
        pLinks: []
    };

    fRequest(oOptions, function (sErr, oResponse, oHtml) {
        if (!sErr && oResponse.statusCode == 200) {
            const $ = oCheerio.load(oHtml);

            //Start with meta tags
            $("meta").each(function () {
                //Check if name attribute is author and the content attribute exists
                if ($(this).attr("name") === "author")
                    oInformation.pNames.push($(this).attr("content"));
                else if ($(this).attr("name") === "description")
                    oInformation.sDescription = $(this).attr("content");
            });

            //Check for external links to crawl, and for contact page
            var sLink;
            var sContactLink;
            $("a").each(function () {
                sLink = $(this).attr("href");
                if (sLink) {
                    if (sLink.startsWith("http") && !sLink.includes(sDomain) && oInformation.pLinks.indexOf(sLink) === -1)
                        oInformation.pLinks.push(sLink);
                    else if (sLink.includes("contact"))
                        sContactLink = sLink;
                }
            });

            const fSearchFooter = () => {
                traverseDOM($, oInformation, "footer");
                console.log(oInformation);
            }

            if (sContactLink) {
                crawlContactPage(oInformation, oKnwlInstance, sContactLink, function () {
                    fSearchFooter();
                });
            } else {
                fSearchFooter();
            }

        } else {
            if (sErr)
                console.log(sErr);
            else
                console.log("HTTP error: " + oResponse.statusCode);
        }
    });

}

function crawlContactPage(oInfo, oKnwl, sUrl, fCallback) {
    //Will search the entire body for useful information
    const oOptions = {
        url:    sUrl,
        method: "GET"
    };

    fRequest(oOptions, function (sErr, oResponse, oHtml) {
        if (!sErr && oResponse.statusCode == 200) {
            const $ = oCheerio.load(oHtml);
            traverseDOM($, oInfo, "body");
            fCallback();
        } else {
            if (sErr)
                console.log(sErr);
            else
                console.log("HTTP error: " + oResponse.statusCode);
            fCallback();
        }
    });
}

function traverseDOM($, oInfo, sStartNode) {
    //Checks the text of each node that has no children
    $(sStartNode).find("*:not(:has(*))").each(function () {
        var text = $(this).clone().children().remove().end().text()
        if (text) {
            checkKnwl(text, "phones", oInfo, oKnwlInstance);
            checkKnwl(text, "emails", oInfo, oKnwlInstance);
        }
    });
}

function checkKnwl(sText, sType, oInfo, oKnwl) {
    //Checks text for type (phones/places/emails), and adds to the information object if found.
    switch (sType) {
        case "phones":
            sText = sText.replace(/[^0-9]+/g, ""); //RegEx to remove any non numeric characters
            oKnwl.init(sText);
            var pFoundText = oKnwl.get("phones");
            for (let i = 0; i < pFoundText.length; i++) {
                if (oInfo.pNumbers.indexOf(pFoundText[i].phone) === -1)
                    oInfo.pNumbers.push(pFoundText[i].phone);
            }
        case "emails":
            oKnwl.init(sText);
            var pFoundText = oKnwl.get("emails");
            for (let i = 0; i < pFoundText.length; i++) {
                if (oInfo.pEmails.indexOf(pFoundText[i].address) === -1)
                    oInfo.pEmails.push(pFoundText[i].address);
            }
    }
}
