/*global $, confirm, formatDate, y*/
/*jslint browser: true */
"use strict";

y.padCell = function(num, size) {
    var s = String(num);
    while (s.length < size) {
        s = "0" + s;
    }
    return s;
};

//Functions for hh:mm time entry
y.getTime = function( strTime ) {        
    var strPart = strTime.split( ":" ),
        iTime = 0;
    if (strPart.length > 0) {
        iTime += isNaN(parseInt(strPart[0], 10)) ? 0 : parseInt( strPart[0], 10 ) * 60;
    }
    if (strPart.length > 1) {
        iTime += isNaN(parseInt(strPart[1], 10)) ? 0 : parseInt( strPart[1], 10 );
    }
    return iTime;
};

//returns hh:mm from minutes
y.getFormattedTime = function( iMinutes ){
    var mins,
        hrs,
        out;
    if (isNaN(iMinutes)) {
        iMinutes = 0;
    }
    mins = iMinutes % 60;
    hrs  = (iMinutes - mins)/60;        
    out  = y.padCell(hrs,2) + ":" + y.padCell(mins,2);
    return out;
};
y.calcTimeTotal = function( col, bReturnVal ){
    var i,
        col_total = 0,
        val;
    if (typeof col.cells !== "undefined") {
        for (i = 0; i < col.cells.length; i += 1) {            
            if (col.cells[i].text() !== ""){
                val = y.getTime( col.cells[i].text() );
            }
            else if(col.cells[i].val() !== ""){                
                val = y.getTime( col.cells[i].val() );
            }
            else{
                val = 0;
            }
            
            if (!isNaN(val)) {
                col_total += val;
            }
        }
    }    
    if( bReturnVal ){
        return col_total;
    }
    else if (col.total) {            
        col.total.text(y.getFormattedTime( col_total ));
    }
};

$(document).on("initialize tmsht_update", function(){
    $( "table[id^='grid_']" ).each(function() {
        var ts_cols = {}, 
            ts_rows = {},
            oToday = new Date();
        
        oToday.setHours(0); oToday.setMinutes(0); oToday.setSeconds(0);
        $(this).find( "tr" ).each( function( index ) {
            var ts_row = {};
            ts_row.future_dt=false;//Future row?
            ts_row.cells = [];
            ts_rows[index] = ts_row;
            if ( $(this).hasClass("css_row_total" ))    {    // Must be done this way
                $(this).find( "td.css_type_number, td.css_type_time" ).each(function() {
                    var sId = $(this).attr("id");                    
                    if ( sId ){
                        if (!ts_cols[sId]) {
                            ts_cols[sId] = {};
                            ts_cols[sId].cells = [];
                        }
                        ts_cols[sId].total = $(this);
                    }                
                });
                
                $(this).find( "td[id*=tot], td[id=row_total]" ).each(function() {
                    if( typeof ts_cols.tot1 !== "undefined" ){
                        ts_cols.tot1.total = $(this);
                    }
                });
            } else {            
                $(this).find( "td > div:not([id*='_tot']) > input, td > div:not([id*='_tot']) > span.css_disp" ).each(function() {                    
                    var parent,
                        sId,
                        ts_col,
                        sCol,
                        bWork;
                    parent = $(this).parent();                
                    sId = parent.attr("id").match(/_([dw][0-9]*)(?![a-zA-Z])/);
                    if (sId && sId.length > 1) {                    
                        sId = sId[1];
                        ts_col = ts_cols[sId];
                        if (!ts_col) {
                            ts_col = {};
                            ts_col.cells = [];                        
                            ts_cols[sId] = ts_col;
                        }
                        ts_col.cells.push($(this));
                        ts_row.cells.push($(this));
                        
                        $(this).change(function() {
                            var i, col_total = 0, row_total = 0, val;
                            
                            for (i = 0; i < ts_col.cells.length; i += 1) {
                                val = parseFloat(ts_col.cells[i].val(), 10 );
                                if (!isNaN(val)){
                                    col_total += val;
                                }
                            }
                            if (ts_col.total) {
                                ts_col.total.text(col_total.toFixed( 2 ));
                            }

                            for (i = 0; i < ts_row.cells.length; i += 1) {
                                val = parseFloat(ts_row.cells[i].val(), 10);
                                if (!isNaN(val)){
                                    row_total += val;
                                }
                            }
                            if (ts_row.total) {
                                ts_row.total.text(row_total.toFixed( 2 ));
                            }
                            if (ts_cols.tot1 && ts_cols.tot1.total) {
                                col_total = 0;
                                for (i = 0; i < ts_cols.tot1.cells.length; i += 1) {
                                    val = parseFloat(ts_cols.tot1.cells[i].text(), 10 );
                                    if (!isNaN(val)) {
                                        col_total += val;
                                    }
                                }
                                ts_cols.tot1.total.text(col_total.toFixed( 2 ));
                            }                                                    
                        });                    
                    }
                    //DayDown Total Rows Calculation
                    else{
                        sId = parent.attr("id");
                        bWork = false;
                        if (sId.match(/[_\.]start_time/)){                            
                            ts_row.start_time = $(this);
                            bWork = true;
                            $(this).attr("maxlength","5");
                        }
                        if (sId.match(/[_\.]end_time/)){                            
                            ts_row.end_time = $(this);
                            bWork = true;
                            $(this).attr("maxlength","5");
                        }
                        if (sId.match(/[_\.]break_dur/)){
                            ts_row.break_dur = $(this);
                            bWork = true;
                            ts_col = ts_cols.break_dur;
                            if (!ts_col) {
                                ts_col = {};
                                ts_col.cells = [];
                                ts_cols.break_dur = ts_col;
                            }
                            ts_col.cells.push($(this));
                            $(this).attr("maxlength","5");
                        }
    
    //Check for entry of future time from R5                    
    //                    var aStartDt = lu.oParam.output_ts_start_dt.split("-");
    //                    var oRowDate = new Date(aStartDt[0],aStartDt[1]-1,aStartDt[2]);
    //                    oRowDate.setDate(oRowDate.getDate()+index-1);
    //                    ts_row.future_dt = (oRowDate > oToday); //Future row?                        
                        if(bWork){
                            $(this).change(function() {
                                if( ts_row.start_time.val() !== "" && ts_row.end_time.val() !== "" ){
                                    if( typeof ts_row.working_time !== "undefined" ){
                                        //Calculate Working time
                                        var iBreakTime  = y.getTime( ts_row.break_dur.val() ),
                                            iTime1 = y.getTime( ts_row.start_time.val() ),
                                            iTime2 = y.getTime( ts_row.end_time.val() ),
                                            iWorkingTime = iTime2 - iTime1;
                                        
                            // If the end time is smaller than the start time then assume that the person worked past midnight and add a day
                                        if ( iWorkingTime < 0 ) {
                                            iWorkingTime += 24 * 60;
                                        }
                                        
                                        // Check that the sum of the fields is not greater than the interval btwn start and end times.
                                        iWorkingTime -= iBreakTime;
                                        ts_row.working_time.text( y.getFormattedTime( iWorkingTime ) );
                                    }
                                    
                                    //Calc Column Total
                                    y.calcTimeTotal( ts_cols.working_time );
                                }
                                //Calc Column Total
                                if( ts_cols.break_dur ){
                                    y.calcTimeTotal( ts_cols.break_dur );
                                }                            
                            });                                                    
                        }
                        else{
                            if (sId.match(/[_\.]hours_rt(?=[0-9])/) || sId.match(/[_\.]absence/) || sId.match(/[_\.]holiday/)){                                
                                ts_row.cells.push($(this));
                                sCol = sId.split('_')[3];
                                if (sId.match(/[_\.]hours_rt(?=[0-9])/)) {
                                    sCol += "_" + sId.split('_')[4];
                                }
                                $(this).change(function() {
                                    var iBillingTime,
                                        i,
                                        col,
                                        col_total,
                                        val;
                                    if (typeof ts_row.billing_time !== "undefined") {
                                        //Calculate billing time
                                        iBillingTime = 0;
                                        for (i in ts_row.cells) {
                                            if (ts_row.cells.hasOwnProperty(i)) {
                                                if( ts_row.cells[i].val() !== "" ){
                                                    iBillingTime += parseInt( (parseFloat( ts_row.cells[i].val() ) * 60) ,10);
                                                }
                                            }
                                        }                                    
                                        ts_row.billing_time.text(y.getFormattedTime(iBillingTime));
                                        //Calc Column Total
                                        y.calcTimeTotal(ts_cols.billing_time);
                                    }                                    
                                    
                                    
                                    if (sCol === "absence" || sCol === "holiday") {
                                        y.calcTimeTotal( ts_cols[sCol] );
                                    } else {                                    
                                        //hours total
                                        col = ts_cols[sCol];
                                        col_total = 0;
                                        for (i = 0; i < col.cells.length; i += 1) {
                                            val = parseFloat(col.cells[i].val(), 10 );
                                            if (!isNaN(val)){
                                                col_total += val;
                                            }
                                        }
                                        
                                        if (col.total) {
                                            col.total.text(col_total.toFixed( 2 ));
                                        }
                                    }                                    
                                });
                                
                                ts_col = ts_cols[sCol];
                                if (!ts_col) {
                                    ts_col = {};
                                    ts_col.cells = [];
                                    ts_cols[sCol] = ts_col;
                                }
                                ts_col.cells.push($(this));
                            }
                        }
                    }
                });
                $(this).find( "td > div[id*=_tot]" ).each(function() {
                    ts_row.total = $(this);
                    
                    if (!ts_cols.tot1) {
                        ts_cols.tot1 = {};
                        ts_cols.tot1.cells = [];
                    }
                    
                    ts_cols.tot1.cells.push($(this));
                    
                });
                
    //ts_tmsht_down calculation process from R5
                $(this).find( "td > div" ).each(function() {
                    var sId, 
                        sCol,
                        ts_col;
                    sId = $(this).attr("id");
                    if( typeof sId !== "undefined" ){
                        if (sId.match(/tot1/)) {
                            ts_row.total = $(this);
                            if (!ts_cols.tot1) {
                                ts_cols.tot1 = {};
                                ts_cols.tot1.cells = [];
                            }
                            if (sId === "A.tot1") {
                                ts_cols.tot1.total = $(this);
                            } else {
                                ts_cols.tot1.cells.push($(this));
                            }
                        }
                        //DayDown set Total Columns
                        else{
                            sCol = "";
                            if (sId.match(/[_\.]working_time/)){                            
                                ts_row.working_time = $(this);
                                sCol = "working_time";
                            }
                            if (sId.match(/[_\.]billing_time/)){                            
                                ts_row.billing_time = $(this);
                                sCol = "billing_time";
                            }
                            if( sCol !== "" ){
                                ts_col = ts_cols[sCol];
                                if (!ts_col) {
                                    ts_col = {};
                                    ts_col.cells = [];
                                    ts_cols[sCol] = ts_col;
                                }
                                ts_col.cells.push($(this));
                            }                        
                        }
                    }
                });
            }
        });
        
        //Force change
        $(this).find('input').each(function(){
            $(this).trigger( "change" );
        });    
    });
});

$(document).trigger("tmsht_update");
