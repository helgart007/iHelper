function GetTaskEstimationsUrl(taskId) {
	var url = 'https://www.flexhelpdesk.nl/login/list.php?table=t4&sortby=t4-f276&sortdirection=asc&BYAJAX=1&perpage=200&hiddenfilter[t4-f485][0]=' + taskId;
	if (isIHelperDebugMode === true)
		console.debug("Accessing " + url);
	return url;
}

function GetTaskTimesheetsUrl(taskId) {
	var url = 'https://www.flexhelpdesk.nl/login/list.php?table=t1&sortby=t1-recordid&sortdirection=desc&BYAJAX=1&perpage=200&hiddenfilter[t1-f484][0]=' + taskId;
	if (isIHelperDebugMode === true)
		console.debug("Accessing " + url);
	return url;
}

function TryGetTargetTable() {
	if ($('#JS_submitbutton').length === 0)
		return $('table.crmclick')[0];
}

function UpdateHeaders(table) {
	$('thead tr', table).append('<th><div>Progress</div></th>');
}

function GetAbbreviation(str) {
	return str.match(/\b([A-Z])/g).join('');
}

function FormattedFloat(f) {
	return parseFloat(f.toFixed(2));
}

function GetDaysToNewYear() {
	var now = new Date(), year = now.getFullYear();
	var totalDays = year % 4 == 0 ? 366 : 365
	var diff = now - new Date(year, 0, 0);
	var oneDay = 1000 * 60 * 60 * 24;
	var day = Math.floor(diff / oneDay);
    var result = day;
    if (day > totalDays / 2)
        result = Math.abs(totalDays - day); 
	return result;
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
	if (date != null) {
       var month = parseInt(date.substr(3,2));
	   return date.substr(3,2) + "-" + date.substr(0,3) + (month > 9 ? "15" : "16");
    }
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
				$.get(GetTaskEstimationsUrl(taskId), function(estData){
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
				 '<td>' + FormattedFloat(hours) + '</td>' +
				 '</tr>';
		}
		timeInfoHtml = '<div class="time-info"><table>'
			+ '<tr class="time-info-total"><td>Total</td><td>' + FormattedFloat(totalManHours) + '</td></tr>' + timeInfoHtml
			+ '</table></div>';
		table += '<a href="javascript:void(0)">' + FormattedFloat(totalManHours) + '</a>' + timeInfoHtml + '</td>';
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
			if ($('#JS_t1-f229-_new_', iframe.contents()).length === 1 && $('input[value="Delete"]', iframe.contents()).length === 0) {
				// yesterday
				var date = new Date(), buttonTitle;
				if (date.getDay() === 1) {
					buttonTitle = 'Friday';
					date.setDate(date.getDate() - 3);
				} else {
					buttonTitle = 'Yesterday';
					date.setDate(date.getDate() - 1);
				}
				$('#ffc-t1-f230', iframe.contents()).append('<input id="reportDateP" class="est-button-day" type="button" value="' + buttonTitle + '" style="margin: 5px 5px 0 0">');
				$('#reportDateP', iframe.contents()).click(function() {
					var dateInput = $('#JS_t1-f230-_new_', iframe.contents());
					dateInput.val(Pad(date.getDate()) + '-' + Pad(date.getMonth() + 1) + '-' + date.getFullYear());
					$('#JS_t1-f232-_new_', iframe.contents()).focus();
				});
				// get estimations
				var userName = $('#navigation li:last-child a[href="index.php?logout=1"]').text().replace("Logout", "").trim();
				var taskId = parseInt($('#ffc-t1-f484 a.toparentf484', iframe.contents()).text());
				$.get(GetTaskEstimationsUrl(taskId), function(estData){
					var estCount = 0;
					var estimationItems = $('table.crmclick tbody tr[onclick]', estData);
					estimationItems.each(function() {
						var name = $('td:nth-child(2)', this).text().trim();
						if (name === userName) {
							estCount += 1;
							var id = $('td:nth-child(1)', this).text();
							var remark = $('td:nth-child(7)', this).text();
							var isDone = $('td:nth-child(5)', this).text().length > 0;
							var hours = parseFloat($('td:nth-child(4)', this).text().replace(',', '.'));
							$('#ffc-t1-f231', iframe.contents()).append('<input id="est' + id + '"class="est-button" type="button" value="' + remark + '" style="margin: 5px 5px 0 0">');
							$('#est' + id, iframe.contents()).click(function() {
								var code = 24;
								if (remark.toLowerCase().indexOf("management") === 0) {
									code = 21;
								} else if (remark.toLowerCase().indexOf("local testing") === 0
									|| remark.toLowerCase().indexOf("sandbox testing") === 0
									|| remark.toLowerCase().indexOf("live testing") === 0) {
									code = 40;
								}
								$('#JS_t1-f231-_new_', iframe.contents()).val(code);
								if(userName === "Oleg Makaruk" && remark === "Management.")
									remark = "Management. Answering mails, managing tasks, meetings, planing, management activities, discussions.";
								$('#JS_t1-f229-_new_', iframe.contents()).val(remark);
								$('#JS_t1-f232-_new_', iframe.contents()).focus();
							})
						}
					});
					// defaults
					$('#JS_t1-f231-_new_', iframe.contents()).val(24);
					if ($('#JS_t1-f233-_new_', iframe.contents()))
						$('input[type="button"][value="Not chargeable"]', iframe.contents()).click();
					if (estCount === 0) {
						$('#ffc-t1-f231', iframe.contents()).append("<div style='color:red;font-size:20px'>You have no estimation for this issue!</div><div style='font-size:15px'>Your present from Santa is at risk. Consider adding estimation on \"Estimations and progress\" tab.</div>");
					} else {
						$('input.est-button', iframe.contents())[0].click();
					}
				});
			}
		});
	});
}

function InitAddEstimationAgjustments() {
	$(document).on('DOMNodeInserted', '.fancybox-type-iframe iframe', function() {
		var iframe = $('.fancybox-type-iframe iframe');
		$(iframe).load(function() {
			if ($('#JS_t4-f270-_new_', iframe.contents()).length === 1 && $('input[value="Delete"]', iframe.contents()).length === 0) {
				var userId = $('#JS_t4-f270-_new_', iframe.contents()).val();

				$('#ffc-t4-f270', iframe.contents()).append(
					'<div>' +
						'<input id="estFuncDes" type="button" value="Functional Designs" style="margin: 5px 5px 0 0">' +
						'<input id="estUIDes" type="button" value="UI Designs" style="margin: 5px 5px 0 0">' +
						'<input id="estFrDev" type="button" value="Frontend Development" style="margin: 5px 5px 0 0">' +
						'<input id="estDev" type="button" value="Development" style="margin: 5px 5px 0 0">' +
						'<input id="estCodeRev" type="button" value="Code Review" style="margin: 5px 5px 0 0">' +
						'<input id="estLocTest" type="button" value="Local Testing" style="margin: 5px 5px 0 0">' +
						'<input id="estSandTest" type="button" value="Sandbox Testing" style="margin: 5px 5px 0 0">' +
						'<input id="estLiveTest" type="button" value="Live Testing" style="margin: 5px 5px 0 0">' +
					'</div>'
				);
				// functional designs
				$('#estFuncDes', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(userId);
					$('#JS_t4-f271-_new_', iframe.contents()).val('Functional design');
					$('#JS_t4-f272-_new_', iframe.contents()).val(2).focus();
					$('#JS_t4-f275-_new_', iframe.contents()).val('Functional designs.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(10);
				});

				// ui designs
				$('#estUIDes', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(941);
					$('#JS_t4-f271-_new_', iframe.contents()).val('Functional design');
					$('#JS_t4-f272-_new_', iframe.contents()).val(8).focus();
					$('#JS_t4-f275-_new_', iframe.contents()).val('UI designs.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(15);
				});

				// frontend development
				$('#estFrDev', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(513);
					$('#JS_t4-f271-_new_', iframe.contents()).val('Development');
					$('#JS_t4-f272-_new_', iframe.contents()).val(4).focus();
					$('#JS_t4-f275-_new_', iframe.contents()).val('Frontend development.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(20);
				});

				// development
				$('#estDev', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(userId).focus();
					//$('#formfieldcontainer-f270 input.search_input', iframe.contents()).focus();
					$('#JS_t4-f271-_new_', iframe.contents()).val('Development');
					$('#JS_t4-f272-_new_', iframe.contents()).val(24);
					$('#JS_t4-f275-_new_', iframe.contents()).val('Development.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(30);
				});

				// code review
				$('#estCodeRev', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(userId);
					$('#JS_t4-f271-_new_', iframe.contents()).val('Code review');
					$('#JS_t4-f272-_new_', iframe.contents()).val(2).focus();
					$('#JS_t4-f275-_new_', iframe.contents()).val('Code review.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(35);
				});

				// local testing
				$('#estLocTest', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(944);
					$('#JS_t4-f271-_new_', iframe.contents()).val('Acceptance test');
					$('#JS_t4-f272-_new_', iframe.contents()).val(2).focus();
					$('#JS_t4-f275-_new_', iframe.contents()).val('Local testing.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(40);
				});

				// sandbox testing
				$('#estSandTest', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(944);
					$('#JS_t4-f271-_new_', iframe.contents()).val('Acceptance test');
					$('#JS_t4-f272-_new_', iframe.contents()).val(2).focus();
					$('#JS_t4-f275-_new_', iframe.contents()).val('Sandbox testing.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(45);
				});

				// live testing
				$('#estLiveTest', iframe.contents()).click(function() {
					$('#JS_t4-f270-_new_', iframe.contents()).val(944);
					$('#JS_t4-f271-_new_', iframe.contents()).val('Acceptance test');
					$('#JS_t4-f272-_new_', iframe.contents()).val(1).focus();
					$('#JS_t4-f275-_new_', iframe.contents()).val('Live testing.');
					$('#JS_t4-f276-_new_', iframe.contents()).val(50);
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
	if ($('#navigation a.active[href="record.php?new&table=t22"]').length === 1) {
		// left values
		$('#JS_t22-f382-_new_').val(577); // Customer
		$('#JS_t22-f380-_new_').val('2. Toegewezen');
		$('#JS_t22-f419-_new_').val('3 Wijziging');
		$('#JS_t22-f418-_new_').val('3. Medium');
		// Module
		var project = $('#JS_t22-f388-_new_');
		project.width(94);
		project.after(
			'<input id="projCW" type="button" value="C" class="mod-button">' + 
			'<input id="projR" type="button" value="R" class="mod-button">' +
			'<input id="projH" type="button" value="H" class="mod-button">' +
			'<input id="projS" type="button" value="S" class="mod-button">' +
			'<input id="projT" type="button" value="T" class="mod-button">'
		);
		$('#projCW').click(function() {
			project.val(9);
		});
		$('#projR').click(function() {
			project.val(152);
		});
		$('#projH').click(function() {
			project.val(158);
		});
		$('#projS').click(function() {
			project.val(155);
		});
		$('#projT').click(function() {
			project.val(100);
		});
		// Tab
		$('#JS_t22-f391-_new_').val(82);
		// define scripts
		var devDate, testDate, liveDate, devValue, testValue, liveValue;
		var currentDate = new Date();
		$('#JS_t22-f390-_new_ option').each(function() {
			var tDate = $(this).text().match(/S \d{2}-\d{2}/);
			if (tDate != null)
				tDate = new Date(DateFormat(tDate.toString().slice(2)));
			var lDate = $(this).text().match(/L \d{2}-\d{2}/);
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
		if (isIHelperDebugMode) {
			console.debug('DEV : ' + $(devValue).text());
			console.debug('TEST: ' + $(testValue).text());
			console.debug('LIVE: ' + $(liveValue).text());
		}		
		// Sprints
		var sprint = $('#JS_t22-f390-_new_');
		sprint.parent().after(
			'<div>' +
			'<input id="spDev" type="button" class="spr-button" value="Dev">' +
			'<input id="spTest" type="button" class="spr-button" value="Test">' +
			'<input id="spLive" type="button" class="spr-button" value="Live">' +
			'<input id="spBacklog" type="button" class="spr-button" value="Backlog">' +
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
		// Project
		$('#JS_t22-f389-_new_').val(53);
	}
}

function InitPageAction() {
	chrome.runtime.sendMessage({action: "showIcon"}, function(response) {});
}

function InitChristmas() {
	var daysToNewYear = GetDaysToNewYear();
	if (daysToNewYear <= 14) {
		$("#navigation li:first-child a.nohighlight")
			.parent()
			.css("position", "relative")
			.append("<div id='christmas-hat'></div>");
		$("#christmas-hat").fadeIn(500);
	}
}

var isIHelperDebugMode = false;

$(document).ready(function() {
	InitPageAction();
	InitChristmas();
	var statistics = {};
	InitTaskListAdjustments(statistics);
	InitAddTimeAgjustments();
	InitAddEstimationAgjustments();
	InitTaskNumberTrim();
	InitAddTaskAdjustments();
});