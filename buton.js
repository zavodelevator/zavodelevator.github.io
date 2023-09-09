// Сховати та показати додаткові опції калькулятора
$('#panelContent').hide();

// Toggle the panel visibility when the button is clicked
$('#toggleButton').click(function() {
  $('#panelContent').toggle();
});

// buton_1 length_trans
$('#Button_params_trans').click(function() {
  $('#params_trans').toggle();
});
