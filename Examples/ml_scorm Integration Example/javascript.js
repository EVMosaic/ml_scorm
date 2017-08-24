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
let grade2 = document.getElementById('grade2');
let resetButton1 = document.getElementById('reset1');
let resetButton2 = document.getElementById('reset2');

// This is a manual end button. It allows debugging of the quit function
// during development. You may or may not need a manual trigger to complete
// the lesson. This can be done entirely on the window close event
let endButton = document.getElementById('end_button');
endButton.addEventListener('click', quit);


// Create a TrackedObjectives object to allow you to (I shit you not) track objectives
let objectives = new ml_scorm.TrackedObjectives()


// Adding this to track completion and progress. Feels kinda hacky, but this is just a test
let completed = {'Quiz 1' : false, 'Quiz 2' : false};


// Custom initialization function. Most importantly calls ml_scorm.initSCO()
// This must be done on the topmost frame that we write and must only be called once
function init() {
  // Call this to connect with the LMS. Must be called before any SCORM actions can occur
  ml_scorm.initSCO();

  // In this example there is a core objective and a bonus objective that are being tracked.
  // The important take away is using the addObjective(objectiveName, [group]) method
  // to create new objectives. This method adds the objectives to an internally
  // tracked object, and also returns it to you if you wish to maintain access to it.
  // Although with the recent change to an internal object from an array this may
  // be a feature slated for depreciation.
  objectives.addObjective('Quiz 1');
  objectives.addObjective('Quiz 2');
  objectives.addObjective('Bonus 1','bonus');
  objectives.addObjective('Bonus 2', 'bonus');

  // Min scores default to 0, adding maxScore allows for scaled scores to be recorded
  // Use maxScore to record the total number of points per objective.
  objectives.objectives['Quiz 1'].maxScore = 50;
  objectives.objectives['Quiz 2'].maxScore = 50;
  objectives.objectives['Bonus 1'].maxScore = 5;
  objectives.objectives['Bonus 2'].maxScore = 5;

  // Set max score for entire SCO.
  // NOTE This syntax may change. Don't get married to it, but use it for now.
  ml_scorm.setMaxSCOScore(100);
}


// Custom function for wrapping up a SCO after completion or at an intermediate point
// in the learning. Put all cleanup code for SCORM in here. The only method that must be called is ml_scorm.closeSCO()
//NOTE: This is automatically triggered on the window close event, but it may make more sense depending on the slide to manually trigger it through a button click or some other UI element. If a manual trigger is added still leave the window close triggers on as a failsafe. The ml_scorm.closeSCO() MUST be called to terminate the connection to the LMS. It can be called multiple times, but only the first one will register, subsequent calls will disperse into the ether. Failing to call ml_scorm.closeSCO() will lose all data from the session.

function quit() {
  // Used to calculate total score of all objectives, in this case 'Quiz 1' and 'Quiz 2'
  // This method will only calculate scores for the default group. You can optionally
  // pass in the group name as a parameter to calculate total scores for other groups.
  let totalScore = objectives.calculateTotalScore();
  // totalScore = coreObjectives.calculateTotalScore();

  // This can be combined with the previous line, but after calculating the
  // total score you must log it to the LMS using the following line.
  ml_scorm.scoreSCO(totalScore);

  // After checking the progress of the lesson ml_scorm.completeSCO() marks the SCO
  // as Completed in the LMS. Using whatever logic is required to determine the
  // completion status you can also update the Status to an alternate value using
  // ml_scorm.updateStatus and use any of the legal ml_scorm.STATUS values
  let progress = checkProgress();
  if (progress === 2) {
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
  // Its important to note here that each objective only gets one score
  // so it is neccesary to internally track a total score across any quizes
  // or activities that occur through the objective.
  // In this example there are 4 questions, each with different point values,
  // but all together they only end up reporting a singular score for the Objective
  // (which here is a quiz but could be a collection of activities or some other structure).
  let score = 0;

  // Grabbing the parent quiz div
  let quiz = this.parentElement.parentElement;

  // Kind of hacky way of doing this, but this allows me to access the current
  // quiz based on its title name and bonus by its id. Please don't use this in production.
  // Lets come up with a better way to differentiate and access objectives at runtime.
  let quizId = quiz.getElementsByTagName('h1')[0].textContent;
  let bonusId = quiz.getElementsByClassName('bonus')[0].parentElement.id

  // Grabs the correct objectives based on above title from our master list.
  let objective = objectives.objectives[quizId];
  let bonusObjective = objectives.objectives[bonusId];

  // This is some kinda hacky shit. I mark the objectives complete at the begining.
  // If an unanswered question is encountered it is then marked incomplete.
  // This seems backwards but its quick for testing and it works.
  // You can mark individual objectives complete with objective.complete()
  objective.complete();
  completed[quizId] = true;

  // If you haven't seen this before it is a neat little ES6 trick called
  // the spread operator. I'm using to expand elements into an array.
  // Because DOM getElementsBy... methods return an HTMLCollection you
  // can't perform array opperations on them, but expanding them with the
  // [...ITERABLE] syntax effectively "spreads" the values into a new array.
  let questions = [...quiz.getElementsByClassName('question')];

  // More ES6 using => arrow functions. Go look them up. Seriously. They're amazing.
  // This just iterates over all the questions and extracts their data for scoring.
  questions.forEach(q => {
    // DOM shit. No SCORM.
    let input = q.getElementsByTagName('input')[0];
    let answer = input.value.toUpperCase();
    let expected = input.placeholder.toUpperCase();
    let pointContainer = q.getElementsByClassName('points')[0];
    let points = parseInt(pointContainer.textContent.trim().split(' ')[0]);
    if (answer === expected) {
      // CSS shit. No SCORM.
      q.classList.add('correct');
      q.classList.remove('incorrect');

      // Incrementing total score based on individual question points.
      score += points;
    } else {
      if (answer === '') {
        // If no answer on a question mark objective incomplete.
        // Kind of hacky positioning but it works. Might be worth it to make
        // an incomplete() method.
        objective.core.status = ml_scorm.STATUS.INCOMPLETE;
        completed[quizId] = false;
      } else {
        // CSS shit
        q.classList.add('incorrect');
        q.classList.remove('correct');
      }
    }
  });

  // Set the bookmark. Will need to parse on reload. Second half is for LMS team
  // TODO Make loading code from ml_scorm.getBookmark() will probably involve suspendData
  let progress = checkProgress();
  ml_scorm.setBookmark(`${progress}/2|${Math.floor(progress/2 * 100)}%`);


  // Grabbing number of stars clicked ie number of bonus objectives achieved
  // This just uses CSS classes to track, use something less hackable in production
  let bonus = 5 - quiz.getElementsByClassName('locked').length;

  // DOM shit
  let coreScore = quiz.getElementsByClassName('core_report')[0];
  let bonusScore = quiz.getElementsByClassName('bonus_report')[0];
  coreScore.textContent = score + '/50';
  bonusScore.textContent = bonus + '/5';


  // Update the scores of the main and bonus objectives.
  // NOTE: These are property accessors and the Objective object will handle all LMS info behind the scenes as long as you call score in this manner.
  objective.score = score;
  bonusObjective.score = bonus;
}


  // Quick hacky way to check the progress in the lesson.
  function checkProgress() {
    let progress = 0;
    if (completed['Quiz 1'])
      progress++;
    if (completed['Quiz 2'])
      progress++
    return progress;
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

// CSS toggle function. Nothing SCORM related in here.
function toggleStar() {
  this.classList.toggle('locked');
}

// More ES6 spread operations. They're great. I promise.
let stars = [...document.getElementsByClassName('star')];

// Attach all events to appropriate elements. Nothing SCORM related in here.
stars.forEach(star => star.addEventListener('click', toggleStar));
grade1.addEventListener('click', gradeQuiz);
grade2.addEventListener('click', gradeQuiz);
resetButton1.addEventListener('click', reset);
resetButton2.addEventListener('click', reset);


