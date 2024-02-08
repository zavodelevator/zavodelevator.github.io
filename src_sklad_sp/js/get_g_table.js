$(document).ready(function(){

    $(document).ready(function() {//перемикання кнопок
      $(".btn-group-toggle label").click(function() {
        $(this).siblings().removeClass('active');
        $(this).addClass('active');
      });
    });
            
      $.ajax({
        url: url,
        dataType: "json",
        success: function(data) {
          localStorage.setItem(table_name, JSON.stringify(data)); 
        },
        error: function(xhr, status, error) {            
          console.error("Error fetching data:", error);
        }
      });
    
});