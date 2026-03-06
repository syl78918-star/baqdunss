
# Script to delete lines 115-150 from index.html (1-based index)
# Lines in array are 0-based. So index 114 to 150.
# Wait, 115 is index 114.
# 150 is index 149.
# So delete slice [114:150] (creates new list without those).

filename = r'c:\Users\Quick Mobile\OneDrive - just.edu.jo\Desktop\موقع بقدونس\index.html'

with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Check context to be sure
print(f"Deleting lines 115-150. Line 115: {lines[114].strip()}")
print(f"Line 150: {lines[149].strip()}")

if "<li></li>" in lines[114] and "</ul>" in lines[149]:
    new_lines = lines[:114] + lines[150:] 
    with open(filename, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("Success")
else:
    print("Error: Lines did not match expected content")
