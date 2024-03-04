class Menu {
    constructor(x, y, w, id, prefix, targets_size, horizontal_gap, vertical_gap) {
        this.targets = [];
        this.target = new Target(x, y, w, prefix.substring(0,2), id);
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
        let hue = 0;
        let prev_prefix = matches[i].getString(1).substring(0, 3);
        for (var r = 0; r < GRID_ROWS; r++) {
            for (var c = 0; c < GRID_COLUMNS; c++) {
                if (i === matches.length)
                    break;
                let target_x = 40 + (h_margin + targets_size) * c + targets_size / 2;        // give it some margin from the left border
                let target_y = (v_margin + targets_size) * r + targets_size / 2;

                let target_id = matches[i].getNum(0);
                let target_label = matches[i].getString(1);
                let target_label_prefix = target_label.substring(0, 3)

                if (prev_prefix != target_label_prefix) {
                    hue += 40;
                    prev_prefix = target_label_prefix;
                }

                let target = new ColoredTarget(target_x, target_y + 40, targets_size, target_label, target_id, hue);
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