var dataLoaderRunner = [
  'dataLoader',
  function (dataLoader) { return dataLoader(); }
];

angular.module('blurbs', ['ngRoute', 'mgcrea.ngStrap', 'ngAnimate'])
.config(function ($routeProvider, $locationProvider) {
  $routeProvider.when('/blurbs', {
    templateUrl: '/html/blurbs/getIndex.html',
    controller: 'blurbsCtrl',
    resolve: {
      data: dataLoaderRunner
    }
  }).when('/blurbs/:blurbsId/comments', {
    templateUrl: '/html/blurbs/comments/getIndex.html',
    controller: 'commentsCtrl',
    resolve: {
      data: dataLoaderRunner
    }
  }).otherwise({
    redirectTo: '/blurbs'
  });

  $locationProvider.html5Mode(true);
})
.service('dataLoader', function ($location, $http) {
  return function () {
    if (preloadedData) {
      var data = preloadedData;
      preloadedData = null;
      return data;
    } else {
      return $http.get( '/api' + $location.path() ).then(function (res) {
        return res.data;
      });
    }
  };
})
.controller('blurbsCtrl', function ($scope, $http, data) {
  $scope.blurbs = data;

  $scope.submit = function () {
    if (!$scope.message) return;
    $http.post('/api/blurbs', { message: $scope.message })
    .success(function (data) {
      if (!$scope.blurbs) return;
      $scope.blurbs.unshift(data[0]);
    });
    $scope.message = "";
  };

  $scope.loadMore = function () {
    var latestBlurb = $scope.blurbs[$scope.blurbs.length - 1];
    $scope.loadingMore = true;

    $http.get('/api/blurbs?toDate=' + latestBlurb.created_at)
    .success(function (data) {
      $scope.loadingMore = false;
      $scope.noMore = data.length < 5;
      $scope.blurbs = $scope.blurbs.concat(data);
    });
  };
})
.controller('commentsCtrl', function ($scope, $http, $routeParams, data) {
  var blurbsId = $routeParams.blurbsId;
  var url = '/api/blurbs/' + blurbsId + '/comments';

  $scope.blurb = data.blurb;
  $scope.comments = data.comments;

  $scope.submit = function () {
    if (!$scope.message) return;
    $http.post(url, { message: $scope.message }).success(function (data) {
      if (!$scope.comments) return;
      $scope.comments.unshift(data[0]);
    });
    $scope.message = "";
  };
})
.controller('signupCtrl', function ($scope, $http) {
  $scope.showError = function (model) {
    return {
      'has-error': model.$dirty && model.$invalid
    };
  };

  $scope.$watch('user.password + confirmPassword', function () {
    if ($scope.user && !$scope.user.password || !$scope.confirmPassword) return;

    $scope.signupForm.confirmPassword.$setValidity(
      'match',
      $scope.user.password === $scope.confirmPassword
    );
  });

  $scope.submittable = function () {
    return this.signupForm.$valid && this.signupForm.$dirty
  };

  $scope.signup = function () {
    $http.post('/api/users', this.user)
    .success(function (user) {
      $scope.$root.user = user;
      $scope.$hide();
    })
    .error(function (err) {
      $scope.signupForm.username.$error.taken = err.taken;
    });
  };
});
