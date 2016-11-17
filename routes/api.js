/*
 * Serve JSON to our AngularJS client
 */

var express = require('express');
var app = express();


exports.powerbi = function (req, res) {
    console.log("\n\n\npower bi called");
    console.log("\n\n\npower bi called" + req.user);
}


