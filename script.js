function GetTaskDetailsUrl(taskId) {
	return 'https://www.flexhelpdesk.nl/login/edit.php?e=' + taskId;
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
	var estimationItems = $('#tabs-4 table.crmclick tbody tr[onclick]', data);
	estimationItems.each(function() {
		var remark = $('td:nth-child(8)', this).text();
		var isDone = $('td:nth-child(6)', this).text().length > 0;
		var name = $('td:nth-child(3)', this).text();
		rowHtml += '<div' + (isDone ? ' class="done"' : '') + '>' + GetAbbreviation(name) + ': ' + remark + '</div>';
	});
	rowHtml += '</td>';
	$(row).append(rowHtml);
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
});