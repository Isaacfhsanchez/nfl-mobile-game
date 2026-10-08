const teams = [
  { id: 'chiefs', name: 'Chiefs', short: 'KC', record: '11-6', primary: '#e31837', accent: '#ffb81c' },
  { id: 'cowboys', name: 'Cowboys', short: 'DAL', record: '12-5', primary: '#003594', accent: '#8c8b8a' },
  { id: 'eagles', name: 'Eagles', short: 'PHI', record: '13-4', primary: '#004c54', accent: '#a5acaf' },
  { id: '49ers', name: '49ers', short: 'SF', record: '14-3', primary: '#aa0000', accent: '#b3995d' }
];

const canvas = document.getElementById('fieldCanvas');
const ctx = canvas.getContext('2d');

const teamGrid = document.getElementById('teamGrid');
const teamScreen = document.getElementById('teamScreen');
const gameScreen = document.getElementById('gameScreen');
const startGameBtn = document.getElementById('startGameBtn');
const resetBtn = document.getElementById('resetBtn');
const selectedTeamLabel = document.getElementById('selectedTeamLabel');
const yourTeamLabel = document.getElementById('yourTeamLabel');

const scoreYourEl = document.getElementById('yourScore');
const scoreCpuEl = document.getElementById('cpuScore');
const timerEl = document.getElementById('timer');
const downInfoEl = document.getElementById('downInfo');
const statusTextEl = document.getElementById('statusText');
const possessionBadgeEl = document.getElementById('possessionBadge');
const buttons = document.querySelectorAll('.play-btn');

const state = {
  selectedTeam: teams[0],
  cpuTeam: teams[1],
  timer: 120,
  yourScore: 0,
  cpuScore: 0,
  fieldPos: 25,
  down: 1,
  toGo: 10,
  possession: 'you',
  status: 'Choose a play to start the drive.',
  gameOver: false,
  started: false,
};

function pickRandomTeam(excludeId) {
  const pool = teams.filter((team) => team.id !== excludeId);
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildTeamGrid() {
  teamGrid.innerHTML = '';

  teams.forEach((team) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `team-card${state.selectedTeam.id === team.id ? ' selected' : ''}`;
    card.innerHTML = `
      <span class="team-mark" style="background: linear-gradient(135deg, ${team.primary}, ${team.accent});">${team.short}</span>
      <span class="team-name">${team.name}</span>
      <span class="team-record">${team.record}</span>
    `;

    card.addEventListener('click', () => {
      state.selectedTeam = team;
      state.cpuTeam = pickRandomTeam(team.id);
      buildTeamGrid();
      selectedTeamLabel.textContent = state.selectedTeam.name;
      yourTeamLabel.textContent = state.selectedTeam.short;
    });

    teamGrid.appendChild(card);
  });
}

function showScreen(screenName) {
  teamScreen.classList.toggle('active', screenName === 'team');
  gameScreen.classList.toggle('active', screenName === 'game');
}

function setStatus(message) {
  state.status = message;
  statusTextEl.textContent = message;
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function getOrdinal(value) {
  if (value === 1) return '1st';
  if (value === 2) return '2nd';
  if (value === 3) return '3rd';
  return '4th';
}

function updateHud() {
  scoreYourEl.textContent = String(state.yourScore);
  scoreCpuEl.textContent = String(state.cpuScore);
  timerEl.textContent = formatTime(state.timer);
  downInfoEl.textContent = `${state.down === 0 ? 'OT' : getOrdinal(state.down)} & ${state.toGo}`;
  possessionBadgeEl.textContent = state.possession === 'you' ? 'OFFENSE' : 'DEFENSE';
  possessionBadgeEl.classList.toggle('you', state.possession === 'you');
  possessionBadgeEl.classList.toggle('cpu', state.possession === 'cpu');
}

function resetDrive(nextPossession) {
  state.possession = nextPossession;
  state.down = 1;
  state.toGo = 10;
  state.fieldPos = 25;
  setStatus(nextPossession === 'you' ? 'You have the ball. Drive it downfield.' : `${state.cpuTeam.name} has the ball. Stop them.`);
  updateHud();
}

function endGame() {
  state.gameOver = true;
  state.started = false;
  buttons.forEach((button) => {
    button.disabled = true;
    button.style.opacity = '0.55';
  });

  const result = state.yourScore === state.cpuScore
    ? 'Final: tied game!'
    : state.yourScore > state.cpuScore
      ? 'Final: you win!'
      : 'Final: CPU wins!';

  setStatus(`${result} Tap Back to Teams to play again.`);
}

function advanceField(gain) {
  const nextPosition = state.fieldPos + gain;

  if (nextPosition >= 100) {
    if (state.possession === 'you') {
      state.yourScore += 7;
      setStatus('Touchdown! You power it in for 7.');
      resetDrive('cpu');
    } else {
      state.cpuScore += 7;
      setStatus(`${state.cpuTeam.name} scores a touchdown!`);
      resetDrive('you');
    }
    updateHud();
    return;
  }

  state.fieldPos = nextPosition;

  if (gain >= state.toGo) {
    state.down = 1;
    state.toGo = 10;
    setStatus(`First down! ${gain} yards gained.`);
    updateHud();
    return;
  }

  state.down += 1;
  state.toGo = Math.max(1, state.toGo - gain);

  if (state.down > 4) {
    if (state.possession === 'you') {
      setStatus('Turnover on downs. CPU gets the ball.');
      resetDrive('cpu');
    } else {
      setStatus('Defense holds! You take over.');
      resetDrive('you');
    }
    updateHud();
    return;
  }

  setStatus(`${getOrdinal(state.down)} & ${state.toGo} — keep pushing.`);
  updateHud();
}

function handleOffense(play) {
  let gain = 0;
  let message = 'Good effort.';

  if (play === 'run') {
    const roll = Math.random();
    gain = roll < 0.2 ? randomBetween(1, 4) : randomBetween(4, 12);
    message = roll < 0.2 ? 'Solid run through the lane.' : 'Power run gains real yardage.';
    if (roll > 0.9) {
      setStatus('Fumble! The defense jumps on it.');
      resetDrive('cpu');
      return;
    }
  }

  if (play === 'pass') {
    const roll = Math.random();
    gain = roll < 0.18 ? randomBetween(0, 4) : randomBetween(6, 24);
    message = gain < 5 ? 'Incomplete pass. Quick reset.' : 'Big-time completion.';
    if (roll > 0.9) {
      setStatus('Intercepted! The defense takes it away.');
      resetDrive('cpu');
      return;
    }
  }

  setStatus(`${message} ${gain} yards gained.`);
  advanceField(gain);
}

function handleDefense(play) {
  const roll = Math.random();

  if (play === 'defend') {
    const outcome = roll < 0.55 ? 0 : randomBetween(2, 9);

    if (outcome === 0) {
      setStatus('Huge stop! You force a turnover on the next snap.');
      resetDrive('you');
      return;
    }

    setStatus(`The defense holds firm for ${outcome} yards.`);
    advanceField(outcome * -1);
    return;
  }

  setStatus('You are defending. Use the defense button to stop the drive.');
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function handlePlay(action) {
  if (!state.started || state.gameOver) return;

  if (state.possession === 'you') {
    handleOffense(action);
    return;
  }

  if (state.possession === 'cpu') {
    handleDefense(action);
  }
}

function tick() {
  if (!state.started || state.gameOver) return;

  state.timer -= 1;

  if (state.timer <= 0) {
    state.timer = 0;
    endGame();
    return;
  }

  updateHud();
}

function drawField() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#1aa75b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);

  for (let i = 0; i <= 10; i += 1) {
    const x = 18 + (i * (canvas.width - 36)) / 10;
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x, canvas.height - 18);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 18);
  ctx.lineTo(canvas.width / 2, canvas.height - 18);
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'center';
  for (let i = 0; i <= 10; i += 1) {
    const x = 18 + (i * (canvas.width - 36)) / 10;
    ctx.fillText(String(i * 10), x, 40);
  }

  const ballX = 18 + (state.fieldPos / 100) * (canvas.width - 36);
  const ballY = canvas.height * 0.42;

  ctx.fillStyle = '#f4f4f4';
  ctx.beginPath();
  ctx.arc(ballX, ballY, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3d77ff';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.28, canvas.height * 0.62, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff5a5a';
  ctx.beginPath();
  ctx.arc(canvas.width * 0.72, canvas.height * 0.52, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(state.selectedTeam.short, canvas.width * 0.28, canvas.height * 0.84);
  ctx.fillText(state.cpuTeam.short, canvas.width * 0.72, canvas.height * 0.74);
}

function startGame() {
  state.started = true;
  state.gameOver = false;
  state.timer = 120;
  state.yourScore = 0;
  state.cpuScore = 0;
  state.fieldPos = 25;
  state.down = 1;
  state.toGo = 10;
  state.possession = 'you';
  buttons.forEach((button) => {
    button.disabled = false;
    button.style.opacity = '1';
  });
  selectedTeamLabel.textContent = state.selectedTeam.name;
  yourTeamLabel.textContent = state.selectedTeam.short;
  showScreen('game');
  setStatus('Choose a play to start the drive.');
  updateHud();
  drawField();
}

function resetToTeams() {
  buttons.forEach((button) => {
    button.disabled = false;
    button.style.opacity = '1';
  });
  state.started = false;
  state.gameOver = false;
  showScreen('team');
  setStatus('Choose a play to start the drive.');
  buildTeamGrid();
  updateHud();
  drawField();
}

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    handlePlay(button.dataset.action);
    drawField();
  });
});

startGameBtn.addEventListener('click', startGame);
resetBtn.addEventListener('click', resetToTeams);

buildTeamGrid();
selectedTeamLabel.textContent = state.selectedTeam.name;
yourTeamLabel.textContent = state.selectedTeam.short;
showScreen('team');
updateHud();
drawField();
setInterval(tick, 1000);
