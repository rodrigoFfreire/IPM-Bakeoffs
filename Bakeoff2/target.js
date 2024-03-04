// Target class (position and width)
class Target
{
  constructor(x, y, w, l, id)
  {
    this.x      = x;
    this.y      = y;
    this.width  = w;
    this.label  = l;
    this.id     = id;
  }
  
  // Checks if a mouse click took place
  // within the target
  clicked(mouse_x, mouse_y)
  {
    hoverDisplay = this.label;
    return dist(this.x, this.y, mouse_x, mouse_y) < this.width / 2;
  }
  
  // Draws the target (i.e., a circle)
  // and its label
  renderLabel() {
    textFont("Arial", 30);
    
    fill(color(255, 255, 255));
    textAlign(CENTER);
    text(this.label, this.x, this.y);
  }

  draw() {
    fill(color(100, 100, 100));
    circle(this.x, this.y, this.width);

    this.renderLabel();
  }
}

class ColoredTarget extends Target {
  constructor(x, y, w, l, id, hue) {
    super(x, y, w, l, id);
    this.hue = hue;
  }

  draw() {
    colorMode(HSB, 360, 100, 100);
    fill((this.hue % 360), 50, 50);
    circle(this.x, this.y, this.width);
    colorMode(RGB, 255, 255, 255);

    this.renderLabel();
  }
}