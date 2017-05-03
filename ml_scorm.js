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

// Retrieves bookmark location from course
function getBookmark() {
  return getValue('cmi.core.lesson_location');
}

// Sets bookmark of location in course
function setBookmark(location) {
  setValue('cmi.core.lesson_location', location);
}


// Objective Object for keeping track of objectives within a SCORM
// currently contains id status and score (as a seperate object detailed below)
// When using the Objective objects index is frozen at creation and cannot be
// changed. values auto save to the LMS when they are updated.
class Objective {
  constructor(index, id="[New Objective]") {
    Object.defineProperty(this, 'index', {
      writable: false,
      configurable: false,
      value: index
    });
    this._id = id;
    this._status = STATUS.NOT_ATTEMPTED;
    this._score = new Score();
  }

  complete() {
    this._status = STATUS.COMPLETED
    setValue(`cmi.objectives.${this.index}.status`, this._status);
  }

  set status(newStatus) {
    this._status = newStatus;
    setValue(`cmi.objectives.${this.index}.status`, newStatus);
  }

  get status() {
    this._status = getValue(`cmi.objectives.${this.index}.status`);
    return this._status;
  }

  set score(rawScore) {
    this._score.raw = rawScore;
    setValue(`cmi.objectives.${this.index}.score.raw`, rawScore);
  }

  // This is a read only property on the LMS so no retrival is done before
  // returning the value. this is provided to keep track of score outside
  // of the LMS

  get score() {
    return this._score.raw;
  }

  set id(newId) {
    this._id = newId;
    setValue(`cmi.objectives.${this.index}.id`, newId);
  }

  get id() {
    this._id = getValue(`cmi.objectives.${this.index}.id`);
    return this._id;
  }
  // Changes will be updated to the LMS as they are made to the
  // object this method is probably redundant, but provides a way
  // to ensure that all values are saved on the object.
  save() {
    scorm.set(`cmi.objectives.${this.index}.id`, newStatus);
    scorm.set(`cmi.objectives.${this.index}.score`, newStatus);
    scorm.set(`cmi.objectives.${this.index}.status`, newStatus);
    scorm.save();
  }
}
// This is a helper object for the Objective class, but will probably be
// needed in other places as well. No functionality at the moment.
class Score {
  constructor (raw=0, min=0, max=100) {
    this.raw = raw;
    this.min = min;
    this.max =  max;
  }
}



// Adds new objective to the end of the current objective array
function addObjective(id='') {
  let nextIndex = scorm.get("cmi.objectives._count");
  setValue(`cmi.objectives.${nextIndex}.id`, id);
}