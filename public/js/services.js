'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('Sprinklr.services', [])
.factory('getDataService', ['$http', function ($http) {

    var apiBaseUrl = "/api/";

    var init = function (callback) {
        $http.get(apiBaseUrl + 'init/')
         .success(function (data) {
             callback(null, data);
         })
         .error(function (e) {
             callback(e);
         });
    };

    var getUser = function (callback) {
        $http.get(apiBaseUrl + 'user/')
         .success(function (data) {
             callback(null, data);
         })
         .error(function (e) {
             callback(e);
         });
    };

    

    return {
        init:init,
        getUser: getUser    
    };
}]);
