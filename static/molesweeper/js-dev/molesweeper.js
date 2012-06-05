/*global console */

/* Global for the molesweeper object, which holds internal game state. */
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
