// Add these three listeners to the topmost frame that we write
// write init and quit functions for all custom loading and unloading actions
window.addEventListener('load', init)
window.addEventListener('unload', quit);
window.addEventListener('beforeunload', quit);

// Adding these two in so you can debug the quit function during development
// put ml_scorm.closeSCO() in the quit method to simplify this in production
window.addEventListener('unload', ml_scorm.closeSCO);
window.addEventListener('beforeunload', ml_scorm.closeSCO);

// These just set up buttons for the example
let grade1 = document.getElementById('grade1');

// This is a manual end button. It allows debugging of the quit function
// during development. You may or may not need a manual trigger to complete
// the lesson. This can be done entirely on the window close event
let nextButton = document.getElementById('next_button');
let prevButton = document.getElementById('prev_button');

nextButton.addEventListener('click', next);
prevButton.addEventListener('click', prev);

function next() {
  console.log('next slide');
  if (current_question < data.length - 1) {
    buildQuestion(++current_question);
  }
  ml_scorm.setBookmark(current_question);
}

function prev() {
  console.log('previous slide');
  if (current_question > 0) {
   buildQuestion(--current_question);
 }
 ml_scorm.setBookmark(current_question);
}


let current_question;


function init() {

  ml_scorm.initSCO();
  retrieveData();
  bookmark = ml_scorm.getBookmark();

  current_question = bookmark ? bookmark : 0;


  buildQuestion(current_question);

  objectives = new ml_scorm.TrackedObjectives();
  objectives.addObjective('Quiz 1');

  objectives.getObjective('Quiz 1').maxScore = 50;

  ml_scorm.setMaxSCOScore(100);
  ml_scorm.setMinSCOScore(0);
}


// Custom function for wrapping up a SCO after completion or at an intermediate point
// in the learning. Put all cleanup code for SCORM in here. The only method that must be called is ml_scorm.closeSCO()
//NOTE: This is automatically triggered on the window close event, but it may make more sense depending on the slide to manually trigger it through a button click or some other UI element. If a manual trigger is added still leave the window close triggers on as a failsafe. The ml_scorm.closeSCO() MUST be called to terminate the connection to the LMS. It can be called multiple times, but only the first one will register, subsequent calls will disperse into the ether. Failing to call ml_scorm.closeSCO() will lose all data from the session.

function quit() {


  // After checking the progress of the lesson ml_scorm.completeSCO() marks the SCO
  // as Completed in the LMS. Using whatever logic is required to determine the
  // completion status you can also update the Status to an alternate value using
  // ml_scorm.updateStatus and use any of the legal ml_scorm.STATUS values
  if (checkProgress()) {
    ml_scorm.completeSCO();
  } else {
    ml_scorm.updateStatus(ml_scorm.STATUS.INCOMPLETE);
  }

  // This is called to finalize all data and close the connection with the LMS
  // It must be called for any data to be saved and reported to the LMS.
  // It is disabled here and has been moved to the window close event for debugging
  // purposes, but can be combined in your quit function for simplicities sake
  //
  // ml_scorm.closeSCO();
  //
}


// Custom grading function. Most of this is interfacing with the DOM, but
// the important bits are at the end. This may not always be a separate function.
// It could simply be integrating with existing code.
function gradeQuiz() {
  console.log('grading quiz');
  let quiz = document.getElementById('quiz1');
  let correct_answer = data[current_question].correct;
  let selected = document.getElementsByClassName('selected')[0];
  let selected_answer = selected.getElementsByClassName('answer-text')[0].textContent.trim();

  if (correct_answer === selected_answer) {
    console.log('answer correct');
    selected.classList.remove('selected');
    selected.classList.add('correct');
  } else {
    console.log('answer incorrect');
    selected.classList.remove('selected');
    selected.classList.add('incorrect');
  }

  answers.forEach(answer => {
    answer.removeEventListener('click', selectAnswer);
  });

  showFeedback(correct_answer, selected_answer);

  data[current_question].response = selected_answer;

  saveData();
}

function showFeedback(correct_answer, selected_answer) {
  document.getElementById('correct_answer').textContent = correct_answer;
  document.getElementById('student_answer').textContent = selected_answer;
  document.getElementById('feedback').style.display = 'block';
  document.getElementById('grade1').style.display = 'none';
}

function showSubmit() {
  document.getElementById('correct_answer').textContent = '';
  document.getElementById('student_answer').textContent = '';
  document.getElementById('feedback').style.display = 'none';
  document.getElementById('grade1').style.display = 'block';
}

function showQuestions() {
  answers.forEach(answer => answer.style.display = 'flex');
}

function hideQuestions() {
  answers.forEach(answer => answer.style.display = 'none');
}

// Quick hacky way to check the progress in the lesson.
function checkProgress() {
  return data[data.length - 1].response.length > 0;
}


// Function to reset all values and CSS to initial state. Nothing SCORM related in here.
function reset() {
  let quiz = this.parentElement.parentElement;
  let coreScore = quiz.getElementsByClassName('core_report')[0];
  let bonusScore = quiz.getElementsByClassName('bonus_report')[0];
  let questions = [...quiz.getElementsByClassName('question')];
  let stars = [...quiz.getElementsByClassName('star')];
  questions.forEach(q => {
    let input = q.getElementsByTagName('input')[0];
    input.value = '';
    q.className = 'question';
  })
  stars.forEach(star => {
    star.classList.add('locked');
  })

  coreScore.textContent = '0/50';
  bonusScore.textContent = '0/5';
}


answers = [...document.getElementsByClassName('answer')];

function selectAnswer() {
  answers.forEach(answer => answer.classList.remove('selected') );

  this.classList.add('selected');
}

function buildQuestion(index) {
  let q = data[index];

  if (q.response) {
    showFeedback(q.correct, q.response);
    hideQuestions();
  } else {
    updateElement('question-text', q.text);
    updateElement('answer-a', q.answers[0]);
    updateElement('answer-b', q.answers[1]);
    updateElement('answer-c', q.answers[2]);
    updateElement('answer-d', q.answers[3]);

    showSubmit();
    showQuestions();
  }
  answers.forEach(answer => answer.classList.remove('correct', 'incorrect') );
  answers.forEach(answer => {
    answer.addEventListener('click', selectAnswer);
  });
}

function updateElement(id, text) {
  document.getElementById(id).textContent = text;
}

function saveData() {
  saveArray = [];
  data.forEach(d => {
    saveArray.push(d.response);
  })
  saveString = saveArray.join('|');
  ml_scorm.data = saveString;
}

function retrieveData() {
 dataArray = ml_scorm.data;
  if (dataArray) {
    dataArray = ml_scorm.data.split('|');

    for (i=0; i<dataArray.length; i++) {
      data[i].response = dataArray[i];
    }
  }

}

answers.forEach(answer => {
  answer.addEventListener('click', selectAnswer);
});

// Attach all events to appropriate elements. Nothing SCORM related in here.
grade1.addEventListener('click', gradeQuiz);


