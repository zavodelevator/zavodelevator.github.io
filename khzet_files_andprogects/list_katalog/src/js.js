




// oppen google document


$(document).ready(function(){

    $.getJSON("https://spreadsheets.google.com/feeds/list/1CHke8cOAcvrj1sLwBnlsXpbqjxWdO99CeZIvD7XZEsk/od6/public/values?alt=json", function(data){
        console.log(data)
        // data = data['feed']['entry']
        // console.log(data);
        // chage_languige();
        // show_menu(data);
    })
});  

