# Overview #

**Molesweeper** is a simple version of Minesweeper for the browser which I wrote as a JavaScript exercise. 

##  Molesweeper object (in molesweeper.js) ##

This is an object for holding the game data, including a matrix for the board. The matrix cells contain  either integers >= 0 or mines. There is also a list of mines with their locations as a convenience.

To generate a valid game board, mines are placed in a random cell one at a time and surrounding neighbor cells are incremented. There is also a function to get the neighbors of a particular cell, which is used to automatically expand blank areas of the board.

## Controller/View JavaScript (interaction.js) ##

The visual representation of the board is a series of div's with various styles representing an exposed tile, a covered tile, a mine, etc. On page load, these elements are created based on the internal game board matrix and then added to the page.

