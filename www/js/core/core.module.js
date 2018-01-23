angular.module('core', ['core.account']);

angular.module('core').factory('Api', function($timeout, $location) {
	var obj = {

		getUrl: function () {
			if (localStorage.getItem('url') == null) {
				return '/api';
			} else {
				return localStorage.getItem('url');
			}
		},

		getHeaders: function () {
			if (localStorage.getItem('headers') == null) {
				return {};
			} else {
				return JSON.parse(localStorage.getItem('headers'));
			}
		},
		
		handleErrors: function (data, status, type, redirect) {
			if (status == 0 && data == '') {
				$timeout(function(){
					alert('Possible cross domain call - check CORS headers.');
				});
			} else if (status == 400 && typeof data != 'undefined') {
				if (data.errors[0] != 'undefined') {
					// alert is a sync function and causes '$digest already in progress' if not wrapped in a timeout
					// need to define timeout
					$timeout(function(){
						alert(data.errors[0].message);
					});
				} else {
					console.log('status: ' + status);
					console.log('data: ' + data);
					$timeout(function(){
						alert('Unexpected error - see console for details');
					});
				}
			} else if (status == 404) {
				$timeout(function(){
					if (redirect != undefined) {
						$location.path('/' + redirect);
					}
					alert('This ' + type + ' does not exist');
				});
			} else {
				console.log('status: ' + status);
					console.log('data: ' + data);
				$timeout(function(){
					alert('Unexpected error - see console for details');
				});
			}
		}
	}

	return obj;
});

angular.module('core').factory('Money', function($timeout, $location) {
	var obj = {

		formatMoney: function(n, c, d, t){
			c = isNaN(c = Math.abs(c)) ? 2 : c, 
			d = d == undefined ? "." : d, 
			t = t == undefined ? "," : t, 
			s = n < 0 ? "-" : "", 
			i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
			j = (j = i.length) > 3 ? j % 3 : 0;
		   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
		 },

		format_discount_type: function (discount_type, currency) {
			if (discount_type == 1) {
				return obj.format_currency_format(currency);
			} else if (discount_type == 2) {
				return '%';
			}
		},

		format_currency_format: function(currency) {
			if (currency == 'GBP') {
				return '£';
			} else if (currency == 'USD') {
				return '$';
			} else {
				return currency + ' ';
			}
		},

		format_currency: function(type_id, currency, amount) {
			if (type_id == 8) {
				amount = -(amount);
			}
			
			if (amount < 0) {
				return '-' + obj.format_currency_format(currency) + obj.formatMoney(-amount, 2, '.', ',');
			} else {
				return obj.format_currency_format(currency) + obj.formatMoney(amount, 2, '.', ',');
			}
		}

	}

	return obj;
});