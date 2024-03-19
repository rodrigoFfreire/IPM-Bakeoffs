// current frame being drawn
let drawing;

// frame to return to after clicking a button
let base_frame;

function cmToPixel(cm) {
  return cm * PPCM;
}

function pixelToCm(pixel) {
  return pixel / PPCM;
}

// Target class (position and width)
class Target {
  constructor(x, y, w, l, id, objective, fill_color, font, text_color, text_size, prefix)
  {
    this.x= cmToPixel(x);
    this.y = cmToPixel(y);
    this.width = cmToPixel(w);
    this.label = l;
    this.id = id;
    this.objective = objective;
    this.fill_color = fill_color;
    this.font = font;
    this.text_color = text_color;
    this.text_size = text_size;
    this.wasClicked = false;
    this.prefix = prefix;
  }

  reset() {
    this.wasClicked = false;
  }
  
  // Assumes x, and y in pixels.
  move(x, y) {
    this.x = x;
    this.y = y;
  }

  // Assumes y in centimeters.
  yShift(y) {
    this.y = y;
  }

  X() {
    return this.x;
  }

  Y() {
    return this.y;
  }

  xSize() {
    return this.width;
  }

  ySize() {
    return this.width;
  }
  
  // Checks if a mouse click took place
  // within the target
  clicked(mouse_x, mouse_y) {
    if (dist(this.x, this.y, mouse_x, mouse_y) < this.width / 2)
      return this;
    return null;
  }
  
  // Draws the target (i.e., a circle)
  // and its label
  draw() {
    // Draw target
    fill(this.fill_color);
    if (this.wasClicked) {
      stroke(255);
      strokeWeight(5);
    }
    circle(this.x, this.y, this.width);

    // Draw label
    textStyle(BOLD);
    textFont(this.font, cmToPixel(this.text_size));
    if (this.wasClicked)
      noStroke();
    fill(this.text_color);
    textAlign(CENTER);
    text(this.label, this.x, this.y);
    if (this.prefix)
      text(this.label.substring(0, 2).toUpperCase(), this.x, this.y - this.width/4);
    textStyle(NORMAL);
  }

  forward() {
    if (this.objective === true) {
      drawing = base_frame;
      if (this.id === trials[current_trial] + 1) {
        hits++;
        this.wasClicked = true;
        CORRECT_CLICK.play();
      } else {
        misses++;
        WRONG_CLICK.play();
      }
      current_trial++;
    }
  }

  back() {
    throw new Error("Target::back(): unsupported operation");
  }
}

class Targets {
  constructor(x, y, x_gap, y_gap, w, h) {
    this.targets = [];
    this.x = cmToPixel(x);
    this.y = cmToPixel(y);
    this.x_gap = cmToPixel(x_gap);
    this.y_gap = cmToPixel(y_gap);
    this.width = cmToPixel(w);
    this.height = cmToPixel(h);
    this.line_height = 0;
    this.last_x = 0;
    this.last_y = 0;
  }

  reset() {
    for (let i = 0; i < this.targets.length; i++)
      this.targets[i].reset();
  }

  X() {
    return this.x;
  }

  Y() {
    return this.y;
  }

  xSize() {
    return this.width;
  }

  ySize() {
    return this.height;
  }

  with(target) {
    let target_x;
    let target_y;
    if (this.targets.length === 0) {
      target.move(this.x, this.y);
      this.last_x = this.x;
      this.last_y = this.y;
      this.line_height = target.ySize();
      this.targets.push(target);
      return;
    }
    target_x = this.last_x + this.targets[this.targets.length - 1].xSize() + this.x_gap;
    if (target_x + target.xSize() > this.x + this.width) { // wrap-around case
      target_y = this.last_y + this.line_height + this.y_gap;
      //if (target_y + this.ySize() > this.y + this.height)
        //throw new Error("Targets::with(): height overflow");
      target.move(this.x, target_y);
      this.last_x = this.x;
      this.last_y = target_y;
      this.line_height = target.ySize();
      this.targets.push(target);
      return;
    }
    this.last_x = target_x;
    if (this.line_height < target.ySize()) {
      this.line_height = target.ySize();
      target_y = this.last_y;
      for (let i = this.targets.length; i >= 0; i--) {
        if (i < this.last_y)
          break;
        this.targets[i].move(this.targets[i].X(), this.last_y + (this.line_height - this.targets[i].ySize()) / 2);
      }
    } else {
      target_y = this.last_y + (this.line_height - target.ySize()) / 2;
    }
    target.move(target_x, target_y);
    this.targets.push(target);
  }

  clicked(mouse_x, mouse_y) {
    for (let i = 0; i < this.targets.length; i++) {
      let click = this.targets[i].clicked(mouse_x, mouse_y);
      if (click !== null)
        return click;
    }
    return null;
  }
  
  move(x, y) {
    if (x === this.x && y === this.y)
      return; // avoids heavy shifting
    this.y = y;
    this.x = x;
    let aux = this.targets;
    this.targets = [];
    for (let i = 0; i < aux.length; i++)
      this.with(aux[i]);
  }

  draw()  {
    for (let i = 0; i < this.targets.length; i++)
      this.targets[i].draw();
    if (DEBUG) {
      beginShape();
      stroke(color(6, 82, 58));
      strokeWeight(3);
      noFill();
      rect(this.x, this.y, this.width, this.height);
      endShape();
    }
  }

  forward() {}

  back() {}
}

class NamedTargets extends Targets {
  constructor(x, y, x_gap, y_gap, w, h, label, font, font_size, font_color) {
    super(x, y, x_gap, y_gap, w, h);
    this.label = label;
    this.font = font;
    this.font_size = font_size;
    this.font_color = font_color;
  }

  draw() {
    super.draw();
    textFont(this.font, this.font_size);
    fill(this.font_color);
    textAlign(CENTER);
    text(this.label, this.x, this.y - this.line_height / 2);
  }
}

class Frame extends Targets {
  constructor(x_gap, y_gap) {
    super(0, 0, x_gap, y_gap, width, height, 0);
  }

  with(targets) {
    this.targets.push(targets);
  }

  draw() {
    for (let i = 0; i < this.targets.length; i++)
      this.targets[i].draw();
  }

  forward() {}

  back() {}
}

class Menu extends Frame {
  constructor(x, y, w, l, color, font, text_color, text_size, parent, x_gap, y_gap) {
    super(0, 0, x_gap, y_gap, width, height, 0);
    this.parent = parent;
    this.target = new Target(x, y, w, l, -1, false, color, font, text_color, text_size, false);
  }

  move(x, y) {
    this.target.move(x, y);
  }

  X() {
    return this.target.X();
  }

  Y() {
    return this.target.Y();
  }

  xSize() {
    return this.target.xSize();
  }

  ySize() {
    return this.target.ySize();
  }

  clicked(mouse_x, mouse_y) {
    if (drawing === this) {
      for (let i = 0; i < this.targets.length; i++) {
        let click = this.targets[i].clicked(mouse_x, mouse_y);
        if (click !== null)
          return click;
      }
      return null;
    }
    if (drawing === this.parent) {
      let click = this.target.clicked(mouse_x, mouse_y);
      if (click)
        return this;
    }
    return null;
  }

  draw() {
    if (drawing === this) {
      for (let i = 0; i < this.targets.length; i++)
        this.targets[i].draw();
      return;
    }
    if (drawing === this.parent)
      this.target.draw();
  }

  forward() {
    drawing = this;
  }

  back() {
    drawing = this.parent;
  }
}

class ToggleableMenu extends Menu {
  constructor(x, y, w, l, color, font, text_color, text_size, parent, x_gap, y_gap) {
    super(x, y, w, l, color, font, text_color, text_size, parent, x_gap, y_gap);
    this.opened = false;
  }

  draw() {
    if (this.opened) {
      for (let i = 0; i < this.targets.length; i++)
        this.targets[i].draw();
    }
    this.target.draw();
  }

  clicked(mouse_x, mouse_y) {
    if (this.opened) {
      for (let i = 0; i < this.targets.length; i++) {
        let click = this.targets[i].clicked(mouse_x, mouse_y);
        if (click !== null)
          return click;
      }
    }
    let click = this.target.clicked(mouse_x, mouse_y);
    if (click)
      return this;
    return null;
  }

  forward() {
    if (this.parent !== null)
      this.parent.back();
    this.opened = true;
  }

  back() {
    this.opened = false;
  }
}

class RadioMenus extends Targets {
  with(x, y, w, l, color, font, text_color, text_size, parent, x_gap, y_gap) {
    let menu = new ToggleableMenu(x, y, w, l, color, font, text_color, text_size, parent, x_gap, y_gap);
    menu.parent = this;
    super.with(menu);
    return menu;
  }

  back() {
    for (let i = 0; i < this.targets.length; i++)
      this.targets[i].back();
  }
}

function setupFrames(x_gap, y_gap) {
  base_frame = new Frame(x_gap, y_gap);
  drawing = base_frame;
}

function detectClick(mouse_x, mouse_y) {
  let click = drawing.clicked(mouse_x, mouse_y);
  if (click !== null) {
    click.forward();
  } else {
    drawing.back();
    false;
  }
}

function drawCurrentFrame() {
  drawing.draw();
}

function loadMenu(menu, targets, regex, table) {
  let matches = table.matchRows("^" + regex, 1);
  matches.sort((A, B) => {
    let res = A.getString(1).localeCompare(B.getString(1));
    if (!res) {
      let swap = A.getNum(0);
      A.setNum(0, B.getNum(0));
      B.setNum(0, swap);
    }
    return res;
  });
  let seen = new Set();
  let group;
  let hue = -40;
  for (let i = 0; i < matches.length; i++) {
    let pref3 = matches[i].getString(1).substring(0, 3);
    if (!seen.has(pref3)) {
      let count = 1;
      for (let j = i + 1; j < matches.length; j++)
        if (matches[j].getString(1).substring(0, 3).localeCompare(pref3) === 0)
          count++;
      seen.add(pref3);
      group = new Targets(0, 0, 0, 0, target_size * count + 0.01, target_size);
      //group = new NamedTargets(0, 0, 0, 0, target_size * count + 0.01, target_size, pref3, DEFAULT_MENU_FONT, target_text_size, COLOR_WHITE);
      targets.with(group);
      hue = (hue + 40) % 360;
    }
    let name = matches[i].getString(1);
    group.with(new Target(200, 200, target_size, name, matches[i].getNum(0), true, color(hue, 50, 50), DEFAULT_TARGET_FONT, COLOR_WHITE, target_text_size, true));
  }
  menu.with(targets);
}

function invertedLoadMenu(menu_y, menu, regex, table) {
  let target_xgap = 0.5;
  let target_ygap = 1;
  let targets = new Targets(pixelToCm(menu.X()), menu_y, target_xgap, target_ygap, 9 * (target_size + target_xgap), 2 * (target_size + target_ygap));
  let matches;
  if (regex.localeCompare("a") === 0) {
    matches = table.matchRows("a$|á$", 1);
  } else if (regex.localeCompare("e") === 0) {
    matches = table.matchRows("e$|é$", 1);
  } else {
    matches = table.matchRows(regex + "$", 1);
  }
  matches.sort((A, B) => {
    let res = A.getString(1).localeCompare(B.getString(1));
    if (!res) {
      let swap = A.getNum(0);
      A.setNum(0, B.getNum(0));
      B.setNum(0, swap);
    }
    return res;
  });
  let seen = new Set();
  let group;
  let hue = -40;
  let max_x = 0;
  let max_y = 0;
  for (let i = 0; i < matches.length; i++) {
    let pref2 = matches[i].getString(1).substring(0, 2);
    if (!seen.has(pref2)) {
      let count = 1;
      for (let j = i + 1; j < matches.length; j++)
        if (matches[j].getString(1).substring(0, 2).localeCompare(pref2) === 0)
          count++;
      seen.add(pref2);
      group = new Targets(0, 0, 0, 0, target_size * count + 0.01, target_size);
      targets.with(group);
      hue = (hue + 40) % 360;
    }
    let name = matches[i].getString(1);
    //let target = new Target(200, 200, target_size, name, matches[i].getNum(0), true, color(hue, 50, 50), DEFAULT_TARGET_FONT, COLOR_WHITE, target_text_size, true);
    let target = new Target(200, 200, target_size, name, matches[i].getNum(0), true, color(hue, 50, 50), DEFAULT_TARGET_FONT, COLOR_WHITE, target_text_size, true);
    group.with(target);
    max_x = max(max_x, target.X() + target.xSize());
    max_y = max(max_y, target.Y() + target.ySize());
  }
  let screen_height_px = cmToPixel(screen_height);
  let screen_width_px = cmToPixel(screen_width);
  targets.move(targets.X() + min(0, screen_width_px - max_x), targets.Y() + (targets.Y() - max_y));
  menu.with(targets);
}