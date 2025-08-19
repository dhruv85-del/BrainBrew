/* Full app script — matches the HTML you provided.
   Features:
   - Category selection, difficulty
   - Timer per question + auto-reveal on timeout
   - Lifelines: 50-50, Skip, Hint
   - Randomized questions/options
   - Review answers, Detailed report
   - Leaderboard (localStorage)
   - Login/Signup (localStorage)
   - Badges & confetti
   - Download report
*/

document.addEventListener("DOMContentLoaded", () => {
  /* ============================
     Simple question BANK (15 each)
     Keys must match data-category attributes in HTML: "java","dsa","web"
     (You can expand these arrays later)
     ============================ */
  const BANK = {
    java: [
      { q: "Which is NOT a Java feature?", o: ["Object-Oriented","Use of pointers","Robust","Portable"], a: 1, hint: "Java doesn't expose raw pointers." },
      { q: "Java was originally developed by?", o: ["Microsoft","Sun Microsystems","IBM","Oracle"], a: 1 },
      { q: "Keyword to inherit a class:", o: ["implement","extends","inherits","super"], a: 1 },
      { q: "Package auto-imported by default:", o: ["java.util","java.io","java.lang","java.net"], a: 2 },
      { q: "JVM stands for:", o: ["Java Visual Machine","Java Virtual Machine","Java Verified Module","Java Value Machine"], a: 1 },
      { q: "Which is NOT a primitive type?", o: ["int","float","char","String"], a: 3 },
      { q: "Default value of int:", o: ["0","null","undefined","1"], a: 0 },
      { q: "Stops the loop:", o: ["stop","exit","break","return"], a: 2 },
      { q: "Base class of all classes:", o: ["Main","Object","Root","Core"], a: 1 },
      { q: "Entry point method:", o: ["start()","run()","init()","main()"], a: 3 },
      { q: "String in Java is:", o: ["Mutable","Immutable","Primitive","Pointer"], a: 1 },
      { q: "Which collection allows duplicates?", o: ["Set","List","Map","None"], a: 1 },
      { q: "Checked exception example:", o: ["NullPointerException","IOException","ArithmeticException","ArrayIndexOutOfBoundsException"], a: 1 },
      { q: "Block that always executes:", o: ["try","catch","finally","throw"], a: 2 },
      { q: "Keyword to prevent inheritance:", o: ["static","const","final","sealed"], a: 2 }
    ],

    dsa: [
      { q: "Which DS uses FIFO?", o: ["Stack","Queue","Tree","Graph"], a: 1 },
      { q: "Which DS uses LIFO?", o: ["Queue","Stack","Array","List"], a: 1 },
      { q: "Binary search works on:", o: ["Sorted array","Unsorted array","Graph","Random"], a: 0 },
      { q: "Worst case of quicksort:", o: ["O(n)","O(n log n)","O(n^2)","O(log n)"], a: 2 },
      { q: "Merge sort complexity (avg):", o: ["O(n)","O(n log n)","O(n^2)","O(log n)"], a: 1 },
      { q: "Recursion uses which DS:", o: ["Queue","Stack","Heap","Tree"], a: 1 },
      { q: "BFS uses:", o: ["Stack","Queue","Deque","Recursion"], a: 1 },
      { q: "DFS primarily uses:", o: ["Queue","Stack","Heap","Priority Queue"], a: 1 },
      { q: "Which is NOT sorting algo:", o: ["Merge","Bubble","Dijkstra","Heap"], a: 2 },
      { q: "Which is non-linear DS:", o: ["Array","Linked List","Stack","Tree"], a: 3 },
      { q: "Inorder of BST gives:", o: ["Reverse","Random","Sorted","Level"], a: 2 },
      { q: "Heap mainly implements:", o: ["Queue","Stack","Priority Queue","Deque"], a: 2 },
      { q: "Best for sparse graphs:", o: ["Adjacency matrix","Adjacency list","Incidence matrix","None"], a: 1 },
      { q: "Hash table average search:", o: ["O(1)","O(n)","O(log n)","O(n log n)"], a: 0 },
      { q: "Prefix to Postfix uses:", o: ["Queue","Stack","Array","Tree"], a: 1 }
    ],

    web: [
      { q: "HTML stands for:", o: ["HyperText Markup Language","HighText Machine Language","Hyperlinks and Text Markup Language","None"], a: 0 },
      { q: "CSS is used for:", o: ["Structure","Style","Database","Logic"], a: 1 },
      { q: "JS is primarily:", o: ["Scripting","Styling","DB","Markup"], a: 0 },
      { q: "Semantic element:", o: ["<div>","<section>","<span>","<b>"], a: 1 },
      { q: "Idempotent HTTP method:", o: ["POST","PATCH","GET","CONNECT"], a: 2 },
      { q: "Store data permanently (browser):", o: ["sessionStorage","localStorage","Cookie(session)","Cache"], a: 1 },
      { q: "Flex direction property:", o: ["flex-direction","justify-content","align-items","order"], a: 0 },
      { q: "React is a:", o: ["Library","Framework","Language","Runtime"], a: 0 },
      { q: "Node.js uses:", o: ["SpiderMonkey","Java VM","V8","Chakra"], a: 2 },
      { q: "Secure protocol:", o: ["HTTP","HTTPS","FTP","SMTP"], a: 1 },
      { q: "Background image property:", o: ["background-img","bg","background-image","image"], a: 2 },
      { q: "Bootstrap is a:", o: ["JS Library","CSS Framework","DB","API"], a: 1 },
      { q: "Not a DB:", o: ["MySQL","MongoDB","PHP","PostgreSQL"], a: 2 },
      { q: "Video tag:", o: ["<movie>","<media>","<video>","<vid>"], a: 2 },
      { q: "Default HTTP port:", o: ["21","25","80","443"], a: 2 }
    ]
  };

  /* ============================
     State
     ============================ */
  let selectedCategory = null;
  let difficulty = document.getElementById("difficulty") ? document.getElementById("difficulty").value : "medium";
  let order = [];           // shuffled indices of current category
  let idx = 0;              // current index into order
  let score = 0;
  let timerId = null;
  const QUESTION_TIME = 30; // per question
  let timeLeft = QUESTION_TIME;
  let qStartTime = null;
  let user = null; // logged in username or null
  let answers = []; // array of { selected: index|null, time: seconds, correct: bool }
  let lifelineState = { fiftyUsed: false, skipUsed: false, hintUsed: false };

  /* ============================
     DOM refs (IDs from your HTML)
     ============================ */
  const modalLogin = document.getElementById("login-modal");
  const btnOpenLogin = document.getElementById("btn-open-login");
  const loginClose = document.getElementById("login-close");
  const tabLogin = document.getElementById("tab-login");
  const tabSignup = document.getElementById("tab-signup");
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  const leaderboardModal = document.getElementById("leaderboard-modal");
  const btnOpenLeaderboard = document.getElementById("btn-open-leaderboard");
  const leaderboardClose = document.getElementById("leaderboard-close");
  const leaderboardList = document.getElementById("leaderboard-list");
  const lbRefresh = document.getElementById("leaderboard-refresh");

  const catCards = Array.from(document.querySelectorAll(".category-card"));
  const btnStart = document.getElementById("btn-start");
  const catSection = document.getElementById("category-section");
  const quizSection = document.getElementById("quiz-section");
  const reviewSection = document.getElementById("review-section");
  const resultSection = document.getElementById("result-section");

  const btnBack = document.getElementById("btn-back");
  const progressBar = document.getElementById("progress-bar");
  const qCount = document.getElementById("q-count");
  const timeTakenEl = document.getElementById("time-taken");
  const timerEl = document.getElementById("timer");
  const qCategoryEl = document.getElementById("q-category");
  const qEl = document.getElementById("question");
  const optionsWrap = document.getElementById("options");

  const btnNext = document.getElementById("btn-next");
  const btnReview = document.getElementById("btn-review");
  const btnSubmit = document.getElementById("btn-submit");

  const reviewList = document.getElementById("review-list");
  const btnCloseReview = document.getElementById("btn-close-review");

  const scoreText = document.getElementById("score-text");
  const percentText = document.getElementById("percent-text");
  const remarkText = document.getElementById("remark-text");
  const badgesWrap = document.getElementById("badges");
  const detailedReport = document.getElementById("detailed-report");

  const btnRestart = document.getElementById("btn-restart");
  const btnHome = document.getElementById("btn-home");
  const btnSaveScore = document.getElementById("btn-save-score");
  const btnDownloadReport = document.getElementById("btn-download-report");

  const lifeline5050 = document.getElementById("lifeline-5050");
  const lifelineSkip = document.getElementById("lifeline-skip");
  const lifelineHint = document.getElementById("lifeline-hint");

  const themeToggle = document.getElementById("theme-toggle");
  const confettiCanvas = document.getElementById("confetti-canvas");
  const ctx = confettiCanvas && confettiCanvas.getContext ? confettiCanvas.getContext("2d") : null;

  /* ============================
     Utilities
     ============================ */
  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  function formatTimeSec(s){
    const mm = Math.floor(s/60).toString().padStart(2,"0");
    const ss = (s%60).toString().padStart(2,"0");
    return `${mm}:${ss}`;
  }

  /* ============================
     Authentication (localStorage)
     ============================ */
  function getUsers(){ return JSON.parse(localStorage.getItem("qa_users")||"{}"); }
  function saveUsers(obj){ localStorage.setItem("qa_users", JSON.stringify(obj)); }

  function setLoggedIn(username){
    user = username;
    const userArea = document.getElementById("user-area");
    userArea.innerHTML = `<div class="kv">Hi, <strong>${username}</strong></div> <button id="logout-btn" class="ghost-btn">Logout</button>`;
    const logoutBtn = document.getElementById("logout-btn");
    logoutBtn.addEventListener("click", ()=>{
      user = null;
      userArea.innerHTML = `<button id="btn-open-login" class="ghost-btn">Login / Signup</button>`;
      // reattach open login
      document.getElementById("btn-open-login").addEventListener("click", openLoginModal);
    });
  }
  // open login setup
  function openLoginModal(){
    modalLogin.classList.remove("hidden");
    // default to login tab
    showLoginTab();
  }
  function closeLoginModal(){ modalLogin.classList.add("hidden"); }

  function showLoginTab(){
    tabLogin.classList.add("active");
    tabSignup.classList.remove("active");
    loginForm.classList.remove("hidden");
    signupForm.classList.add("hidden");
  }
  function showSignupTab(){
    tabSignup.classList.add("active");
    tabLogin.classList.remove("active");
    signupForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
  }

  // forms
  if(tabLogin) tabLogin.addEventListener("click", showLoginTab);
  if(tabSignup) tabSignup.addEventListener("click", showSignupTab);
  if(btnOpenLogin) btnOpenLogin.addEventListener("click", openLoginModal);
  if(loginClose) loginClose.addEventListener("click", closeLoginModal);

  if(loginForm){
    loginForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      const username = (document.getElementById("login-username")||{}).value?.trim();
      const password = (document.getElementById("login-password")||{}).value || "";
      if(!username || !password){ alert("Enter username & password"); return; }
      const users = getUsers();
      if(users[username] && users[username] === password){
        setLoggedIn(username);
        closeLoginModal();
      } else {
        alert("Invalid credentials or user not found.");
      }
    });
  }

  if(signupForm){
    signupForm.addEventListener("submit", (e)=>{
      e.preventDefault();
      const username = (document.getElementById("signup-username")||{}).value?.trim();
      const password = (document.getElementById("signup-password")||{}).value || "";
      if(!username || !password){ alert("Enter username & password"); return; }
      const users = getUsers();
      if(users[username]){ alert("Username already exists."); return; }
      users[username] = password;
      saveUsers(users);
      alert("Account created. Please login.");
      showLoginTab();
    });
  }

  /* ============================
     Leaderboard (localStorage)
     ============================ */
  function getLeaderboard(){ return JSON.parse(localStorage.getItem("qa_leaderboard")||"[]"); }
  function saveLeaderboard(list){ localStorage.setItem("qa_leaderboard", JSON.stringify(list)); }
  function showLeaderboardModal(){
    leaderboardModal.classList.remove("hidden");
    renderLeaderboard();
  }
  function hideLeaderboardModal(){ leaderboardModal.classList.add("hidden"); }
  function renderLeaderboard(){
    const list = getLeaderboard();
    leaderboardList.innerHTML = "";
    if(list.length === 0){
      leaderboardList.innerHTML = "<li>No entries yet</li>"; return;
    }
    list.slice(0,50).forEach(entry=>{
      const li = document.createElement("li");
      li.innerHTML = `<div>${entry.name} <small style="opacity:.8">(${entry.category})</small></div><div>${entry.scorePercent}% • ${entry.score}/${entry.total} • ${new Date(entry.date).toLocaleString()}</div>`;
      leaderboardList.appendChild(li);
    });
  }

  if(btnOpenLeaderboard) btnOpenLeaderboard.addEventListener("click", showLeaderboardModal);
  if(leaderboardClose) leaderboardClose.addEventListener("click", hideLeaderboardModal);
  if(lbRefresh) lbRefresh.addEventListener("click", renderLeaderboard);

  /* ============================
     Category selection UI
     ============================ */
  catCards.forEach(card=>{
    card.addEventListener("click", ()=>{
      // toggle selection
      catCards.forEach(c=>c.classList.remove("selected"));
      card.classList.add("selected");
      selectedCategory = card.dataset.category;
      // enable start button
      btnStart.disabled = false;
    });
  });

  if(btnStart) btnStart.addEventListener("click", startQuizFlow);

  function startQuizFlow(){
    if(!selectedCategory) { alert("Choose a category"); return; }
    difficulty = document.getElementById("difficulty") ? document.getElementById("difficulty").value : "medium";
    // prepare ordering and state
    const total = BANK[selectedCategory].length;
    order = shuffle([...Array(total).keys()]);
    idx = 0; score = 0; answers = [];
    lifelineState = { fiftyUsed:false, skipUsed:false, hintUsed:false };
    // show quiz UI
    catSection.classList.add("hidden");
    quizSection.classList.remove("hidden");
    // initialize timer/time taken
    renderQuestion();
    startTimer();
  }

  function renderQuestion(){
    stopTimer();
    const total = BANK[selectedCategory].length;
    const qIndex = order[idx];
    const data = BANK[selectedCategory][qIndex];

    qCount.textContent = `Question ${idx+1} of ${total}`;
    timeTakenEl.textContent = `00:00`;
    qCategoryEl.textContent = `Category: ${selectedCategory.toUpperCase()} • Difficulty: ${document.getElementById("difficulty").value}`;
    qEl.textContent = data.q;

    // build options array with original index
    const opts = data.o.map((txt,i)=>({txt, orig:i}));
    const shuffled = shuffle(opts);
    optionsWrap.innerHTML = "";
    shuffled.forEach(o=>{
      const btn = document.createElement("button");
      btn.className = "option";
      btn.type = "button";
      btn.textContent = o.txt;
      btn.dataset.orig = o.orig; // original index in data.o
      btn.addEventListener("click", ()=> selectOption(btn, parseInt(btn.dataset.orig,10)));
      optionsWrap.appendChild(btn);
    });

    // reset UI pieces
    progressBar.style.width = `${Math.round(((idx)/total)*100)}%`;
    btnNext.disabled = true;
    // reset per-question timing
    qStartTime = Date.now();
    timeLeft = QUESTION_TIME;
    timerEl.textContent = String(timeLeft);
    // lifeline buttons reflect used state
    if(lifeline5050) lifeline5050.classList.toggle("disabled", lifelineState.fiftyUsed);
    if(lifelineSkip) lifelineSkip.classList.toggle("disabled", lifelineState.skipUsed);
    if(lifelineHint) lifelineHint.classList.toggle("disabled", lifelineState.hintUsed);
    // start countdown
    startTimer();
  }

  /* ============================
     Option selection, reveal, and next
     ============================ */
  let answeredThis = false;
  function selectOption(button, origIndex){
    if(answeredThis) return;
    answeredThis = true;
    stopTimer();
    // disable all
    Array.from(optionsWrap.children).forEach(b=>{
      b.classList.add("disabled");
      b.disabled = true;
    });
    // determine correctness
    const qIndex = order[idx];
    const data = BANK[selectedCategory][qIndex];
    const chosen = origIndex;
    const correct = data.a;
    const timeSpent = Math.round((Date.now() - qStartTime)/1000);
    const isCorrect = chosen === correct;
    // store answer
    answers[idx] = { selected: chosen, time: timeSpent, correct: isCorrect, qIndex };
    if(isCorrect){
      // add class to clicked button
      button.classList.add("correct");
      score++;
    } else {
      button.classList.add("wrong");
      // reveal correct button (find by dataset.orig)
      Array.from(optionsWrap.children).forEach(b=>{
        if(parseInt(b.dataset.orig,10) === correct) b.classList.add("correct");
      });
    }
    // enable next button (or enable Submit if last)
    btnNext.disabled = false;
    // update progress bar showing current
    const total = BANK[selectedCategory].length;
    progressBar.style.width = `${Math.round(((idx+1)/total)*100)}%`;
    // update time-taken display
    timeTakenEl.textContent = formatTimeSec(timeSpent);
  }

  if(btnNext) btnNext.addEventListener("click", ()=>{
    // move to next question
    answeredThis = false;
    idx++;
    const total = BANK[selectedCategory].length;
    if(idx < total){
      renderQuestion();
    } else {
      finishQuiz();
    }
  });

  if(btnSubmit) btnSubmit.addEventListener("click", finishQuiz);

  /* ============================
     Timer & auto-reveal
     ============================ */
  function startTimer(){
    stopTimer();
    timeLeft = QUESTION_TIME;
    timerEl.textContent = String(timeLeft);
    timerId = setInterval(()=>{
      timeLeft--;
      timerEl.textContent = String(timeLeft);
      if(timeLeft <= 0){
        // timeout: auto reveal and mark as skipped
        stopTimer();
        handleTimeout();
      }
    }, 1000);
  }
  function stopTimer(){
    if(timerId){ clearInterval(timerId); timerId = null; }
  }

  function handleTimeout(){
    // disable all options
    Array.from(optionsWrap.children).forEach(b=>{
      b.classList.add("disabled");
      b.disabled = true;
    });
    // show correct
    const qIndex = order[idx];
    const data = BANK[selectedCategory][qIndex];
    Array.from(optionsWrap.children).forEach(b=>{
      if(parseInt(b.dataset.orig,10) === data.a) b.classList.add("correct");
    });
    const timeSpent = QUESTION_TIME;
    answers[idx] = { selected: null, time: timeSpent, correct: false, qIndex };
    btnNext.disabled = false;
    answeredThis = true;
    timeTakenEl.textContent = formatTimeSec(timeSpent);
    // update progress bar
    const total = BANK[selectedCategory].length;
    progressBar.style.width = `${Math.round(((idx+1)/total)*100)}%`;
  }

  /* ============================
     Lifelines (50-50, skip, hint)
     ============================ */
  if(lifeline5050) lifeline5050.addEventListener("click", ()=>{
    if(lifelineState.fiftyUsed) { alert("50-50 already used"); return; }
    // hide two wrong options
    const qIndex = order[idx];
    const data = BANK[selectedCategory][qIndex];
    const correct = data.a;
    const wrongBtns = Array.from(optionsWrap.children).filter(b => parseInt(b.dataset.orig,10) !== correct);
    const toHide = shuffle(wrongBtns).slice(0,2);
    toHide.forEach(b=>{ b.style.visibility = "hidden"; });
    lifelineState.fiftyUsed = true;
    lifeline5050.classList.add("disabled");
  });

  if(lifelineSkip) lifelineSkip.addEventListener("click", ()=>{
    if(lifelineState.skipUsed) { alert("Skip already used"); return; }
    // mark skipped and go next
    stopTimer();
    const timeSpent = Math.round((Date.now() - qStartTime)/1000);
    answers[idx] = { selected: null, time: timeSpent, correct: false, qIndex: order[idx] };
    lifelineState.skipUsed = true;
    lifelineSkip.classList.add("disabled");
    // enable next (and trigger)
    answeredThis = true;
    btnNext.disabled = false;
    // emulate pressing next
    setTimeout(()=> btnNext.click(), 200);
  });

  if(lifelineHint) lifelineHint.addEventListener("click", ()=>{
    if(lifelineState.hintUsed) { alert("Hint already used"); return; }
    const qIndex = order[idx];
    const data = BANK[selectedCategory][qIndex];
    const hintText = data.hint || `Hint: correct answer starts with "${data.o[data.a][0]}" and length ${data.o[data.a].length}`;
    alert(hintText);
    lifelineState.hintUsed = true;
    lifelineHint.classList.add("disabled");
  });

  /* ============================
     Review Answers
     ============================ */
  if(btnReview) btnReview.addEventListener("click", openReview);
  if(btnCloseReview) btnCloseReview.addEventListener("click", ()=>{
    reviewSection.classList.add("hidden");
    quizSection.classList.remove("hidden");
  });

  function openReview(){
    reviewList.innerHTML = "";
    const total = BANK[selectedCategory].length;
    for(let i=0;i<total;i++){
      const record = answers[i] || { selected: null, time: 0, correct:false, qIndex: order[i] };
      const data = BANK[selectedCategory][record.qIndex];
      const div = document.createElement("div");
      div.className = "review-item";
      div.innerHTML = `<div class="q">${i+1}. ${data.q}</div>
        <div class="meta">Your answer: <strong>${record.selected === null ? "Skipped" : data.o[record.selected]}</strong> • Correct: <strong>${data.o[data.a]}</strong> • Time: ${formatTimeSec(record.time)}</div>`;
      reviewList.appendChild(div);
    }
    quizSection.classList.add("hidden");
    reviewSection.classList.remove("hidden");
  }

  /* ============================
     Finish quiz / Results
     ============================ */
  function finishQuiz(){
    stopTimer();
    quizSection.classList.add("hidden");
    reviewSection.classList.add("hidden");
    resultSection.classList.remove("hidden");

    // compute results
    const total = BANK[selectedCategory].length;
    const correctCount = answers.reduce((acc, r)=> acc + (r && r.correct ? 1 : 0), 0);
    const percent = Math.round((correctCount/total)*100);

    scoreText.textContent = `Score: ${correctCount} / ${total}`;
    percentText.textContent = `${percent}%`;
    remarkText.textContent = percent >= 90 ? "Outstanding! 🎯" : percent >= 70 ? "Great job! 🎉" : percent >= 50 ? "Good effort! 👍" : "Keep practicing! 💪";

    // badges
    badgesWrap.innerHTML = "";
    if(percent >= 80) badgesWrap.appendChild(createBadge(`${selectedCategory.toUpperCase()} PRO`));
    if(percent === 100) badgesWrap.appendChild(createBadge(`PERFECT`));
    // detailed report
    renderDetailedReport();
    // confetti
    if(percent >= 70) runConfetti();
  }

  function createBadge(text){
    const b = document.createElement("div");
    b.className = "badge";
    b.textContent = text;
    return b;
  }

  function renderDetailedReport(){
    // time per question total, avg, correctness
    detailedReport.innerHTML = "";
    const total = BANK[selectedCategory].length;
    let totalTime = answers.reduce((s,a)=> s + (a? a.time:0), 0);
    const avgTime = total ? Math.round(totalTime/total) : 0;
    const correctCount = answers.reduce((acc,a)=> acc + (a && a.correct ? 1:0), 0);
    const row1 = document.createElement("div");
    row1.className = "report-row";
    row1.innerHTML = `<div>Total time</div><div>${formatTimeSec(totalTime)}</div>`;
    const row2 = document.createElement("div");
    row2.className = "report-row";
    row2.innerHTML = `<div>Average time / Q</div><div>${formatTimeSec(avgTime)}</div>`;
    const row3 = document.createElement("div");
    row3.className = "report-row";
    row3.innerHTML = `<div>Correct</div><div>${correctCount} / ${total}</div>`;
    detailedReport.appendChild(row1);
    detailedReport.appendChild(row2);
    detailedReport.appendChild(row3);
  }

  /* ============================
     Save to leaderboard; download report
     ============================ */
  if(btnSaveScore) btnSaveScore.addEventListener("click", ()=>{
    if(!user){
      const goLogin = confirm("You need to be logged in to save score. Open login?");
      if(goLogin) openLoginModal();
      return;
    }
    const total = BANK[selectedCategory].length;
    const correctCount = answers.reduce((acc,a)=> acc + (a && a.correct ? 1:0),0);
    const percent = Math.round((correctCount/total)*100);
    const list = getLeaderboard();
    list.push({ name: user, score: correctCount, total, scorePercent: percent, category:selectedCategory, date: new Date().toISOString() });
    // sort desc
    list.sort((a,b)=> b.scorePercent - a.scorePercent || b.score - a.score);
    saveLeaderboard(list);
    alert("Saved to leaderboard");
  });

  if(btnDownloadReport) btnDownloadReport.addEventListener("click", ()=>{
    const total = BANK[selectedCategory].length;
    const correctCount = answers.reduce((acc,a)=> acc + (a && a.correct ? 1:0),0);
    const percent = Math.round((correctCount/total)*100);
    const payload = {
      user: user || "Guest",
      category: selectedCategory,
      total, correctCount, percent,
      answers, date: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quiz-report-${selectedCategory}-${new Date().toISOString().slice(0,19).replace(/[:T]/g,"-")}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  /* ============================
     Back / restart / home buttons
     ============================ */
  if(btnBack) btnBack.addEventListener("click", ()=>{
    stopTimer();
    quizSection.classList.add("hidden");
    catSection.classList.remove("hidden");
    // reset UI
    catCards.forEach(c=>c.classList.remove("selected"));
    selectedCategory = null;
    btnStart.disabled = true;
  });
  if(btnRestart) btnRestart.addEventListener("click", ()=>{
    // restart same category
    resultSection.classList.add("hidden");
    startQuizFlow();
  });
  if(btnHome) btnHome.addEventListener("click", ()=>{
    // go home categories
    resultSection.classList.add("hidden");
    catSection.classList.remove("hidden");
    selectedCategory = null;
    catCards.forEach(c=>c.classList.remove("selected"));
    btnStart.disabled = true;
  });

  /* ============================
     Confetti (simple canvas)
     ============================ */
  let confettiPieces = [], confettiRunning = false;
  function runConfetti(){
    if(!ctx) return;
    resizeCanvas();
    confettiCanvas.style.display = "block";
    confettiPieces = makeConfetti(140);
    confettiRunning = true;
    requestAnimationFrame(confettiTick);
    setTimeout(()=>{ confettiRunning = false; confettiCanvas.style.display = "none"; ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height); }, 4200);
  }
  function resizeCanvas(){ confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight; }
  function makeConfetti(n){
    const colors = ["#ff6a00","#ee0979","#00c2ff","#4caf50","#ffd200","#9c27b0"];
    const arr = [];
    for(let i=0;i<n;i++){
      arr.push({ x: Math.random()*confettiCanvas.width, y: Math.random()*-confettiCanvas.height, w: 6+Math.random()*10, h: 8+Math.random()*16, c: colors[Math.floor(Math.random()*colors.length)], s:2+Math.random()*5, r: Math.random()*360 });
    }
    return arr;
  }
  function confettiTick(){
    if(!confettiRunning) return;
    ctx.clearRect(0,0,confettiCanvas.width,confettiCanvas.height);
    confettiPieces.forEach(p=>{
      p.y += p.s;
      p.x += Math.sin(p.y * 0.01) * 1.5;
      p.r += p.s * 0.5;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r * Math.PI / 180);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();
      if(p.y > confettiCanvas.height + 20){ p.y = -20 - Math.random()*200; p.x = Math.random()*confettiCanvas.width; }
    });
    requestAnimationFrame(confettiTick);
  }
  window.addEventListener("resize", ()=>{ if(confettiRunning) resizeCanvas(); });

  /* ============================
     Utility: leaderboard helpers
     ============================ */
  function getLeaderboard(){ return JSON.parse(localStorage.getItem("qa_leaderboard") || "[]"); }
  function saveLeaderboard(list){ localStorage.setItem("qa_leaderboard", JSON.stringify(list)); }

  /* ============================
     Theme toggle
     ============================ */
  if(themeToggle) themeToggle.addEventListener("click", ()=>{
    document.body.classList.toggle("dark");
    themeToggle.textContent = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });

  /* ============================
     Final: initial wiring and safety
     ============================ */
  // show existing logged in user if any
  const savedUsers = getUsers();
  // no auto-login: user must login manually
  // open leaderboard if clicking outside
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape"){ modalLogin.classList.add("hidden"); leaderboardModal.classList.add("hidden"); } });

  // make sure necessary elements exist
  if(!catSection || !quizSection || !resultSection) console.warn("Some main sections are missing in HTML — ensure IDs match.");

});

