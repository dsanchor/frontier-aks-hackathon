import os
import re

def check_files():
    challenges = [f for f in os.listdir('Student') if f.startswith('Challenge-')]
    solutions = [f for f in os.listdir('Coach/Solutions') if f.startswith('Solution-')]
    
    c_names = set([c.replace('Challenge-', '').replace('.md', '') for c in challenges])
    s_names = set([s.replace('Solution-', '').replace('.md', '') for s in solutions])
    
    missing_s = c_names - s_names
    missing_c = s_names - c_names
    
    if missing_s:
        print(f"Missing solutions for challenges: {missing_s}")
    if missing_c:
        print(f"Missing challenges for solutions: {missing_c}")

check_files()
