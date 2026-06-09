"""Complete module creation and connection test"""
import win32com.client
import pythoncom
import time

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = True

model = arena.Models.Add()
mods = model.Modules

panels = arena.Panels
dp = panels.Item(2)  # DiscreteProcessing
dd = panels.Item(1)  # DataDefinition

# Index module definitions
def find_def(panel, name):
    for i in range(1, panel.ModuleDefinitions.Count + 1):
        md = panel.ModuleDefinitions.Item(i)
        if md.Name == name:
            return md
    return None

create_md = find_def(dp, "Create")
process_md = find_def(dp, "Process")
dispose_md = find_def(dp, "Dispose")
decide_md = find_def(dp, "Decide")
assign_md = find_def(dp, "Assign")

# Create modules
print("Creating modules...")
try:
    m1 = mods.Create(dp, create_md, 100, 200)
    print(f"  Create: {m1}")
except Exception as e:
    print(f"  Create failed: {e}")
    m1 = None

try:
    m2 = mods.Create(dp, process_md, 300, 200)
    print(f"  Process: {m2}")
except Exception as e:
    print(f"  Process failed: {e}")
    m2 = None

try:
    m3 = mods.Create(dp, dispose_md, 500, 200)
    print(f"  Dispose: {m3}")
except Exception as e:
    print(f"  Dispose failed: {e}")
    m3 = None

time.sleep(1)
print(f"\nTotal modules: {mods.Count}")

# List all modules
for i in range(1, mods.Count + 1):
    m = mods.Item(i)
    print(f"  Module {i}: {m.Name} (Type: {m.Type}, ID: {m.ID})")

# Try connecting modules
print("\n=== Trying Connections ===")
conns = model.Connections
print(f"Connections object: {dir(conns)}")

# Check Connections type library
ti = conns._oleobj_.GetTypeInfo()
ta = ti.GetTypeAttr()
print(f"Connections functions ({ta.cFuncs}):")
for i in range(ta.cFuncs):
    try:
        fd = ti.GetFuncDesc(i)
        names = ti.GetNames(fd.memid)
        print(f"  [{i}] {names[0]}({', '.join(names[1:])})")
    except:
        pass

# Try to connect modules
print("\n=== Trying to connect ===")
if mods.Count >= 2:
    m1 = mods.Item(1)
    m2 = mods.Item(2)
    
    # Try various connection methods
    attempts = [
        ("conns.Add(m1, m2)", lambda: conns.Add(m1, m2)),
        ("conns.Connect(m1, m2)", lambda: conns.Connect(m1, m2)),
        ("conns.Create(m1, m2)", lambda: conns.Create(m1, m2)),
        ("conns.Insert(m1, m2)", lambda: conns.Insert(m1, m2)),
        ("model.Connections.Add(m1, m2)", lambda: model.Connections.Add(m1, m2)),
    ]
    
    for name, fn in attempts:
        try:
            result = fn()
            print(f"  ✓ {name}: {result}")
        except Exception as e:
            print(f"  ✗ {name}: {e}")
    
    # Try module.Connect method
    print("\n=== Trying module.ConnectTo ===")
    for method_name in ["Connect", "ConnectTo", "LinkTo", "Attach", "AttachTo"]:
        try:
            method = getattr(m1, method_name)
            print(f"  Module.{method_name} exists!")
            try:
                result = method(m2)
                print(f"    Result: {result}")
            except Exception as e:
                print(f"    Error: {e}")
        except AttributeError:
            print(f"  Module.{method_name}: no such method")

# Try to set operands/properties on the Create module
print("\n=== Trying to set module properties ===")
if mods.Count >= 1:
    m = mods.Item(1)
    print(f"Module 1 type: {type(m)}")
    print(f"Module 1 dir: {[d for d in dir(m) if not d.startswith('_')]}")
    
    # Check if we can access/modify operands
    try:
        ops = m.Operands
        print(f"  Operands: {ops}")
        if ops:
            for oi in range(1, ops.Count + 1):
                op = ops.Item(oi)
                print(f"    Operand {oi}: {op.Name} = {op.Value}")
    except Exception as e:
        print(f"  Operands error: {e}")
    
    # Check DataModule
    try:
        dm = m.DataModule
        print(f"  DataModule: {dm}")
        if dm:
            print(f"  DataModule dir: {[d for d in dir(dm) if not d.startswith('_')]}")
    except Exception as e:
        print(f"  DataModule error: {e}")
    
    # Try checking DataModule on the model level
    try:
        for dm_type in ["DataModules", "DataModule"]:
            try:
                dms = getattr(model, dm_type)
                print(f"  Model.{dm_type}: {dms}")
            except:
                pass
    except:
        pass

# Check for VBA
print("\n=== VBA Integration ===")
try:
    vbe = arena.VBE
    print(f"VBE: {vbe}")
    if vbe:
        print(f"VBE dir: {[d for d in dir(vbe) if not d.startswith('_')]}")
except Exception as e:
    print(f"VBE error: {e}")

time.sleep(3)
print(f"\nFinal modules: {mods.Count}")

arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
