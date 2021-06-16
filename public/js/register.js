'use strict';

var $ = function(id) {
    return document.getElementById(id);
}
var choice = window.location.pathname.split('/').reverse()[0];
var email, password, orgName, domain;
var monthlyBill, maxFacultyCount, maxStudentsCount, maxAssignmentsCount, maxExamsCount, maxDocumentsSize;

function registerUser(data) {
    fetch(
        `${window.location.origin}/api/org/register`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" }
        }
    ).then(res => {
        if(res.status==200) {
            alert("EMAIL SENT! VERIFY!!");
        } else {
            console.log("STATUS: "+res.status);
        }
    }).catch(err => console.log(err));
}

var next1 = function() {
    email = $("email").value;
    password = $("password").value;
    if(!email || email.trim()=="") 
        alert("Email is required!");
    else if(!password || password.trim()=="") 
        alert("Password is required!");
    else {
        $("Form1").style.left = "-450px";
        $("Form2").style.left = "40px";
        $("progress").style.width = "240px";
    }
}
var next2 = function() {
    orgName = $("name").value;
    domain = $("domain").value;
    if(!orgName || orgName.trim()=="") 
        alert("Name is required!");
    else if(!domain || domain.trim()=="") 
        alert("Domain is required!");
    else {
        $("Form2").style.left = "-450px";
        $("Form3").style.left = "40px";
        $("progress").style.width = "360px";
    }
}
var next3 = function() {
    if($("radio1").checked)
        choice = 1;
    if($("radio2").checked)
        choice = 2;
    if($("radio3").checked)
        choice = 3;

    switch (choice) {
        case 1:
            monthlyBill = 0;
            maxFacultyCount = 2;
            maxStudentsCount = 50;
            maxAssignmentsCount = 5;
            maxDocumentsSize = 256 * 1024 * 1024;
            maxExamsCount = 5;
            break;

        case 2:
            monthlyBill = 499;
            maxFacultyCount = 10;
            maxStudentsCount = 250;
            maxAssignmentsCount = 10;
            maxDocumentsSize = 512 * 1024 * 1024;
            maxExamsCount = 10;
            break;
    
        default:
            monthlyBill = 999;
            maxFacultyCount = 20;
            maxStudentsCount = 500;
            maxAssignmentsCount = 20;
            maxDocumentsSize = 1024 * 1024 * 1024;
            maxExamsCount = 20;
            break;
    }

    var data = {
        name: orgName,
        email: email,
        password: password,
        domain: domain,
        monthlyBill: monthlyBill,
        maxFacultyCount: maxFacultyCount,
        maxStudentsCount: maxStudentsCount,
        maxAssignmentsCount: maxAssignmentsCount,
        maxDocumentsSize: maxDocumentsSize,
        maxExamsCount: maxExamsCount
    };

    fetch(
        `${window.location.origin}/api/org/register`,
        {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "Content-Type": "application/json" }
        }
    ).then(res => {
        if(res.status==200) {
            alert("EMAIL SENT! VERIFY!!");
        } else {
            console.log("STATUS: "+res.status);
        }
    }).catch(err => console.log(err));
}

var back1 = function() {
    $("Form1").style.left = "40px";
    $("Form2").style.left = "450px";
    $("progress").style.width = "120px";
}
var back2 = function() {
    $("Form2").style.left = "40px";
    $("Form3").style.left = "450px";
    $("progress").style.width = "240px";
}

window.onload = function() {
    $("Next1").onclick = next1;
    $("Next2").onclick = next2;
    $("Next3").onclick = next3;

    if(choice==1)
        $("radio1").checked = true;
    else if(choice==2)
        $("radio2").checked = true;
    else
        $("radio3").checked = true;

    $("Back1").onclick = back1;
    $("Back2").onclick = back2;
}