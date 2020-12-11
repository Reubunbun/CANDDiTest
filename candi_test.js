'use strict';

const cheerio = require("../node_modules/cheerio");
const Knwl    = require("../node_modules/knwl.js");
const request = require("../node_modules/request");
const knwlInstance = new Knwl("english");

const email = "tim@canddi.com";
const options = {
    url: "https://www." + email.slice( email.indexOf('@') + 1 ),
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
var link;

request(options, function (err, response, html) {
    console.log("err=" + err + ", statusCode=" + response.statusCode)
    if (!err && response.statusCode == 200) {
        const $ = cheerio.load(html);

        //Start with meta tags
        $("meta").filter(function () {
            //Check if name attribute is author and the content attribute exists
            var name    = String( $(this).attr("name")    );
            var content = String( $(this).attr("content") );
            if (name === "author") {
                information.names.push(content);
            } else if (name === "description") {
                information.description = content;
            }
        });

        $("footer").find('*').each(function () {
            //Check for links
            if ($(this).prop("nodeName") === "A" && $(this).attr("href")) {
                link = String($(this).attr("href"));
                if (link.startsWith("http") && information.links.indexOf(link) === -1) {
                    information.links.push(link);
                }
            //Check for numbers/emails/places
            } else if ($(this).text()) {
                checkKnwl($(this).text(), "phones", information, knwlInstance);
                checkKnwl($(this).text(), "emails", information, knwlInstance);
                checkKnwl($(this).text(), "places", information, knwlInstance);
            }
        });

        console.log(information);
    } else {
        console.log("Could not connect to website.");
    }
});


function checkKnwl(text, type, info, knwl) {
    //Checks text for type (phones/places/emails), and adds to the information object if found.
    knwl.init(text);
    switch (type) {
        case "emails":
            var emails = knwl.get("emails");
            if (emails.length > 0) {
                for (let i = 0; i < emails.length; i++) {
                    if (info.emails.indexOf(emails[i].address) === -1) info.emails.push(emails[i].address);
                }
            }
        case "places":
            var places = knwl.get("places");
            if (places.length > 0) {
                for (let i = 0; i < places.length; i++) {
                    if (info.addresses.indexOf(places[i].place) === -1) info.addresses.push(places[i].place);
                }
            }
        case "phones":
            var phones = knwl.get("phones");
            if (phones.length > 0) {
                for (let i = 0; i < phones.length; i++) {
                    if (info.numbers.indexOf(phones[i].phone) === -1) info.numbers.push(phones[i].phone);
                }
            }
    }
}
