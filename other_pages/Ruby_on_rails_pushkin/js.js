
 
//  var yy = $(window).scrollTop();  top position acros jquery
// var posTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop; //your current y position on the page



let zakladkaButton = document.getElementById("zakladka")

zakladkaButton.addEventListener('click', function (event) {
    var posTop = $(window).scrollTop(); //your current y position on the page


    alert(posTop);

});




let zakladkaButton2 = document.getElementById("zakladka1")

zakladkaButton2.addEventListener('click', function (event) {

var posTop2 = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop; //your current y position on the page
   

$(window).scrollTop(177838);

});