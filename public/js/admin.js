document.addEventListener("DOMContentLoaded", async () => {
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if(!token || !user || user.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // Set UI User Info
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userInitial').textContent = user.name.charAt(0).toUpperCase();

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Navigation Logic
    const navItems = document.querySelectorAll('.nav-item[data-target]');
    const views = document.querySelectorAll('.view-section');
    const pageTitle = document.getElementById('pageTitle');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(nav => nav.classList.remove('active'));
            views.forEach(view => view.classList.remove('active'));
            
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            const titles = {
                'dashboard-view': 'Dashboard',
                'create-exam-view': 'Create New Exam',
                'manage-exams-view': 'Manage Exams',
                'results-view': 'Student Results Analysis'
            };
            pageTitle.textContent = titles[targetId];

            if(targetId === 'dashboard-view') loadDashboardData();
            if(targetId === 'manage-exams-view') loadExamsData();
            if(targetId === 'results-view') loadResultsData();
        });
    });

    // Initial Load
    loadDashboardData();
    initCreateExamLogic();

    async function fetchAPI(url, options = {}) {
        options.headers = headers;
        const res = await fetch(url, options);
        if(!res.ok && res.status === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
        return res.json();
    }

    async function loadDashboardData() {
        try {
            const exams = await fetchAPI('/api/exams');
            const results = await fetchAPI('/api/results');

            // We hide total students for now as we don't have a users endpoint
            document.getElementById('statStudents').textContent = '-'; 
            document.getElementById('statExams').textContent = exams.length || 0;
            document.getElementById('statSubmissions').textContent = results.length || 0;

            const tbody = document.getElementById('recentSubmissionsBody');
            tbody.innerHTML = '';
            
            const recent = results.slice(0, 5); // Assuming already sorted descending from backend
            
            if (recent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No submissions yet</td></tr>';
                return;
            }

            recent.forEach(res => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${res.userId ? res.userId.name : 'Unknown'}</td>
                    <td>${res.examId ? res.examId.title : 'Deleted Exam'}</td>
                    <td><span class="badge badge-success">${res.score} / ${res.totalMarks || '-'}</span></td>
                    <td>${new Date(res.date).toLocaleDateString()}</td>
                `;
                tbody.appendChild(tr);
            });
        } catch(err) {
            console.error(err);
        }
    }

    async function loadExamsData() {
        try {
            const exams = await fetchAPI('/api/exams');
            const tbody = document.getElementById('examsListBody');
            tbody.innerHTML = '';

            if (exams.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No exams created</td></tr>';
                return;
            }

            exams.forEach(exam => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td><strong>${exam.title}</strong></td>
                    <td>${exam.questions.length}</td>
                    <td>${exam.duration} mins</td>
                    <td><span class="badge ${exam.status === 'published' ? 'badge-success' : ''}">${exam.status}</span></td>
                    <td>
                        <button class="btn btn-outline" style="padding: 5px 10px; font-size: 0.8rem;" onclick="deleteExam('${exam._id}')"><i class="fa-solid fa-trash"></i></button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch(err) {
            console.error(err);
        }
    }

    window.deleteExam = async function(id) {
        if(confirm("Are you sure you want to delete this exam?")) {
            await fetchAPI(`/api/exams/${id}`, { method: 'DELETE' });
            loadExamsData();
            loadDashboardData();
        }
    };

    async function loadResultsData() {
        try {
            const results = await fetchAPI('/api/results');
            const exams = await fetchAPI('/api/exams');
            
            const tbody = document.getElementById('analysisListBody');
            const filterSelect = document.getElementById('filterExam');
            
            // Populate filter if empty (preserve 'all' option)
            if(filterSelect.options.length === 1) {
                exams.forEach(ex => {
                    const opt = document.createElement('option');
                    opt.value = ex._id;
                    opt.textContent = ex.title;
                    filterSelect.appendChild(opt);
                });
            }

            const filterVal = filterSelect.value;
            const filteredResults = filterVal === 'all' ? results : results.filter(r => r.examId && r.examId._id === filterVal);

            tbody.innerHTML = '';
            if (filteredResults.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No results found</td></tr>';
                return;
            }

            filteredResults.forEach(res => {
                const maxScore = res.totalMarks || 100;
                const percentage = ((res.score / maxScore) * 100).toFixed(1);

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${res.userId ? res.userId.name : 'Unknown User'}</td>
                    <td>${res.examId ? res.examId.title : 'Deleted Exam'}</td>
                    <td><strong>${res.score}</strong></td>
                    <td>${maxScore}</td>
                    <td>
                        <div style="display:flex; align-items:center; gap: 10px;">
                            <div style="flex:1; background:var(--border-color); height:8px; border-radius:4px; overflow:hidden;">
                                <div style="height:100%; width:${percentage}%; background:var(--primary);"></div>
                            </div>
                            <span style="font-size:0.8rem;">${percentage}%</span>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch(err) {
            console.error(err);
        }
    }
    
    document.getElementById('filterExam').addEventListener('change', loadResultsData);

    function initCreateExamLogic() {
        const addBtn = document.getElementById('addQuestionBtn');
        const container = document.getElementById('questionsContainer');
        const form = document.getElementById('createExamForm');
        let questionCount = 0;

        function addQuestionForm() {
            questionCount++;
            const qId = `q_temp_${Date.now()}_${questionCount}`;
            
            const div = document.createElement('div');
            div.className = 'question-card animate-fade-in';
            div.id = `card_${qId}`;
            div.innerHTML = `
                <button type="button" class="rm-btn" onclick="document.getElementById('card_${qId}').remove()"><i class="fa-solid fa-xmark"></i></button>
                <div class="form-group">
                    <label class="form-label">Question Text</label>
                    <input type="text" class="form-input q-text" required placeholder="Enter the question...">
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="form-group">
                        <label class="form-label">Option 1 (Correct)</label>
                        <input type="text" class="form-input q-opt" required style="border-left: 3px solid var(--success);">
                        <input type="hidden" class="q-correct" value="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Option 2</label>
                        <input type="text" class="form-input q-opt" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Option 3</label>
                        <input type="text" class="form-input q-opt" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Option 4</label>
                        <input type="text" class="form-input q-opt" required>
                    </div>
                </div>
                <div class="form-group" style="margin-bottom:0;">
                    <label class="form-label">Marks for this question</label>
                    <input type="number" class="form-input q-marks" required min="1" value="10" style="width:100px;">
                </div>
            `;
            container.appendChild(div);
        }

        addQuestionForm();
        addBtn.addEventListener('click', addQuestionForm);

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const title = document.getElementById('examTitle').value;
            const desc = document.getElementById('examDesc').value;
            const duration = parseInt(document.getElementById('examDuration').value);
            
            const qCards = container.querySelectorAll('.question-card');
            if(qCards.length === 0) {
                alert("Please add at least one question.");
                return;
            }

            let totalMarks = 0;
            const questions = [];

            qCards.forEach(card => {
                const text = card.querySelector('.q-text').value;
                const optsInputs = card.querySelectorAll('.q-opt');
                const marks = parseInt(card.querySelector('.q-marks').value);
                
                const options = Array.from(optsInputs).map(inp => inp.value);
                const unshuffled = options.map((opt, i) => ({ text: opt, isCorrect: i === 0 }));
                const shuffled = unshuffled.sort(() => Math.random() - 0.5);
                
                const finalOptions = shuffled.map(o => o.text);
                const correctIndex = shuffled.findIndex(o => o.isCorrect);

                totalMarks += marks;

                questions.push({
                    text: text,
                    options: finalOptions,
                    correctOptionIndex: correctIndex,
                    marks: marks
                });
            });

            const payload = {
                title, description, duration, totalMarks,
                status: 'published', questions
            };

            try {
                const btn = form.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Publishing...';

                await fetchAPI('/api/exams', {
                    method: 'POST',
                    body: JSON.stringify(payload)
                });

                alert("Exam Published Successfully!");
                form.reset();
                container.innerHTML = '';
                addQuestionForm();
                
                btn.disabled = false;
                btn.textContent = 'Publish Exam';
                
                document.querySelector('[data-target="manage-exams-view"]').click();
            } catch(err) {
                alert("Failed to create exam");
                console.error(err);
            }
        });
    }
});
