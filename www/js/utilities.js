function nl2br (str, is_xhtml) {
	var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br />' : '<br>';
	return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}

function dateFormat(str) {
	if (str != null) {
		var d = new Date(str.substring(0,4) + '-' + str.substring(5,7) + '-' + str.substring(8,10));
		return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
	} else {
		return '';
	}
}

function pad(number) {
	if (number<=99) { number = ("00"+number).slice(-2); }
	return number;
}

// this is not very angulary - should be injected as an errors/gnucash object
function handleApiErrors($timeout, data, status) {
	if (status == 400 && typeof data != 'undefined') {
		if (data.errors[0] != 'undefined') {
			// alert is a sync function and causes '$digest already in progress' if not wrapped in a timeout
			// need to define timeout
			$timeout(function(){
				alert(data.errors[0].message);
			});
		}
	}
}

Number.prototype.formatMoney = function(c, d, t){
var n = this, 
	c = isNaN(c = Math.abs(c)) ? 2 : c, 
	d = d == undefined ? "." : d, 
	t = t == undefined ? "," : t, 
	s = n < 0 ? "-" : "", 
	i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "", 
	j = (j = i.length) > 3 ? j % 3 : 0;
   return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
 };

 function format_currency(type_id, currency, amount) {

	if (type_id == 8) {
		amount = -(amount);
	}

	var currencyformat = '';

	if (currency == 'GBP') {
		currencyformat = '£';
	}else if (currency == 'USD') {

		currencyformat = '$';
	} else {
		currencyformat = currency + ' ';
	}
	
	if (amount < 0) {
		return '-' + currencyformat + (-(amount)).formatMoney(2, '.', ',')
	//	return '<span style="color: #FF0000">-' + currencyformat + (-(amount)).formatMoney(2, '.', ',') + '</span>';
	} else {
		return currencyformat + amount.formatMoney(2, '.', ',');
	}

 }

 function format_todays_date() {
	var today = new Date();
	var dd = today.getDate();
	var mm = today.getMonth()+1; //January is 0!
	var yyyy = today.getFullYear();

	if(dd<10) {
		dd='0'+dd
	} 

	if(mm<10) {
		mm='0'+mm
	} 

	today = yyyy + '-' + mm + '-' + dd;
	return today;
 }
