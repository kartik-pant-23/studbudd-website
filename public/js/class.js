function $(id) { return document.getElementById(id) }

const token = window.localStorage.getItem("token");
const baseUrl = window.location.origin;
const classId = window.location.pathname.split('/').reverse()[0];

function reset(id) {
    var container = $(id);
    var node = container.lastElementChild;
    Array.from(node.children).forEach(child => {
        child.disabled = false;
        child.value = null;
    })
    Array.from(container.children).forEach(child => {
        container.removeChild(child);
    })
    container.appendChild(node);
}
function addMore(id, req=false) {
    var container = $(id);
    var lastNode = container.lastElementChild;

    showAlert = false;
    if(req) {
        Array.from(lastNode.children).forEach(child => {
            if(!child.value || child.value.trim()=="") showAlert = true;
        });
    } else {
        showAlert = !lastNode.firstElementChild.value || lastNode.firstElementChild.value.trim()=="";
    }

    if(showAlert) {
        alert("Mandatory values not fillled!")
    } else {
        var newNode = lastNode.cloneNode(true);
        
        Array.from(lastNode.children).forEach(child => {
            child.disabled = true;
        })
        
        Array.from(newNode.children).forEach(child => {
            child.value = null;
        })
        container.appendChild(newNode);
    }
}

function shouldDelete() {
    var text = $("delete-tag").value;
    if(text && text.trim()=="permanently delete") {
        $("delete-class-btn").disabled = false;
    } else {
        $("delete-class-btn").disabled = true;
    }
}
function deleteClass() {
    fetch(`${baseUrl}/api/class/${classId}`, {
        method: "DELETE",
        headers: { "token": token }
    }).then(res => {
        res.json().then(_ => {
            if(res.status == 200) {
                $("close-deleteClass-modal").click();
                location.reload();
            } else {
                alert(`Error message: ${data.message}`);
            }
        })
        .catch(err => {
            console.log(err);
            alert("Something went wrong!");
        })
    })
    .catch(err => {
        console.log(err);
        alert("Something went wrong!");
    })
}

function changeName() {
    const newClassName = $("new-name-tag").value;
    if(!newClassName || newClassName.trim()=="") {
        alert("Class name must be added!");
    } else {
        fetch(`${baseUrl}/api/class/${classId}`, {
            method: "PATCH",
            headers: {
                "Content-type": "application/json",
                token: token
            },
            body: JSON.stringify({ newName: newClassName })
        }).then(res => {
            res.json().then(data => {
                if(res.status == 200) {
                    const classTag = data.updatedClass.tag;
                    const elements = document.getElementsByClassName("class-tag");
                    for(i=0; i<elements.length; i++) elements[i].innerText = `${classTag}`
                    document.title = `${classTag} | Studbudd`;

                    $("new-name-tag").value = null;
                    $("close-changeName-modal").click();
                } else {
                    alert(`Error message: ${data.message}`);
                }
            }).catch(err => {
                console.log(err);
                alert("Something wnent wrong!");
            })
        }).catch(err => {
            console.log(err);
            alert("Somthing went wrong!");
        })
    }
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
        data.append('ref', classId);
        
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
                $("documents").className = "card scroll padded"
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

function addStudentsManually() {
    var data = { "role": "student", "classId": classId, "users": [] };
    Array.from($("new-student-container").children).forEach(student => {
        if(student.children.item(0).disabled) {
            var newStudent = {"name": student.children.item(0).value, "uid": student.children.item(1).value};
            data.users.push(newStudent);
        }
    })
    
    if (data.users.length > 0) {
        const btn = $("add-student-btn");
        btn.innerText = "Adding...";
        btn.disabled = true;
        fetch(`${baseUrl}/api/student/register`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "token": token,
                "Content-type": "application/json"
            }
        }).then(res => {
            res.json().then(data => {
                if(res.status == 200) {
                    if(data.addedStudents.length > 0) {
                        $("empty-students").style.display = "none";
                        $("students").className = "small card scroll";

                        var container = $("students");
                        data.addedStudents.forEach(item => {
                            // studentArray.push(new student(item));
                            container.appendChild(studentContainer(item));
                        });
                    }
    
                    if(data.queuedItemsCount != data.addedItemsCount) {
                        alert(`Added student: ${data.addedItemsCount}/${data.queuedItemsCount}\nThis happens when when a student with same email already exists!`);
                    }

                    reset('new-student-container');
                    $("close-student-modal").click();
                } else {
                    alert(`Error message - ${data.message}`);
                }
                btn.innerText = "Confirm";
                btn.disabled = false;
            }).catch(err => {
                console.log(err);
                alert("Something went wrong!");
                btn.innerText = "Confirm";
                btn.disabled = false;
            })
        })
        .catch(err => {
            console.log(err);
            alert("Something went wrong!");
            btn.innerText = "Confirm";
            btn.disabled = false;
        })
    }
}
function addStudentsBulk() {
    const file = $("bulk-data").files[0];
    $("bulk-data").value = null;

    if(file) {
        const data = new FormData();
        data.append("role", "student");
        data.append("classId", classId);
        data.append("contentFile", file);

        fetch(`${baseUrl}/api/student/register`, {
            method: "POST",
            headers: { "token": token },
            body: data
        }).then(res => {
            res.json().then(data => {
                if(res.status == 200) {
                    if(data.addedStudents.length > 0) {
                        $("empty-students").style.display = "none";
                        $("students").className = "small card scroll";

                        var container = $("students");
                        data.addedStudents.forEach(item => {
                            // StudentsArray.push(new Students(item));
                            container.appendChild(studentContainer(item));
                        });

                        $("studentsCount").innerText = parseInt($("studentsCount").innerText)+data.addedItemsCount;
                    }
    
                    if(data.queuedItemsCount != data.addedItemsCount) {
                        alert(`Added Students: ${data.addedItemsCount}/${data.queuedItemsCount}\nThis happens when a student with same email already exists!`);
                    }

                    reset('new-student-container');
                } else {
                    alert(`Error message: ${data.message}`);
                }
            })
            .catch(err => {
                console.log(err);
                alert("Something went wrong!");
            })
        })
        .catch(err => {
            console.log(err);
            alert("Something went wrong!")
        })
    }
}

function addSubjects() {
    var data = {"subjects": []};
    Array.from($("new-subject-container").children).forEach(detail => {
        if(detail.children.item(0).disabled) {
            var subject = {};
            const name = detail.children.item(0).value;
            subject.name = name;
            const code = detail.children.item(1).value;
            if(code && code.trim()!="") subject.subjectCode = code;
            data.subjects.push(subject);
        }
    })
    
    if(data.subjects.length > 0) {
        const btn = $("add-subject-btn");
        btn.innerText = "Adding...";
        btn.disabled = true;
        fetch(`${baseUrl}/api/class/${classId}`, {
            method: "PATCH",
            body: JSON.stringify(data),
            headers: { "token": token, "Content-type": "application/json" }
        }).then(res => {
            res.json().then(resData => {
                if(res.status == 200) {
                    var newSubjects = resData.updatedClass.subjects.reverse().splice(0, data.subjects.length);
                    $("empty-subjects").style.display = "none";
                    $("subjects").className = "big card scroll"
                    newSubjects.forEach(subject => {
                        $("subjects").appendChild(subjectContainer(subject));
                    });

                    $("close-subject-modal").click();
                } else {
                    alert(`Error message: ${resData.message}`);
                }
            })
            .catch(err => {
                console.log(err);
                alert("Something went wrong!");
            })
            btn.innerText = "Confirm";
            btn.disabled = false;
        })
        .catch(err => {
            console.log(err);
            alert("Something went wrong!")
            btn.innerText = "Confirm";
            btn.disabled = false;
        })
    } else {
        alert("No subjects added!")
    }
}

function subjectContainer(subject) {
    const {name} = subject.coordinator || {};
    
    const container = document.createElement('a');
    container.href = `/subject/${subject._id}`;
    container.setAttribute("id", subject._id);
    container.innerHTML = `<div class="subject-container"><div><span class="subjectTag">${subject.name} </span><span class="subjectCode">(${subject.subjectCode})</span></div><div class="coordinator">${name || '-Not Assigned'}</div></div>`;

    return container;
}
function studentContainer(student) {
    const { name, email } = student;

    const container = document.createElement('div');
    container.className = 'student-container';
    container.innerHTML = `<span class="studentName">${name}</span><br><span class="studentEmail">${email}</span>`;

    return container;
}
function docContainer(doc) {
    var container = document.createElement('a');
    container.href = `/document/${doc._id}`;
    container.innerHTML = `<div class="grid-container"><img src="/images/doc-template.png" alt="" id="doc-img"><div id="doc-head">${doc.tag}</div></div>`;
    return container;
}
function updateUI(data) {
    const classTag = data.tag;
    const elements = document.getElementsByClassName("class-tag");
    for(i=0; i<elements.length; i++) elements[i].innerText = `${classTag}`
    document.title = `${classTag} | Studbudd`;
    $("uid").innerText = window.localStorage.getItem("org-domain");

    const subjects = data.subjects;
    const subjectsCount = subjects.length;
    $("subjectsCount").innerText = subjectsCount;
    if(subjectsCount==0) {
        $("empty-subjects").style.display = "block";
        $("subjects").className = "big card no-scroll"
    } else {
        subjects.forEach(subject => {
            $("subjects").appendChild(subjectContainer(subject));
        });
    }

    const students = data.students;
    const studentsCount = students.length;
    $("studentsCount").innerText = studentsCount;
    if(studentsCount==0) {
        $("empty-students").style.display = "block";
        $("students").className = "small card no-scroll"
    } else {
        students.forEach(student => {
            $("students").appendChild(studentContainer(student));
        })
    }

    const docs = data.documents;
    if(docs.length == 0) {
        $("empty-docs").style.display = "block";
        $("documents").className = "card no-scroll padded"
    } else {
        docs.forEach(doc => {
            $("docs").appendChild(docContainer(doc));
        });
    }
}

function loadData() {
    fetch(`${baseUrl}/api/class/${classId}`,{
            method: "GET",
            headers: { "token": token }
        }).then(res => {
            res.json().then(data => {
                if(res.status == 200) {
                    updateUI(data);
                } else {
                    alert(`Error message: ${data.message}`);
                }
            }).catch(err => {
                console.log(err);
                alert("Somthing went wrong!");
            })
        })
        .catch(err => {
            console.log(err);
            alert("Something went wrong!")
        })
}

window.onload = function() {
    loadData();
}