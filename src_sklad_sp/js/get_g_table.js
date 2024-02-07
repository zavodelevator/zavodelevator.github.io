$(document).ready(function(){

    $(document).ready(function() {//перемикання кнопок
      $(".btn-group-toggle label").click(function() {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
      });
    });
            
      $.ajax({
        url: "https://script.google.com/macros/s/AKfycby1pO_94xtHo1m6LhtMEB8RlsBt6XkIq3FNSgTktGHn0xHmTrPjuJiNLy0CminF7t-YtQ/exec",
        dataType: "json",
        success: function(data) {
          localStorage.setItem('sclad_sp_json', JSON.stringify(data)); 
        },
        error: function(xhr, status, error) {            
          console.error("Error fetching data:", error);
        }
      });
    
});