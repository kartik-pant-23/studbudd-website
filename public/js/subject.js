function $(id) {
    return document.getElementById(id);
}

const socket = io();
var userName, userId, chatData = [], faculty = [];
const baseUrl = window.location.origin;
const token = window.localStorage.getItem("token");
const subjectId = window.location.pathname.split('/').reverse()[0];

// Adding Assignments
function resetQuestions(isExam = false) {
    const questions = (isExam) ?$('examQuestions') :$('questions');
    const assignmentQuestionHTML = `<div id="ques0" class="questionContainer"><div class="quesText"><textarea class="form-control" placeholder="Question 1"></textarea><select class="quesType form-select form-select-sm" name="quesType" id="ques0-type" onchange="changeQuestionType('ques0')"><option value="0">Subjective</option><option value="1">Objective</option></select></div></div>`;
    const examQuestionHTML = `<div id="exam-ques0" class="examQuestionContainer"><div class="quesText"><textarea class="form-control" placeholder="Question 1" rows="3"></textarea><div class="examQuestionInfo"><input class="form-control form-control-sm" type="number" name="examQuesDuration" placeholder="Duration (In min)"><input class="form-control form-control-sm" type="number" name="examQuesMarks" placeholder="Marks"><select class="quesType form-select form-select-sm" name="quesType" id="exam-ques0-type" onchange="changeQuestionType('exam-ques0')"><option value="0">Subjective</option><option value="1">Objective</option></select></div></div></div>`;

    questions.innerHTML = (isExam) ?examQuestionHTML :assignmentQuestionHTML;
}
function addMoreQuestions(isExam = false) {
    const questions = (isExam) ?$("examQuestions") :$("questions") ;
    const lastQues = questions.lastElementChild;
    const lastQuesText = lastQues.firstElementChild;
    const lastQuesType = $(`${lastQues.id}-type`);
    const lastQuesOptions = $(lastQues.id+"-options");
    var shouldAdd = true;

    const quesValue = lastQuesText.firstElementChild.value;
    if(quesValue && quesValue.trim()!='') {
        if(lastQuesType.value == 1) {
            if(lastQuesOptions && lastQuesOptions.childElementCount < 3) {
                alert("Add at least two options!");
                shouldAdd = false;
            }
        }
    } else {
        alert("Question should have some text!");
        shouldAdd = false;
    }

    if(isExam) {
        var quesInfo = lastQuesText.lastElementChild;
        if(quesInfo.children[0].value.trim() == '') {
            alert("Duration is mandatory!");
            shouldAdd = false;
        } else if(quesInfo.children[1].value.trim() == '') {
            alert("Marks is mandatory!");
            shouldAdd = false;
        }
    }

    if(shouldAdd) {
        lastQuesText.firstElementChild.disabled = true;
        lastQuesText.firstElementChild.setAttribute("rows", "1");
        if(isExam) {
            lastQuesText.lastElementChild.children[0].disabled = true;
            lastQuesText.lastElementChild.children[1].disabled = true;
            lastQuesText.lastElementChild.lastElementChild.style.display = "none";
        } else {
            lastQuesText.lastElementChild.style.display = "none";
        }
        if(lastQuesOptions) lastQuesOptions.lastElementChild.style.display = "none";

        const quesId = `${isExam ?'exam-' :''}ques${questions.childElementCount}`;
        const newQuesContainer = document.createElement('div');
        newQuesContainer.className = "questionContainer";
        newQuesContainer.setAttribute("id", quesId);

        const assignmentQuestionHTML = `<div class="quesText">
        <textarea class="form-control" placeholder="Question ${parseInt(questions.childElementCount)+1}"></textarea><select class="quesType form-select form-select-sm" name="quesType" id="${quesId}-type" onchange="changeQuestionType('${quesId}')"><option value="0">Subjective</option><option value="1">Objective</option></select></div>`;
        
        const examQuestionHTML = `<div class="quesText"><textarea class="form-control" placeholder="Question ${parseInt(questions.childElementCount)+1}" rows="3"></textarea><div class="examQuestionInfo"><input class="form-control form-control-sm" type="number" name="examQuesDuration" placeholder="Duration (In min)"><input class="form-control form-control-sm" type="number" name="examQuesMarks" placeholder="Marks"><select class="quesType form-select form-select-sm" name="quesType" id="${quesId}-type" onchange="changeQuestionType('${quesId}')"><option value="0">Subjective</option><option value="1">Objective</option></select></div></div>`;

        newQuesContainer.innerHTML = (isExam) ?examQuestionHTML :assignmentQuestionHTML;
        questions.appendChild(newQuesContainer);

        lastQues.style.borderColor = "#0d6dfd66";
        lastQues.style.marginLeft = "0";
    }
}
function addMoreOptions(id) {
    const optionsContainer = $(id);
    const last = optionsContainer.lastChild;
    const optValue = last.firstChild.value;
    if(optValue && optValue.trim()!='') {
        last.firstChild.disabled = true;
        last.lastChild.style.display = "none";
        
        const newOption = document.createElement('div')
        newOption.className = "quesOption";
        newOption.innerHTML = `<input type="text" placeholder="Option ${parseInt(optionsContainer.childElementCount)+1}" autofocus="autofocus"><button onclick="addMoreOptions('${id}')">Save</button>`;
        optionsContainer.appendChild(newOption);
    } else {
        alert("Enter a value for the option!");
    }
}
function changeQuestionType(id) {
    const value = $(`${id}-type`).value;
    const options = $(`${id}-options`);
    if(value == 1) {
        if(options) {
            options.style.display = "block";
        } else {
            const container = document.createElement('div');
            container.className = "quesOptions";
            container.setAttribute('id', `${id}-options`);
            container.innerHTML = `<div class="quesOption"><input type="text" placeholder="Option 1"><button onclick="addMoreOptions('${id}-options')" autofocus="autofocus">Save</button></div>`;
            $(id).appendChild(container);
        }
    } else {
        if(options) options.style.display = "none";
    }
}
function getQuestions(isExam = false) {
    const questions = (isExam) ?$("examQuestions") :$("questions");
    var data = [];
    Array.from(questions.children).forEach(question => {
        var questionText = question.firstElementChild;
        var questionOptions = question.lastElementChild;
        if(questionText.firstElementChild.disabled) {
            var quesData = {};
            quesData["question"] = questionText.firstElementChild.value;
            if(isExam) {
                quesData["duration"] = questionText.lastElementChild.children[0].value;
                quesData["marks"] = questionText.lastElementChild.children[1].value;
                quesData["type"] = questionText.lastElementChild.children[2].value;
            } else quesData["type"] = questionText.lastElementChild.value;

            if(quesData["type"] == 1) {
                quesData["options"] = [];
                Array.from(questionOptions.children).forEach((opt, idx, arr) => {
                    if(idx != arr.length-1) {
                        quesData["options"].push(opt.firstChild.value);
                    }
                })
            }

            data.push(quesData);
        }
    });
    return data;
}
function submitAssignment() {
    const createBtn = $("createAssignmentBtn");
    const title = $("assignmentTitle").value;
    const description = $("assignmentDesc").value;
    const date = $("assignmentSubmissionDate").value;
    const file = $("assignment").files[0];
    const questions = getQuestions();

    var shouldContinue = true;
    if(!title || title.trim()=="") {
        shouldContinue = false;
        alert("Title is mandatory!");
    } else if(!date) {
        shouldContinue = false;
        alert("Submission Date is mandatory!");
    } else if(!file && questions.length == 0) {
        shouldContinue = false;
        alert("Either a file or questions must be added!\nAlert: In case both are added.. file is chosen!");
    }

    if(shouldContinue) {
        createBtn.innerText = "Adding...";
        createBtn.disabled = true;

        function handleResponse(res) {
            res.json().then(data => {
                if(res.status == 200) {
                    $("assignmentTitle").value = null;
                    $("assignmentDesc").value = null;
                    $("assignmentSubmissionDate").value = null;
                    $("assignment").value = null;
                    resetQuestions();

                    socket.emit("chat", {
                        sender: userId,
                        senderName: userName,
                        reference: subjectId,
                        assignment: data._id
                    });
                }
                else {
                    alert(`Error Message: ${data.message}`);
                }
            }).catch(err => {
                console.log(err);
                alert("Something went wrong!");
            })
            createBtn.innerText = "Create";
            createBtn.disabled = false;
        }

        if(file) {
            var body = new FormData();
            body.append("file", file);
            body.append("title", title);
            body.append("submissionDate", new Date(date).toISOString());
            body.append("subject", subjectId);
            if(description) body.append("description", description);
            fetch(`${baseUrl}/api/assignment/upload_doc`, {
                method: "POST",
                headers: { "token": token },
                body: body
            }).then(res => handleResponse(res))
            .catch(err => {
                console.log(err);
                alert("Something went wrong!");
                createBtn.innerText = "Create";
                createBtn.disabled = false;
            })
        } else {
            var body = {
                title: title,
                questions: questions,
                submissionDate: new Date(date).toISOString(),
                subject: subjectId
            }
            if(description) body.description = description;
            fetch(`${baseUrl}/api/assignment/upload_form`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "token": token
                },
                body: JSON.stringify(body)
            }).then(res => handleResponse(res))
            .catch(err => {
                console.log(err);
                alert("Something went wrong!");
                createBtn.innerText = "Create";
                createBtn.disabled = false;
            })
        }
    }
}

function submitExam() {
    const createBtn = $("createExamBtn");
    const title = $("examTitle").value;
    const description = $("examDesc").value;
    const date = $("examDate").value;
    const duration = $("examDuration").value;
    const marks = $("examMarks").value;
    const file = $("examDoc").files[0];
    const questions = getQuestions();

    var shouldContinue = true;
    if(title.trim()=="" || !date || duration.trim()=="" || marks.trim()=="") {
        shouldContinue = false;
        alert("Fields marked with * are mandatory!");
    } else if(!file && questions.length == 0) {
        shouldContinue = false;
        alert("Either a file or questions must be added!\nAlert: In case both are added.. file is chosen!");
    }

    if(shouldContinue) {
        createBtn.innerText = "Adding...";
        createBtn.disabled = true;

        function handleResponse(res) {
            res.json().then(data => {
                if(res.status == 200) {
                    $("examTitle").value = null;
                    $("examDesc").value = null;
                    $("examDate").value = null;
                    $("examDuration").value = null;
                    $("examMarks").value = null;
                    $("examDoc").value = null;
                    resetQuestions(true);

                    socket.emit("chat", {
                        sender: userId,
                        senderName: userName,
                        reference: subjectId,
                        exam: data._id
                    });
                }
                else {
                    alert(`Error Message: ${data.message}`);
                }
            }).catch(err => {
                console.log(err);
                alert("Something went wrong!");
            })
            createBtn.innerText = "Create";
            createBtn.disabled = false;
        }

        if(file) {
            var body = new FormData();
            body.append("file", file);
            body.append("title", title);
            body.append("submissionDate", new Date(date).toISOString());
            body.append("subject", subjectId);
            if(description) body.append("description", description);
            fetch(`${baseUrl}/api/assignment/upload_doc`, {
                method: "POST",
                headers: { "token": token },
                body: body
            }).then(res => handleResponse(res))
            .catch(err => {
                console.log(err);
                alert("Something went wrong!");
                createBtn.innerText = "Create";
                createBtn.disabled = false;
            })
        } else {
            var body = {
                title: title,
                questions: questions,
                submissionDate: new Date(date).toISOString(),
                subject: subjectId
            }
            if(description) body.description = description;
            fetch(`${baseUrl}/api/assignment/upload_form`, {
                method: "POST",
                headers: {
                    "Content-type": "application/json",
                    "token": token
                },
                body: JSON.stringify(body)
            }).then(res => handleResponse(res))
            .catch(err => {
                console.log(err);
                alert("Something went wrong!");
                createBtn.innerText = "Create";
                createBtn.disabled = false;
            })
        }
    }
}

function resetFileSelection(fileId, flagId) {
    $(fileId).value = null;
    $(flagId).style.display = "none";
}
function fileChosen(fileId, flagId) {
    const file = $(fileId).value;
    if(file) $(flagId).style.display = "initial";
    else $(flagId).style.display = "none";
}

function setMinDate() {
    var today = new Date();
    var YYYY = today.getFullYear();
    var MM = today.getMonth()+1; if(MM<10) MM = '0' + MM;
    var DD = today.getDate(); if(DD<10) DD = '0' + DD;
    var hh = today.getHours(); if(hh<10) hh = '0' + hh;
    var mm = today.getMinutes(); if(mm<10) mm = '0' + mm; 
    today = YYYY+"-"+MM+"-"+DD+"T"+hh+":"+mm;
    $("assignmentSubmissionDate").setAttribute("min", today);
    $("examDate").setAttribute("min", today);
}

// Adding notes 
function uploadNotes() {
    const title = $("notesTitle").value;
    const description = $("notesDescription").value;
    const file = $("notes").files[0];

    var shouldAdd = true;
    if(!title) {
        alert("Title is madatory!");
        shouldAdd = false;
    } else if(!file) {
        alert("Adding notes is mandatory!");
        shouldAdd = false;
    }

    if(shouldAdd) {
        const btn = $("upload-notes-btn");
        btn.innerText = "Uploading...";
        btn.disabled = true;

        var body = new FormData();
        body.append("file", file);
        body.append("tag", title);
        body.append("ref", subjectId);
        if(description && description.trim()!="") body.append("description", description);

        fetch(`${baseUrl}/api/document/upload`, {
            method: "POST",
            headers: { "token": token },
            body: body
        }).then(res => {
            res.json().then(data => {
                console.log(data);
                if(res.status == 200) {
                    $("notesTitle").value = null;
                    $("notesDescription").value = null;
                    $("notes").value = null;

                    socket.emit("chat", {
                        sender: userId,
                        senderName: userName,
                        reference: subjectId,
                        note: data.document._id
                    });

                    $("close-uploadNotes-modal").click();
                } else {
                    alert(`Error message: ${data.message}`);
                }

                btn.innerText = "Upload";
                btn.disabled = false;
            }).catch(err => {
                console.log(err);
                alert("Somthing went wrong!");
            })
        })
        .catch(err => {
            console.log(err);
            alert("Somthing went wrong!");
        })
    }
}

// Handling messages and socket
function handleScroll() {
    msgContainer = $("messages");
    const scrollTop = msgContainer.scrollTop;
    const scrollHeight = msgContainer.scrollHeight;
    const clientHeight = msgContainer.clientHeight;

    if(scrollTop+scrollHeight > clientHeight) {
        msgContainer.scrollTop = scrollHeight;
    }
}
function onChatInputChanged() {
    const chat = $("chat").value;
    if(chat && chat.trim()!="") $("sendChatButton").disabled = false;
    else $("sendChatButton").disabled = true;
}
$("inputContainer").addEventListener("submit", function(e) {
    e.preventDefault();
    const data = {
        sender: userId,
        senderName: userName,
        message: $("chat").value,
        reference: subjectId
    };
    $("chat").value = null;
    $("sendChatButton").disabled = true;
    socket.emit("chat", data);
});
function createNoteContainer(data, flag=false) {
    if(!flag) chatData.push(data);
    const { note } = data;

    const container = document.createElement("div");
    container.className = "noteItem";
    container.innerHTML = `<h6><strong>${note.tag}</strong></h6><div>${(note.description) ?note.description :'<em>-----No description-----</em>'}</div>`;

    if(flag) return container;
    $("messages").appendChild(container);
    handleScroll();
}
function createAssignmentContainer(data, flag=false) {
    if(!flag) chatData.push(data);
    const { assignment } = data;
    var date = new Date(assignment.submissionDate);
    var hh = date.getHours(); if(hh<10) hh = '0'+hh;
    var mm = date.getMinutes(); if(mm<10) mm = '0'+mm;
    date = `${date.toDateString()}, ${hh}:${mm}`;

    const container = document.createElement("div");
    container.className = "assignmentItem";
    container.innerHTML = `<h6><strong>${assignment.title}</strong></h6><div>${assignment.description}</div><div class="details-right"><u>Deadline</u> - <strong>${date}</strong></div>`;

    if(flag) return container;
    $("messages").appendChild(container);
    handleScroll();
}
function createExamContainer(data, flag=false) {}
function createChatContainer(data, flag=false) {
    var isSelf = data.sender == userId;
    var isTop = !(flag) && (chatData.length == 0 || chatData.reverse()[0].sender != data.sender);
    if(!flag) chatData.push(data);

    const container = document.createElement("div");
    container.className = `chat chat-${isSelf ?'self' :'other'} ${isTop ?'chat-top' :''}`;
    container.innerHTML = `${!isSelf && isTop ?`<strong>${data.senderName}</strong><br>` :''}${data.message}`;

    if(flag) return container;
    $("messages").appendChild(container);
    handleScroll();
}
function createErrorChatMessage(msg, flag=false) {
    const container = document.createElement("div");
    container.className = "chat chat-self text-danger";
    container.innerHTML = `<strong>Error - </strong>${msg}<br><strong>If the problem persists re-login might help!</strong>`;
    if(flag) return container;
    $("messages").appendChild(container);
}
function handleSocket(socket) {
    socket.on("auth", () => socket.emit("auth", { token: token, reference: subjectId }));
    socket.on("userData", data => {
        if(data.error) alert("Something went wrong! Interaction disabled!");
        else {
            var { userData, chats } = data;
            userId = userData._id;
            userName = userData.name;
            chatData.length = 0;
            chats.forEach(chatItem => {
                if(chatItem.message) createChatContainer(chatItem);
                else if(chatItem.assignment) createAssignmentContainer(chatItem);
                else if(chatItem.note) createNoteContainer(chatItem);
                else if(chatItem.examination) createExamContainer(chatItem);
            });
        }
    })
    socket.on("chat", message => {
        if(message.error) createErrorChatMessage(message.error.message || "Some unknown error occurred!");
        else {
            if(message.message) createChatContainer(message);
            else if(message.assignment) createAssignmentContainer(message);
            else if(message.note) createNoteContainer(message);
            else if(message.examination) createExamContainer(message);
        }
    });
    socket.on("loadedChats", data => {
        $("loadingBadge").style.display = "none";
        const messages = $("messages");
        if(data.error) {
            var container = createErrorChatMessage(data.error.message || "Some unknown error occurred!", true);
            messages.insertBefore(container, messages.children[0]);
        }
        else {
            chatData = data.concat(chatData);
            data.reverse().forEach(message => {
                var container;
                if(message.message) 
                    container = createChatContainer(message, true);
                else if(message.assignment) 
                    container = createAssignmentContainer(message, true);
                else if(message.note) 
                    container = createNoteContainer(message, true);
                else if(message.examination) 
                    container = createExamContainer(message, true);
                messages.insertBefore(container, messages.children[0]);
            })
        }
    });
}
function loadMoreMessages() {
    $("loadingBadge").style.display = "block";
    socket.emit("loadMoreChat", {
        reference: subjectId,
        skipCount: chatData.length
    });
}

function currentFaculty(data, isCurrent = false) {
    const innerHTML = `<img src="${data.img_url}" height="50px" width="50px">&nbsp;&nbsp;<div>${data.name}<br><small>${data.email}</small></div>`;
    if(isCurrent) {
        $("currentFacultyDetails").innerHTML = innerHTML;
    } else {
        $("selectedFacultyDetails").innerHTML = innerHTML;
    }
}
function facultySelected() {
    const id = $("facultySelected").value;
    currentFaculty(faculty.find(obj => obj._id == id));
}
function changeFaculty() {
    const btn = $("change-faculty-btn");
    const coordinator = $("facultySelected").value;
    if(coordinator != "none") {
        btn.innerText = "Changing...";
        btn.disabled = true;

        fetch(`${baseUrl}/api/class/subject/${subjectId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "token": token
            },
            body: JSON.stringify({ coordinator: coordinator })
        }).then(res => {
            if(res.status == 200) {
                currentFaculty(faculty.find(obj => obj._id == coordinator), true);
                $("close-changeFaculty-modal").click();
            } else {
                alert("Something went wrong!");
            }
            btn.innerText = "Change";
            btn.disabled = false;
        }).catch(err => {
            alert("Something went wrong!");
            console.log(err);
        })
    }
}

function updateUI(data) {
    var subjectCode = (data.subjectCode) ?`(${data.subjectCode})` :"";
    $("subjectTag").innerHTML = `${data.name} <small>${subjectCode}</small>`;
    document.title = `${data.name} ${subjectCode} | Studbudd`;

    // Updating faculty list in change faculty
    var currFaculty = data.coordinator;
    const facultyOptions = $("facultySelected");
    function containerValue(value, title) {
        var option = document.createElement('option');
        option.setAttribute("value", value);
        option.innerText = title;
        return option;
    }
    if(currFaculty) {
        currentFaculty(currFaculty);
        currentFaculty(currFaculty, true);
    }
    else {
        facultyOptions.appendChild(containerValue("none", "None"));
        $("currentFacultyDetails").innerHTML = "<em>-----None Selected-----</em>";
        $("selectedFacultyDetails").innerHTML = "<em>-----None Selected-----</em>";
    } 
    faculty.forEach(obj => {
        if(currFaculty && obj._id == currFaculty._id) {
            var opt = containerValue(obj._id, obj.name);
            opt.selected = true;
            facultyOptions.insertBefore(opt, facultyOptions.children[0]);
        } else {
            facultyOptions.appendChild(containerValue(obj._id, obj.name));
        }
    })
}
function loadData() {
    fetch(`${baseUrl}/api/class/subject/${subjectId}`, {
        method: "GET",
        headers: { "token": token }
    }).then(res => {
        res.json().then(data => {
            if(res.status == 200) {
                faculty = data.faculty;
                updateUI(data.subject);
            } else {
                alert(`Error Message: ${data.message}`);
            }
        }).catch(err => {
            console.log(err);
            alert("Something went wrong!");
        })
    }).catch(err => {
        console.log(err);
        alert("Something went wrong!");
    })
}

window.onload = function() {
    loadData();
    setMinDate();
    handleSocket(socket);
    // Message container on scroll
    $("messages").onscroll = function () {
        if($("messages").scrollTop == 0) loadMoreMessages();
    };
}