// Mosaic Learning SCORM implementation for use when developing LMS content
// Needs to be used with the pipwerks SCORM wrapper SCORM_API_wrapper.js
// Can be downloaded from https://pipwerks.com/laboratory/scorm/
// This version has only been tested with SCORM 1.2

// Shortcut access to pipwerks SCORM functionality
let scorm = pipwerks.SCORM;

// Used to determine if communicatoin is happening with the LMS
// Not sure if this is neccesarry, pipwerks may handle this internally
let lmsConnected = false;

// Global constant object for legal status types;
const STATUS = {
  PASSED : "passed",
  FAILED : "failed",
  COMPLETED : "completed",
  INCOMPLETE : "incomplete",
  BROWSED : "browsed",
  NOT_ATTEMPTED : "not attempted"
}

// Global constant object for legal exit conditions;
const EXIT = {
  TIMEOUT : "time-out",
  SUSPENED : "suspend",
  LOGOUT : "logout",
  NORMAL : ""
}

// Global constant object for legal interaction types;
const INTERACTION = {
  TF : "true-false}",
  CHOICE : "choice",
  FILL : "fill-in",
  MATCH : "matching",
  PERFORMANCE : "performance",
  LIKERT : "likert",
  SEQUENCE : "sequencing",
  NUMERIC : "numeric"
}

// Flag to turn debug messages on/off
// Turn off for production
// Use normal console statements for logging in production
const DEBUG_ENABLED = true;

const DEBUG = {
  LOG : function(msg) {
    if (DEBUG_ENABLED) {
      console.log(msg);
    }
  },

  ERROR : function(msg) {
    if (DEBUG_ENABLED) {
      console.error(msg);
    }
  },

  WARN : function(msg) {
    if (DEBUG_ENABLED) {
      console.warn(msg);
    }
  },

  INFO : function(msg) {
    if (DEBUG_ENABLED) {
      console.info(msg);
    }
  }
}

// Called once a SCO has been loaded to get connection to LMS
// Handles LMSInitalize
function initSCO() {
  lmsConnected = scorm.init();
}

// Called once a SCO is unloaded. Neccesary to finalize interaction
// Handles LMSFinish
function closeSCO() {
  scorm.quit();
  lmsConnected = false;
}

// Called when a SCO has been completed to mark in LMS as completed
function completeSCO() {
  setValue('cmi.core.lesson_status', STATUS.COMPLETED);
}

// Convienience wrapper for setting SCORM variables. Auto saves on call.
function setValue(param, value) {
  if (lmsConnected) {
    DEBUG.LOG(`setting ${param} to ${value}`);
    scorm.set(param, value);
    scorm.save();
  } else {
    DEBUG.WARN('LMS NOT CONNECTED');
  }
}

// Convenience wrapper for getting SCROM variables.
function getValue(param) {
  DEBUG.INFO(`retrieving value for ${param}`);
  if (lmsConnected) {
    let value = scorm.get(param);
    DEBUG.LOG(`found value of ${value}`);
    return value;
  } else {
    DEBUG.WARN('LMS NOT CONNECTED');
  }
}

// Takes in an array of objectives and adds them to the LMS
// Need to standardize a way of holding these objectives
// and naming them.
// Currently takes in array of IDs and uses them to auto
// generate indexs in order of the array
function initializeObjectives(objectives) {
  DEBUG.LOG("Welcome to initializeObjectives()");
  let totalObjectives = getValue('cmi.objectives._count');
  DEBUG.LOG(`totalObjectives:${totalObjectives} objectives.length:${objectives.length}`);
  if (objectives.length <= totalObjectives) {
    DEBUG.LOG('objectives detected. aborting initialization process');
    return;
  }
  DEBUG.LOG('no objectives found starting initialization');
  objectives.forEach(obj => {
    addObjective(obj);
  })
}

// Adds new objective to the end of the current objective array
function addObjective(id='') {
  let nextIndex = scorm.get("cmi.objectives._count");
  setValue(`cmi.objectives.${nextIndex}.id`, id);
}

// Updates an objective at index with new status and score
function updateObjective(index, status, score) {
  if (status) {
    setObjectiveStatus(index, status);
  }
  if (score) {
    scoreObjective(index, score);
  }
}

// Sets objective at index to complete
function completeObjective(index) {
  setValue(`cmi.objectives.${index}.status`, "completed");
}

// Records score for an objective
function scoreObjective(index, score) {
  setValue('cmi.objectives.${index}.score.raw', score);
}

// Set objective at index to status
function setObjectiveStatus(index, status) {
  setValue(`cmi.objectives.${index}.status`, status);
}

// Gets objective status at index
function getObjectiveStatus(index) {
  return getValue(`cmi.objectives.${index}.status`);
}

// Sets bookmark of location in course
function setBookmark(location) {
  setValue('cmi.core.lesson_location', location);
}

// Retrieves bookmark location from course
function getBookmark() {
  return getValue('cmi.core.lesson_location');
}

