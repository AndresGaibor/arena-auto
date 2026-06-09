"""Connect modules and set properties"""
import win32com.client
import pythoncom
import time

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = True
model = arena.Models.Add()
mods = model.Modules

panels = arena.Panels
dp = panels.Item(2)

def find_def(panel, name):
    for i in range(1, panel.ModuleDefinitions.Count + 1):
        md = panel.ModuleDefinitions.Item(i)
        if md.Name == name:
            return md
    return None

# Create 3 modules
m1 = mods.Create(dp, find_def(dp, "Create"), 100, 200)
print(f"1. Create module created: {m1}")

m2 = mods.Create(dp, find_def(dp, "Process"), 300, 200)
print(f"2. Process module created: {m2}")

m3 = mods.Create(dp, find_def(dp, "Dispose"), 500, 200)
print(f"3. Dispose module created: {m3}")

time.sleep(1)

# Now try to access modules differently
print(f"\nModules count: {mods.Count}")

# Try different ways to get module properties
for i in range(1, mods.Count + 1):
    m = mods.Item(i)
    print(f"\nModule {i}:")
    try:
        print(f"  _typename_: {m._typename_}")
    except:
        pass
    try:
        print(f"  _username_: {m._username_}")
    except:
        pass
    # Try dynamic dispatch
    try:
        md = win32com.client.dynamic.Dispatch(m)
        print(f"  dynamic dir: {[d for d in dir(md) if not d.startswith('_')][:20]}")
    except Exception as e:
        print(f"  dynamic error: {e}")

# Look at the raw COM interface properties
mod1 = mods.Item(1)
print(f"\nModule 1 raw: {mod1}")
print(f"Module 1 type: {type(mod1)}")

# Try to get ALL properties via type info
print("\n=== Module type library ===")
try:
    ti = mod1._oleobj_.GetTypeInfo()
    ta = ti.GetTypeAttr()
    print(f"Functions: {ta.cFuncs}")
    for i in range(ta.cFuncs):
        try:
            fd = ti.GetFuncDesc(i)
            names = ti.GetNames(fd.memid)
            fn = names[0] if names else "?"
            params = ", ".join(names[1:]) if len(names) > 1 else ""
            print(f"  [{i}] {fn}({params})")
        except:
            pass
except Exception as e:
    print(f"Error: {e}")

# Try connections
print("\n=== Connections ===")
conns = model.Connections
print(f"Connections count: {conns.Count}")
print(f"Connections type: {type(conns)}")

# Try Connnections.Add with module objects
print("\nTrying to connect modules...")
if mods.Count >= 3:
    src = mods.Item(1)
    dst = mods.Item(2)
    print(f"Source: {src}")
    print(f"Dest: {dst}")
    
    # Try Add
    try:
        conn = conns.Add(src, dst)
        print(f"conns.Add: {conn}")
    except Exception as e:
        print(f"conns.Add error: {e}")
    
    # Try Connect
    try:
        conn = conns.Connect(src, dst)
        print(f"conns.Connect: {conn}")
    except Exception as e:
        print(f"conns.Connect error: {e}")
    
    # Try Create
    try:
        conn = conns.Create(src, dst)
        print(f"conns.Create: {conn}")
    except Exception as e:
        print(f"conns.Create error: {e}")

print(f"\nConnections after attempts: {conns.Count}")

# Try SaveAs
print("\n=== Save model ===")
try:
    save_path = r"C:\Users\AndresGaibor\Documents\arena\mcp_test_model.doe"
    model.SaveAs(save_path)
    print(f"Model saved to: {save_path}")
except Exception as e:
    print(f"Save error: {e}")

time.sleep(2)
arena.Quit()
pythoncom.CoUninitialize()
print("DONE")
