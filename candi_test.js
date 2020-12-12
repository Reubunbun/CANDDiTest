'use strict';

const cheerio = require("../node_modules/cheerio");
const Knwl    = require("../node_modules/knwl.js");
const request = require("../node_modules/request");
const knwlInstance = new Knwl("english");

const email  = "tim.langley@canddi.com/doesntexist/";
const domain = email.slice(email.indexOf('@') + 1);
const options = {
    url: "https://www." + domain,
    method: "GET"
};

var information = {
    description: "",
    names:       [],
    addresses:   [],
    numbers:     [],
    emails:      [],
    links:       []
};

request(options, function (err, response, html) {
    if (!err && response.statusCode == 200) {
        const $ = cheerio.load(html);

        //Start with meta tags
        $("meta").each(function () {
            //Check if name attribute is author and the content attribute exists
            if ($(this).attr("name") === "author")
                information.names.push( $(this).attr("name") );
            else if ($(this).attr("content") === "description")
                information.description = $(this).attr("content");
        });

        //Check for external links to crawl
        var link;
        $("a").each(function () {
            link = $(this).attr("href");
            if (link) {
                if (link.startsWith("http") && !link.includes(domain) && information.links.indexOf(link) === -1)
                    information.links.push(link);
            }
        });

        $("footer").find('*').each(function () {
            //Check for numbers/emails/places
            if ($(this).text()) {
                checkKnwl($(this).text(), "phones", information, knwlInstance);
                checkKnwl($(this).text(), "emails", information, knwlInstance);
                checkKnwl($(this).text(), "places", information, knwlInstance);
            }
        });

        console.log(information);
    } else {
        if (err)
            console.log(err);
        else
            console.log("HTTP error: " + response.statusCode);
    }
});

function checkKnwl(text, type, info, knwl) {
    //Checks text for type (phones/places/emails), and adds to the information object if found.
    knwl.init(text);
    var foundText = knwl.get(type);
    if (foundText.length > 0) {
        switch (type) {
            case "emails":
                for (let i = 0; i < foundText.length; i++) {
                    if (info.emails.indexOf(foundText[i].address) === -1)
                        info.emails.push(foundText[i].address);
                }
                break;
            case "places":
                for (let i = 0; i < foundText.length; i++) {
                    if (info.addresses.indexOf(foundText[i].place) === -1)
                        info.addresses.push(foundText[i].place);
                }
                break;
            case "phones":
                for (let i = 0; i < foundText.length; i++) {
                    if (info.numbers.indexOf(foundText[i].phone) === -1)
                        info.numbers.push(foundText[i].phone);
                }
                break;
        }
    }
}
