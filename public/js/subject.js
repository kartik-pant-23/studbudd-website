function $(id) {
    return document.getElementById(id);
}

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