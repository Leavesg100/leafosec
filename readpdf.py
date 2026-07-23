import subprocess
import sys

filepath = 'windowsreport3.pdf'

# Try pdftotext first
try:
    result = subprocess.run(['pdftotext', filepath, '-'], capture_output=True, text=True, timeout=10)
    if result.stdout.strip():
        print(result.stdout)
        sys.exit(0)
except:
    pass

# Try python libraries
try:
    import PyPDF2
    reader = PyPDF2.PdfReader(filepath)
    for page in reader.pages:
        print(page.extract_text())
    sys.exit(0)
except:
    pass

try:
    import pdfplumber
    with pdfplumber.open(filepath) as pdf:
        for page in pdf.pages:
            print(page.extract_text())
    sys.exit(0)
except:
    pass

try:
    import pdfminer
except:
    pass

# Last resort - raw text extraction
with open(filepath, 'rb') as f:
    data = f.read()

text = data.decode('latin-1')
# Find text between parentheses (PDF text objects)
import re
matches = re.findall(r'\(([^)]*)\)', text)
for m in matches:
    if len(m) > 5 and all(ord(c) < 128 for c in m):
        print(m)