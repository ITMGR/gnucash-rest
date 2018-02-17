function BillListCtrl($scope, Vendor, Bill, Dates) {

	$scope.date_type = 'opened';
	$scope.date_from = Date.today().add(-3).months().toString('yyyy-MM-dd');
	$scope.date_to = '';
	$scope.is_paid = '';
	$scope.is_active = 1;

	Vendor.query().then(function(vendors) {
		$scope.vendors = vendors;
	});

	$scope.bill = {};
	$scope.bill.id = '';
	$scope.bill.vendor_id = '';
	$scope.bill.date_opened = '';
	$scope.bill.notes = '';

	var lastParams = '';

	$scope.$on('$viewContentLoaded', function() {
		$('#billDateFrom').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});

		$('#billDateTo').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});
	});

	$scope.change = function() {

		var params = {
			'date_from': $scope.date_from,
			'date_to': $scope.date_to,
			'date_type': $scope.date_type,
			'is_paid': $scope.is_paid,
			'is_active': $scope.is_active
		};
		
		if (params != lastParams) {
			
			// Using $scope.bills = Bills.query(params); causes "$scope.bills.push is not a function" - probably because it's a promise not an array...
			Bill.query(params).then(function(bills) {
				$scope.bills = bills;
			});

			lastParams = params;
		}
		
	}

	// copied from vendor.js
	$scope.addBill = function() {

		var params = {
			id: '',
			vendor_id: $scope.bill.vendor_id,
			// TODO: currency should be based on the customer selected
			currency: 'GBP',
			date_opened: $scope.bill.date_opened,
			notes: $scope.bill.notes
		};

		Bill.add(params).then(function(bill) {
			$scope.bills.push(bill);
			$('#billForm').modal('hide');
			$('#billAlert').hide();

			$scope.bill.id = '';
			$scope.bill.vendor_id = '';
			$scope.bill.date_opened = '';
			$scope.bill.notes = '';
		}, function(reason) {
			if(typeof data.errors != 'undefined') {
				$('#billAlert').show();
				$scope.billError = data.errors[0].message;
			} else {
				console.log(data);
				console.log(status);	
			}
		});

	}

	// copied from vendor.js
	$scope.saveBill = function() {
		if ($scope.billNew == 1) {
			$scope.addBill();
		} else {
			// This may fail as it's possible to update the ID
			//$scope.updateBill($scope.bill.id);
		}
	}

	// copied from vendor.js
	$scope.emptyPostBill = function(id) {

		$scope.bill.id = id;
		$scope.bill.date_posted = Dates.format_todays_date();
		$scope.bill.date_due = Dates.format_todays_date();
		$scope.bill.posted_accumulatesplits = true;

		$('#billPostForm').modal('show');

	}

	// copied from vendor.js
	$scope.emptyPayBill = function(id) {

		$scope.bill.id = id;
		$scope.bill.date_paid = Dates.format_todays_date();

		$('#billPayForm').modal('show');

	}

	// copied from vendor.js - but removed vendor line
	$scope.emptyBill = function() {

		$scope.billTitle = 'Add bill';

		$scope.billNew = 1;

		$scope.bill.id = '';
		$scope.bill.date_opened = Dates.format_todays_date();
		$scope.bill.notes = '';

		$('#billForm').modal('show');

	}

	$scope.change();

}

function BillDetailCtrl($scope, $routeParams, $uibModal, Bill, Vendor, Account, Entry, Dates) {

	Vendor.query().then(function(vendors) {
		$scope.vendors = vendors;
	});

	Account.getBillAccountsForDropdown().then(function(accounts) {
		$scope.accounts = accounts;
	});

	// for posting / paying?
	/*
	Account.getAccountsForDropdown([11]).then(function(accounts) {
		$scope.accounts = accounts;
	});

	Account.getAccountsForDropdown([2, 1, 0, 4, 3]).then(function(transferAccounts) {
		$scope.transferAccounts = transferAccounts;
	}); */


	Bill.get($routeParams.billId).then(function(bill) {
		$scope.bill = bill;
	});

	$scope.entry = {};
	$scope.entry.bill_account = {};

	$scope.entry.guid = '';
	$scope.entry.date = '';
	$scope.entry.description = '';
	$scope.entry.bill_account.guid = '';
	$scope.entry.quantity = '';
	$scope.entry.bill_price = '';
	$scope.entry.discount_type = '';
	$scope.entry.discount = '';

	$scope.$on('$viewContentLoaded', function() {
		$('#entryDate').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});

		$('#billDateOpened').datepicker({
			'dateFormat': 'yy-mm-dd',
			'onSelect': function(dateText) {
				if (window.angular && angular.element) {
					angular.element(this).controller("ngModel").$setViewValue(dateText);
				}
			}
		});
	});

	$scope.populateBill = function(id) {

		$scope.billTitle = 'Edit bill';
		$('#billForm').modal('show');

	}

	$scope.saveBill = function() {

		var params = {
			id: $scope.bill.id,
			vendor_id: $scope.bill.owner.id,
			currency: 'GBP',
			date_opened: $scope.bill.date_opened,
			notes: $scope.bill.notes
		};

		Bill.update($scope.bill.id, params).then(function(bill) {
			
			$scope.bill = bill;

			$('#billForm').modal('hide');
			$('#billAlert').hide();

		}, function(data) {
			if(typeof data.errors != 'undefined') {
				$('#billAlert').show();
				$scope.billError = data.errors[0].message;
			} else {
				console.log(data);
				console.log(status);	
			}
		});

	}

	$scope.emptyPostBill = function(id) {

		//$scope.bill.id = id;
		$scope.bill.date_posted = Dates.format_todays_date();
		$scope.bill.date_due = Dates.format_todays_date();
		$scope.bill.posted_accumulatesplits = true;

        var popup = $uibModal.open({
            templateUrl: 'partials/bills/fragments/postform.html',
            controller: 'modalPostBillCtrl',
            size: 'sm',
            resolve: {
		        bill: function () {
		          return $scope.bill;
		        }
      		}
        });

		popup.result.then(function(bill) {

			console.log(bill);

			$scope.bill = bill;

			for (var i in $scope.bills) {
				if ($scope.bills[i].id == $scope.bill.id) {
					$scope.bills[i] = $scope.bill;
				}
			}

		}, function () {
			console.log('DIsmissed');
		});

	}

	// copied from vendor.js
	$scope.emptyPayBill = function(id) {

		$scope.bill.id = id;
		$scope.bill.date_paid = Dates.format_todays_date();

		$('#billPayForm').modal('show');

	}

	$scope.addEntry = function() {

		var params = {
			date: $scope.entry.date,
			description: $scope.entry.description,
			account_guid: $scope.entry.bill_account.guid,
			quantity: $scope.entry.quantity,
			price: $scope.entry.bill_price,
			discount_type: $scope.entry.discount_type,
			discount: (($scope.entry.discount == '') ? 0 : $scope.entry.discount) // allow discount to be left blank for easy entry
		};

		Entry.add('bill', $scope.bill.id, params).then(function(entry) {
			
			$scope.bill.entries.push(entry);

			$scope.bill = Bill.recalculate($scope.bill);

			$('#entryForm').modal('hide');
			$('#entryAlert').hide();

			$scope.entry.guid = '';
			$scope.entry.date = '';
			$scope.entry.description = '';
			$scope.entry.bill_account.guid = '';
			$scope.entry.quantity = '';
			$scope.entry.bill_price = '';
			$scope.entry.discount_type = '';
			$scope.entry.discount = '';

		}, function(data) {
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
		$scope.entry.date = Dates.format_todays_date(); // this should probably default to the bill date - not today's
		$scope.entry.description = '';
		$scope.entry.bill_account.guid = '';
		$scope.entry.quantity = '';
		$scope.entry.bill_price = '';
		$scope.entry.discount_type = 1;
		$scope.entry.discount = '';	

		$('#entryForm').modal('show');

	}

	$scope.deleteEntry = function(guid) {

		Entry.delete(guid).then(function() {
			for (var i = 0; i < $scope.bill.entries.length; i++) {
				if ($scope.bill.entries[i].guid == guid) {
					$scope.bill.entries.splice(i, 1);
				}

				$scope.bill = Bill.recalculate($scope.bill);
			}
		}, function(data) {
			console.log(data);
		});

	}

	$scope.populateEntry = function(guid) {

		Entry.get(guid).then(function(entry) {
			$scope.entryTitle = 'Edit entry';
			$scope.entryNew = 0;
			$scope.entry = entry;
			$('#entryForm').modal('show');
		});

	}

	$scope.updateEntry = function(guid) {

		var params = {
			guid: $scope.entry.guid,
			date: $scope.entry.date,
			description: $scope.entry.description,
			account_guid: $scope.entry.bill_account.guid,
			quantity: $scope.entry.quantity,
			price: $scope.entry.bill_price,
			discount_type: $scope.entry.discount_type,
			discount: $scope.entry.discount
		};

		Entry.update(guid, params).then(function(entry) {
			
			for (var i = 0; i < $scope.bill.entries.length; i++) {
				if ($scope.bill.entries[i].guid == entry.guid) {
					$scope.bill.entries[i] = entry;
				}
			}

			$scope.bill = Bill.recalculate($scope.bill);
			
			$('#entryForm').modal('hide');
			$('#entryAlert').hide();

			$scope.entry.guid = '';
			$scope.entry.date = '';
			$scope.entry.description = '';
			$scope.entry.inv_account.guid = '';
			$scope.entry.quantity = '';
			$scope.entry.inv_price = '';
			$scope.entry.discount_type = 1;
			$scope.entry.discount = '';

		}, function(data) {
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

// this is bad due to the case...
app.controller('modalPostBillCtrl', ['bill', '$scope', '$uibModalInstance', 'Account', 'Bill', 'Dates', function(bill, $scope, $uibModalInstance, Account, Bill, Dates) {

	$scope.picker = {
		billDatePosted: { opened: false },
		billDateDue: { opened: false },
		open: function(field) { $scope.picker[field].opened = true; }
	};

	Account.getBillAccountsForDropdown().then(function(accounts) {
		$scope.accounts = accounts;
	});

	$scope.close = function () {
		$uibModalInstance.dismiss('cancel');
	};

	// could change to generic function
	$scope.postBill = function() {

		Bill.get(bill.id).then(function(bill) {
			
			var params = {
				vendor_id: bill.owner.id,
				currency: bill.currency,
				date_opened: bill.date_opened,
				notes: bill.notes,
				posted: 1,
				posted_account_guid: $scope.bill.posted_account,
				posted_date: Dates.dateInput($scope.bill.date_posted),
				due_date: Dates.dateInput($scope.bill.date_due),
				posted_memo: $scope.bill.posted_memo,
				posted_accumulatesplits: $scope.bill.posted_accumulatesplits, // this is True but should be 1
				posted_autopay: 0
			};

			Bill.update(bill.id, params).then(function(bill) {

				$('#billPostAlert').hide();
				$uibModalInstance.close(bill);				

			}, function(data) {
				if(typeof data.errors != 'undefined') {
					$('#billPostAlert').show();
					$scope.billError = data.errors[0].message;
				} else {
					console.log(data);
					console.log(status);	
				}
			});

		});

	}

}]);
