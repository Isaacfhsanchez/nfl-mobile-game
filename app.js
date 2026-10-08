const canvas = document.getElementById('fieldCanvas');
const ctx = canvas.getContext('2d');

const scoreYourEl = document.getElementById('yourScore');
const scoreCpuEl = document.getElementById('cpuScore');
const timerEl = document.getElementById('timer');
const downInfoEl = document.getElementById('downInfo');
const statusTextEl = document.getElementById('statusText');
const possessionBadgeEl = document.getElementById('possessionBadge');
const resetBtn = document.getElementById('resetBtn');
const buttons = document.querySelectorAll('.play-btn');

const game = {
  timer: 90,
  yourScore: 0,
  cpuScore: 0,
  duration: 90,
  fieldPos: 25,
  down: 1,
  toGo: 10,
  possession: 'you',
  status: 'Choose a play to start the drive.',
  gameOver: false,
};

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function setStatus(message) {
  game.status = message;
  statusTextEl.textContent = message;
}

function updateHud() {
  scoreYourEl.textContent = String(game.yourScore);
  scoreCpuEl.textContent = String(game.cpuScore);
  timerEl.textContent = formatTime(game.timer);
  possessionBadgeEl.textContent = game.possession === 'you' ? 'OFFENSE' : 'DEFENSE';
  possessionBadgeEl.classList.toggle('you', game.possession === 'you');
  possessionBadgeEl.classList.toggle('cpu', game.possession === 'cpu');
  downInfoEl.textContent = `${game.down === 0 ? 'OT' : getOrdinal(game.down)} & ${game.toGo}`;
}

function getOrdinal(value) {
  if (value === 1) return '1st';
  if (value === 2) return '2nd';
  if (value === 3) return '3rd';
  return '4th';
}

function resetDrive(player = 'you') {
  game.possession = player;
  game.down = 1;
  game.toGo = 10;
  game.fieldPos = 25;
  if (player === 'you') {
    setStatus('You have the ball. Start the drive.');
  } else {
    setStatus('Defense! Stop the CPU drive.');
  }
  updateHud();
}

function endGame() {
  game.gameOver = true;
  const result = game.yourScore === game.cpuScore
    ? 'Final: tied game!'
    : game.yourScore > game.cpuScore
      ? 'Final: you win!'
      : 'Final: CPU wins!';
  setStatus(`${result} Press New Game to restart.`);
  buttons.forEach((button) => {
    button.disabled = true;
    button.style.opacity = '0.5';
  });
}

function tick() {
  if (game.gameOver) return;

  game.timer -= 1;
  if (game.timer <= 0) {
    game.timer = 0;
    endGame();
  }
  updateHud();
}

function updateDriveAfterGain(gain) {
  const nextPosition = game.fieldPos + gain;

  if (nextPosition >= 100) {
    if (game.possession === 'you') {
      game.yourScore += 7;
      setStatus('Touchdown! You punch it in for 7.');
      resetDrive('cpu');
    } else {
      game.cpuScore += 7;
      setStatus('Touchdown! CPU finishes the drive.');
      resetDrive('you');
    }
    updateHud();
    return;
  }

  game.fieldPos = nextPosition;

  if (gain >= game.toGo) {
    game.down = 1;
    game.toGo = 10;
    setStatus(`First down! +${gain} yards.`);
    updateHud();
    return;
  }

  game.down += 1;
  game.toGo = Math.max(1, game.toGo - gain);

  if (game.down > 4) {
    if (game.possession === 'you') {
      setStatus('Turnover on downs. CPU gets the ball.');
      resetDrive('cpu');
    } else {
      setStatus('Defense holds! You take over.');
      resetDrive('you');
    }
    updateHud();
    return;
  }

  setStatus(`${getOrdinal(game.down)} & ${game.toGo} — keep moving.`);
  updateHud();
}

function performOffensePlay(type) {
  let gain = 0;
  let comments = 'Nice play.';

  if (type === 'run') {
    const roll = Math.random();
    gain = randomBetween(2, 10);
    if (roll < 0.12) {
      setStatus('Fumble! The defense recovers.');
      game.possession = 'cpu';
      game.down = 1;
      game.toGo = 10;
      game.fieldPos = 25;
      updateHud();
      return;
    }
    comments = 'Strong run up the edge.';
  }

  if (type === 'pass') {
    const roll = Math.random();
    gain = randomBetween(5, 22);
    if (roll < 0.14) {
      setStatus('Intercepted! The CPU steals the ball.');
      game.possession = 'cpu';
      game.down = 1;
      game.toGo = 10;
      game.fieldPos = 25;
      updateHud();
      return;
    }
    comments = 'The receiver gets open for a big gain.';
  }

  if (type === 'defend') {
    performDefensePlay('rush');
    return;
  }

  const nextStatus = `${comments} ${gain} yards gained.`;
  setStatus(nextStatus);
  updateDriveAfterGain(gain);
}

function performDefensePlay(type) {
  let gain = 0;
  const roll = Math.random();

  if (type === 'rush') {
    gain = roll < 0.65 ? randomBetween(1, 5) : randomBetween(7, 15);
  }

  if (type === 'zone') {
    gain = roll < 0.72 ? randomBetween(0, 3) : randomBetween(4, 12);
  }

  if (type === 'blitz') {
    gain = roll < 0.5 ? 0 : randomBetween(6, 18);
  }

  if (gain === 0) {
    setStatus('Big stop! You force a turnover on the next snap.');
    game.possession = 'you';
    resetDrive('you');
    return;
  }

  const nextPosition = game.fieldPos + gain;
  game.fieldPos = nextPosition;

  if (nextPosition >= 100) {
    game.cpuScore += 7;
    setStatus('CPU scores! Your defense breaks down.');
    resetDrive('you');
    updateHud();
    return;
  }

  if (gain >= game.toGo) {
    setStatus(`CPU picks up the first down for +${gain}.`);
    game.down = 1;
    game.toGo = 10;
    updateHud();
    return;
  }

  game.down += 1;
  game.toGo = Math.max(1, game.toGo - gain);

  if (game.down > 4) {
    setStatus('Fourth down stop! You get the ball back.');
    game.possession = 'you';
    resetDrive('you');
    updateHud();
    return;
  }

  setStatus(`CPU advances ${gain} yards. ${getOrdinal(game.down)} & ${game.toGo}.`);
  updateHud();
}

function handleAction(action) {
  if (game.gameOver) return;

  if (game.possession === 'you') {
    if (action === 'defend') {
      setStatus('You are on offense. Pick Run or Pass.');
      return;
    }
    performOffensePlay(action);
    return;
  }

  if (game.possession === 'cpu') {
    if (action === 'defend') {
      performDefensePlay('rush');
      return;
    }
    if (action === 'run' || action === 'pass') {
      setStatus('CPU has the ball. Choose a defensive play.');
      return;
    }
  }
}

function drawField() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#179a4a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  for (let i = 0; i < 10; i += 1) {
    const x = 20 + (i * (canvas.width - 40)) / 10;
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, canvas.height - 20);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 20);
  ctx.lineTo(canvas.width / 2, canvas.height - 20);
  ctx.stroke();

  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i < 11; i += 1) {
    const yard = 10 * i;
    const x = 35 + (yard / 100) * (canvas.width - 70);
    ctx.fillText(String(yard), x, 42);
  }

  const ballX = 35 + (game.fieldPos / 100) * (canvas.width - 70);
  const ballY = canvas.height * 0.38;

  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.arc(ballX, ballY, 10, 0, Math.PI * 2);
  ctx.fill();

  const humanX = canvas.width * 0.28;
  const cpuX = canvas.width * 0.72;
  ctx.fillStyle = '#3a68ff';
  ctx.beginPath();
  ctx.arc(humanX, canvas.height * 0.58, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff4d4d';
  ctx.beginPath();
  ctx.arc(cpuX, canvas.height * 0.52, 20, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('YOU', humanX, canvas.height * 0.78);
  ctx.fillText('CPU', cpuX, canvas.height * 0.72);

  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`Line: ${game.fieldPos}`, ballX, ballY - 18);
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.action;
    handleAction(action);
    drawField();
  });
});

resetBtn.addEventListener('click', () => {
  game.timer = game.duration;
  game.yourScore = 0;
  game.cpuScore = 0;
  game.fieldPos = 25;
  game.down = 1;
  game.toGo = 10;
  game.possession = 'you';
  game.gameOver = false;
  buttons.forEach((button) => {
    button.disabled = false;
    button.style.opacity = '1';
  });
  setStatus('Choose a play to start the drive.');
  updateHud();
  drawField();
});

setInterval(tick, 1000);
updateHud();
drawField();
