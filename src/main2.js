$(".services .service").hover(
  function(){
    $(this).find(".hover").stop().fadeIn();
    $(this).delay(800).find(".title").stop().fadeIn();
  },
  function(){
     $(this).find(".hover").stop().fadeOut();
    $(this).find(".title").stop().fadeOut();
  }
  )
  
  $(".services .serv-list .item1").hover(
    function(){
      $(".hover.item1").stop().fadeIn();
      $(".title.item1").delay(800).stop().fadeIn();
    }, 
    function(){
       $(".hover.item1").stop().fadeOut();
      $(".title.item1").stop().fadeOut();
    }
  )
  
  $(".services .serv-list .item2").hover(
    function(){
      $(".hover.item2").stop().fadeIn();
      $(".title.item2").delay(800).stop().fadeIn();
    },
    function(){
       $(".hover.item2").stop().fadeOut();
      $(".title.item2").stop().fadeOut();
    }
  )
  
  $(".services .serv-list .item3").hover(
    function(){
      $(".hover.item3").stop().fadeIn();
      $(".title.item3").delay(800).stop().fadeIn();
    },
    function(){
       $(".hover.item3").stop().fadeOut();
      $(".title.item3").stop().fadeOut();
    }
  )
  
  $(".services .serv-list .item4").hover(
    function(){
      $(".hover.item4").stop().fadeIn();
      $(".title.item4").delay(800).stop().fadeIn();
    }, 
    function(){
      $(".hover.item4").stop().fadeOut();
      $(".title.item4").stop().fadeOut();
    }
  )
  
  
  // PORTFOLIO main page
  
  //Обработка клика на стрелку вправо
  $(document).on('click', ".carousel-button-right",function(){ 
    var carusel = $(this).parents('.carousel');
    right_carusel(carusel);
    return false;
  });
  //Обработка клика на стрелку влево
  $(document).on('click',".carousel-button-left",function(){ 
    var carusel = $(this).parents('.carousel');
    left_carusel(carusel);
    return false;
  });
  function left_carusel(carusel){
     var block_width = $(carusel).find('.carousel-block').outerWidth();
     $(carusel).find(".carousel-items .carousel-block").eq(-1).clone().prependTo($(carusel).find(".carousel-items")); 
     $(carusel).find(".carousel-items").css({"left":"-"+block_width+"px"});
     $(carusel).find(".carousel-items .carousel-block").eq(-1).remove();    
     $(carusel).find(".carousel-items").animate({left: "0px"}, 200); 
     
  }
  function right_carusel(carusel){
     var block_width = $(carusel).find('.carousel-block').outerWidth();
     $(carusel).find(".carousel-items").animate({left: "-"+ block_width +"px"}, 200, function(){
      $(carusel).find(".carousel-items .carousel-block").eq(0).clone().appendTo($(carusel).find(".carousel-items")); 
        $(carusel).find(".carousel-items .carousel-block").eq(0).remove(); 
        $(carusel).find(".carousel-items").css({"left":"0px"}); 
     }); 
  }
  
  $(function() {
  //Раскомментируйте строку ниже, чтобы включить автоматическую прокрутку карусели
  //  auto_right('.carousel:first');
  })
  
  // Автоматическая прокрутка
  function auto_right(carusel){
    setInterval(function(){
      if (!$(carusel).is('.hover'))
        right_carusel(carusel);
    }, 3000)
  }
  // Навели курсор на карусель
  $(document).on('mouseenter', '.carousel', function(){$(this).addClass('hover')})
  //Убрали курсор с карусели
  $(document).on('mouseleave', '.carousel', function(){$(this).removeClass('hover')})
  
  
  // end 
  
  
  
  $(".button").hover(
    function(){
    $(this).stop().animate({borderColor: "#dfdc1a", color: "#dfdc1a"})
   },
    function(){
    $(this).stop().animate({borderColor: "#F4F1F3", color: "#3b363d"})  
  })
  
  $("header .button, button").hover(
    function(){
    $(this).stop().animate({borderColor: "#dfdc1a", color: "#dfdc1a"})
   },
    function(){
    $(this).stop().animate({borderColor: "#ffffff", color: "#ffffff"})  
  })
  
  $(".map .open-map").click(
    function(){
    $(this).hide();
    $(this).prev().hide();
    })
  
  