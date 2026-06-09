"""Try Modules.Create to add modules to Arena model"""
import win32com.client
import pythoncom

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = True  # Make visible to see what happens

# Create a new model
models = arena.Models
print(f"Existing models: {models.Count}")

# Add a new model
model = models.Add()
print(f"New model: {model.Name}")
print(f"Modules count: {model.Modules.Count}")

# Try Modules.Create with various parameters
mods = model.Modules

# First, let's see what panels are available
print("\n=== Exploring Panels ===")
try:
    # Arena.Application.Panels might be different from Model.Panels
    panels = arena.Panels
    print(f"arena.Panels: {panels}")
    print(f"arena.Panels Count: {panels.Count}")
    for pi in range(1, min(panels.Count + 1, 20)):
        p = panels.Item(pi)
        print(f"  Panel {pi}: {p.Name}")
        
        # Try to access ModuleDefinitions
        try:
            mdefs = p.ModuleDefinitions
            print(f"    ModuleDefinitions Count: {mdefs.Count}")
            for mi in range(1, min(mdefs.Count + 1, 10)):
                md = mdefs.Item(mi)
                print(f"      [{mi}] {md.Name}")
        except Exception as e:
            print(f"    ModuleDefinitions error: {e}")
except Exception as e:
    print(f"Panels error: {e}")

# Try model.Panels too
print("\n=== Model.Panels ===")
try:
    model_panels = model.Panels
    print(f"model.Panels: {model_panels}")
    if model_panels:
        print(f"model.Panels Count: {model_panels.Count}")
        for pi in range(1, min(model_panels.Count + 1, 20)):
            p = model_panels.Item(pi)
            print(f"  Panel {pi}: {p.Name}")
except Exception as e:
    print(f"model.Panels error: {e}")

# NOW try Modules.Create
print("\n=== Trying Modules.Create ===")
# Try different parameter combinations
attempts = [
    ("Create(1, 'Create', 100, 200)", lambda: mods.Create(1, "Create", 100, 200)),
    ("Create('Basic Process', 'Create', 100, 200)", lambda: mods.Create("Basic Process", "Create", 100, 200)),
    ("Create(1, 1, 100, 200)", lambda: mods.Create(1, 1, 100, 200)),
]

for name, fn in attempts:
    try:
        result = fn()
        print(f"  ✓ {name}: {result}")
    except Exception as e:
        print(f"  ✗ {name}: {type(e).__name__}: {e}")

# Wait for user to see the result
import time
time.sleep(3)

print(f"\nFinal modules count: {model.Modules.Count}")
if model.Modules.Count > 0:
    for i in range(1, model.Modules.Count + 1):
        m = model.Modules.Item(i)
        print(f"  Module {i}: {m.Name} (Type: {m.Type})")

# Cleanup
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
