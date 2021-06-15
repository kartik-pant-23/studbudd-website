"use strict";

var $ = function(id) {
    return document.getElementById(id);
}
var token = window.localStorage.getItem("token");

// Creating necessary elements
var batchContainer = function(tag, classCount) {
    var container = document.createElement('div');
    container.classList.add('grid-container');
    container.classList.add('batch-container');
    container.innerHTML = `<div id="batch-details"><div id="batch-head">${tag}</div><div id="batch-subhead">Classes Count:<strong id="class-count">${classCount}</strong> </div></div>`;
    // container.appendChild(details);
    return container;
}

function updateUI(data) {
    // Setting name
    $("org-name").innerHTML = data.name;

    // Setting batches progress
    var studentPercent = 100*data.studentsCount / data.maxStudentsCount;
    $("studentpercent").innerHTML = `${studentPercent.toFixed(2)}%`;
    $("studentprogress").style.width = `${studentPercent}%`;
    if(studentPercent<=50) $("studentprogress").style.backgroundColor = 'lightgreen';
    else if(studentPercent<=80) $("studentprogress").style.backgroundColor = 'orange';
    else $("studentprogress").style.backgroundColor = 'red';

    // Adding batch details
    var batches = data.batches;
    if(batches.length==0) {
        $("batches").style.display = "none";
        $("empty-batch").style.display = "block";
    } else {
        $("batches").style.display = "grid";
        $("empty-batch").style.display = "none";
        batches.forEach(batch => {
            $("batches").appendChild(batchContainer(batch.tag, batch.classes.length));
        })
    }

    // Setting documents progress
    var documentPercent = 100*data.documentsSize / data.maxDocumentsSize;
    $("documentpercent").innerHTML = `${documentPercent.toFixed(2)}%`;
    $("documentprogress").style.width = `${documentPercent}%`;
    if(documentPercent<=50) $("documentprogress").style.backgroundColor = 'lightgreen';
    else if(documentPercent<=80) $("documentprogress").style.backgroundColor = 'orange';
    else $("documentprogress").style.backgroundColor = 'red';

    // Adding documents details
    // if(documentPercent==0) {
    //     $("docs").style.display = 'none';
    //     $("empty-doc").style.display = 'block'
    // } else {
    //     // loadDocumentsData();
    // }
}

var loadData = function() {
    fetch(`${window.location.origin}/api/org`, {
        method: "GET",
        headers: { "token": token }
    }).then(res => {
        if(res.status == 200) {
            res.json().then(data => {
                console.log(data.details);
                updateUI(data.details);
            }).catch(err => {
                console.log(err);
            })
        } else if(res.status == 401) {
            // Token expired or not available, show this message
            // Take to login page
        } else {
            // Show that something strange happened
            // Take to login page
        }
    }).catch(err => {
        // Show the error message
        // Take to the login page
        console.log(err);
    })
}

window.onload = function(){
    loadData();
}
