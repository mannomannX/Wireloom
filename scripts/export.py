#!/usr/bin/env python3
"""
Wireloom Project Export Script
Exports all project files and folders into a single structured .txt file.
Excludes: .claude, dist, .git, node_modules, and the output file itself.
"""

from datetime import datetime, timezone
from pathlib import Path
import sys

DEFAULT_EXCLUDES = {
    ".claude",
    "dist",
    ".git",
    "node_modules",
}

BINARY_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".ico", ".webp",
    ".pdf", ".zip", ".tar", ".gz", ".7z",
    ".woff", ".woff2", ".ttf", ".eot",
    ".exe", ".bin", ".dll", ".so", ".dylib",
}


def is_binary_file(file_path: Path) -> bool:
    """Checks if a file is binary by extension or null-byte scanning."""
    if file_path.suffix.lower() in BINARY_EXTENSIONS:
        return True
    try:
        with open(file_path, "rb") as f:
            chunk = f.read(1024)
            return b"\x00" in chunk
    except Exception:
        return True


def collect_files(root_dir: Path, output_file: Path, excludes: set[str]) -> list[Path]:
    """Recursively collects relative paths of all included files."""
    collected: list[Path] = []
    resolved_output = output_file.resolve()

    for path in sorted(root_dir.rglob("*")):
        # Check if any parent or self is in excludes
        rel_parts = path.relative_to(root_dir).parts
        if any(part in excludes for part in rel_parts):
            continue

        if path.resolve() == resolved_output:
            continue

        if path.is_file():
            collected.append(path.relative_to(root_dir))

    return collected


def generate_tree(file_paths: list[Path]) -> str:
    """Generates an ASCII hierarchy tree from a list of relative file paths."""
    tree: dict = {}
    for path in file_paths:
        curr = tree
        for part in path.parts:
            curr = curr.setdefault(part, {})

    def format_node(node: dict, prefix: str = "") -> list[str]:
        lines = []
        keys = sorted(
            node.keys(),
            key=lambda k: (len(node[k]) == 0, k.lower()),
        )
        for i, key in enumerate(keys):
            is_last = i == len(keys) - 1
            connector = "└── " if is_last else "├── "
            child_prefix = "    " if is_last else "│   "
            is_dir = len(node[key]) > 0

            lines.append(f"{prefix}{connector}{key}{'/' if is_dir else ''}")
            if is_dir:
                lines.extend(format_node(node[key], prefix + child_prefix))
        return lines

    return "\n".join(format_node(tree))


def export_project(output_path: str = "project_export.txt") -> None:
    """Main export routine."""
    project_root = Path(__file__).resolve().parent.parent
    out_file = project_root / output_path
    separator = "=" * 80
    sub_separator = "-" * 80

    print(f"Scanning project at: {project_root}")
    print(f"Excluding directories: {', '.join(sorted(DEFAULT_EXCLUDES))}")

    files = collect_files(project_root, out_file, DEFAULT_EXCLUDES)
    print(f"Found {len(files)} included files.")

    with open(out_file, "w", encoding="utf-8", newline="\n") as out:
        # Header
        out.write(f"{separator}\n")
        out.write("PROJECT EXPORT: Wireloom\n")
        out.write(f"Generated at: {datetime.now(timezone.utc).isoformat()}\n")
        out.write(f"Root directory: {project_root}\n")
        out.write(f"Excluded patterns: {', '.join(sorted(DEFAULT_EXCLUDES))}\n")
        out.write(f"Total included files: {len(files)}\n")
        out.write(f"{separator}\n\n")

        # Directory structure overview
        out.write("DIRECTORY STRUCTURE OVERVIEW:\n")
        out.write(f"{sub_separator}\n")
        out.write(generate_tree(files))
        out.write("\n\n")

        # File contents
        out.write(f"{separator}\n")
        out.write("FILE CONTENTS\n")
        out.write(f"{separator}\n\n")

        for rel_path in files:
            full_path = project_root / rel_path
            size = full_path.stat().st_size

            out.write(f"{separator}\n")
            out.write(f"FILE: {rel_path.as_posix()} ({size} bytes)\n")
            out.write(f"{separator}\n")

            if is_binary_file(full_path):
                out.write(f"[Binary file skipped: {size} bytes]\n\n")
            else:
                try:
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        content = f.read()
                    out.write(content)
                    if not content.endswith("\n"):
                        out.write("\n")
                    out.write("\n")
                except Exception as e:
                    out.write(f"[Error reading file: {e}]\n\n")

    out_size_kb = out_file.stat().st_size / 1024
    print(f"Successfully exported {len(files)} files.")
    print(f"Output written to: {out_file} ({out_size_kb:.2f} KB)")


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "project_export.txt"
    export_project(target)
