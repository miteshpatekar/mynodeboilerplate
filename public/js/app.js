'use strict';

// Declare app level module which depends on filters, and services

angular.module('Sprinklr', [
  'Sprinklr.controllers',
  'Sprinklr.filters',
  'Sprinklr.services',
  'Sprinklr.directives', 'ngRoute', 'ui.bootstrap'
]).
config(function ($routeProvider, $locationProvider) {
    $routeProvider.
      when('/home', {
          templateUrl: 'partials/home',
          controller: 'Home'
      }).
      when('/billing', {
          templateUrl: 'partials/billing',
          controller: 'Billing'
      }).
      when('/error', {
          templateUrl: 'partials/error',
          controller: 'Error'
      }).
      otherwise({
          redirectTo: '/subscriptions'
      });

    //$locationProvider.html5Mode(true);
});
