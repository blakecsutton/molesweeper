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
  
  // Prevent pop-up menu from happening.
  e = window.event;
  e.preventDefault();
  
  // If the game is over, don't allow any further flipping of tiles.
  if (molesweeper.gameOver) {
    return;
  }
  
  // You cannot flag an exposed tile.
  if (utilities.hasClass(this, "exposed")) {
    return;
  }
  
  
  // Get handle to the mines remaining label for update
  var minesRemainingLabel = document.getElementById("minesRemainingLabel");
  var minesRemaining = parseInt(minesRemainingLabel.textContent, 10);
  
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
var molesweeper = {
  
  board: [],
  gameOver: false,
  mines: [],
  flaggedMines: [],
  
  validateFlagged: function validateFlagged() {
    
    // Search for each mine from the mines list in the list of flagged mines.
    for (var index = 0; index < molesweeper.mines.length; index += 1 ) {
      var searchIndex = molesweeper.searchFlagged(molesweeper.mines[index][0], 
                                                  molesweeper.mines[index][1]);
      if (searchIndex == -1) {
        return false;
      }                                                  
    }
    
    return true;
  },
  
  searchFlagged: function searchFlagged(row, column) {
    var index = 0;
    while(index < molesweeper.flaggedMines.length) {
      if( molesweeper.flaggedMines[index][0] == row &&
          molesweeper.flaggedMines[index][1] == column) {
        return index;
      }
      index += 1;
    }
    return -1;
  },
  
  /* Create a board of (rows)*(columns) tiles, with (mines) mines randomly placed
   * on it. Returns a matrix representing the game board.
   */
  createBoard: function createBoard(rows, columns, mines) {
    
    // Create the board matrix as an array of arrays,
    // and pre-fill all cells with 0.
    var board = [];
    
    for(var row = 0; row < rows; row += 1) {
      board[row] = [];
      for(var column = 0; column < columns; column += 1) {
        board[row][column] = 0;
      }
    }
    
    this.board = board;
    
    // Add (mines) mines to the game board, updating the mine counts
    // of neighboring cells after each addition.
    var i, j;
    for(var mine = 0; mine < mines; mine += 1) {
      
      // Randomly choose a location for the mine, throwing out all 
      // positions which already have a mine in them.
      
      do {
        
        i = Math.floor(Math.random()*rows);
        j = Math.floor(Math.random()*columns);        
      } while( board[i][j] == '*');
      
      console.log("Placed a mine at %d %d", i, j);
      this.mines.push([i, j]);
      
      // Set the tile to have a mine by using a special value.
      board[i][j] = '*';
      
      // Increment the mine count of all valid neighbors to the mine.
      this.applyToNeighbors(board, i, j, molesweeper.incrementMineCount);
    }
  },
  
  // Increment the current count of mines touching the cell, unless the cell itself contains
  // a mine.
  incrementMineCount: function incrementMineCount(board, i, j) {
  
    if (board[i][j] != '*' ) {
      board[i][j] += 1;
    }
  },
  
  // Given a location and a board, return a list of coordinates representing valid neighbors
  // of the cell.
  getNeighbors: function getNeighbors(board, i, j) {
    
    var neighbors = [];
    
    function inBounds(board, i, j) {
      
     return (i >= 0 && i < board.length &&  
             j >= 0 && j < board[0].length);
    }
    
    // Row above
    if (inBounds(board, i-1, j-1)) {
      neighbors.push([i-1, j-1]);
    }
    if (inBounds(board, i-1, j)) {
      neighbors.push([i-1, j]);
    }    
    if (inBounds(board, i-1, j+1)) {
      neighbors.push([i-1, j+1]);
    }    
    
    // Same row
    if (inBounds(board, i, j-1)) {
      neighbors.push([i, j-1]);
    }
    if (inBounds( board, i, j+1)) {
      neighbors.push([i, j+1]);
    }
    
    // Row below
    if (inBounds(board, i+1, j-1)) {
      neighbors.push([i+1, j-1]);
    }
    if (inBounds(board, i+1, j)) {
      neighbors.push([i+1, j]);
    }
    if (inBounds(board, i+1, j+1)) {
      neighbors.push([i+1, j+1]);
    }
    
    return neighbors;
  },
 
  // Gives all the in-bounds neighbors of the specified cell, as a list of tuples.
  applyToNeighbors: function applyToNeighbors(board, i, j, action) {
     
     var neighbors = molesweeper.getNeighbors(board, i, j);
     for(var neighbor = 0; neighbor < neighbors.length; neighbor += 1) {
       action(board, neighbors[neighbor][0], neighbors[neighbor][1]);
     }
  },
  
  // Print the board for debugging purposes.
  printBoard: function printBoard() {
    var line;
    for(var row = 0; row < molesweeper.board.length; row += 1) {
      line = "";
      for(var column = 0; column < molesweeper.board[0].length; column += 1) {
        line += molesweeper.board[row][column] + ' ';
      }
      
      console.log(line);
      
    }
  }
  
};
var utilities = (function() {

  var ELEMENT_NODE = 1;
  var TEXT_NODE = 3;
  
  function hasClass(target, styleClassName) {
    pattern = " " + styleClassName + " ";
    return ((" " + target.className + " ").indexOf(pattern) > -1);
  }

  // Takes an element node and string for a css class name.
  // Adds the new class to the element without affecting previous classes.
  // Note that this function does not check if the style has already been applied, 
  // however removeStyleClass will work even if a style appears multiple times in the className string.
  function addStyleClass(target, styleClassName) {
    // The extra space is deliberate because then it's always easy to remove a class'
    target.className += ' ' + styleClassName;
  }

  // Takes an element node and a string representing a css class name.
  // If the class is already applied to the element remove it, otherwise make no change.
  function removeStyleClass(target, styleClassName) {
    
    // Matches whitespace followed by a word exactly equal to the class name.
    var styleClassRegExp = new RegExp('\\s\\b' + styleClassName + '\\b', 'g');
    target.className = target.className.replace(styleClassRegExp, ''); 
  }

  /* Simple utility function that accepts an element node and returns a list of its children that are elements. */
  function getElementList(element) {
    
    var nodeList,
        currentNode,
        elementList = [];
        
    nodeList = element.childNodes;
    for( var index = 0; index < nodeList.length; index += 1) {
      
      currentNode = nodeList[index];
      
      if (currentNode.nodeType == ELEMENT_NODE) {
         elementList.push(currentNode);
       }
    }
    
    return elementList;
  }

  // Utility function that searches a list of nodes for element nodes that contain a particular class string
  // in their className. This works for elements with multiple classes, e.g. 'angry hidden monster', however
  // it will also match on cla ss names that targetClass is a substring of. It returns the first result.
  function getChildByClassName(element, targetClass) {
    
    var currentNode;
    var children = element.childNodes;
    
    for ( var ct = 0; ct < children.length; ct += 1 ) {
      
      currentNode = children[ct];
      
      if( currentNode.nodeType == ELEMENT_NODE &&
          currentNode.className.indexOf(targetClass) != -1 ) {
          return currentNode;
      }
    } 
  }
  
  /* Utility function to get a query string parameter from the url by name, or 
   * return false if it isn't there. Example getQueryStringParameter('beer')
   */
  function getQueryStringParameter(name) {
    
    // Can't use a primitive because the regex is built around a variable name.
    var match = RegExp('[?&]' + name + '=([^&]*)')
                    .exec(window.location.search);
    
    // Return false if no match. Replace +'s with spaces and use the decodeURIComponent
    // function to translate any special characters to their equivalents (.e.g, /)
    return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
  }

  /* Utility function to strip the leading and trailing whitespace from the input string.
   * If the string is nothing but whitespace, it will return "", the empty string.
   */
  function strip(inputString) {
    
    var stripped;
    
    // Strip leading whitespace
    stripped = inputString.replace(/^\s*/g,'');
    // Strip trailing whitespace
    stripped = stripped.replace(/\s*$/g, '');
    
    return stripped;
  }
  
  // Return the functions that you want to be exposed to the rest of the module.
  return {hasClass: hasClass,
          addStyleClass: addStyleClass,
          removeStyleClass: removeStyleClass,
          getElementList: getElementList,
          getQueryStringParameter: getQueryStringParameter};
})();