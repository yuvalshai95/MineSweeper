'use strict';

// Disable menu popping on mouse right click
// document.addEventListener('contextmenu', (event) => event.preventDefault());

//Const
const FLAG = '🚩';
const MINE = '💣';
const EMPTY = ' ';

// Timer Globals
var gTimerInterval;
var gMilliseconds;
var gSeconds;

// Game Globals
var gIsGameFinished;
var gLastClick = { i: 0, j: 0 };
var gBoard;
var gLevelDifficulty = 'Easy';

// Game object global
var gLevel = {
  size: 4,
  mines: 2,
};
var gGame = {
  isOn: false,
  shownCount: 0,
  markedCount: 0,
  winCount: gLevel.size ** 2,
  lives: 3,
  isHintClick: false,
  safeClicks: 3,
};

function initGame() {
  // Game
  buildBoard();
  renderBoard(gBoard);
  gIsGameFinished = false;

  // Timer
  gMilliseconds = 0;
  gSeconds = 0;

  // Timer display element
  renderElement('.timer', '000');

  // Lives counter element
  renderElement('.lives span', gGame.lives);

  // Flags counter
  renderElement('.flags span', gLevel.mines);

  // Emoji element
  renderElement('.emoji', '😀');

  // Safe clicks
  renderElement('.safe-click h6 span', gGame.safeClicks);

  // High Score
  renderHighScore();
}

function buildBoard() {
  gBoard = [];
  for (var i = 0; i < gLevel.size; i++) {
    gBoard[i] = [];
    for (var j = 0; j < gLevel.size; j++) {
      gBoard[i][j] = createCell();
    }
  }
}

function createCell() {
  return {
    minesAroundCount: 0,
    isShown: false,
    isMine: false,
    isMarked: false,
  };
}

function renderBoard(board) {
  var strHTML = '<table border="0"><tbody>';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < board[0].length; j++) {
      var currentCell = board[i][j];
      var className = getClassName({ i, j });

      // Check if  cell is marked and show flag
      if (currentCell.isMarked) {
        currentCell = FLAG;
      } else if (currentCell.isShown) {
        // Cell is shown
        // #1 Check if mine and show mine
        if (currentCell.isMine) {
          currentCell = MINE;
        } else {
          // Cell is Shown
          // #2 Cell is not a mine and show a number of mines around
          currentCell = currentCell.minesAroundCount;

          // Check mines is 0 -> show empty cell
          if (!currentCell) {
            currentCell = EMPTY;
          }
          className += ` shown ${numberColor(currentCell)}`;
        }
      } else {
        currentCell = EMPTY;
      }

      strHTML += `<td class="${className}"
      oncontextmenu="cellMarked(event,${i},${j})"
      onclick="cellClicked(${i},${j})">${currentCell}</td>`;
    }
    strHTML += '</tr>';
  }
  var elBoardContainer = document.querySelector('.board-container');
  elBoardContainer.innerHTML = strHTML;
}

function cellClicked(i, j) {
  if (!gIsGameFinished) {
    // first click in the game, make it safe(no mines)
    if (!gGame.isOn) {
      gGame.isOn = true;
      gTimerInterval = setInterval(displayTimer, 10);
      shuffleMinesAroundPos(i, j);
      setMinesNegsCount();
    }
    // Save location of cell clicked for showing the game over mine
    gLastClick.i = i;
    gLastClick.j = j;

    var currCell = gBoard[i][j];

    // Cant click not a valid cell
    if (currCell.isMarked) return;
    if (currCell.isShown) return;

    // User didn't use a hint
    if (!gGame.isHintClick) {
      // Clicked on safe cell (not a mine) and its not the first click
      if (!currCell.isMine) {
        if (currCell.minesAroundCount === 0) {
          // Expend cells
          expandShown({ i, j });
        } else {
          // show cell -> number with mines around it
          // Update model
          currCell.isShown = true;
          gGame.shownCount++;
        }
        // update DOM
        renderBoard(gBoard);
      } else {
        // Clicked on a mine
        gGame.lives--;

        // no lives left user lost
        if (!gGame.lives) {
          isGameOver(true);
          return;
        } else {
          // Update DOM
          renderElement('.lives span', gGame.lives);
          renderCell({ i, j }, MINE);
          renderElement('.emoji', '🤯');

          // Indication to the user that he clicked a mine
          setTimeout(() => {
            renderCell({ i, j }, EMPTY);
            renderElement('.emoji', '😀');
            renderBoard(gBoard);
          }, 1000);
        }
      }
      // check victory after every click
      isGameOver(false);
    } else {
      // Hint was clicked
      var hintedLocations = showAllHintedNegs({ i, j });
      gGame.isHintClick = false;

      // hide all hinted locations
      setTimeout(() => {
        hideAllHintedNegs(hintedLocations);
      }, 1000);
    }
  }
}

function cellMarked(ev, i, j) {
  ev.preventDefault(); // Cancel Menu popping on mouse right click
  if (!gIsGameFinished) {
    if (!gGame.isOn) {
      gGame.isOn = true;

      if (gTimerInterval) {
        clearInterval(gTimerInterval);
      }
      gTimerInterval = setInterval(displayTimer, 10);
      shuffleMinesAroundPos(i, j);
      setMinesNegsCount();
    }
    var currCell = gBoard[i][j];
    if (currCell.isShown) return;
    if (gGame.markedCount < gLevel.mines && !currCell.isMarked) {
      currCell.isMarked = true;
      gGame.markedCount++;
    } else if (currCell.isMarked) {
      currCell.isMarked = false;
      gGame.markedCount--;
    }
    isGameOver(false);
    renderBoard(gBoard);
    renderElement('.flags span', gLevel.mines - gGame.markedCount);
  }
}

function setMinesNegsCount() {
  for (var i = 0; i < gLevel.size; i++) {
    for (var j = 0; j < gLevel.size; j++) {
      var currPos = { i, j };

      // Get array with mines locations around current position(cell)
      var negsMines = getAllMinesNegs(currPos);

      gBoard[i][j].minesAroundCount = negsMines.length;
    }
  }
}

function getAllMinesNegs(location) {
  var minesAround = [];

  // Iterate from row above and next row
  for (var i = location.i - 1; i <= location.i + 1; i++) {
    // Checking to see if we are at the edge of the board
    if (i < 0 || i > gLevel.size - 1) continue;

    // Iterate from left col to right col
    for (var j = location.j - 1; j <= location.j + 1; j++) {
      // Checking to see if we are at the edge of the board
      if (j < 0 || j > gLevel.size - 1) continue;
      // dont check the current position(only neighbors)
      if (i === location.i && j === location.j) continue;
      // Checking if cell is shown or marked
      if (gBoard[i][j].isMarked || gBoard[i][j].isShown) continue;

      // Found a neighbor mine
      if (gBoard[i][j].isMine) {
        minesAround.push({ i, j });
      }
    }
  }
  return minesAround;
}

function shuffleMinesAroundPos(i, j) {
  var counter = 0;
  while (counter < gLevel.mines) {
    // Random location
    var randI = getRandomInt(0, gLevel.size);
    var randJ = getRandomInt(0, gLevel.size);

    // Can't place a mine in the given location
    if (randI === i && randJ === j) continue;

    // Cell is already a mine
    if (gBoard[randI][randJ].isMine) continue;

    gBoard[randI][randJ].isMine = true;
    counter++;
  }
}

function isGameOver(isHitMine) {
  // User lost
  if (isHitMine) {
    gIsGameFinished = true;
    gGame.isOn = false;

    clearInterval(gTimerInterval);

    showAllMines();

    // Mark the last mine clicked with red
    var elMineClicked = document.querySelector(`.cell-${gLastClick.i}-${gLastClick.j}`);
    elMineClicked.style.background = 'red';

    renderElement('.lives span', gGame.lives);
    renderElement('.emoji', '🤯');
    return;
  }

  // Check for victory
  if (gGame.shownCount + gGame.markedCount === gGame.winCount) {
    gIsGameFinished = true;
    gGame.isOn = false;
    clearInterval(gTimerInterval);
    showAllMines();
    renderElement('.emoji', '😎');
    setHighScore();
  }
}

function showAllMines() {
  for (var i = 0; i < gLevel.size; i++) {
    for (var j = 0; j < gLevel.size; j++) {
      var currCell = gBoard[i][j];
      if (currCell.isMine) {
        // Update model
        currCell.isShown = true;
      }
      if (currCell.isMarked && currCell.isMine) {
        currCell.isMarked = false;
      }
    }

    // Update DOM to show all mines
    renderBoard(gBoard);
  }
}

function expandShown(location) {
  // Iterate from row above and next row
  for (var i = location.i - 1; i <= location.i + 1; i++) {
    // Checking to see if we are at  the edge of the board
    if (i < 0 || i > gLevel.size - 1) continue;

    // Iterate from left col to right col
    for (var j = location.j - 1; j <= location.j + 1; j++) {
      // Checking to see if we are at the edge of the board
      if (j < 0 || j > gLevel.size - 1) continue;

      if (!gBoard[i][j].isMine && !gBoard[i][j].isMarked && !gBoard[i][j].isShown) {
        // Empty Cell check cell negs with recursion
        if (gBoard[i][j].minesAroundCount === 0) {
          gBoard[i][j].isShown = true;
          gGame.shownCount++;
          expandShown({ i, j });
        } else {
          gBoard[i][j].isShown = true;
          gGame.shownCount++;
        }
      }
    }
  }
}

function safeClick(elBtn) {
  // Cant click
  if (!gGame.isOn) return;
  if (gIsGameFinished) return;
  if (gGame.safeClicks < 1) return;

  // Get a safe click
  var safeCell = getSafeCell();
  if (!safeCell) return;

  // Update Model
  gGame.safeClicks--;
  // Update DOM
  renderElement('.safe-click h6 span', gGame.safeClicks);

  // Show safe click
  var elSafeCell = document.querySelector(`.cell-${safeCell.i}-${safeCell.j}`);
  elSafeCell.style.backgroundColor = 'lightgreen';

  // Hide safe click
  setTimeout(() => {
    elSafeCell.style.background = '#c0c0c0';
  }, 1000);

  if (gGame.safeClicks === 0) {
    elBtn.style.backgroundColor = 'tomato';
    elBtn.style.color = 'white';
  }
}

function renderHighScore() {
  var elHighScore = document.querySelector('.high-score span');
  if (!localStorage.getItem(gLevelDifficulty)) {
    localStorage.setItem(gLevelDifficulty, 999);
  } else {
    elHighScore.innerText = localStorage.getItem(gLevelDifficulty) + 's';
  }
}

function setHighScore() {
  var prevHighScore = localStorage.getItem(gLevelDifficulty);
  var newHighScore = gSeconds;

  // No previous high score (first time playing)
  if (!prevHighScore) {
    prevHighScore = 999;
    localStorage.setItem(gLevelDifficulty, prevHighScore);
  } else if (newHighScore > prevHighScore) {
    // High score is not set
    return;
  } else {
    // Set high score
    localStorage.setItem(gLevelDifficulty, newHighScore);
  }

  // Update DOM
  var elHighScore = document.querySelector('.high-score span');
  elHighScore.innerText = localStorage.getItem(gLevelDifficulty) + 's';
}
