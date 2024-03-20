// Bake-off #2 -- Seleção em Interfaces Densas
// IPM 2023-24, Período 3
// Entrega: até às 23h59, dois dias úteis antes do sexto lab (via Fenix)
// Bake-off: durante os laboratórios da semana de 18 de Março

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER             = 51;     // Add your group number here as an integer (e.g., 2, 3)
const RECORD_TO_FIREBASE       = true;   // Set to 'true' to record user results to Firebase

// Pixel density and setup variables (DO NOT CHANGE!)
let PPI, PPCM;
const NUM_OF_TRIALS            = 12;     // The numbers of trials (i.e., target selections) to be completed
let continue_button;
let legendas;                            // The item list from the "legendas" CSV

// Metrics (DO NOT CHANGE!)
let testStartTime, testEndTime;          // time between the start and end of one attempt (8 trials)
let hits                       = 0;      // number of successful selections
let misses                     = 0;      // number of missed selections (used to calculate accuracy)
let database;                            // Firebase DB  

// Study control parameters (DO NOT CHANGE!)
let draw_targets               = false;  // used to control what to show in draw()
let trials;                              // contains the order of targets that activate in the test
let current_trial              = 0;      // the current trial number (indexes into trials array above)
let attempt                    = 0;      // users complete each test twice to account for practice (attemps 0 and 1)

// Target list and layout variables
const GRID_ROWS                = 8;      // We divide our 80 targets in a 8x10 grid
const GRID_COLUMNS             = 10;     // We divide our 80 targets in a 8x10 grid
const TEXT_FACTOR_A            = 119.49008;
const TEXT_FACTOR_C_MENU       = 30;
const TEXT_FACTOR_C_TARGET     = 4;

// Make your decisions in 'cm', so that targets have the same size for all participants
// Below we find out out white space we can have between 2 cm targets
let screen_width;                        // screen width
let screen_height;                       // screen height
let target_size                = 2.8;    // sets the target size (will be converted to cm when passed to createTargets)
let menu_target_size           = 2.5;
let target_text_size           = 0.36;
let menu_text_size             = 1.25;


let COLOR_WHITE;
let COLOR_BLACK;
let COLOR_DEFAULT_BUTTON;
let DEFAULT_TARGET_FONT;
let DEFAULT_MENU_FONT;
let DEBUG;


// Ensures important data is loaded before the program starts
function preload()
{
  // id,name,...
  legendas = loadTable('legendas.csv', 'csv', 'header');
  tutorial_img = loadImage("assets/images/tutorial.png");
  CORRECT_CLICK = loadSound("assets/sounds/correct_click.mp3");
  WRONG_CLICK = loadSound("assets/sounds/wrong_click.mp3");
}

// Runs once at the start
function setup()
{
  colorMode(HSB, 360, 100, 100); // Use HSB color
  COLOR_WHITE = color(0, 0, 100);
  COLOR_BLACK = color(0, 0, 0);
  COLOR_DEFAULT_BUTTON = color(210, 100, 40);
  DEFAULT_TARGET_FONT = "Serif";
  DEFAULT_MENU_FONT = "Serif";
  DEBUG = false;

  createCanvas(1920, 1080);      // window size in px before we go into fullScreen()
  frameRate(60);                 // frame rate (DO NOT CHANGE!)
  randomizeTrials();             // randomize the trial order at the start of execution
  drawUserIDScreen();            // draws the user start-up screen (student ID and display size)

  image(tutorial_img, 0, 160);   // Draws the tutorial image
}

// Runs every frame and redraws the screen
function draw()
{
  if (draw_targets && attempt < 2)
  {
    // The user is interacting with the 6x3 target grid
    background(COLOR_BLACK);        // sets background to black
    
    // Print trial count at the top left-corner of the canvas
    textFont("Arial", 16);
    fill(COLOR_WHITE);
    textAlign(LEFT);
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);
    
    drawCurrentFrame();
    
    // Draws the target label to be selected in the current trial. We include 
    // a black rectangle behind the trial label for optimal contrast in case 
    // you change the background colour of the sketch (DO NOT CHANGE THESE!)
    fill(COLOR_BLACK);
    rect(0, height - 40, width, 40);
 
    textFont("Arial", 20);
    fill(COLOR_WHITE);
    textAlign(CENTER);
    text(legendas.getString(trials[current_trial],1), width/2, height - 20);
  }
}

// Print and save results at the end of 54 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE! 
  let accuracy			= parseFloat(hits * 100) / parseFloat(hits + misses);
  let test_time         = (testEndTime - testStartTime) / 1000;
  let time_per_target   = nf((test_time) / parseFloat(hits + misses), 0, 3);
  let penalty           = constrain((((parseFloat(95) - (parseFloat(hits * 100) / parseFloat(hits + misses))) * 0.2)), 0, 100);
  let target_w_penalty	= nf(((test_time) / parseFloat(hits + misses) + penalty), 0, 3);
  let timestamp         = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  textFont("Arial", 18);
  background(COLOR_BLACK);   // clears screen
  fill(COLOR_WHITE);   // set text fill color to white
  textAlign(LEFT);
  text(timestamp, 10, 20);    // display time on screen (top-left corner)
  
  textAlign(CENTER);
  text("Attempt " + (attempt + 1) + " out of 2 completed!", width/2, 60); 
  text("Hits: " + hits, width/2, 100);
  text("Misses: " + misses, width/2, 120);
  text("Accuracy: " + accuracy + "%", width/2, 140);
  text("Total time taken: " + test_time + "s", width/2, 160);
  text("Average time per target: " + time_per_target + "s", width/2, 180);
  text("Average time for each target (+ penalty): " + target_w_penalty + "s", width/2, 220);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:       GROUP_NUMBER,
        assessed_by:        student_ID,
        test_completed_by:  timestamp,
        attempt:            attempt,
        hits:               hits,
        misses:             misses,
        accuracy:           accuracy,
        attempt_duration:   test_time,
        time_per_target:    time_per_target,
        target_w_penalty:   target_w_penalty,          
  }
  
  // Sends data to DB (DO NOT CHANGE!)
  if (RECORD_TO_FIREBASE)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Adds user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Mouse button was pressed - lets test to see if hit was in the correct target
function mousePressed() 
{
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    detectClick(mouseX, mouseY);
    
    // Check if the user has completed all trials
    if (current_trial === NUM_OF_TRIALS)
    {
      testEndTime = millis();
      draw_targets = false;          // Stop showing targets and the user performance results
      printAndSavePerformance();     // Print the user's results on-screen and send these to the DB
      attempt++;                      
      
      // If there's an attempt to go create a button to start this
      if (attempt < 2)
      {
        base_frame.reset();
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    }
    // Check if this was the first selection in an attempt
    else if (current_trial === 1) testStartTime = millis(); 
  }
}

// Evoked after the user starts its second (and last) attempt
function continueTest()
{
  // Re-randomize the trial order
  randomizeTrials();
  
  // Resets performance variables
  hits = 0;
  misses = 0;
  
  current_trial = 0;
  continue_button.remove();
  
  // Shows the targets again
  draw_targets = true; 
}

function invertedCreateTargets(target_size, horizontal_gap, vertical_gap)
{
  setupFrames(horizontal_gap, vertical_gap);
  let count = 0; // aux variable when grouping menus
  let left = 18; // number of menus
  let group_size = 5; // size of each group
  let groups_per_row = 2; // how many groups should be side by side

  // Create Menu group
  let menu_xgap = 0.2;
  let menu_ygap = 0.5;
  let menu_x = screen_width / 2 - ((groups_per_row * menu_target_size * group_size) + (groups_per_row * menu_xgap)) / 2 + target_size / 2;
  let menu_w = (screen_width / 2 - menu_x) * 2.1 + target_size; // .1 to account for floating point errors
  let menu_h = Math.ceil(left / (group_size * groups_per_row)) * (menu_target_size + menu_ygap);
  let menu_y = screen_height - menu_h - pixelToCm(40); // 40 is the height of the label rectangle
  //let menus = new Targets(menu_x, menu_y, menu_xgap, menu_ygap, menu_w, menu_h);
  let menus = new RadioMenus(menu_x, menu_y, menu_xgap, menu_ygap, menu_w, menu_h);

  let sufixes = new Set();
  sufixes.add("é");
  sufixes.add("á");
  let cities = legendas.getColumn(1);
  cities.sort((A, B) => {
    let res = A.slice(-1).localeCompare(B.slice(-1));
    return res;
  });

  let menuGroup = new Targets(0, 0, 0, 0, (group_size + 0.1) * menu_target_size, menu_target_size);
  //menus.with(menuGroup);
  for (let i = 0; i < cities.length; i++) {
    if (sufixes.has(cities[i].slice(-1)))
      continue;

    count++;
    left--;
    invertedLoadMenu(menu_y - menu_ygap, menus.with(0, 0, menu_target_size, cities[i].slice(-1).toUpperCase(), COLOR_DEFAULT_BUTTON, DEFAULT_MENU_FONT, COLOR_WHITE, menu_text_size, base_frame, 10, 10), cities[i].slice(-1), legendas)
    sufixes.add(cities[i].slice(-1));
  }
  base_frame.with(menus);
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized() 
{
  if (fullscreen())
  {
    resizeCanvas(windowWidth, windowHeight);
    
    // DO NOT CHANGE THE NEXT THREE LINES!
    let display        = new Display({ diagonal: display_size }, window.screen);
    PPI                = display.ppi;                      // calculates pixels per inch
    PPCM               = PPI / 2.54;                       // calculates pixels per cm
  
    // Make your decisions in 'cm', so that targets have the same size for all participants
    // Below we find out out white space we can have between 2 cm targets
    screen_width   = display.width * 2.54;             // screen width
    screen_height  = display.height * 2.54;            // screen height

    let horizontal_gap = 2;
    
    let vertical_gap = 2;

    invertedCreateTargets(target_size, horizontal_gap, vertical_gap);

    // Starts drawing targets immediately after we go fullscreen
    draw_targets = true;
  }
}
