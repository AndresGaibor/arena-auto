"""Create a complete working model and run it"""
import win32com.client
import pythoncom
import time
import os

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = False

print("Creating model...")
model = arena.Models.Add()
mods = model.Modules

# Get panels
dp = arena.Panels.Item(2)  # DiscreteProcessing
dd = arena.Panels.Item(1)  # DataDefinition

def find_def(panel, name):
    for i in range(1, panel.ModuleDefinitions.Count + 1):
        md = panel.ModuleDefinitions.Item(i)
        if md.Name == name:
            return md
    return None

# Create modules (order determines auto-connection)
print("Creating Create module...")
m_create = mods.Create(dp, find_def(dp, "Create"), 100, 200)
print(f"  {m_create}")

print("Creating Process module...")
m_process = mods.Create(dp, find_def(dp, "Process"), 350, 200)
print(f"  {m_process}")

print("Creating Dispose module...")
m_dispose = mods.Create(dp, find_def(dp, "Dispose"), 600, 200)
print(f"  {m_dispose}")

time.sleep(1)

# Set properties - try winax-compatible approach
print("\nConfiguring modules...")
# Find our modules by caption
create_mod = None
process_mod = None
dispose_mod = None

for i in range(1, mods.Count + 1):
    m = mods.Item(i)
    cap = m.Caption
    if "reate" in cap:
        create_mod = m
    elif "rocess" in cap:
        process_mod = m
    elif "ispose" in cap:
        dispose_mod = m

# Set Create module: Name = "Generate Parts", Entity Type = "Part"
if create_mod:
    try:
        create_mod.Data("Name", "Generate Parts")
        print("  Create: Name = Generate Parts")
    except Exception as e:
        print(f"  Create Name failed: {e}")
    
    try:
        create_mod.Data("Entity Type", "Part")
        print("  Create: Entity Type = Part")
    except Exception as e:
        print(f"  Create Entity Type failed: {e}")

# Set Process module: Name = "Process Part", Units = "Seconds", Delay Type = "Normal"
if process_mod:
    try:
        process_mod.Data("Name", "Process Part")
        print("  Process: Name = Process Part")
    except Exception as e:
        print(f"  Process Name failed: {e}")

# Check connections
print(f"\nConnections: {model.Connections.Count}")
for i in range(1, model.Connections.Count + 1):
    c = model.Connections.Item(i)
    print(f"  Connection {i}: {c}")

# Read individual module connections
for i in range(1, mods.Count + 1):
    m = mods.Item(i)
    print(f"\nModule {i} ({m.Caption}):")
    try:
        print(f"  ToConnections: {m.ToConnections.Count}")
    except:
        pass
    try:
        print(f"  FromConnections: {m.FromConnections.Count}")
    except:
        pass
    # Read all Data
    for op in ["Name", "Entity Type", "Type", "Delay Type", "Units", "Allocation", "Value", "Expression"]:
        try:
            print(f"  Data('{op}'): {m.Data(op)}")
        except:
            pass

# Save model
save_path = r"C:\Users\AndresGaibor\Documents\arena\mcp_working_model.doe"
model.SaveAs(save_path)
print(f"\nSaved: {os.path.exists(save_path)} ({os.path.getsize(save_path)} bytes)")

# Close and reopen to verify
model.End()

print("\nReopening to verify...")
model2 = arena.Models.Open(save_path)
print(f"Reopened: {model2.Name}, Modules: {model2.Modules.Count}")
for i in range(1, model2.Modules.Count + 1):
    m = model2.Modules.Item(i)
    print(f"  {i}: {m.Caption}")

# Try running
print("\nSetting batch mode and running...")
model2.BatchMode = True
model2.QuietMode = True

import threading
def run_model():
    try:
        model2.Go()
        print("  Model run completed!")
    except Exception as e:
        print(f"  Run error: {e}")

t = threading.Thread(target=run_model, daemon=True)
t.start()
t.join(10)
if t.is_alive():
    print("  Run timed out (might need more time)")

time.sleep(2)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
