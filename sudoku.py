import random
from typing import List
class SudokuSolver:
    """Sudoku puzzle solver using backtracking algorithm"""
    def __init__(self):
        self.grid = None 
    def is_valid(self, grid: List[List[int]], row: int, col: int, num: int) -> bool:
        """Check if placing num at (row, col) is valid"""
        # Check row
        if num in grid[row]:
            return False    
        # Check column
        if num in [grid[i][col] for i in range(9)]:
            return False    
        # Check 3x3 box
        box_row, box_col = 3 * (row // 3), 3 * (col // 3)
        for i in range(box_row, box_row + 3):
            for j in range(box_col, box_col + 3):
                if grid[i][j] == num:
                    return False  
        return True
    def solve(self, grid: List[List[int]]) -> bool:
        """Solve puzzle using backtracking"""
        for row in range(9):
            for col in range(9):
                if grid[row][col] == 0:
                    for num in range(1, 10):
                        if self.is_valid(grid, row, col, num):
                            grid[row][col] = num
                            if self.solve(grid):
                                return True
                            grid[row][col] = 0
                    return False
        return True
    def get_conflicts(self, grid: List[List[int]], row: int, col: int, num: int) -> List[tuple]:
        """Return list of cell coordinates that conflict with the number"""
        conflicts = []    
        # Row conflicts
        for j in range(9):
            if j != col and grid[row][j] == num:
                conflicts.append((row, j))   
        # Column conflicts
        for i in range(9):
            if i != row and grid[i][col] == num:
                conflicts.append((i, col))  
        # Box conflicts
        box_row, box_col = 3 * (row // 3), 3 * (col // 3)
        for i in range(box_row, box_row + 3):
            for j in range(box_col, box_col + 3):
                if (i != row or j != col) and grid[i][j] == num:
                    conflicts.append((i, j))  
        return conflicts

class SudokuGenerator:
    """Generate random Sudoku puzzles with configurable difficulty""" 
    def __init__(self):
        self.solver = SudokuSolver()
        self.solution = []
    def generate_full_grid(self) -> List[List[int]]:
        """Generate a complete valid Sudoku grid"""
        grid = [[0 for _ in range(9)] for _ in range(9)]    
        # Fill diagonal 3x3 boxes (they don't conflict with each other)
        for box in range(3):
            nums = list(range(1, 10))
            random.shuffle(nums)
            for i in range(3):
                for j in range(3):
                    grid[box * 3 + i][box * 3 + j] = nums[i * 3 + j]  
        # Solve the rest
        self.solver.solve(grid)
        return grid
    def remove_numbers(self, grid: List[List[int]], difficulty: str) -> List[List[int]]:
        """Remove numbers based on difficulty"""
        difficulty_map = {
            'easy': 35,      # Remove 35 numbers (46 given)
            'medium': 45,    # Remove 45 numbers (36 given)
            'hard': 53,      # Remove 53 numbers (28 given)
            'expert': 60     # Remove 60 numbers (21 given)
        }
        num_to_remove = difficulty_map.get(difficulty, 45)
        puzzle = [row[:] for row in grid] 
        count = 0
        while count < num_to_remove:
            row = random.randint(0, 8)
            col = random.randint(0, 8)     
            if puzzle[row][col] != 0:
                puzzle[row][col] = 0
                count += 1
        return puzzle
    def generate(self, difficulty: str = 'medium') -> List[int]:
        """Generate a Sudoku puzzle and return as flat list"""
        # Generate complete solution
        grid = self.generate_full_grid()
        self.solution = [cell for row in grid for cell in row]   
        # Remove numbers for puzzle
        puzzle_grid = self.remove_numbers(grid, difficulty)
        puzzle = [cell for row in puzzle_grid for cell in row]  
        return puzzle