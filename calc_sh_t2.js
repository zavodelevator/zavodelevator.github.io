

$( "#calck_price" ).click(function() {
    let l_trans = $('#length_trans option:selected').val()
    let params_trans = $('#params_trans option:selected').val().split(',');
    let engine_params = $('#engine_params option:selected').val().split(',');
    
    let price_sh_transporter = (params_trans[2]*1)+(params_trans[1]*1)+(params_trans[3]*l_trans*1.1)+(engine_params[2]*1);

 
    $(".price").html( price_sh_transporter);  
  });

  