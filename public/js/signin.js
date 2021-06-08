"use strict";

var $ = function(id) {
    return document.getElementById(id);
}

var url = window.location.pathname.split('/').reverse()[0];

function signin() {
    var userId = $("userId").value;
    var password = $("password").value;

    if(!userId || userId.trim()=="")
        alert("UserId is mandatory");
    else if(!password || password.trim()=="")
        alert("Password is mandatory");
    else {
        var data = { password: password }
        if(url=="org") data.userId = userId;
        else data.email = userId;
        fetch(`${window.location.origin}/api/${url}/login`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }).then(response => {
            if (response.status == 200) {
                response.json().then(data => {
                    window.localStorage.setItem("token",data.token);
                    $("alert").innerHTML = data.details.name;
                    window.location.replace(`${window.location.origin}/home/${data.details.domain}`) = '/userHome'
                }).catch(_ => {
                    console.log(_);
                    $("alert").innerHTML = "*Authentication Failed"})
            } else {
                $("alert").innerHTML = '<div class="alert alert-warning alert-dismissible fade show" role="alert"><strong>Authentication Failed!</strong> <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button></div>';
            }
        }).catch(_ => $("alert").innerHTML = "!! Something went wrong !!")
    }
}

window.onload = function() {
    $("signin-btn").onclick = signin;
}