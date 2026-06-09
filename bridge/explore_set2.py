"""Try _ApplyTypes_ and also test via Node.js winax bridge approach"""
import win32com.client
import pythoncom
import time

pythoncom.CoInitialize()
arena = win32com.client.Dispatch("Arena.Application")
arena.Visible = False
model = arena.Models.Add()
mods = model.Modules
dp = arena.Panels.Item(2)

def find_def(panel, name):
    for i in range(1, panel.ModuleDefinitions.Count + 1):
        md = panel.ModuleDefinitions.Item(i)
        if md.Name == name:
            return md
    return None

mods.Create(dp, find_def(dp, "Create"), 100, 200)
time.sleep(0.5)
m = mods.Item(1)

print(f"Module: {m.Caption}")
print(f"Name before: {m.Data('Name')}")

DATA_DISPID = 1610743813

# Try _ApplyTypes_ with correct args
# _ApplyTypes_(dispid, wFlags, retType, argFlags, *args)
# retType: None for void, or a type
# argFlags: None or a tuple of flags (one per arg)

print("\n=== _ApplyTypes_ variants ===")

# Variant 1: No retType, no argFlags
try:
    result = m._ApplyTypes_(DATA_DISPID, pythoncom.DISPATCH_PROPERTYPUT, None, None, "Name", "NewCreateName")
    print(f"  V1: {result}")
except Exception as e:
    print(f"  V1 error: {e}")

print(f"  Name: {m.Data('Name')}")

# Variant 2: With argFlags tuple
try:
    result = m._ApplyTypes_(DATA_DISPID, pythoncom.DISPATCH_PROPERTYPUT, None, (pythoncom.DISPATCH_PROPERTYPUT,), "NewCreateName", "Name")
    print(f"  V2: {result}")
except Exception as e:
    print(f"  V2 error: {e}")

print(f"  Name: {m.Data('Name')}")

# Variant 3: Different arg order (COM reversed)
try:
    result = m._ApplyTypes_(DATA_DISPID, pythoncom.DISPATCH_PROPERTYPUT, None, None, "NewCreateName", "Name")
    print(f"  V3: {result}")
except Exception as e:
    print(f"  V3 error: {e}")

print(f"  Name: {m.Data('Name')}")

# Check what GetIDsOfNames returns
try:
    ids = m._oleobj_.GetIDsOfNames("Data", 1)
    print(f"\nGetIDsOfNames('Data'): {ids}")
    # This returns a DISPID
except Exception as e:
    print(f"\nGetIDsOfNames error: {e}")

# Check if there's a Property object or similar
for prop in ["Properties", "Property", "Operands", "Operand", "Attributes", "Config"]:
    try:
        val = getattr(m, prop)
        print(f"\n{prop}: {val}")
        if val:
            print(f"  Count: {val.Count if hasattr(val, 'Count') else 'N/A'}")
            print(f"  Dir: {[p for p in dir(val) if not p.startswith('_')]}")
    except:
        print(f"\n{prop}: not available")

# Check _get_good_object_ usage
from win32com.client.dynamic import _get_good_object_

# Get DISPID via GetIDsOfNames
try:
    # Call the low-level dispatch
    data_disp = m._oleobj_.GetIDsOfNames("Data", 1)
    print(f"\nData DISPID from GetIDsOfNames: {data_disp}")
    
    if data_disp:
        disp_id = data_disp[0]
        # Try PROPERTYPUT via Invoke with proper DISPPARAMS
        import win32com.client.util
        
        # In win32com, Invoke expects (dispid, lcid, wFlags, dispparams)
        # dispparams can be created with pythoncom.DISPPARAMS
        class PyDISPPARAMS:
            """Simple DISPPARAMS wrapper"""
            def __init__(self, args, named_args=None):
                self.rgvarg = args
                self.cArgs = len(args)
                self.rgdispidNamedArgs = named_args or []
                self.cNamedArgs = len(self.rgdispidNamedArgs)
        
        # For Data("Name", "NewValue"): 
        # rgvarg = ["NewValue", "Name"]  (reversed for COM)
        # Wait, the exact meaning depends on how win32com maps things
        # In some implementations, rgvarg order is: last param first
        
        # Actually, for COM:
        # Function signature: Data(operandName) 
        # For PUT: Data("Name") = "NewValue"
        # DISPPARAMS.rgvarg[0] = value to set ("NewValue")  
        # DISPPARAMS.rgvarg[1] = operand name ("Name")
        # Or vice versa? Let's check:
        
        # Try both orders with the Invoke that takes DISPPARAMS
        # Actually, _oleobj_.Invoke takes a different form in win32com:
        # Invoke(dispId, lcid, wFlags, args)
        # Where args is just a tuple, and it internally builds DISPPARAMS
        
        # Looking at the source:
        # def Invoke(self, dispid, lcid, wFlags, *args):
        # Actually it might be: Invoke(dispid, lcid, wFlags, args_tuple)
        
        # Let me check with Print:
        print(f"\nTrying Invoke with tuple args")
        for param_order in [
            ("N1", "Name"),   # value first, param second
            ("Name", "N2"),   # param first, value second  
        ]:
            try:
                result = m._oleobj_.Invoke(disp_id, pythoncom.DISPATCH_PROPERTYPUT, 0, param_order)
                print(f"  Order {param_order}: {result}")
            except Exception as e:
                print(f"  Order {param_order}: {e}")
        
        print(f"  Final Name: {m.Data('Name')}")
        
except Exception as e:
    print(f"\nInvoke with GetIDsOfNames error: {e}")

time.sleep(1)
arena.Quit()
pythoncom.CoUninitialize()
print("\nDONE")
