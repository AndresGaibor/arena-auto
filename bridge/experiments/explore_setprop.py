"""Set properties via Invoke and run the model"""
import win32com.client
import pythoncom
import time
import os

pythoncom.CoInitialize()

arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = False

# Create model
model = arena.Models.Add()
mods = model.Modules
dp = arena.Panels.Item(2)

def find_def(panel, name):
    for i in range(1, panel.ModuleDefinitions.Count + 1):
        md = panel.ModuleDefinitions.Item(i)
        if md.Name == name:
            return md
    return None

# Create 3 modules
mods.Create(dp, find_def(dp, "Create"), 100, 200)
mods.Create(dp, find_def(dp, "Process"), 350, 200)
mods.Create(dp, find_def(dp, "Dispose"), 600, 200)
time.sleep(0.5)

# Find our modules
create_mod = process_mod = dispose_mod = None
for i in range(1, mods.Count + 1):
    m = mods.Item(i)
    if "reate" in m.Caption: create_mod = m
    elif "rocess" in m.Caption: process_mod = m
    elif "ispose" in m.Caption: dispose_mod = m

# Get DISPID for Data property
def get_dispid(obj, prop_name):
    """Get the DISPID for a property"""
    try:
        ti = obj._oleobj_.GetTypeInfo()
        # Look for Data in both get and put variants
        for i in range(ti.GetTypeAttr().cFuncs):
            fd = ti.GetFuncDesc(i)
            names = ti.GetNames(fd.memid)
            if names and names[0] == prop_name:
                memid = fd.memid
                invkind = fd.invkind
                return memid, invkind
    except:
        pass
    return None, None

# Let's try several approaches for setting Data
print("Setting module properties...")

if create_mod:
    # Approach 1: Direct Invoke with DISPID
    try:
        # From type lib: Data(operandName) at [13] is PROPERTYPUT
        # Use DISPID directly
        import win32com.client.util
        
        # Try different ways
        attempts = [
            # 1: Invoke with PROPERTYPUT
            lambda: create_mod._oleobj_.Invoke(13, pythoncom.DISPATCH_PROPERTYPUT, 0, "Generate Parts", "Name"),
            # 2: Invoke with PROPERTYPUT, different param order
            lambda: create_mod._oleobj_.Invoke(13, pythoncom.DISPATCH_PROPERTYPUT, 0, ("Generate Parts", "Name")),
            # 3: Use the DISPID from GetFuncDesc
            lambda: create_mod._oleobj_.Invoke(0x6002000c, pythoncom.DISPATCH_PROPERTYPUT, 0, "Generate Parts", "Name"),
        ]
        
        for i, attempt in enumerate(attempts):
            try:
                result = attempt()
                print(f"  Attempt {i+1}: {result}")
                break
            except Exception as e:
                print(f"  Attempt {i+1} failed: {e}")
    except Exception as e:
        print(f"  All Invoke attempts failed: {e}")
    
    # Approach 2: Try via win32com dynamic dispatch
    try:
        # Late bind
        dynamic = win32com.client.dynamic.Dispatch(create_mod)
        # Try setting Data as a property
        try:
            dynamic.Data = "Test"
            print("  dynamic.Data = 'Test' OK")
        except:
            pass
    except:
        pass
    
    # Approach 3: Try using __setattr__ with the COM object
    try:
        # Set the underlying COM property
        create_mod.__setattr__("Data", "Generate Parts")
        print("  __setattr__ Data = 'Generate Parts' OK")
    except Exception as e:
        print(f"  __setattr__ failed: {e}")

# Check if properties were set
print("\nReading module properties:")
for m in [create_mod, process_mod, dispose_mod]:
    if m:
        print(f"  {m.Caption}:")
        print(f"    Data('Name'): {m.Data('Name')}")
        try:
            print(f"    Data('Entity Type'): {m.Data('Entity Type')}")
        except:
            pass
        try:
            print(f"    Data('Units'): {m.Data('Units')}")
        except:
            pass
        try:
            print(f"    Data('Value'): {m.Data('Value')}")
        except:
            pass

# Now try to run - without closing the model
print("\nRunning model (batch mode)...")
try:
    model.BatchMode = True
    model.QuietMode = True
    model.Go()
    print("  Model ran successfully!")
except Exception as e:
    print(f"  Run error: {e}")
    # Try another approach
    try:
        model.SIMAN.Run()
        print("  SIMAN.Run() succeeded!")
    except Exception as e2:
        print(f"  SIMAN.Run() error: {e2}")

# Save
save_path = r"C:\Users\AndresGaibor\Documents\arena\mcp_working_model_v2.doe"
model.SaveAs(save_path)
print(f"\nSaved: {os.path.getsize(save_path)} bytes")

time.sleep(2)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
