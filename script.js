function GetTaskDetailsUrl(taskId) {
	return 'https://www.flexhelpdesk.nl/login/list.php?table=t4&sortby=t4-f276&sortdirection=asc&hiddenfilter[t4-refer][0]=' + taskId;
}

function GetTaskTimesheetsUrl(taskId) {
	return 'https://www.flexhelpdesk.nl/login/list.php?table=t1&sortby=t1-recordid&sortdirection=desc&hiddenfilter[t1-refer][0]=' + taskId;
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

function UpdateRow(row, estdata, taskId, statistics) {
	var rowHtml = '<td class="estimation-cell">';
	var estimationItems = $('table.crmclick tbody tr[onclick]', estdata);
	estimationItems.each(function() {
		var remark = $('td:nth-child(7)', this).text();
		var isDone = $('td:nth-child(5)', this).text().length > 0;
		var name = $('td:nth-child(2)', this).text();
		var hours = parseFloat($('td:nth-child(4)', this).text().replace(',', '.'));
		rowHtml += '<div ' + 'data-name="' + name + '" ' + 'data-estimation="' + remark + '" ' + 'data-hours="' + hours + '" '
			+ (isDone ? ' class="done"' : '') + '>' + GetAbbreviation(name) + ': ' + remark + ' (' + hours + ')</div>';
		if (statistics[name] == undefined)
			statistics[name] = {};
		if (statistics[name][remark] == undefined)
			statistics[name][remark] = 0;
		statistics[name][remark] += hours;
	});
	rowHtml += '</td>';
	$(row).append(rowHtml);
}

function UpdateRowHours(row, timedata) {
	var hoursData = {};
	//process hours data
	$('table.crmclick tbody tr[onclick]', timedata).each(function() {
		var name = $('td:nth-child(4)', this).text();
		var estimation = $('td:nth-child(6)', this).text().toLowerCase();
		var estPointIndex = estimation.indexOf('.'); 
		if (estPointIndex != -1)
			estimation = estimation.substring(0, estPointIndex);
		var hours = parseFloat($('td:nth-child(7)', this).text().replace(',', '.'));
		if (hoursData[name] == undefined)
			hoursData[name] = {}; 
		if (hoursData[name][estimation] == undefined)
			hoursData[name][estimation] = 0.0;
		hoursData[name][estimation] += hours;
	});
	//display info
	$('td.estimation-cell div', row).each(function() {
		var miniRow = $(this);
		var name = miniRow.data('name');
		var estimation = miniRow.data('estimation');
		var estimationKey = estimation.toLowerCase();
		var estPointIndex = estimationKey.indexOf('.'); 
		if (estPointIndex != -1)
			estimationKey = estimationKey.substring(0, estPointIndex);
		var hours = miniRow.data('hours');
		var workedHours = 0.0;
		if (hoursData[name] != undefined && hoursData[name][estimationKey] != undefined) {
			workedHours = hoursData[name][estimationKey];
			delete hoursData[name][estimationKey];
		}
		miniRow.html('<span>' + GetAbbreviation(name) + ': ' + estimation + ' (' + workedHours + '/' + hours + ')</span>');
		// calculate and show progress
		var percentage = 100.0;
		var isDone = miniRow.hasClass('done');
		if (!isDone) {
			if (hours > 0) {
				percentage = workedHours / hours * 100;
			} else {
				percentage = 0.0;
			}
		}
		percentage = Math.round(percentage);
		if (!isDone) {
			miniRow.append('<div class="estimation-cell-percentage' + (percentage >= 100 ? ' warning' : '') + '">' + percentage + '%</div>');
			if (percentage > 90.0)
				percentage = 90.0;
		}
		miniRow.css('background', 'linear-gradient(to right, rgb(146, 208, 80) ' + percentage + '%, rgb(255, 192, 0) ' + percentage + '%, rgb(255, 192, 0) 100%)');
	});
	// check for hidden hours
	var hiddenSum = 0.0;
	var warningHtml = '';
	for (var key in hoursData) {
		if (hoursData.hasOwnProperty(key)) {
			var obj = hoursData[key];
			for (var prop in obj) {
				if (obj.hasOwnProperty(prop)) {
					warningHtml += '<div class="warning">' + GetAbbreviation(key) + ': ' + prop + " = " + obj[prop] + '</div>';
					hiddenSum += obj[prop];
				}
			}
		}
	}	
	if (hiddenSum > 0) {
		$('.estimation-cell', row).append('<div class="warning">WARNING! ' + hiddenSum + ' hidden hours found!</div>' + warningHtml);
	}	
}

function DateFormat(date) {
	if (date != null)
		return date.substr(3,3) + date.substr(0,3) + date.substr(6)
}

function Pad(n) {
    return (n < 10) ? ("0" + n) : n;
}

function InitTaskListAdjustments(statistics) {	
	var table = TryGetTargetTable();
	if (table) {
		UpdateHeaders(table);
		$('tbody tr', table).each(function() {
			var row = this;
			var taskId = parseInt($('.recordid', row).text());
			if (!isNaN(taskId)) {
				$.get(GetTaskDetailsUrl(taskId), function(estData){
					UpdateRow(row, estData, taskId, statistics);
					UpdateListStatistics(statistics);
					$.get(GetTaskTimesheetsUrl(taskId), function(timeData){
						UpdateRowHours(row, timeData);
					});
				});
			}		
		})
	}
}

function UpdateListStatistics(statistics) {
	$('table.statistics').remove();
	$('table.crm').parent().css('position', 'relative');
	var table = '<table class="statistics">';
	for (var man in statistics) {
		var totalManHours = 0.0;
		var timeInfoHtml = '';
		table += '<tr><td>' + man + '</td><td>';
		for (var work in statistics[man]) {
			var hours = statistics[man][work];
			totalManHours += hours;
			timeInfoHtml += '<tr>' +
				 '<td>' + work + '</td>' +
				 '<td>' + hours + '</td>' +
				 '</tr>';
		}
		timeInfoHtml = '<div class="time-info"><table>'
			+ '<tr class="time-info-total"><td>Total</td><td>' + totalManHours + '</td></tr>' + timeInfoHtml
			+ '</table></div>';
		table += '<a href="javascript:void(0)">' + totalManHours + '</a>' + timeInfoHtml + '</td>';
	}
	table += '</div>';
	$('table.crm').parent().append(table);
	$('table.statistics').css('right', ($('table.statistics').width() + 10) * -1);
	// shit code style, sorry
	$('.statistics').on("click", 'a', function(){
		$('.statistics .hidden-link').removeClass('hidden-link');
		$('.statistics .time-info').removeClass('time-info-active');
		$('.time-info', $(this).parent()).addClass('time-info-active');
		$('table.statistics').css('right', ($('table.statistics').width() + 10) * -1);
		$(this).addClass('hidden-link');
		$(window).scrollLeft(1000);
	});
}

function InitAddTimeAgjustments() {
	$(document).on('DOMNodeInserted', '.fancybox-type-iframe iframe', function() {
		var iframe = $('.fancybox-type-iframe iframe');
		$(iframe).load(function() {
			if ($('#JS_EFID229', iframe.contents()).length === 1 && $('input[value="Delete"]', iframe.contents()).length === 0) {
				// defaults
				$('#JS_EFID231', iframe.contents()).val(24);
				$('#JS_EFID229', iframe.contents()).val('Development.');
				if ($('#JS_EFID233', iframe.contents()))
					$('input[type="button"][value="Not chargeable"]', iframe.contents()).click();
				$('#JS_EFID232', iframe.contents()).focus();
				// yesterday
				var date = new Date(), buttonTitle;
				if (date.getDay() === 1) {
					buttonTitle = 'Friday';
					date.setDate(date.getDate() - 3);
				} else {
					buttonTitle = 'Yesterday';
					date.setDate(date.getDate() - 1);
				}
				$('#formfieldcontainer-f230', iframe.contents()).append('<input id="reportDateP" type="button" value="' + buttonTitle + '" style="margin-left:10px">');
				$('#reportDateP', iframe.contents()).click(function() {
					var dateInput = $('#JS_EFID230', iframe.contents());
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
				// code review
				$('#formfieldcontainer-f231', iframe.contents()).append('<input id="reportCodeRev" type="button" value="Code Review" style="margin-left:10px">');
				$('#reportCodeRev', iframe.contents()).click(function() {
					$('#JS_EFID231', iframe.contents()).val(24);
					$('#JS_EFID229', iframe.contents()).val('Code review.');
					$('#JS_EFID232', iframe.contents()).focus();
				});
				// local testing
				$('#formfieldcontainer-f231', iframe.contents()).append('<input id="reportTestLocal" type="button" value="Local Testing" style="margin-left:10px">');
				$('#reportTestLocal', iframe.contents()).click(function() {
					$('#JS_EFID231', iframe.contents()).val(40);
					$('#JS_EFID229', iframe.contents()).val('Local testing.');
					$('#JS_EFID232', iframe.contents()).focus();
				});
				// sandbox testing
				$('#formfieldcontainer-f231', iframe.contents()).append('<input id="reportTestSand" type="button" value="Sandbox Testing" style="margin-left:10px">');
				$('#reportTestSand', iframe.contents()).click(function() {
					$('#JS_EFID231', iframe.contents()).val(40);
					$('#JS_EFID229', iframe.contents()).val('Sandbox testing.');
					$('#JS_EFID232', iframe.contents()).focus();
				});
				// live testing
				$('#formfieldcontainer-f231', iframe.contents()).append('<input id="reportTestLive" type="button" value="Live Testing" style="margin-left:10px">');
				$('#reportTestLive', iframe.contents()).click(function() {
					$('#JS_EFID231', iframe.contents()).val(40);
					$('#JS_EFID229', iframe.contents()).val('Live testing.');
					$('#JS_EFID232', iframe.contents()).focus();
				});
			}
		});
	});
}

function InitAddEstimationAgjustments() {
	$(document).on('DOMNodeInserted', '.fancybox-type-iframe iframe', function() {
		var iframe = $('.fancybox-type-iframe iframe');
		$(iframe).load(function() {
			if ($('#JS_EFID270', iframe.contents()).length === 1 && $('input[value="Delete"]', iframe.contents()).length === 0) {
				var userId = $('#JS_EFID270', iframe.contents()).val();
				
				$('#formfieldcontainer-f270', iframe.contents()).append(
					'<div>' +
						'<input id="estFuncDes" type="button" value="Functional Designs" style="margin-right:5px">' +
						'<input id="estUIDes" type="button" value="UI Designs" style="margin-right:5px">' +
						'<input id="estFrDev" type="button" value="Frontend Development" style="margin-right:5px">' +
						'<input id="estDev" type="button" value="Development" style="margin-right:5px">' +
						'<input id="estCodeRev" type="button" value="Code Review" style="margin-right:5px">' +
						'<input id="estLocTest" type="button" value="Local Testing" style="margin-right:5px">' +
						'<input id="estSandTest" type="button" value="Sandbox Testing" style="margin-right:5px">' +
						'<input id="estLiveTest" type="button" value="Live Testing" style="margin-right:5px">' +
					'</div>'
				);
				// functional designs				
				$('#estFuncDes', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(userId);
					$('#JS_EFID271', iframe.contents()).val('Functional design');
					$('#JS_EFID272', iframe.contents()).val(2).focus();
					$('#JS_EFID275', iframe.contents()).val('Functional designs.');
					$('#JS_EFID276', iframe.contents()).val(10);
				});
				
				// ui designs
				$('#estUIDes', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(589);
					$('#JS_EFID271', iframe.contents()).val('Functional design');
					$('#JS_EFID272', iframe.contents()).val(8).focus();
					$('#JS_EFID275', iframe.contents()).val('UI designs.');
					$('#JS_EFID276', iframe.contents()).val(15);
				});
				
				// frontend development
				$('#estFrDev', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(513);
					$('#JS_EFID271', iframe.contents()).val('Development');
					$('#JS_EFID272', iframe.contents()).val(4).focus();
					$('#JS_EFID275', iframe.contents()).val('Frontend development.');
					$('#JS_EFID276', iframe.contents()).val(20);
				});
				
				// development
				$('#estDev', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(userId).focus();
					//$('#formfieldcontainer-f270 input.search_input', iframe.contents()).focus();
					$('#JS_EFID271', iframe.contents()).val('Development');
					$('#JS_EFID272', iframe.contents()).val(24);
					$('#JS_EFID275', iframe.contents()).val('Development.');
					$('#JS_EFID276', iframe.contents()).val(30);
				});
				
				// code review
				$('#estCodeRev', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(userId);
					$('#JS_EFID271', iframe.contents()).val('Code review');
					$('#JS_EFID272', iframe.contents()).val(2).focus();
					$('#JS_EFID275', iframe.contents()).val('Code review.');
					$('#JS_EFID276', iframe.contents()).val(35);
				});
				
				// local testing
				$('#estLocTest', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(551);
					$('#JS_EFID271', iframe.contents()).val('Acceptance test');
					$('#JS_EFID272', iframe.contents()).val(2).focus();
					$('#JS_EFID275', iframe.contents()).val('Local testing.');
					$('#JS_EFID276', iframe.contents()).val(40);
				});
				
				// sandbox testing
				$('#estSandTest', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(551);
					$('#JS_EFID271', iframe.contents()).val('Acceptance test');
					$('#JS_EFID272', iframe.contents()).val(2).focus();
					$('#JS_EFID275', iframe.contents()).val('Sandbox testing.');
					$('#JS_EFID276', iframe.contents()).val(45);
				});
				
				// live testing
				$('#estLiveTest', iframe.contents()).click(function() {
					$('#JS_EFID270', iframe.contents()).val(551);
					$('#JS_EFID271', iframe.contents()).val('Acceptance test');
					$('#JS_EFID272', iframe.contents()).val(1).focus();
					$('#JS_EFID275', iframe.contents()).val('Live testing.');
					$('#JS_EFID276', iframe.contents()).val(50);
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

function InitAddTaskAdjustments() {
	if ($('#navigation a.active[href="edit.php?e=_new_"]').length === 1) {
		// left values
		$('#JS_customer').val(577);
		$('#JS_status').val('2. Toegewezen');
		$('#JS_EFID237').val('3 Wijziging');
		$('#JS_EFID227').val('3. Medium');
		// project
		var project = $('#JS_EFID2');
		project.width(94);
		project.after(
			'<input id="projCW" type="button" value="CW" style="margin-left:10px">' + 
			'<input id="projS" type="button" value="S" style="margin-left:5px">' +
			'<input id="projT" type="button" value="T" style="margin-left:5px">'
		);
		$('#projCW').click(function() {
			project.val(9);
		});
		$('#projS').click(function() {
			project.val(140);
		});
		$('#projT').click(function() {
			project.val(100);
		});
		// one more value
		$('#JS_EFID5').val(82);
		// define scripts
		var devDate, testDate, liveDate, devValue, testValue, liveValue;
		var currentDate = new Date();
		$('#JS_EFID4 option').each(function(){			
			var tDate = $(this).text().match(/T \d{2}-\d{2}-\d{2}/);
			if (tDate != null)
				tDate = new Date(DateFormat(tDate.toString().slice(2)));
			var lDate = $(this).text().match(/L \d{2}-\d{2}-\d{2}/);
			if (lDate != null)
				lDate = new Date(DateFormat(lDate.toString().slice(2)));
			if (tDate != null && lDate != null) {
				if (tDate > currentDate && (devDate == null || tDate < devDate)) {
					devDate = tDate;
					devValue = this; 
				}
				if (tDate < currentDate && (testDate == null || tDate > testDate)) {
					testDate = tDate;
					testValue = this; 
				}
				if (lDate < currentDate && (liveDate == null || lDate > liveDate)) {
					liveDate = tDate;
					liveValue = this; 
				}
			}
		});
		// console.debug('DEV : ' + $(devValue).text());
		// console.debug('TEST: ' + $(testValue).text());
		// console.debug('LIVE: ' + $(liveValue).text());		
		// sprints
		var sprint = $('#JS_EFID4');
		sprint.parent().after(
			'<div class="newtask-sprints">' +
			'<input id="spDev" type="button" value="Dev">' +
			'<input id="spTest" type="button" value="Test">' +
			'<input id="spLive" type="button" value="Live">' +
			'<input id="spBacklog" type="button" value="Backlog">' +
			'</div>'
		);
		$('#spLive').click(function() {
			sprint.val($(liveValue).val());
		});
		$('#spTest').click(function() {
			sprint.val($(testValue).val());
		});
		$('#spDev').click(function() {
			sprint.val($(devValue).val());
		});
		$('#spBacklog').click(function() {
			sprint.val(130);
		});
		//project
		$('#JS_EFID3').val(53);
	}
}

function InitExtensionInfo() {
	$('#navigation nav ul').append('<li class="ihelper-versioninfo"><a target="_blank" href="https://chrome.google.com/webstore/detail/ihelper/egolnaplkencbhiljfedeppleoljegdg">'
		+ 'iH ' + chrome.runtime.getManifest().version +
	'</a></li>');
}

$(document).ready(function() {
	InitExtensionInfo();
	var statistics = {};
	InitTaskListAdjustments(statistics);
	InitAddTimeAgjustments();
	InitAddEstimationAgjustments();
	InitTaskNumberTrim();
	InitAddTaskAdjustments();
});