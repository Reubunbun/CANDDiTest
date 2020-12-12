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
    if (pFindEmail.length === 1)
        crawlDomain( process.argv[2] );
    else {
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

            //Check for external links to crawl
            var sLink;
            $("a").each(function () {
                sLink = $(this).attr("href");
                if (sLink) {
                    if (sLink.startsWith("http") && !sLink.includes(sDomain) && oInformation.pLinks.indexOf(sLink) === -1)
                        oInformation.pLinks.push(sLink);
                }
            });

            $("footer").find('*').each(function () {
                //Check for numbers/emails/places
                if ($(this).text()) {
                    checkKnwl($(this).text(), "phones", oInformation, oKnwlInstance);
                    checkKnwl($(this).text(), "emails", oInformation, oKnwlInstance);
                    checkKnwl($(this).text(), "places", oInformation, oKnwlInstance);
                }
            });

            console.log(oInformation);
        } else {
            if (sErr)
                console.log(sErr);
            else
                console.log("HTTP error: " + oResponse.statusCode);
        }
    });
}

function checkKnwl(sText, sType, oInfo, oKnwl) {
    //Checks text for type (phones/places/emails), and adds to the information object if found.
    oKnwl.init(sText);
    var pFoundText = oKnwl.get(sType);
    if (pFoundText.length > 0) {
        switch (sType) {
            case "emails":
                for (let i = 0; i < pFoundText.length; i++) {
                    if (oInfo.pEmails.indexOf(pFoundText[i].address) === -1)
                        oInfo.pEmails.push(pFoundText[i].address);
                }
                break;
            case "places":
                for (let i = 0; i < pFoundText.length; i++) {
                    if (oInfo.pAddresses.indexOf(pFoundText[i].place) === -1)
                        oInfo.pAddresses.push(pFoundText[i].place);
                }
                break;
            case "phones":
                for (let i = 0; i < pFoundText.length; i++) {
                    if (oInfo.pNumbers.indexOf(pFoundText[i].phone) === -1)
                        oInfo.pNumbers.push(pFoundText[i].phone);
                }
                break;
        }
    }
}
