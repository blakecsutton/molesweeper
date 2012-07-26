$(function() {
  
  var Cell = Backbone.Model.extend({
    
    defaults: function() {
      return {
        row: 0, // Row location of cell
        column: 0, // Column location of cell
        value: 0,  // Value is a mine (*), an empty space (0), or a proximity number
        flagged: false,
        covered: true,
        visible: false
      };
    },
    
    hasMine: function() {
      return this.get('value') === '*';
    },
    
    empty: function() {
      return this.get('value') === 0;
    },
    
    placeMine: function() {
      this.set({value: '*'});
    },
    
    increment: function() {
      var v = this.get("value");
      v += 1;
      this.set({value: v});
    },
    
    // Flips over a game cell.
    uncover: function() {
      this.set({covered: false});
    },
    
    makeVisible: function() {
      this.set({visible: true});
    },
    
    // Toggles whether the cell is flagged as a mine.
    toggleFlagged: function() {
      this.set({flagged: !this.get('flagged')});
    },
    
    clear: function() {
      this.destroy();
    }
    
  });
  
  // View for handling a single cell.
  var CellView = Backbone.View.extend({
    
    tagName: "div",

    events: {
      "click": "flipTile",
      "contextmenu": "flagMine"
    },
    
    initialize: function() {
      // When the underlying model changes, invoke the render function.
      this.model.on('change', this.render, this);
      this.model.bind('destroy', this.remove, this);
        
      this.$el.addClass("cell");
      this.$el.addClass("covered");
    },
    
    render: function() {
      
      // Show the cell in either its covered or exposed state.
      var isCovered = this.model.get("covered");
      this.$el.toggleClass("covered", isCovered);
      this.$el.toggleClass("exposed", !isCovered);
      
      var isVisible = this.model.get("visible");
      var isFlagged = this.model.get("flagged");
      
      this.$el.toggleClass("flagged", isFlagged);

      if (isFlagged && !this.model.hasMine() && isVisible) {
        
         // Show a crossed out mine if the tile is incorrectly flagged as mine
        // and is visible (being shown to the user).
        this.$el.toggleClass("crossed");
      }

      // Toggle the mine display class if a mine cell is uncovered 
      // or one of the mines you didn't mark.
      if (!isCovered ||
          (isCovered && isVisible && !isFlagged) ) {
        this.$el.toggleClass("mine", this.model.hasMine() );
      }
      
      // Show the tile with the number if the cell is uncovered and not empty. 
      if ( !isCovered && !this.model.empty() ) {
        
        this.$el.text(this.model.get("value"));
      }
      
      
      return this;
    },
    
    flipTile: function() {
      
      if (this.model.get("flagged")) 
        return; 
      
      // Set the cell as uncovered in the model. 
      // The attached view will catch the change to the model and render accordingly
      this.model.uncover();      
    },
    
    flagMine: function(event) {
      
      event.preventDefault();
      
      if (!this.model.get("covered")) 
        return;       
 
      // Toggle whether or not the cell is flagged in the model
      this.model.toggleFlagged();
    }
    
  });
  
  var CellGroup = Backbone.Collection.extend({
    
    // When the state of a blank cell changes from covered to uncovered,
    // the collection should catch the change event and act on it to 
    // invoke flipTile on all valid neighboring cells.
     
     model: Cell,
     
     initialize: function() {
      this.on("change:covered", this.expandTiles, this);
      this.on("change:flagged", this.evaluateGame, this);
      this.on("mine", this.loseGame, this);
      this.gameOver = false;
     },
     
     expandTiles: function(cell) {
       
       // This is called whenever a tile gets uncovered.
       
       // If it's a mine, end the game
       if (cell.hasMine()) {
         this.trigger("mine");
       }
       else if(cell.empty()) {
         // If it's a blank cell, flip over all its neighbors automatically.
         
         // Calculate index in collection to use as a base for neighbor list.
         var i = cell.get("row");
         var j = cell.get("column"); 

         var neighborList = this.neighbors(i, j);
         
         // Flip all of the neighbors.
         var neighbor;
         for(var n = 0; n < neighborList.length; n += 1) {
           
            neighbor = this.at(neighborList[n]);      
            
            // Don't uncover automatically if it's already exposed, flagged, or
            // has a mine.
            if (neighbor.get("covered") && 
                !neighbor.get("flagged") &&
                !neighbor.hasMine() )  {
              this.at(neighborList[n]).uncover();
            }
         }         
       }
       else {
          // Check to see if this is the last square and you've won the game.
          this.evaluateGame();
       }
     },
     
     newGame: function(rows, columns, mines) {
      
      this.rows = rows;
      this.columns = columns;
      this.mines = mines;
    
       // Add rows*columns cells to the collection with (row, column) locations.
       for(var i = 0; i < rows; i += 1) {
          for(var j = 0; j < columns; j += 1) {
            this.add({row: i, column: j});
          }
        }
    
       // Add (mines) mines to the game board, updating the mine counts
       // of neighboring cells after each addition.
       var i, j, index, neighborIndex, v;
  
       for(var mine = 0; mine < mines; mine += 1) {
          
         // Randomly choose a location for the mine, throwing out all 
         // positions which already have a mine in them.
         do {
            
           i = Math.floor(Math.random()*rows);
           j = Math.floor(Math.random()*columns);        
         } while( this.at(columns*i + j).hasMine());
                    
         // Since the tiles are inserted in row-column order, we can use
         // that index to access the tile and turn its value into a mine.
         index = columns*i + j;
         this.at(index).placeMine();
         
         // Get the indices of all valid neighboring cells. 
         neighborList = this.neighbors(i, j);
          
         // Increment the mine count of all valid neighbors to the mine that
         // are not themselves mines.
         for(var n = 0; n < neighborList.length; n += 1) {
                         
             if (!this.at(neighborList[n]).hasMine()) {
               this.at(neighborList[n]).increment();
             }
         }
       }     
    },
    
    clearGame: function() {
      
      // Clear all of the cells in the game, by removing them from
      // the collection one by one and clearing the associated model.
      while (this.length > 0) {
        var cell = this.pop();
        cell.clear();
      }

    },
    
    // Given the index of a cell in the collection, return a list of valid
    // indices corresponding to neighboring cells in the board.
    neighbors: function(i, j) {
      
      var offsets = [[-1, -1], [1, 1], [1, -1], [-1, 1], [0, 1], [1, 0], [0, -1], [-1, 0]];
   
      // Build a list of valid neighbors by adding the offsets to the index
      // and rejecting invalid indices.
      var neighbors = [];
      var index;
      for(var o = 0; o < offsets.length; o += 1) {
        
        neighborRow = i + offsets[o][0];
        neighborColumn = j + offsets[o][1];
        
        if (neighborRow >= 0 && neighborRow < this.rows &&
            neighborColumn >= 0 && neighborColumn < this.columns) {
          
          index = neighborRow * this.columns + neighborColumn;
          neighbors.push(index);
        }
      }
      return neighbors;
    },
    
    // This function is called whenever the conditions to lose the game are met.
    loseGame: function() {
      
      console.log("Game over man!");
      this.gameOver = true;
      this.win = false;
      
      // Now that the game is over, mark any incorrectly flagged mines for feedback.
      this.showWrongFlags();
      
      this.showOtherMines();
    },
    
    // This function is called whenever the conditions to win the game are met.
    winGame: function() {
        board.gameOver = true;
        board.winGame = true;
        console.log("You win!");
    },
    
    evaluateGame: function() {
      // When all non-mine tiles are uncovered AND all mine tiles are flagged, 
      // you win.
      
      var correctlyUncovered = this.filter(function(cell) {
                                             return (!cell.get("covered"));
                                           });
      var nonMines = this.rows*this.columns - this.mines;
      
      if (this.allMinesFlagged() && 
          correctlyUncovered.length === nonMines) {
        this.winGame();
      }
        
    },
    
    // Function which returns true if all mines in the board are correctly flagged.
    allMinesFlagged: function() {
      var correctlyFlagged = this.filter(function(cell) { 
                                          return (cell.get("flagged") && 
                                                  cell.hasMine());
                                          });
      return (this.mines === correctlyFlagged.length);                               
                                               
    },
    
    // Uncover all mines that weren't uncovered during the game.
    showOtherMines: function() {
      var mines = this.filter(function(cell) {
                                return (cell.hasMine() &&
                                        cell.get("covered"));
                               });
      _.each(mines, function(cell) { cell.makeVisible(); });                                                    
    },
     
    // Single out all the cells incorrectly flagged as mines.
    showWrongFlags: function() {
      var wrongFlags = this.filter(function(cell) { 
                           return (cell.get("flagged") && 
                                   !cell.hasMine());
                          });
      
      _.each(wrongFlags, function(cell) { cell.makeVisible(); });  
    },
     
     // Single out all of the cells flagged as mines
     numberFlagged: function() {
       var flagged = this.filter(function(cell){ return cell.get('flagged'); });
       
       if (!flagged) {
         return 0;
       }
       else {
         return flagged.length;
       }
       
     }
   
   });
   
   board = new CellGroup;

  var GameView = Backbone.View.extend({
    
    el: "#game",
    
    events: {
      "submit #newGame": "resizeBoard"
    },
    
    initialize: function() {
      
      // Set up a list to hold the handles to all the cell views
      // linked to the cell models.
      this.cellViews = [];
      
      // Set up callbacks for changes to the collection.
      board.on('add', this.addCell, this);
      board.on('reset', this.addAll, this);
      board.on('all', this.render, this);
      
      
      this.rows = 10;
      this.columns = 10;
      this.mines = 5;
      
      // Create a new game by populating the board with cells.
      board.newGame(this.rows, this.columns, this.mines);
    },
    
    render: function() {
      // Nothing needed right now, but later this will be
      // where we handle showing the number of mines flagged 
      // and remaining and so on.
      
      
      if (board.gameOver) {
         
        if (board.winGame) {
          $("#youWin").show();
        }
        else {
          $("#gameOver").show();
        }        
        // Turn off event handling for all cells now that the game is over.
        _.each(this.cellViews, function(cell) { cell.undelegateEvents(); });
      }
      else {
        $("#minesFlaggedLabel").text(board.numberFlagged() + "/" + this.mines);
        
        $("#youWin").hide();
        $("#gameOver").hide();
      }
      
    },
    
    resizeBoard: function() {
      
      var inputElements = $("#newGame :input[type='text']");
      
      // Make sure they are all integers.
      var values = [];
      for(var i = 0; i < inputElements.length; i += 1) {
        
        var value = $(inputElements[i]).val();
        if (value >= 0 && value <= 100 ) {
          values.push(value);
        }
        else {
          return;
        }
      }
      
      this.rows = values[0];
      this.columns = values[1];
      this.mines = Math.min(values[2], this.rows * this.columns);
      
      // Restart the game if needed.
      if (board.gameOver) {
        board.gameOver = false;
      }
      
      // Delete all cell models, which triggers a callback to 
      // remove associated views automatically.
      board.clearGame();
     
      // Delete references to views to free memory. Is this needed?
      _.each(this.cellViews, function(cellView) { delete(cellView); });
      
      // Then create a new game.
      board.newGame(this.rows, this.columns, this.mines);  
    },
    
    addCell: function(cell) {
 
      // Render the view for the added cell using CellView
      var view = new CellView({model: cell});
      this.cellViews.push(view);      
      this.$("#board").append(view.render().el);
      
      // If the current cell is the last in a row, end the row with
      // a special div.
      if ( board.length % this.columns === 0) {
        this.$("#board").append("<div class='row_end'></div>");
      }
    },
    
    addAll: function() {
      board.each(this.addCell);
    }
    
  });
  
  var game = new GameView;

});