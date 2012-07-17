/*global window, console */
/*global molesweeper, utilities */

$(document).ready( function () {
  
  // Function to disable functionality when the game is over and lost.
  function loseGame() {

      console.log("Game Over Man!");    
    
      molesweeper.gameOver = true;
      
      // Show the game over picture and text
      $("#minesRemainingLabel").text("GAME OVER MAN");
      $("#gameOver").removeClass("hidden");               
      
      // Hide the validation button 
      $("#validateButton").addClass("hidden");
  }
  
  // Event handler for clicking a tile in the game board.
  function flipTile() {
    
    // If the game is over, don't allow any further flipping of tiles.
    if (molesweeper.gameOver) {
      return;
    }
   
    // Return immediately if the tile has already been flipped or
    // if you are trying to click on a flagged mine. You have to unflag it first.
    if ( !$(this).hasClass("covered") ||
         $(this).hasClass("flagged") ) {
      return;
    }

    $(this).removeClass("covered");
    
    // Parse the id in format i,j into row and column integers.
    var location = $(this).attr('id').split(',');
    var i = parseInt(location[0], 10);
    var j = parseInt(location[1], 10);
    var value = molesweeper.board[i][j];
    
    // If the tile clicked is a mine, game over.
    if(value == '*') {
  
      $(this).addClass("mine");
      loseGame();  
    }
    else {
      
      $(this).addClass("exposed");
           
      // If the tile is blank, uncover all its neighbors as well.
      if (value === 0) {
      
        // Now recurse on all valid neighbors
        var neighbors = molesweeper.getNeighbors(molesweeper.board, i, j);
        
        for(var n = 0; n < neighbors.length; n += 1) {
          
          // Construct the id string to look up the div.
          // Note I am escaping the comma with two backslashes for jQuery.
          var idString = '#' + neighbors[n][0] + '\\,' + neighbors[n][1];
           
          // Invoke flipTile with neighbor cell as the context.
          flipTile.call($(idString));
        }
      }
      else {
        // If the tile is a number, add the number text to the cell.
        $(this).text(value);
      }
    }
  }
  
  // Event handler for flagging a tile as a mine with right click.
  function flagMine() {
    
    // Prevent pop-up menu from happening.
    var e = window.event;
    e.preventDefault();
    
    // If the game is over, don't allow any further flipping of tiles.
    if (molesweeper.gameOver) {
      return;
    }
    
    // You cannot flag an exposed tile.
    if ($(this).hasClass("exposed")) {
      return;
    }
    
    // Get handle to the mines remaining label for update
    var minesRemainingLabel = $("#minesRemainingLabel");
    var minesRemaining = parseInt(minesRemainingLabel.text(), 10);
    
    var location = $(this).attr('id').split(',');
    
    // See if the mine has already been flagged
    var index = molesweeper.searchFlagged(location[0], location[1]);
    if ( index != -1) {
      
      // If it has, removed it from the list of flagged mines.
      molesweeper.flaggedMines.pop(index);
      $(this).removeClass("flagged");
      // Increment the number of mines remaining.
      minesRemainingLabel.text(minesRemaining + 1);
    }
    else {
    
      // Otherwise add the coordinates to the internal list of flagged mines
      // and show it as flagged.
      molesweeper.flaggedMines.push(location);
      
      $(this).addClass("flagged");
      // Decrement the number of mines remaining.
      minesRemainingLabel.text(minesRemaining - 1);
    }
  }
  
  // Function to check flagged mines against actual mines to determine if game is won
  // or lost.
  function validateFlaggedMines() {
    
    var success = molesweeper.validateFlagged();
    if (success) {
      
      molesweeper.gameOver = true;
      
      console.log("You win dude!");
      // Show the game over picture and text
      $("#minesRemainingLabel").text("You're a winner!");
      $("#youWin").removeClass("hidden");
      
      // Hide the validation button
      $("#validateButton").addClass("hidden");
    }
    else {
      // Reveal the whole board and display the you lose text.
      var mineId;
      var mineCell;
      for (var mine = 0; mine < molesweeper.mines.length; mine += 1) {
        
        // Get a handle to the cell with each mine and expose it.
        mineId = '#' + molesweeper.mines[mine][0] + '\\,' + molesweeper.mines[mine][1];
        $(mineId).removeClass("covered");
        $(mineId).addClass("mine");
      }
      
      loseGame();
      
      // TODO: cross out mines you marked that are incorrect.
    }
  }
  
  // Initialization and setup code.
  var rows = 8;
  var columns = 8;
  var mines = 8;
  
  molesweeper.createBoard(rows, columns, mines);
  molesweeper.printBoard();
  
  // Show the number of mines in the board.
  $("#minesRemainingLabel").text(mines);
  
  // Get the container div and create the board.
  
  //var container = document.getElementById("game");
  //var board = document.createElement("div");
  var board = document.createElement("div");
  board.id = "board";
  
  // Lay out the cell divs representing the board.
  var cell, rowEnder;
  for(var row = 0; row < rows; row += 1) {
    
    for(var column = 0; column < columns; column += 1) {
      cell = document.createElement("div");
      cell.id = row + "," + column;
      cell.className = "cell covered";
      board.appendChild(cell);
    }
    rowEnder = document.createElement("div");
    rowEnder.className = "row_end";
    board.appendChild(rowEnder);
  }
  
  // Add the newly created board to the document
  $("#game").append(board);
  
  // Set up click handlers for the cells
  var cells = $(".cell");
  for (cell = 0; cell < cells.length; cell += 1) {
    cells[cell].addEventListener("click", flipTile, false);
    cells[cell].addEventListener("contextmenu", flagMine, false);
  }
  
  // Set up click handler for validate button
  $("#validateButton").click(validateFlaggedMines);
});

