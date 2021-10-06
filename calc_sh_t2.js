let l_trans 
let params_trans
let engine_params 

let price_sh_transporter

let chek_chose_radio 

chek_chose_radio = $("#exampleRadios2").prop("checked");

$( "#calck_price" ).click(function() {
    init_varible_value() 
    prace_vue();
  });

$( ".form-check-input_engyne" ).change(function() {
  chek_chose_radio = $("#exampleRadios2").prop("checked");
  build_select_engin();
});

function init_varible_value() {
  l_trans = $('#length_trans option:selected').val()
  params_trans = $('#params_trans option:selected').val().split(',');
  engine_params = $('#engine_params option:selected').val().split(',');

   
  }  

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
      '<option value="1500,11.0,14145">Мотор 15.0 кВт. 1500 об./хв.</option>'+
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
        '<option selected value="0,0,0">Без двигуна</option>'+
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

function prace_vue() {
  if(chek_chose_radio == false){
    price_sh_transporter = (params_trans[2]*1)+(params_trans[1]*1)+(params_trans[3]*l_trans*1.1)+(engine_params[2]*1);
  }else{
    price_sh_transporter = (params_trans[1]*1)+(params_trans[3]*l_trans*1.1)+(engine_params[2]*1);
  }
    price_sh_transporter = parseInt(price_sh_transporter)

  $(".price").html( " ₴ " + price_sh_transporter+ ".00");
}