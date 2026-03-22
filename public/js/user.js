document.addEventListener("DOMContentLoaded", async () => {
    
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    if(!token || !user || user.role !== 'user') {
        window.location.href = 'login.html';
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userInitial').textContent = user.name.charAt(0).toUpperCase();

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

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
                'dashboard-view': 'Student Overview',
                'available-exams-view': 'Available Testing',
                'my-results-view': 'Exam History and Results'
            };
            pageTitle.textContent = titles[targetId];

            loadViews();
        });
    });

    async function fetchAPI(url) {
        const res = await fetch(url, { headers });
        if(!res.ok && res.status === 401) {
            localStorage.clear();
            window.location.href = 'login.html';
        }
        return res.json();
    }

    // Load initial data
    loadViews();

    async function loadViews() {
        try {
            const allExams = await fetchAPI('/api/exams');
            const myResults = await fetchAPI('/api/results');

            const completedExamIds = myResults.map(r => r.examId ? r.examId._id : null).filter(id => id);
            const pendingExams = allExams.filter(e => !completedExamIds.includes(e._id) && e.status === 'published');
            
            // 1. Overview Dashboard
            document.getElementById('statCompleted').textContent = myResults.length;
            document.getElementById('statPending').textContent = pendingExams.length;
            
            let avg = 0;
            if(myResults.length > 0) {
                let totalPct = 0;
                myResults.forEach(r => {
                    totalPct += (r.score / (r.totalMarks || 100)) * 100;
                });
                avg = totalPct / myResults.length;
            }
            document.getElementById('statAvg').textContent = avg.toFixed(1) + '%';

            const recentTbody = document.getElementById('recentActivityBody');
            recentTbody.innerHTML = '';
            const recent = myResults.slice(0, 5); // Backend sorts descending
            
            if (recent.length === 0) {
                recentTbody.innerHTML = '<tr><td colspan="4" class="empty-state">No exams taken yet.</td></tr>';
            } else {
                recent.forEach(r => {
                    const pct = ((r.score / r.totalMarks) * 100).toFixed(1);
                    const passClass = pct >= 40 ? 'badge-success' : 'badge-warning';
                    const passText = pct >= 40 ? 'Passed' : 'Failed';
                    
                    recentTbody.innerHTML += `
                        <tr>
                            <td><strong>${r.examId ? r.examId.title : 'Deleted Exam'}</strong></td>
                            <td>${r.score} / ${r.totalMarks}</td>
                            <td><span class="badge ${passClass}">${passText}</span></td>
                            <td>${new Date(r.date).toLocaleDateString()}</td>
                        </tr>
                    `;
                });
            }

            // 2. Available Exams
            const availableContainer = document.getElementById('availableExamsContainer');
            availableContainer.innerHTML = '';
            if (pendingExams.length === 0) {
                availableContainer.innerHTML = '<div class="glass-panel" style="grid-column: 1 / -1; padding: 2rem; text-align: center;">You have completed all available exams!</div>';
            } else {
                pendingExams.forEach(exam => {
                    availableContainer.innerHTML += `
                        <div class="exam-card glass-panel">
                            <div class="exam-title">${exam.title}</div>
                            <div class="exam-meta">
                                <span><i class="fa-regular fa-clock"></i> ${exam.duration} mins</span>
                                <span><i class="fa-regular fa-circle-question"></i> ${exam.questions.length} Qs</span>
                            </div>
                            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                                ${exam.description}
                            </p>
                            <a href="exam.html?id=${exam._id}" class="btn btn-primary" style="width: 100%;">Attempt Exam</a>
                        </div>
                    `;
                });
            }

            // 3. Exam History
            const historyTbody = document.getElementById('historyListBody');
            historyTbody.innerHTML = '';
            if (myResults.length === 0) {
                historyTbody.innerHTML = '<tr><td colspan="5" class="empty-state">No examination history found.</td></tr>';
            } else {
                myResults.forEach(r => {
                    const pct = ((r.score / r.totalMarks) * 100).toFixed(1);
                    
                    historyTbody.innerHTML += `
                        <tr>
                            <td><strong>${r.examId ? r.examId.title : 'Deleted Exam'}</strong></td>
                            <td>${r.examId ? r.examId.questions.length : '?'}</td>
                            <td>${r.score} / ${r.totalMarks}</td>
                            <td>
                                <div style="display:flex; align-items:center; gap: 10px;">
                                    <div style="flex:1; background:var(--border-color); height:8px; border-radius:4px; overflow:hidden;">
                                        <div style="height:100%; width:${pct}%; background:var(--primary);"></div>
                                    </div>
                                    <span style="font-size:0.8rem;">${pct}%</span>
                                </div>
                            </td>
                            <td>${new Date(r.date).toLocaleString()}</td>
                        </tr>
                    `;
                });
            }
        } catch(err) {
            console.error(err);
        }
    }
});
