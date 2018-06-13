var result = [];
var taggedResult = [];
var indexTaggedResult=0;
var annotations = [];
var chart;
var xValOfBegOfTag = 0;
var xValOfEndOfTag = 0;
var xValOfClick = 0;
var xValOfEndTagArr = [];

$(function () {
    var headers = [];
    $("#upload").bind("click", function () {
        var regex = /^([a-zA-Z0-9\s_\\.\-:])+(.csv|.txt)$/;
        if (regex.test($("#fileUpload").val().toLowerCase())) {
            result=[];
            if (typeof (FileReader) != "undefined") {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var rows = e.target.result.split("\n");
                    headers = rows[0].split(",");
                    for (var i = 1; i < rows.length; i++){
                        var obj = {};
                        var currentline=rows[i].split(",");

                        for(var j=0;j<headers.length;j++){
                            obj[headers[j]] = currentline[j];
                        }
                        result.push(obj);
                    }
                    var select = $('#y-labels');
                    for(var i = 1; i < headers.length; i++) {
                        var option = document.createElement("option");
                        option.text = headers[i];
                        option.value = headers[i];
                        select.append(option);
                    }
                    $('#chartContainer').show();
                    $('#csvDownloadContainer').hide();
                    $('#uploadConatiner').hide();
                    var optionSelected = $('#y-labels option:selected').text();
                    if(!optionSelected=="Select header:")
                        plotGraph();
                };
                reader.readAsText($("#fileUpload")[0].files[0]);
            } else {
                alert("This browser does not support HTML5.");
            }
        } else {
            alert("Please upload a valid CSV file.");
        }
    });
});

function getxVal(){
    xValOfClick = event.clientX;
    var chartDivPos = $("#chart").position();
    var labelPos = chartDivPos.top + 63;
    for (var i = 0; i < annotations.length; i++){
        if (xValOfClick > annotations[i].begxVal && xValOfClick < xValOfEndTagArr[i]){
            $("#annLabel").val(annotations[i].label);
            $("#selectedAnn").val(i);
            $("#annModal").modal('show');
        }
    }
}

function getxValBegTag(){
    xValOfBegOfTag = event.clientX;
}

function getxValEndTag(){
    xValOfEndOfTag = event.clientX;
    xValOfEndTagArr.push(xValOfEndOfTag);
}

function adjustTxtBox(){
    "this.style.width = ((this.value.length + 1) * 8) + 'px';"
}

function plotGraph () {
    var dataArray = [];
    taggedResult=[];
    indexTaggedResult=0;
    $('#csvDownloadContainer').hide();
    var selectedYAxisPlot = $("#y-labels").find("option:selected").val();

    for(var row=0;row<result.length;row++){
        var d = new Date(parseInt(result[row].Time));
        dataArray.push({
            date: d,
            value: (result[row][selectedYAxisPlot])
        });
    }

    chart = AmCharts.makeChart("chart", {
        "type": "serial",
        "theme": "none",
        "pathToImages": "https://www.amcharts.com/lib/3/images/",
        "dataProvider": dataArray,
        "valueAxes": [{
            "axisAlpha": 0.2,
            "dashLength": 1,
            "position": "left"
        }],
        "graphs": [{
            "id": "g1",
            "balloonText": "[[category]]<br /><b><span style='font-size:14px;'>value: [[value]]</span></b>",
            "bullet": "round",
            "bulletBorderAlpha": 1,
            "bulletColor": "#FFFFFF",
            "hideBulletsCount": 50,
            "title": "red line",
            "valueField": "value",
            "useLineColorForBulletBorder": true
        }],
        "chartScrollbar": {
            "autoGridCount": false,
            "graph": "g1",
            "scrollbarHeight": 40
        },
        "chartCursor": {
            "cursorPosition": "mouse",
            "selectWithoutZooming": true,
            "listeners": [{
                "event": "selected",
                "method": function(event) {
                    addGuide(event);
                }
            }]
        },
        "export": {
            "enabled": true,
            "divId": "exportdiv",
            "menuReviver": function(cfg, li) {
                if (cfg.format == "JSON") {
                }
                return li;
            }
        },
        "categoryField": "date",
        "categoryAxis": {
            "parseDates": true,
            "axisColor": "#DADADA",
            "dashLength": 1,
            "minorGridEnabled": true,
            "minPeriod": "ss",
            "labelRotation": 45,
            "labelFunction": function(valueText, date, categoryAxis) {
                return date.toDateString() + " " + date.toTimeString("HH:MM:SS");
            }
        },
        "exportConfig": {
            menuRight: '20px',
            menuBottom: '30px',
            menuItems: [{
                icon: 'https://www.amcharts.com/lib/3/images/export.png',
                format: 'png'
            }]
        }
    });
}

function addGuide(e) {
    $("#annModal").modal('show');
    var x = e.clientX;
    var guide = new AmCharts.Guide();
    guide.date = e.start;
    guide.toDate = e.end;
    guide.lineAlpha = 1;
    guide.lineColor = "#c44";
    guide.position = "top";
    guide.inside = true;
    guide.labelRotation = 0;
    guide.color = "#FF0F00";
    guide.fillAlpha = 0.5;
    guide.begxVal = xValOfBegOfTag;
    guide.endxVal = xValOfEndOfTag;
    $("#guideDetails").data('guide', guide)
    console.log(chart.allLabels);
}

function addGuideModal(){
    var text = $("#annLabel").val();
    var guide = $("#guideDetails").data('guide');
    if (!text || text.length > 15) return; // do not add a guide if it's null or empty
    guide.label = text;
    chart.categoryAxis.addGuide(guide);
    annotations.push(guide);
    chart.validateData();
    taggedResult[indexTaggedResult] = {start: event.start, end: event.end, annotation: text};
    indexTaggedResult = indexTaggedResult + 1;
    //refreshGraph();
    clearModalData();
}

function submitModal(){
    if ($("#selectedAnn").val() !== "") {
        updateAnnotation($("#selectedAnn").val(), $("#annLabel").val())
    } else {
        addGuideModal()
    }
}

function updateAnnotation(index, labelText){
    annotations[index].label = labelText;
    clearModalData();
    //refreshGraph();
    chart.validateNow();


}

function deleteAnnotation(){
    var index = $("#selectedAnn").val()
    if (!annotations[index]) return;
    annotations.splice(index, 1);
    xValOfEndTagArr.splice(index,1);
    clearModalData();
    //plotGraph();
    //refreshGraph();
    chart.clearLabels();
}

function clearModalData(){
    $("#guideDetails").data('guide', {});
    $("#selectedAnn").val("");
    $("#annLabel").val("");
    $("#annModal").modal('hide');
}

function refreshGraph(){
    //plotGraph();
    for (var i = 0; i < annotations.length; i++) {
        chart.categoryAxis.addGuide(annotations[i]);
        chart.validateData();
    }
    $('#csvDownloadContainer').show();
}

function convertArrayOfObjectsToCSV(args) {
    var result, ctr, keys, columnDelimiter, lineDelimiter, data;
    data = args.data || null;
    if (data == null || !data.length) {
        return null;
    }

    columnDelimiter = ',';
    lineDelimiter = '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function(item) {
        ctr = 0;
        keys.forEach(function(key) {
            if (ctr > 0) result += columnDelimiter;
            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });
    return result;
}

function downloadCSV(args) {
    var data, filename, link;
    var csv = convertArrayOfObjectsToCSV({
        data: taggedResult
    });
    if (csv == null) return;

    filename = args.filename || 'export.csv';

    if (!csv.match(/^data:text\/csv/i)) {
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    data = encodeURI(csv);

    link = document.createElement('a');
    link.setAttribute('href', data);
    link.setAttribute('download', filename);
    link.click();
}