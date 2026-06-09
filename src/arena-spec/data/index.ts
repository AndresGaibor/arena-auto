export type DataStep = {
  type: "createEntity" | "createResource" | "createQueue" | "createVariable";
  params: Record<string, unknown>;
};
