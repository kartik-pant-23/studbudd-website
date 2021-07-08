"use strict";

var $ = function(id) {
    return document.getElementById(id);
}

const baseUrl = window.location.origin;
const token = window.localStorage.getItem("token");
const batchId = window.location.pathname.split('/').reverse()[0];

var classes = [], docs = [];

function clearSubjects() {
    var container = $("subject-container");
    var node = container.lastElementChild;
    // correct the new node
    Array.from(node.children).forEach(child => {
        child.disabled = false;
        child.value = null;
    })
    Array.from(container.children).forEach(child => {
        container.removeChild(child);
    })
    container.appendChild(node);
}
function addMoreSubjects() {
    var container = $("subject-container");
    var lastNode = container.lastElementChild;
    if(!lastNode.firstElementChild.value || lastNode.firstElementChild.value.trim()=="") {
        alert("Previous values were not fillled!")
    } else {
        var newNode = lastNode.cloneNode(true);
        // Disable input text of previous node
        Array.from(lastNode.children).forEach(child => {
            child.disabled = true;
        })
        // clear text input of new node
        Array.from(newNode.children).forEach(child => {
            child.value = null;
        })
        container.appendChild(newNode);
    }
}

function classContainer(data) {
    var container = document.createElement('a');
    container.href = `/class/${data._id}`;
    
    var gridContainer = document.createElement('div');
    gridContainer.classList.add("grid-container");
    gridContainer.classList.add("class-container");
    gridContainer.innerHTML = `<div id="class-name">${data.tag}</div><hr>`;

    var classDetails = document.createElement("div");
    classDetails.classList.add("class-details");
    classDetails.innerHTML = `<div class="sub-head">Subjects Count: <strong>${data.subjects.length}</strong></div>`;

    var subjectDetails = document.createElement('ul');
    data.subjects.forEach(subject => {
        var subjectContainer = document.createElement('li');
        subjectContainer.innerText = `${subject.name} ${subject.subjectCode ?" | "+subject.subjectCode : ""}`;
        subjectDetails.appendChild(subjectContainer);
    })

    gridContainer.appendChild(classDetails);
    gridContainer.appendChild(subjectDetails);
    container.appendChild(gridContainer);
    return container;
}

function addNewClass() {
    const classTag = $("new-class-tag").value;
    if(!classTag || classTag.trim()=="") {
        alert("Class tag must be provided!");
    } else if(classes.find(obj => obj.tag == classTag)) {
        alert("Class with similar name already exists!");
    } else {
        var data = { tag: classTag, subjects: [] };
        Array.from($("subject-container").children).forEach(detail => {
            if(detail.children.item(0).disabled) {
                var subject = {};
                const name = detail.children.item(0).value;
                subject.name = name;
                const code = detail.children.item(1).value;
                if(code && code.trim()!="") subject.subjectCode = code;
                data.subjects.push(subject);
            }
        })
        $("add-class-btn").innerText = "Adding...";
        $("add-class-btn").disabled = true;

        // Posting data
        fetch(`${baseUrl}/api/class/${batchId}`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: { "token": token, "Content-type": "application/json" }
        }).then(res => {
            if(res.status == 200) {
                res.json().then(data => {
                    classes.push(data);
                    $("classes").style.display = "grid";
                    $("empty-class").style.display = "none";
                    $("classes").appendChild(classContainer(data));

                    $("new-class-tag").value = null;
                    clearSubjects();
                    $("close-class-modal").click();
                })
            } else {
                alert("Something went wrong!");
            }
            $("add-class-btn").innerText = "Confirm";
            $("add-class-btn").disabled = false;
        })
        .catch(err => {
            console.log(err);
            alert("Something went wrong!")
            $("add-class-btn").innerText = "Confirm";
            $("add-class-btn").disabled = false;
        })
    }
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
        data.append('ref', batchId);
        
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

function updateUI(data) {
    // Loading batch tag
    $("batch-name").innerHTML = data.tag;
    document.title = `${data.tag} | Studbudd`;

    // Adding class details
    classes = data.classes;
    if(classes.length==0) {
        $("classes").style.display = "none";
        $("empty-class").style.display = "block";
    } else {
        $("classes").style.display = "grid";
        $("empty-class").style.display = "none";
        classes.forEach(data => {
            $("classes").appendChild(classContainer(data));
        })
    }

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
    fetch(`${baseUrl}/api/class/batch/${batchId}`, {
        method: "GET",
        headers: { "token": token }
    }).then(res => {
        res.json().then(data => {
            console.log(data);
            updateUI(data);
        }).catch(err => {
            console.log(err);
        })
    }).catch(err => {
        console.log(err);
    })
}

window.onload = function () {
    loadData();
}