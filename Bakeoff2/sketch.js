// Bake-off #2 -- Seleção em Interfaces Densas
// IPM 2023-24, Período 3
// Entrega: até às 23h59, dois dias úteis antes do sexto lab (via Fenix)
// Bake-off: durante os laboratórios da semana de 18 de Março

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER        = 0;      // Add your group number here as an integer (e.g., 2, 3)
const RECORD_TO_FIREBASE  = false;  // Set to 'true' to record user results to Firebase

// Pixel density and setup variables (DO NOT CHANGE!)
let PPI, PPCM;
const NUM_OF_TRIALS       = 12;     // The numbers of trials (i.e., target selections) to be completed
let continue_button;
let legendas;                       // The item list from the "legendas" CSV

// Metrics (DO NOT CHANGE!)
let testStartTime, testEndTime;     // time between the start and end of one attempt (8 trials)
let hits 			      = 0;      // number of successful selections
let misses 			      = 0;      // number of missed selections (used to calculate accuracy)
let database;                       // Firebase DB  

// Study control parameters (DO NOT CHANGE!)
let draw_targets          = false;  // used to control what to show in draw()
let trials;                         // contains the order of targets that activate in the test
let current_trial         = 0;      // the current trial number (indexes into trials array above)
let attempt               = 0;      // users complete each test twice to account for practice (attemps 0 and 1)

// Target list and layout variables
let menus;
const GRID_ROWS           = 2;      // We divide our 80 targets in a 8x10 grid
const GRID_COLUMNS        = 13;     // We divide our 80 targets in a 8x10 grid

let hoverDisplay = ""; // Display City being hovered over

class Menu {
    constructor(x, y, w, id, prefix, targets_size, horizontal_gap, vertical_gap) {
        this.targets = [];
        this.target = new Target(x, y, w, prefix, id);
        let matches = legendas.matchRows(prefix + ".*", 1);
        matches.sort((A, B) => {
          let res = A.getString(1).localeCompare(B.getString(1));
          if (!res) {
            let swap = A.getNum(0);
            A.setNum(0, B.getNum(0));
            B.setNum(0, swap);
          }
          return res;
        })
        // Define the margins between targets by dividing the white space 
        // for the number of targets minus one
        let h_margin = horizontal_gap / (GRID_COLUMNS - 1);
        let v_margin = vertical_gap / (GRID_ROWS - 1);

        // Set targets in a 8 x 10 grid
        let i = 0;
        for (var r = 0; r < GRID_ROWS; r++) {
            for (var c = 0; c < GRID_COLUMNS; c++) {
                if (i === matches.length)
                    break;
                let target_x = 40 + (h_margin + targets_size) * c + targets_size / 2;        // give it some margin from the left border
                let target_y = (v_margin + targets_size) * r + targets_size / 2;

                let target_id = matches[i].getNum(0);
                let target_label = matches[i].getString(1);

                let target = new Target(target_x, target_y + 40, targets_size, target_label, target_id);
                this.targets.push(target);
                i++;
            }  
        }
    }

    // Checks if a mouse click hit a target within the menu and if so
    // returns which.
    clickedMenu(mouse_x, mouse_y) {
        return this.target.clicked(mouse_x, mouse_y);
    }

    // Draws the menu and it's targets.
    drawMenu() {
        this.target.draw();
    }

    // Checks if a mouse click hit a target within the menu and if so
    // returns which.
    clicked(mouse_x, mouse_y) {
        for (let i = 0; i < this.targets.length; i++) {
            if (this.targets[i].clicked(mouse_x, mouse_y))
                return this.targets[i].id;
        }
        return -1;
    }

    // Draws the menu and it's targets.
    draw() {
        for (let i = 0; i < this.targets.length; i++)
            this.targets[i].draw();
    }
}

class Menus {
    constructor() {
        this.menus = [];
        this.selected = -1;
        this.r = 0;
        this.c = 0;
    }
  
    clear() {
      this.menus = [];
      this.selected = -1;
      this.r = 0;
      this.c = 0;
    }

    // Checks if a mouse click hit a target within the menu and if so
    // returns which.
    clickedMenu(mouse_x, mouse_y) {
        if (this.selected !== -1)
            return -1;
        for (let i = 0; i < this.menus.length; i++) {
            if (this.menus[i].clickedMenu(mouse_x, mouse_y))
                return this.menus[i].target.id;
        }
        return -1;
    }

    // Checks if a mouse click hit a target within the menu and if so
    // returns which.
    clicked(mouse_x, mouse_y) {
        if (this.selected === -1)
            return -1;
        return this.menus[this.selected].clicked(mouse_x, mouse_y);
    }

    withinMenu() {
        return this.selected !== -1;
    }

    select(menu) {
        this.selected = menu;
    }

    with(prefix, target_size, horizontal_gap, vertical_gap) {
        let h_margin = horizontal_gap / (GRID_COLUMNS - 1);
        let v_margin = vertical_gap / (GRID_ROWS - 1);
        let x = 40 + (h_margin + target_size) * this.c + target_size / 2;        // give it some margin from the left border
        let y = (v_margin + target_size) * this.r + target_size / 2;
        this.r += floor((this.c + 1) / GRID_COLUMNS);
        this.c = (this.c + 1) % GRID_COLUMNS;
        let menu = new Menu(x, y + 40, target_size, this.menus.length, prefix, target_size, horizontal_gap, vertical_gap);
        this.menus.push(menu);
    }

    // Draws the menu and it's targets.
    draw() {
        if (this.selected === -1) {
            for (let i = 0; i < this.menus.length; i++)
                this.menus[i].drawMenu();
            return;
        }
        this.menus[this.selected].draw();
    }
}

// Ensures important data is loaded before the program starts
function preload()
{
  // id,name,...
  legendas = loadTable('legendas.csv', 'csv', 'header');
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);    // window size in px before we go into fullScreen()
  frameRate(60);             // frame rate (DO NOT CHANGE!)
  menus = new Menus();
  randomizeTrials();         // randomize the trial order at the start of execution
  drawUserIDScreen();        // draws the user start-up screen (student ID and display size)
}

// Runs every frame and redraws the screen
function draw()
{
  if (draw_targets && attempt < 2)
  {
    // The user is interacting with the 6x3 target grid
    background(color(0,0,0));        // sets background to black
    
    // Print trial count at the top left-corner of the canvas
    textFont("Arial", 16);
    fill(color(255,255,255));
    textAlign(LEFT);
    text("Trial " + (current_trial + 1) + " of " + trials.length, 50, 20);
    
    // Draw all targets
	//for (var i = 0; i < legendas.getRowCount(); i++)
      //targets[i].draw();
    menus.draw();
    
    // Displays the city on the button being currently hovered over
    fill(255, 255, 255);
    textSize(32);
    textAlign(CENTER);
    text(hoverDisplay, width/2, height/2);
    //text(hoverDisplay, width - 60, floor(mouseY / (height / 10)) * (height /10) + (height / 20));
    
    // Draws the target label to be selected in the current trial. We include 
    // a black rectangle behind the trial label for optimal contrast in case 
    // you change the background colour of the sketch (DO NOT CHANGE THESE!)
    fill(color(0,0,0));
    rect(0, height - 40, width, 40);
 
    textFont("Arial", 20);
    fill(color(255,255,255));
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
  background(color(0,0,0));   // clears screen
  fill(color(255,255,255));   // set text fill color to white
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
    let click = menus.clicked(mouseX, mouseY);
    if (click !== -1) {
      if (click === trials[current_trial] + 1)
        hits++;
      else
        misses++;
      menus.select(-1);
      current_trial++;
    } else {
      menus.select(menus.clickedMenu(mouseX, mouseY));
    }
    /*for (var i = 0; i < legendas.getRowCount(); i++)
    {
      // Check if the user clicked over one of the targets
      if (targets[i].clicked(mouseX, mouseY)) 
      {
        // Checks if it was the correct target
        if (targets[i].id === trials[current_trial] + 1) hits++;
        else misses++;
        
        current_trial++;              // Move on to the next trial/target
        break;
      }
    }*/
    
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
        continue_button = createButton('START 2ND ATTEMPT');
        continue_button.mouseReleased(continueTest);
        continue_button.position(width/2 - continue_button.size().width/2, height/2 - continue_button.size().height/2);
      }
    }
    // Check if this was the first selection in an attempt
    else if (current_trial === 1) testStartTime = millis(); 
  }
}

// Mouse was moved
function mouseMoved() 
{
  // Only look for mouse releases during the actual test
  // (i.e., during target selections)
  if (draw_targets)
  {
    menus.clicked(mouseX, mouseY);
    menus.clickedMenu(mouseX, mouseY);
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

// Creates and positions the UI targets
function createTargets(target_size, horizontal_gap, vertical_gap)
{
  menus.with("Ba", target_size, horizontal_gap, vertical_gap);
  menus.with("Br", target_size, horizontal_gap, vertical_gap);
  menus.with("Be", target_size, horizontal_gap, vertical_gap);
  menus.with("Bu", target_size, horizontal_gap, vertical_gap);
  menus.with("Bh", target_size, horizontal_gap, vertical_gap);
  menus.with("Bi", target_size, horizontal_gap, vertical_gap);
  menus.with("Bl", target_size, horizontal_gap, vertical_gap);
  menus.with("Bo", target_size, horizontal_gap, vertical_gap);
  menus.with("By", target_size, horizontal_gap, vertical_gap);
  menus.with("Bé", target_size, horizontal_gap, vertical_gap);
  menus.with("Bn", target_size, horizontal_gap, vertical_gap);
  /*// Define the margins between targets by dividing the white space 
  // for the number of targets minus one
  h_margin = horizontal_gap / (GRID_COLUMNS -1);
  v_margin = vertical_gap / (GRID_ROWS - 1);
  
  legendas.rows.sort((a, b) => {
        let valueA = a.getString(1);
        let valueB = b.getString(1);
        return valueA.localeCompare(valueB);
    });
  
  // Set targets in a 8 x 10 grid
  for (var r = 0; r < GRID_ROWS; r++)
  {
    for (var c = 0; c < GRID_COLUMNS; c++)
    {
      let target_x = 40 + (h_margin + target_size) * c + target_size/2;        // give it some margin from the left border
      let target_y = (v_margin + target_size) * r + target_size/2;
      
      // Find the appropriate label and ID for this target
      let legendas_index = c + GRID_COLUMNS * r;
      let target_id = legendas.getNum(legendas_index, 0);
      let target_label = legendas.getString(legendas_index, 1);
      
      let target = new Target(target_x, target_y + 40, target_size, target_label, target_id);
      targets.push(target);
    }  
  }*/
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
    let screen_width   = display.width * 2.54;             // screen width
    let screen_height  = display.height * 2.54;            // screen height
    let target_size    = 3;                                // sets the target size (will be converted to cm when passed to createTargets)
    let horizontal_gap = screen_width - target_size * GRID_COLUMNS;// empty space in cm across the x-axis (based on 10 targets per row)
    let vertical_gap   = screen_height - target_size * GRID_ROWS;  // empty space in cm across the y-axis (based on 8 targets per column)

    menus.clear();
    // Creates and positions the UI targets according to the white space defined above (in cm!)
    // 80 represent some margins around the display (e.g., for text)
    createTargets(target_size * PPCM, horizontal_gap * PPCM - 80, vertical_gap * PPCM - 80);

    // Starts drawing targets immediately after we go fullscreen
    draw_targets = true;
  }
}