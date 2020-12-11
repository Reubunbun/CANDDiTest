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
        var $ = cheerio.load(html);

        //Start with meta tags
        $("meta").filter(function () {
            //Check if name attribute is author and the content attribute exists
            var name = String($(this).attr("name"));
            var content = String($(this).attr("content"));
            console.log(name + ", " + content);
        });

        //Search the links in the footer
        $("footer").find("a").each(function () {
            if ($(this).attr("href")) {
                link = String( $(this).attr("href") );
                if (link.startsWith("http") && information.links.indexOf(link) === -1) {
                    information.links.push(link);
                }
            }
        });

        console.log(information);
    } else {
        console.log("Could not connect to website.");
    }
});
