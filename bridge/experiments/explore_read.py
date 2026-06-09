"""Read module data, check connections, inspect saved file"""
import win32com.client
import pythoncom
import time
import os

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = True

# Try opening the saved model
model = arena.Models.Open(r"C:\Users\AndresGaibor\Documents\arena\mcp_test_model.doe")
print(f"Model: {model.Name}")
mods = model.Modules
print(f"Modules: {mods.Count}")

# List all modules with their data
for i in range(1, mods.Count + 1):
    m = mods.Item(i)
    print(f"\n--- Module {i} ---")
    try:
        print(f"  Caption: {m.Caption}")
    except:
        print(f"  Caption: error")
    try:
        print(f"  Definition: {m.Definition}")
    except:
        pass
    
    # Read ToConnections
    try:
        tc = m.ToConnections
        print(f"  ToConnections: {tc.Count}")
        for ci in range(1, tc.Count + 1):
            c = tc.Item(ci)
            print(f"    ToConnection {ci}: {c}")
    except Exception as e:
        print(f"  ToConnections error: {e}")
    
    # Read FromConnections
    try:
        fc = m.FromConnections
        print(f"  FromConnections: {fc.Count}")
        for ci in range(1, fc.Count + 1):
            c = fc.Item(ci)
            print(f"    FromConnection {ci}: {c}")
    except Exception as e:
        print(f"  FromConnections error: {e}")
    
    # Try to read Data (operand values)
    for op_name in ["Name", "Entity Type", "Type", "Value", "Units", 
                     "Expression", "Delay Type", "Allocation", "Hours",
                     "Minutes", "Seconds", "Report Statistics"]:
        try:
            val = m.Data(op_name)
            print(f"  Data('{op_name}'): {val}")
        except:
            pass
    
    # Try to write Data (parameterized property set)
    try:
        # Try win32com pattern for property put with args
        from win32com.client.dynamic import _get_good_object_
        # Use the internal invoke
        data_dispid = 12  # From type lib: Data(operandName) at [12] and [13]
        m._oleobj_.Invoke(data_dispid, 0, pythoncom.DISPATCH_PROPERTYPUT, 0, f"Module_{i}", "Name")
        print(f"  Set Name (via Invoke PROPERTYPUT)")
    except Exception as ex:
        print(f"  Set Name failed: {ex}")
        try:
            m.__setattr__("Data", f"Module_{i}")
            print(f"  Set via __setattr__")
        except:
            pass

# Check full connections
print("\n=== All Connections ===")
conns = model.Connections
print(f"Total connections: {conns.Count}")
for i in range(1, conns.Count + 1):
    c = conns.Item(i)
    print(f"  Connection {i}: {c}")
    try:
        print(f"    Source module: {c.Source}")
    except:
        pass
    try:
        print(f"    Dest module: {c.Destination}")
    except:
        pass

# Try to save with a different name
save_path2 = r"C:\Users\AndresGaibor\Documents\arena\mcp_test_model2.doe"
model.SaveAs(save_path2)
print(f"\nSaved to: {save_path2}")

# Check file sizes
for f in [r"C:\Users\AndresGaibor\Documents\arena\mcp_test_model.doe",
           r"C:\Users\AndresGaibor\Documents\arena\mcp_test_model2.doe"]:
    if os.path.exists(f):
        print(f"  {os.path.basename(f)}: {os.path.getsize(f)} bytes")
    else:
        print(f"  {f}: NOT FOUND")

# Also check the original model
orig = r"C:\Users\AndresGaibor\Documents\arena\prueba.doe"
if os.path.exists(orig):
    print(f"  Original prueba.doe: {os.path.getsize(orig)} bytes")

time.sleep(2)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
