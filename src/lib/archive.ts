import { mkdir, mkdtemp, open, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import yauzl, { type Entry } from "yauzl";

const MAX_FILES = 3_000;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface ExtractedFile {
  relativePath: string;
  absolutePath: string;
  size: number;
}

export interface ExtractedArchive {
  directory: string;
  files: ExtractedFile[];
  skippedSymbolicLinks: string[];
}

export class ArchiveExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ArchiveExtractionError";
  }
}

function isSymbolicLink(entry: Entry): boolean {
  const unixMode = (entry.externalFileAttributes >>> 16) & 0xffff;
  return (unixMode & 0xf000) === 0xa000;
}

function getSafeRelativePath(fileName: string): string {
  const normalizedName = fileName.replace(/\\/g, "/");

  if (
    !normalizedName ||
    normalizedName.startsWith("/") ||
    /^[A-Za-z]:\//.test(normalizedName)
  ) {
    throw new ArchiveExtractionError("Archive contains an unsafe file path.");
  }

  const parts = normalizedName.split("/");

  if (parts.some((part) => part === ".." || part === "" || part === ".")) {
    throw new ArchiveExtractionError("Archive contains a path traversal entry.");
  }

  return parts.join(path.sep);
}

function isDirectory(entry: Entry): boolean {
  return entry.fileName.endsWith("/") || (entry.externalFileAttributes & 0x10) !== 0;
}

function getZipFile(zipFile: yauzl.ZipFile, entry: Entry): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    zipFile.openReadStream(entry, (error, stream) => {
      if (error || !stream) {
        reject(error ?? new ArchiveExtractionError("Unable to read archive entry."));
        return;
      }

      const chunks: Buffer[] = [];
      let totalSize = 0;

      stream.on("data", (chunk: Buffer) => {
        totalSize += chunk.length;

        if (totalSize > MAX_FILE_SIZE) {
          stream.destroy(
            new ArchiveExtractionError("Archive contains a file over the 5 MB limit."),
          );
          return;
        }

        chunks.push(chunk);
      });
      stream.once("error", reject);
      stream.once("end", () => resolve(Buffer.concat(chunks, totalSize)));
    });
  });
}

export async function extractZipArchive(buffer: Buffer): Promise<ExtractedArchive> {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "maprepo-"));

  try {
    const files: ExtractedFile[] = [];
    const skippedSymbolicLinks: string[] = [];
    const seenPaths = new Set<string>();
    let totalSize = 0;

    const zipFile = await yauzl.fromBufferPromise(buffer, {
      lazyEntries: true,
      validateEntrySizes: true,
      strictFileNames: true,
    });

    try {
      for await (const entry of zipFile.eachEntry()) {
        if (isSymbolicLink(entry)) {
          try {
            skippedSymbolicLinks.push(getSafeRelativePath(entry.fileName));
          } catch {
            skippedSymbolicLinks.push(entry.fileName);
          }
          continue;
        }

        if (isDirectory(entry)) {
          continue;
        }

        if (files.length >= MAX_FILES) {
          throw new ArchiveExtractionError("Archive contains more than 3,000 files.");
        }

        if (entry.uncompressedSize > MAX_FILE_SIZE) {
          throw new ArchiveExtractionError("Archive contains a file over the 5 MB limit.");
        }

        const relativePath = getSafeRelativePath(entry.fileName);

        if (seenPaths.has(relativePath)) {
          throw new ArchiveExtractionError("Archive contains duplicate file paths.");
        }

        const absolutePath = path.resolve(temporaryDirectory, relativePath);
        const root = path.resolve(temporaryDirectory) + path.sep;

        if (!absolutePath.startsWith(root)) {
          throw new ArchiveExtractionError("Archive contains an unsafe file path.");
        }

        const contents = await getZipFile(zipFile, entry);
        totalSize += contents.length;

        if (totalSize > MAX_TOTAL_SIZE) {
          throw new ArchiveExtractionError("Archive exceeds the 100 MB extracted size limit.");
        }

        const parentDirectory = path.dirname(absolutePath);
        await mkdir(parentDirectory, { recursive: true });
        const fileHandle = await open(absolutePath, "wx");

        try {
          await fileHandle.writeFile(contents);
        } finally {
          await fileHandle.close();
        }

        seenPaths.add(relativePath);
        files.push({ relativePath, absolutePath, size: contents.length });
      }
    } finally {
      zipFile.close();
    }

    return { directory: temporaryDirectory, files, skippedSymbolicLinks };
  } catch (error) {
    await rm(temporaryDirectory, { recursive: true, force: true });

    if (error instanceof ArchiveExtractionError) {
      throw error;
    }

    throw new ArchiveExtractionError("Unable to safely extract repository archive.");
  }
}
