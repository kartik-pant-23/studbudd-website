"use strict";

var $ = function(id) {
    return document.getElementById(id);
}
var token = window.localStorage.getItem('token');
    fetch(`${window.location.origin}/api/org`, {
        method: 'GET',
        headers: {token: token}
    }).then(response => {
        if (response.status == 200) {
            response.json().then(data => {
                console.log(data);
                $("data").innerHTML = data;
            }).catch(_ => {
                console.log(_);
                $("data").innerHTML = "error"})
        } else {
            $("data").innerHTML = 'error';
        }
    }).catch(_ => $("data").innerHTML = "!! Something went wrong !!")
function loadData(){
    
}

window.onload = function(){
    loadData();
}
