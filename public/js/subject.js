function $(id) {
    return document.getElementById(id);
}

const socket = io();
var userName, userId, chatData = [];
const baseUrl = window.location.origin;
const token = window.localStorage.getItem("token");
const subjectId = window.location.pathname.split('/').reverse()[0];

// Adding Assignments
function resetQuestions() {
    const questions = $('questions');
    questions.innerHTML = `<div id="ques0" class="questionContainer"><div class="quesText"><textarea class="form-control" placeholder="Question 1" rows="1"></textarea><select class="quesType form-select form-select-sm" name="quesType" id="ques0-type" onchange="changeQuestionType('ques0')"><option value="0">Subjective</option><option value="1">Objective</option></select></div></div>`;
}
function addMoreQuestions() {
    const questions = $("questions");
    const lastQuesText = questions.lastElementChild.firstElementChild;
    const lastQuesOptions = $(questions.lastElementChild.id+"-options");
    var shouldAdd = true;

    const quesValue = lastQuesText.firstElementChild.value;
    if(quesValue && quesValue.trim()!='') {
        if(lastQuesText.lastElementChild.value == 1) {
            if(lastQuesOptions && lastQuesOptions.childElementCount < 3) {
                alert("Add at least two options!");
                shouldAdd = false;
            }
        }
    } else {
        alert("Question should have some text!");
        shouldAdd = false;
    }

    if(shouldAdd) {
        lastQuesText.firstElementChild.disabled = true;
        lastQuesText.lastElementChild.style.display = "none";
        if(lastQuesOptions) lastQuesOptions.lastElementChild.style.display = "none";

        const quesId = `ques${questions.childElementCount}`;
        const newQuesContainer = document.createElement('div');
        newQuesContainer.className = "questionContainer";
        newQuesContainer.setAttribute("id", quesId);
        newQuesContainer.innerHTML = `<div class="quesText">
        <textarea class="form-control" placeholder="Question ${parseInt(questions.childElementCount)+1}" rows="1"></textarea>
        <select class="quesType form-select form-select-sm" name="quesType" id="${quesId}-type" onchange="changeQuestionType('${quesId}')"><option value="0">Subjective</option><option value="1">Objective</option></select></div>`;
        questions.appendChild(newQuesContainer);
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
        newOption.innerHTML = `<input type="text" placeholder="Option ${parseInt(optionsContainer.childElementCount)+1}"><button onclick="addMoreOptions('${id}')">Save</button>`;
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
            container.innerHTML = `<div class="quesOption"><input type="text" placeholder="Option 1"><button onclick="addMoreOptions('${id}-options')">Save</button></div>`;
            $(id).appendChild(container);
        }
    } else {
        if(options) options.style.display = "none";
    }
}
function getQuestions() {
    const questions = $("questions");
    var data = [];
    Array.from(questions.children).forEach(question => {
        var questionText = question.firstElementChild;
        var questionOptions = question.lastElementChild;
        if(questionText.firstElementChild.disabled) {
            var quesData = {};
            quesData["question"] = questionText.firstElementChild.value;
            quesData["type"] = questionText.lastElementChild.value;

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
                    console.log(data);
                    $("assignmentTitle").value = null;
                    $("assignmentDesc").value = null;
                    $("assignmentSubmissionDate").value = null;
                    $("assignment").value = null;
                    resetQuestions();
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
}

// Handling messages and socket
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
        subjectId: subjectId
    };
    $("chat").value = null;
    $("sendChatButton").disabled = true;
    socket.emit("chat", data);
})
function sendMessage() {
    const data = {
        sender: userId,
        senderName: userName,
        message: $("chat").value,
        subjectId: subjectId
    };
    $("chat").value = null;
    $("sendChatButton").disabled = true;
    socket.emit("chat", data);
}
function createChatContainer(data) {
    var isSelf = data.sender == userId;
    var isTop = chatData.length == 0 || chatData.reverse()[0].sender != data.sender;
    chatData.push(data);

    const container = document.createElement("div");
    container.className = `chat chat-${isSelf ?'self' :'other'} ${isTop ?'chat-top' :''}`;
    container.innerHTML = `${!isSelf && isTop ?`<strong>${data.senderName}</strong><br>` :''}${data.message}`;

    const msgContainer = $("messages");
    msgContainer.appendChild(container);

    // Scroll
    const scrollTop = msgContainer.scrollTop;
    const scrollHeight = msgContainer.scrollHeight;
    const clientHeight = msgContainer.clientHeight;

    if(scrollTop+scrollHeight > clientHeight) {
        msgContainer.scrollTop = scrollHeight;
    }
}
function handleSocket(socket) {
    socket.on("auth", () => socket.emit("auth", { token: token, subjectId: subjectId }));
    socket.on("userData", data => {
        if(data.error) alert("Something went wrong! Interaction disabled!");
        else {
            userId = data._id;
            userName = data.name;
        }
    })
    socket.on("chat", message => {
        createChatContainer(message);
    });
}
function loadMoreMessages() {
    console.log("Loading..");
}

window.onload = function() {
    setMinDate();
    handleSocket(socket);
    // Message container on scroll
    $("messages").onscroll = function () {
        if($("messages").scrollTop == 0) loadMoreMessages();
    };
}