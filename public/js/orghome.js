"use strict";

var $ = function(id) {
    return document.getElementById(id);
}
var token = window.localStorage.getItem("token");
const baseUrl = window.location.origin;
var orgDomain;
var batches = [], docs = [];
var org;

// Creating batch container
var batchContainer = function(batch) {
    var container = document.createElement('a');
    container.href = `/batch/${batch._id}`;
    container.innerHTML = `<div class="grid-container batch-container"><div id="batch-details"><div id="batch-head">${batch.tag}</div><div id="batch-subhead">Classes Count: <strong id="class-count">${batch.classCount}</strong> </div></div></div>`;
    return container;
}

// Creating doc container
var docContainer = function(doc) {
    var container = document.createElement('a');
    container.href = `/document/${doc._id}`;
    container.innerHTML = `<div class="grid-container doc-container"><img src="/images/doc-template.png" alt="" id="doc-img"><div id="doc-head">${doc.tag}</div></div>`;
    return container;
}

function addNewDoc() {
    const file = $("doc-file");
    const tag = $("new-doc-tag");
    const desc = $("new-doc-desc");
    if(!file.files[0]) alert("File must be chosen!");
    else if(!tag || tag.value.trim() == "") alert("Tag must be added!");
    else {
        $("add-doc-btn").innerText = "Adding...";
        $("add-doc-btn").disabled = true;
        const data = new FormData();
        data.append('file',file.files[0]);
        data.append('tag',tag.value);
        data.append('description',desc.value);
        data.append('ref', org._id);
        
        fetch(`${baseUrl}/api/document/upload`, {
            method: "POST",
            body: data,
            headers: {
                'token': token
            }
        }).then(response => {
            $("add-doc-btn").innerText = "Confirm";
            $("add-doc-btn").disabled = false;
            response.json().then(data => {
                $("docs").style.display = "grid";
                $("empty-doc").style.display = "none";
                $("docs").appendChild(docContainer(data.document));
                tag.value = null;
                desc.value = null;
                file.value = null;
                $("close-doc-modal").click();
            }).catch(_ => {
                console.log(_);
                alert("Something went wrong!")
            });
        }).catch(_ => {
            console.log(_)
            alert("Something went wrong!")
        });
    }
}

function addNewBatch() {
    var newBatchName = $("new-batch-tag").value;
    if(newBatchName && newBatchName.trim()!='') {
        newBatchName = newBatchName.trim();
        if(batches.find(elem => elem.tag == newBatchName)) {
            alert("Batch with same name already exists!")
        } else {
            $("add-batch-btn").innerText = "Adding...";
            $("add-batch-btn").disabled = true;
            fetch(`${baseUrl}/api/org/batch`, {
                method: "POST",
                body: JSON.stringify({tag: newBatchName}),
                headers: { 
                    "Content-Type": "application/json",
                    token: token
                }
            })
            .then(response => {
                $("batches").style.display = "grid";
                $("empty-batch").style.display = "none";
                $("add-batch-btn").innerText = "Confirm";
                $("add-batch-btn").disabled = false;
                response.json().then(data => {
                    if(response.status == 200) {
                        batches.push(data.batch);
                        $("batches").appendChild(batchContainer(data.batch));
                        $("new-batch-tag").value = null;
                        $("close-batch-modal").click();
                    } else {
                        alert("Something went wrong!");
                    }
                }).catch(err => {
                    console.log(err);
                    alert("Something went wrong!");
                })
            })
            .catch(err => {
                console.log(err);
                alert("Something went wrong!");
            })
        }
    } else {
        alert("Batch tag must be provided!");
    }
}

function updateUI(data) {
    org = data.details;
    // Setting name
    $("org-name").innerHTML = org.name;
    document.title = `${org.domain} | Studbudd`

    // Setting batches progress
    var studentPercent = 100*org.studentsCount / org.maxStudentsCount;
    $("studentpercent").innerHTML = `${studentPercent.toFixed(2)}%`;
    $("studentprogress").style.width = `${studentPercent}%`;
    if(studentPercent<=50) $("studentprogress").style.backgroundColor = 'lightgreen';
    else if(studentPercent<=80) $("studentprogress").style.backgroundColor = 'orange';
    else $("studentprogress").style.backgroundColor = 'red';

    // Adding batch details
    batches = org.batches;
    if(batches.length==0) {
        $("batches").style.display = "none";
        $("empty-batch").style.display = "block";
    } else {
        $("batches").style.display = "grid";
        $("empty-batch").style.display = "none";
        batches.forEach(batch => {
            $("batches").appendChild(batchContainer(batch));
        })
    }

    // Setting documents progress
    var documentPercent = 100*org.documentsSize / org.maxDocumentsSize;
    $("documentpercent").innerHTML = `${documentPercent.toFixed(2)}%`;
    $("documentprogress").style.width = `${documentPercent}%`;
    if(documentPercent<=50) $("documentprogress").style.backgroundColor = 'lightgreen';
    else if(documentPercent<=80) $("documentprogress").style.backgroundColor = 'orange';
    else $("documentprogress").style.backgroundColor = 'red';
    
    // Adding documents details
    docs = data.documents;
    if(docs.length == 0) {
        $("docs").style.display = 'none';
        $("empty-doc").style.display = 'block'
    } else {
        $("docs").style.display = 'grid';
        $("empty-doc").style.display = 'none'
        docs.forEach(doc => {
            $("docs").appendChild(docContainer(doc));
        })
    }
}

var loadData = function() {
    fetch(`${baseUrl}/api/org`, {
        method: "GET",
        headers: { "token": token }
    }).then(res => {
        if(res.status == 200) {
            res.json().then(data => {
                orgDomain = data.details.domain;
                localStorage.setItem("org-domain", orgDomain);
                updateUI(data);
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
