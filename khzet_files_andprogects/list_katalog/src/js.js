




// oppen google document


$(document).ready(function(){

    $.getJSON("https://spreadsheets.google.com/feeds/list/1CHke8cOAcvrj1sLwBnlsXpbqjxWdO99CeZIvD7XZEsk/od6/public/values?alt=json", function(data){
        var vali, gali
        vali = $('.wrapp_container').html();

        data = data['feed']['entry'];
        console.log(data);
        // showGoods(data);
        console.log(data[0]['gsx$text']['$t']);
        console.log(vali);
        // chage_languige();
        // show_menu(data);
    })

    // function showGoods(data){
    //     let out_s = '';
    //     for(var i=0; i<data.length; i++){
    //             out_s += '<div class="container_goors" style="margin-top:120px">';
    //                 out_s += '<div class="row">';    
    //                     out_s += '<div class="col-sm-8">';
    //                         out_s += '<div class="alert alert-dark" role="alert">';
    //                             out_s += '<h2> ${data[i]['gsx$title']['$t']}</h2>';
    //                         out_s += '</div>';                            
    //                         out_s += '<hr>';
    //                         out_s += '<p>';
    //                         out_s += ' ${data[i]['gsx$text']['$t']}';
    //                         out_s += '</p>';
    //                         out_s += '<br>';
    //                         // out_s += '<table class="table">';
    //                         //     out_s += '<thead class="thead-dark">';
    //                         //     out_s += '<tr>';
    //                         //         out_s += '<th scope="col">#</th>';
    //                         //         out_s += '<th scope="col">Назва</th>';
    //                         //         out_s += '<th scope="col">Продуктивність від</th>';
    //                         //         out_s += '<th scope="col">Ціна за 1 м висоти норії в зборі</th>';
    //                         //     out_s += '</tr>';
    //                         //     out_s += '</thead>';
    //                         //     out_s += '<tbody>';
    //                         //     out_s += '<tr>';
    //                         //         out_s += '<th scope="row">1</th>';
    //                         //         out_s += '<td>Норія НПЗ-5</td>';
    //                         //         out_s += '<td>5 т./год.</td>';
    //                         //         out_s += '<td class = "text-center">2 164грн</td>';
    //                         //     out_s += '</tr>';
    //                         //     out_s += '</tbody>';
    //                         // out_s += '</table>';
    //                     out_s += '</div>';
    //                     out_s += '<div class="col-sm-4" style="background-image: url("${data[i]['gsx$imgsrc']['$t']")">';
    //                     out_s += '</div>';
    //                 out_s += '</div>';
    //             out_s += '</div>';
    //         }
    //     $('.wrapp_container').html(out);
    // }

});  

