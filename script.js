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

function InitTaskListAdjustments() {
	var table = TryGetTargetTable();
	if (table) {
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
	}
}

function InitAddTimeAgjustments() {
	$(document).on('DOMNodeInserted', '.fancybox-type-iframe iframe', function() {
		var iframe = $('.fancybox-type-iframe iframe');
		$(iframe).load(function() {
			if ($('input[value="Delete"]', iframe.contents()).length == 0) {
				// defaults
				$('#JS_EFID231', iframe.contents()).val(24);
				$('#JS_EFID229', iframe.contents()).val('Development.');
				if ($('#JS_EFID233', iframe.contents()))
					$('input[type="button"][value="Not chargeable"]', iframe.contents()).click();
				$('#JS_EFID232', iframe.contents()).focus();
				// yesterday
				$('#formfieldcontainer-f230', iframe.contents()).append('<input id="reportDateP" type="button" value="Yesterday" style="margin-left:10px">');
				$('#reportDateP', iframe.contents()).click(function() {
					var dateInput = $('#JS_EFID230', iframe.contents());
					var date = new Date();
					date.setDate(date.getDate() - 1);
					dateInput.val(Pad(date.getDate()) + '-' + Pad(date.getMonth() + 1) + '-' + date.getFullYear());
					$('#JS_EFID232', iframe.contents()).focus();
				});
				// management
				$('#formfieldcontainer-f231', iframe.contents()).append('<input id="reportManag" type="button" value="Management" style="margin-left:10px">');
				$('#reportManag', iframe.contents()).click(function() {
					$('#JS_EFID231', iframe.contents()).val(21);
					$('#JS_EFID229', iframe.contents()).val('Management.');
					$('#JS_EFID232', iframe.contents()).focus();
				});
				// functional designs
				$('#formfieldcontainer-f231', iframe.contents()).append('<input id="reportFuncDes" type="button" value="Functional Designs" style="margin-left:10px">');
				$('#reportFuncDes', iframe.contents()).click(function() {
					$('#JS_EFID231', iframe.contents()).val(24);
					$('#JS_EFID229', iframe.contents()).val('Functional designs.');
					$('#JS_EFID232', iframe.contents()).focus();
				});
			}
		});
	});
}

function InitTaskNumberTrim() {
	var input = $('#navigation input.NumericRecordInput');
	input.closest('form').change(function(){
		input.val(input.val().replace(/[^0-9]+/, ''));
	})
}

$(document).ready(function() {
	InitTaskListAdjustments();
	InitAddTimeAgjustments();
	InitTaskNumberTrim();
});