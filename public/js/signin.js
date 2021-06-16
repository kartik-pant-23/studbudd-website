"use strict";

var $ = function(id) {
    return document.getElementById(id);
}

var url = window.location.pathname.split('/').reverse()[0];
const baseUrl = window.location.origin;

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
        fetch(`${baseUrl}/api/${url}/login`, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        }).then(response => {
            response.json()
            .then(data => {
                if(response.status == 200) {
                    window.localStorage.setItem("token", data.token);
                    window.location.replace(`${baseUrl}/org/${data.domain}`);
                } else {
                    $("password").value = '';
                    $("fail-res").innerText = data.message;
                }
            })
            .catch(_ => {
                $("stripe-login").reset();
                $("fail-res").innerText = "Something went wrong!";
            });
        }).catch(_ => {
            $("stripe-login").reset();
            $("fail-res").innerText = "Something went wrong!";
        })
    }
}

window.onload = function() {
    $("signin-btn").onclick = signin;
    if(url!="org") {
        $("reset-pass").style.display = "none";
        $("footer-link").style.display = "none";
    }
}