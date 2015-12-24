function GetTaskDetailsUrl(taskId) {
	return 'https://www.flexhelpdesk.nl/login/list.php?table=t4&sortby=t4-f276&sortdirection=asc&hiddenfilter[t4-refer][0]=' + taskId;
}

function TryGetTargetTable() {
	if ($('#EditEntity').length === 0)
		return $('table.crmclick')[0];
}

function UpdateHeaders(table) {
	$('thead tr', table).append('<th><div>Progress</div></th>');
}

function GetAbbreviation(str) {
	return str.match(/\b([A-Z])/g).join('');
}

function UpdateRow(row, data, taskId) {
	var rowHtml = '<td class="estimation-cell">';
	var estimationItems = $('table.crmclick tbody tr[onclick]', data);
	estimationItems.each(function() {
		var remark = $('td:nth-child(7)', this).text();
		var isDone = $('td:nth-child(5)', this).text().length > 0;
		var name = $('td:nth-child(2)', this).text();
		rowHtml += '<div' + (isDone ? ' class="done"' : '') + '>' + GetAbbreviation(name) + ': ' + remark + '</div>';
	});
	rowHtml += '</td>';
	$(row).append(rowHtml);
}

function DateFormat(date) {
	return date.substr(3,3) + date.substr(0,3) + date.substr(6)
}

function Pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

$(document).ready(function() {
	var table = TryGetTargetTable();
	if (table)
		UpdateHeaders(table);
		$('tbody tr', table).each(function() {
			var row = this;
			var taskId = parseInt($('.recordid', row).text());
			if (!isNaN(taskId)) {
				$.get(GetTaskDetailsUrl(taskId), function(data){
					UpdateRow(row, data, taskId);
				});
			}		
		})
	// add time adjustment
	$(document).on('DOMNodeInserted', '.fancybox-type-iframe iframe', function() {
		var iframe = $('.fancybox-type-iframe iframe');
		$(iframe).load(function() {
			$('#JS_EFID231', iframe.contents()).val(24);
			$('#JS_EFID229', iframe.contents()).val('Development.');
			if ($('#JS_EFID233', iframe.contents()))
				$('input[type="button"][value="Not chargeable"]', iframe.contents()).click();
			$('#JS_EFID232', iframe.contents()).focus();
			$('#formfieldcontainer-f230', iframe.contents()).append('<input id="yesterday" type="button" value="Yestarday" style="margin-left:10px">');
			$('#yesterday', iframe.contents()).click(function() {
				var dateInput = $('#JS_EFID230', iframe.contents());
				var date = new Date(DateFormat(dateInput.val()));
				date.setDate(date.getDate() - 1);
				dateInput.val(Pad(date.getDate()) + '-' + Pad(date.getMonth() + 1) + '-' + date.getFullYear());
				$('#JS_EFID232', iframe.contents()).focus();
			});
		});
	});
});