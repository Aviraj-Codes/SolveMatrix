class SudokuGame {
    constructor() {
        this.puzzle = [];
        this.solution = [];
        this.currentState = [];
        this.initialState = [];
        this.selectedCell = null;
        this.moveCount = 0;
        this.timerInterval = null;
        this.startTime = null;
        this.difficulty = 'medium';
        this.init();
    }
    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.startNewGame();
    }
    setupEventListeners() {
        document.getElementById('newGameBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('solveBtn').addEventListener('click', () => this.solvePuzzle());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearPuzzle());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
        document.getElementById('difficultySelect').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.startNewGame();
        });
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteSelected()); 
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    async startNewGame() {
        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ difficulty: this.difficulty })
            });
            const data = await response.json();
            this.puzzle = data.puzzle;
            this.solution = data.solution;
            this.currentState = [...this.puzzle];
            this.initialState = [...this.puzzle];
            this.moveCount = 0;
            this.selectedCell = null; 
            document.getElementById('moveCount').textContent = '0';
            this.startTimer();
            this.renderGrid();
            this.updateNumberPad();
        } catch (error) {
            console.error('Error generating puzzle:', error);
        }
    }
    renderGrid() {
        const grid = document.getElementById('sudokuGrid');
        grid.innerHTML = '';
        this.currentState.forEach((value, index) => {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell';
            cell.dataset.index = index;
            if (this.initialState[index] !== 0) {
                cell.classList.add('filled-initial');
            }
            if (value !== 0) {
                cell.textContent = value;
            }
            if (index === this.selectedCell) {
                cell.classList.add('selected');
            }
            // Highlight row, column, and box
            if (this.selectedCell !== null) {
                const selectedRow = Math.floor(this.selectedCell / 9);
                const selectedCol = this.selectedCell % 9;
                const currentRow = Math.floor(index / 9);
                const currentCol = index % 9;
                const selectedBox = Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3);
                const currentBox = Math.floor(currentRow / 3) * 3 + Math.floor(currentCol / 3);
                if (selectedRow === currentRow || selectedCol === currentCol || selectedBox === currentBox) {
                    if (index !== this.selectedCell) {
                        cell.classList.add('highlighted');
                    }
                }
            }
            cell.addEventListener('click', () => this.selectCell(index));
            grid.appendChild(cell);
        });
    }
    selectCell(index) {
        if (this.initialState[index] === 0) {
            this.selectedCell = index;
            this.renderGrid();
            this.updateNumberPad();
        }
    }
    async placeNumber(num) {
        if (this.selectedCell === null || this.initialState[this.selectedCell] !== 0) {
            return;
        }
        this.currentState[this.selectedCell] = num;
        this.moveCount++;
        document.getElementById('moveCount').textContent = this.moveCount;
        this.renderGrid();
        this.updateNumberPad();
        // Check if puzzle is complete
        await this.checkCompletion();
    }
    deleteSelected() {
        if (this.selectedCell === null || this.initialState[this.selectedCell] !== 0) {
            return;
        }
        this.currentState[this.selectedCell] = 0;
        this.moveCount++;
        document.getElementById('moveCount').textContent = this.moveCount;
        this.renderGrid();
        this.updateNumberPad();
    }
    updateNumberPad() {
        const numberPad = document.getElementById('numberPad');   
        if (numberPad.innerHTML === '') {
            for (let i = 1; i <= 9; i++) {
                const btn = document.createElement('button');
                btn.className = 'number-btn';
                btn.textContent = i;
                btn.addEventListener('click', () => this.placeNumber(i));
                numberPad.appendChild(btn);
            }
        }
        // Disable numbers that appear 9 times or are in the same row/col/box
        if (this.selectedCell !== null) {
            const selectedRow = Math.floor(this.selectedCell / 9);
            const selectedCol = this.selectedCell % 9;
            const selectedBox = Math.floor(selectedRow / 3) * 3 + Math.floor(selectedCol / 3);
            for (let i = 1; i <= 9; i++) {
                const btn = numberPad.children[i - 1];
                let count = 0;
                let canPlace = true;
                // Count in row
                for (let j = 0; j < 9; j++) {
                    if (this.currentState[selectedRow * 9 + j] === i) count++;
                }
                // Count in column
                for (let j = 0; j < 9; j++) {
                    if (this.currentState[j * 9 + selectedCol] === i) count++;
                }
                // Count in box
                const boxRowStart = Math.floor(selectedRow / 3) * 3;
                const boxColStart = Math.floor(selectedCol / 3) * 3;
                for (let r = boxRowStart; r < boxRowStart + 3; r++) {
                    for (let c = boxColStart; c < boxColStart + 3; c++) {
                        if (this.currentState[r * 9 + c] === i) count++;
                    }
                }
                btn.disabled = count > 0 || (this.selectedCell !== null && this.initialState[this.selectedCell] !== 0);
            }
        }
    }
    async solvePuzzle() {
        try {
            const response = await fetch('/api/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ puzzle: this.puzzle })
            });
            const data = await response.json();  
            if (data.success) {
                this.currentState = data.solution;
                this.moveCount++;
                document.getElementById('moveCount').textContent = this.moveCount;
                this.renderGrid();
                this.updateNumberPad();
                this.showCompletion();
            }
        } catch (error) {
            console.error('Error solving puzzle:', error);
        }
    }
    clearPuzzle() {
        this.currentState = [...this.initialState];
        this.moveCount = 0;
        this.selectedCell = null;
        document.getElementById('moveCount').textContent = '0';
        this.renderGrid();
        this.updateNumberPad();
    }
    async checkCompletion() {
        try {
            const response = await fetch('/api/check-completion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    puzzle: this.currentState,
                    solution: this.solution
                })
            });
            const data = await response.json();   
            if (data.isComplete) {
                this.showCompletion();
            }
        } catch (error) {
            console.error('Error checking completion:', error);
        }
    }
    showCompletion() {
        clearInterval(this.timerInterval);
        const hours = Math.floor((Date.now() - this.startTime) / 3600000);
        const minutes = Math.floor(((Date.now() - this.startTime) % 3600000) / 60000);
        const seconds = Math.floor(((Date.now() - this.startTime) % 60000) / 1000);
        const timeStr = hours > 0 
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('finalTime').textContent = timeStr;
        document.getElementById('finalMoves').textContent = this.moveCount;
        document.getElementById('completionModal').classList.add('active');
        this.createConfetti();
    }
    startTimer() {
        clearInterval(this.timerInterval);
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.startTime;
            const hours = Math.floor(elapsed / 3600000);
            const minutes = Math.floor((elapsed % 3600000) / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);     
            const timeStr = hours > 0
                ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                : `${minutes}:${seconds.toString().padStart(2, '0')}`;    
            document.getElementById('timer').textContent = timeStr;
        }, 1000);
    }
    handleKeyboard(e) {
        if (this.selectedCell === null) return;
        // Arrow keys for navigation
        const currentRow = Math.floor(this.selectedCell / 9);
        const currentCol = this.selectedCell % 9;
        if (e.key === 'ArrowUp' && currentRow > 0) 
            this.selectCell(this.selectedCell - 9);
        else if (e.key === 'ArrowDown' && currentRow < 8) 
            this.selectCell(this.selectedCell + 9);
        else if (e.key === 'ArrowLeft' && currentCol > 0) 
            this.selectCell(this.selectedCell - 1);
        else if (e.key === 'ArrowRight' && currentCol < 8) 
            this.selectCell(this.selectedCell + 1);
        else if (e.key === 'Delete' || e.key === 'Backspace') 
            this.deleteSelected();
        else if (/^[1-9]$/.test(e.key)) 
            this.placeNumber(parseInt(e.key));
    }
    createConfetti() {
        const container = document.getElementById('confettiContainer');
        const colors = ['#3b82f6', '#14b8a6', '#10b981', '#f59e0b', '#ef4444'];
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.animation = `fall ${2 + Math.random() * 1}s ease-in forwards`;  
            container.appendChild(confetti);
        }
        setTimeout(() => {
            container.innerHTML = '';
        }, 3500);
    }
    toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        if (isDark) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '🌙';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '☀️';
        }
    }
    loadTheme() {
        const theme = localStorage.getItem('theme') || 'light'; 
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
            document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '☀️';
        } else {
            document.getElementById('themeToggle').querySelector('.theme-icon').textContent = '🌙';
        }
    }
}
// Add CSS animation
const style = document.createElement('style');
style.textContent = `
    @keyframes fall {
        to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
// Initialize game
window.startNewGame = () => {
    document.getElementById('completionModal').classList.remove('active');
    game.startNewGame();
};
const game = new SudokuGame();
