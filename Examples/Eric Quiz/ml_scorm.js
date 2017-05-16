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

// Global contsat object for legal interaction results
// Additional legal response is a floating point number
const RESULT = {
  CORRECT: "correct";
  WRONG: "wrong",
  UNANTICIPATED: "unanticiated",
  NEUTRAL: "neutral"
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
// NOTE if setting multiple values at once use scorm.set() directly and
// save after setting the final value to avoid slow communication with LMS
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
  constructor (raw=0, min=0, max=100) {
    this.raw = raw;
    this.min = min;
    this.max =  max;
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
  constructor(index, id="[New Objective]") {
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

  // Convenience function for completing an objective
  complete() {
    this._status = STATUS.COMPLETED
    setValue(`cmi.objectives.${this.index}.status`, this._status);
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

  // Sets score on LMS. Can be expanded for more complex scoring but
  // Currently takes in a raw score and records it.
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
    let currentObjectivesCount = parseInt(getValue('cmi.object._count'));
    if (currentObjectivesCount) {
      DEBUG.log('objectives already initialized');
      return;
    } else {
      listOfIds.forEach(obj => this.addObjective(obj));
    }
  }
}

// Interaction object for tracking student interactions
// Takes in a config object to initialize the many available properties
class Interaction {
  constructor(index, config) {
    Object.defineProperty(this, 'index', {
      writable: false,
      configurable: false,
      value: index
    });
    this.id = config.id;

    this.objectives
    // objectives.n.id

    this.time
    // time interaction was completed (format HH:MM:SS.SS) WO

    this.type = config.type;
    // use INTERACTION types

    this.correct_responses = config.correct_responses
    // correct_responses.n.pattern
    // can have multiple correct responses
    // each pattern can be weighted differently
    // dependent on type, types expect the following formats
    // true-false: 0,1,t,f
    // choice: 1 or mare characters[0-9,a-z,A-Z] seperated by a comma
    //  student response will be single character
    //  if multiple answers must be selected use CSV in {}
    // fill-in: alphanumeric string, spaces significant
    // numeric: single number with or without decimal
    // likert: can be blank, no incorrect response
    // matching: pairs of identifiers separated by a period
    // performance: alphanumeric string 255 chars max
    // sequencing: series of single characters [0-9,a-z,A-Z]

    this.weighting = config.weighting;
    // single floating point number, higher numbers weighted heavier

    this.student_response
    // see correct_responses for further details

    this.result
    // use legal values from RESULT constant or a floating point number

    this.latency
    // time from presentation of stimulus to completion of mesurable response
    // ie how long it takes the student to answer the question

  }
}
