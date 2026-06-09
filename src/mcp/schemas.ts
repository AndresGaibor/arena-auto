export const toolSchemas = {
  arena_open: {
    type: "object" as const,
    properties: {
      visible: { type: "boolean" as const, description: "Make Arena window visible", default: false },
    },
  },

  arena_close: {
    type: "object" as const,
    properties: {},
  },

  arena_open_model: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "Full path to .doe file" },
    },
    required: ["path"],
  },

  arena_close_model: {
    type: "object" as const,
    properties: {},
  },

  arena_create_new_model: {
    type: "object" as const,
    properties: {},
  },

  arena_create_module: {
    type: "object" as const,
    properties: {
      panelName: { type: "string" as const, description: "Panel name: DiscreteProcessing, DataDefinition, Decisions, InputOutput, etc.", default: "DiscreteProcessing" },
      moduleName: { type: "string" as const, description: "Module type: Create, Process, Dispose, Decide, Assign, etc." },
      x: { type: "number" as const, description: "X position on canvas", default: 100 },
      y: { type: "number" as const, description: "Y position on canvas", default: 200 },
    },
    required: ["moduleName"],
  },

  arena_set_module_property: {
    type: "object" as const,
    properties: {
      caption: { type: "string" as const, description: "Module caption (e.g. 'Create 1', 'Process 1')" },
      property: { type: "string" as const, description: "Property/operand name (e.g. 'Name', 'Entity Type', 'Value', 'Units')" },
      value: { type: "string" as const, description: "New value" },
    },
    required: ["caption", "property", "value"],
  },

  arena_get_module_property: {
    type: "object" as const,
    properties: {
      caption: { type: "string" as const, description: "Module caption" },
      property: { type: "string" as const, description: "Property name" },
    },
    required: ["caption", "property"],
  },

  arena_list_module_properties: {
    type: "object" as const,
    properties: {
      caption: { type: "string" as const, description: "Module caption" },
    },
    required: ["caption"],
  },

  arena_add_connection: {
    type: "object" as const,
    properties: {
      fromCaption: { type: "string" as const, description: "Source module caption" },
      toCaption: { type: "string" as const, description: "Target module caption" },
    },
    required: ["fromCaption", "toCaption"],
  },

  arena_run_model: {
    type: "object" as const,
    properties: {
      batchMode: { type: "boolean" as const, description: "Run in batch mode (no UI)", default: true },
      quietMode: { type: "boolean" as const, description: "Suppress dialogs", default: true },
    },
  },

  arena_save_model: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "Save path (default: Arena documents folder)" },
    },
  },

  arena_get_variable: {
    type: "object" as const,
    properties: { name: { type: "string" as const } },
    required: ["name"],
  },

  arena_set_variable: {
    type: "object" as const,
    properties: { name: { type: "string" as const }, value: { type: "number" as const } },
    required: ["name", "value"],
  },

  arena_list_variables: {
    type: "object" as const,
    properties: {},
  },

  arena_list_modules: {
    type: "object" as const,
    properties: {},
  },

  arena_export_results: {
    type: "object" as const,
    properties: { format: { type: "string" as const, description: "txt, csv, xls", default: "txt" } },
  },

  arena_get_queue_length: {
    type: "object" as const,
    properties: { queueName: { type: "string" as const } },
    required: ["queueName"],
  },

  arena_get_resource_state: {
    type: "object" as const,
    properties: { resourceName: { type: "string" as const } },
    required: ["resourceName"],
  },

  arena_get_model_info: {
    type: "object" as const,
    properties: {},
  },

  arena_explore_com: {
    type: "object" as const,
    properties: {},
  },

  // --- Filesystem tools ---
  file_list: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "Directory path relative to workspace" },
      pattern: { type: "string" as const, description: "Glob pattern filter (e.g. '*.ts')" },
    },
    required: ["path"],
  },

  file_read: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "File path relative to workspace" },
      maxBytes: { type: "number" as const, description: "Maximum bytes to read", default: 20000 },
    },
    required: ["path"],
  },

  file_patch: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "File path relative to workspace" },
      patches: {
        type: "array" as const,
        items: {
          type: "object" as const,
          properties: {
            old: { type: "string" as const },
            new: { type: "string" as const },
          },
          required: ["old", "new"],
        },
        description: "Array of old->new replacements",
      },
      createBackup: { type: "boolean" as const, description: "Create backup before patching", default: true },
      dryRun: { type: "boolean" as const, description: "Simulate without writing", default: false },
    },
    required: ["path", "patches"],
  },

  file_write: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "File path relative to workspace" },
      content: { type: "string" as const, description: "File content" },
      createBackup: { type: "boolean" as const, description: "Create backup before overwriting", default: true },
    },
    required: ["path", "content"],
  },

  file_diff: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "File path relative to workspace" },
      newContent: { type: "string" as const, description: "Proposed new content to diff against" },
    },
    required: ["path", "newContent"],
  },

  file_backup: {
    type: "object" as const,
    properties: {
      path: { type: "string" as const, description: "File path to back up" },
    },
    required: ["path"],
  },

  file_restore: {
    type: "object" as const,
    properties: {
      backupId: { type: "string" as const, description: "Backup ID to restore (use file_backup_list to find)" },
    },
    required: ["backupId"],
  },

  file_backup_list: {
    type: "object" as const,
    properties: {},
  },
};
