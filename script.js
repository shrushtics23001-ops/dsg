// Global Variables
let currentUser = null;
let authToken = null;
let currentDataStructure = null;
let currentLevel = null;
let currentPuzzle = null;
let gameTimer = null;
let gameStartTime = null;
let currentElements = [];
let score = 0;
let moves = 0;

// API Configuration
const API_BASE_URL = 'http://localhost:8000';

// Screen Management
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Authentication Functions
function switchAuthTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    if (tab === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabButtons[0].classList.add('active');
    } else if (tab === 'register') {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabButtons[1].classList.add('active');
    }
}

function guestLogin() {
    // Create a guest user object
    currentUser = {
        id: 0,
        username: 'Guest',
        email: 'guest@example.com',
        total_score: 0,
        level: 1
    };
    authToken = 'guest-token';
    
    // Show success message
    showMessage('authMessage', 'Logged in as Guest! Progress will not be saved.', 'success');
    
    // Show main menu after a short delay
    setTimeout(() => {
        showMainMenu();
    }, 1000);
}

async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                email,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('authMessage', 'Registration successful! Please login.', 'success');
            switchAuthTab('login');
        } else {
            showMessage('authMessage', data.detail || 'Registration failed', 'error');
        }
    } catch (error) {
        showMessage('authMessage', 'Network error. Please try again.', 'error');
    }
}

async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            currentUser = data.user;
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            showMainMenu();
        } else {
            showMessage('authMessage', data.detail || 'Login failed', 'error');
        }
    } catch (error) {
        showMessage('authMessage', 'Network error. Please try again.', 'error');
    }
}

function logout() {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showScreen('authScreen');
}

// Navigation Functions
function showMainMenu() {
    if (currentUser) {
        document.getElementById('username').textContent = currentUser.username;
        document.getElementById('totalScore').textContent = currentUser.total_score;
        document.getElementById('userLevel').textContent = currentUser.level;
    }
    showScreen('mainMenuScreen');
}

function showDataStructureSelection() {
    showScreen('dataStructureScreen');
}

function selectDataStructure(ds) {
    currentDataStructure = ds;
    showLevelSelection();
}

function showLevelSelection() {
    document.getElementById('selectedDS').textContent = currentDataStructure;
    loadLevels();
    showScreen('levelScreen');
}

async function loadLevels() {
    const levelGrid = document.getElementById('levelGrid');
    levelGrid.innerHTML = '<div class="loading"></div>';
    
    // Create 30 levels divided into Easy, Medium, Hard
    const levels = [];
    
    // Easy Levels (1-10)
    for (let i = 1; i <= 10; i++) {
        levels.push({
            number: i,
            difficulty: 'Easy',
            isUnlocked: i === 1, // In real app, check user progress
            bestScore: 0,
            bestTime: '0:00'
        });
    }
    
    // Medium Levels (11-20)
    for (let i = 11; i <= 20; i++) {
        levels.push({
            number: i,
            difficulty: 'Medium',
            isUnlocked: i <= 5, // Unlock first 5 medium levels initially
            bestScore: 0,
            bestTime: '0:00'
        });
    }
    
    // Hard Levels (21-30)
    for (let i = 21; i <= 30; i++) {
        levels.push({
            number: i,
            difficulty: 'Hard',
            isUnlocked: i <= 3, // Unlock first 3 hard levels initially
            bestScore: 0,
            bestTime: '0:00'
        });
    }
    
    levelGrid.innerHTML = '';
    
    // Group levels by difficulty
    const easyLevels = levels.filter(l => l.difficulty === 'Easy');
    const mediumLevels = levels.filter(l => l.difficulty === 'Medium');
    const hardLevels = levels.filter(l => l.difficulty === 'Hard');
    
    // Create difficulty sections
    const easySection = createDifficultySection('Easy', easyLevels);
    const mediumSection = createDifficultySection('Medium', mediumLevels);
    const hardSection = createDifficultySection('Hard', hardLevels);
    
    levelGrid.appendChild(easySection);
    levelGrid.appendChild(mediumSection);
    levelGrid.appendChild(hardSection);
}

function createDifficultySection(difficulty, levels) {
    const section = document.createElement('div');
    section.className = 'difficulty-section';
    
    const header = document.createElement('div');
    header.className = 'difficulty-header';
    header.innerHTML = `
        <h3>${difficulty} Levels</h3>
        <div class="difficulty-stats">
            <span>${levels.filter(l => l.isUnlocked).length}/${levels.length} Unlocked</span>
        </div>
    `;
    
    const levelGrid = document.createElement('div');
    levelGrid.className = 'difficulty-level-grid';
    
    levels.forEach(level => {
        const levelCard = createLevelCard(level);
        levelGrid.appendChild(levelCard);
    });
    
    section.appendChild(header);
    section.appendChild(levelGrid);
    
    return section;
}

function createLevelCard(level) {
    const card = document.createElement('div');
    card.className = `level-card ${!level.isUnlocked ? 'locked' : ''}`;
    
    if (level.isUnlocked) {
        card.onclick = () => startGame(level.number);
    }
    
    card.innerHTML = `
        <div class="level-number">${level.number}</div>
        <div class="level-title">Level ${level.number}</div>
        <div class="level-difficulty difficulty-${level.difficulty.toLowerCase()}">${level.difficulty}</div>
        <div class="level-stats">Best: ${level.bestScore} pts • ${level.bestTime}</div>
        ${!level.isUnlocked ? '<i class="fas fa-lock lock-icon"></i>' : ''}
    `;
    
    return card;
}

async function startGame(level) {
    currentLevel = level;
    score = 0;
    moves = 0;
    gameStartTime = Date.now();
    
    // Generate puzzle based on level and data structure
    currentPuzzle = generatePuzzleForLevel(level, currentDataStructure);
    
    if (currentPuzzle) {
        initializeGame();
        showScreen('gameplayScreen');
        startGameTimer();
    } else {
        alert('No puzzle found for this level');
    }
}

function generatePuzzleForLevel(level, dataStructure) {
    // Generate puzzles based on level and data structure type
    const puzzles = {
        'Stack': generateStackPuzzles(level),
        'Queue': generateQueuePuzzles(level),
        'LinkedList': generateLinkedListPuzzles(level),
        'BinaryTree': generateBinaryTreePuzzles(level),
        'Graph': generateGraphPuzzles(level)
    };
    
    return puzzles[dataStructure] || null;
}

function generateStackPuzzles(level) {
    const puzzles = {
        // Easy Levels (1-10)
        1: {
            id: 'stack_1',
            title: 'Basic Push Operations',
            description: 'Learn to push elements onto the stack',
            initial_state: '[]',
            target_state: '["A", "B", "C"]',
            hint: 'Use PUSH operations to add elements A, B, and C to the stack',
            max_moves: 5
        },
        2: {
            id: 'stack_2',
            title: 'Push and Pop',
            description: 'Practice both push and pop operations',
            initial_state: '["A", "B"]',
            target_state: '["A"]',
            hint: 'Remove one element using POP operation',
            max_moves: 3
        },
        3: {
            id: 'stack_3',
            title: 'Stack Reversal',
            description: 'Reverse the stack using operations',
            initial_state: '["A", "B", "C"]',
            target_state: '["C", "B", "A"]',
            hint: 'Pop all elements and push them back in reverse order',
            max_moves: 8
        },
        4: {
            id: 'stack_4',
            title: 'Stack Manipulation',
            description: 'Manipulate the stack to reach target',
            initial_state: '["X"]',
            target_state: '["X", "Y", "Z"]',
            hint: 'Push Y and Z to the stack',
            max_moves: 3
        },
        5: {
            id: 'stack_5',
            title: 'Empty Stack Challenge',
            description: 'Empty the stack completely',
            initial_state: '["A", "B", "C", "D"]',
            target_state: '[]',
            hint: 'Use POP operations to remove all elements',
            max_moves: 5
        },
        // Medium Levels (11-20)
        11: {
            id: 'stack_11',
            title: 'Complex Reversal',
            description: 'Reverse a longer stack',
            initial_state: '["A", "B", "C", "D", "E"]',
            target_state: '["E", "D", "C", "B", "A"]',
            hint: 'Pop all elements and push them back in reverse order',
            max_moves: 12
        },
        12: {
            id: 'stack_12',
            title: 'Selective Removal',
            description: 'Remove specific elements',
            initial_state: '["A", "B", "C", "D", "E"]',
            target_state: '["A", "C", "E"]',
            hint: 'Remove B and D using POP operations',
            max_moves: 6
        },
        13: {
            id: 'stack_13',
            title: 'Stack Building',
            description: 'Build the target stack from scratch',
            initial_state: '[]',
            target_state: '["X", "Y", "Z", "W"]',
            hint: 'Push elements in the correct order',
            max_moves: 5
        },
        14: {
            id: 'stack_14',
            title: 'Pattern Matching',
            description: 'Create the exact pattern',
            initial_state: '["A"]',
            target_state: '["A", "B", "A", "C"]',
            hint: 'Push B, then A, then C',
            max_moves: 4
        },
        15: {
            id: 'stack_15',
            title: 'Stack Transformation',
            description: 'Transform the stack completely',
            initial_state: '["X", "Y"]',
            target_state: '["A", "B", "C"]',
            hint: 'Remove existing elements and add new ones',
            max_moves: 8
        },
        // Hard Levels (21-30)
        21: {
            id: 'stack_21',
            title: 'Advanced Stack Logic',
            description: 'Complex stack manipulation',
            initial_state: '["A", "B", "C", "D", "E", "F"]',
            target_state: '["C", "D", "E"]',
            hint: 'Remove A, B, F using POP operations',
            max_moves: 10
        },
        22: {
            id: 'stack_22',
            title: 'Perfect Reversal',
            description: 'Reverse with minimal moves',
            initial_state: '["P", "Q", "R", "S", "T", "U"]',
            target_state: '["U", "T", "S", "R", "Q", "P"]',
            hint: 'Find the most efficient way to reverse',
            max_moves: 15
        },
        23: {
            id: 'stack_23',
            title: 'Stack Puzzle Master',
            description: 'Ultimate stack challenge',
            initial_state: '["A", "B", "C"]',
            target_state: '["X", "Y", "Z", "A", "B"]',
            hint: 'Think about the order of operations',
            max_moves: 12
        }
    };
    
    return puzzles[level] || null;
}

function generateQueuePuzzles(level) {
    const puzzles = {
        // Easy Levels (1-10)
        1: {
            id: 'queue_1',
            title: 'Basic Enqueue',
            description: 'Learn to enqueue elements',
            initial_state: '[]',
            target_state: '["A", "B", "C"]',
            hint: 'Use ENQUEUE operations to add elements A, B, and C',
            max_moves: 5
        },
        2: {
            id: 'queue_2',
            title: 'Enqueue and Dequeue',
            description: 'Practice both enqueue and dequeue',
            initial_state: '["A", "B", "C"]',
            target_state: '["B", "C"]',
            hint: 'Remove the front element using DEQUEUE',
            max_moves: 3
        },
        3: {
            id: 'queue_3',
            title: 'Queue Rotation',
            description: 'Rotate the queue elements',
            initial_state: '["A", "B", "C"]',
            target_state: '["B", "C", "A"]',
            hint: 'Dequeue A, then enqueue A at the rear',
            max_moves: 4
        },
        // Medium Levels (11-20)
        11: {
            id: 'queue_11',
            title: 'Complex Queue Operations',
            description: 'Multiple enqueue and dequeue operations',
            initial_state: '["A", "B"]',
            target_state: '["B", "C", "D"]',
            hint: 'Dequeue A, enqueue C and D',
            max_moves: 6
        },
        12: {
            id: 'queue_12',
            title: 'Queue Building',
            description: 'Build target queue from current',
            initial_state: '["X"]',
            target_state: '["X", "Y", "Z", "W"]',
            hint: 'Enqueue Y, Z, and W in order',
            max_moves: 4
        },
        // Hard Levels (21-30)
        21: {
            id: 'queue_21',
            title: 'Advanced Queue Logic',
            description: 'Complex queue manipulation',
            initial_state: '["A", "B", "C", "D"]',
            target_state: '["C", "D", "E"]',
            hint: 'Dequeue A and B, then enqueue E',
            max_moves: 8
        },
        22: {
            id: 'queue_22',
            title: 'Queue Transformation',
            description: 'Transform queue completely',
            initial_state: '["X", "Y"]',
            target_state: '["A", "B", "C", "D"]',
            hint: 'Remove existing elements and add new ones',
            max_moves: 10
        }
    };
    
    return puzzles[level] || null;
}

function generateLinkedListPuzzles(level) {
    const puzzles = {
        // Easy Levels (1-10)
        1: {
            id: 'll_1',
            title: 'Basic Insertion',
            description: 'Learn to insert elements',
            initial_state: '[]',
            target_state: '["A", "B", "C"]',
            hint: 'Use INSERT operations to add elements at positions 0, 1, and 2',
            max_moves: 5
        },
        2: {
            id: 'll_2',
            title: 'Insert and Delete',
            description: 'Practice both insert and delete',
            initial_state: '["A", "B", "C"]',
            target_state: '["A", "C"]',
            hint: 'Delete the element at position 1',
            max_moves: 3
        },
        3: {
            id: 'll_3',
            title: 'List Reversal',
            description: 'Reverse the linked list',
            initial_state: '["A", "B", "C"]',
            target_state: '["C", "B", "A"]',
            hint: 'Delete all elements and insert them in reverse order',
            max_moves: 8
        },
        // Medium Levels (11-20)
        11: {
            id: 'll_11',
            title: 'Complex List Operations',
            description: 'Multiple insertions and deletions',
            initial_state: '["A", "B"]',
            target_state: '["X", "A", "Y", "B"]',
            hint: 'Insert X at position 0, Y at position 2',
            max_moves: 6
        },
        12: {
            id: 'll_12',
            title: 'List Building',
            description: 'Build target list from scratch',
            initial_state: '[]',
            target_state: '["P", "Q", "R", "S"]',
            hint: 'Insert elements in the correct order',
            max_moves: 5
        },
        // Hard Levels (21-30)
        21: {
            id: 'll_21',
            title: 'Advanced List Logic',
            description: 'Complex linked list manipulation',
            initial_state: '["A", "B", "C", "D"]',
            target_state: '["B", "C", "E"]',
            hint: 'Delete A and D, insert E at position 2',
            max_moves: 8
        },
        22: {
            id: 'll_22',
            title: 'List Transformation',
            description: 'Transform list completely',
            initial_state: '["X", "Y"]',
            target_state: '["A", "B", "C", "D", "E"]',
            hint: 'Remove existing elements and build new list',
            max_moves: 12
        }
    };
    
    return puzzles[level] || null;
}

function generateBinaryTreePuzzles(level) {
    return {
        id: 'tree_' + level,
        title: 'Binary Tree Puzzle ' + level,
        description: 'Binary tree operations coming soon!',
        initial_state: '[]',
        target_state: '[]',
        hint: 'Binary tree visualization will be available soon',
        max_moves: 10
    };
}

function generateGraphPuzzles(level) {
    return {
        id: 'graph_' + level,
        title: 'Graph Puzzle ' + level,
        description: 'Graph operations coming soon!',
        initial_state: '[]',
        target_state: '[]',
        hint: 'Graph visualization will be available soon',
        max_moves: 10
    };
}

function initializeGame() {
    // Update game header
    document.getElementById('gameTitle').textContent = `${currentDataStructure} - Level ${currentLevel}`;
    document.getElementById('gameScore').textContent = score;
    document.getElementById('gameMoves').textContent = moves;
    
    // Update puzzle description
    document.getElementById('puzzleTitle').textContent = currentPuzzle.title;
    document.getElementById('puzzleDescription').textContent = currentPuzzle.description;
    document.getElementById('targetState').textContent = currentPuzzle.target_state;
    
    // Parse initial state
    currentElements = parseState(currentPuzzle.initial_state);
    
    // Render data structure and controls
    renderDataStructure();
    renderControls();
}

function parseState(stateString) {
    try {
        return JSON.parse(stateString);
    } catch {
        return stateString.replace(/[\[\]]/g, '').split(',').filter(s => s.trim());
    }
}

function renderDataStructure() {
    const viz = document.getElementById('dataStructureViz');
    
    switch (currentDataStructure) {
        case 'Stack':
            renderStack(viz);
            break;
        case 'Queue':
            renderQueue(viz);
            break;
        case 'LinkedList':
            renderLinkedList(viz);
            break;
        default:
            viz.innerHTML = `<p>${currentDataStructure} visualization coming soon!</p>`;
    }
}

function renderStack(container) {
    const stackHTML = `
        <div class="stack-viz">
            ${currentElements.slice().reverse().map((el, index) => 
                `<div class="stack-element">${el}</div>`
            ).join('')}
            <div class="stack-pointer">TOP ↑</div>
        </div>
    `;
    container.innerHTML = stackHTML;
}

function renderQueue(container) {
    const queueHTML = `
        <div class="queue-viz">
            <div class="queue-pointer">FRONT →</div>
            ${currentElements.map(el => 
                `<div class="queue-element">${el}</div>`
            ).join('')}
            <div class="queue-pointer">← REAR</div>
        </div>
    `;
    container.innerHTML = queueHTML;
}

function renderLinkedList(container) {
    const llHTML = `
        <div class="linkedlist-viz">
            <div class="queue-pointer">HEAD →</div>
            ${currentElements.map((el, index) => 
                `<div class="ll-node">${el}</div>
                ${index < currentElements.length - 1 ? '<div class="ll-arrow">→</div>' : '<div class="ll-arrow">NULL</div>'}`
            ).join('')}
        </div>
    `;
    container.innerHTML = llHTML;
}

function renderControls() {
    const controls = document.getElementById('operationControls');
    
    switch (currentDataStructure) {
        case 'Stack':
            controls.innerHTML = `
                <div class="control-group">
                    <input type="text" id="pushValue" placeholder="Value">
                    <button class="btn-operation" onclick="performOperation('PUSH')">PUSH</button>
                </div>
                <div class="control-group">
                    <button class="btn-operation" onclick="performOperation('POP')">POP</button>
                    <button class="btn-secondary" onclick="performOperation('PEEK')">PEEK</button>
                </div>
            `;
            break;
        case 'Queue':
            controls.innerHTML = `
                <div class="control-group">
                    <input type="text" id="enqueueValue" placeholder="Value">
                    <button class="btn-operation" onclick="performOperation('ENQUEUE')">ENQUEUE</button>
                </div>
                <div class="control-group">
                    <button class="btn-operation" onclick="performOperation('DEQUEUE')">DEQUEUE</button>
                    <button class="btn-secondary" onclick="performOperation('FRONT')">FRONT</button>
                    <button class="btn-secondary" onclick="performOperation('REAR')">REAR</button>
                </div>
            `;
            break;
        case 'LinkedList':
            controls.innerHTML = `
                <div class="control-group">
                    <input type="text" id="insertValue" placeholder="Value">
                    <input type="number" id="insertPosition" placeholder="Pos" value="0" min="0">
                    <button class="btn-operation" onclick="performOperation('INSERT')">INSERT</button>
                </div>
                <div class="control-group">
                    <input type="number" id="deletePosition" placeholder="Pos" value="0" min="0">
                    <button class="btn-operation" onclick="performOperation('DELETE')">DELETE</button>
                </div>
                <div class="control-group">
                    <input type="text" id="searchValue" placeholder="Search">
                    <button class="btn-secondary" onclick="performOperation('SEARCH')">SEARCH</button>
                    <button class="btn-secondary" onclick="performOperation('TRAVERSE')">TRAVERSE</button>
                </div>
            `;
            break;
        default:
            controls.innerHTML = '<p>Controls coming soon!</p>';
    }
}

function performOperation(operation) {
    moves++;
    document.getElementById('gameMoves').textContent = moves;
    
    let value = '';
    let position = -1;
    
    switch (operation) {
        case 'PUSH':
            value = document.getElementById('pushValue').value;
            if (!value) {
                showFeedback('Please enter a value to push', false);
                moves--;
                return;
            }
            currentElements.push(value);
            document.getElementById('pushValue').value = '';
            score += 10;
            break;
            
        case 'POP':
            if (currentElements.length === 0) {
                showFeedback('Stack is empty - cannot pop', false);
                moves--;
                return;
            }
            currentElements.pop();
            score += 15;
            break;
            
        case 'PEEK':
            if (currentElements.length === 0) {
                showFeedback('Stack is empty', false);
                moves--;
                return;
            }
            showFeedback(`Top element: ${currentElements[currentElements.length - 1]}`, true);
            score += 5;
            break;
            
        case 'ENQUEUE':
            value = document.getElementById('enqueueValue').value;
            if (!value) {
                showFeedback('Please enter a value to enqueue', false);
                moves--;
                return;
            }
            currentElements.push(value);
            document.getElementById('enqueueValue').value = '';
            score += 10;
            break;
            
        case 'DEQUEUE':
            if (currentElements.length === 0) {
                showFeedback('Queue is empty - cannot dequeue', false);
                moves--;
                return;
            }
            currentElements.shift();
            score += 15;
            break;
            
        case 'FRONT':
            if (currentElements.length === 0) {
                showFeedback('Queue is empty', false);
                moves--;
                return;
            }
            showFeedback(`Front element: ${currentElements[0]}`, true);
            score += 5;
            break;
            
        case 'REAR':
            if (currentElements.length === 0) {
                showFeedback('Queue is empty', false);
                moves--;
                return;
            }
            showFeedback(`Rear element: ${currentElements[currentElements.length - 1]}`, true);
            score += 5;
            break;
            
        case 'INSERT':
            value = document.getElementById('insertValue').value;
            position = parseInt(document.getElementById('insertPosition').value) || 0;
            if (!value) {
                showFeedback('Please enter a value to insert', false);
                moves--;
                return;
            }
            currentElements.splice(position, 0, value);
            document.getElementById('insertValue').value = '';
            score += 10;
            break;
            
        case 'DELETE':
            position = parseInt(document.getElementById('deletePosition').value) || 0;
            if (currentElements.length === 0) {
                showFeedback('Linked list is empty - cannot delete', false);
                moves--;
                return;
            }
            if (position >= currentElements.length) {
                position = currentElements.length - 1;
            }
            currentElements.splice(position, 1);
            score += 15;
            break;
            
        case 'SEARCH':
            value = document.getElementById('searchValue').value;
            if (!value) {
                showFeedback('Please enter a value to search', false);
                moves--;
                return;
            }
            const index = currentElements.indexOf(value);
            if (index >= 0) {
                showFeedback(`Found "${value}" at position ${index}`, true);
            } else {
                showFeedback(`"${value}" not found in the list`, false);
            }
            document.getElementById('searchValue').value = '';
            score += 5;
            break;
            
        case 'TRAVERSE':
            showFeedback(`Current list: [${currentElements.join(', ')}]`, true);
            score += 5;
            break;
    }
    
    document.getElementById('gameScore').textContent = score;
    renderDataStructure();
    checkWinCondition();
}

function checkWinCondition() {
    const targetElements = parseState(currentPuzzle.target_state);
    
    if (JSON.stringify(currentElements) === JSON.stringify(targetElements)) {
        clearInterval(gameTimer);
        showFeedback('🎉 Puzzle Complete! Excellent work!', true);
        
        // Save game session
        saveGameSession(true);
        
        // Show completion options
        setTimeout(() => {
            if (confirm('Congratulations! Would you like to play the next level?')) {
                startGame(currentLevel + 1);
            } else {
                showLevelSelection();
            }
        }, 2000);
    }
}

function saveGameSession(completed) {
    // Don't save sessions for guest users
    if (authToken === 'guest-token') {
        return;
    }
    
    const timeTaken = Math.floor((Date.now() - gameStartTime) / 1000);
    
    apiCall('/api/game/session', 'POST', {
        data_structure_type: currentDataStructure,
        level: currentLevel,
        score: score,
        moves: moves,
        time_taken: timeTaken,
        completed: completed
    });
}

function toggleHint() {
    const hintBox = document.getElementById('hintBox');
    if (hintBox.style.display === 'none') {
        document.getElementById('hintText').textContent = currentPuzzle.hint || 'No hint available for this puzzle.';
        hintBox.style.display = 'flex';
        score = Math.max(0, score - 5); // Deduct points for using hint
        document.getElementById('gameScore').textContent = score;
    } else {
        hintBox.style.display = 'none';
    }
}

function resetGame() {
    if (confirm('Are you sure you want to reset this puzzle?')) {
        initializeGame();
        startGameTimer();
    }
}

function clearFeedback() {
    document.getElementById('feedbackBox').style.display = 'none';
}

function showFeedback(message, isSuccess) {
    const feedbackBox = document.getElementById('feedbackBox');
    const feedbackText = document.getElementById('feedbackText');
    
    feedbackBox.className = `feedback-box ${isSuccess ? 'success' : 'error'}`;
    feedbackText.textContent = message;
    feedbackBox.style.display = 'flex';
    
    setTimeout(() => {
        feedbackBox.style.display = 'none';
    }, 5000);
}

function startGameTimer() {
    clearInterval(gameTimer);
    gameStartTime = Date.now();
    
    gameTimer = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameStartTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('gameTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Progress Screen
async function showProgress() {
    showScreen('progressScreen');
    loadProgress();
}

async function loadProgress() {
    // Don't load progress for guest users
    if (authToken === 'guest-token') {
        document.getElementById('progressTotalScore').textContent = '0';
        document.getElementById('progressLevel').textContent = '1';
        document.getElementById('progressGames').textContent = 'Guest Mode';
        
        const container = document.getElementById('progressByDS');
        container.innerHTML = '<p style="text-align: center; color: #666;">Progress tracking is not available in guest mode. Please register or login to save your progress.</p>';
        return;
    }
    
    try {
        const response = await apiCall('/api/user/progress');
        const progress = response;
        
        // Update overall stats
        document.getElementById('progressTotalScore').textContent = currentUser.total_score;
        document.getElementById('progressLevel').textContent = currentUser.level;
        document.getElementById('progressGames').textContent = '0'; // Calculate from sessions
        
        // Group progress by data structure
        const progressByDS = {};
        progress.forEach(p => {
            if (!progressByDS[p.data_structure_type]) {
                progressByDS[p.data_structure_type] = [];
            }
            progressByDS[p.data_structure_type].push(p);
        });
        
        renderProgressByDS(progressByDS);
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

function renderProgressByDS(progressByDS) {
    const container = document.getElementById('progressByDS');
    container.innerHTML = '';
    
    Object.entries(progressByDS).forEach(([dsType, progressList]) => {
        const completedLevels = progressList.filter(p => p.completed).length;
        const totalLevels = progressList.length;
        const progressPercentage = (completedLevels / totalLevels) * 100;
        
        const dsProgress = document.createElement('div');
        dsProgress.className = 'ds-progress';
        dsProgress.innerHTML = `
            <h4>${dsType}</h4>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="level-progress-list">
                ${progressList.map(p => `
                    <div class="level-progress-item ${p.completed ? 'completed' : ''}">
                        Level ${p.level}
                        ${p.completed ? '✓' : ''}
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(dsProgress);
    });
}

// Instructions Screen
function showInstructions() {
    showScreen('instructionsScreen');
}

// Leaderboard Screen
async function showLeaderboard() {
    showScreen('leaderboardScreen');
    loadLeaderboard('all');
}

async function loadLeaderboard(dataStructure = 'all') {
    // Don't load leaderboard for guest users (show demo data)
    if (authToken === 'guest-token') {
        const demoEntries = [
            {
                username: 'Alice',
                total_score: 2500,
                level: 5,
                games_played: 25,
                avg_score: 100.0
            },
            {
                username: 'Bob',
                total_score: 2100,
                level: 4,
                games_played: 20,
                avg_score: 105.0
            },
            {
                username: 'Charlie',
                total_score: 1800,
                level: 4,
                games_played: 18,
                avg_score: 100.0
            },
            {
                username: 'Diana',
                total_score: 1500,
                level: 3,
                games_played: 15,
                avg_score: 100.0
            },
            {
                username: 'Eve',
                total_score: 1200,
                level: 3,
                games_played: 12,
                avg_score: 100.0
            }
        ];
        
        renderLeaderboard(demoEntries);
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (dataStructure === 'all' && btn.textContent === 'All') {
                btn.classList.add('active');
            }
        });
        return;
    }
    
    try {
        const response = await apiCall('/api/leaderboard', 'GET', null, {
            data_structure_type: dataStructure === 'all' ? null : dataStructure
        });
        
        renderLeaderboard(response);
        
        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.textContent.toLowerCase().includes(dataStructure.toLowerCase()) || 
                (dataStructure === 'all' && btn.textContent === 'All')) {
                btn.classList.add('active');
            }
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

function renderLeaderboard(entries) {
    const container = document.getElementById('leaderboardList');
    container.innerHTML = '';
    
    if (entries.length === 0) {
        container.innerHTML = '<p>No leaderboard data available</p>';
        return;
    }
    
    entries.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'leaderboard-entry';
        entryDiv.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${entry.username}</div>
                <div class="leaderboard-details">
                    Level ${entry.level} • ${entry.games_played} games
                </div>
            </div>
            <div class="leaderboard-score">
                <div class="score-main">${entry.total_score}</div>
                <div class="score-details">Avg: ${entry.avg_score.toFixed(1)}</div>
            </div>
        `;
        container.appendChild(entryDiv);
    });
}

// Utility Functions
function showMessage(elementId, message, type) {
    const messageElement = document.getElementById(elementId);
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    
    setTimeout(() => {
        messageElement.textContent = '';
        messageElement.className = 'message';
    }, 5000);
}

async function apiCall(endpoint, method = 'GET', data = null, params = null) {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                url.searchParams.append(key, value);
            }
        });
    }
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (authToken) {
        options.headers.Authorization = `Bearer ${authToken}`;
    }
    
    if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
    }
    
    const response = await fetch(url.toString(), options);
    
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Check for existing session
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showMainMenu();
    } else {
        showScreen('authScreen');
    }
    
    // Authentication forms
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        login(username, password);
    });
    
    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        register(username, email, password);
    });
    
    // Clear feedback on input
    document.addEventListener('input', function(e) {
        if (e.target.matches('input')) {
            clearFeedback();
        }
    });
});
