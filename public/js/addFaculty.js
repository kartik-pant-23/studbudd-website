function $(id) {
    return document.getElementById(id);
}

const base_url = window.location.origin;
const token = window.localStorage.token;

var facultyArray = [];
var chosenFaculty;

class Faculty {
    constructor (faculty) {
        this._id = faculty._id;
        this.name = faculty.name;
        this.email = faculty.email;
        this.img_url = faculty.img_url || 'https://www.gstatic.com/images/branding/product/2x/avatar_square_blue_120dp.png';
        this.details = faculty.details || '';
        this.flag_show = faculty.flag_show;
        this.qualification = faculty.qualification || '';
    }
}

function saveChanges() {
    const saveBtn = $("save-changes-btn");
    saveBtn.innerText = "Updating...";
    saveBtn.disabled = true;

    const img = $("fac-image").files[0];
    const newPassword = $("fac-password-modal").value;
    const qualification = $("fac-qual-modal").value;
    const details = $("fac-desc-modal").value;
    const flag_show = $("fac-flag-modal").checked;

    const body = new FormData();
    if(img) body.append('file', img);
    if(newPassword) body.append('newPassword', newPassword);
    if(qualification) body.append('qualification', qualification);
    if(details) body.append('details', details);
    body.append('flag_show', flag_show);

    fetch(`${base_url}/api/faculty/${chosenFaculty}`, {
        method: "PATCH",
        headers: { "token": token },
        body: body
    }).then(res => {
        saveBtn.innerText = "Save changes";
        saveBtn.disabled = false;
        res.json().then(data => {
            if(res.status == 200) {
                const container = $(`${data._id}`);

                const updatedFaculty = new Faculty(data);
                facultyArray = facultyArray.map(obj => obj._id == updatedFaculty._id ?updatedFaculty: obj);

                container.innerHTML = `<img src="${updatedFaculty.img_url}" height="50px" width="50px">&nbsp;&nbsp;<div><div class="faculty-name">${updatedFaculty.name}</div><div>${updatedFaculty.email}</div></div>`;

                $("close-fac-modal").click();
            } else {
                alert("Something went wrong!");
            }
        }).catch(err => { 
            console.log(err); 
            alert("Something went wrong!");
        });
    }).catch(err => {
        console.log(err);
        alert("Something went wrong!");
    })
}

function loadImage(event) {
    if(event.target.files[0]) {
        $("fac-img-modal").src = URL.createObjectURL(event.target.files[0]);
    }
}
function editFaculty(facultyId) {
    chosenFaculty = facultyId;
    const faculty = facultyArray.find(obj => obj._id == chosenFaculty);
    const facultyImageContainer = $("fac-img-modal");
    facultyImageContainer.src = faculty.img_url;
    $("fac-name-modal").innerText = faculty.name;
    $("fac-email-modal").innerText = faculty.email;
    $("fac-qual-modal").value = faculty.qualification;
    $("fac-desc-modal").innerText = faculty.details;
    $("fac-flag-modal").checked = faculty.flag_show;

    $("fac-image").value = null;
}
function facultyContainer(data) {
    var container = document.createElement('div');
    container['id'] = data._id;
    container.setAttribute('data-bs-toggle', "modal");
    container.setAttribute('data-bs-target', "#faculty-modal");
    container.className = "faculty-container";
    container.setAttribute('onclick',"editFaculty(this.id)");

    container.innerHTML = `<img src="${data.img_url}" height="50px" width="50px">&nbsp;&nbsp;<div><div class="faculty-name">${data.name}</div><div>${data.email}</div></div>`;

    return container;
}
function updateUI(data) {
    if(data.count == 0) {
        $("empty-faculty").style.display = "block";
    } else {
        var container = $("all-faculties");
        data.faculty.forEach(item => {
            facultyArray.push(new Faculty(item));
            container.appendChild(facultyContainer(facultyArray[facultyArray.length-1]));
        });
    }
}

function loadData() {
    fetch(`${base_url}/api/org/faculty`, {
        method: "GET",
        headers: { "token": token }
    }).then(res => {
        res.json().then(data => {
            if(res.status == 200) updateUI(data);
            else {
                // Take to error page
                alert("Something went wrong!")
            }
        }).catch(err => {throw err; });
    })
    .catch(err => {
        console.log(err);
        alert("Something went wrong!");
    })
}

window.onload = function () {
    loadData();
}