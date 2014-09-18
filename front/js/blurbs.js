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
.controller('blurbsCtrl', function ($scope, data, $http) {
  $scope.blurbs = data.blurbs;
  $scope.$root.user = data.user;

  $scope.submit = function () {
    if (!$scope.message) return;
    $http.post('/api/blurbs', {
      message: $scope.message,
      user: $scope.$root.user
    })
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
  $scope.$root.user = data.user;

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
    return !$scope.submitting &&
      $scope.user &&
      $scope.user.username &&
      $scope.user.password &&
      $scope.user.password == $scope.confirmPassword;
  };

  $scope.signup = function () {
    $scope.submitting = true;
    $http.post('/api/users', this.user)
    .success(function (result) {
      $scope.$root.user = result.user;
      $scope.$hide();
    })
    .error(function (err) {
      $scope.signupForm.username.$setValidity('taken', !err.usernameTaken);
      $scope.signupForm.email.$setValidity('taken', !err.emailTaken);
    })
    .finally(function () {
      $scope.submitting = false;
    });
  };
})
.controller('loginCtrl', function ($scope, $http) {
  $scope.showError = function (model) {
    return {
      'has-error': model.$dirty && model.$invalid
    };
  };

  $scope.login = function () {
    $scope.submitting = true;
    $http.post('/api/sessions', this.user)
    .success(function (result) {
      $scope.$root.user = result.user;
      $scope.$hide();
    })
    .error(function (err) {
      $scope.loginForm.username.$setValidity('notFound', !err.userNotFound);
      $scope.loginForm.password.$setValidity('invalid', !err.invalidPassword);
    })
    .finally(function () {
      $scope.submitting = false;
    });
  };
})
.controller('userCtrl', function ($scope, $http) {
  $scope.logout = function () {
    $http.delete('/api/sessions/token')
    .success(function () {
      $scope.$root.user = null;
    });
  };
});
