from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import json
from sudoku import SudokuGenerator, SudokuSolver

app = Flask(__name__)
CORS(app)

# Initialize generator and solver
generator = SudokuGenerator()
solver = SudokuSolver()

@app.route('/')
def index():
    """Serve the main game page"""
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_puzzle():
    """Generate a new Sudoku puzzle"""
    data = request.json
    difficulty = data.get('difficulty', 'medium')
    
    puzzle = generator.generate(difficulty)
    solution = generator.solution.copy()
    
    return jsonify({
        'success': True,
        'puzzle': puzzle,
        'solution': solution
    })

@app.route('/api/solve', methods=['POST'])
def solve_puzzle():
    """Solve the current puzzle"""
    data = request.json
    puzzle = data.get('puzzle', [])
    
    if not puzzle or len(puzzle) != 81:
        return jsonify({'success': False, 'error': 'Invalid puzzle'}), 400
    
    # Convert flat list to 9x9 grid
    grid = [puzzle[i:i+9] for i in range(0, 81, 9)]
    
    if solver.solve(grid):
        solution = []
        for row in grid:
            solution.extend(row)
        return jsonify({
            'success': True,
            'solution': solution
        })
    
    return jsonify({'success': False, 'error': 'Puzzle cannot be solved'}), 400

@app.route('/api/validate', methods=['POST'])
def validate_puzzle():
    """Validate if a cell value is correct"""
    data = request.json
    puzzle = data.get('puzzle', [])
    solution = data.get('solution', [])
    index = data.get('index', 0)
    value = data.get('value', 0)
    
    if index < 0 or index >= 81:
        return jsonify({'success': False, 'error': 'Invalid index'}), 400
    
    is_valid = solution[index] == value
    
    return jsonify({
        'success': True,
        'isValid': is_valid,
        'correctValue': solution[index]
    })

@app.route('/api/check-completion', methods=['POST'])
def check_completion():
    """Check if puzzle is completely and correctly solved"""
    data = request.json
    puzzle = data.get('puzzle', [])
    solution = data.get('solution', [])
    
    if len(puzzle) != 81 or len(solution) != 81:
        return jsonify({'success': False}), 400
    
    is_complete = puzzle == solution
    
    return jsonify({
        'success': True,
        'isComplete': is_complete
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)