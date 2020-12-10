'use strict';

const cheerio = require("../node_modules/cheerio");
const Knwl = require("../node_modules/knwl.js");
const knwlInstance = new Knwl("english");
const request = require("../node_modules/request");

const email = "canddi.com";
const options = {
    url: "https://www." + email,
    method: "GET"
};


var links = [];
var link;
request(options, function (err, response, html) {
    console.log("err=" + err + ", statusCode=" + response.statusCode)
    if (!err && response.statusCode == 200) {
        var $ = cheerio.load(html);
        knwlInstance.init($.text());
        var emails = knwlInstance.get("emails");
        var places = knwlInstance.get("places");
        console.log(emails);
        console.log(places);

        //Search the links in the footer
        $("footer").find("a").each(function () {  
            if ($(this).attr("href")) {
                link = String($(this).attr("href"));
                if (link.startsWith("http") && links.indexOf(link) === -1) {
                    links.push(link);
                }
            }
        });
        console.log(links);
    } else {
        console.log("Could not connect to website.");
    }
});

console.log("end");