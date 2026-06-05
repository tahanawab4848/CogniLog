import React, { useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeProps
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useApi } from '../hooks/useApi';
import { 
  Folder, 
  Lightbulb, 
  Gavel, 
  Trophy, 
  CheckSquare, 
  HelpCircle,
  Network
} from 'lucide-react';

// --- Custom Nodes ---

const ProjectNode: React.FC<NodeProps> = ({ data }) => (
  <div className="custom-flow-node bg-slate-900 border-l-4 border-l-primary-500">
    <div className="flex items-center gap-2 mb-1">
      <Folder size={14} className="text-primary-400 shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Project Root</span>
    </div>
    <h4 className="text-xs font-bold text-white leading-tight">{data.label}</h4>
    <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{data.description}</p>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const IdeaNode: React.FC<NodeProps> = ({ data }) => (
  <div className="custom-flow-node bg-slate-900/90 border-l-4 border-l-yellow-400">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 mb-1">
      <Lightbulb size={14} className="text-yellow-400 shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Concept Idea</span>
    </div>
    <h4 className="text-xs font-bold text-white leading-tight">{data.label}</h4>
    <p className="text-[9px] text-slate-400 mt-1 line-clamp-2">{data.description}</p>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const DecisionNode: React.FC<NodeProps> = ({ data }) => (
  <div className="custom-flow-node bg-slate-900/90 border-l-4 border-l-accent-purple">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 mb-1">
      <Gavel size={14} className="text-accent-purple shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Decision</span>
    </div>
    <h4 className="text-xs font-bold text-white leading-tight">{data.label}</h4>
    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-darkBorder text-[8px] text-slate-400">
      <span className="text-slate-500">{data.date || 'unknown'}</span>
      <span className={`px-1.5 py-0.5 rounded font-semibold ${
        data.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
      }`}>{data.status}</span>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const EventNode: React.FC<NodeProps> = ({ data }) => (
  <div className="custom-flow-node bg-slate-900/90 border-l-4 border-l-primary-400">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 mb-1">
      <Trophy size={14} className="text-primary-400 shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Timeline Event</span>
    </div>
    <h4 className="text-xs font-bold text-white leading-tight">{data.label}</h4>
    <span className="text-[8px] text-slate-500 block mt-1.5">{data.date}</span>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

const TaskNode: React.FC<NodeProps> = ({ data }) => (
  <div className="custom-flow-node bg-slate-900/90 border-l-4 border-l-accent-green">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 mb-1">
      <CheckSquare size={14} className="text-accent-green shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Action Task</span>
    </div>
    <h4 className="text-xs font-bold text-white leading-tight">{data.label}</h4>
    <p className="text-[8px] text-slate-400 mt-1 font-semibold">Assignee: {data.assignee || 'Unassigned'}</p>
  </div>
);

const QuestionNode: React.FC<NodeProps> = ({ data }) => (
  <div className="custom-flow-node bg-slate-900/90 border-l-4 border-l-accent-rose">
    <Handle type="target" position={Position.Top} />
    <div className="flex items-center gap-2 mb-1">
      <HelpCircle size={14} className="text-accent-rose shrink-0" />
      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Open Question</span>
    </div>
    <h4 className="text-xs font-bold text-white leading-tight">{data.label}</h4>
    <span className="text-[8px] text-accent-rose block mt-1.5 uppercase font-bold tracking-wider">{data.status || 'open'}</span>
  </div>
);

const nodeTypes = {
  projectNode: ProjectNode,
  ideaNode: IdeaNode,
  decisionNode: DecisionNode,
  eventNode: EventNode,
  taskNode: TaskNode,
  questionNode: QuestionNode
};

export const GraphView: React.FC = () => {
  const api = useApi();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchGraph = async () => {
      setLoading(true);
      try {
        const res = await api.getProjectGraph(0);
        setNodes(res.nodes || []);
        setEdges(res.edges || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 h-screen flex items-center justify-center bg-darkBg text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin" />
          <span className="text-xs tracking-wider font-semibold">Traversing knowledge matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 h-screen w-full flex flex-col bg-darkBg">
      {/* Header overlay */}
      <div className="p-6 border-b border-darkBorder bg-[#080b11]/80 backdrop-blur-md relative z-10 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Knowledge Graph Evolution
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Global knowledge graph — all concepts, decisions, and relationships across your conversations.
        </p>
      </div>

      {/* React Flow Board */}
      <div className="flex-1 relative">
        {nodes.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-8 bg-darkBg z-20">
            <div className="glass-panel p-8 rounded-xl max-w-sm">
              <Network className="text-slate-500 mx-auto mb-4" size={32} />
              <h3 className="text-sm font-bold text-white mb-2">Graph Empty</h3>
              <p className="text-xs text-slate-400">No entities have been extracted to populate the graph matrix. Run ingestion imports first.</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            className="w-full h-full"
          >
            <Background color="#1e293b" gap={20} size={1} />
            <Controls className="glass-panel text-white fill-white" />
            <MiniMap 
              nodeColor={() => "#1e222b"}
              maskColor="rgba(8, 11, 17, 0.7)"
              className="glass-panel border-darkBorder hidden md:block"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};
