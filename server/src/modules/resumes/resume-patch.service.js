import { normalizeResumeData } from "./resume-data.js";

const allowedRoots = [
  "/basics",
  "/skills",
  "/experience",
  "/education",
  "/projects",
  "/certifications",
  "/awards",
  "/customSections",
];
const blockedSegments = new Set(["__proto__", "constructor", "prototype"]);
const allowedOps = new Set(["add", "replace", "remove"]);

function patchError(message, code = "RESUME_PATCH_INVALID") {
  const error = new Error(message);
  error.statusCode = 422;
  error.code = code;
  return error;
}

function decodePointerSegment(segment) {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function pathSegments(path) {
  if (typeof path !== "string" || !path.startsWith("/")) {
    throw patchError("Patch path must be a JSON pointer.");
  }

  if (!allowedRoots.some((root) => path === root || path.startsWith(`${root}/`))) {
    throw patchError("Patch path is not allowed.");
  }

  const segments = path.slice(1).split("/").map(decodePointerSegment);

  if (segments.some((segment) => blockedSegments.has(segment))) {
    throw patchError("Patch path is unsafe.");
  }

  return segments;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function validateValue(value, segments = []) {
  const maxLength = segments.includes("bullets") ? 700 : 3000;

  if (typeof value === "string" && value.length > maxLength) {
    throw patchError("Patch value is too long.");
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => validateValue(item, [...segments, String(index)]));
  } else if (value && typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => validateValue(item, [...segments, key]));
  }
}

function getContainer(target, segments, op) {
  const parentSegments = segments.slice(0, -1);
  const key = segments.at(-1);
  let current = target;

  for (const segment of parentSegments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index) || index < 0 || index >= current.length) {
        throw patchError(`Patch ${op} parent does not exist.`);
      }
      current = current[index];
    } else if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      throw patchError(`Patch ${op} parent does not exist.`);
    }
  }

  if (!current || typeof current !== "object") {
    throw patchError(`Patch ${op} parent is not editable.`);
  }

  return { container: current, key };
}

function applyOperation(target, operation) {
  const { op, path } = operation;

  if (!allowedOps.has(op)) {
    throw patchError("Patch operation is not supported.");
  }

  const segments = pathSegments(path);
  const { container, key } = getContainer(target, segments, op);

  if (op !== "remove") {
    validateValue(operation.value, segments);
  }

  if (Array.isArray(container)) {
    const index = key === "-" ? container.length : Number(key);

    if (!Number.isInteger(index) || index < 0 || index > container.length || (op !== "add" && index >= container.length)) {
      throw patchError(`Patch ${op} array index is invalid.`);
    }

    if (op === "add") {
      container.splice(index, 0, operation.value);
    } else if (op === "replace") {
      container[index] = operation.value;
    } else {
      container.splice(index, 1);
    }

    return;
  }

  if (op === "add" || op === "replace") {
    if (op === "replace" && !(key in container)) {
      throw patchError("Patch replace target does not exist.");
    }
    container[key] = operation.value;
    return;
  }

  if (!(key in container)) {
    throw patchError("Patch remove target does not exist.");
  }

  delete container[key];
}

export function validatePatchOps(patchOps = []) {
  if (!Array.isArray(patchOps)) {
    throw patchError("Patch operations must be an array.");
  }

  if (patchOps.length > 20) {
    throw patchError("Too many patch operations.");
  }

  for (const operation of patchOps) {
    if (!operation || typeof operation !== "object") {
      throw patchError("Patch operation must be an object.");
    }
    pathSegments(operation.path);
    if (!allowedOps.has(operation.op)) {
      throw patchError("Patch operation is not supported.");
    }
    if (operation.op !== "remove") {
      validateValue(operation.value, pathSegments(operation.path));
    }
  }

  return patchOps;
}

export function applyResumePatchOps(resumeData, patchOps = []) {
  validatePatchOps(patchOps);
  const nextData = clone(normalizeResumeData(resumeData));

  for (const operation of patchOps) {
    applyOperation(nextData, operation);
  }

  return normalizeResumeData(nextData);
}
