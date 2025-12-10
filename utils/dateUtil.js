function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  if(day < 10){
    day = "0" + day;
  }
  if(month < 10){
    month = "0" + month;
  }
  var hour = date.getHours()
  var minute = date.getMinutes()
  // var second = date.getSeconds();


  return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute].map(formatNumber).join(':')
}


function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}


function formatDate(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()
  if(day < 10){
    day = "0" + day;
  }
  if(month < 10){
    month = "0" + month;
  }
  return year+"-"+month +"-"+ day
}

function getWhichFullDate(which) {
  var date  = new Date();
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate() + which * 1
  if(day < 10){
    day = "0" + day;
  }
  if(month < 10){
    month = "0" + month;
  }
  return year+"-"+month +"-"+ day
}


function getWhichOnlyDate(which) {
  var date  = new Date();
  var month = date.getMonth() + 1
  var day = date.getDate() + which * 1
  if(day < 10){
    day = "0" + day;
  }
  if(month < 10){
    month = "0" + month;
  }
  return month +"-"+ day
}
function getWhichWeeksYear(date, which) {
  /*
    date1是当前日期
    date2是当年第一天
    d是当前日期是今年第多少天
    用d + 当前年的第一天的周差距的和在除以7就是本年第几周
    */
   var a = date.getFullYear()
   var b = date.getMonth() + 1
   var c = date.getDate() + which * 1
   var date1 = new Date(a, parseInt(b) - 1, c), date2 = new Date(a, 0, 1),
   d = Math.round((date1.valueOf() - date2.valueOf()) / 86400000);
   return Math.ceil(
   (d + ((date2.getDay() + 1) - 1)) / 7
   );
}
//
function getArriveWhatWeek(date, which) {
  var weeks = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");
    var day = date.getDay() +  which * 1;
    
    if(day == 7){
     var  week = "星期日"
    }else{
      var week = weeks[day];
    }
     return week;
}

function getWhichDay(date, which) {
  var day = date.getDate() + which * 1
     return day;
}


function getArriveDate( which) {
  var dateArrive = new Date();
  dateArrive.setTime(dateArrive.getTime()+ which*1 * 24*60*60*1000);
  var date = dateArrive.getDate();
  var month = dateArrive.getMonth()+1;
  if(date < 10){
    date = '0' + date;
  }
  if(month < 10){
    month = '0' + month;
  }
  
   var s3 = dateArrive.getFullYear()+"-" + month + "-" + date
  return s3;
}


function getArriveOnlyDate(which) {
  var dateOnly = new Date();
  dateOnly.setTime(dateOnly.getTime()+ which *1* 24*60*60*1000);
  var date = dateOnly.getDate();
  var month = dateOnly.getMonth()+1;
  if(date < 10){
    date = '0' + date;
  }
  if(month < 10){
    month = '0' + month;
  }

   var s3 = month + "-" + date
  return s3;
}


function getDateTimeString() {
  var dateOnly = new Date();
  dateOnly.setTime(dateOnly.getTime());
  var date = dateOnly.getDate();
  var month = dateOnly.getMonth()+1;
   var s3 = month + "月" + date + "日" 
  return s3;
}
function getArriveWeeksYear(which) {
  /*
    date1是当前日期
    date2是当年第一天
    d是当前日期是今年第多少天
    用d + 当前年的第一天的周差距的和在除以7就是本年第几周
    */
   var dateFull = new Date();
   var a = dateFull.getFullYear()
   var b = dateFull.getMonth() + 1
   var c = dateFull.getDate() + which * 1
   var date1 = new Date(a, parseInt(b) - 1, c), date2 = new Date(a, 0, 1),
   d = Math.round((date1.valueOf() - date2.valueOf()) / 86400000);
   return Math.ceil(
   (d + ((date2.getDay() + 1) - 1)) / 7
   );
}

function getArriveWhatDay(which) { 
  var dateDay = new Date();
  console.log(dateDay)
  console.log("what the dateDay")
  var weeks = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六");
    var day = dateDay.getDay() +  which * 1;
    if(day == 7){
     var  week = "星期日"
    }else{
      var week = weeks[day];
    }
     console.log(week)
     return week;
}


function getFirstDateInMonth(){
  var dateFull = new Date();
  var a = dateFull.getFullYear()
   var b = dateFull.getMonth() + 1;
   if(b < 10){
     b = "0" + b;
   }
   return a + "-" + b + "-" + "01" 
}

function getLastDateInMonth (){
  var year = new Date().getFullYear(); //获取年份
    var month = new Date().getMonth() + 1; //获取月份
    var lastDate = new Date(year, month , 0).getDate(); //获取当月最后一日
    month = month < 10 ? '0' + month : month ; //月份补 0
    return [year,month ,lastDate ].join("-");
}

function getFirstDateInMonthString(){
  var dateFull = new Date();
  // var a = dateFull.getFullYear()
   var b = dateFull.getMonth() + 1;
   
   return b + "月" + "1日" 
}
function getFirstDateLastMonth(){
  var dateFull = new Date();
  var a = dateFull.getFullYear()
   var b = dateFull.getMonth();
   if(b < 10){
     b = "0" + b;
   }if(b == 12){
     a = a - 1;
     b = "01";
   }
   return a + "-" + b + "-" + "01" 
}


function getArriveDateString( which) {
  var dateArrive = new Date();
  dateArrive.setTime(dateArrive.getTime()+ which*1 * 24*60*60*1000);
  var date = dateArrive.getDate();
  var month = dateArrive.getMonth()+1;

  
   var s3 = month + "月" + date+ "日" 
  return s3;
}



module.exports = {
  formatTime: formatTime,
  formatDate: formatDate,
  getWhichFullDate: getWhichFullDate,
  getWhichOnlyDate: getWhichOnlyDate,
  getWhichWeeksYear: getWhichWeeksYear,
  getArriveWhatWeek: getArriveWhatWeek,
  getWhichDay:getWhichDay,
  getArriveDate:getArriveDate,
  getArriveOnlyDate:getArriveOnlyDate,
  getArriveWeeksYear:getArriveWeeksYear,
  getArriveWhatDay:getArriveWhatDay,
  getDateTimeString: getDateTimeString,
  getFirstDateInMonth: getFirstDateInMonth,
  getLastDateInMonth: getLastDateInMonth,
  getFirstDateInMonthString: getFirstDateInMonthString,
  getArriveDateString: getArriveDateString

}
