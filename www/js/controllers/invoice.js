function InvoiceListCtrl($scope, $http, $timeout) {

	$scope.date_due_from = '';
	$scope.date_due_to = '';
	$scope.is_paid = '';
	$scope.is_active = 1;

	var lastParams = '';

	$scope.$on('$viewContentLoaded', function() {
		$('#invoiceDateDueFrom').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});

		$('#invoiceDateDueTo').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});
	});

	$scope.change = function() {

		var params = '';

		if(/[0-9]{4}-[0-9]{2}-[0-9]{2}/i.test($scope.date_due_from)) {
			if (params != '') {
				params = params + '&';
			}
			params = params + 'date_due_from=' + $scope.date_due_from;
		}

		if(/[0-9]{4}-[0-9]{2}-[0-9]{2}/i.test($scope.date_due_to)) {
			if (params != '') {
				params = params + '&';
			}
			params = params + 'date_due_to=' + $scope.date_due_to;
		}

		if ($scope.is_paid != '') {
			if (params != '') {
				params = params + '&';
			}
			params = params + 'is_paid=' + $scope.is_paid;
		}

		if ($scope.is_active != '') {
			if (params != '') {
				params = params + '&';
			}
			params = params + 'is_active=' + $scope.is_active;
		}

		if (params != '') {
			params = '?' +  params;
		}
		
		if (params != lastParams) {

			$http.get('/api/invoices' + params)
				.success(function(data) {
					$scope.invoices = data;

					for (var invoice in $scope.invoices) {
						$scope.invoices[invoice].total = format_currency(8, 'GBP', -$scope.invoices[invoice].total);
					}
				})
				.error(function(data, status) {
					handleApiErrors($timeout, data, status);
				})
			;

			lastParams = params;

		}
	}

	$scope.change();

}

function InvoiceDetailCtrl($scope, $routeParams, $http, $timeout) {

	$http.get('/api/customers')
		.success(function(data) {
			$scope.customers = data;
		})
		.error(function(data, status) {
			handleApiErrors($timeout, data, status);
		})
	;

	$http.get('/api/accounts')
		.success(function(data) {
			var accounts = getSubAccounts($http, $timeout, data, 0);
			var invoiceAccounts = [];

			// limit accounts to income accounts and remove placeholder accounts 
			for (var i in accounts) {
				if (accounts[i].type_id == 8 && !accounts[i].placeholder) {
					invoiceAccounts.push(accounts[i]);
				}
			}

			$scope.accounts = invoiceAccounts;
		})
		.error(function(data, status) {
			handleApiErrors($timeout, data, status);
		})
	;

	$http.get('/api/invoices/' + $routeParams.invoiceId)
		.success(function(data) {
			$scope.invoice = data;

			$scope.invoice.notes = nl2br($scope.invoice.notes);
			$scope.invoice.date_opened = dateFormat($scope.invoice.date_opened);
			$scope.invoice.date_due = dateFormat($scope.invoice.date_due);

			for (var entry in $scope.invoice.entries) {
				$scope.invoice.entries[entry].date = dateFormat($scope.invoice.entries[entry].date);
				$scope.invoice.entries[entry].total_ex_discount = $scope.invoice.entries[entry].quantity * $scope.invoice.entries[entry].inv_price;
				// does not take into account discounts - how do these work?
				$scope.invoice.entries[entry].total_inc_discount = $scope.invoice.entries[entry].total_ex_discount.formatMoney(2, '.', ',');
				$scope.invoice.entries[entry].inv_price = $scope.invoice.entries[entry].inv_price.formatMoney(2, '.', ',');
				$scope.invoice.entries[entry].discount = $scope.invoice.entries[entry].discount.formatMoney(2, '.', ',');
			}

			$scope.invoice.total = $scope.invoice.total.formatMoney(2, '.', ',');
		})
		.error(function(data, status) {
			handleApiErrors($timeout, data, status);
		})
	;

	$scope.entry = {};
	$scope.entry.inv_account = {};

	$scope.entry.guid = '';
	$scope.entry.date = '';
	$scope.entry.description = '';
	$scope.entry.inv_account.guid = '';
	$scope.entry.quantity = '';
	$scope.entry.inv_price = '';

	$scope.$on('$viewContentLoaded', function() {
		$('#entryDate').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});

		$('#invoiceDateOpened').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});
	});

	$scope.populateInvoice = function(id) {

		$http.get('/api/invoices/' + id)
			.success(function(data) {
				$scope.invoiceTitle = 'Edit invoice';
				//$scope.invoiceNew = 0;
				$scope.invoice = data;
				$('#invoiceForm').modal('show');
			})
			.error(function(data, status) {
				handleApiErrors($timeout, data, status);
			})
		;

	}

	$scope.saveInvoice = function() {

		var data = {
			id: $scope.invoice.id,
			customer_id: $scope.invoice.owner.id,
			currency: 'GBP',
			date_opened: $scope.invoice.date_opened,
			notes: $scope.invoice.notes
		};

		$http({
			method: 'POST',
			url: '/api/invoices/' + $scope.invoice.id,
			transformRequest: function(obj) {
				var str = [];
				for(var p in obj)
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				return str.join("&");
			},
			data: data,
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		}).success(function(data) {

			$('#invoiceForm').modal('hide');
			$('#invoiceAlert').hide();

			$scope.invoice = data;

			
		}).error(function(data, status, headers, config) {
			if(typeof data.errors != 'undefined') {
				$('#invoiceAlert').show();
				$scope.invoiceError = data.errors[0].message;
			} else {
				console.log(data);
				console.log(status);	
			}
		});

	}

	$scope.addEntry = function() {

		var data = {
			date: $scope.entry.date,
			description: $scope.entry.description,
			account_guid: $scope.entry.inv_account.guid,
			quantity: $scope.entry.quantity,
			price: $scope.entry.inv_price
		};

		$http({
			method: 'POST',
			url: '/api/invoices/' + $scope.invoice.id + '/entries' ,
			transformRequest: function(obj) {
				var str = [];
				for(var p in obj)
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				return str.join("&");
			},
			data: data,
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		}).success(function(data) {

			data.date = dateFormat(data.date);
			data.total_ex_discount = data.quantity * data.inv_price;
			// does not take into account discounts - how do these work?
			data.total_inc_discount = data.total_ex_discount.formatMoney(2, '.', ',');
			data.inv_price = data.inv_price.formatMoney(2, '.', ',');
			data.discount = data.discount.formatMoney(2, '.', ',');

			$scope.invoice.entries.push(data);
			$('#entryForm').modal('hide');
			$('#entryAlert').hide();

			$scope.entry.guid = '';
			$scope.entry.date = '';
			$scope.entry.description = '';
			$scope.entry.inv_account.guid = '';
			$scope.entry.quantity = '';
			$scope.entry.inv_price = '';
			
		}).error(function(data, status, headers, config) {
			if(typeof data.errors != 'undefined') {
				$('#entryAlert').show();
				$scope.entryError = data.errors[0].message;
			} else {
				console.log(data);
				console.log(status);	
			}
		});
	}

	$scope.saveEntry = function() {
		if ($scope.entryNew == 1) {
			$scope.addEntry();
		} else {
			// This may fail as it's possible to update the ID
			$scope.updateEntry($scope.entry.guid);
		}
	}

	$scope.emptyEntry = function() {

		$scope.entryTitle = 'Add entry';

		$scope.entryNew = 1;

		$scope.entry.guid = '';
		$scope.entry.date = format_todays_date(); // this should probably default to the invoice date - not today's
		$scope.entry.description = '';
		$scope.entry.inv_account.guid = '';
		$scope.entry.quantity = '';
		$scope.entry.inv_price = '';		

		$('#entryForm').modal('show');

	}

	$scope.deleteEntry = function(guid) {

		$http({
			method: 'DELETE',
			url: '/api/entries/' + guid
		}).success(function(data) {

			for (var i = 0; i < $scope.invoice.entries.length; i++) {
				if ($scope.invoice.entries[i].guid == guid) {
					$scope.invoice.entries.splice(i, 1);
				}
			}
			
		}).error(function(data, status) {
			handleApiErrors($timeout, data, status);
		});

	}

	$scope.populateEntry = function(guid) {

		$http.get('/api/entries/' + guid)
			.success(function(data) {
				$scope.entryTitle = 'Edit entry';
				$scope.entryNew = 0;
				$scope.entry = data;
				$('#entryForm').modal('show');
			})
			.error(function(data, status) {
				handleApiErrors($timeout, data, status);
			})
		;

	}

	$scope.updateEntry = function(guid) {

		var data = {
			guid: $scope.entry.guid,
			date: $scope.entry.date,
			description: $scope.entry.description,
			account_guid: $scope.entry.inv_account.guid,
			quantity: $scope.entry.quantity,
			price: $scope.entry.inv_price
		};

		$http({
			method: 'POST',
			url: '/api/entries/' + guid,
			transformRequest: function(obj) {
				var str = [];
				for(var p in obj)
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				return str.join("&");
			},
			data: data,
			headers: {'Content-Type': 'application/x-www-form-urlencoded'}
		}).success(function(data) {

			for (var i = 0; i < $scope.invoice.entries.length; i++) {
				if ($scope.invoice.entries[i].guid == data.guid) {
					$scope.invoice.entries[i] = data;

					$scope.invoice.entries[i].date = dateFormat($scope.invoice.entries[i].date);
					$scope.invoice.entries[i].total_ex_discount = $scope.invoice.entries[i].quantity * $scope.invoice.entries[i].inv_price;
					// does not take into account discounts - how do these work?
					$scope.invoice.entries[i].total_inc_discount = $scope.invoice.entries[i].total_ex_discount.formatMoney(2, '.', ',');
					$scope.invoice.entries[i].inv_price = $scope.invoice.entries[i].inv_price.formatMoney(2, '.', ',');
					$scope.invoice.entries[i].discount = $scope.invoice.entries[i].discount.formatMoney(2, '.', ',');
				}
			}

			$('#entryForm').modal('hide');
			$('#entryAlert').hide();

			$scope.entry.guid = '';
			$scope.entry.date = '';
			$scope.entry.description = '';
			$scope.entry.inv_account.guid = '';
			$scope.entry.quantity = '';
			$scope.entry.inv_price = '';
			
		}).error(function(data, status, headers, config) {
			if(typeof data.errors != 'undefined') {
				$('#entryAlert').show();
				$scope.entryError = data.errors[0].message;
			} else {
				console.log(data);
				console.log(status);	
			}
		});
	}

}