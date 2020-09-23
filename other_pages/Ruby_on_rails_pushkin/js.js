


let zakladkaButton = document.getElementById("zakladka")

zakladkaButton.addEventListener('click', function (event) {
    var posTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

    alert(posTop);

});


