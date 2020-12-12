'use strict';

const cheerio = require("../node_modules/cheerio");
const Knwl    = require("../node_modules/knwl.js");
const request = require("../node_modules/request");
const knwlInstance = new Knwl("english");

const email  = "tim.langley@canddi.com";
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
var link;

request(options, function (err, response, html) {
    console.log("err=" + err + ", statusCode=" + response.statusCode)
    if (!err && response.statusCode == 200) {
        const $ = cheerio.load(html);

        var name;
        var content;
        //Start with meta tags
        $("meta").each(function () {
            //Check if name attribute is author and the content attribute exists
            name    = String( $(this).attr("name")    );
            content = String( $(this).attr("content") );
            if (name === "author") {
                information.names.push(content);
            } else if (name === "description") {
                information.description = content;
            }
        });

        //Check for external links to crawl
        $("a").each(function () {
            if ($(this).attr("href")) {
                link = String($(this).attr("href"));
                if (link.startsWith("http") && !link.includes(domain) && information.links.indexOf(link) === -1) {
                    information.links.push(link);
                    //if (link.indexOf("www.facebook.com") > -1) crawlFacebook(link, information);
                }
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
        if (err) {
            console.log(err);
        } else if (response.statusCode != 200) {
            console.log("HTTP error: " + response.statusCode);
        }
    }
});

function crawlFacebook(link, info) {
    //Crawl facebook page to find company location + phone number
    //Doesn't work as facebook doesn't allow crawling like this, would be
    //better to use their api with an access token.
    const options = {
        url: link.endsWith("/about/") ? link : link + "/about/",
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36 Edg/85.0.564.44" }
    };
    request(options, function (err, response, html) {
        console.log("err=" + err + ", statusCode=" + response.statusCode)
        if (!err && response.statusCode == 200) {
            const $ = cheerio.load(html);
            console.log($.text());
        } else {
            console.log("Could not connect to website.");
        }
    });
}

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
