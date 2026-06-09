# Troubleshooting

## COM Errors

### Arena not installed

**Error**: `ARENA_NOT_INSTALLED` — "Cannot find Arena.Application COM class"

**Causes**: Arena Simulation is not installed, or the COM registration is missing.

**Solutions**:
- Verify Arena is installed: Check `C:\Program Files\Rockwell Software\Arena` exists
- Re-register COM: Run Arena once as Administrator to ensure COM registration
- Check for 32/64-bit mismatch: Arena COM is typically 32-bit; the bridge uses Node.js which should match the bitness
- Test COM manually from PowerShell: `New-Object -ComObject Arena.Application`

### Arena not open

**Error**: `ARENA_NOT_OPEN` — "Arena application is not open"

**Causes**: Attempting a model operation (`createModule`, `runModel`, etc.) before calling `arena_open`.

**Solutions**:
- Call `arena_open({ visible: false })` before any model operation
- The `arena_build_model` tool handles this automatically

### Model not open

**Error**: `MODEL_NOT_OPEN` — "No model is currently open"

**Causes**: Attempting module operations before creating or opening a model.

**Solutions**:
- Call `arena_create_new_model` or `arena_open_model` after `arena_open`
- The `arena_build_model` tool handles this automatically

## Bridge Connection Issues

### Bridge process fails to start

**Symptoms**: `BRIDGE_DIED` error, or `callBridge` hangs/times out

**Causes**:
- Node.js not installed or not in PATH
- `winax` native module not built for this Node.js version
- Port conflict (unlikely — uses stdin/stdout)

**Solutions**:
- Verify Node.js is installed: `node --version`
- Reinstall dependencies: `bun install`
- Check winax compatibility: verify Node.js version matches winax requirements
- Test bridge standalone: `node bridge/index.cjs` (then type `{"id":1,"method":"ping"}` and press Enter)

### Bridge times out

**Error**: `TIMEOUT`

**Causes**:
- Arena is busy (e.g., running a simulation modal dialog)
- Very long simulation runs (default timeout is 5 minutes for `runModel`)
- Arena crashed but COM reference still exists

**Solutions**:
- Check if Arena process is stuck in Task Manager (end `Arena.exe`)
- Increase timeout for long simulations: the bridge timeout for `runModel` is already 300s
- Ensure `batchMode: true` and `quietMode: true` are used for unattended runs

### Bridge returns unexpected results

**Causes**:
- Arena dialog or popup blocking COM calls
- Model in an unexpected state

**Solutions**:
- Use `arena_get_model_info` to check model state
- Close and reopen Arena with `arena_close` + `arena_open`

## Workspace / Path Issues

### Path outside workspace

**Error**: `INVALID_PATH` — "Path resolves outside workspace"

**Causes**: File operations (`file_read`, `file_write`, `file_patch`) must reference paths within `ARENA_WORKSPACE`.

**Solutions**:
- Set `ARENA_WORKSPACE` in `.env` to the desired root directory
- Use paths relative to the workspace
- Check the workspace root: `cat .env` or `echo $env:ARENA_WORKSPACE`

### File not found

**Cause**: The path does not exist relative to the workspace root.

**Solutions**:
- Use `file_list` to browse available files
- Verify the path is correct and the file exists

## Common Validation Errors

### "Model must have at least one Create module"

The spec's `flow` array must include at least one module with `type: "create"`.

### "Model must have at least one Dispose module"

The spec's `flow` array must include at least one module with `type: "dispose"`.

### "Duplicate flow module IDs"

All module `id` values in `flow` must be unique. Check for duplicate IDs.

### "Connection references non-existent source/target module"

Each element in `connections` must reference a valid `id` from the `flow` array.

### "Create references non-existent entity"

If `entities` are defined, each Create module's `entity` field must match an entity `id`.

### "Process references non-existent resource"

If `resources` are defined, each Process module's `resource` field must match a resource `id`.

### "EXPO(mean) requires mean > 0"

Distribution parameter validation. Check the `distributions.ts` registry for rules.

### "Decide probability branches sum to X, expected 1"

Probability branches in a Decide module should sum to approximately 1.0.

### "batchSize must be at least 2"

Batch modules require `batchSize >= 2`.

## Arena Version Compatibility

| Arena Version | Status |
|---------------|--------|
| Arena 16.x (2021) | Tested — fully supported |
| Arena 15.x | Likely compatible |
| Arena 14.x | Likely compatible |
| Arena 12.x-13.x | May work with minor issues |
| Arena 10.x-11.x | Untested, may have COM differences |

### Version-specific issues

- **Property naming**: Some property/operand names changed between Arena versions. Use `arena_explore_com` or `arena_list_module_properties` to discover the actual property names on your installed version.
- **Panel names**: Default panel names like `"DiscreteProcessing"` may differ in localized versions of Arena.
- **Batch/Quiet mode**: Older Arena versions may not fully support the `batchMode` parameter.

### Discovering your Arena version

Use `arena_explore_com` which returns version information from the COM object.

## Logging and Diagnostics

### Enable debug logging

Set `LOG_LEVEL=debug` in `.env` to see detailed debug output including all bridge requests/responses.

### Log location

Logs are written to `.arena-auto/logs/YYYY-MM-DD.log` with structured JSON entries:
```json
{"timestamp":"2026-06-09T10:00:00.000Z","level":"info","message":"tool_call","tool":"arena_build_model","args":{...}}
```

### Quick checks

```powershell
# Check TypesScript types
bun run check

# Check bridge syntax
bun run bridge:check

# Run unit tests
bun test

# Verify Arena is accessible
powershell -Command "New-Object -ComObject Arena.Application"
```

## Arena Process Cleanup

If Arena becomes unresponsive or leaves orphaned processes:

1. Open Task Manager (`Ctrl+Shift+Esc`)
2. End all `Arena.exe` processes
3. End any `node.exe` processes running the bridge
4. Restart the MCP server

The `arena_close` tool attempts to clean up gracefully by ending the model and quitting Arena, but forced termination may leave the process running.
