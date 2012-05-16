window.onload = setup;

function setup() {
  
  var rows = 8;
  var columns = 8;
  var mines = 8;
  
  molesweeper.createBoard(rows, columns, mines);
  molesweeper.printBoard();
  
  // Show the number of mines in the board.
  var minesRemainingLabel = document.getElementById("minesRemainingLabel");
  minesRemainingLabel.textContent = mines;
  
  // Get the container div and create the board.
  var container = document.getElementById("game");
  var board = document.createElement("div");
  board.id = "board";
  
  // Lay out the cell divs representing the board.
  var cell, rowEnder;
  for(var row = 0; row < rows; row += 1) {
    
    for(var column = 0; column < columns; column += 1) {
      cell = document.createElement("div");
      cell.id = row + "," + column
      cell.className = "cell covered";
      board.appendChild(cell);
    }
    rowEnder = document.createElement("div");
    rowEnder.className = "row_end"
    board.appendChild(rowEnder);
  }
  
  // Add the newly created board to the document
  container.appendChild(board);
  
  // Set up click handlers for the cells
  var cells = document.getElementsByClassName("cell");
  for (cell = 0; cell < cells.length; cell += 1) {
    cells[cell].addEventListener("click", flipTile, false);
    cells[cell].addEventListener("contextmenu", flagMine, false);
  }
  
  // Set up click handler for validate button
  var validateButton = document.getElementById("validateButton");
  validateButton.addEventListener("click", validateFlaggedMines);
}

function validateFlaggedMines() {
  
  var success = molesweeper.validateFlagged();
  if (success) {
    
    molesweeper.gameOver = true;
    
    console.log("You win dude!");
    // Show the game over picture and text
    var minesRemainingLabel = document.getElementById("minesRemainingLabel");
    minesRemainingLabel.textContent = "You're a winner!";
    var winImage = document.getElementById("youWin");
    utilities.removeStyleClass(winImage, "hidden");
    
    // Hide the validation button
    var validateButton = document.getElementById("validateButton");
    utilities.addStyleClass(validateButton, "hidden");    
    
  }
  else {
    // Reveal the whole board and display the you lose text.
    var mineId;
    var mineCell;
    for (var mine = 0; mine < molesweeper.mines.length; mine += 1) {
      
      // Get a handle to the cell with each mine and expose it.
      mineId = molesweeper.mines[mine][0] + ',' + molesweeper.mines[mine][1]
      mineCell = document.getElementById(mineId);
      utilities.removeStyleClass(mineCell, "covered");
      utilities.addStyleClass(mineCell, "mine");
    }
    
    loseGame();
    
    // Later: cross out mines you marked that are incorrect.
  }
}

// Event handler for flagging a tile as a mine with right click.
function flagMine() {
  
  // If the game is over, don't allow any further flipping of tiles.
  if (molesweeper.gameOver) {
    return;
  }
  
  // Prevent pop-up menu from happening.
  e = window.event;
  e.preventDefault();
  
  // Get handle to the mines remaining label for update
  var minesRemainingLabel = document.getElementById("minesRemainingLabel");
  var minesRemaining = parseInt(minesRemainingLabel.textContent, 10);
  
  // If the mine has already been flagged, unflag it.
  var location = this.id.split(',');
  
  // See if the mine has already been flagged
  var index = molesweeper.searchFlagged(location[0], location[1]);
  if ( index != -1) {
    
    // If it has, removed it from the list of flagged mines.
    molesweeper.flaggedMines.pop(index);
    utilities.removeStyleClass(this, "flagged");
    // Increment the number of mines remaining.
    minesRemainingLabel.textContent = minesRemaining + 1;
  }
  else {
  
    // Otherwise add the coordinates to the internal list of flagged mines
    // and show it as flagged.
    molesweeper.flaggedMines.push(location);
    
    utilities.addStyleClass(this, "flagged");
    // Decrement the number of mines remaining.
    minesRemainingLabel.textContent = minesRemaining - 1;
  }
  
}

function loseGame() {
    molesweeper.gameOver = true;
    console.log("Game Over Man!");
    // Show the game over picture and text
    var minesRemainingLabel = document.getElementById("minesRemainingLabel");
    minesRemainingLabel.textContent = "GAME OVER MAN";
    var gameOverImage = document.getElementById("gameOver");
    utilities.removeStyleClass(gameOverImage, "hidden");
    
    // Hide the validation buttn
    var validateButton = document.getElementById("validateButton");
    utilities.addStyleClass(validateButton, "hidden");
}

// Event handler for clicking a tile in the game board.
function flipTile() {
  
  // If the game is over, don't allow any further flipping of tiles.
  if (molesweeper.gameOver) {
    return;
  }
 
  // Return immediately if the tile has already been flipped or
  // if you are trying to click on a flagged mine. You have to unflag it first.
  if ( !utilities.hasClass(this, "covered") ||
       utilities.hasClass(this, "flagged") ) {
    return;
  }
  
  // Parse the id in format i,j into row and column integers.
  var location = this.id.split(',');
  var i = parseInt(location[0], 10);
  var j = parseInt(location[1], 10);
  var value = molesweeper.board[i][j];
  
  utilities.removeStyleClass(this, "covered");
  
  // If the tile clicked is a mine, game over.
  if(value == '*') {

    utilities.addStyleClass(this, "mine");

    loseGame();
    
  }
  else {
    
    utilities.addStyleClass(this, "exposed");
    
    // If the tile is blank, uncover all its neighbors as well.
    if(value == 0) {
    
      // Now recurse on all valid neighbors
      var neighbors = molesweeper.getNeighbors(molesweeper.board, i, j);
      
      for(var n = 0; n < neighbors.length; n += 1) {
        
        // Construct the id string to look up the div.
        var idString = neighbors[n][0] + ',' + neighbors[n][1];
        var cell = document.getElementById(idString);
        
        // Invoke flipTile with neighbor cell as the context.
        flipTile.call(cell);
      }
    }
    else {
      // If the tile is a number, add the number text to the cell.
      number = document.createTextNode(value);
      this.appendChild(number);
    }
  }
}
