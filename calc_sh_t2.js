// ініціалізація змінних
let l_trans 
let params_trans
let engine_params 

let working_angle
let weight_product
let pi = 3.1415926535




let price_sh_transporter
let production_sh_transporter

let chek_chose_radio 

// перша перевірка радіобатона на вибір двигуна
chek_chose_radio = $("#exampleRadios2").prop("checked");

// клік евент 
$( "#calck_price" ).click(function() {
    init_varible_value() 
    prace_vue();
  });


$( "#calck_production" ).click(function() {
  init_varible_value() 
  calck_production()
});






// при зміні вибору мотор редуктора
$( ".form-check-input_engyne" ).change(function() {
  chek_chose_radio = $("#exampleRadios2").prop("checked");
  build_select_engin();
  clean_prace();
});




// надання значень змінним
function init_varible_value() {
  l_trans = $('#length_trans option:selected').val()
  params_trans = $('#params_trans option:selected').val().split(',');
  engine_params = $('#engine_params option:selected').val().split(',');

  working_angle = $('#working_angle').val().split(',')*1;
  weight_product = $('#weight_product').val().split(',')*1;

 

}  






// заміна селекта з двигунами
function build_select_engin() {
  if(chek_chose_radio == false){
    $("#engine_params").html(
      '<option selected value="0,0,0">Без двигуна</option>'+
      '<option value="1500,1.1,3237">Мотор 1.1 кВт. 1500 об./хв.</option>'+
      '<option value="1500,1.5,3582">Мотор 1.5 кВт. 1500 об./хв.</option>'+
      '<option value="1500,2.2,5448">Мотор 2.2 кВт. 1500 об./хв.</option>'+
      '<option value="1500,3.0,6306">Мотор 3.0 кВт. 1500 об./хв.</option>'+
      '<option value="1500,4.0,7161">Мотор 4.0 кВт. 1500 об./хв.</option>'+
      '<option value="1500,5.5,8778">Мотор 5.5 кВт. 1500 об./хв.</option>'+
      '<option value="1500,7.5,11421">Мотор 7.5 кВт. 1500 об./хв.</option>'+
      '<option value="1500,11.0,14145">Мотор 11.0 кВт. 1500 об./хв.</option>'+
      '<option value="1000,1.1,3747">Мотор 1.1 кВт. 1000 об./хв.</option>'+
      '<option value="1000,1.5,5115">Мотор 1.5 кВт. 1000 об./хв.</option>'+
      '<option value="1000,2.2,6045">Мотор 2.2 кВт. 1000 об./хв.</option>'+
      '<option value="1000,3.0,8352">Мотор 3.0 кВт. 1000 об./хв.</option>'+
      '<option value="1000,4.0,8946">Мотор 4.0 кВт. 1000 об./хв.</option>'+
      '<option value="1000,5.5,9375">Мотор 5.5 кВт. 1000 об./хв.</option>'+
      '<option value="1000,7.5,12015">Мотор 7.5 кВт. 1000 об./хв.</option>'+
      '<option value="1000,11.0,20136">Мотор 11.0 кВт. 1000 об./хв.</option>'+
      '<option value="750,1.1,5448">Мотор 1.1 кВт. 750 об./хв.</option>'+
      '<option value="750,1.5,6390">Мотор 1.5 кВт. 750 об./хв.</option>'+
      '<option value="750,2.2,8517">Мотор 2.2 кВт. 750 об./хв.</option>'+
      '<option value="750,3.0,9375">Мотор 3.0 кВт. 750 об./хв.</option>'+
      '<option value="750,4.0,12183">Мотор 4.0 кВт. 750 об./хв.</option>'+
      '<option value="750,5.5,12015">Мотор 5.5 кВт. 750 об./хв.</option>'+
      '<option value="750,7.5,19056">Мотор 7.5 кВт. 750 об./хв.</option>'+
      '<option value="750,11.0,23370">Мотор 11.0 кВт. 750 об./хв.</option>'      
    );
    }else{
      $("#engine_params").html(
        '<option selected value="0,0,0">Без мотор-редуктора</option>'+
        '<option value="0,1.1,8153">Мотор редуктор 1.1 кВт. WMI 63</option>'+
        '<option value="0,1.1,10013">Мотор редуктор 1.1 кВт. WMI 75</option>'+
        '<option value="0,1.5,9083">Мотор редуктор 1.5 кВт. WMI 63</option>'+
        '<option value="0,1.5,10943">Мотор редуктор 1.5 кВт. WMI 75</option>'+
        '<option value="0,2.2,12090">Мотор редуктор 2.2 кВт. WMI 75</option>'+
        '<option value="0,2.2,15345">Мотор редуктор 2.2 кВт. WMI 90</option>'+
        '<option value="0,3,16275">Мотор редуктор 3 кВт. WMI 90</option>'+
        '<option value="0,3,19716">Мотор редуктор 3 кВт. WMI 110</option>'+
        '<option value="0,4,17918">Мотор редуктор 4 кВт. WMI 90</option>'+
        '<option value="0,4,20925">Мотор редуктор 4 кВт. WMI 110</option>'+
        '<option value="0,5.5,22320">Мотор редуктор 5.5 кВт. WMI 110</option>'+
        '<option value="0,5.5,26505">Мотор редуктор 5.5 кВт. WMI 130</option>'+
        '<option value="0,7.5,26040">Мотор редуктор 7.5 кВт. WMI 110</option>'+
        '<option value="0,7.5,30225">Мотор редуктор 7.5 кВт. WMI 130</option>'+
        '<option value="0,11,39990">Мотор редуктор 11 кВт. WMI 150</option>'
      );  
    }
}




// обрахунок та вивід прайса
function prace_vue() {
  // перевірка та обрахунок на моторі та мотор-редукторі
  if(chek_chose_radio == false){
      price_sh_transporter = (params_trans[2]*1)+(params_trans[1]*1)+(params_trans[3]*l_trans*1.1)+(engine_params[2]*1);
    }else{
      price_sh_transporter = 3000 + (params_trans[1]*1)+(params_trans[3]*l_trans*1.1)+(engine_params[2]*1);
    }

  // перевірка на наявність бункерка та підставки
  if($(".radio_boonker").prop("checked")){
    price_sh_transporter += 2000
  }

  if($(".radio_pistavka").prop("checked")){
    price_sh_transporter += 4000
  }

  if($(".radio_krot").prop("checked")){
    price_sh_transporter += (params_trans[3]*0.5)
  }

  price_sh_transporter = parseInt(price_sh_transporter)

  $(".price").html( " ₴ " + price_sh_transporter+ ".00 з пдв");
}









// обрахунок та вивід продуктивності
function calck_production(){

  let volume_smale_pipe
  let diam_smale_pipe

  let s_out_pipe = 7

  let scrw_p = (params_trans[0] - 11) * 0.0001

  let pered_zdatnist_shkiv = 0.25


 // обєм внутрінньої труби
  if(params_trans[0]==102||params_trans[0]==127){
    diam_smale_pipe = 34    
    volume_smale_pipe = count_value_circle(diam_smale_pipe)
  }
  else {
    diam_smale_pipe = 42
    volume_smale_pipe = count_value_circle(diam_smale_pipe)
  } 
  
  // обєм зовнішньої труби
  let params_volume_pipe = count_value_circle(params_trans[0] - s_out_pipe)
    
  let engine_speed
 
  if(chek_chose_radio == false){
   engine_speed = engine_params[0]*pered_zdatnist_shkiv
  }else{
   alert ("на мотор редуктрі поки що не обраховується")
  }

  let cooficient_angle_working

  if (working_angle==0){
    cooficient_angle_working = 0.85
  }else if(working_angle==15){
    cooficient_angle_working = 0.75
  }else if(working_angle==30){
    cooficient_angle_working = 0.7
  }else if(working_angle==45){
    cooficient_angle_working = 0.6
  }else if(working_angle==60){
    cooficient_angle_working = 0.5
  }else if(working_angle==90){
    cooficient_angle_working = 0.5
  }

  production_sh_transporter =
    (params_volume_pipe *  scrw_p) -
    (volume_smale_pipe * scrw_p) *
    cooficient_angle_working *
    engine_speed *     
    weight_product *
    60  * 60

    alert("params_volume =" + (params_volume_pipe *  scrw_p - volume_smale_pipe * scrw_p))

    alert("cooficient_angle_working * = " + cooficient_angle_working)
    alert("engine_speed * =" + engine_speed)
    alert(" weight_product * =" +  weight_product)
    alert(" 60  * 60 =" +  60  * 60)


    // alert(    (params_volume_pipe *  scrw_p) -
    // (volume_smale_pipe * scrw_p) )
    // alert()
    // alert()
    // alert()
  

  $(".production_sh").html( " " + production_sh_transporter+ " тон на годину");

  console.log(params_inner_volume_pipe)
}






// зачиска ціни при зміні параметрів
$( "#params_trans" ).change(function() {
  clean_prace()
  clean_producthion()
});

$( "#length_trans" ).change(function() {
  clean_prace()
  clean_producthion()
});

$( "#engine_params" ).change(function() {
  clean_prace()
  clean_producthion()
});

$( ".radio_boonker" ).change(function() {
  clean_prace()
});

$( ".radio_pistavka" ).change(function() {
  clean_prace()
});

// зачиска ціни при зміні параметрів продуктивності
$( "#weight_product" ).change(function() {
  clean_producthion()
});

$( "#working_angle" ).change(function() {
  clean_producthion()
});




function clean_prace() {
  $(".price").html( "" );
}

function clean_producthion() {
  $(".production_sh").html( "" );
}


// обрахунок площі кола
function count_value_circle(diametr){
  return  (( diametr / 2 )* ( diametr / 2 )  * pi ) *0.000001
 
}