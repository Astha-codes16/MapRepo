import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import {
  Node,
  Project,
  type SourceFile,
} from "ts-morph";

const ANALYZABLE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "out",
  "target",
]);
const MAX_FILES = 2_000;
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;

export interface AnalyzedExport {
  name: string;
  kind: "function" | "class" | "variable" | "interface";
}

export interface AnalyzedFile {
  id: string;
  path: string;
  imports: string[];
  exports: AnalyzedExport[];
}

export interface DependencyEdge {
  id: string;
  source: string;
  target: string;
  importPath: string;
}

export interface CodebaseAnalysis {
  rootDir: string;
  files: AnalyzedFile[];
  edges: DependencyEdge[];
  skippedFiles: string[];
  truncated: boolean;
}

interface SourceCandidate {
  absolutePath: string;
  relativePath: string;
  size: number;
}

async function collectSourceFiles(
  directory: string,
  rootDir: string,
  candidates: SourceCandidate[],
  skippedFiles: string[],
  state: { totalSize: number; truncated: boolean },
): Promise<void> {
  if (state.truncated) {
    return;
  }

  let entries;

  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    skippedFiles.push(toRelativePath(directory, rootDir));
    return;
  }

  for (const entry of entries) {
    if (state.truncated) {
      return;
    }

    if (entry.isSymbolicLink()) {
      skippedFiles.push(toRelativePath(path.join(directory, entry.name), rootDir));
      continue;
    }

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRECTORIES.has(entry.name.toLowerCase())) {
        await collectSourceFiles(
          absolutePath,
          rootDir,
          candidates,
          skippedFiles,
          state,
        );
      }
      continue;
    }

    const extension = path.extname(entry.name).toLowerCase();

    if (!entry.isFile() || !ANALYZABLE_EXTENSIONS.has(extension)) {
      continue;
    }

    if (candidates.length >= MAX_FILES) {
      state.truncated = true;
      return;
    }

    try {
      const fileStats = await stat(absolutePath);

      if (fileStats.size > MAX_FILE_SIZE) {
        skippedFiles.push(toRelativePath(absolutePath, rootDir));
        continue;
      }

      if (state.totalSize + fileStats.size > MAX_TOTAL_SIZE) {
        state.truncated = true;
        return;
      }

      state.totalSize += fileStats.size;
      candidates.push({
        absolutePath,
        relativePath: toRelativePath(absolutePath, rootDir),
        size: fileStats.size,
      });
    } catch {
      skippedFiles.push(toRelativePath(absolutePath, rootDir));
    }
  }
}

function toRelativePath(filePath: string, rootDir: string): string {
  return path.relative(rootDir, filePath).split(path.sep).join("/");
}

function isRelativeImport(moduleSpecifier: string): boolean {
  return moduleSpecifier === "." || moduleSpecifier === ".." ||
    moduleSpecifier.startsWith("./") ||
    moduleSpecifier.startsWith("../");
}

function getImportPaths(sourceFile: SourceFile): string[] {
  const imports = sourceFile
    .getImportDeclarations()
    .map((declaration) => declaration.getModuleSpecifierValue());
  const reExports = sourceFile
    .getExportDeclarations()
    .map((declaration) => declaration.getModuleSpecifierValue())
    .filter((specifier): specifier is string => Boolean(specifier));

  return Array.from(new Set([...imports, ...reExports]));
}

function resolveRelativeImport(
  sourcePath: string,
  moduleSpecifier: string,
  rootDir: string,
  knownFiles: Set<string>,
): string | null {
  if (!isRelativeImport(moduleSpecifier)) {
    return null;
  }

  const withoutQuery = moduleSpecifier.split(/[?#]/, 1)[0];
  const requestedPath = path.resolve(path.dirname(sourcePath), withoutQuery);
  const rootPrefix = rootDir.endsWith(path.sep) ? rootDir : `${rootDir}${path.sep}`;

  if (requestedPath !== rootDir && !requestedPath.startsWith(rootPrefix)) {
    return null;
  }

  const extension = path.extname(requestedPath).toLowerCase();
  const extensionlessPath = ANALYZABLE_EXTENSIONS.has(extension)
    ? requestedPath.slice(0, -extension.length)
    : requestedPath;
  const extensions = Array.from(ANALYZABLE_EXTENSIONS);
  const candidates = [
    requestedPath,
    ...extensions.map(
      (candidateExtension) => `${extensionlessPath}${candidateExtension}`,
    ),
    ...extensions.map(
      (candidateExtension) =>
        path.join(requestedPath, `index${candidateExtension}`),
    ),
  ];

  for (const candidate of candidates) {
    if (knownFiles.has(candidate)) {
      return candidate;
    }
  }

  return null;
}

function getExportKind(node: Node): AnalyzedExport["kind"] | null {
  if (Node.isFunctionDeclaration(node)) {
    return "function";
  }

  if (Node.isClassDeclaration(node)) {
    return "class";
  }

  if (Node.isInterfaceDeclaration(node)) {
    return "interface";
  }

  if (Node.isVariableDeclaration(node) || Node.isEnumDeclaration(node)) {
    return "variable";
  }

  return null;
}

function getExports(sourceFile: SourceFile): AnalyzedExport[] {
  const exports: AnalyzedExport[] = [];

  sourceFile.getExportedDeclarations().forEach((declarations, name) => {
    for (const declaration of declarations) {
      const kind = getExportKind(declaration);

      if (kind) {
        exports.push({ name, kind });
        break;
      }
    }
  });

  return exports;
}

export async function analyzeCodebase(
  rootDir: string,
): Promise<CodebaseAnalysis> {
  const resolvedRootDir = path.resolve(rootDir);
  const candidates: SourceCandidate[] = [];
  const skippedFiles: string[] = [];
  const state = { totalSize: 0, truncated: false };

  await collectSourceFiles(
    resolvedRootDir,
    resolvedRootDir,
    candidates,
    skippedFiles,
    state,
  );

  const project = new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: true,
      checkJs: false,
      noEmit: true,
    },
  });
  const sourceFiles = new Map<string, SourceFile>();

  for (const candidate of candidates) {
    try {
      const sourceFile = project.addSourceFileAtPath(candidate.absolutePath);
      sourceFiles.set(candidate.absolutePath, sourceFile);
    } catch {
      skippedFiles.push(candidate.relativePath);
    }
  }

  const knownFiles = new Set(sourceFiles.keys());
  const files: AnalyzedFile[] = [];
  const edges: DependencyEdge[] = [];

  sourceFiles.forEach((sourceFile, absolutePath) => {
    const relativePath = toRelativePath(absolutePath, resolvedRootDir);
    const importPaths = getImportPaths(sourceFile);

    files.push({
      id: relativePath,
      path: relativePath,
      imports: importPaths,
      exports: getExports(sourceFile),
    });

    for (const importPath of importPaths) {
      const targetPath = resolveRelativeImport(
        absolutePath,
        importPath,
        resolvedRootDir,
        knownFiles,
      );

      if (!targetPath) {
        continue;
      }

      const target = toRelativePath(targetPath, resolvedRootDir);
      edges.push({
        id: `${relativePath}->${target}`,
        source: relativePath,
        target,
        importPath,
      });
    }
  });

  return {
    rootDir: resolvedRootDir,
    files,
    edges,
    skippedFiles: Array.from(new Set(skippedFiles)),
    truncated: state.truncated,
  };
}
