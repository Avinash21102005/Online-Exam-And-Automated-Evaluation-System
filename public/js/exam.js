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

    const urlParams = new URLSearchParams(window.location.search);
    const examId = urlParams.get('id');

    if(!examId) {
        alert("No exam selected.");
        window.location.href = 'user-dashboard.html';
        return;
    }

    let exam = null;

    try {
        // Fetch Exam Details
        const examRes = await fetch(`/api/exams/${examId}`, { headers });
        if(!examRes.ok) throw new Error("Exam not found");
        exam = await examRes.json();

        // Check if already taken
        const resultsRes = await fetch('/api/results', { headers });
        const myResults = await resultsRes.json();
        
        const alreadyTaken = myResults.find(r => r.examId && r.examId._id === examId);
        if(alreadyTaken) {
            alert("You have already completed this exam.");
            window.location.href = 'user-dashboard.html';
            return;
        }

    } catch(err) {
        alert(err.message);
        window.location.href = 'user-dashboard.html';
        return;
    }

    // Exam State
    let currentQuestionIndex = 0;
    const totalQuestions = exam.questions.length;
    const userAnswers = {}; 

    // Timer Logic
    const durationSecs = exam.duration * 60;
    let timeRemaining = durationSecs;
    const timerDisplay = document.getElementById('timeRemaining');
    const timerBox = document.getElementById('timerBox');
    let timerInterval;

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function updateTimer() {
        if(timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerDisplay.textContent = "00:00";
            alert("Time's up! Submitting exam automatically.");
            processSubmission();
            return;
        }

        timerDisplay.textContent = formatTime(timeRemaining);
        
        if(timeRemaining <= 60) {
            timerBox.style.animation = 'pulse 1s infinite';
        }

        timeRemaining--;
    }

    function startTimer() {
        updateTimer();
        timerInterval = setInterval(updateTimer, 1000);
    }

    document.getElementById('headerExamTitle').textContent = exam.title;

    function setupNavigator() {
        const nav = document.getElementById('qNavigator');
        nav.innerHTML = '';
        
        for(let i=0; i<totalQuestions; i++) {
            const btn = document.createElement('div');
            btn.className = 'q-bubble';
            btn.id = `nav_q_${i}`;
            btn.textContent = i + 1;
            btn.onclick = () => loadQuestion(i);
            nav.appendChild(btn);
        }
    }

    function updateNavigator() {
        for(let i=0; i<totalQuestions; i++) {
            const btn = document.getElementById(`nav_q_${i}`);
            btn.className = 'q-bubble';
            if(userAnswers[i] !== undefined) btn.classList.add('answered');
            if(i === currentQuestionIndex) btn.classList.add('active');
        }
    }

    function loadQuestion(index) {
        currentQuestionIndex = index;
        const q = exam.questions[index];

        document.getElementById('questionNumText').textContent = `Question ${index + 1} of ${totalQuestions}`;
        document.getElementById('questionMarks').textContent = `${q.marks} Marks`;
        document.getElementById('questionText').textContent = q.text;

        const optsContainer = document.getElementById('optionsContainer');
        optsContainer.innerHTML = '';

        q.options.forEach((optText, optIndex) => {
            const isSelected = userAnswers[index] === optIndex;
            
            const label = document.createElement('label');
            label.className = `option-label ${isSelected ? 'selected' : ''}`;
            
            const input = document.createElement('input');
            input.type = 'radio';
            input.name = `q_${index}`; 
            input.value = optIndex;
            if(isSelected) input.checked = true;

            input.onchange = () => {
                document.querySelectorAll('.option-label').forEach(lbl => lbl.classList.remove('selected'));
                label.classList.add('selected');
                userAnswers[index] = optIndex;
                updateNavigator();
            };

            const span = document.createElement('span');
            span.textContent = optText;

            label.appendChild(input);
            label.appendChild(span);
            optsContainer.appendChild(label);
        });

        document.getElementById('prevBtn').disabled = (index === 0);
        
        if (index === totalQuestions - 1) {
            document.getElementById('nextBtn').innerHTML = 'Finish <i class="fa-solid fa-check"></i>';
            document.getElementById('nextBtn').classList.remove('btn-primary');
            document.getElementById('nextBtn').classList.add('btn-outline');
            document.getElementById('nextBtn').style.borderColor = 'var(--success)';
            document.getElementById('nextBtn').style.color = 'var(--success)';
        } else {
            document.getElementById('nextBtn').innerHTML = 'Next <i class="fa-solid fa-arrow-right"></i>';
            document.getElementById('nextBtn').className = 'btn btn-primary';
            document.getElementById('nextBtn').style.borderColor = '';
            document.getElementById('nextBtn').style.color = '';
        }

        updateNavigator();
    }

    document.getElementById('prevBtn').onclick = () => {
        if(currentQuestionIndex > 0) loadQuestion(currentQuestionIndex - 1);
    };

    document.getElementById('nextBtn').onclick = () => {
        if(currentQuestionIndex < totalQuestions - 1) {
            loadQuestion(currentQuestionIndex + 1);
        } else {
            showConfirmModal();
        }
    };

    const confirmModal = document.getElementById('confirmModal');
    
    function showConfirmModal() {
        const answeredCount = Object.keys(userAnswers).length;
        const unanswered = totalQuestions - answeredCount;
        
        document.getElementById('unansweredCountModal').textContent = unanswered;
        confirmModal.style.display = 'flex';
    }

    document.getElementById('finishExamBtnTop').onclick = showConfirmModal;
    document.getElementById('finishExamBtnSide').onclick = showConfirmModal;

    document.getElementById('cancelSubmitBtn').onclick = () => {
        confirmModal.style.display = 'none';
    };

    document.getElementById('finalSubmitBtn').onclick = () => {
        confirmModal.style.display = 'none';
        processSubmission();
    };

    async function processSubmission() {
        clearInterval(timerInterval);
        document.getElementById('processingModal').style.display = 'flex';

        let score = 0;
        exam.questions.forEach((q, idx) => {
            const uAns = userAnswers[idx];
            if(uAns !== undefined && uAns === q.correctOptionIndex) {
                score += q.marks;
            }
        });

        const timeTaken = durationSecs - timeRemaining;

        const payload = {
            examId: exam._id,
            score: score,
            totalMarks: exam.totalMarks,
            timeTaken: timeTaken,
            answers: userAnswers
        };

        try {
            await fetch('/api/results', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });
            window.location.href = 'user-dashboard.html';
        } catch(err) {
            alert("Error submitting exam: " + err.message);
            document.getElementById('processingModal').style.display = 'none';
        }
    }

    setupNavigator();
    loadQuestion(0);
    startTimer();
});
