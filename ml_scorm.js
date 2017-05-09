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
  PASSED: "passed",
  FAILED: "failed",
  COMPLETED: "completed",
  INCOMPLETE: "incomplete",
  BROWSED: "browsed",
  NOT_ATTEMPTED: "not attempted"
}

// Global constant object for legal exit conditions;
const EXIT = {
  TIMEOUT: "time-out",
  SUSPENED: "suspend",
  LOGOUT: "logout",
  NORMAL: ""
}

// Global constant object for legal interaction types;
const INTERACTION = {
  TF: "true-false}",
  CHOICE: "choice",
  FILL: "fill-in",
  MATCH: "matching",
  PERFORMANCE: "performance",
  LIKERT: "likert",
  SEQUENCE: "sequencing",
  NUMERIC: "numeric"
}

// Flag to turn debug messages on/off
// Turn off for production
// Use normal console statements for logging in production
const DEBUG_ENABLED = true;

const DEBUG = {
  LOG: function(msg) {
    if (DEBUG_ENABLED) {
      console.log(msg);
    }
  },

  ERROR: function(msg) {
    if (DEBUG_ENABLED) {
      console.error(msg);
    }
  },

  WARN: function(msg) {
    if (DEBUG_ENABLED) {
      console.warn(msg);
    }
  },

  INFO: function(msg) {
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
// All values are returned as strings. Remember to parse if you
// are expecting a number
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


// Retrieves bookmark location from course
function getBookmark() {
  return getValue('cmi.core.lesson_location');
}

// Sets bookmark of location in course
function setBookmark(location) {
  setValue('cmi.core.lesson_location', location);
}

// This is a helper object for the Objective class, but will probably be
// needed in other places as well. No functionality at the moment.
class Score {
  constructor(raw = 0, min = 0, max = 100) {
    this.raw = raw;
    this.min = min;
    this.max = max;
  }
}


// Objective Object for keeping track of objectives within a SCO.
// Keeps a mirror of the data it sends to the LMS locally so even RO properties
// can be accesed after storage to the LMS.
// Currently contains ID, Status and Score (as a seperate object detailed below)
// Index is frozen at creation and cannot be changed.
// Values autosave to the LMS when they are updated.

class Objective {
  // Creates a new Objective object and adds it to LMS
  // Index is non editable after creation.
  constructor(index, id = "[New Objective]") {
    Object.defineProperty(this, 'index', {
      writable: false,
      configurable: false,
      value: index
    });
    this._id = id;
    this._status = STATUS.NOT_ATTEMPTED;
    this._score = new Score();

    setValue(`cmi.objectives.${index}.id`, id);
  }

  // Sets ID of objective. This is a string on the LMS.
  set id(newId) {
      this._id = newId;
      setValue(`cmi.objectives.${this.index}.id`, newId);
    }
    // Pulls objective ID from LMS
  get id() {
      this._id = getValue(`cmi.objectives.${this.index}.id`);
      return this._id;
    }

  // Update status with more control than complete()
  // Expects a legal value from STATUS constant
  set status(newStatus) {
    this._status = newStatus;
    setValue(`cmi.objectives.${this.index}.status`, newStatus);
  }

  // Retrieve status of objective from LMS
  get status() {
    this._status = getValue(`cmi.objectives.${this.index}.status`);
    return this._status;
  }

  // Convenience function for completing an objective
  complete() {
    this._status = STATUS.COMPLETED
    setValue(`cmi.objectives.${this.index}.status`, this._status);
  }

  // Sets score on LMS. Can be expanded for more complex scoring but
  // Currently takes in a raw score and records it.
  set score(rawScore) {
    this._score.raw = rawScore;
    setValue(`cmi.objectives.${this.index}.score.raw`, rawScore);
  }

  // Retrieves the raw score from the score object on objective
  get score() {
    return this._score.raw;
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

// Container class to hold all objectives for a SCO.
// Contains methods for adding new objectives one at a time or in bulk
class Objectives {
  constructor() {
    this.objectives = [];
    console.log('constructing');
  }

  // Adds new objective to both the internal tracking and on the LMS
  addNew(objectiveId) {
    let newObjective = new Objective(this.objectives.length, objectiveId);
    this.objectives.push(newObjective);
  }

  // Convienence function to add a list of objectives all at once
  // Takes in a list of IDs and creates a new objective for each
  // Will only add list if LMS does not contain any objectives at
  // the time it is run. Can be expanded at some point to include
  // more involved checking and adding of missing or updated objectives.
  initializeList(listOfIds) {
    let currentObjectivesCount = parseInt(getValue('cmi.objectives._count'));
    if (currentObjectivesCount) {
      DEBUG.log('objectives already initialized');
      return;
    } else {
      listOfIds.forEach(obj => this.addNew(obj));
    }
  }
}