"use client";

import { useCallback, useMemo } from "react";
import dagre from "@dagrejs/dagre";
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react";
import type {
  AnalyzedFile,
  DependencyEdge,
} from "@/lib/code-analyzer";

const NODE_WIDTH = 200;
const NODE_HEIGHT = 55;

interface CodebaseGraphProps {
  files: AnalyzedFile[];
  edges: DependencyEdge[];
}

interface FileNodeData extends Record<string, unknown> {
  label: string;
  extension: string;
}

function extensionFor(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? filePath;
  const extension = fileName.includes(".")
    ? `.${fileName.split(".").pop()?.toLowerCase()}`
    : "";

  return extension || "file";
}

function nodeClassFor(extension: string): string {
  if (extension === ".tsx" || extension === ".jsx") {
    return "codebase-node codebase-node-react";
  }

  if (extension === ".ts" || extension === ".js") {
    return "codebase-node codebase-node-script";
  }

  return "codebase-node";
}

function FileNode({ data }: NodeProps<Node<FileNodeData>>) {
  return (
    <div className={nodeClassFor(data.extension)}>
      <Handle type="target" position={Position.Top} id="target" />
      <span className="codebase-node-dot" />
      <span className="codebase-node-label" title={data.label}>
        {data.label}
      </span>
      <span className="codebase-node-extension">{data.extension}</span>
      <Handle type="source" position={Position.Bottom} id="source" />
    </div>
  );
}

const nodeTypes = { file: FileNode };

function getLayout(
  nodes: Node<FileNodeData>[],
  edges: Edge[],
): Node<FileNodeData>[] {
  const graph = new dagre.graphlib.Graph();

  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({
    rankdir: "LR",
    nodesep: 72,
    ranksep: 160,
    marginx: 36,
    marginy: 36,
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });
  edges.forEach((edge) => graph.setEdge(edge.source, edge.target));
  dagre.layout(graph);

  return nodes.map((node) => {
    const position = graph.node(node.id);

    return {
      ...node,
      position: {
        x: position.x - NODE_WIDTH / 2,
        y: position.y - NODE_HEIGHT / 2,
      },
    };
  });
}

function FitViewButton() {
  const { fitView } = useReactFlow();

  return (
    <button
      type="button"
      onClick={() => fitView({ duration: 350, padding: 0.12 })}
      className="absolute right-3 top-3 z-10 rounded-lg border border-white/10 bg-[#15151b]/90 px-3 py-2 text-xs font-medium text-zinc-300 shadow-lg backdrop-blur transition hover:border-violet-400/40 hover:text-white"
    >
      Fit view
    </button>
  );
}

export default function CodebaseGraph({
  files,
  edges,
}: CodebaseGraphProps) {
  const graphNodes = useMemo(() => {
    const nodes: Node<FileNodeData>[] = [];
    const seen = new Set<string>();

    files.forEach((file) => {
      if (seen.has(file.id)) {
        return;
      }

      seen.add(file.id);
      nodes.push({
        id: file.id,
        type: "file",
        position: { x: 0, y: 0 },
        data: {
          label: file.path,
          extension: extensionFor(file.path),
        },
      });
    });

    return nodes;
  }, [files]);

  const graphEdges = useMemo(() => {
    const nodeIds = new Set(graphNodes.map((node) => node.id));
    const seen = new Set<string>();
    const result: Edge[] = [];

    edges.forEach((edge) => {
      const id = `${edge.source}->${edge.target}`;

      if (
        seen.has(id) ||
        edge.source === edge.target ||
        !nodeIds.has(edge.source) ||
        !nodeIds.has(edge.target)
      ) {
        return;
      }

      seen.add(id);
      result.push({
        id,
        source: edge.source,
        target: edge.target,
        sourceHandle: "source",
        targetHandle: "target",
        type: "smoothstep",
        animated: false,
        style: {
          stroke: "#8b5cf6",
          strokeOpacity: 0.42,
          strokeWidth: 1.2,
        },
      });
    });

    return result;
  }, [edges, graphNodes]);

  const layoutNodes = useMemo(
    () => getLayout(graphNodes, graphEdges),
    [graphEdges, graphNodes],
  );
  const [nodes, , onNodesChange] = useNodesState(layoutNodes);
  const [flowEdges, , onEdgesChange] = useEdgesState(graphEdges);

  const handleInit = useCallback((instance: ReactFlowInstance<Node<FileNodeData>, Edge>) => {
    instance.fitView({ padding: 0.12 });
  }, []);

  if (graphNodes.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#0c0c10] px-6 text-center">
        <div>
          <p className="text-sm font-medium text-zinc-300">No graph data available</p>
          <p className="mt-2 text-xs text-zinc-600">
            Analyze a repository with supported source files to see its dependencies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="codebase-graph relative h-[520px] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#0c0c10] sm:h-[640px]">
      <ReactFlow
        nodes={nodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onInit={handleInit}
        fitView
        minZoom={0.2}
        maxZoom={2}
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#272333" gap={28} size={1} />
        <Controls
          showInteractive={false}
          className="!overflow-hidden !rounded-lg !border !border-white/10 !bg-[#15151b]/90 !shadow-lg [&>button]:!border-white/10 [&>button]:!bg-transparent [&>button]:!fill-zinc-400 [&>button:hover]:!bg-white/10"
        />
        <MiniMap
          nodeColor={(node) =>
            node.data?.extension === ".tsx" || node.data?.extension === ".jsx"
              ? "#8b5cf6"
              : "#3b82f6"
          }
          maskColor="rgba(9, 9, 11, 0.72)"
          className="!bottom-3 !right-3 !overflow-hidden !rounded-lg !border !border-white/10 !bg-[#15151b]/90"
        />
        <FitViewButton />
      </ReactFlow>
    </div>
  );
}
