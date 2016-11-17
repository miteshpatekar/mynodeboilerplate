'use strict';

/* Controllers */

angular.module('Sprinklr.controllers', ['ngToast']).
  controller('AppCtrl', function ($scope, $http, $location, $route, $window, getDataService, ngToast) {
      $scope.$location = $location;
     
      if (sessionStorage.username === undefined) {
          $scope.username = "";
          $scope.isAuthenticated = false;
      }
      else {
          $scope.username = sessionStorage.username;
          $scope.isAuthenticated = true;
      }

      getDataService.init(function (error, data) {
          if (!error) {
              if (!data) {
              }
              else {
                  sessionStorage.PowerBIGroupName = data;          
              }
          } else {
              $scope.name = 'Error!';
          }
      });

      getDataService.getUser(function (error, data) {
          if (!error) {
              if (!data) {
              }
              else {
                  sessionStorage.username = data.name;
                  sessionStorage.email = data.unique_name;
                  sessionStorage.accessToken = data.accessToken;
                  $scope.username = data.name;
                  $scope.accessToken = data.accessToken;
                  $scope.isAuthenticated = true;
              }
          } else {
              $scope.name = 'Error!';
          }
      });

      $scope.LogOut = function () {
          sessionStorage.clear();
          $window.location.href = '/logout';
      }

      $scope.onDashboardClick = function () {
          $scope.collapsed = !$scope.collapsed;
          if ($scope.collapsed)
          {
              $scope.dashboardClass = "active";
              $window.location.href = '#/billing';
          }    
          else
              $scope.dashboardClass = "";
      }

      $scope.onSubmenuClick = function () {
          $scope.dashboardClass = "active";
      }
  }).
  controller('Home', function ($scope, $location) {
      $scope.isDashboard = "false";
  }).
controller('Billing', function ($scope, $routeParams, $http, $window, getDataService,$sce) {
    if (sessionStorage.username === undefined) {
        $window.location.href = '/login';
    }

    var dataToken = {
        accessToken: sessionStorage.accessToken
    }

}).
controller('Error', function ($scope, $routeParams, $http) {

});
