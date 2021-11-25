function getClassName(location) {
  var cellClass = `cell cell-${location.i}-${location.j}`;
  return cellClass;
}

function setDifficult(elBtn) {
  gLevelDifficulty = elBtn.innerText;
  switch (gLevelDifficulty) {
    case 'Easy':
      gLevel.size = 4;
      gLevel.mines = 2;
      gGame.winCount = gLevel.size ** 2;
      break;

    case 'Medium':
      gLevel.size = 8;
      gLevel.mines = 12;
      gGame.winCount = gLevel.size ** 2;
      break;

    case 'Hard':
      gLevel.size = 12;
      gLevel.mines = 30;
      gGame.winCount = gLevel.size ** 2;
      break;
  }

  resetGame();
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

// Switch for css
function numberColor(num) {
  switch (num) {
    case 0:
      return '';
    case 1:
      return 'one';
    case 2:
      return 'two';
    case 3:
      return 'three';
    case 4:
      return 'four';
    case 5:
      return 'five';
    case 6:
      return 'six';
    case 7:
      return 'seven';
    case 8:
      return 'eight';
    default:
      return null;
  }
}

function resetGame() {
  // Reset game object
  gGame.shownCount = 0;
  gGame.markedCount = 0;
  gGame.isOn = false;
  gGame.lives = 3;
  gGame.isHintClick = false;
  gGame.safeClicks = 3;

  if (gTimerInterval) clearInterval(gTimerInterval);

  // Remove red color from  safe click button
  var elSafeClick = document.querySelector('.safe-btn');
  elSafeClick.removeAttribute('style');

  // Render all hints
  var elHintsImgs = document.querySelectorAll('.hints img');
  for (var hintImg of elHintsImgs) {
    hintImg.src = 'img/lightOff.png';
  }

  var elHintsBtns = document.querySelectorAll('.hints button');
  for (let hintBtn of elHintsBtns) {
    hintBtn.setAttribute('onclick', 'getHint(this)');
  }

  initGame();
}

function displayTimer() {
  gMilliseconds += 10;
  if (gMilliseconds === 1000) {
    gMilliseconds = 0;
    gSeconds++;
  }

  var s = gSeconds < 10 ? '00' + gSeconds : gSeconds < 100 ? '0' + gSeconds : gSeconds;
  var elTimer = document.querySelector('.timer');

  elTimer.innerText = `${s}`;
}

function renderElement(selector, value) {
  var el = document.querySelector(selector);
  el.innerText = value;
}

function renderCell(location, value) {
  var elCell = document.querySelector(`.cell-${location.i}-${location.j}`);
  elCell.innerText = value;
}

function getHint(elHintBtn) {
  if (gIsGameFinished || gGame.isHintClick) return;
  gGame.isHintClick = true;
  var elHintImg = elHintBtn.querySelector('img');
  elHintImg.src = 'img/lightOn.png';
  elHintBtn.removeAttribute('onclick');
}

function showAllHintedNegs(location) {
  var neighbors = [];

  // Iterate from row above and next row
  for (var i = location.i - 1; i <= location.i + 1; i++) {
    // Checking to see if we are at the edge of the board
    if (i < 0 || i > gLevel.size - 1) continue;

    // Iterate from left col to right col
    for (var j = location.j - 1; j <= location.j + 1; j++) {
      // Checking to see if we are at the edge of the board
      if (j < 0 || j > gLevel.size - 1) continue;
      // Checking if cell is shown or marked
      if (gBoard[i][j].isMarked || gBoard[i][j].isShown) continue;

      neighbors.push({ i, j });
      gBoard[i][j].isShown = true;
    }
  }
  renderBoard(gBoard);
  return neighbors;
}

function hideAllHintedNegs(neighbors) {
  for (var location of neighbors) {
    gBoard[location.i][location.j].isShown = false;
    renderBoard(gBoard);
  }
}

function getSafeCell() {
  var safeCells = [];
  for (var i = 0; i < gLevel.size; i++) {
    for (var j = 0; j < gLevel.size; j++) {
      var currCell = gBoard[i][j];
      if (!currCell.isShown && !currCell.isMine && !currCell.isMarked) {
        safeCells.push({ i, j });
      }
    }
  }
  // No safe cells
  if (!safeCells.length) {
    return null;
  } else {
    var randPos = getRandomInt(0, safeCells.length);
    return safeCells[randPos];
  }
}
