// current frame being drawn
let drawing;

// frame to return to after clicking a button
let base_frame;

// Target class (position and width)
class Target {
  constructor(x, y, w, l, id, objective, fill_color, font, text_color, text_size)
  {
    this.x      = x;
    this.y      = y;
    this.width  = w;
    this.label  = l;
    this.id     = id;
    this.objective = objective;
    this.fill_color = fill_color;
    this.font = font;
    this.text_color = text_color;
    this.text_size = text_size;
  }
  
  resize(x, y, w) {
    this.x = x;
    this.y = y;
    this.width = w;
    if (this.label === "Menu 1") {
      print("X: " + x);
      print("Y: " + y);
      print("W: " + w);
    }
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
    circle(this.x, this.y, this.width);
  
    // Draw label
    textFont(this.font, this.text_size);
    
    fill(this.text_color);
    textAlign(CENTER);
    text(this.label, this.x, this.y);
  }

  forward() {
    if (this.objective === true) {
      drawing = base_frame;
      if (this.id === trials[current_trial] + 1)
        hits++;
      else
        misses++;
      current_trial++;
    }
  }

  back() {
    throw new Error("Target::back(): unsupported operation");
  }
}

class Targets {
  constructor(x, y, x_gap, y_gap, width, height, size) {
    this.targets = [];
    this.x = x;
    this.y = y;
    this.x_gap = x_gap;
    this.y_gap = y_gap;
    this.width = width;
    this.height = height;
    this.size = size;
  }

  with(target) {
    //if (size > width)
      //throw new Error("Targets::with(): size of Target is greater than Targets width");
    let target_x = this.x;
    let target_y = this.x;
    let last_x = this.x;
    let last_y = this.y;
    if (this.targets.length !== 0) {
      last_x = this.targets[this.targets.length - 1].x;
      last_y = this.targets[this.targets.length - 1].y;
    } else {
      target.resize(this.x, this.y, this.size);
      this.targets.push(target);
      return;
    }
    if (last_x + this.size + this.x_gap <= this.x + this.width) {
      target_x = last_x + this.size + this.x_gap;
      target_y = last_y;
    } else {
      target_x = this.x;
      target_y = last_y + this.size + this.y_gap;
      if (last_y > this.y + this.height)
        throw new Error("Targets::with(): height overflow");
    }
    target.resize(target_x, target_y, this.size);
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
  
  resize(x, y, w) {
    throw new Error("Frame::resize(): unsupported operation");
  }

  draw()  {
    for (let i = 0; i < this.targets.length; i++)
      this.targets[i].draw();
  }

  forward() {
    throw new Error("Targets::forward(): unsupported operation");
  }

  back() {
    throw new Error("Targets::back(): unsupported operation");
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
    this.target = new Target(x, y, w, l, -1, false, color, font, text_color, text_size);
  }
  
  resize(x, y, w) {
    this.target.resize(x, y, w);
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