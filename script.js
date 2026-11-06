let db = JSON.parse(localStorage.getItem("teamforge") ||
'{"students":[],"projects":[],"tasks":[]}');

function save() {
    localStorage.setItem("teamforge", JSON.stringify(db));
    render();
}

function skills(value) {
    return [...new Set(value.split(",").map(x => x.trim()).filter(Boolean))];
}

function notify(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
}

// ADD STUDENT
document.getElementById("studentForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const email = document.getElementById("studentEmail").value.trim();

    if (db.students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
        return notify("Email already registered!");
    }

    db.students.push({
        id: crypto.randomUUID(),
        name: document.getElementById("studentName").value.trim(),
        email: email,
        dept: document.getElementById("studentDept").value.trim(),
        skills: skills(document.getElementById("studentSkills").value)
    });

    this.reset();
    save();
    notify("Student added successfully!");
});

// CREATE PROJECT
document.getElementById("projectForm").addEventListener("submit", function(e) {
    e.preventDefault();

    db.projects.push({
        id: crypto.randomUUID(),
        name: document.getElementById("projectName").value.trim(),
        desc: document.getElementById("projectDescription").value.trim(),
        skills: skills(document.getElementById("projectSkills").value)
    });

    this.reset();
    save();
    notify("Project created!");
});

// CREATE TASK
document.getElementById("taskForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!document.getElementById("taskProject").value) {
        return notify("Create a project first!");
    }

    db.tasks.push({
        id: crypto.randomUUID(),
        name: document.getElementById("taskName").value.trim(),
        project: document.getElementById("taskProject").value,
        assignee: document.getElementById("taskAssignee").value,
        status: document.getElementById("taskStatus").value
    });

    this.reset();
    save();
    notify("Task added!");
});

// DISPLAY STUDENTS
function renderStudents() {
    let query = document.getElementById("studentSearch").value.toLowerCase();

    let students = db.students.filter(s =>
        (s.name + " " + s.email + " " + s.dept + " " + s.skills.join(" "))
        .toLowerCase().includes(query)
    );

    document.getElementById("studentTable").innerHTML =
        students.map(s => `
        <tr>
            <td><b>${escapeHTML(s.name)}</b><br>
            <small>${escapeHTML(s.email)}</small></td>

            <td>${escapeHTML(s.dept)}</td>

            <td>${s.skills.map(skill =>
                `<span class="tag">${escapeHTML(skill)}</span>`
            ).join("")}</td>

            <td>
                <button class="delete" data-del-student="${s.id}">
                    Remove
                </button>
            </td>
        </tr>`).join("");

    document.getElementById("studentEmpty").style.display =
        students.length ? "none" : "block";
}

// DISPLAY PROJECTS
function renderProjects() {
    let options = db.projects.map(p =>
        `<option value="${p.id}">${escapeHTML(p.name)}</option>`
    ).join("");

    document.getElementById("projectList").innerHTML =
        db.projects.map(p => `
        <div class="project">
            <b>${escapeHTML(p.name)}</b>
            <p>${escapeHTML(p.desc || "No description")}</p>
            ${p.skills.map(s =>
                `<span class="tag">${escapeHTML(s)}</span>`
            ).join("")}
        </div>`).join("");

    document.getElementById("projectEmpty").style.display =
        db.projects.length ? "none" : "block";

    document.getElementById("matchProject").innerHTML =
        '<option value="">Select a project</option>' + options;

    document.getElementById("taskProject").innerHTML =
        '<option value="">Select project</option>' + options;
}

// DISPLAY TASKS
function renderTasks() {
    document.getElementById("taskAssignee").innerHTML =
        '<option value="">Unassigned</option>' +
        db.students.map(s =>
            `<option value="${s.id}">${escapeHTML(s.name)}</option>`
        ).join("");

    document.getElementById("taskTable").innerHTML =
        db.tasks.map(t => {
            let p = db.projects.find(x => x.id === t.project);
            let s = db.students.find(x => x.id === t.assignee);

            return `
            <tr>
                <td>${escapeHTML(t.name)}</td>
                <td>${escapeHTML(p?.name || "")}</td>
                <td>${escapeHTML(s?.name || "Unassigned")}</td>

                <td>
                    <select class="status" data-status="${t.id}">
                        ${["To do", "In progress", "Completed"].map(x =>
                            `<option ${x === t.status ? "selected" : ""}>${x}</option>`
                        ).join("")}
                    </select>
                </td>

                <td>
                    <button class="delete" data-del-task="${t.id}">
                        Remove
                    </button>
                </td>
            </tr>`;
        }).join("");

    document.getElementById("taskEmpty").style.display =
        db.tasks.length ? "none" : "block";
}

// SKILL MATCHING
function renderMatches() {
    let project = db.projects.find(
        p => p.id === document.getElementById("matchProject").value
    );

    let result = document.getElementById("matchResults");

    if (!project) {
        result.textContent = "Please select a project.";
        return;
    }

    let required = project.skills.map(s => s.toLowerCase());

    let matches = db.students.map(student => {
        let found = student.skills.filter(skill =>
            required.includes(skill.toLowerCase())
        );

        let score = required.length
            ? Math.round(found.length / required.length * 100)
            : 0;

        return { ...student, found, score };
    });

    matches.sort((a, b) => b.score - a.score);

    result.innerHTML = matches.length
        ? matches.map(s => `
            <div class="match">
                <div>
                    <b>${escapeHTML(s.name)}</b><br>
                    <small>Matched skills:
                    ${s.found.length
                        ? s.found.map(escapeHTML).join(", ")
                        : "None"}
                    </small>
                </div>
                <span class="score">${s.score}%</span>
            </div>
        `).join("")
        : "No students registered yet.";
}

// SEARCH
document.getElementById("studentSearch")
    .addEventListener("input", renderStudents);

document.getElementById("matchButton")
    .addEventListener("click", renderMatches);

// DELETE STUDENT AND TASK
document.addEventListener("click", function(e) {
    if (e.target.dataset.delStudent) {
        const id = e.target.dataset.delStudent;

        db.students = db.students.filter(s => s.id !== id);

        db.tasks.forEach(t => {
            if (t.assignee === id) t.assignee = "";
        });

        save();
        notify("Student removed!");
    }

    if (e.target.dataset.delTask) {
        db.tasks = db.tasks.filter(t => t.id !== e.target.dataset.delTask);
        save();
        notify("Task removed!");
    }
});

// UPDATE TASK STATUS
document.addEventListener("change", function(e) {
    if (e.target.dataset.status) {
        let task = db.tasks.find(t => t.id === e.target.dataset.status);

        if (task) {
            task.status = e.target.value;
            save();
            notify("Task status updated!");
        }
    }
});

// SAFE DISPLAY
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// DASHBOARD COUNTS
function render() {
    renderStudents();
    renderProjects();
    renderTasks();

    document.getElementById("studentCount").textContent =
        db.students.length;

    document.getElementById("projectCount").textContent =
        db.projects.length;

    document.getElementById("taskCount").textContent =
        db.tasks.length;

    document.getElementById("completedCount").textContent =
        db.tasks.filter(t => t.status === "Completed").length;
}

// INITIAL LOAD
render();